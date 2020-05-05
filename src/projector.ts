import {
	join as pathJoin,
	dirname
} from 'path';

import {
	Archive,
	ArchiveDir,
	ArchiveHdi,
	createArchiveByFileExtension
} from '@shockpkg/archive-files';
import fse from 'fs-extra';

import {
	pathRelativeBase,
	trimExtension
} from './util';

export interface IIncludeXtraMapping {

	/**
	 * Source path, case insensitive.
	 * Does not need to match the full path.
	 */
	src: string;

	/**
	 * Destination path, case sensitive.
	 * Only matches same amount of the full path as src.
	 */
	dest: string | null;
}

export interface IIncludeXtraMappingBest {

	/**
	 * Map instance.
	 */
	map: IIncludeXtraMapping;

	/**
	 * Relative path.
	 */
	relative: string;
}

export interface IIncludeXtras {
	[key: string]: string | null;
}

/**
 * Projector constructor.
 *
 * @param path Output path.
 */
export abstract class Projector extends Object {
	/**
	 * Make a Shockwave projector.
	 *
	 * @default false
	 */
	public shockwave: boolean = false;

	/**
	 * Splash image file.
	 *
	 * @default null
	 */
	public splashImageFile: string | null = null;

	/**
	 * Splash image data.
	 *
	 * @default null
	 */
	public splashImageData: Readonly<Buffer> | null = null;

	/**
	 * Lingo file.
	 *
	 * @default null
	 */
	public lingoFile: string | null = null;

	/**
	 * Lingo data.
	 *
	 * @default null
	 */
	public lingoData: (
		Readonly<string[]> | string | Readonly<Buffer> | null
	) = null;

	/**
	 * Xtras include map.
	 *
	 * @default null
	 */
	public includeXtras: Readonly<IIncludeXtras> | null = null;

	/**
	 * Nest xtras in a Configuration directory.
	 *
	 * @default false
	 */
	public nestXtrasConfiguration: boolean = false;

	/**
	 * Path to hdiutil binary.
	 *
	 * @default null
	 */
	public pathToHdiutil: string | null = null;

	/**
	 * Output path.
	 */
	public readonly path: string;

	constructor(path: string) {
		super();

		this.path = path;
	}

	/**
	 * Config file extension.
	 *
	 * @returns File extension.
	 */
	public get configExtension() {
		return '.INI';
	}

	/**
	 * Config file encoding.
	 *
	 * @returns File encoding.
	 */
	public get configEncoding() {
		return 'ascii' as BufferEncoding;
	}

	/**
	 * Lingo file name.
	 *
	 * @returns File name.
	 */
	public get lingoName() {
		return 'LINGO.INI';
	}

	/**
	 * Lingo file encoding.
	 *
	 * @returns File encoding.
	 */
	public get lingoEncoding() {
		return 'ascii' as BufferEncoding;
	}

	/**
	 * Xtras directory name.
	 *
	 * @returns Directory encoding.
	 */
	public get xtrasName() {
		return 'xtras';
	}

	/**
	 * Configuration directory name.
	 *
	 * @returns Directory encoding.
	 */
	public get configurationName() {
		return 'Configuration';
	}

	/**
	 * Name of a projector trimming the extension, case insensitive.
	 *
	 * @returns Projector name without extension.
	 */
	public get name() {
		return trimExtension(dirname(this.path), this.extension, true);
	}

	/**
	 * Config file path.
	 *
	 * @returns Config path.
	 */
	public get configPath() {
		const base = trimExtension(this.path, this.extension, true);
		return `${base}${this.configExtension}`;
	}

	/**
	 * Splash image file path.
	 *
	 * @returns Splash image path.
	 */
	public get splashImagePath() {
		const base = trimExtension(this.path, this.extension, true);
		return `${base}${this.splashImageExtension}`;
	}

	/**
	 * Lingo file path.
	 *
	 * @returns Lingo file path.
	 */
	public get lingoPath() {
		return pathJoin(dirname(this.path), this.lingoName);
	}

	/**
	 * Get outout Xtras path.
	 *
	 * @returns Output path.
	 */
	public get xtrasPath() {
		const cn = this.configurationName;
		return (this.nestXtrasConfiguration && cn) ?
			pathJoin(dirname(this.path), cn, this.xtrasName) :
			pathJoin(dirname(this.path), this.xtrasName);
	}

	/**
	 * Get splash image data if any specified, from data or file.
	 *
	 * @returns Splash image data or null.
	 */
	public async getSplashImageData() {
		const {splashImageData, splashImageFile} = this;
		return splashImageData || (
			splashImageFile ? fse.readFile(splashImageFile) : null
		);
	}

	/**
	 * Get lingo data if any specified, from data or file.
	 *
	 * @returns Lingo data or null.
	 */
	public async getLingoData() {
		const {lingoData, lingoFile} = this;
		if (typeof lingoData === 'string') {
			return Buffer.from(lingoData, this.lingoEncoding);
		}
		if (Array.isArray(lingoData)) {
			return Buffer.from(
				lingoData.join(this.lingoNewline),
				this.lingoEncoding
			);
		}
		if (lingoData) {
			return lingoData as Readonly<Buffer>;
		}
		return lingoFile ? fse.readFile(lingoFile) : null;
	}

