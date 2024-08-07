import {mkdir, open, readFile, writeFile} from 'node:fs/promises';
import {join as pathJoin, basename, dirname} from 'node:path';

import {trimExtension} from '../../util.ts';
import {windowsLauncher} from '../../util/windows.ts';
import {ProjectorOttoWindows} from '../../projector/otto/windows.ts';
import {BundleOtto} from '../otto.ts';

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
	 * @param flat Flat bundle.
	 */
	constructor(path: string, flat = false) {
		super(path, flat);

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
	protected _getProjectorPathNested(): string {
		const {path, extension} = this;
		const directory = trimExtension(path, extension, true);
		if (directory === path) {
			throw new Error(`Output path must end with: ${extension}`);
		}
		return pathJoin(directory, basename(path));
	}

	/**
	 * @inheritdoc
	 */
	protected _createProjector() {
		return new ProjectorOttoWindows(this._getProjectorPath());
	}

	/**
	 * @inheritdoc
	 */
	protected async _writeLauncher() {
		const {path, projector} = this;

		const d = new Uint8Array(4);
		const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
		const f = await open(projector.path, 'r');
		try {
			let r = await f.read(d, 0, 4, 60);
			if (r.bytesRead < 4) {
				throw new Error('Unknown format');
			}
			r = await f.read(d, 0, 2, v.getUint32(0, true) + 4);
			if (r.bytesRead < 2) {
				throw new Error('Unknown format');
			}
		} finally {
			await f.close();
		}

		const machine = v.getUint16(0, true);
		// eslint-disable-next-line jsdoc/require-jsdoc
		const res = async () => readFile(projector.path);
		let launcher = null;
		switch (machine) {
			case 0x14c: {
				launcher = await windowsLauncher('i686', res);
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
