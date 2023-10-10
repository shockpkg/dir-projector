import {readFile} from 'node:fs/promises';

import {Plist, Value, ValueDict, ValueString} from '@shockpkg/plist-dom';

import {launcher} from '../util';

const FAT_MAGIC = 0xcafebabe;
const MH_MAGIC = 0xfeedface;
const MH_CIGAM = 0xcefaedfe;
const MH_MAGIC_64 = 0xfeedfacf;
const MH_CIGAM_64 = 0xcffaedfe;

const CPU_TYPE_POWERPC = 0x00000012;
const CPU_TYPE_I386 = 0x00000007;

export interface IMachoType {
	//
	/**
	 * CPU type.
	 */
	cpuType: number;

	/**
	 * CPU subtype.
	 */
	cpuSubtype: number;
}

/**
 * Parse plist data.
 * Currently only supports XML plist.
 *
 * @param data Plist XML.
 * @returns Plist document.
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function plistParse(data: string) {
	const plist = new Plist();
	plist.fromXml(data);
	return plist;
}

/**
 * Read plist file.
 * Currently only supports XML plist.
 *
 * @param path Plist file.
 * @returns Plist document.
 */
export async function plistRead(path: string) {
	return plistParse(await readFile(path, 'utf8'));
}

/**
 * Get Info.plist dictionary or throw.
 *
 * @param plist Plist document.
 * @returns Dictionary object.
 */
export function infoPlistDict(plist: Plist) {
	return plist.getValue().castAs(ValueDict);
}

/**
 * Get Info.plist dictionary value or throw.
 *
 * @param plist Plist document.
 * @param key Dictionary key.
 * @returns Value object.
 */
export function infoPlistDictGetValue(plist: Plist, key: string) {
	return infoPlistDict(plist).getValue(key);
}

/**
 * Set Info.plist dictionary value or throw.
 *
 * @param plist Plist document.
 * @param key Dictionary key.
 * @param value Value object.
 */
export function infoPlistDictSet(
	plist: Plist,
	key: string,
	value: Value | null
) {
	const dict = infoPlistDict(plist);
	if (value) {
		dict.set(key, value);
	} else {
		dict.delete(key);
	}
}

/**
 * Get Info.plist bundle executable.
 *
 * @param plist Plist document.
 * @returns Executable name.
 */
export function infoPlistBundleExecutableGet(plist: Plist) {
	return infoPlistDictGetValue(plist, 'CFBundleExecutable').castAs(
		ValueString
	).value;
}

/**
 * Set Info.plist bundle executable.
 *
 * @param plist Plist document.
 * @param value Executable name.
 */
export function infoPlistBundleExecutableSet(
	plist: Plist,
	value: string | null
) {
	const v = value === null ? null : new ValueString(value);
	infoPlistDictSet(plist, 'CFBundleExecutable', v);
}

/**
 * Get Info.plist bundle icon.
 *
 * @param plist Plist document.
 * @returns Icon name.
 */
export function infoPlistBundleIconFileGet(plist: Plist) {
	return infoPlistDictGetValue(plist, 'CFBundleIconFile').castAs(ValueString)
		.value;
}

/**
 * Set Info.plist bundle icon.
 *
 * @param plist Plist document.
 * @param value Icon name.
 */
export function infoPlistBundleIconFileSet(plist: Plist, value: string | null) {
	const v = value === null ? null : new ValueString(value);
	infoPlistDictSet(plist, 'CFBundleIconFile', v);
}

/**
 * Set Info.plist bundle name.
 *
 * @param plist Plist document.
 * @param value Icon name.
 */
export function infoPlistBundleNameSet(plist: Plist, value: string | null) {
	const v = value === null ? null : new ValueString(value);
	infoPlistDictSet(plist, 'CFBundleName', v);
}

/**
 * Get types of Mach-O data, array if FAT binary, else a single object.
 *
 * @param data Mach-O data.
 * @returns Mach-O types.
 */
