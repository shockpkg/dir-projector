import {createReadStream, createWriteStream} from 'node:fs';
import {
	chmod,
	lstat,
	mkdir,
	readFile,
	readlink,
	stat,
	symlink,
	utimes
} from 'node:fs/promises';
import {Readable, pipeline} from 'node:stream';
import {join as pathJoin, dirname, basename, resolve} from 'node:path';
import {promisify} from 'node:util';

import {
	fsLchmod,
	fsLutimes,
	fsWalk,
	fsLstatExists
} from '@shockpkg/archive-files';

import {once} from './util';
import {Queue} from './queue';
import {Projector} from './projector';

const pipe = promisify(pipeline);

const userExec = 0b001000000;

/**
 * Options for adding resources.
 */
export interface IBundleResourceOptions {
	//
	/**
	 * Access time.
	 */
	atime?: null | Date;

	/**
	 * Copy source atime if not set.
	 */
	atimeCopy?: null | boolean;

	/**
	 * Modification time.
	 */
	mtime?: null | Date;

	/**
	 * Copy source mtime if not set.
	 */
	mtimeCopy?: null | boolean;

	/**
	 * Mark files and symlinks as executable.
	 */
	executable?: null | boolean;

	/**
	 * Copy source executable if not set.
	 */
	executableCopy?: null | boolean;

	/**
	 * Optionally merge directory contents.
	 */
	merge?: null | boolean;

	/**
	 * Skip recursive directory copy.
	 */
	noRecurse?: null | boolean;
}

/**
 * Bundle object.
 */
export abstract class Bundle {
	/**
	 * File and directory names to exclude when adding a directory.
	 */
	public excludes = [/^\./, /^ehthumbs\.db$/, /^Thumbs\.db$/];

	/**
	 * Bundle main executable path.
	 */
	public readonly path: string;

	/**
	 * Projector instance.
	 */
	public abstract readonly projector: Projector;

	/**
	 * Open flag.
	 */
	protected _isOpen = false;

	/**
	 * Close callbacks priority queue.
	 */
	protected _closeQueue = new Queue();

	/**
	 * Bundle constructor.
	 *
	 * @param path Output path for the main executable.
	 */
	constructor(path: string) {
		this.path = path;
	}

	/**
	 * Check if output open.
	 *
	 * @returns Returns true if open, else false.
	 */
	public get isOpen() {
		return this._isOpen;
	}

