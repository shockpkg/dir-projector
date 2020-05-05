import {
	join as pathJoin,
	basename
} from 'path';

import fse from 'fs-extra';
import {
	PathType,
	Entry
} from '@shockpkg/archive-files';
import {
	Plist
} from '@shockpkg/plist-dom';

import {
	pathRelativeBase,
	pathRelativeBaseMatch,
	trimExtension
} from '../../util';
import {
	plistRead,
	plistParse,
	infoPlistBundleExecutableSet,
	infoPlistBundleIconFileSet,
	infoPlistBundleNameSet
} from '../../util/mac';
import {
	ProjectorMac
} from '../mac';

/**
 * ProjectorMacApp constructor.
 *
 * @param path Output path.
 */
export class ProjectorMacApp extends ProjectorMac {
	/**
	 * Binary name.
	 *
	 * @default null
	 */
	public binaryName: string | null = null;

	/**
	 * Intel binary package, not universal binary.
	 *
	 * @default false
	 */
	public intel = false;

	/**
	 * Icon file.
	 *
	 * @default null
	 */
	public iconFile: string | null = null;

	/**
	 * Icon data.
	 *
	 * @default null
	 */
	public iconData: Readonly<Buffer> | null = null;

	/**
	 * Info.plist file.
	 * Currently only supports XML plist.
	 */
	public infoPlistFile: string | null = null;

	/**
	 * Info.plist data.
	 * Currently only supports XML plist.
	 */
	public infoPlistData: (
		string | Readonly<string[]> | Readonly<Buffer> | null
	) = null;

	/**
	 * Info.plist document.
	 */
	public infoPlistDocument: Plist | null = null;

	/**
	 * PkgInfo file.
	 *
	 * @default null
	 */
	public pkgInfoFile: string | null = null;

	/**
	 * PkgInfo data.
	 *
	 * @default null
	 */
	public pkgInfoData: string | Readonly<Buffer> | null = null;

	/**
	 * Update the bundle name in Info.plist.
	 * Possible values:
	 * - false: Leave untouched.
	 * - true: Output name.
	 * - null: Remove value.
	 * - string: Custom value.
	 */
	public bundleName: boolean | string | null = false;

	/**
	 * Nest Xtras at *.app/Contents/xtras.
	 *
	 * @default false
	 */
	public nestXtrasContents = false;

