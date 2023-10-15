import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join as pathJoin, dirname} from 'node:path';

import {
	Entry,
	PathType,
	createArchiveByFileStatOrThrow
} from '@shockpkg/archive-files';

import {pathRelativeBase, pathRelativeBaseMatch} from '../../util';
import {
	peResourceReplace,
	windowsPatch3dDisplayDriversSize
} from '../../util/windows';
import {IFilePatch, ProjectorOtto} from '../otto';

/**
 * ProjectorOttoWindows object.
 */
export class ProjectorOttoWindows extends ProjectorOtto {
	/**
	 * Icon file.
	 */
	public iconFile: string | null = null;

	/**
	 * Icon data.
	 */
	public iconData:
		| Readonly<Uint8Array>
		| (() => Readonly<Uint8Array>)
		| (() => Promise<Readonly<Uint8Array>>)
		| null = null;

	/**
	 * Version strings.
	 */
	public versionStrings: Readonly<{[key: string]: string}> | null = null;

	/**
	 * Patch the Shockave 3D Xtra to have a larger buffer to avoid a crash.
	 * The buffer for resolving InstalledDisplayDrivers to a path is small.
	 * Changes to the values stored in InstalledDisplayDrivers cause issues.
	 * The value is now supposed to hold full paths on modern Windows.
	 * In particular, Nvidia drivers which do this need this patch.
	 */
	public patch3dDisplayDriversSize = false;

	/**
	 * ProjectorOttoWindows constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
	}

	/**
	 * @inheritdoc
	 */
	public get extension() {
		return '.exe';
	}

	/**
	 * @inheritdoc
	 */
	public get configNewline() {
		return '\r\n';
	}

	/**
	 * @inheritdoc
	 */
	public get lingoNewline() {
		return '\r\n';
	}

	/**
	 * @inheritdoc
	 */
	public get splashImageExtension() {
		return '.BMP';
	}

	/**
	 * Get the SKL name.
	 *
	 * @returns File name.
	 */
	public get sklName() {
		return 'Projec32.skl';
	}

	/**
	 * Get icon data if any specified, from data or file.
	 *
	 * @returns Icon data or null.
	 */
	public async getIconData() {
		const {iconData, iconFile} = this;
		if (iconData) {
			return typeof iconData === 'function' ? iconData() : iconData;
		}
		if (iconFile) {
			const d = await readFile(iconFile);
			return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
		}
		return null;
	}

