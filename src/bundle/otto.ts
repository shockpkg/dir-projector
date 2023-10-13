import {ProjectorOtto} from '../projector/otto';
import {Bundle} from '../bundle';

/**
 * BundleOtto object.
 */
export abstract class BundleOtto extends Bundle {
	/**
	 * ProjectorOtto instance.
	 */
	public abstract readonly projector: ProjectorOtto;

	/**
	 * ProjectorOtto constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
	}

	/**
	 * @inheritdoc
	 */
	protected async _close(): Promise<void> {
		await this._writeLauncher();
		await super._close();
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
	protected abstract _createProjector(): ProjectorOtto;

	/**
	 * Write the launcher file.
	 */
	protected abstract _writeLauncher(): Promise<void>;
}