	/**
	 * Check if name is excluded file.
	 *
	 * @param name File name.
	 * @returns Returns true if excluded, else false.
	 */
	public isExcludedFile(name: string) {
		for (const exclude of this.excludes) {
			if (exclude.test(name)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Open output with file.
	 *
	 * @param player Player path.
	 * @param configFile Config file.
	 */
	public async openFile(player: string, configFile: string | null) {
		const configData = configFile ? await readFile(configFile) : null;
		await this.openData(player, configData);
	}

	/**
	 * Open output with data.
	 *
	 * @param player Player path.
	 * @param configData Config data.
	 */
	public async openData(player: string, configData: Readonly<Buffer> | null) {
		if (this._isOpen) {
			throw new Error('Already open');
		}
		await this._checkOutput();

		this._closeQueue.clear();
		await this._openData(player, configData);

		this._isOpen = true;
	}

	/**
	 * Close output.
	 */
	public async close() {
		this._assertIsOpen();

		try {
			await this._close();
		} finally {
			this._closeQueue.clear();
		}

		this._isOpen = false;
	}

	/**
	 * Write out projector with player and file.
	 * Has a callback to write out the resources.
	 *
	 * @param player Player path.
	 * @param configFile Config file.
	 * @param func Async function.
	 * @returns Return value of the async function.
	 */
	public async withFile<T>(
		player: string,
		configFile: string | null,
		func: ((self: this) => Promise<T>) | null = null
	) {
		const configData = configFile ? await readFile(configFile) : null;
		return this.withData(player, configData, func);
	}

	/**
	 * Write out projector with player and data.
	 * Has a callback to write out the resources.
	 *
	 * @param player Player path.
	 * @param configData Config data.
	 * @param func Async function.
	 * @returns Return value of the async function.
	 */
	public async withData<T>(
		player: string,
		configData: Readonly<Buffer> | null,
		func: ((self: this) => Promise<T>) | null = null
	) {
		await this.openData(player, configData);
		try {
			return func ? await func.call(this, this) : null;
		} finally {
			await this.close();
		}
	}

	/**
	 * Get path for resource.
	 *
	 * @param destination Resource destination.
	 * @returns Destination path.
	 */
	public resourcePath(destination: string) {
		return pathJoin(dirname(this.projector.path), destination);
	}

	/**
	 * Check if path for resource exists.
	 *
	 * @param destination Resource destination.
	 * @returns True if destination exists, else false.
	 */
	public async resourceExists(destination: string) {
		return !!(await fsLstatExists(this.resourcePath(destination)));
	}

	/**
	 * Copy resource, detecting source type automatically.
	 *
	 * @param destination Resource destination.
	 * @param source Source directory.
	 * @param options Resource options.
	 */
	public async copyResource(
		destination: string,
		source: string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		const stat = await lstat(source);
		switch (true) {
			case stat.isSymbolicLink(): {
				await this.copyResourceSymlink(destination, source, options);
				break;
			}
			case stat.isFile(): {
				await this.copyResourceFile(destination, source, options);
				break;
			}
			case stat.isDirectory(): {
				await this.copyResourceDirectory(destination, source, options);
				break;
			}
			default: {
				throw new Error(`Unsupported resource type: ${source}`);
			}
		}
	}

	/**
	 * Copy directory as resource, recursive copy.
	 *
	 * @param destination Resource destination.
	 * @param source Source directory.
	 * @param options Resource options.
	 */
	public async copyResourceDirectory(
		destination: string,
		source: string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		// Create directory.
		await this.createResourceDirectory(
			destination,
			options
				? await this._expandResourceOptionsCopy(options, async () =>
						stat(source)
				  )
				: options
		);

		// If not recursive do not walk contents.
		if (options && options.noRecurse) {
			return;
		}

		// Any directories we add should not be recursive.
		const opts = {
			...(options || {}),
			noRecurse: true
		};
		await fsWalk(source, async (path, stat) => {
			// If this name is excluded, skip without descending.
			if (this.isExcludedFile(basename(path))) {
				return false;
			}

			await this.copyResource(
				pathJoin(destination, path),
				pathJoin(source, path),
				opts
			);
			return true;
		});
	}

	/**
	 * Copy file as resource.
	 *
	 * @param destination Resource destination.
	 * @param source Source file.
	 * @param options Resource options.
	 */
	public async copyResourceFile(
		destination: string,
		source: string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		await this.streamResourceFile(
			destination,
			createReadStream(source),
			options
				? await this._expandResourceOptionsCopy(options, async () =>
						stat(source)
				  )
				: options
		);
	}

	/**
	 * Copy symlink as resource.
	 *
	 * @param destination Resource destination.
	 * @param source Source symlink.
	 * @param options Resource options.
	 */
	public async copyResourceSymlink(
		destination: string,
		source: string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		await this.createResourceSymlink(
			destination,
			await readlink(source),
			options
				? await this._expandResourceOptionsCopy(options, async () =>
						lstat(source)
				  )
				: options
		);
	}

	/**
	 * Create a resource directory.
	 *
	 * @param destination Resource destination.
	 * @param options Resource options.
	 */
	public async createResourceDirectory(
		destination: string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		const dest = await this._assertNotResourceExists(
			destination,
			!!(options && options.merge)
		);
		await mkdir(dest, {recursive: true});

		// If either is set, queue up change times when closing.
		if (options && (options.atime || options.mtime)) {
			// Get absolute path, use length for the priority.
			// Also copy the options object which the owner could change.
			const abs = resolve(dest);
			this._closeQueue.push(
				this._setResourceAttributes.bind(this, abs, {...options}),
				abs.length
			);
		}
	}

	/**
	 * Create a resource file.
	 *
	 * @param destination Resource destination.
	 * @param data Resource data.
	 * @param options Resource options.
	 */
	public async createResourceFile(
		destination: string,
		data: Readonly<Buffer> | string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		await this.streamResourceFile(
			destination,
			new Readable({
				/**
				 * Read method.
				 */
				read() {
					this.push(data);
					this.push(null);
				}
			}),
			options
		);
	}

	/**
	 * Create a resource symlink.
	 *
	 * @param destination Resource destination.
	 * @param target Symlink target.
	 * @param options Resource options.
	 */
	public async createResourceSymlink(
		destination: string,
		target: Readonly<Buffer> | string,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		const dest = await this._assertNotResourceExists(destination);
		await mkdir(dirname(dest), {recursive: true});
		await symlink(target, dest);

		if (options) {
			await this._setResourceAttributes(dest, options);
		}
	}

	/**
	 * Stream readable source to resource file.
	 *
	 * @param destination Resource destination.
	 * @param data Resource stream.
	 * @param options Resource options.
	 */
	public async streamResourceFile(
		destination: string,
		data: Readable,
		options: Readonly<IBundleResourceOptions> | null = null
	) {
		this._assertIsOpen();

		const dest = await this._assertNotResourceExists(destination);
		await mkdir(dirname(dest), {recursive: true});
		await pipe(data, createWriteStream(dest));

		if (options) {
			await this._setResourceAttributes(dest, options);
		}
	}

	/**
	 * Check that output path is valid, else throws.
	 */
	protected async _checkOutput() {
		for (const p of [this.path, this.resourcePath('')]) {
			// eslint-disable-next-line no-await-in-loop
			if (await fsLstatExists(p)) {
				throw new Error(`Output path already exists: ${p}`);
			}
		}
	}

	/**
	 * Expand resource options copy properties with stat object from source.
	 *
	 * @param options Options object.
	 * @param stat Stat function.
	 * @returns Options copy with any values populated.
	 */
	protected async _expandResourceOptionsCopy(
		options: Readonly<IBundleResourceOptions>,
		stat: () => Promise<{
			atime: Date;
			mtime: Date;
			mode: number;
		}>
	) {
		const r = {...options} as IBundleResourceOptions;
		const st = once(stat);
		if (!r.atime && r.atimeCopy) {
			r.atime = (await st()).atime;
		}
		if (!r.mtime && r.mtimeCopy) {
			r.mtime = (await st()).mtime;
		}
		if (typeof r.executable !== 'boolean' && r.executableCopy) {
			r.executable = this._getResourceModeExecutable((await st()).mode);
		}
		return r;
	}

	/**
	 * Set resource attributes from options object.
	 *
	 * @param path File path.
	 * @param options Options object.
	 */
	protected async _setResourceAttributes(
		path: string,
		options: Readonly<IBundleResourceOptions>
	) {
		const {atime, mtime, executable} = options;
		const st = await lstat(path);

		// Maybe set executable if not a directory.
		if (typeof executable === 'boolean' && !st.isDirectory()) {
			if (st.isSymbolicLink()) {
				await fsLchmod(
					path,
					this._setResourceModeExecutable(
						// Workaround for a legacy Node issue.
						// eslint-disable-next-line no-bitwise
						st.mode & 0b111111111,
						executable
					)
				);
			} else {
				await chmod(
					path,
					this._setResourceModeExecutable(st.mode, executable)
				);
			}
		}

		// Maybe change times if either is set.
		if (atime || mtime) {
			if (st.isSymbolicLink()) {
				await fsLutimes(path, atime || st.atime, mtime || st.mtime);
			} else {
				await utimes(path, atime || st.atime, mtime || st.mtime);
			}
		}
	}

	/**
	 * Get file mode executable.
	 *
	 * @param mode Current mode.
	 * @returns Is executable.
	 */
	protected _getResourceModeExecutable(mode: number) {
		// eslint-disable-next-line no-bitwise
		return !!(mode & userExec);
	}

	/**
	 * Set file mode executable.
	 *
	 * @param mode Current mode.
	 * @param executable Is executable.
	 * @returns File mode.
	 */
	protected _setResourceModeExecutable(mode: number, executable: boolean) {
		// eslint-disable-next-line no-bitwise
		return (executable ? mode | userExec : mode & ~userExec) >>> 0;
	}

	/**
	 * Open output with data.
	 *
	 * @param player Player path.
	 * @param configData Config data.
	 */
	protected async _openData(
		player: string,
		configData: Readonly<Buffer> | null
	) {
		await this.projector.withData(player, configData);
	}

	/**
	 * Close output.
	 */
	protected async _close() {
		await this._writeLauncher();
		await this._closeQueue.run();
	}

	/**
	 * Assert bundle is open.
	 */
	protected _assertIsOpen() {
		if (!this._isOpen) {
			throw new Error('Not open');
		}
	}

	/**
	 * Assert resource does not exist, returning destination path.
	 *
	 * @param destination Resource destination.
	 * @param ignoreDirectory Ignore directories.
	 * @returns Destination path.
	 */
	protected async _assertNotResourceExists(
		destination: string,
		ignoreDirectory = false
	) {
		const dest = this.resourcePath(destination);
		const st = await fsLstatExists(dest);
		if (st && (!ignoreDirectory || !st.isDirectory())) {
			throw new Error(`Resource path exists: ${dest}`);
		}
		return dest;
	}

	/**
	 * Main application file extension.
	 *
	 * @returns File extension.
	 */
	public abstract get extension(): string;

	/**
	 * Create projector instance for the bundle.
	 *
	 * @returns Projector instance.
	 */
	protected abstract _createProjector(): Projector;

	/**
	 * Write the launcher file.
	 */
	protected abstract _writeLauncher(): Promise<void>;
}
