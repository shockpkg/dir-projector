import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {join as pathJoin} from 'node:path';

import {listSamples, versionStrings} from '../projector/windows.spec';
import {cleanBundlesDir} from '../bundle.spec';
import {fixtureFile, getPackageFile} from '../util.spec';
import {Bundle} from '../bundle';

import {BundleWindows} from './windows';

void describe('bundle/windows', () => {
	void describe('BundleWindows', () => {
		void it('instanceof Bundle', () => {
			ok(BundleWindows.prototype instanceof Bundle);
		});

		for (const {
			name,
			type,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanBundlesDir('windows', type, name, d);
			const getSkeleton = async () => getPackageFile(name);

			void describe(name, () => {
				void it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleWindows(dest);
					b.projector.skeleton = await getSkeleton();
					await b.withFile(
						fixtureFile('config.ini.crlf.bin'),
						async b => {
							await b.copyResource(
								'movie.dir',
								fixtureFile('dir7.dir')
							);
						}
					);
				});

				void it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleWindows(dest);
					const p = b.projector;
					p.skeleton = await getSkeleton();
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
