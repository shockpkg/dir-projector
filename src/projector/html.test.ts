import {describe, it} from 'node:test';
import {ok} from 'node:assert';
import {copyFile} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';

import {cleanProjectorDir, fixtureFile} from '../util.spec';
import {Projector} from '../projector';

import {ProjectorHtml} from './html';

const getDir = async (d: string) => cleanProjectorDir('html', d);

void describe('projector/html', () => {
	void describe('ProjectorHtml', () => {
		void it('instanceof', () => {
			ok(ProjectorHtml.prototype instanceof Projector);
		});

		void it('simple', async () => {
			const dir = await getDir('simple');
			const dest = pathJoin(dir, 'page.html');

			const p = new ProjectorHtml(dest);
			p.src = 'movie.dir';
			p.width = 640;
			p.height = 480;
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});

		void it('complex', async () => {
			const dir = await getDir('complex');
			const dest = pathJoin(dir, 'page.html');

			const p = new ProjectorHtml(dest);
			p.src = 'movie.dir';
			p.width = 640;
			p.height = 480;
			p.lang = 'en-US';
			p.title = 'A "special" title with <html> characters';
			p.background = '#000000';
			p.color = '#999999';
			p.bgcolor = '#000000';
			p.id = 'element-id';
			p.name = 'element-name';
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
			await p.write();

			await copyFile(fixtureFile('dir7.dir'), pathJoin(dir, 'movie.dir'));
		});
	});
});
