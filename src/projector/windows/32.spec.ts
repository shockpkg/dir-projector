import {
	join as pathJoin
} from 'path';

import fse from 'fs-extra';

import {
	cleanProjectorDir,
	fixtureFile,
	getPackageFile,
	shouldTest,
	getInstalledPackagesSync
} from '../../util.spec';

import {
	ProjectorWindows32
} from './32';

export function listSamples() {
	if (!shouldTest('windows32')) {
		return [];
	}
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

export const versionStrings = {
	FileVersion: '3.14.15.92',
	ProductVersion: '3.1.4.1',
	CompanyName: 'Custom Company Name',
	FileDescription: 'Custom File Description',
	LegalCopyright: 'Custom Legal Copyright',
	ProductName: 'Custom Pruduct Name',
	LegalTrademarks: 'Custom Legal Trademarks',
	OriginalFilename: 'CustomOriginalFilename.exe',
	InternalName: 'CustomInternalName',
	Comments: 'Custom Comments'
};

describe('projector/windows/32', () => {
	describe('ProjectorWindows32', () => {
		for (const {
			name,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanProjectorDir('windows32', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-all', async () => {
					const dir = await getDir('xtras-all');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.includeXtras = {
						'': null
					};
					p.patchShockwave3dInstalledDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-selective', async () => {
					const dir = await getDir('xtras-selective');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.includeXtras = {
						Scripting: null,
						'Flash Asset': null,
						'GIF Agent.x32': null
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('xtras-rename', async () => {
					const dir = await getDir('xtras-rename');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.includeXtras = {
						Scripting: 'Scripting RENAMED',
						'Flash Asset': 'Flash Asset RENAMED',
						'GIF Agent.x32': 'GIF Agent RENAMED.x32'
					};
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('shockwave', async () => {
					const dir = await getDir('shockwave');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.shockwave = true;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('nestXtrasConfiguration', async () => {
					const dir = await getDir('nestXtrasConfiguration');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
						'': null
					};
					p.patchShockwave3dInstalledDisplayDriversSize =
						patchShockwave3dInstalledDisplayDriversSize;
					await p.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin')
					);

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});

				it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const p = new ProjectorWindows32(dest);
					p.lingoFile = fixtureFile('lingo.ini.crlf.bin');
					p.splashImageFile = fixtureFile('splash.bmp');
					p.nestXtrasConfiguration = true;
					p.includeXtras = {
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

					await fse.copyFile(
						fixtureFile('dir7.dir'),
						pathJoin(dir, 'movie.dir')
					);
				});
			});
		}
	});
});
