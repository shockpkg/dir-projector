import {describe, it} from 'node:test';
import {copyFile} from 'fs/promises';
import {join as pathJoin} from 'path';

import {ProjectorDummy} from './projector.spec';
import {cleanProjectorDir, fixtureFile} from './util.spec';

const getDir = async (d: string) => cleanProjectorDir('dummy', d);

describe('projector', () => {
	describe('ProjectorDummy', () => {
		it('simple', async () => {
			const dir = await getDir('simple');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorDummy(dest);
			await p.withFile('dummy', fixtureFile('config.ini.crlf.bin'));

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		it('lingo', async () => {
			const dir = await getDir('lingo');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorDummy(dest);
			p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
			await p.withFile('dummy', fixtureFile('config.ini.crlf.bin'));

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		it('splash', async () => {
			const dir = await getDir('splash');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorDummy(dest);
			p.splashImageFile = fixtureFile('splash.bmp');
			await p.withFile('dummy', fixtureFile('config.ini.crlf.bin'));

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		it('complex', async () => {
			const dir = await getDir('complex');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorDummy(dest);
			p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
			p.splashImageFile = fixtureFile('splash.bmp');
			await p.withFile('dummy', fixtureFile('config.ini.crlf.bin'));

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});
	});
});
