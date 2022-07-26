import {readFile, writeFile} from 'fs/promises';

import {signatureGet, signatureSet} from 'portable-executable-signature';
import {NtExecutable, NtExecutableResource, Resource, Data} from 'resedit';

import {bufferToArrayBuffer, launcher} from '../util';

export interface IPeResourceReplace {
	//
	/**
	 * Replace icons if not null.
	 *
	 * @default null
	 */
	iconData?: Readonly<Buffer> | null;

	/**
	 * Replace version strings if not null.
	 *
	 * @default null
	 */
	versionStrings?: Readonly<{[key: string]: string}> | null;

	/**
	 * If true remove signature if present.
	 *
	 * @default false
	 */
	removeSignature?: boolean | null;
}

/**
 * Parse PE version string to integers (MS then LS bits) or null.
 *
 * @param version Version string.
 * @returns Version integers ([MS, LS]) or null.
 */
export function peVersionInts(version: string): [number, number] | null {
	const parts = version.split(/[.,]/);
	const numbers = [];
	for (const part of parts) {
		const n = /^\d+$/.test(part) ? +part : -1;
		if (n < 0 || n > 0xffff) {
			return null;
		}
		numbers.push(n);
	}
	return numbers.length
		? [
				// eslint-disable-next-line no-bitwise
				(((numbers[0] || 0) << 16) | (numbers[1] || 0)) >>> 0,
				// eslint-disable-next-line no-bitwise
				(((numbers[2] || 0) << 16) | (numbers[3] || 0)) >>> 0
		  ]
		: null;
}

/**
 * Replace resources in Windows PE file.
 *
 * @param path File path.
 * @param options Replacement options.
 */
export async function peResourceReplace(
	path: string,
	options: Readonly<IPeResourceReplace>
) {
	const {iconData, versionStrings, removeSignature} = options;

	// Read EXE file and remove signature if present.
	const exeOriginal = await readFile(path);
	const signedData = removeSignature ? null : signatureGet(exeOriginal);
	let exeData = signatureSet(exeOriginal, null, true, true);

	// Parse resources.
	const exe = NtExecutable.from(exeData);
	const res = NtExecutableResource.from(exe);

	// Replace all the icons in all icon groups.
	if (iconData) {
		const ico = Data.IconFile.from(bufferToArrayBuffer(iconData));
		for (const iconGroup of Resource.IconGroupEntry.fromEntries(
			res.entries
		)) {
			Resource.IconGroupEntry.replaceIconsForResource(
				res.entries,
				iconGroup.id,
				iconGroup.lang,
				ico.icons.map(icon => icon.data)
			);
		}
	}

	// Update strings if present for all the languages.
	if (versionStrings) {
		for (const versionInfo of Resource.VersionInfo.fromEntries(
			res.entries
		)) {
			// Get all the languages, not just available languages.
			const languages = versionInfo.getAllLanguagesForStringValues();
			for (const language of languages) {
				versionInfo.setStringValues(language, versionStrings);
			}

			// Update integer values from parsed strings if possible.
			const {FileVersion, ProductVersion} = versionStrings;
			if (FileVersion) {
				const uints = peVersionInts(FileVersion);
				if (uints) {
					const [ms, ls] = uints;
					versionInfo.fixedInfo.fileVersionMS = ms;
					versionInfo.fixedInfo.fileVersionLS = ls;
				}
			}
			if (ProductVersion) {
				const uints = peVersionInts(ProductVersion);
				if (uints) {
					const [ms, ls] = uints;
					versionInfo.fixedInfo.productVersionMS = ms;
					versionInfo.fixedInfo.productVersionLS = ls;
				}
			}

			versionInfo.outputToResourceEntries(res.entries);
		}
	}

	// Update resources.
	res.outputResource(exe);
	exeData = exe.generate();

	// Add back signature if not removing.
	if (signedData) {
		exeData = signatureSet(exeData, signedData, true, true);
	}

	// Write updated EXE file.
	await writeFile(path, Buffer.from(exeData));
}

