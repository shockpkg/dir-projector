import {describe, it} from 'node:test';
import {strictEqual} from 'node:assert';
import {createHash} from 'node:crypto';

import {windowsLauncher} from './windows.ts';

function sha256(data: Uint8Array) {
	return createHash('sha256').update(data).digest('hex');
}

const launcherTypes = [
	['i686', '166e5cb9228842e98e59d0cae1578fd0d97c9754944dae6533678716f7fd1c1c']
];

void describe('util/windows', () => {
	void describe('windowsLauncher', () => {
		for (const [type, hash] of launcherTypes) {
			void it(type, async () => {
				const data = await windowsLauncher(type);
				strictEqual(sha256(data), hash);
			});
		}
	});
});