	/**
	 * @inheritdoc
	 */
	protected async _writeSkeleton(skeleton: string) {
		const {path, shockwave, sklName, xtrasName, xtrasPath} = this;

		const xtrasMappings = this.getIncludeXtrasMappings();

		let foundProjectorSkl = false;
		let foundXtras = false;

		const patches = await this._getPatches();

		/**
		 * Extract entry, and also apply patches if any.
		 *
		 * @param entry Archive entry.
		 * @param dest Output path.
		 */
		const extract = async (entry: Entry, dest: string) => {
			let data: Uint8Array | null = null;
			for (const patch of patches) {
				if (
					entry.type === PathType.FILE &&
					patch.match(entry.volumePath)
				) {
					// eslint-disable-next-line no-await-in-loop
					data = data || (await entry.read());
					if (!data) {
						throw new Error(`Failed to read: ${entry.volumePath}`);
					}
					data = patch.modify(data);
				}
			}

			if (data) {
				await mkdir(dirname(dest), {recursive: true});
				await writeFile(dest, data);
				return;
			}

			await entry.extract(dest);
		};

		/**
		 * Xtras handler.
		 *
		 * @param entry Archive entry.
		 * @returns Boolean.
		 */
		const xtrasHandler = async (entry: Entry) => {
			// Check if Xtras path.
			const xtrasRel = pathRelativeBase(
				entry.volumePath,
				xtrasName,
				true
			);
			if (xtrasRel === null) {
				return false;
			}
			foundXtras = true;

			// Find output path if being included, else skip.
			const dest = this.includeXtrasMappingsDest(xtrasMappings, xtrasRel);
			if (!dest) {
				return true;
			}

			await extract(entry, pathJoin(xtrasPath, dest));
			return true;
		};

		/**
		 * SKL handler.
		 *
		 * @param entry Archive entry.
		 * @returns Boolean.
		 */
		const projectorSklHandler = async (entry: Entry) => {
			const entryPath = entry.volumePath;

			// Should not be in sub directory.
			if (entryPath.includes('/')) {
				return false;
			}

			// Check if skl path.
			if (!pathRelativeBaseMatch(entryPath, sklName, true)) {
				return false;
			}
			foundProjectorSkl = true;

			await extract(entry, path);
			return true;
		};

		/**
		 * DLL handler.
		 *
		 * @param entry Archive entry.
		 * @returns Boolean.
		 */
		const projectorDllHandler = async (entry: Entry) => {
			const entryPath = entry.volumePath;

			// Should not be in sub directory.
			if (entryPath.includes('/')) {
				return false;
			}

			// Check if dll path.
			if (!/\.dll$/i.test(entryPath)) {
				return false;
			}

			// Exclude if shockwave projector.
			if (shockwave) {
				return true;
			}

			await extract(entry, pathJoin(dirname(path), entryPath));
			return true;
		};

		const archive = await createArchiveByFileStatOrThrow(skeleton, {
			nobrowse: this.nobrowse
		});
		await archive.read(async entry => {
			if (entry.type === PathType.RESOURCE_FORK) {
				return true;
			}

			if (await xtrasHandler(entry)) {
				return true;
			}

			if (await projectorSklHandler(entry)) {
				return true;
			}

			if (await projectorDllHandler(entry)) {
				return true;
			}

			return true;
		});

		if (!foundProjectorSkl) {
			throw new Error(`Failed to locate: ${sklName}`);
		}

		if (!foundXtras) {
			throw new Error(`Failed to locate: ${xtrasName}`);
		}

		await Promise.all(patches.map(async p => p.after()));
	}

	/**
	 * Get patches to apply.
	 *
	 * @returns Patches list.
	 */
	protected async _getPatches() {
		const patches: IFilePatch[] = [];
		let p = this._getPatch3dDisplayDriversSize();
		if (p) {
			patches.push(p);
		}
		p = await this._getPatchResources();
		if (p) {
			patches.push(p);
		}
		return patches;
	}

	/**
	 * Get patch for main file resources.
	 *
	 * @returns Patch spec.
	 */
	protected async _getPatchResources() {
		const iconData = await this.getIconData();
		const {versionStrings, sklName} = this;
		if (!(iconData || versionStrings)) {
			return null;
		}

		const skl = sklName;
		const search = skl.toLowerCase();
		let count = 0;

		const patch: IFilePatch = {
			// eslint-disable-next-line jsdoc/require-jsdoc
			match: (file: string) =>
				search === file.split('/').pop()!.toLowerCase(),
			// eslint-disable-next-line jsdoc/require-jsdoc
			modify: (data: Uint8Array) => {
				const d = peResourceReplace(data, {
					iconData,
					versionStrings
				});
				count++;
				return d;
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			after: () => {
				if (!count) {
					throw new Error(`Failed to locate for patching: ${skl}`);
				}
			}
		};
		return patch;
	}

	/**
	 * Get patch for Shockwave 3D InstalledDisplayDrivers size.
	 *
	 * @returns Patch spec.
	 */
	protected _getPatch3dDisplayDriversSize() {
		if (!this.patch3dDisplayDriversSize) {
			return null;
		}

		const x32 = 'Shockwave 3D Asset.x32';
		const search = x32.toLowerCase();
		let count = 0;

		const patch: IFilePatch = {
			// eslint-disable-next-line jsdoc/require-jsdoc
			match: (file: string) =>
				search === file.split('/').pop()!.toLowerCase(),
			// eslint-disable-next-line jsdoc/require-jsdoc
			modify: (data: Uint8Array) => {
				windowsPatch3dDisplayDriversSize(data);
				count++;
				return data;
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			after: () => {
				if (!count) {
					throw new Error(`Failed to locate for patching: ${x32}`);
				}
			}
		};
		return patch;
	}

	/**
	 * @inheritdoc
	 */
	protected async _modifySkeleton() {}
}
