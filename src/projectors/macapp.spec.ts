import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	platformIsMac,
	shouldTest,
	getInstalledPackagesSync
} from '../util.spec';

import {
	ProjectorMacApp
} from './macapp';

function listSamples() {
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

describe('projectors/macapp', () => {
	describe('ProjectorMacApp', () => {
		if (!shouldTest('macapp')) {
			return;
		}

		for (const {
			name,
			nestXtrasContents,
			intel
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('projectors', 'macapp', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin')
					})).write(dir, 'application.app');
				});

				it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						includeXtras: {
							'': null
						}
					})).write(dir, 'application.app');
				});

				it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						includeXtras: {
							Scripting: null,
							'GIF Agent.xtra': null
						}
					})).write(dir, 'application.app');
				});

				it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						includeXtras: {
							Scripting: 'Scripting RENAMED',
							'GIF Agent.xtra': 'GIF Agent RENAMED.xtra'
						}
					})).write(dir, 'application.app');
				});

				it('shockwave', async () => {
					const dir = await getDir('shockwave');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						shockwave: true
					})).write(dir, 'application.app');
				});

				it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						nestXtrasConfiguration: true,
						includeXtras: {
							'': null
						}
					})).write(dir, 'application.app');
				});

				it('binaryName', async () => {
					const dir = await getDir('binaryName');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						binaryName: 'application'
					})).write(dir, 'application.app');
				});

				if (nestXtrasContents) {
					it('nestXtrasContents', async () => {
						const dir = await getDir('nestXtrasContents');
						await (new ProjectorMacApp({
							skeleton: await getSkeleton(),
							movieFile: fixtureFile('dir7.dir'),
							movieName: 'movie.dir',
							configFile: fixtureFile('config.ini.lf.bin'),
							nestXtrasContents: true,
							includeXtras: {
								'': null
							}
						})).write(dir, 'application.app');
					});
				}

				if (intel) {
					it('intel', async () => {
						const dir = await getDir('intel');
						await (new ProjectorMacApp({
							skeleton: await getSkeleton(),
							movieFile: fixtureFile('dir7.dir'),
							movieName: 'movie.dir',
							configFile: fixtureFile('config.ini.lf.bin'),
							intel: true
						})).write(dir, 'application.app');
					});
				}

				it('complex', async () => {
					const dir = await getDir('complex');
					await (new ProjectorMacApp({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.lf.bin'),
						lingoFile: fixtureFile('lingo.ini.lf.bin'),
						splashImageFile: fixtureFile('splash.pict'),
						iconFile: fixtureFile('icon.icns'),
						infoPlistFile: fixtureFile('Info.plist'),
						pkgInfoFile: fixtureFile('PkgInfo'),
						binaryName: 'application',
						nestXtrasConfiguration: true,
						includeXtras: {
							'': null
						}
					})).write(dir, 'application.app');
				});
			});
		}
	});
});
