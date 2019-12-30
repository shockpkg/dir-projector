import fse from 'fs-extra';

interface IPatcherPatch {

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

/* eslint-disable no-multi-spaces */
/* eslint-disable line-comment-position */
/* eslint-disable no-inline-comments */
// A list of patch candidates, made to be partially position independant.
// Basically these patches just increase the temporary buffer sizes.
// Enough to provide amply room for anything that should be in the registry.
// Sizes 0x10000 for ASCII, and 0x20000 for WCHAR.
// Not enough room to calculate the correct size, and use it directly.
const patchWindowsS3dInstalledDisplayDriversSizePatches: IPatcherPatch[] = [
	// director-8.5.0 - director-11.0.0-hotfix-1:
	{
		find: patchHexToBytes([
			'FF 15 -- -- -- --', // call    DWORD PTR ds:-- -- -- --
			'BE 04 01 00 00',    // mov     esi, 0x104
			'56',                // push    esi
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' ')),
		replace: patchHexToBytes([
			'FF 15 -- -- -- --', // call    DWORD PTR ds:-- -- -- --
			// Change:
			'BE 00 00 01 00',    // mov     esi, 0x10000
			'56',                // push    esi
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' '))
	},
	// director-11.0.0-hotfix-3 - director-11.5.0:
	{
		find: patchHexToBytes([
			'FF 15 -- -- -- --', // call    DWORD PTR ds:-- -- -- --
			'BF 04 01 00 00',    // mov     edi, 0x104
			'57',                // push    edi
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' ')),
		replace: patchHexToBytes([
			'FF 15 -- -- -- --', // call    DWORD PTR ds:-- -- -- --
			// Change:
			'BF 00 00 01 00',    // mov     edi, 0x10000
			'57',                // push    edi
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' '))
	},
	// director-11.5.8 - director-11.5.9:
	{
		find: patchHexToBytes([
			'68 -- -- -- --',    // push    -- -- -- --
			'57',                // push    edi
			'FF D6',             // call    esi
			'68 08 02 00 00',    // push    0x208
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' ')),
		replace: patchHexToBytes([
			'68 -- -- -- --',    // push    -- -- -- --
			'57',                // push    edi
			'FF D6',             // call    esi
			// Change:
			'68 00 00 02 00',    // push    0x20000
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' '))
	},
	// director-12.0.0:
	{
		find: patchHexToBytes([
			'68 -- -- -- --',    // push    -- -- -- --
			'53',                // push    ebx
			'FF D7',             // call    edi
			'68 08 02 00 00',    // push    0x208
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' ')),
		replace: patchHexToBytes([
			'68 -- -- -- --',    // push    -- -- -- --
			'53',                // push    ebx
			'FF D7',             // call    edi
			// Change:
			'68 00 00 02 00',    // push    0x20000
			'E8 -- -- -- --'     // call    -- -- -- --
		].join(' '))
	}
];
/* eslint-enable no-multi-spaces */
/* eslint-enable line-comment-position */
/* eslint-enable no-inline-comments */

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
				throw new Error(
					`Multiple patch candidates found for: ${name}`
				);
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
	const data = await fse.readFile(file);
	patchDataOnce(data, candidates, name);
	await fse.writeFile(file, data);
}

/**
 * Patch Windows Shockwave 3D InstalledDisplayDrivers size.
 *
 * @param file File path.
 */
export async function patchWindowsS3dInstalledDisplayDriversSize(
	file: string
) {
	await patchFileOnce(
		file,
		patchWindowsS3dInstalledDisplayDriversSizePatches,
		'Windows Shockwave 3D InstalledDisplayDrivers Size'
	);
}
