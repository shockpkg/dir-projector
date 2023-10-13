import {mkdir, open, writeFile} from 'node:fs/promises';
import {join as pathJoin, basename, dirname} from 'node:path';

import {trimExtension} from '../../util';
import {windowsLauncher} from '../../util/windows';
import {ProjectorOttoWindows} from '../../projector/otto/windows';
import {BundleOtto} from '../otto';

/**
 * BundleOttoWindows object.
 */
export class BundleOttoWindows extends BundleOtto {
	/**
	 * ProjectorOttoWindows instance.
	 */
	public readonly projector: ProjectorOttoWindows;

	/**
	 * BundleOttoWindows constructor.
	 *
	 * @param path Output path for the main application.
	 */
	constructor(path: string) {
		super(path);

		this.projector = this._createProjector();
	}

	/**
	 * @inheritdoc
	 */
	public get extension() {
		return '.exe';
	}

	/**
	 * @inheritdoc
	 */
	protected _createProjector() {
		const {path, extension} = this;
		const directory = trimExtension(path, extension, true);
		if (directory === path) {
			throw new Error(`Output path must end with: ${extension}`);
		}
		return new ProjectorOttoWindows(pathJoin(directory, basename(path)));
	}

	/**
	 * @inheritdoc
	 */
	protected async _writeLauncher() {
		const {path, projector} = this;

		const data = Buffer.alloc(4);
		const f = await open(projector.path, 'r');
		try {
			await f.read(data, 0, 4, 60);
			await f.read(data, 0, 2, data.readUInt32LE() + 4);
		} finally {
			await f.close();
		}

		const machine = data.readUInt16LE();
		let launcher = null;
		switch (machine) {
			case 0x14c: {
				launcher = await windowsLauncher('i686', projector.path);
				break;
			}
			default: {
				throw new Error(`Unknown machine type: ${machine}`);
			}
		}

		await mkdir(dirname(path), {recursive: true});
		await writeFile(path, launcher);
	}
}
