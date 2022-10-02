import {join as pathJoin} from 'path';

import {listSamples, versionStrings} from '../projector/windows.spec';
import {cleanBundlesDir} from '../bundle.spec';
import {fixtureFile, getPackageFile} from '../util.spec';
import {Bundle} from '../bundle';

import {BundleWindows} from './windows';

describe('bundle/windows', () => {
	describe('BundleWindows', () => {
		it('instanceof Bundle', () => {
			expect(BundleWindows.prototype instanceof Bundle).toBeTrue();
		});

		for (const {
			name,
			type,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanBundlesDir('windows', type, name, d);
			const getSkeleton = async () => getPackageFile(name);

			// eslint-disable-next-line no-loop-func
			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleWindows(dest);
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

					const b = new BundleWindows(dest);
					const p = b.projector;
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
