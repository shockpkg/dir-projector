import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	shouldTest,
	getInstalledPackagesSync
} from '../util.spec';

import {
	ProjectorWindows
} from './windows';

function listSamples() {
	const r = [];
	for (const name of getInstalledPackagesSync()) {
		const m = name.match(
			/^shockwave-projector-director-([\d.]+)-\w+-win$/
		);
		if (!m) {
			continue;
		}
		const version = m[1].split('.').map(Number);
		if (version[0] < 7) {
			continue;
		}
		r.push({
			name,
			version,
			patchShockwave3dInstalledDisplayDriversSize: (
				version[0] > 8 ||
				(version[0] === 8 && version[1] >= 5)
			)
		});
	}
	return r;
}

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
		if (!shouldTest('windows')) {
			return;
		}

		for (const {
			name,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('projectors', 'windows', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
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
						},
						patchShockwave3dInstalledDisplayDriversSize
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
						},
						patchShockwave3dInstalledDisplayDriversSize
					})).write(dir, 'application.exe');
				});

				it('resedit', async () => {
					const dir = await getDir('resedit');
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
						patchShockwave3dInstalledDisplayDriversSize,
						iconFile: fixtureFile('icon.ico'),
						fileVersion,
						productVersion,
						versionStrings
					})).write(dir, 'application.exe');
				});
			});
		}
	});
});
