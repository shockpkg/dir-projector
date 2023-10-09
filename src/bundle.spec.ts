import {join as pathJoin} from 'path';
import {mkdir, rm} from 'fs/promises';

export const specBundlesPath = pathJoin('spec', 'bundles');

export async function cleanBundlesDir(...path: string[]) {
	const dir = pathJoin(specBundlesPath, ...path);
	await rm(dir, {recursive: true, force: true});
	await mkdir(dir, {recursive: true});
	return dir;
}
