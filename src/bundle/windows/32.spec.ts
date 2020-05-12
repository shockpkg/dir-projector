import {
	join as pathJoin
} from 'path';

import {
	listSamples,
	versionStrings
} from '../../projector/windows/32.spec';
import {
	cleanBundlesDir
} from '../../bundle.spec';
import {
	fixtureFile,
	getPackageFile
} from '../../util.spec';

import {
	BundleWindows32
} from './32';

describe('bundle/windows/32', () => {
	describe('BundleWindows32', () => {
		for (const {
			name,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanBundlesDir('windows32', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleWindows32(dest);
					await b.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin'),
						async b => {
							await b.copyResource(
								'movie.dir',
								fixtureFile('dir7.dir')
							);
						}
					);
				});

				it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleWindows32(dest);
					const p = b.projector;
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
					await b.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.crlf.bin'),
						async b => {
							await b.copyResource(
								'movie.dir',
								fixtureFile('dir7.dir')
							);
						}
					);
				});
			});
		}
	});
});
