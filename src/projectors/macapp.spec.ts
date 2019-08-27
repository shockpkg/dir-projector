import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	platformIsMac,
	shouldTest
} from '../util.spec';

import {
	ProjectorMacApp
} from './macapp';

interface ISample {
	nestXtrasContents?: boolean;
	intel?: boolean;
}

const doTest = platformIsMac && shouldTest('macapp');
const samples: {[index: string]: ISample} = doTest ? {
	'shockwave-projector-director-11.0.0-mac-mac': {},
	'shockwave-projector-director-11.0.0-win-mac': {},
	'shockwave-projector-director-11.0.0-hotfix-1-mac-mac': {},
	'shockwave-projector-director-11.0.0-hotfix-3-mac-mac': {},
	'shockwave-projector-director-11.0.0-hotfix-3-win-mac': {},
	'shockwave-projector-director-11.5.0-mac-mac': {
		nestXtrasContents: true
	},
	'shockwave-projector-director-11.5.0-win-mac': {
		nestXtrasContents: true
	},
	'shockwave-projector-director-11.5.8-mac-mac': {
		nestXtrasContents: true
	},
	'shockwave-projector-director-11.5.8-win-mac': {
		nestXtrasContents: true
	},
	'shockwave-projector-director-11.5.9-mac-mac': {
		nestXtrasContents: true,
		intel: true
	},
	'shockwave-projector-director-11.5.9-win-mac': {
		nestXtrasContents: true,
		intel: true
	},
	'shockwave-projector-director-12.0.0-mac-mac': {
		nestXtrasContents: true,
		intel: true
	},
	'shockwave-projector-director-12.0.0-win-mac': {
		nestXtrasContents: true,
		intel: true
	}
} : {};

describe('projectors/macapp', () => {
	describe('ProjectorMacApp', () => {
		for (const pkg of Object.keys(samples)) {
			const o = samples[pkg];
			const getDir = async (d: string) =>
				cleanProjectorDir('projectors', 'macapp', pkg, d);
			const getSkeleton = async () => getPackageFile(pkg);

			describe(pkg, () => {
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

				if (o.nestXtrasContents) {
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

				if (o.intel) {
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
