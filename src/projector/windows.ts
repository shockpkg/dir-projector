import {join as pathJoin, dirname} from 'path';

import fse from 'fs-extra';
import {Entry, PathType} from '@shockpkg/archive-files';

import {pathRelativeBase, pathRelativeBaseMatch} from '../util';
import {peResourceReplace} from '../util/windows';
import {Projector} from '../projector';

/**
 * ProjectorWindows object.
 */
export abstract class ProjectorWindows extends Projector {
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
		return iconData || (iconFile ? fse.readFile(iconFile) : null);
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
	}
}
