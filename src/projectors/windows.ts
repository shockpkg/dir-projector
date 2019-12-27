import {
	basename as pathBasename,
	join as pathJoin
} from 'path';

import {
	Entry,
	fsWalk
} from '@shockpkg/archive-files';
import * as resedit from 'resedit';
import fse from 'fs-extra';

import {
	patchWindowsS3dInstalledDisplayDriversSize
} from '../patcher';
import {
	IProjectorOptions,
	Projector
} from '../projector';
import {
	defaultFalse,
	defaultNull,
	bufferToArrayBuffer,
	entryIsEmptyResourceFork,
	pathRelativeBase,
	pathRelativeBaseMatch
} from '../util';

const ResEditNtExecutable =
	resedit.NtExecutable ||
	(resedit as any).default.NtExecutable;

const ResEditNtExecutableResource =
	resedit.NtExecutableResource ||
	(resedit as any).default.NtExecutableResource;

const ResEditResource =
	resedit.Resource ||
	(resedit as any).default.Resource;

const ResEditData =
	resedit.Data ||
	(resedit as any).default.Data;

export interface IProjectorWindowsOptions extends IProjectorOptions {

	/**
	 * Patch the Shockave 3D Xtra to have a larger buffer to avoid a crash.
	 * The buffer for resolving InstalledDisplayDrivers to a path is small.
	 * Changes to the values stored in InstalledDisplayDrivers cause issues.
	 * The value is now supposed to hold full paths on modern Windows.
	 * In particular, Nvidia drivers which do this need this patch.
	 *
	 * @default false
	 */
	patchShockwave3dInstalledDisplayDriversSize?: boolean;

	/**
	 * Icon file.
	 *
	 * @default null
	 */
	iconFile?: string | null;

	/**
	 * Icon data.
	 *
	 * @default null
	 */
	iconData?: Buffer | null;

	/**
	 * Version strings.
	 *
	 * @default null
	 */
	fileVersion?: string | null;

	/**
	 * Product version.
	 *
	 * @default null
	 */
	productVersion?: string | null;

	/**
	 * Version strings.
	 *
	 * @default null
	 */
	versionStrings?: {[key: string]: string} | null;
}

/**
 * ProjectorWindows constructor.
 *
 * @param options Options object.
 */
export class ProjectorWindows extends Projector {
	/**
	 * Patch the Shockave 3D Xtra to have a larger buffer to avoid a crash.
	 * The buffer for resolving InstalledDisplayDrivers to a path is small.
	 * Changes to the values stored in InstalledDisplayDrivers cause issues.
	 * The value is now supposed to hold full paths on modern Windows.
	 * In particular, Nvidia drivers which do this need this patch.
	 *
	 * @default false
	 */
	public patchShockwave3dInstalledDisplayDriversSize: boolean;

	/**
	 * Icon file.
	 *
	 * @default null
	 */
	public iconFile: string | null;

	/**
	 * Icon data.
	 *
	 * @default null
	 */
	public iconData: Buffer | null;

	/**
	 * Version strings.
	 *
	 * @default null
	 */
	public fileVersion: string | null;

	/**
	 * Product version.
	 *
	 * @default null
	 */
	public productVersion: string | null;

	/**
	 * Version strings.
	 *
	 * @default null
	 */
	public versionStrings: {[key: string]: string} | null;

