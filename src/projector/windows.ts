import {readFile} from 'fs/promises';
import {join as pathJoin, dirname, basename} from 'path';

import {Entry, PathType, fsWalk} from '@shockpkg/archive-files';

import {pathRelativeBase, pathRelativeBaseMatch} from '../util';
import {
	peResourceReplace,
	windowsPatchShockwave3dInstalledDisplayDriversSize
} from '../util/windows';
import {Projector} from '../projector';

/**
 * ProjectorWindows object.
 */
export class ProjectorWindows extends Projector {
	/**
	 * Icon file.
	 */
	public iconFile: string | null = null;

	/**
	 * Icon data.
	 */
	public iconData: Readonly<Buffer> | null = null;

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
	 *
	 * @default false
	 */
	public patchShockwave3dInstalledDisplayDriversSize = false;

	/**
	 * ProjectorWindows constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
	}

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public get extension() {
		return '.exe';
	}

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get configNewline() {
		return '\r\n';
	}

	/**
	 * Lingo file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get lingoNewline() {
		return '\r\n';
	}

	/**
	 * Splash image file extension.
	 *
	 * @returns File extension.
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
		return iconData || (iconFile ? readFile(iconFile) : null);
	}

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param skeleton Skeleton path.
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

		const archive = await this.getSkeletonArchive(skeleton);
		await archive.read(async entry => {
			if (entry.type === PathType.RESOURCE_FORK) {
				return;
			}

			if (await xtrasHandler(entry)) {
				return;
			}

			if (await projectorSklHandler(entry)) {
				return;
			}

			if (await projectorDllHandler(entry)) {
				return;
			}
		});

		if (!foundProjectorSkl) {
			throw new Error(`Failed to locate: ${sklName}`);
		}

		if (!foundXtras) {
			throw new Error(`Failed to locate: ${xtrasName}`);
		}
	}

	/**
	 * Modify the projector skeleton.
	 */
	protected async _modifySkeleton() {
		const iconData = await this.getIconData();
		const {versionStrings} = this;
		if (!(iconData || versionStrings)) {
			return;
		}

		await peResourceReplace(this.path, {
			iconData,
			versionStrings
		});

		await this._patchShockwave3dInstalledDisplayDriversSize();
	}

	/**
	 * Patch projector, Shockwave 3D InstalledDisplayDrivers size.
	 */
	protected async _patchShockwave3dInstalledDisplayDriversSize() {
		if (!this.patchShockwave3dInstalledDisplayDriversSize) {
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
				await windowsPatchShockwave3dInstalledDisplayDriversSize(
					pathJoin(xtrasDir, path)
				);
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