/**
 * Get Windows launcher for the specified type.
 *
 * @param type Executable type.
 * @param resources File to optionally copy resources from.
 * @returns Launcher data.
 */
export async function windowsLauncher(
	type: 'i686' | 'x86_64',
	resources: string | null = null
) {
	let data;
	switch (type) {
		case 'i686': {
			data = await launcher('windows-i686');
			break;
		}
		case 'x86_64': {
			data = await launcher('windows-x86_64');
			break;
		}
		default: {
			throw new Error(`Invalid type: ${type as string}`);
		}
	}

	// Check if copying resources.
	if (!resources) {
		return data;
	}

	// Remove signature if present.
	const signedData = signatureGet(data);
	let exeData = signatureSet(data, null, true, true);

	// Read resources from file.
	const res = NtExecutableResource.from(
		NtExecutable.from(await readFile(resources), {
			ignoreCert: true
		})
	);

	// Find the first icon group for each language.
	const resIconGroups = new Map<string | number, Resource.IconGroupEntry>();
	for (const iconGroup of Resource.IconGroupEntry.fromEntries(res.entries)) {
		const known = resIconGroups.get(iconGroup.lang) || null;
		if (!known || iconGroup.id < known.id) {
			resIconGroups.set(iconGroup.lang, iconGroup);
		}
	}

	// List the groups and icons to be kept.
	const iconGroups = new Set();
	const iconDatas = new Set();
	for (const [, group] of resIconGroups) {
		iconGroups.add(group.id);
		for (const icon of group.icons) {
			iconDatas.add(icon.iconID);
		}
	}

	// Filter out the resources to keep.
	const typeVersionInfo = 16;
	const typeIcon = 3;
	const typeIconGroup = 14;
	res.entries = res.entries.filter(
		entry =>
			entry.type === typeVersionInfo ||
			(entry.type === typeIcon && iconDatas.has(entry.id)) ||
			(entry.type === typeIconGroup && iconGroups.has(entry.id))
	);

	// Apply resources to launcher.
	const exe = NtExecutable.from(exeData);
	res.outputResource(exe);
	exeData = exe.generate();

	// Add back signature if one present.
	if (signedData) {
		exeData = signatureSet(exeData, signedData, true, true);
	}

	return Buffer.from(exeData);
}

interface IPatcherPatch {
	//
	/**
	 * The bytes to find.
	 */
	find: (number | null)[];

	/**
	 * The bytes replaced with.
	 */
	replace: (number | null)[];
}

/**
 * Converts a hex string into a series of byte values, with unknowns being null.
 *
 * @param str Hex string.
 * @returns Bytes and null values.
 */
function patchHexToBytes(str: string) {
	return (str.replace(/[\s\r\n]/g, '').match(/.{1,2}/g) || []).map(s => {
		if (s.length !== 2) {
			throw new Error('Internal error');
		}
		return /[0-9A-F]{2}/i.test(s) ? parseInt(s, 16) : null;
	});
}

