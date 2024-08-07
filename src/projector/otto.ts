import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join as pathJoin, dirname} from 'node:path';

import {fsLstatExists} from '@shockpkg/archive-files';

import {Projector} from '../projector.ts';
import {pathRelativeBase, trimExtension} from '../util.ts';

/**
 * Include Xtra mapping.
 */
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

/**
 * Include Xtra mapping, best match.
 */
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

/**
 * Include Xtras.
 */
export interface IIncludeXtras {
	[key: string]: string | null;
}

/**
 * File patch.
 */
export interface IFilePatch {
	/**
	 * Check if skeleton file path matches.
	 *
	 * @param file File path.
	 * @returns If matched.
	 */
	match: (file: string) => boolean;

	/**
	 * Modify data, possibly inplace.
	 *
	 * @param data The data to modify.
	 * @returns Modified data.
	 */
	modify: (data: Uint8Array) => Promise<Uint8Array> | Uint8Array;

	/**
	 * Run after all patches.
	 */
	after: () => Promise<void> | void;
}

/**
 * ProjectorOtto object.
 */
export abstract class ProjectorOtto extends Projector {
	/**
	 * Make a Shockwave projector.
	 */
	public shockwave = false;

	/**
	 * Splash image data.
	 */
	public splashImageData:
		| Readonly<Uint8Array>
		| (() => Readonly<Uint8Array>)
		| null = null;

	/**
	 * Splash image file.
	 */
	public splashImageFile: string | null = null;

	/**
	 * Lingo data.
	 */
	public lingoData:
		| readonly string[]
		| string
		| Readonly<Uint8Array>
		| (() => readonly string[] | string | Readonly<Uint8Array>)
		| (() => Promise<readonly string[] | string | Readonly<Uint8Array>>)
		| null = null;

	/**
	 * Lingo file.
	 */
	public lingoFile: string | null = null;

	/**
	 * Xtras include map.
	 */
	public includeXtras: Readonly<IIncludeXtras> | null = null;

	/**
	 * Nest xtras in a Configuration directory.
	 */
	public nestXtrasConfiguration = false;

	/**
	 * Skeleton path.
	 */
	public skeleton: string | null = null;

	/**
	 * Config data.
	 */
	public configData:
		| readonly string[]
		| string
		| Readonly<Uint8Array>
		| (() => readonly string[] | string | Readonly<Uint8Array>)
		| (() => Promise<readonly string[] | string | Readonly<Uint8Array>>)
		| null = null;

	/**
	 * Config file.
	 */
	public configFile: string | null = null;

	/**
	 * ProjectorOtto constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
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
	 * Get config file data.
	 *
	 * @returns Config data or null.
	 */
	public async getConfigData() {
		const {configData, configFile} = this;
		if (configData) {
			switch (typeof configData) {
				case 'function': {
					const d = await configData();
					if (typeof d === 'string') {
						return new TextEncoder().encode(d);
					}
					if (Array.isArray(d)) {
						return new TextEncoder().encode(
							d.join(this.configNewline)
						);
					}
					return d as Readonly<Uint8Array>;
				}
				case 'string': {
					return new TextEncoder().encode(configData);
				}
				default: {
					// Fall through.
				}
			}
			if (Array.isArray(configData)) {
				return new TextEncoder().encode(
					configData.join(this.configNewline)
				);
			}
			return configData as Readonly<Uint8Array>;
		}
		if (configFile) {
			const d = await readFile(configFile);
			return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
		}
		return null;
	}

	/**
	 * Get splash image data if any specified, from data or file.
	 *
	 * @returns Splash image data or null.
	 */
	public async getSplashImageData() {
		const {splashImageData, splashImageFile} = this;
		if (splashImageData) {
			return typeof splashImageData === 'function'
				? splashImageData()
				: splashImageData;
		}
		if (splashImageFile) {
			const d = await readFile(splashImageFile);
			return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
		}
		return null;
	}

	/**
	 * Get lingo data if any specified, from data or file.
	 *
	 * @returns Lingo data or null.
	 */
	public async getLingoData() {
		const {lingoData, lingoFile} = this;
		if (lingoData) {
			switch (typeof lingoData) {
				case 'function': {
					const d = await lingoData();
					if (typeof d === 'string') {
						return new TextEncoder().encode(d);
					}
					if (Array.isArray(d)) {
						return new TextEncoder().encode(
							d.join(this.lingoNewline)
						);
					}
					return d as Readonly<Uint8Array>;
				}
				case 'string': {
					return new TextEncoder().encode(lingoData);
				}
				default: {
					// Fall through.
				}
			}
			if (Array.isArray(lingoData)) {
				return new TextEncoder().encode(
					lingoData.join(this.lingoNewline)
				);
			}
			return lingoData as Readonly<Uint8Array>;
		}
		if (lingoFile) {
			const d = await readFile(lingoFile);
			return new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
		}
		return null;
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
		mappings: readonly IIncludeXtraMapping[],
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
		mappings: readonly IIncludeXtraMapping[],
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
	 * @inheritdoc
	 */
	public async write() {
		const {skeleton} = this;
		if (!skeleton) {
			throw new Error('No projector skeleton configured');
		}

		await this._checkOutput();
		await this._writeSkeleton(skeleton);
		await this._writeConfig();
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
	 */
	protected async _writeConfig() {
		const data = await this.getConfigData();
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
	 * Write the projector skeleton.
	 *
	 * @param skeleton Skeleton path.
	 */
	protected abstract _writeSkeleton(skeleton: string): Promise<void>;
}
