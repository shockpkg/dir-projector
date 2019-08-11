import {
	join as pathJoin
} from 'path';

import {
	Entry
} from '@shockpkg/archive-files';

import {
	IProjectorOptions,
	Projector
} from '../projector';
import {
	defaultFalse,
	defaultNull,
	entryIsEmptyResourceFork,
	infoPlistReplace,
	pathRelativeBase,
	pathRelativeBaseMatch,
	plistStringTagEncode
} from '../util';

export interface IProjectorMacAppOptions extends IProjectorOptions {

	/**
	 * Binary name, also renames rsrc and icns.
	 *
	 * @default null
	 */
	binaryName?: string | null;

	/**
	 * Intel binary package, not universal binary.
	 *
	 * @default false
	 */
	intel?: boolean;

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
	 * Info.plist file.
	 *
	 * @default null
	 */
	infoPlistFile?: string | null;

	/**
	 * Info.plist data.
	 *
	 * @default null
	 */
	infoPlistData?: Buffer | null;

	/**
	 * PkgInfo file.
	 *
	 * @default null
	 */
	pkgInfoFile?: string | null;

	/**
	 * PkgInfo data.
	 *
	 * @default null
	 */
	pkgInfoData?: Buffer | null;

	/**
	 * Nest Xtras at *.app/Contents/xtras.
	 *
	 * @default false
	 */
	nestXtrasContents?: boolean;
}

/**
 * ProjectorMacApp constructor.
 *
 * @param options Options object.
 */
export class ProjectorMacApp extends Projector {
	/**
	 * Binary name.
	 *
	 * @default null
	 */
	public binaryName: string | null;

	/**
	 * Intel binary package, not universal binary.
	 *
	 * @default false
	 */
	public intel: boolean;

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
	 * Info.plist file.
	 *
	 * @default null
	 */
	public infoPlistFile: string | null;

	/**
	 * Info.plist data.
	 *
	 * @default null
	 */
	public infoPlistData: string | string[] | Buffer | null;

	/**
	 * PkgInfo file.
	 *
	 * @default null
	 */
	public pkgInfoFile: string | null;

	/**
	 * PkgInfo data.
	 *
	 * @default null
	 */
	public pkgInfoData: string | Buffer | null;

	/**
	 * Nest Xtras at *.app/Contents/xtras.
	 *
	 * @default false
	 */
	public nestXtrasContents: boolean;

	constructor(options: IProjectorMacAppOptions = {}) {
		super(options);

		this.binaryName = defaultNull(options.binaryName);
		this.intel = defaultFalse(options.intel);
		this.iconFile = defaultNull(options.iconFile);
		this.iconData = defaultNull(options.iconData);
		this.infoPlistFile = defaultNull(options.infoPlistFile);
		this.infoPlistData = defaultNull(options.infoPlistData);
		this.pkgInfoFile = defaultNull(options.pkgInfoFile);
		this.pkgInfoData = defaultNull(options.pkgInfoData);
		this.nestXtrasContents = defaultFalse(options.nestXtrasContents);
	}

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public get projectorExtension() {
		return '.app';
	}

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get configNewline() {
		return '\n';
	}

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public get lingoNewline() {
		return '\n';
	}

	/**
	 * Splash image file extension.
	 *
	 * @returns File extension.
	 */
	public get splashImageExtension() {
		return '.pict';
	}

	/**
	 * If icon is specified.
	 *
	 * @returns Has icon.
	 */
	public get hasIcon() {
		return !!(this.iconData || this.iconFile);
	}

	/**
	 * If Info.plist is specified.
	 *
	 * @returns Has Info.plist.
	 */
	public get hasInfoPlist() {
		return !!(this.infoPlistData || this.infoPlistFile);
	}

	/**
	 * If PkgInfo is specified.
	 *
	 * @returns Has PkgInfo.
	 */
	public get hasPkgInfo() {
		return !!(this.pkgInfoData || this.pkgInfoFile);
	}

	/**
	 * Get the Projector Resources directory name.
	 *
	 * @returns Directory name.
	 */
	public get projectorResourcesDirectoryName() {
		return this.intel ? 'Projector Intel Resources' : 'Projector Resources';
	}

