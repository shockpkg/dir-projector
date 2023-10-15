import {readFile, writeFile} from 'node:fs/promises';
import {join as pathJoin, dirname, basename} from 'node:path';

import {
	Entry,
	PathType,
	createArchiveByFileStatOrThrow,
	fsWalk
} from '@shockpkg/archive-files';

import {pathRelativeBase, pathRelativeBaseMatch} from '../../util';
import {
	peResourceReplace,
	windowsPatch3dDisplayDriversSize
} from '../../util/windows';
import {ProjectorOtto} from '../otto';

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

			await entry.extract(pathJoin(xtrasPath, dest));
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

			await entry.extract(path);
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

			await entry.extract(pathJoin(dirname(path), entryPath));
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
	}

	/**
	 * @inheritdoc
	 */
	protected async _modifySkeleton() {
		const {path} = this;
		const iconData = await this.getIconData();
		const {versionStrings} = this;
		if (!(iconData || versionStrings)) {
			return;
		}

		await writeFile(
			path,
			peResourceReplace(await readFile(path), {
				iconData,
				versionStrings
			})
		);

		await this._patch3dDisplayDriversSize();
	}

	/**
	 * Patch projector, Shockwave 3D InstalledDisplayDrivers size.
	 */
	protected async _patch3dDisplayDriversSize() {
		if (!this.patch3dDisplayDriversSize) {
			return;
		}

		const xtrasDir = this.xtrasPath;
		const search = 'Shockwave 3D Asset.x32';
		const searchLower = search.toLowerCase();

		let found = false;
		await fsWalk(
			xtrasDir,
			async (path, stat) => {
				if (!stat.isFile()) {
					return;
				}

				const fn = basename(path);
				if (fn.toLowerCase() !== searchLower) {
					return;
				}

				found = true;
				const f = pathJoin(xtrasDir, path);
				const d = await readFile(f);
				windowsPatch3dDisplayDriversSize(d);
				await writeFile(f, d);
			},
			{
				ignoreUnreadableDirectories: true
			}
		);

		if (!found) {
			throw new Error(`Failed to locate for patching: ${search}`);
		}
	}
}
