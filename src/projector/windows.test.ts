import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {copyFile} from 'fs/promises';
import {join as pathJoin} from 'path';

import {cleanProjectorDir, fixtureFile, getPackageFile} from '../util.spec';
import {Projector} from '../projector';

import {ProjectorWindows} from './windows';
import {listSamples, versionStrings} from './windows.spec';

describe('projector/windows', () => {
	describe('ProjectorWindows', () => {
		it('instanceof Projector', () => {
			ok(ProjectorWindows.prototype instanceof Projector);
		});

		for (const {
			name,
			type,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('windows', type, name, d);
			const getSkeleton = async () => getPackageFile(name);

			// eslint-disable-next-line no-loop-func
			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patchShockwave3dInstalledDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.includeXtras = {
						Scripting: null,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Flash Asset': null,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.x32': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.includeXtras = {
						Scripting: 'Scripting RENAMED',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Flash Asset': 'Flash Asset RENAMED',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.x32': 'GIF Agent RENAMED.x32'
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('shockwave', async () => {
					const dir = await getDir('shockwave');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.shockwave = true;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patchShockwave3dInstalledDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows(dest);
					p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
					p.splashImageFile = fixtureFile('splash.bmp');
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patchShockwave3dInstalledDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					p.iconFile = fixtureFile('icon.ico');
					p.versionStrings = versionStrings;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});
			});
		}
	});
});
