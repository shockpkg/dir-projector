import {
	Entry
} from '@shockpkg/archive-files';
import {
	join as pathJoin
} from 'path';

import {
	IProjectorOptions,
	Projector
} from '../projector';
import {
	defaultNull,
	entryIsEmptyResourceFork,
	IRceditOptions,
	IRceditOptionsVersionStrings,
	pathRelativeBase,
	pathRelativeBaseMatch,
	rcedit
} from '../util';

export interface IProjectorWindowsOptions extends IProjectorOptions {
	/**
	 * Icon file, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	iconFile?: string | null;

	/**
	 * Version strings, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	fileVersion?: string | null;

	/**
	 * Product version, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	productVersion?: string | null;

	/**
	 * Version strings, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	versionStrings?: IRceditOptionsVersionStrings | null;
}

/**
 * ProjectorWindows constructor.
 *
 * @param options Options object.
 */
export class ProjectorWindows extends Projector {
	/**
	 * Icon file, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	public iconFile: string | null;

	/**
	 * Version strings, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	public fileVersion: string | null;

	/**
	 * Product version, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	public productVersion: string | null;

	/**
	 * Version strings, requires Windows or Wine.
	 *
	 * @defaultValue null
	 */
	public versionStrings: IRceditOptionsVersionStrings | null;

	constructor(options: IProjectorWindowsOptions) {
		super(options);

		this.iconFile = defaultNull(options.iconFile);
		this.fileVersion = defaultNull(options.fileVersion);
		this.productVersion = defaultNull(options.productVersion);
		this.versionStrings = defaultNull(options.versionStrings);
	}

	/**
	 * Projector file extension.
	 */
	public get projectorExtension() {
		return '.exe';
	}

	/**
	 * Config file newline characters.
	 */
	public get configNewline() {
		return '\r\n';
	}

	/**
	 * Config file newline characters.
	 */
	public get lingoNewline() {
		return '\r\n';
	}

	/**
	 * Newline characters.
	 */
	public get newline() {
		return '\r\n';
	}

	/**
	 * Splash image file extension.
	 */
	public get splashImageExtension() {
		return '.BMP';
	}

	/**
	 * Get the SKL name.
	 */
	public get sklName() {
		return 'Projec32.skl';
	}

	/**
	 * Write out the projector.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	public async write(path: string, name: string) {
		await super.write(path, name);

		await this._updateResources(path, name);
	}

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeSkeleton(path: string, name: string) {
		// tslint:disable-next-line no-this-assignment
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
	 * Update projector Windows resources.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _updateResources(path: string, name: string) {
		// tslint:disable-next-line no-this-assignment
		const {
			iconFile,
			fileVersion,
			productVersion,
			versionStrings
		} = this;

		const options: IRceditOptions = {};
		let optionsSet = false;

		if (iconFile) {
			options.iconPath = iconFile;
			optionsSet = true;
		}

		if (fileVersion !== null) {
			options.fileVersion = fileVersion;
			optionsSet = true;
		}

		if (productVersion !== null) {
			options.productVersion = productVersion;
			optionsSet = true;
		}

		if (versionStrings !== null) {
			options.versionStrings = versionStrings;
			optionsSet = true;
		}

		// Do not update if no changes are specified.
		if (!optionsSet) {
			return;
		}

		const file = pathJoin(path, name);
		await rcedit(file, options);
	}
}
