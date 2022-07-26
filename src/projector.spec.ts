import {copyFile} from 'fs/promises';
import {join as pathJoin} from 'path';

import {Projector} from './projector';
import {cleanProjectorDir, fixtureFile} from './util.spec';

const getDir = async (d: string) => cleanProjectorDir('dummy', d);

export class ProjectorDummy extends Projector {
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
