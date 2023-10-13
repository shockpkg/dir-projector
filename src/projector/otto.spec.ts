import {ProjectorOtto} from './otto';

export class ProjectorOttoDummy extends ProjectorOtto {
	constructor(path: string) {
		super(path);
	}

	public get extension() {
		return '.exe';
	}

	public get configNewline() {
		return '\r\n';
	}

	public get lingoNewline() {
		return '\r\n';
	}

	public get splashImageExtension() {
		return '.BMP';
	}

	protected async _writeSkeleton(skeleton: string) {
		// Do nothing.
	}

	protected async _modifySkeleton() {
		// Do nothing.
	}
}