	constructor(path: string) {
		super(path);
	}

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public get extension() {
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
	 * Get app binary name.
	 *
	 * @returns File name.
	 */
	public get appBinaryName() {
		return this.appBinaryNameCustom || this.appBinaryNameDefault;
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
	 * Get app icon name.
	 *
	 * @returns File name.
	 */
	public get appIconName() {
		return this.appIconNameCustom || this.appIconNameDefault;
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
	 * Get app rsrc name.
	 *
	 * @returns File name.
	 */
	public get appRsrcName() {
		return this.appRsrcNameCustom || this.appRsrcNameDefault;
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
		return `Contents/${this.xtrasName}`;
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
	 * Get app binary path.
	 *
	 * @returns File path.
	 */
	public get appPathBinary() {
		return this.appPathBinaryCustom || this.appPathBinaryDefault;
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
	 * Get app icon path.
	 *
	 * @returns File path.
	 */
	public get appPathIcon() {
		return this.appPathIconCustom || this.appPathIconDefault;
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
	 * Get app rsrc path.
	 *
	 * @returns File path.
	 */
	public get appPathRsrc() {
		return this.appPathRsrcCustom || this.appPathRsrcDefault;
	}

	/**
	 * Get the icon path.
	 *
	 * @returns Icon path.
	 */
	public get iconPath() {
		return pathJoin(this.path, this.appPathIcon);
	}

	/**
	 * Get the Info.plist path.
	 *
	 * @returns Info.plist path.
	 */
	public get infoPlistPath() {
		return pathJoin(this.path, this.appPathInfoPlist);
	}

	/**
	 * Get the PkgInfo path.
	 *
	 * @returns PkgInfo path.
	 */
	public get pkgInfoPath() {
		return pathJoin(this.path, this.appPathPkgInfo);
	}

	/**
	 * Get the binary path.
	 *
	 * @returns Binary path.
	 */
	public get binaryPath() {
		return pathJoin(this.path, this.appPathBinary);
	}

	/**
	 * Get outout Xtras path.
	 *
	 * @returns Output path.
	 */
	public get xtrasPath() {
		if (this.nestXtrasContents) {
			return `${this.path}/${this.appPathXtras}`;
		}
		return super.xtrasPath;
	}

	/**
	 * Get icon data if any specified, from data or file.
	 *
	 * @returns Icon data or null.
	 */
	public async getIconData() {
		const {iconData, iconFile} = this;
		return iconData || (iconFile ? fse.readFile(iconFile) : null);
	}

	/**
	 * Get Info.plist data if any specified, document, data, or file.
	 *
	 * @returns Info.plist data or null.
	 */
	public async getInfoPlistDocument() {
		const {
			infoPlistDocument,
			infoPlistData,
			infoPlistFile
		} = this;
		let xml;
		if (infoPlistDocument) {
			xml = infoPlistDocument.toXml();
		}
		else if (typeof infoPlistData === 'string') {
			xml = infoPlistData;
		}
		else if (Array.isArray(infoPlistData)) {
			xml = infoPlistData.join('\n');
		}
		else if (infoPlistData) {
			xml = (infoPlistData as Readonly<Buffer>).toString('utf8');
		}
		else if (infoPlistFile) {
			xml = await fse.readFile(infoPlistFile, 'utf8');
		}
		else {
			return null;
		}
		return plistParse(xml);
	}

	/**
	 * Get PkgInfo data if any specified, from data or file.
	 *
	 * @returns PkgInfo data or null.
	 */
	public async getPkgInfoData() {
		const {pkgInfoData, pkgInfoFile} = this;
		if (typeof pkgInfoData === 'string') {
			return Buffer.from(pkgInfoData, 'ascii');
		}
		return pkgInfoData || (pkgInfoFile ? fse.readFile(pkgInfoFile) : null);
	}

	/**
	 * Get configured bundle name, or null to remove.
	 *
	 * @returns New name or null.
	 */
	public getBundleName() {
		const {bundleName} = this;
		return bundleName === true ?
			trimExtension(basename(this.path), this.extension, true) :
			bundleName;
	}

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param skeleton Skeleton path.
	 */
	protected async _writeSkeleton(skeleton: string) {
		const {
			path,

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

			xtrasName,
			xtrasPath,

			projectorResourcesDirectoryName
		} = this;

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
				xtrasName,
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

			await entry.extract(pathJoin(xtrasPath, dest));
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

			await entry.extract(pathJoin(path, dest));
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
			throw new Error(`Failed to locate: ${xtrasName}`);
		}
	}

	/**
	 * Modify the projector skeleton.
	 */
	protected async _modifySkeleton() {
		await this._writeIcon();
		await this._writePkgInfo();
		await this._updateInfoPlist();
	}

	/**
	 * Write out the projector icon file.
	 */
	protected async _writeIcon() {
		const data = await this.getIconData();
		if (data) {
			await fse.outputFile(this.iconPath, data);
		}
	}

	/**
	 * Write out the projector PkgInfo file.
	 */
	protected async _writePkgInfo() {
		const data = await this.getPkgInfoData();
		if (data) {
			await fse.outputFile(this.pkgInfoPath, data);
		}
	}

	/**
	 * Update the projector Info.plist if needed.
	 */
	protected async _updateInfoPlist() {
		const customPlist = await this.getInfoPlistDocument();
		const bundleName = this.getBundleName();
		const {
			appBinaryNameCustom,
			appIconNameCustom
		} = this;
		if (!(
			customPlist ||
			appIconNameCustom ||
			appBinaryNameCustom ||
			bundleName !== false
		)) {
			return;
		}

		// Use a custom plist or the existing one.
		const plist = customPlist || (await this._readInfoPlist());

		// Update values.
		if (appIconNameCustom) {
			infoPlistBundleIconFileSet(plist, appIconNameCustom);
		}
		if (appBinaryNameCustom) {
			infoPlistBundleExecutableSet(plist, appBinaryNameCustom);
		}
		if (bundleName !== false) {
			infoPlistBundleNameSet(plist, bundleName);
		}

		// Write out the plist.
		await this._writeInfoPlist(plist);
	}

	/**
	 * Read the projector Info.plist file.
	 *
	 * @returns Plist document.
	 */
	protected async _readInfoPlist() {
		return plistRead(this.infoPlistPath);
	}

	/**
	 * Write the projector Info.plist file.
	 *
	 * @param plist Plist document.
	 */
	protected async _writeInfoPlist(plist: Plist) {
		const path = this.infoPlistPath;
		await fse.remove(path);
		await fse.outputFile(path, plist.toXml(), 'utf8');
	}
}
