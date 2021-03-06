import {
	join as pathJoin
} from 'path';

import fse from 'fs-extra';

import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	platformIsMac,
	shouldTest,
	getInstalledPackagesSync
} from '../../util.spec';

import {
	ProjectorMacApp
} from './app';

export function listSamples() {
	if (!shouldTest('macapp')) {
		return [];
	}
	const r = [];
	for (const name of getInstalledPackagesSync()) {
		const m = name.match(
			/^shockwave-projector-director-([\d.]+)-\w+-mac(-zip)?$/
		);
		if (!m) {
			continue;
		}
		if (!platformIsMac && m[2] !== '-zip') {
			continue;
		}
		const version = m[1].split('.').map(Number);
		if (version[0] < 11) {
			continue;
		}
		r.push({
			name,
			version,
			nestXtrasContents: (
				version[0] > 11 ||
				(version[0] === 11 && version[1] >= 5)
			),
			intel: (
				version[0] > 11 ||
				(version[0] === 11 && version[1] >= 5 && version[2] >= 9)
			)
		});
	}
	return r;
}

describe('projector/mac/app', () => {
	describe('ProjectorMacApp', () => {
		for (const {
			name,
			nestXtrasContents,
			intel
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('macapp', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.includeXtras = {
						'': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.includeXtras = {
						Scripting: null,
						'GIF Agent.xtra': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.includeXtras = {
						Scripting: 'Scripting RENAMED',
						'GIF Agent.xtra': 'GIF Agent RENAMED.xtra'
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('shockwave', async () => {
					const dir = await getDir('shockwave');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.shockwave = true;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						'': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				if (nestXtrasContents) {
					it('nestXtrasContents', async () => {
						const dir = await getDir('nestXtrasContents');
						const dest = pathJoin(dir, 'application.app');

						const p = new ProjectorMacApp(dest);
						p.nestXtrasContents = true;
						p.includeXtras = {
							'': null
						};
						await p.withFile(
							await getSkeleton(),
							fixtureFile('config.ini.lf.bin')
						);

						await fse.copyFile(
							fixtureFile('dir7.dir'),
							pathJoin(dir, 'movie.dir')
						);
					});
				}

				if (intel) {
					it('intel', async () => {
						const dir = await getDir('intel');
						const dest = pathJoin(dir, 'application.app');

						const p = new ProjectorMacApp(dest);
						p.intel = true;
						await p.withFile(
							await getSkeleton(),
							fixtureFile('config.ini.lf.bin')
						);

						await fse.copyFile(
							fixtureFile('dir7.dir'),
							pathJoin(dir, 'movie.dir')
						);
					});
				}

				it('binary', async () => {
					const dir = await getDir('binary');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.binaryName = 'application';
					p.bundleName = 'application';
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.app');

					const p = new ProjectorMacApp(dest);
					p.lingoFile = fixtureFile('lingo.ini.lf.bin');
					p.splashImageFile = fixtureFile('splash.pict');
					p.iconFile = fixtureFile('icon.icns');
					p.infoPlistFile = fixtureFile('Info.plist');
					p.pkgInfoFile = fixtureFile('PkgInfo');
					p.binaryName = 'application';
					p.bundleName = 'application';
					p.nestXtrasContents = true;
					p.includeXtras = {
						'': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});
			});
		}
	});
});
