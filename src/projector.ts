import {
	Archive,
	ArchiveDir,
	ArchiveHdi,
	ArchiveTar,
	ArchiveTarGz,
	ArchiveZip
} from '@shockpkg/archive-files';
import {
	readFile as fseReadFile,
	stat as fseStat,
	writeFile as fseWriteFile
} from 'fs-extra';
import {
	join as pathJoin
} from 'path';

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
	 * @defaultValue null
	 */
	skeleton?: string | null;

	/**
	 * Movie file.
	 *
	 * @defaultValue null
	 */
	movieFile?: string | null;

	/**
	 * Movie data.
	 *
	 * @defaultValue null
	 */
	movieData?: Buffer | null;

	/**
	 * Movie name.
	 *
	 * @defaultValue null
	 */
	movieName?: string | null;

	/**
	 * Movie data.
	 *
	 * @defaultValue false
	 */
	shockwave?: boolean;

	/**
	 * Config file.
	 *
	 * @defaultValue null
	 */
	configFile?: string | null;

	/**
	 * Config data.
	 *
	 * @defaultValue null
	 */
	configData?: string[] | string | Buffer | null;

	/**
	 * Lingo file.
	 *
	 * @defaultValue null
	 */
	lingoFile?: string | null;

	/**
	 * Lingo data.
	 *
	 * @defaultValue null
	 */
	lingoData?: string[] | string | Buffer | null;

	/**
	 * Splash image file.
	 *
	 * @defaultValue null
	 */
	splashImageFile?: string | null;

	/**
	 * Splash image data.
	 *
	 * @defaultValue null
	 */
	splashImageData?: Buffer | null;

	/**
	 * Xtras include map.
	 *
	 * @defaultValue null
	 */
	includeXtras?: IIncludeXtras | null;

	/**
	 * Nest xtras in a Configuration directory.
	 *
	 * @defaultValue false
	 */
	nestXtrasConfiguration?: boolean;

	/**
	 * Path to hdiutil binary.
	 *
	 * @defaultValue null
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
	 * @defaultValue null
	 */
	public skeleton: string | null;

	/**
	 * Movie file.
	 *
	 * @defaultValue null
	 */
	public movieFile: string | null;

	/**
	 * Movie data.
	 *
	 * @defaultValue null
	 */
	public movieData: Buffer | null;

	/**
	 * Movie name.
	 *
	 * @defaultValue null
	 */
	public movieName: string | null;

	/**
	 * Movie data.
	 *
	 * @defaultValue false
	 */
	public shockwave: boolean;

	/**
	 * Config file.
	 *
	 * @defaultValue null
	 */
	public configFile: string | null;

	/**
	 * Config data.
	 *
	 * @defaultValue null
	 */
	public configData: string[] | string | Buffer | null;

	/**
	 * Lingo file.
	 *
	 * @defaultValue null
	 */
	public lingoFile: string | null;

	/**
	 * Lingo data.
	 *
	 * @defaultValue null
	 */
	public lingoData: string[] | string | Buffer | null;

	/**
	 * Splash image file.
	 *
	 * @defaultValue null
	 */
	public splashImageFile: string | null;

	/**
	 * Splash image data.
	 *
	 * @defaultValue null
	 */
	public splashImageData: Buffer | null;

	/**
	 * Xtras include map.
	 *
	 * @defaultValue null
	 */
	public includeXtras: IIncludeXtras | null;

	/**
	 * Nest xtras in a Configuration directory.
	 *
	 * @defaultValue false
	 */
	public nestXtrasConfiguration: boolean;

	/**
	 * Path to hdiutil binary.
	 *
	 * @defaultValue null
	 */
	public pathToHdiutil: string | null;

	constructor(options: IProjectorOptions = {}) {
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
	 * Splash image file extension.
	 */
	public abstract get splashImageExtension(): string;

	/**
	 * Projector file extension.
	 */
	public abstract get projectorExtension(): string;

	/**
	 * Config file extension.
	 */
	public get configExtension() {
		return '.INI';
	}

	/**
	 * Config file newline characters.
	 */
	public abstract get configNewline(): string;

	/**
	 * Config file encoding.
	 */
	public get configEncoding() {
		return 'ascii' as BufferEncoding;
	}

	/**
	 * Lingo file name.
	 */
	public get lingoName() {
		return 'LINGO.INI';
	}

	/**
	 * Config file newline characters.
	 */
	public abstract get lingoNewline(): string;

	/**
	 * Lingo file encoding.
	 */
	public get lingoEncoding() {
		return 'ascii' as BufferEncoding;
	}

	/**
	 * Xtras directory name.
	 */
	public get xtrasDirectoryName() {
		return 'xtras';
	}

	/**
	 * Configuration directory name.
	 */
	public get configurationDirectoryName() {
		return 'Configuration';
	}

	/**
	 * Get movie data if any specified, from data or file.
	 *
	 * @return Movie data or null.
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
	 * @return Config data or null.
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
	 * @return Lingo data or null.
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
	 * @return Splash image data or null.
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
	 * @return Projector name without extension.
	 */
	public getProjectorNameNoExtension(name: string) {
		return trimExtension(name, this.projectorExtension, true);
	}

	/**
	 * Get the Xtras path.
	 *
	 * @param name Save name.
	 * @return Xtras path.
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
	 * @return Config path.
	 */
	public getConfigPath(name: string) {
		const n = this.getProjectorNameNoExtension(name);
		return `${n}${this.configExtension}`;
	}

	/**
	 * Get the splash image path.
	 *
	 * @param name Save name.
	 * @return Config path.
	 */
	public getSplashImagePath(name: string) {
		const n = this.getProjectorNameNoExtension(name);
		return `${n}${this.splashImageExtension}`;
	}

	/**
	 * Get the skeleton file or directory as an Archive instance.
	 *
	 * @return Archive instance.
	 */
	public async getSkeletonArchive(): Promise<Archive> {
		const skeleton = this.skeleton;
		if (!skeleton) {
			throw new Error('Projector skeleton not specified');
		}

		const stat = await fseStat(skeleton);
		if (stat.isDirectory()) {
			return new ArchiveDir(skeleton);
		}
		if (!stat.isFile()) {
			throw new Error('Projector skeleton not file or directory');
		}

		if (/\.zip$/i.test(skeleton)) {
			return new ArchiveZip(skeleton);
		}
		if (/\.dmg$/i.test(skeleton)) {
			const r = new ArchiveHdi(skeleton);
			const pathToHdiutil = this.pathToHdiutil;
			if (pathToHdiutil) {
				r.mounterMac.hdiutil = pathToHdiutil;
			}
			r.nobrowse = true;
			return r;
		}
		if (/\.tar$/i.test(skeleton)) {
			return new ArchiveTar(skeleton);
		}
		if (
			/\.tar\.gz$/i.test(skeleton) ||
			/\.tgz$/i.test(skeleton)
		) {
			return new ArchiveTarGz(skeleton);
		}

		throw new Error('Projector skeleton archive file type unknown');
	}

	/**
	 * Get include Xtras as a list of mappings.
	 *
	 * @return Mappings list.
	 */
	public getIncludeXtrasMappings() {
		const includeXtras = this.includeXtras;
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
	 * @return Best match or null.
	 */
	public findIncludeXtrasMappingsBestMatch(
		mappings: IIncludeXtraMapping[],
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
	 * @return Output path or null.
	 */
	public includeXtrasMappingsDest(
		mappings: IIncludeXtraMapping[],
		path: string
	) {
		const best = this.findIncludeXtrasMappingsBestMatch(mappings, path);
		if (!best) {
			return null;
		}

		const {map, relative} = best;
		const base = map.dest || map.src;
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
	 * Write the projector skeleton from archive.
	 *
	 * @param path Save path.
	 * @param name Save name.
	 */
	protected abstract async _writeSkeleton(path: string, name: string):
		Promise<void>;

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
		const movieName = this.movieName;
		if (!movieName) {
			throw new Error('Cannot write movie data without a movie name');
		}
		await fseWriteFile(pathJoin(path, movieName), data);
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
	 * @return Data buffer.
	 */
	protected async _dataFromBufferOrFile(
		data: Buffer | null,
		file: string | null
	) {
		if (data) {
			return data;
		}
		if (file) {
			return fseReadFile(file);
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
	 * @return Data buffer.
	 */
	protected async _dataFromValueOrFile(
		data: string[] | string | Buffer | null,
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
			return this._dataFromBufferOrFile(data, file);
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
		data: Buffer | null,
		path: string
	) {
		if (!data) {
			return;
		}
		await fseWriteFile(path, data);
	}
}
