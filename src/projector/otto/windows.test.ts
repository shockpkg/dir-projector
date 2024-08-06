import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {copyFile} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';

import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile
} from '../../util.spec.ts';
import {ProjectorOtto} from '../otto.ts';

import {ProjectorOttoWindows} from './windows.ts';
import {listSamples, versionStrings} from './windows.spec.ts';

void describe('projector/otto/windows', () => {
	void describe('ProjectorOttoWindows', () => {
		void it('instanceof', () => {
			ok(ProjectorOttoWindows.prototype instanceof ProjectorOtto);
		});

		for (const {
			name,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('otto', 'windows', name, d);
			const getSkeleton = async () => getPackageFile(name);

			void describe(name, () => {
				void it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patch3dDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.includeXtras = {
						Scripting: null,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Flash Asset': null,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.x32': null
					};
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.includeXtras = {
						Scripting: 'Scripting RENAMED',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'Flash Asset': 'Flash Asset RENAMED',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.x32': 'GIF Agent RENAMED.x32'
					};
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('shockwave', async () => {
					const dir = await getDir('shockwave');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.shockwave = true;
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patch3dDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorOttoWindows(dest);
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.crlf.bin');
					p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
					p.splashImageFile = fixtureFile('splash.bmp');
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					p.patch3dDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					p.iconFile = fixtureFile('icon.ico');
					p.versionStrings = versionStrings;
					await p.write();

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});
			});
		}
	});
});
