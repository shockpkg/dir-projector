import {
	Projector
} from '../projector';

/**
 * ProjectorMac constructor.
 *
 * @param path Output path.
 */
export abstract class ProjectorMac extends Projector {
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
