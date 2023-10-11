import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {copyFile} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';

import {cleanProjectorDir, fixtureFile, getPackageFile} from '../../util.spec';
import {ProjectorMac} from '../mac';

import {ProjectorMacApp} from './app';
import {listSamples} from './app.spec';

void describe('projector/mac/app', () => {
	void describe('ProjectorMacApp', () => {
		void it('instanceof ProjectorMac', () => {
			ok(ProjectorMacApp.prototype instanceof ProjectorMac);
		});

		for (const {name, nestXtrasContents, intel} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('mac', 'app', name, d);
			const getSkeleton = async () => getPackageFile(name);

			void describe(name, () => {
				void it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.includeXtras = {
						Scripting: null,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.xtra': null
					};
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.includeXtras = {
						Scripting: 'Scripting RENAMED',
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'GIF Agent.xtra': 'GIF Agent RENAMED.xtra'
					};
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('shockwave', async () => {
					const dir = await getDir('shockwave');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.shockwave = true;
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				void it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				if (nestXtrasContents) {
					void it('nestXtrasContents', async () => {
						const dir = await getDir('nestXtrasContents');
						const dest = pathJoin(dir, 'application.app');

						const p = new ProjectorMacApp(dest);
						p.skeleton = await getSkeleton();
						p.nestXtrasContents = true;
						p.includeXtras = {
							// eslint-disable-next-line @typescript-eslint/naming-convention
							'': null
						};
						await p.withFile(fixtureFile('config.ini.lf.bin'));

						await copyFile(
							fixtureFile('dir7.dir'),
							pathJoin(dir, 'movie.dir')
						);
					});
				}

				if (intel) {
					void it('intel', async () => {
						const dir = await getDir('intel');
						const dest = pathJoin(dir, 'application.app');

						const p = new ProjectorMacApp(dest);
						p.skeleton = await getSkeleton();
						p.intel = true;
						await p.withFile(fixtureFile('config.ini.lf.bin'));

						await copyFile(
							fixtureFile('dir7.dir'),
							pathJoin(dir, 'movie.dir')
						);
					});
				}

				void it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.skeleton = await getSkeleton();
					p.lingoFile = fixtureFile('lingo.ini.lf.bin');
					p.splashImageFile = fixtureFile('splash.pict');
					p.iconFile = fixtureFile('icon.icns');
					p.infoPlistFile = fixtureFile('Info.plist');
					p.pkgInfoFile = fixtureFile('PkgInfo');
					p.binaryName = 'application';
					p.bundleName = 'application';
					p.nestXtrasContents = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
					await p.withFile(fixtureFile('config.ini.lf.bin'));

					await copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});
			});
		}
	});
});
