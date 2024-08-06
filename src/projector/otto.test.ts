import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {copyFile} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';

import {cleanProjectorDir, fixtureFile} from '../util.spec.ts';
import {Projector} from '../projector.ts';

import {ProjectorOtto} from './otto.ts';
import {ProjectorOttoDummy} from './otto.spec.ts';

const getDir = async (d: string) => cleanProjectorDir('otto', 'dummy', d);

void describe('projector/otto', () => {
	void describe('ProjectorOttoDummy', () => {
		void it('instanceof', () => {
			ok(ProjectorOtto.prototype instanceof Projector);
		});

		void it('simple', async () => {
			const dir = await getDir('simple');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorOttoDummy(dest);
			p.skeleton = 'dummy';
			p.configFile = fixtureFile('config.ini.crlf.bin');
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		void it('lingo', async () => {
			const dir = await getDir('lingo');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorOttoDummy(dest);
			p.skeleton = 'dummy';
			p.configFile = fixtureFile('config.ini.crlf.bin');
			p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		void it('splash', async () => {
			const dir = await getDir('splash');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorOttoDummy(dest);
			p.skeleton = 'dummy';
			p.configFile = fixtureFile('config.ini.crlf.bin');
			p.splashImageFile = fixtureFile('splash.bmp');
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		void it('complex', async () => {
			const dir = await getDir('complex');
			const dest = pathJoin(dir, 'application.exe');

			const p = new ProjectorOttoDummy(dest);
			p.skeleton = 'dummy';
			p.configFile = fixtureFile('config.ini.crlf.bin');
			p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
			p.splashImageFile = fixtureFile('splash.bmp');
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});
	});
});