	/**
	 * Get the skeleton file or directory as an Archive instance.
	 *
	 * @param skeleton Skeleton path.
	 * @returns Archive instance.
	 */
	public async getSkeletonArchive(skeleton: string): Promise<Archive> {
		const stat = await fse.stat(skeleton);
		if (stat.isDirectory()) {
			return new ArchiveDir(skeleton);
		}
		if (!stat.isFile()) {
			throw new Error('Projector skeleton not file or directory');
		}

		const r = createArchiveByFileExtension(skeleton);
		if (!r) {
			throw new Error('Projector skeleton archive file type unknown');
		}

		if (r instanceof ArchiveHdi) {
			const {pathToHdiutil} = this;
			if (pathToHdiutil) {
				r.mounterMac.hdiutil = pathToHdiutil;
			}
			r.nobrowse = true;
		}
		return r;
	}

	/**
	 * Get include Xtras as a list of mappings.
	 *
	 * @returns Mappings list.
	 */
	public getIncludeXtrasMappings() {
		const {includeXtras} = this;
		const r: IIncludeXtraMapping[] = [];
		if (includeXtras) {
			for (const src of Object.keys(includeXtras)) {
				const dest = includeXtras[src];
				r.push({
					src,
					dest
				});
			}
		}
		return r;
	}

	/**
	 * Find the best match for a path in a list of Xtras mappings.
	 * Path search is case-insensitive.
	 *
	 * @param mappings Mappings list.
	 * @param path Path to search for.
	 * @returns Best match or null.
	 */
	public findIncludeXtrasMappingsBestMatch(
		mappings: Readonly<IIncludeXtraMapping[]>,
		path: string
	) {
		let best: IIncludeXtraMappingBest | null = null;
		let bestScore = -1;
		for (const map of mappings) {
			const {src} = map;
			const relative = src === '' ?
				path :
				pathRelativeBase(path, src, true);
			if (relative === null || bestScore >= src.length) {
				continue;
			}
			best = {
				map,
				relative
			};
			bestScore = src.length;
		}
		return best;
	}

	/**
	 * Find output path for an Xtra.
	 *
	 * @param mappings Mappings list.
	 * @param path Path to search for.
	 * @returns Output path or null.
	 */
	public includeXtrasMappingsDest(
		mappings: Readonly<IIncludeXtraMapping[]>,
		path: string
	) {
		const best = this.findIncludeXtrasMappingsBestMatch(mappings, path);
		if (!best) {
			return null;
		}

		const {map, relative} = best;
		const base = map.dest || map.src;
		// eslint-disable-next-line no-nested-ternary
		return base ? (relative ? `${base}/${relative}` : base) : relative;
	}

	/**
	 * Write out projector with skeleton and config file.
	 *
	 * @param skeleton Skeleton path.
	 * @param configFile Config file.
	 */
	public async withFile(skeleton: string, configFile: string | null) {
		const configData = configFile ? await fse.readFile(configFile) : null;
		await this.withData(skeleton, configData);
	}

	/**
	 * Write out projector with skeleton and config data.
	 *
	 * @param skeleton Skeleton path.
	 * @param configData Config data.
	 */
	public async withData(
		skeleton: string,
		configData: Readonly<string[]> | string | Readonly<Buffer> | null
	) {
		await this._checkOutput();
		await this._writeSkeleton(skeleton);
		await this._modifySkeleton();
		await this._writeConfig(configData);
		await this._writeSplashImage();
		await this._writeLingo();
	}

	/**
	 * Check that output path is valid, else throws.
	 */
	protected async _checkOutput() {
		for (const p of [
			this.path,
			this.configPath,
			this.splashImagePath,
			this.lingoPath
		]) {
			// eslint-disable-next-line no-await-in-loop
			if (await fse.pathExists(p)) {
				throw new Error(`Output path already exists: ${p}`);
			}
		}
	}

	/**
	 * Write out the projector config file.
	 *
	 * @param configData Config data.
	 */
	protected async _writeConfig(
		configData: Readonly<string[]> | string | Readonly<Buffer> | null
	) {
		let data: Readonly<Buffer> | null = null;
		if (typeof configData === 'string') {
			data = Buffer.from(configData, this.configEncoding);
		}
		else if (Array.isArray(data)) {
			data = Buffer.from(
				(configData as string[]).join(this.configNewline),
				this.configEncoding
			);
		}
		else if (configData) {
			data = configData as Readonly<Buffer>;
		}

		if (data) {
			await fse.outputFile(this.configPath, data);
		}
	}

	/**
	 * Write out the projector splash image file.
	 */
	protected async _writeSplashImage() {
		const data = await this.getSplashImageData();
		if (data) {
			await fse.outputFile(this.splashImagePath, data);
		}
	}

	/**
	 * Write out the projector lingo file.
	 */
	protected async _writeLingo() {
		const data = await this.getLingoData();
		if (data) {
			await fse.outputFile(this.lingoPath, data);
		}
	}

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public abstract get extension(): string;

	/**
	 * Splash image file extension.
	 *
	 * @returns File extension.
	 */
	public abstract get splashImageExtension(): string;

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public abstract get configNewline(): string;

	/**
	 * Lingo file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public abstract get lingoNewline(): string;

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param skeleton Skeleton path.
	 */
	protected abstract async _writeSkeleton(skeleton: string): Promise<void>;

	/**
	 * Modify the projector skeleton.
	 */
	protected abstract async _modifySkeleton(): Promise<void>;
}
