import {
	join as pathJoin
} from 'path';

import {
	Archive,
	ArchiveDir,
	ArchiveHdi,
	createArchiveByFileExtension
} from '@shockpkg/archive-files';
import fse from 'fs-extra';

import {
	defaultFalse,
	defaultNull,
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

export interface IProjectorOptions {

	/**
	 * Skeleton file or directory.
	 *
	 * @default null
	 */
	skeleton?: string | null;

	/**
	 * Movie file.
	 *
	 * @default null
	 */
	movieFile?: string | null;

	/**
	 * Movie data.
	 *
	 * @default null
	 */
	movieData?: Buffer | null;

	/**
	 * Movie name.
	 *
	 * @default null
	 */
	movieName?: string | null;

	/**
	 * Make a Shockwave projector.
	 *
	 * @default false
	 */
	shockwave?: boolean;

	/**
	 * Config file.
	 *
	 * @default null
	 */
	configFile?: string | null;

	/**
	 * Config data.
	 *
	 * @default null
	 */
	configData?: string[] | string | Buffer | null;

	/**
	 * Lingo file.
	 *
	 * @default null
	 */
	lingoFile?: string | null;

	/**
	 * Lingo data.
	 *
	 * @default null
	 */
	lingoData?: string[] | string | Buffer | null;

	/**
	 * Splash image file.
	 *
	 * @default null
	 */
	splashImageFile?: string | null;

	/**
	 * Splash image data.
	 *
	 * @default null
	 */
	splashImageData?: Buffer | null;

	/**
	 * Xtras include map.
	 *
	 * @default null
	 */
	includeXtras?: IIncludeXtras | null;

	/**
	 * Nest xtras in a Configuration directory.
	 *
	 * @default false
	 */
	nestXtrasConfiguration?: boolean;

	/**
	 * Path to hdiutil binary.
	 *
	 * @default null
	 */
	pathToHdiutil?: string | null;
}

/**
 * Projector constructor.
 *
 * @param options Options object.
 */
export abstract class Projector extends Object {
	/**
	 * Skeleton file or directory.
	 *
	 * @default null
	 */
	public skeleton: string | null;

	/**
	 * Movie file.
	 *
	 * @default null
	 */
	public movieFile: string | null;

	/**
	 * Movie data.
	 *
	 * @default null
	 */
	public movieData: Readonly<Buffer> | null;

	/**
	 * Movie name.
	 *
	 * @default null
	 */
	public movieName: string | null;

	/**
	 * Movie data.
	 *
	 * @default false
	 */
	public shockwave: boolean;

	/**
	 * Config file.
	 *
	 * @default null
	 */
	public configFile: string | null;

	/**
	 * Config data.
	 *
	 * @default null
	 */
	public configData: Readonly<string[]> | string | Readonly<Buffer> | null;

	/**
	 * Lingo file.
	 *
	 * @default null
	 */
	public lingoFile: string | null;

	/**
	 * Lingo data.
	 *
	 * @default null
	 */
	public lingoData: Readonly<string[]> | string | Readonly<Buffer> | null;

	/**
	 * Splash image file.
	 *
	 * @default null
	 */
	public splashImageFile: string | null;

	/**
	 * Splash image data.
	 *
	 * @default null
	 */
	public splashImageData: Readonly<Buffer> | null;

	/**
	 * Xtras include map.
	 *
	 * @default null
	 */
	public includeXtras: Readonly<IIncludeXtras> | null;

	/**
	 * Nest xtras in a Configuration directory.
	 *
	 * @default false
	 */
	public nestXtrasConfiguration: boolean;

	/**
	 * Path to hdiutil binary.
	 *
	 * @default null
	 */
	public pathToHdiutil: string | null;

	constructor(options: Readonly<IProjectorOptions> = {}) {
		super();

		this.skeleton = defaultNull(options.skeleton);
		this.movieFile = defaultNull(options.movieFile);
		this.movieData = defaultNull(options.movieData);
		this.movieName = defaultNull(options.movieName);
		this.shockwave = defaultFalse(options.shockwave);
		this.configFile = defaultNull(options.configFile);
		this.configData = defaultNull(options.configData);
		this.lingoFile = defaultNull(options.lingoFile);
		this.lingoData = defaultNull(options.lingoData);
		this.splashImageFile = defaultNull(options.splashImageFile);
		this.splashImageData = defaultNull(options.splashImageData);
		this.includeXtras = defaultNull(options.includeXtras);
		this.nestXtrasConfiguration = defaultFalse(
			options.nestXtrasConfiguration
		);
		this.pathToHdiutil = defaultNull(options.pathToHdiutil);
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
	public get xtrasDirectoryName() {
		return 'xtras';
	}

	/**
	 * Configuration directory name.
	 *
	 * @returns Directory encoding.
	 */
	public get configurationDirectoryName() {
		return 'Configuration';
	}

	/**
	 * Get movie data if any specified, from data or file.
	 *
	 * @returns Movie data or null.
	 */
	public async getMovieData() {
		return this._dataFromBufferOrFile(
			this.movieData,
			this.movieFile
		);
	}

	/**
	 * Get config data if any specified, from data or file.
	 *
	 * @returns Config data or null.
	 */
	public async getConfigData() {
		return this._dataFromValueOrFile(
			this.configData,
			this.configFile,
			this.configNewline,
			this.configEncoding
		);
	}

	/**
	 * Get lingo data if any specified, from data or file.
	 *
	 * @returns Lingo data or null.
	 */
	public async getLingoData() {
		return this._dataFromValueOrFile(
			this.lingoData,
			this.lingoFile,
			this.lingoNewline,
			this.lingoEncoding
		);
	}

	/**
	 * Get splash image data if any specified, from data or file.
	 *
	 * @returns Splash image data or null.
	 */
	public async getSplashImageData() {
		return this._dataFromBufferOrFile(
			this.splashImageData,
			this.splashImageFile
		);
	}

	/**
	 * Get the name of a projector trimming the extension, case insensitive.
	 *
	 * @param name Projector name.
	 * @returns Projector name without extension.
	 */
	public getProjectorNameNoExtension(name: string) {
		return trimExtension(name, this.projectorExtension, true);
	}

	/**
	 * Get the Xtras path.
	 *
	 * @param name Save name.
	 * @returns Xtras path.
	 */
	public getXtrasPath(name: string) {
		const cdn = this.configurationDirectoryName;
		return this.nestXtrasConfiguration && cdn ?
			`${cdn}/${this.xtrasDirectoryName}` :
			this.xtrasDirectoryName;
	}

	/**
	 * Get the config path.
	 *
	 * @param name Save name.
	 * @returns Config path.
	 */
	public getConfigPath(name: string) {
		const n = this.getProjectorNameNoExtension(name);
		return `${n}${this.configExtension}`;
	}

	/**
	 * Get the splash image path.
	 *
	 * @param name Save name.
	 * @returns Config path.
	 */
	public getSplashImagePath(name: string) {
		const n = this.getProjectorNameNoExtension(name);
		return `${n}${this.splashImageExtension}`;
	}

	/**
	 * Get the skeleton file or directory as an Archive instance.
	 *
	 * @returns Archive instance.
	 */
	public async getSkeletonArchive(): Promise<Archive> {
		const {skeleton} = this;
		if (!skeleton) {
			throw new Error('Projector skeleton not specified');
		}

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
	 * Write out the projector.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	public async write(path: string, name: string) {
		await this._writeSkeleton(path, name);
		await this._writeMovie(path, name);
		await this._writeConfig(path, name);
		await this._writeSplashImage(path, name);
		await this._writeLingo(path, name);
	}

	/**
	 * Write out the projector movie file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeMovie(path: string, name: string) {
		const data = await this.getMovieData();
		if (!data) {
			return;
		}
		const {movieName} = this;
		if (!movieName) {
			throw new Error('Cannot write movie data without a movie name');
		}
		await fse.writeFile(pathJoin(path, movieName), data);
	}

	/**
	 * Write out the projector config file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeConfig(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getConfigData(),
			pathJoin(path, this.getConfigPath(name))
		);
	}

	/**
	 * Write out the projector splash image file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeSplashImage(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getSplashImageData(),
			pathJoin(path, this.getSplashImagePath(name))
		);
	}

	/**
	 * Write out the projector lingo file.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected async _writeLingo(path: string, name: string) {
		await this._maybeWriteFile(
			await this.getLingoData(),
			pathJoin(path, this.lingoName)
		);
	}

	/**
	 * Get data from buffer or file.
	 *
	 * @param data Data buffer.
	 * @param file File path.
	 * @returns Data buffer.
	 */
	protected async _dataFromBufferOrFile(
		data: Readonly<Buffer> | null,
		file: string | null
	) {
		if (data) {
			return data;
		}
		if (file) {
			return fse.readFile(file);
		}
		return null;
	}

	/**
	 * Get data from value or file.
	 *
	 * @param data Data value.
	 * @param file File path.
	 * @param newline Newline string.
	 * @param encoding String encoding.
	 * @returns Data buffer.
	 */
	protected async _dataFromValueOrFile(
		data: Readonly<string[]> | string | Readonly<Buffer> | null,
		file: string | null,
		newline: string | null,
		encoding: BufferEncoding | null
	) {
		let str: string | null = null;
		if (typeof data === 'string') {
			str = data;
		}
		else if (Array.isArray(data)) {
			if (newline === null) {
				throw new Error('New line delimiter required');
			}
			str = data.join(newline);
		}
		else {
			return this._dataFromBufferOrFile(data as any, file);
		}
		if (!encoding) {
			throw new Error('String data encoding required');
		}
		return Buffer.from(str, encoding);
	}

	/**
	 * Maybe write file if data is not null.
	 *
	 * @param data Data to maybe write.
	 * @param path Output path.
	 */
	protected async _maybeWriteFile(
		data: Readonly<Buffer> | null,
		path: string
	) {
		if (!data) {
			return;
		}
		await fse.writeFile(path, data);
	}

	/**
	 * Splash image file extension.
	 *
	 * @returns File extension.
	 */
	public abstract get splashImageExtension(): string;

	/**
	 * Projector file extension.
	 *
	 * @returns File extension.
	 */
	public abstract get projectorExtension(): string;

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public abstract get configNewline(): string;

	/**
	 * Config file newline characters.
	 *
	 * @returns Newline characters.
	 */
	public abstract get lingoNewline(): string;

	/**
	 * Write the projector skeleton from archive.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected abstract async _writeSkeleton(
		path: string,
		name: string
	): Promise<void>;
}
