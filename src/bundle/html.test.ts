import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {join as pathJoin} from 'node:path';

import {fixtureFile} from '../util.spec';
import {Bundle} from '../bundle';

import {cleanBundlesDir} from './otto.spec';
import {BundleHtml} from './html';

const getDir = async (d: string) => cleanBundlesDir('html', d);

void describe('bundle/html', () => {
	void describe('BundleHtml', () => {
		void it('instanceof', () => {
			ok(BundleHtml.prototype instanceof Bundle);
		});

		void it('simple', async () => {
			const dir = await getDir('simple');
			const dest = pathJoin(dir, 'application.html');

			const b = new BundleHtml(dest);
			const p = b.projector;
			p.src = 'movie.dir';
			p.width = 640;
			p.height = 480;
			await b.write(async b => {
				await b.copyResource('movie.dir', fixtureFile('dir7.dir'));
			});
		});

		void it('complex', async () => {
			const dir = await getDir('complex');
			const dest = pathJoin(dir, 'application.html');

			const b = new BundleHtml(dest);
			const p = b.projector;
			p.src = 'movie.dir';
			p.width = 640;
			p.height = 480;
			p.lang = 'en-US';
			p.title = 'A "special" title with <html> characters';
			p.background = '#000000';
			p.color = '#999999';
			p.bgColor = '#000000';
			p.codebase =
				'http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=12,0,0,112';
			p.pluginspage = 'http://www.macromedia.com/shockwave/download/';
			p.swStretchStyle = 'none';
			p.swStretchHAlign = 'center';
			p.swStretchVAlign = 'center';
			p.swRemote = [
				"swSaveEnabled='false'",
				"swVolume='false'",
				"swRestart='false'",
				"swPausePlay='false'",
				"swFastForward='false'",
				"swContextMenu='true'"
			].join(' ');
			p.sw1 = 'one';
			p.sw2 = 'two';
			p.sw3 = 'three';
			p.sw4 = 'four';
			p.sw5 = 'five';
			p.sw6 = 'six';
			p.sw7 = 'seven';
			p.sw8 = 'eight';
			p.sw9 = 'nine';
			p.progress = false;
			p.logo = false;
			p.playerVersion = 12;
			await b.write(async b => {
				await b.copyResource('movie.dir', fixtureFile('dir7.dir'));
			});
		});

		void it('flat', async () => {
			const dir = await getDir('flat');
			const dest = pathJoin(dir, 'application.html');

			const b = new BundleHtml(dest, true);
			const p = b.projector;
			p.src = 'movie.dir';
			p.width = 640;
			p.height = 480;
			await b.write(async b => {
				await b.copyResource('movie.dir', fixtureFile('dir7.dir'));
			});
		});
	});
});
