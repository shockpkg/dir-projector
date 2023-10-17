import {basename, dirname, join as pathJoin} from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';

import {trimExtension} from '../util';
import {ProjectorOttoDummy} from '../projector/otto.spec';

import {BundleOtto} from './otto';

export class BundleOttoDummy extends BundleOtto {
	public readonly projector: ProjectorOttoDummy;

	constructor(path: string, flat = false) {
		super(path, flat);

		this.projector = this._createProjector();
	}

	public get extension() {
		return '.exe';
	}

	protected _getProjectorPathNested(): string {
		const {path, extension} = this;
		const directory = trimExtension(path, extension, true);
		if (directory === path) {
			throw new Error(`Output path must end with: ${extension}`);
		}
		return pathJoin(directory, basename(path));
	}

	protected _createProjector() {
		return new ProjectorOttoDummy(this._getProjectorPath());
	}

	protected async _writeLauncher() {
		await mkdir(dirname(this.path), {recursive: true});
		await writeFile(this.path, 'DUMMY_PE_LAUNCHER_EXE\n', 'utf8');
	}
}