export function machoTypesData(data: Readonly<Buffer>) {
	let le = false;

	/**
	 * Read UINT32 at offset.
	 *
	 * @param offset File offset.
	 * @returns UINT32 value.
	 */
	// eslint-disable-next-line arrow-body-style
	const uint32 = (offset: number) => {
		return le ? data.readUInt32LE(offset) : data.readUInt32BE(offset);
	};

	/**
	 * Read type at offset.
	 *
	 * @param offset File offset.
	 * @returns Type object.
	 */
	const type = (offset: number): IMachoType => ({
		cpuType: uint32(offset),
		cpuSubtype: uint32(offset + 4)
	});

	const magic = uint32(0);
	switch (magic) {
		case FAT_MAGIC: {
			const r = [];
			const count = uint32(4);
			let offset = 8;
			for (let i = 0; i < count; i++) {
				r.push(type(offset));
				offset += 20;
			}
			return r;
		}
		case MH_MAGIC:
		case MH_MAGIC_64: {
			return type(4);
		}
		case MH_CIGAM:
		case MH_CIGAM_64: {
			le = true;
			return type(4);
		}
		default: {
			throw new Error(`Unknown header magic: 0x${magic.toString(16)}`);
		}
	}
}

/**
 * Get types of Mach-O file, array if FAT binary, else a single object.
 *
 * @param path Mach-O file.
 * @returns Mach-O types.
 */
export async function machoTypesFile(path: string) {
	return machoTypesData(await readFile(path));
}

/**
 * Get Mach-O app launcher for a single type.
 *
 * @param type Mach-O type.
 * @returns Launcher data.
 */
export async function machoAppLauncherThin(type: Readonly<IMachoType>) {
	const {cpuType} = type;
	let id = '';
	switch (cpuType) {
		case CPU_TYPE_POWERPC: {
			id = 'mac-app-ppc';
			break;
		}
		case CPU_TYPE_I386: {
			id = 'mac-app-i386';
			break;
		}
		default: {
			throw new Error(`Unknown CPU type: 0x${cpuType.toString(16)}`);
		}
	}
	return launcher(id);
}

/**
 * Get Mach-O app launcher for a type list.
 *
 * @param types Mach-O types.
 * @returns Launcher data.
 */
export async function machoAppLauncherFat(
	types: Readonly<Readonly<IMachoType>[]>
) {
	// The lipo utility always uses 12/4096 for ppc, ppc64, i386, and x86_64.
	const align = 12;
	// eslint-disable-next-line no-bitwise
	const alignSize = (1 << align) >>> 0;

	// Create the FAT header.
	const head = Buffer.alloc(8);
	head.writeUInt32BE(FAT_MAGIC, 0);
	head.writeUInt32BE(types.length, 4);

	// The pieces and their total length.
	const pieces = [head];
	let total = head.length;

	/**
	 * Helper to add pieces and update total length.
	 *
	 * @param data Data.
	 */
	const add = (data: Buffer) => {
		pieces.push(data);
		total += data.length;
	};

	/**
	 * Helper to pad pieces.
	 */
	const pad = () => {
		const over = total % alignSize;
		if (over) {
			add(Buffer.alloc(alignSize - over));
		}
	};

	// Create a head and get the body for each type.
	const parts = [];
	for (const {type, body} of await Promise.all(
		types.map(async type =>
			machoAppLauncherThin(type).then(body => ({
				type,
				body
			}))
		)
	)) {
		const head = Buffer.alloc(20);
		head.writeUInt32BE(type.cpuType, 0);
		head.writeUInt32BE(type.cpuSubtype, 4);
		head.writeUInt32BE(align, 16);
		parts.push({
			head,
			body
		});
		add(head);
	}

	// Add binaries aligned, updating their headers.
	for (const {head, body} of parts) {
		pad();
		head.writeUInt32BE(total, 8);
		head.writeUInt32BE(body.length, 12);
		add(body);
	}

	// Merge all the pieces.
	return Buffer.concat(pieces, total);
}

/**
 * Get Mach-O app launcher for a single or multiple types.
 *
 * @param types Mach-O types.
 * @returns Launcher data.
 */
export async function machoAppLauncher(
	types: Readonly<IMachoType> | Readonly<Readonly<IMachoType>[]>
) {
	return Array.isArray(types)
		? machoAppLauncherFat(types)
		: machoAppLauncherThin(types as IMachoType);
}
