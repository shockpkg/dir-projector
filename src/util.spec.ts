import {mkdir, rm} from 'node:fs/promises';
import {join as pathJoin} from 'node:path';
import {readdirSync, statSync} from 'node:fs';

import {Manager} from '@shockpkg/core';

export const platformIsMac = process.platform === 'darwin';
export const platformIsWindows = /^win\d/.test(process.platform);

// eslint-disable-next-line no-process-env
export const envFastTest = process.env.DIR_PROJECTOR_FAST_TEST || null;

export function shouldTest(name: string) {
	return !envFastTest || envFastTest === name;
}

export const specFixturesPath = pathJoin('spec', 'fixtures');
export const specProjectorsPath = pathJoin('spec', 'projectors');
export const specBundlesPath = pathJoin('spec', 'bundles');

export function fixtureFile(name: string) {
	return pathJoin(specFixturesPath, name);
}

export async function getPackageFile(pkg: string) {
	return new Manager().file(pkg);
}

export async function cleanProjectorDir(...path: string[]) {
	const dir = pathJoin(specProjectorsPath, ...path);
	await rm(dir, {recursive: true, force: true});
	await mkdir(dir, {recursive: true});
	return dir;
}

export async function cleanBundlesDir(...path: string[]) {
	const dir = pathJoin(specBundlesPath, ...path);
	await rm(dir, {recursive: true, force: true});
	await mkdir(dir, {recursive: true});
	return dir;
}

let getInstalledPackagesCache: string[] | null = null;
export function getInstalledPackagesSync() {
	if (!getInstalledPackagesCache) {
		getInstalledPackagesCache = [];
		try {
			const dir = 'shockpkg';
			for (const d of readdirSync(dir, {withFileTypes: true})) {
				if (d.name.startsWith('.') || !d.isDirectory()) {
					continue;
				}
				const st = statSync(`${dir}/${d.name}/.shockpkg/package.json`);
				if (st.isFile()) {
					getInstalledPackagesCache.push(d.name);
				}
			}
		} catch (err) {
			if (!(err && (err as {code: string}).code === 'ENOENT')) {
				throw err;
			}
		}
	}
	return getInstalledPackagesCache;
}
