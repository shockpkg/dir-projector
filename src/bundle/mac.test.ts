import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {join as pathJoin} from 'node:path';

import {listSamples} from '../projector/mac.spec';
import {cleanBundlesDir} from '../bundle.spec';
import {fixtureFile, getPackageFile} from '../util.spec';
import {Bundle} from '../bundle';

import {BundleMac} from './mac';

void describe('bundle/mac', () => {
	void describe('BundleMac', () => {
		void it('instanceof Bundle', () => {
			ok(BundleMac.prototype instanceof Bundle);
		});

		for (const {name} of listSamples()) {
			const getDir = async (d: string) => cleanBundlesDir('mac', name, d);
			const getSkeleton = async () => getPackageFile(name);

			void describe(name, () => {
				void it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.app');

					const b = new BundleMac(dest);
					b.projector.skeleton = await getSkeleton();
					b.projector.configFile = fixtureFile('config.ini.lf.bin');
					await b.write(async b => {
						await b.copyResource(
							'movie.dir',
							fixtureFile('dir7.dir')
						);
					});
				});

				void it('complex', async () => {
					const dir = await getDir('complex');
					const dest = pathJoin(dir, 'application.app');

					const b = new BundleMac(dest);
					const p = b.projector;
					p.skeleton = await getSkeleton();
					p.configFile = fixtureFile('config.ini.lf.bin');
					p.lingoFile = fixtureFile('lingo.ini.lf.bin');
					p.splashImageFile = fixtureFile('splash.pict');
					p.iconFile = fixtureFile('icon.icns');
					p.infoPlistFile = fixtureFile('Info.plist');
					p.pkgInfoFile = fixtureFile('PkgInfo');
					p.binaryName = 'application';
					p.bundleName = 'application';
					p.nestXtrasContents = true;
					p.includeXtras = {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'': null
					};
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
