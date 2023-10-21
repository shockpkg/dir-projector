import {readFile, mkdir, writeFile, chmod} from 'node:fs/promises';
import {join as pathJoin, basename, dirname} from 'node:path';

import {
	PathType,
	Entry,
	createArchiveByFileStatOrThrow,
	fsLchmodSupported,
	fsLchmod
} from '@shockpkg/archive-files';
import {Plist, ValueDict, ValueString} from '@shockpkg/plist-dom';

import {
	pathRelativeBase,
	pathRelativeBaseMatch,
	trimExtension
} from '../../util';
import {IFilePatch, ProjectorOtto} from '../otto';

/**
 * ProjectorOttoMac object.
 */
export class ProjectorOttoMac extends ProjectorOtto {
	/**
	 * Binary name.
	 */
	public binaryName: string | null = null;

	/**
	 * Intel binary package, not universal binary.
	 */
	public intel = false;

	/**
	 * Icon data.
	 */
	public iconData:
		| Readonly<Uint8Array>
		| (() => Readonly<Uint8Array>)
		| (() => Promise<Readonly<Uint8Array>>)
		| null = null;

	/**
	 * Icon file.
	 */
	public iconFile: string | null = null;

	/**
	 * Info.plist data.
	 * Currently only supports XML plist.
	 */
	public infoPlistData:
		| string
		| Readonly<Uint8Array>
		| (() => string | Readonly<Uint8Array>)
		| (() => Promise<string | Readonly<Uint8Array>>)
		| null = null;

	/**
	 * Info.plist file.
	 * Currently only supports XML plist.
	 */
	public infoPlistFile: string | null = null;

	/**
	 * PkgInfo data.
	 */
	public pkgInfoData:
		| string
		| Readonly<Uint8Array>
		| (() => Readonly<Uint8Array>)
		| (() => Promise<Readonly<Uint8Array>>)
		| null = null;

	/**
	 * PkgInfo file.
	 */
	public pkgInfoFile: string | null = null;

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
	 */
	public nestXtrasContents = false;

	/**
	 * ProjectorOttoMac constructor.
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
		return '.app';
	}

	/**
	 * @inheritdoc
	 */
	public get configNewline() {
		return '\n';
	}

	/**
	 * @inheritdoc
	 */
	public get lingoNewline() {
		return '\n';
	}

	/**
	 * @inheritdoc
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
	 * Get Info.plist data if any specified, from data or file.
	 *
	 * @returns Info.plist data or null.
	 */
	public async getInfoPlistData() {
		const {infoPlistData, infoPlistFile} = this;
		if (infoPlistData) {
			switch (typeof infoPlistData) {
				case 'function': {
					const d = await infoPlistData();
					return typeof d === 'string'
						? d
						: new TextDecoder().decode(d);
				}
				case 'string': {
					return infoPlistData;
				}
				default: {
					// Fall through.
				}
			}
			return new TextDecoder().decode(infoPlistData);
		}
		if (infoPlistFile) {
			return readFile(infoPlistFile, 'utf8');
		}
		return null;
	}

	/**
	 * Get PkgInfo data if any specified, from data or file.
	 *
	 * @returns PkgInfo data or null.
	 */
	public async getPkgInfoData() {
		const {pkgInfoData, pkgInfoFile} = this;
		if (pkgInfoData) {
			switch (typeof pkgInfoData) {
				case 'function': {
					return pkgInfoData();
				}
				case 'string': {
					return new TextEncoder().encode(pkgInfoData);
				}
				default: {
					// Fall through.
				}
			}
			return pkgInfoData;
		}
		if (pkgInfoFile) {
			const d = await readFile(pkgInfoFile);
			return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
		}
		return null;
	}

	/**
	 * Get configured bundle name, or null to remove.
	 *
	 * @returns New name or null.
	 */
	public getBundleName() {
		const {bundleName} = this;
		return bundleName === true
			? trimExtension(basename(this.path), this.extension, true)
			: bundleName;
	}

	/**
	 * @inheritdoc
	 */
	protected async _writeSkeleton(skeleton: string) {
		const {
			path,
			shockwave,
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
		let foundIcon = false;
		let foundRsrc = false;
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
					// eslint-disable-next-line no-await-in-loop
					data = await patch.modify(data);
				}
			}

			if (data) {
				await mkdir(dirname(dest), {recursive: true});
				await writeFile(dest, data);
				const {mode} = entry;
				if (mode) {
					if (fsLchmodSupported) {
						await fsLchmod(dest, mode);
					} else {
						await chmod(dest, mode);
					}
				}
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
		 * Resources handler.
		 *
		 * @param entry Archive entry.
		 * @returns Boolean.
		 */
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

			if (pathRelativeBaseMatch(projectorRel, appPathFrameworks, true)) {
				foundFrameworks = true;

				// Exclude Frameworks directory for Shockwave projectors.
				if (shockwave) {
					return true;
				}
			}

			let dest = projectorRel;

			// Possibly rename the binary.
			if (
				pathRelativeBaseMatch(projectorRel, appPathBinaryDefault, true)
			) {
				foundBinary = true;

				if (appPathBinaryCustom) {
					dest = appPathBinaryCustom;
				}
			}

			// Special case for icon.
			if (pathRelativeBaseMatch(projectorRel, appPathIconDefault, true)) {
				foundIcon = true;

				// Possible rename the icon.
				if (appPathIconCustom) {
					dest = appPathIconCustom;
				}
			}

			// Special case for rsrc.
			if (pathRelativeBaseMatch(projectorRel, appPathRsrcDefault, true)) {
				foundRsrc = true;

				if (appPathRsrcCustom) {
					dest = appPathRsrcCustom;
				}
			}

			await extract(entry, pathJoin(path, dest));
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

			if (await projectorResourcesHandler(entry)) {
				return true;
			}

			return true;
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

		await Promise.all(patches.map(async p => p.after()));
	}