// A list of patch candidates, made to be partially position independant.
// Basically these patches just increase the temporary buffer sizes.
// Enough to provide amply room for anything that should be in the registry.
// Sizes 0x10000 for ASCII, and 0x20000 for WCHAR.
// Not enough room to calculate the correct size, and use it directly.
const patchShockwave3dInstalledDisplayDriversSizePatches: IPatcherPatch[] = [
	// director-8.5.0 - director-11.0.0-hotfix-1:
	{
		find: patchHexToBytes(
			[
				// call    DWORD PTR ds:-- -- -- --
				'FF 15 -- -- -- --',

				// Change:
				// mov     esi, 0x104
				'BE 04 01 00 00',

				// push    esi
				'56',
				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		),
		replace: patchHexToBytes(
			[
				// call    DWORD PTR ds:-- -- -- --
				'FF 15 -- -- -- --',

				// Changed:
				// mov     esi, 0x10000
				'BE 00 00 01 00',

				// push    esi
				'56',
				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		)
	},
	// director-11.0.0-hotfix-3 - director-11.5.0:
	{
		find: patchHexToBytes(
			[
				// call    DWORD PTR ds:-- -- -- --
				'FF 15 -- -- -- --',

				// Change:
				// mov     edi, 0x104
				'BF 04 01 00 00',

				// push    edi
				'57',
				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		),
		replace: patchHexToBytes(
			[
				// call    DWORD PTR ds:-- -- -- --
				'FF 15 -- -- -- --',

				// Changed:
				// mov     edi, 0x10000
				'BF 00 00 01 00',

				// push    edi
				'57',
				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		)
	},
	// director-11.5.8 - director-11.5.9:
	{
		find: patchHexToBytes(
			[
				// push    -- -- -- --
				'68 -- -- -- --',
				// push    edi
				'57',
				// call    esi
				'FF D6',

				// Change:
				// push    0x208
				'68 08 02 00 00',

				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		),
		replace: patchHexToBytes(
			[
				// push    -- -- -- --
				'68 -- -- -- --',
				// push    edi
				'57',
				// call    esi
				'FF D6',

				// Changed:
				// push    0x20000
				'68 00 00 02 00',

				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		)
	},
	// director-12.0.0 - director-12.0.2:
	{
		find: patchHexToBytes(
			[
				// push    -- -- -- --
				'68 -- -- -- --',
				// push    ebx
				'53',
				// call    edi
				'FF D7',

				// Change:
				// push    0x208
				'68 08 02 00 00',

				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		),
		replace: patchHexToBytes(
			[
				// push    -- -- -- --
				'68 -- -- -- --',
				// push    ebx
				'53',
				// call    edi
				'FF D7',

				// Changed:
				// push    0x20000
				'68 00 00 02 00',

				// call    -- -- -- --
				'E8 -- -- -- --'
			].join(' ')
		)
	}
];

/**
 * Patch data buffer once.
 *
 * @param data Data buffer.
 * @param candidates Patch candidates.
 * @param name Patch name.
 */
function patchDataOnce(
	data: Buffer,
	candidates: Readonly<IPatcherPatch[]>,
	name: string
) {
	// Search the buffer for patch candidates.
	let foundOffset = -1;
	let foundPatch: (number | null)[] = [];
	for (const patch of candidates) {
		const {find, replace} = patch;
		if (replace.length !== find.length) {
			throw new Error('Internal error');
		}

		const end = data.length - find.length;
		for (let i = 0; i < end; i++) {
			let found = true;
			for (let j = 0; j < find.length; j++) {
				const b = find[j];
				if (b !== null && data[i + j] !== b) {
					found = false;
					break;
				}
			}
			if (!found) {
				continue;
			}
			if (foundOffset !== -1) {
				throw new Error(`Multiple patch candidates found for: ${name}`);
			}

			// Remember patch to apply.
			foundOffset = i;
			foundPatch = replace;
		}
	}
	if (foundOffset === -1) {
		throw new Error(`No patch candidates found for: ${name}`);
	}

	// Apply the patch to the buffer, and write to file.
	for (let i = 0; i < foundPatch.length; i++) {
		const b = foundPatch[i];
		if (b !== null) {
			data[foundOffset + i] = b;
		}
	}
}

/**
 * Patch a file once.
 *
 * @param file File path.
 * @param candidates Patch candidates.
 * @param name Patch name.
 */
async function patchFileOnce(
	file: string,
	candidates: Readonly<IPatcherPatch[]>,
	name: string
) {
	const data = await readFile(file);
	patchDataOnce(data, candidates, name);
	await writeFile(file, data);
}

/**
 * Patch Windows Shockwave 3D InstalledDisplayDrivers size.
 *
 * @param file File path.
 */
export async function windowsPatchShockwave3dInstalledDisplayDriversSize(
	file: string
) {
	await patchFileOnce(
		file,
		patchShockwave3dInstalledDisplayDriversSizePatches,
		'Windows Shockwave 3D InstalledDisplayDrivers Size'
	);
}