	constructor(options: IProjectorWindowsOptions) {
		super(options);

		this.iconFile = defaultNull(options.iconFile);
		this.iconData = defaultNull(options.iconData);
		this.fileVersion = defaultNull(options.fileVersion);
		this.productVersion = defaultNull(options.productVersion);
		this.versionStrings = defaultNull(options.versionStrings);
		this.patchShockwave3dInstalledDisplayDriversSize = defaultFalse(
			options.patchShockwave3dInstalledDisplayDriversSize
		);
	}

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public get projectorExtension() {
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
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get lingoNewline() {
		return '\r\n';
	}

	/**
	 * Newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get newline() {
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
	 * If icon is specified.
	 *
	 * @returns Is specified.
	 */
	public get hasIcon() {
		return !!(this.iconData || this.iconFile);
	}

	/**
	 * Get icon data if any specified, from data or file.
	 *
	 * @returns Icon data or null.
	 */
	public async getIconData() {
		return this._dataFromBufferOrFile(
			this.iconData,
			this.iconFile
		);
	}

	/**
	 * Get all version strings.
	 *
	 * @returns Verion strings.
	 */
	public getVersionStrings() {
		const {fileVersion, productVersion, versionStrings} = this;
		if (
			fileVersion === null &&
			productVersion === null &&
			versionStrings === null
		) {
			return null;
		}
		const values = {...(versionStrings || {})};
		if (fileVersion !== null) {
			values.FileVersion = fileVersion;
		}
		if (productVersion !== null) {
			values.ProductVersion = productVersion;
		}
		return values;
	}

	/**
	 * Write out the projector.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	public async write(path: string, name: string) {
		await super.write(path, name);

		await this._patch(path, name);
		await this._updateResources(path, name);
	}

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeSkeleton(path: string, name: string) {
		const {
			shockwave,
			sklName,
			xtrasDirectoryName
		} = this;

		const xtrasPath = this.getXtrasPath(name);
		const xtrasMappings = this.getIncludeXtrasMappings();

		let foundProjectorSkl = false;
		let foundXtras = false;

		const xtrasHandler = async (entry: Entry) => {
			// Check if Xtras path.
			const xtrasRel = pathRelativeBase(
				entry.volumePath,
				xtrasDirectoryName,
				true
			);
			if (xtrasRel === null) {
				return false;
			}
			foundXtras = true;

			// Find output path if being included, else skip.
			const dest = this.includeXtrasMappingsDest(
				xtrasMappings,
				xtrasRel
			);
			if (!dest) {
				return true;
			}

			await entry.extract(pathJoin(path, xtrasPath, dest));
			return true;
		};

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

			await entry.extract(pathJoin(path, name));
			return true;
		};

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

			await entry.extract(pathJoin(path, entryPath));
			return true;
		};

		const archive = await this.getSkeletonArchive();
		await archive.read(async entry => {
			// Skip empty resource forks (every file in DMG).
			if (entryIsEmptyResourceFork(entry)) {
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
			throw new Error(
				`Failed to locate: ${sklName}`
			);
		}

		if (!foundXtras) {
			throw new Error(`Failed to locate: ${xtrasDirectoryName}`);
		}
	}

	/**
	 * Patch projector.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _patch(path: string, name: string) {
		await this._patchShockwave3dInstalledDisplayDriversSize(path, name);
	}

	/**
	 * Patch projector, Shockwave 3D InstalledDisplayDrivers size.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _patchShockwave3dInstalledDisplayDriversSize(
		path: string,
		name: string
	) {
		if (!this.patchShockwave3dInstalledDisplayDriversSize) {
			return;
		}

		const xtrasDir = pathJoin(path, this.getXtrasPath(name));
		const search = 'Shockwave 3D Asset.x32';
		const searchLower = search.toLowerCase();

		let found = false;
		await fsWalk(xtrasDir, async (path, stat) => {
			if (!stat.isFile()) {
				return;
			}

			const fn = pathBasename(path);
			if (fn.toLowerCase() !== searchLower) {
				return;
			}

			found = true;
			await patchWindowsS3dInstalledDisplayDriversSize(
				pathJoin(xtrasDir, path)
			);
		}, {
			ignoreUnreadableDirectories: true
		});

		if (!found) {
			throw new Error(`Failed to locate for patching: ${search}`);
		}
	}

	/**
	 * Update projector Windows resources.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _updateResources(path: string, name: string) {
		const versionStrings = this.getVersionStrings();
		const iconData = await this.getIconData();

		// Skip if nothing to be changed.
		if (!iconData && !versionStrings) {
			return;
		}

		// Read EXE file and parse resources.
		const file = pathJoin(path, name);
		const exe = ResEditNtExecutable.from(bufferToArrayBuffer(
			await fse.readFile(file)
		));
		const res = ResEditNtExecutableResource.from(exe);

		// Replace all the icons in all icon groups.
		if (iconData) {
			const ico = ResEditData.IconFile.from(
				bufferToArrayBuffer(iconData)
			);
			for (const iconGroup of ResEditResource.IconGroupEntry.fromEntries(
				res.entries
			)) {
				ResEditResource.IconGroupEntry.replaceIconsForResource(
					res.entries,
					iconGroup.id,
					iconGroup.lang,
					ico.icons.map(icon => icon.data)
				);
			}
		}

		// Update strings if present for all the languages.
		if (versionStrings) {
			for (const versionInfo of ResEditResource.VersionInfo.fromEntries(
				res.entries
			)) {
				// Unfortunately versionInfo.getAvailableLanguages() skips some.
				// Get the full list from the internal data.
				const languages = (versionInfo as any).data.strings
					.map((o: any) => ({
						lang: o.lang as (number | string),
						codepage: o.codepage as (number | string)
					}));

				for (const language of languages) {
					versionInfo.setStringValues(language, versionStrings);
				}
				versionInfo.outputToResourceEntries(res.entries);
			}
		}

		// Update resources and write EXE file.
		res.outputResource(exe);
		await fse.writeFile(file, Buffer.from(exe.generate()));
	}
}
