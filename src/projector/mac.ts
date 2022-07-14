import {Projector} from '../projector';

/**
 * ProjectorMac object.
 */
export abstract class ProjectorMac extends Projector {
	/**
	 * ProjectorMac constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
	}

	/**
	 * Splash image file extension.
	 *
	 * @returns File extension.
	 */
	public get splashImageExtension() {
		return '.pict';
	}
}
