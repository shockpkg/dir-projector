import {
	join as pathJoin
} from 'path';

import {
	listSamples
} from '../../projector/mac/app.spec';
import {
	cleanBundlesDir
} from '../../bundle.spec';
import {
	fixtureFile,
	getPackageFile
} from '../../util.spec';

import {
	BundleMacApp
} from './app';

describe('bundle/mac/app', () => {
	describe('BundleMacApp', () => {
		for (const {
			name
		} of listSamples()) {
			const getDir = async (d: string) =>
				cleanBundlesDir('macapp', name, d);
			const getSkeleton = async () => getPackageFile(name);

			describe(name, () => {
				it('simple', async () => {
					const dir = await getDir('simple');
					const dest = pathJoin(dir, 'application.app');

					const b = new BundleMacApp(dest);
					await b.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin'),
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
					const dest = pathJoin(dir, 'application.app');

					const b = new BundleMacApp(dest);
					const p = b.projector;
					p.lingoFile = fixtureFile('lingo.ini.lf.bin');
					p.splashImageFile = fixtureFile('splash.pict');
					p.iconFile = fixtureFile('icon.icns');
					p.infoPlistFile = fixtureFile('Info.plist');
					p.pkgInfoFile = fixtureFile('PkgInfo');
					p.binaryName = 'application';
					p.bundleName = 'application';
					p.nestXtrasContents = true;
					p.includeXtras = {
						'': null
					};
					await b.withFile(
						await getSkeleton(),
						fixtureFile('config.ini.lf.bin'),
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
