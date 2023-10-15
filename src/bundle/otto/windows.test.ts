import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {join as pathJoin} from 'node:path';

import {listSamples, versionStrings} from '../../projector/otto/windows.spec';
import {cleanBundlesDir} from '../otto.spec';
import {fixtureFile, getPackageFile} from '../../util.spec';
import {BundleOtto} from '../otto';

import {BundleOttoWindows} from './windows';

void describe('bundle/otto/windows', () => {
	void describe('BundleWindows', () => {
		void it('instanceof', () => {
			ok(BundleOttoWindows.prototype instanceof BundleOtto);
		});

		for (const {
			name,
			patchShockwave3dInstalledDisplayDriversSize
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanBundlesDir('otto', 'windows', name, d);
			const getSkeleton = async () => getPackageFile(name);

			void describe(name, () => {
				void it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleOttoWindows(dest);
					b.projector.skeleton = await getSkeleton();
					b.projector.configFile = fixtureFile('config.ini.crlf.bin');
					await b.write(async b => {
						await b.copyResource(
							'movie.dir',
							fixtureFile('dir7.dir')
						);
					});
				});

				void it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleOttoWindows(dest);
					const p = b.projector;
					p.skeleton = await getSkeleton();
					b.projector.configFile = fixtureFile('config.ini.crlf.bin');
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
					await b.write(async b => {
						await b.copyResource(
							'movie.dir',
							fixtureFile('dir7.dir')
						);
					});
				});

				void it('flat', async () => {
					const dir = await getDir('flat');
					const dest = pathJoin(dir, 'application.exe');

					const b = new BundleOttoWindows(dest, true);
					b.projector.skeleton = await getSkeleton();
					b.projector.configFile = fixtureFile('config.ini.crlf.bin');
					await b.write(async b => {
						await b.copyResource(
							'movie.dir',
							fixtureFile('dir7.dir')
						);
					});
				});
			});
		}
	});
});
