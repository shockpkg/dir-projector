import {
	join as pathJoin,
	basename
} from 'path';

import {
	fsWalk
} from '@shockpkg/archive-files';

import {
	windowsPatchShockwave3dInstalledDisplayDriversSize
} from '../../util/windows';
import {
	ProjectorWindows
} from '../windows';

/**
 * ProjectorWindows32 constructor.
 *
 * @param path Output path.
 */
export class ProjectorWindows32 extends ProjectorWindows {
	/**
	 * Patch the Shockave 3D Xtra to have a larger buffer to avoid a crash.
	 * The buffer for resolving InstalledDisplayDrivers to a path is small.
	 * Changes to the values stored in InstalledDisplayDrivers cause issues.
	 * The value is now supposed to hold full paths on modern Windows.
	 * In particular, Nvidia drivers which do this need this patch.
	 *
	 * @default false
	 */
	public patchShockwave3dInstalledDisplayDriversSize = false;

	constructor(path: string) {
		super(path);
	}

	/**
	 * Modify the projector skeleton.
	 */
	protected async _modifySkeleton() {
		await super._modifySkeleton();

		await this._patchShockwave3dInstalledDisplayDriversSize();
	}

	/**
	 * Patch projector, Shockwave 3D InstalledDisplayDrivers size.
	 */
	protected async _patchShockwave3dInstalledDisplayDriversSize() {
		if (!this.patchShockwave3dInstalledDisplayDriversSize) {
			return;
		}

		const xtrasDir = this.xtrasPath;
		const search = 'Shockwave 3D Asset.x32';
		const searchLower = search.toLowerCase();

		let found = false;
		await fsWalk(xtrasDir, async (path, stat) => {
			if (!stat.isFile()) {
				return;
			}

			const fn = basename(path);
			if (fn.toLowerCase() !== searchLower) {
				return;
			}

			found = true;
			await windowsPatchShockwave3dInstalledDisplayDriversSize(
				pathJoin(xtrasDir, path)
			);
		}, {
			ignoreUnreadableDirectories: true
		});

		if (!found) {
			throw new Error(`Failed to locate for patching: ${search}`);
		}
	}
}
