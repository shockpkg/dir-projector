/* eslint-env jasmine */
/* eslint-disable max-classes-per-file */

import {
	IProjectorOptions,
	Projector
} from './projector';
import {
	cleanProjectorDir,
	fixtureFile
} from './util.spec';

class ProjectorDummyWindows extends Projector {
	constructor(options: IProjectorOptions = {}) {
		super(options);
	}

	public get projectorExtension() {
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

	protected async _writeSkeleton(path: string, name: string) {
		// Do nothing.
	}
}

class ProjectorDummyMac extends Projector {
	constructor(options: IProjectorOptions = {}) {
		super(options);
	}

	public get projectorExtension() {
		return '.app';
	}

	public get configNewline() {
		return '\n';
	}

	public get lingoNewline() {
		return '\n';
	}

	public get splashImageExtension() {
		return '.pict';
	}

	protected async _writeSkeleton(path: string, name: string) {
		// Do nothing.
	}
}

const classes = [
	{
		Projector: ProjectorDummyWindows,
		name: 'ProjectorDummyWindows',
		platform: 'windows',
		config: 'config.ini.crlf.bin',
		splash: 'splash.bmp',
		lingo: 'lingo.ini.crlf.bin'
	},
	{
		Projector: ProjectorDummyMac,
		name: 'ProjectorDummyMac',
		platform: 'mac',
		config: 'config.ini.lf.bin',
		splash: 'splash.pict',
		lingo: 'lingo.ini.lf.bin'
	}
];

describe('projector', () => {
	for (const o of classes) {
		const getDir = async (d: string) =>
			cleanProjectorDir('dummy', o.platform, d);

		describe(o.name, () => {
			it('simple', async () => {
				const dir = await getDir('simple');
				const projector = new o.Projector({
					movieFile: fixtureFile('dir7.dir'),
					movieName: 'movie.dir',
					configFile: fixtureFile(o.config)
				});
				await projector.write(
					dir,
					`application${projector.projectorExtension}`
				);
			});

			it('lingo', async () => {
				const dir = await getDir('lingo');
				const projector = new o.Projector({
					movieFile: fixtureFile('dir7.dir'),
					movieName: 'movie.dir',
					configFile: fixtureFile(o.config),
					lingoFile: fixtureFile(o.lingo)
				});
				await projector.write(
					dir,
					`application${projector.projectorExtension}`
				);
			});

			it('splash', async () => {
				const dir = await getDir('splash');
				const projector = new o.Projector({
					movieFile: fixtureFile('dir7.dir'),
					movieName: 'movie.dir',
					configFile: fixtureFile(o.config),
					splashImageFile: fixtureFile(o.splash)
				});
				await projector.write(
					dir,
					`application${projector.projectorExtension}`
				);
			});

			it('complex', async () => {
				const dir = await getDir('complex');
				const projector = new o.Projector({
					movieFile: fixtureFile('dir7.dir'),
					movieName: 'movie.dir',
					configFile: fixtureFile(o.config),
					lingoFile: fixtureFile(o.lingo),
					splashImageFile: fixtureFile(o.splash)
				});
				await projector.write(
					dir,
					`application${projector.projectorExtension}`
				);
			});
		});
	}
});