	/**
	 * Get patches to apply.
	 *
	 * @returns Patches list.
	 */
	protected async _getPatches() {
		return (
			await Promise.all([
				this._getPatchIcon(),
				this._getPatchPkgInfo(),
				this._getPatchInfoPlist()
			])
		).filter(p => p) as IFilePatch[];
	}

	/**
	 * Get patch for icon.
	 *
	 * @returns Patch spec.
	 */
	protected async _getPatchIcon() {
		const iconData = await this.getIconData();
		if (!iconData) {
			return null;
		}

		const {projectorResourcesDirectoryName, appPathIconDefault} = this;

		let count = 0;

		const patch: IFilePatch = {
			// eslint-disable-next-line jsdoc/require-jsdoc
			match: (file: string) => {
				const projectorRel = pathRelativeBase(
					file,
					projectorResourcesDirectoryName,
					true
				);
				return (
					projectorRel !== null &&
					pathRelativeBaseMatch(
						projectorRel,
						appPathIconDefault,
						true
					)
				);
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			modify: (data: Uint8Array) => {
				count++;
				return iconData;
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			after: () => {
				if (!count) {
					const d = projectorResourcesDirectoryName;
					const f = appPathIconDefault;
					throw new Error(`Failed to locate for replace: ${d}/${f}`);
				}
			}
		};
		return patch;
	}

	/**
	 * Get patch for PkgInfo.
	 *
	 * @returns Patch spec.
	 */
	protected async _getPatchPkgInfo() {
		const infoData = await this.getPkgInfoData();
		if (!infoData) {
			return null;
		}

		const {projectorResourcesDirectoryName, appPathPkgInfo} = this;

		let count = 0;

		const patch: IFilePatch = {
			// eslint-disable-next-line jsdoc/require-jsdoc
			match: (file: string) => {
				const projectorRel = pathRelativeBase(
					file,
					projectorResourcesDirectoryName,
					true
				);
				return (
					projectorRel !== null &&
					pathRelativeBaseMatch(projectorRel, appPathPkgInfo, true)
				);
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			modify: (data: Uint8Array) => {
				count++;
				return infoData;
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			after: async () => {
				// Some skeletons lack this file, just write in that case.
				if (!count) {
					const {pkgInfoPath} = this;
					await mkdir(dirname(pkgInfoPath), {recursive: true});
					await writeFile(pkgInfoPath, infoData);
				}
			}
		};
		return patch;
	}

	/**
	 * Get patch for Info.plist.
	 *
	 * @returns Patch spec.
	 */
	protected async _getPatchInfoPlist() {
		const customPlist = await this.getInfoPlistData();
		const bundleName = this.getBundleName();
		const {
			appBinaryNameCustom,
			appIconNameCustom,
			projectorResourcesDirectoryName,
			appPathInfoPlist
		} = this;
		if (
			!(
				customPlist !== null ||
				appIconNameCustom ||
				appBinaryNameCustom ||
				bundleName !== false
			)
		) {
			return null;
		}

		let count = 0;

		const patch: IFilePatch = {
			// eslint-disable-next-line jsdoc/require-jsdoc
			match: (file: string) => {
				const projectorRel = pathRelativeBase(
					file,
					projectorResourcesDirectoryName,
					true
				);
				return (
					projectorRel !== null &&
					pathRelativeBaseMatch(projectorRel, appPathInfoPlist, true)
				);
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			modify: (data: Uint8Array) => {
				// Use a custom plist or the existing one.
				const xml = customPlist ?? new TextDecoder().decode(data);

				const plist = new Plist();
				plist.fromXml(xml);
				const dict = plist.getValue().castAs(ValueDict);

				if (appIconNameCustom) {
					dict.set(
						'CFBundleIconFile',
						new ValueString(appIconNameCustom)
					);
				}

				if (appBinaryNameCustom) {
					dict.set(
						'CFBundleExecutable',
						new ValueString(appBinaryNameCustom)
					);
				}

				if (bundleName !== false) {
					const key = 'CFBundleName';
					if (bundleName === null) {
						dict.delete(key);
					} else {
						dict.set(key, new ValueString(bundleName));
					}
				}

				const plistData = new TextEncoder().encode(plist.toXml());

				count++;
				return plistData;
			},
			// eslint-disable-next-line jsdoc/require-jsdoc
			after: () => {
				if (!count) {
					const d = projectorResourcesDirectoryName;
					const f = appPathInfoPlist;
					throw new Error(`Failed to locate for update: ${d}/${f}`);
				}
			}
		};
		return patch;
	}
}
