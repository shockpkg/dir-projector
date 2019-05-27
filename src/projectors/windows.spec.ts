// tslint:disable:completed-docs

import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	platformIsWindows
} from '../util.spec';

import {
	ProjectorWindows
} from './windows';

// tslint:disable-next-line no-empty-interface
interface ISample {
}

const samples: {[index: string]: ISample} = {
	'shockwave-projector-director-7.0.0-win-win': {},
	'shockwave-projector-director-7.0.2-2-win-win': {},
	'shockwave-projector-director-7.0.2-trial-win-win': {},
	'shockwave-projector-director-7.0.2-win-win': {},
	'shockwave-projector-director-8.0.0-trial-win-win': {},
	'shockwave-projector-director-8.0.0-win-win': {},
	'shockwave-projector-director-8.5.0-trial-win-win': {},
	'shockwave-projector-director-8.5.1-trial-win-win': {},
	'shockwave-projector-director-9.0.0-trial-win-win': {},
	'shockwave-projector-director-10.0.0-win-win': {},
	'shockwave-projector-director-10.1.0-mac-win': {},
	'shockwave-projector-director-10.1.0-win-win': {},
	'shockwave-projector-director-10.1.1-mac-win': {},
	'shockwave-projector-director-10.1.1-win-win': {},
	'shockwave-projector-director-11.0.0-mac-win': {},
	'shockwave-projector-director-11.0.0-win-win': {},
	'shockwave-projector-director-11.0.0-hotfix-1-mac-win': {},
	'shockwave-projector-director-11.0.0-hotfix-3-mac-win': {},
	'shockwave-projector-director-11.0.0-hotfix-3-win-win': {},
	'shockwave-projector-director-11.5.0-mac-win': {},
	'shockwave-projector-director-11.5.0-win-win': {},
	'shockwave-projector-director-11.5.8-mac-win': {},
	'shockwave-projector-director-11.5.8-win-win': {},
	'shockwave-projector-director-11.5.9-mac-win': {},
	'shockwave-projector-director-11.5.9-win-win': {},
	'shockwave-projector-director-12.0.0-mac-win': {},
	'shockwave-projector-director-12.0.0-win-win': {}
};

const fileVersion = '3.14.15.92';
const productVersion = '3.1.4.1';
const versionStrings = {
	CompanyName: 'Custom Company Name',
	FileDescription: 'Custom File Description',
	LegalCopyright: 'Custom Legal Copyright',
	ProductName: 'Custom Pruduct Name',
	LegalTrademarks: 'Custom Legal Trademarks',
	OriginalFilename: 'CustomOriginalFilename.exe',
	InternalName: 'CustomInternalName',
	Comments: 'Custom Comments'
};

describe('projectors/windows', () => {
	describe('ProjectorWindows', () => {
		for (const pkg of Object.keys(samples)) {
			// const o = samples[pkg];
			const getDir = async (d: string) =>
				cleanProjectorDir('projectors', 'windows', pkg, d);
			const getSkeleton = async () => getPackageFile(pkg);

			describe(pkg, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin')
					})).write(dir, 'application.exe');
				});

				it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						includeXtras: {
							'': null
						}
					})).write(dir, 'application.exe');
				});

				it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						includeXtras: {
							Scripting: null,
							'Flash Asset': null,
							'GIF Agent.x32': null
						}
					})).write(dir, 'application.exe');
				});

				it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						includeXtras: {
							Scripting: 'Scripting RENAMED',
							'Flash Asset': 'Flash Asset RENAMED',
							'GIF Agent.x32': 'GIF Agent RENAMED.x32'
						}
					})).write(dir, 'application.exe');
				});

				it('shockwave', async () => {
					const dir = await getDir('shockwave');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						shockwave: true
					})).write(dir, 'application.exe');
				});

				it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						nestXtrasConfiguration: true,
						includeXtras: {
							'': null
						}
					})).write(dir, 'application.exe');
				});

				if (platformIsWindows) {
					it('rcedit', async () => {
						const dir = await getDir('rcedit');
						await (new ProjectorWindows({
							skeleton: await getSkeleton(),
							movieFile: fixtureFile('dir7.dir'),
							movieName: 'movie.dir',
							configFile: fixtureFile('config.ini.crlf.bin'),
							iconFile: fixtureFile('icon.ico'),
							fileVersion,
							productVersion,
							versionStrings
						})).write(dir, 'application.exe');
					});
				}

				it('complex', async () => {
					const dir = await getDir('complex');
					await (new ProjectorWindows({
						skeleton: await getSkeleton(),
						movieFile: fixtureFile('dir7.dir'),
						movieName: 'movie.dir',
						configFile: fixtureFile('config.ini.crlf.bin'),
						lingoFile: fixtureFile('lingo.ini.crlf.bin'),
						splashImageFile: fixtureFile('splash.bmp'),
						nestXtrasConfiguration: true,
						includeXtras: {
							'': null
						},
						iconFile: platformIsWindows ?
							fixtureFile('icon.ico') : null,
						fileVersion: platformIsWindows ?
							fileVersion : null,
						productVersion: platformIsWindows ?
							productVersion : null,
						versionStrings: platformIsWindows ?
							versionStrings : null
					})).write(dir, 'application.exe');
				});
			});
		}
	});
});