	/**
	 * Get app binary name.
	 *
	 * @returns File name.
	 */
	public get appBinaryName() {
		return this.appBinaryNameCustom || this.appBinaryNameDefault;
	}

	/**
	 * Get app binary name, default.
	 *
	 * @returns File name.
	 */
	public get appBinaryNameDefault() {
		return 'Projector';
	}

	/**
	 * Get app binary name, custom.
	 *
	 * @returns File name.
	 */
	public get appBinaryNameCustom() {
		return this.binaryName;
	}

	/**
	 * Get app icon name.
	 *
	 * @returns File name.
	 */
	public get appIconName() {
		return this.appIconNameCustom || this.appIconNameDefault;
	}

	/**
	 * Get app icon name, default.
	 *
	 * @returns File name.
	 */
	public get appIconNameDefault() {
		return 'projector.icns';
	}

	/**
	 * Get app icon name, custom.
	 *
	 * @returns File name.
	 */
	public get appIconNameCustom() {
		const n = this.binaryName;
		return n ? `${n}.icns` : null;
	}

	/**
	 * Get app rsrc name.
	 *
	 * @returns File name.
	 */
	public get appRsrcName() {
		return this.appRsrcNameCustom || this.appRsrcNameDefault;
	}

	/**
	 * Get app rsrc name, default.
	 *
	 * @returns File name.
	 */
	public get appRsrcNameDefault() {
		return 'Projector.rsrc';
	}

	/**
	 * Get app rsrc name, custom.
	 *
	 * @returns File name.
	 */
	public get appRsrcNameCustom() {
		const n = this.binaryName;
		return n ? `${n}.rsrc` : null;
	}

	/**
	 * Get app Info.plist path.
	 *
	 * @returns File path.
	 */
	public get appPathInfoPlist() {
		return 'Contents/Info.plist';
	}

	/**
	 * Get app PkgInfo path.
	 *
	 * @returns File path.
	 */
	public get appPathPkgInfo() {
		return 'Contents/PkgInfo';
	}

	/**
	 * Get app Frameworks path.
	 *
	 * @returns File path.
	 */
	public get appPathFrameworks() {
		return 'Contents/Frameworks';
	}

	/**
	 * Get app Xtras path.
	 *
	 * @returns Directory path.
	 */
	public get appPathXtras() {
		return `Contents/${this.xtrasDirectoryName}`;
	}

	/**
	 * Get app binary path.
	 *
	 * @returns File path.
	 */
	public get appPathBinary() {
		return this.appPathBinaryCustom || this.appPathBinaryDefault;
	}

	/**
	 * Get app binary path, default.
	 *
	 * @returns File path.
	 */
	public get appPathBinaryDefault() {
		return `Contents/MacOS/${this.appBinaryNameDefault}`;
	}

	/**
	 * Get app binary path, custom.
	 *
	 * @returns File path.
	 */
	public get appPathBinaryCustom() {
		const n = this.appBinaryNameCustom;
		return n ? `Contents/MacOS/${n}` : null;
	}

	/**
	 * Get app icon path.
	 *
	 * @returns File path.
	 */
	public get appPathIcon() {
		return this.appPathIconCustom || this.appPathIconDefault;
	}

	/**
	 * Get app icon path, default.
	 *
	 * @returns File path.
	 */
	public get appPathIconDefault() {
		return `Contents/Resources/${this.appIconNameDefault}`;
	}

	/**
	 * Get app icon path, custom.
	 *
	 * @returns File path.
	 */
	public get appPathIconCustom() {
		const n = this.appIconNameCustom;
		return n ? `Contents/Resources/${n}` : null;
	}

	/**
	 * Get app rsrc path.
	 *
	 * @returns File path.
	 */
	public get appPathRsrc() {
		return this.appPathRsrcCustom || this.appPathRsrcDefault;
	}

	/**
	 * Get app rsrc path, default.
	 *
	 * @returns File path.
	 */
	public get appPathRsrcDefault() {
		return `Contents/Resources/${this.appRsrcNameDefault}`;
	}

