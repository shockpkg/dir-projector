import {open} from 'node:fs/promises';

import {launcher} from '../util';

const FAT_MAGIC = 0xcafebabe;
const MH_MAGIC = 0xfeedface;
const MH_CIGAM = 0xcefaedfe;
const MH_MAGIC_64 = 0xfeedfacf;
const MH_CIGAM_64 = 0xcffaedfe;

const CPU_TYPE_POWERPC = 0x00000012;
const CPU_TYPE_I386 = 0x00000007;

/**
 * Mach-O type.
 */
export interface IMachoType {
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
 * Get types of Mach-O data, array if FAT binary, else a single object.
 *
 * @param data Mach-O data.
 * @returns Mach-O types.
 */
export function machoTypesData(data: Readonly<Uint8Array>) {
	let le = false;
	const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

	/**
	 * Read type at offset.
	 *
	 * @param offset File offset.
	 * @returns Type object.
	 */
	const type = (offset: number): IMachoType => ({
		cpuType: dv.getUint32(offset, le),
		cpuSubtype: dv.getUint32(offset + 4, le)
	});

	const magic = dv.getUint32(0, le);
	switch (magic) {
		case FAT_MAGIC: {
			const r = [];
			const count = dv.getUint32(4, le);
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
	let data;
	const f = await open(path, 'r');
	try {
		const m = 8;
		const h = new Uint8Array(m);
		const {bytesRead} = await f.read(h, 0, m, 0);
		if (bytesRead < m) {
			data = h.subarray(0, bytesRead);
		} else {
			const v = new DataView(h.buffer, h.byteOffset, h.byteLength);
			const n =
				v.getUint32(0, false) === FAT_MAGIC
					? v.getUint32(4, false) * 20
					: 4;
			const d = new Uint8Array(m + n);
			d.set(h);
			const {bytesRead} = await f.read(d, m, n, m);
			data = d.subarray(0, m + bytesRead);
		}
	} finally {
		await f.close();
	}
	return machoTypesData(data);
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
	types: readonly Readonly<IMachoType>[]
) {
	// The lipo utility always uses 12/4096 for ppc, ppc64, i386, and x86_64.
	const align = 12;
	// eslint-disable-next-line no-bitwise
	const alignSize = (1 << align) >>> 0;

	// Create the FAT header.
	const headD = new Uint8Array(8);
	const headV = new DataView(
		headD.buffer,
		headD.byteOffset,
		headD.byteLength
	);
	headV.setUint32(0, FAT_MAGIC, false);
	headV.setUint32(4, types.length, false);

	// The pieces and their total length.
	const pieces: Uint8Array[] = [headD];
	let total = headD.length;

	/**
	 * Helper to add pieces and update total length.
	 *
	 * @param data Data.
	 */
	const add = (data: Uint8Array) => {
		pieces.push(data);
		total += data.length;
	};

	/**
	 * Helper to pad pieces.
	 */
	const pad = () => {
		const over = total % alignSize;
		if (over) {
			add(new Uint8Array(alignSize - over));
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
		const headD = new Uint8Array(20);
		const headV = new DataView(
			headD.buffer,
			headD.byteOffset,
			headD.byteLength
		);
		headV.setUint32(0, type.cpuType, false);
		headV.setUint32(4, type.cpuSubtype, false);
		headV.setUint32(16, align, false);
		parts.push({
			headV,
			body
		});
		add(headD);
	}

	// Add binaries aligned, updating their headers.
	for (const {headV, body} of parts) {
		pad();
		headV.setUint32(8, total, false);
		headV.setUint32(12, body.length, false);
		add(body);
	}

	// Merge all the pieces.
	const r = new Uint8Array(total);
	let i = 0;
	for (const piece of pieces) {
		r.set(piece, i);
		i += piece.length;
	}
	return r;
}

/**
 * Get Mach-O app launcher for a single or multiple types.
 *
 * @param types Mach-O types.
 * @returns Launcher data.
 */
export async function machoAppLauncher(
	types: Readonly<IMachoType> | readonly Readonly<IMachoType>[]
) {
	return Array.isArray(types)
		? machoAppLauncherFat(types)
		: machoAppLauncherThin(types as IMachoType);
}
