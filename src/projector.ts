import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join as pathJoin, dirname} from 'node:path';

import {fsLstatExists} from '@shockpkg/archive-files';

import {pathRelativeBase, trimExtension} from './util';

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
 */
export abstract class Projector {
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
	public lingoData: Readonly<string[]> | string | Readonly<Buffer> | null =
		null;

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
	 * Set the nobrowse option on mounted disk images.
	 */
	public nobrowse = false;

	/**
	 * Output path.
	 */
	public readonly path: string;

	/**
	 * Projector constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
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
	 * Lingo file name.
	 *
	 * @returns File name.
	 */
	public get lingoName() {
		return 'LINGO.INI';
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
		return this.nestXtrasConfiguration && cn
			? pathJoin(dirname(this.path), cn, this.xtrasName)
			: pathJoin(dirname(this.path), this.xtrasName);
	}

	/**
	 * Get splash image data if any specified, from data or file.
	 *
	 * @returns Splash image data or null.
	 */
	public async getSplashImageData() {
		const {splashImageData, splashImageFile} = this;
		return (
			splashImageData ||
			(splashImageFile ? readFile(splashImageFile) : null)
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
			return Buffer.from(lingoData);
		}
		if (Array.isArray(lingoData)) {
			return Buffer.from(lingoData.join(this.lingoNewline));
		}
		if (lingoData) {
			return lingoData as Readonly<Buffer>;
		}
		return lingoFile ? readFile(lingoFile) : null;
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
			const relative =
				src === '' ? path : pathRelativeBase(path, src, true);
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
		const configData = configFile ? await readFile(configFile) : null;
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
		await Promise.all(
			[
				this.path,
				this.configPath,
				this.splashImagePath,
				this.lingoPath
			].map(async p => {
				if (await fsLstatExists(p)) {
					throw new Error(`Output path already exists: ${p}`);
				}
			})
		);
	}

	/**
	 * Write out the projector config file.
	 *
	 * @param configData Config data.
	 */
	protected async _writeConfig(
		configData: Readonly<string[]> | string | Readonly<Buffer> | null
	) {
		let data;
		if (typeof configData === 'string') {
			data = configData;
		} else if (Array.isArray(data)) {
			data = (configData as string[]).join(this.configNewline);
		} else if (configData) {
			data = configData as Readonly<Buffer>;
		}

		if (data) {
			const {configPath} = this;
			await mkdir(dirname(configPath), {recursive: true});
			await writeFile(configPath, data);
		}
	}

	/**
	 * Write out the projector splash image file.
	 */
	protected async _writeSplashImage() {
		const data = await this.getSplashImageData();
		if (data) {
			const {splashImagePath} = this;
			await mkdir(dirname(splashImagePath), {recursive: true});
			await writeFile(splashImagePath, data);
		}
	}

	/**
	 * Write out the projector lingo file.
	 */
	protected async _writeLingo() {
		const data = await this.getLingoData();
		if (data) {
			const {lingoPath} = this;
			await mkdir(dirname(lingoPath), {recursive: true});
			await writeFile(lingoPath, data);
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
	protected abstract _writeSkeleton(skeleton: string): Promise<void>;

	/**
	 * Modify the projector skeleton.
	 */
	protected abstract _modifySkeleton(): Promise<void>;
}