	/**
	 * Get app rsrc path, custom.
	 *
	 * @returns File path.
	 */
	public get appPathRsrcCustom() {
		const n = this.appRsrcNameCustom;
		return n ? `Contents/Resources/${n}` : null;
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
	 * Get Info.plist data if any specified, from data or file.
	 *
	 * @returns Info.plist data or null.
	 */
	public async getInfoPlistData() {
		return this._dataFromValueOrFile(
			this.infoPlistData,
			this.infoPlistFile,
			'\n',
			'utf8'
		);
	}

	/**
	 * Get PkgInfo data if any specified, from data or file.
	 *
	 * @returns PkgInfo data or null.
	 */
	public async getPkgInfoData() {
		return this._dataFromValueOrFile(
			this.pkgInfoData,
			this.pkgInfoFile,
			null,
			'ascii'
		);
	}

	/**
	 * Get the Xtras path.
	 *
	 * @param name Save name.
	 * @returns Xtras path.
	 */
	public getXtrasPath(name: string) {
		if (this.nestXtrasContents) {
			return `${name}/${this.appPathXtras}`;
		}
		return super.getXtrasPath(name);
	}

	/**
	 * Get the icon path.
	 *
	 * @param name Save name.
	 * @returns Icon path.
	 */
	public getIconPath(name: string) {
		return `${name}/${this.appPathIcon}`;
	}

	/**
	 * Get the Info.plist path.
	 *
	 * @param name Save name.
	 * @returns Icon path.
	 */
	public getInfoPlistPath(name: string) {
		return `${name}/${this.appPathInfoPlist}`;
	}

	/**
	 * Get the PkgInfo path.
	 *
	 * @param name Save name.
	 * @returns Icon path.
	 */
	public getPkgInfoPath(name: string) {
		return `${name}/${this.appPathPkgInfo}`;
	}

	/**
	 * Update XML code with customized variables.
	 *
	 * @param xml Plist code.
	 * @param name Application name.
	 * @returns Updated XML.
	 */
	public updateInfoPlistCode(xml: string, name: string) {
		const {
			appBinaryNameCustom,
			appIconNameCustom
		} = this;

		if (appBinaryNameCustom) {
			xml = infoPlistReplace(
				xml,
				'CFBundleExecutable',
				plistStringTagEncode(appBinaryNameCustom)
			);
		}
		if (appIconNameCustom) {
			xml = infoPlistReplace(
				xml,
				'CFBundleIconFile',
				plistStringTagEncode(appIconNameCustom)
			);
		}
		xml = infoPlistReplace(
			xml,
			'CFBundleName',
			plistStringTagEncode(this.getProjectorNameNoExtension(name))
		);

		return xml;
	}

	/**
	 * Write out the projector.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	public async write(path: string, name: string) {
		await super.write(path, name);

		await this._writeIcon(path, name);
		await this._writePkgInfo(path, name);
		await this._writeInfoPlist(path, name);
		await this._updateInfoPlist(path, name);
	}

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeSkeleton(path: string, name: string) {
		const {
			hasIcon,
			hasInfoPlist,
			hasPkgInfo,
			shockwave,

			appPathInfoPlist,
			appPathPkgInfo,
			appPathFrameworks,

			appPathBinaryDefault,
			appPathBinaryCustom,

			appPathIconDefault,
			appPathIconCustom,

			appPathRsrcDefault,
			appPathRsrcCustom,

			xtrasDirectoryName,

			projectorResourcesDirectoryName
		} = this;

		const xtrasPath = this.getXtrasPath(name);
		const xtrasMappings = this.getIncludeXtrasMappings();

		let foundProjectorResourcesDirectory = false;
		let foundFrameworks = false;
		let foundBinary = false;
		let foundInfoPlist = false;
		let foundPkgInfo = false;
		let foundIcon = false;
		let foundRsrc = false;
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

		const projectorResourcesHandler = async (entry: Entry) => {
			// Check if projector path.
			const projectorRel = pathRelativeBase(
				entry.volumePath,
				projectorResourcesDirectoryName,
				true
			);
			if (projectorRel === null) {
				return false;
			}
			foundProjectorResourcesDirectory = true;

			if (pathRelativeBaseMatch(
				projectorRel,
				appPathFrameworks,
				true
			)) {
				foundFrameworks = true;

				// Exclude Frameworks directory for Shockwave projectors.
				if (shockwave) {
					return true;
				}
			}

			// Exclude Info.plist if using custom one.
			if (pathRelativeBaseMatch(
				projectorRel,
				appPathInfoPlist,
				true
			)) {
				foundInfoPlist = true;

				if (hasInfoPlist) {
					return true;
				}
			}

			// Exclude PkgInfo if using custom one.
			if (pathRelativeBaseMatch(
				projectorRel,
				appPathPkgInfo,
				true
			)) {
				foundPkgInfo = true;

				if (hasPkgInfo) {
					return true;
				}
			}

			let dest = projectorRel;

			// Possibly rename the binary.
			if (pathRelativeBaseMatch(
				projectorRel,
				appPathBinaryDefault,
				true
			)) {
				foundBinary = true;

				if (appPathBinaryCustom) {
					dest = appPathBinaryCustom;
				}
			}

			// Special case for icon.
			if (pathRelativeBaseMatch(
				projectorRel,
				appPathIconDefault,
				true
			)) {
				foundIcon = true;

				// Skip extracting icon if custom one.
				if (hasIcon) {
					return true;
				}

				// Possible rename the icon.
				if (appPathIconCustom) {
					dest = appPathIconCustom;
				}
			}

			// Special case for rsrc.
			if (pathRelativeBaseMatch(
				projectorRel,
				appPathRsrcDefault,
				true
			)) {
				foundRsrc = true;

				if (appPathRsrcCustom) {
					dest = appPathRsrcCustom;
				}
			}

			await entry.extract(pathJoin(path, name, dest));
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

			if (await projectorResourcesHandler(entry)) {
				return;
			}
		});

		if (!foundProjectorResourcesDirectory) {
			throw new Error(
				`Failed to locate: ${projectorResourcesDirectoryName}`
			);
		}

		if (!foundFrameworks) {
			const d = projectorResourcesDirectoryName;
			throw new Error(`Failed to locate: ${d}/${appPathFrameworks}`);
		}

		if (!foundBinary) {
			const d = projectorResourcesDirectoryName;
			throw new Error(`Failed to locate: ${d}/${appPathBinaryDefault}`);
		}

		if (!foundInfoPlist) {
			const d = projectorResourcesDirectoryName;
			throw new Error(`Failed to locate: ${d}/${appPathInfoPlist}`);
		}

		if (!foundPkgInfo) {
			// Some projector skeletons lack this file.
			// const d = projectorResourcesDirectoryName;
			// throw new Error(`Failed to locate: ${d}/${appPathPkgInfo}`);
		}

		if (!foundIcon) {
			const d = projectorResourcesDirectoryName;
			throw new Error(`Failed to locate: ${d}/${appPathIconDefault}`);
		}

		if (!foundRsrc) {
			const d = projectorResourcesDirectoryName;
			throw new Error(`Failed to locate: ${d}/${appPathRsrcDefault}`);
		}

		if (!foundXtras) {
			throw new Error(`Failed to locate: ${xtrasDirectoryName}`);
		}
	}

	/**
	 * Write out the projector icon file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeIcon(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getIconData(),
			pathJoin(path, this.getIconPath(name))
		);
	}

	/**
	 * Write out the projector PkgInfo file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writePkgInfo(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getPkgInfoData(),
			pathJoin(path, this.getPkgInfoPath(name))
		);
	}

	/**
	 * Write out the projector Info.plist file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeInfoPlist(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getInfoPlistData(),
			pathJoin(path, this.getInfoPlistPath(name))
		);
	}

	/**
	 * Update the projector Info.plist file fields.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _updateInfoPlist(path: string, name: string) {
		const file = pathJoin(path, this.getInfoPlistPath(name));
		let data = await this._dataFromBufferOrFile(null, file);
		if (!data) {
			throw new Error('Failed to read Info.plist or updating');
		}

		// Decode buffer, and update.
		const xmlOriginal = data.toString('utf8');
		const xml = this.updateInfoPlistCode(xmlOriginal, name);

		// If unchanged, all done.
		if (xml === xmlOriginal) {
			return;
		}

		// Encode data and write.
		data = Buffer.from(xml, 'utf8');
		await this._maybeWriteFile(
			data,
			pathJoin(path, this.getInfoPlistPath(name))
		);
	}
}
