/* eslint import/no-extraneous-dependencies: ["error", {devDependencies: true}] */
/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/promise-function-async */

import fs from 'fs';
import path from 'path';
import stream from 'stream';
import util from 'util';

import gulp from 'gulp';
import gulpRename from 'gulp-rename';
import gulpInsert from 'gulp-insert';
import gulpFilter from 'gulp-filter';
import gulpReplace from 'gulp-replace';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpBabel from 'gulp-babel';
import execa from 'execa';
import del from 'del';

const readFile = util.promisify(fs.readFile);
const pipeline = util.promisify(stream.pipeline);

export const platformIsMac = process.platform === 'darwin';

async function exec(cmd, args = []) {
	await execa(cmd, args, {
		preferLocal: true,
		stdio: 'inherit'
	});
}

async function packageJSON() {
	packageJSON.json = packageJSON.json || readFile('package.json', 'utf8');
	return JSON.parse(await packageJSON.json);
}

async function babelrc() {
	babelrc.json = babelrc.json || readFile('.babelrc', 'utf8');
	return Object.assign(JSON.parse(await babelrc.json), {
		babelrc: false
	});
}

async function babelTarget(src, srcOpts, dest, modules) {
	// Change module.
	const babelOptions = await babelrc();
	for (const preset of babelOptions.presets) {
		if (preset[0] === '@babel/preset-env') {
			preset[1].modules = modules;
		}
	}
	if (!modules) {
		babelOptions.plugins.push([
			'esm-resolver', {
				source: {
					extensions: [
						[
							['.js', '.mjs', '.jsx', '.mjsx', '.ts', '.tsx'],
							'.mjs'
						]
					]
				},
				submodule: {
					extensions: ['.mjs', '.js']
				},
				module: {
					entry: [
						{
							type: 'file',
							path: './module',
							extensions: ['.mjs', '.js']
						}
					]
				}
			}
		]);
	}

	// Read the package JSON.
	const pkg = await packageJSON();

	// Filter meta data file and create replace transform.
	const filterMeta = gulpFilter(['*/meta.ts'], {restore: true});
	const filterMetaReplaces = [
		["'@VERSION@'", JSON.stringify(pkg.version)],
		["'@NAME@'", JSON.stringify(pkg.name)]
	].map(v => gulpReplace(...v));

	await pipeline(...[
		gulp.src(src, srcOpts),
		filterMeta,
		...filterMetaReplaces,
		filterMeta.restore,
		gulpSourcemaps.init(),
		gulpBabel(babelOptions),
		gulpRename(path => {
			if (!modules && path.extname === '.js') {
				path.extname = '.mjs';
			}
		}),
		gulpSourcemaps.write('.', {
			includeContent: true,
			addComment: false,
			destPath: dest
		}),
		gulpInsert.transform((contents, file) => {
			// Manually append sourcemap comment.
			if (/\.m?js$/i.test(file.path)) {
				const base = path.basename(file.path);
				return `${contents}\n//# sourceMappingURL=${base}.map\n`;
			}
			return contents;
		}),
		gulp.dest(dest)
	].filter(Boolean));
}

async function eslint(strict) {
	try {
		await exec('eslint', ['--ext', 'js,mjs,jsx,mjsx,ts,tsx', '.']);
	}
	catch (err) {
		if (strict) {
			throw err;
		}
	}
}

// clean

gulp.task('clean:logs', async () => {
	await del([
		'npm-debug.log*',
		'yarn-debug.log*',
		'yarn-error.log*'
	]);
});

gulp.task('clean:lib', async () => {
	await del([
		'lib'
	]);
});

gulp.task('clean:projectors', async () => {
	await del([
		'spec/projectors'
	]);
});

gulp.task('clean', gulp.parallel([
	'clean:logs',
	'clean:lib',
	'clean:projectors'
]));

// lint (watch)

gulp.task('lintw:es', async () => {
	await eslint(false);
});

gulp.task('lintw', gulp.parallel([
	'lintw:es'
]));

// lint

gulp.task('lint:es', async () => {
	await eslint(true);
});

gulp.task('lint', gulp.parallel([
	'lint:es'
]));

// build

gulp.task('build:lib:dts', async () => {
	await exec('tsc');
});

gulp.task('build:lib:cjs', async () => {
	await babelTarget(['src/**/*.ts'], {}, 'lib', 'commonjs');
});

gulp.task('build:lib:mjs', async () => {
	await babelTarget(['src/**/*.ts'], {}, 'lib', false);
});

gulp.task('build:lib', gulp.parallel([
	'build:lib:dts',
	'build:lib:cjs',
	'build:lib:mjs'
]));

gulp.task('build', gulp.parallel([
	'build:lib'
]));

// test

gulp.task('test:node', async () => {
	await exec('jasmine');
});

gulp.task('test', gulp.parallel([
	'test:node'
]));

// all

gulp.task('all', gulp.series([
	'clean',
	'lint',
	'build',
	'test'
]));

// watched

gulp.task('watched', gulp.series([
	'clean',
	'lintw',
	'build',
	'test'
]));

// shockpkg-install

gulp.task('shockpkg-install:update', async () => {
	await exec('shockpkg', ['update']);
});

gulp.task('shockpkg-install:install-win', async () => {
	await exec('shockpkg', [
		'install',
		'shockwave-projector-director-7.0.0-win-win',
		'shockwave-projector-director-7.0.2-2-win-win',
		'shockwave-projector-director-7.0.2-trial-win-win',
		'shockwave-projector-director-7.0.2-win-win',
		'shockwave-projector-director-8.0.0-trial-win-win',
		'shockwave-projector-director-8.0.0-win-win',
		'shockwave-projector-director-8.5.0-trial-win-win',
		'shockwave-projector-director-8.5.1-trial-win-win',
		'shockwave-projector-director-9.0.0-trial-win-win',
		'shockwave-projector-director-10.0.0-win-win',
		'shockwave-projector-director-10.1.0-mac-win',
		'shockwave-projector-director-10.1.0-win-win',
		'shockwave-projector-director-10.1.1-mac-win',
		'shockwave-projector-director-10.1.1-win-win',
		'shockwave-projector-director-11.0.0-mac-win',
		'shockwave-projector-director-11.0.0-win-win',
		'shockwave-projector-director-11.0.0-hotfix-1-mac-win',
		'shockwave-projector-director-11.0.0-hotfix-3-mac-win',
		'shockwave-projector-director-11.0.0-hotfix-3-win-win',
		'shockwave-projector-director-11.5.0-mac-win',
		'shockwave-projector-director-11.5.0-win-win',
		'shockwave-projector-director-11.5.8-mac-win',
		'shockwave-projector-director-11.5.8-win-win',
		'shockwave-projector-director-11.5.9-mac-win',
		'shockwave-projector-director-11.5.9-win-win',
		'shockwave-projector-director-12.0.0-mac-win',
		'shockwave-projector-director-12.0.0-win-win'
	]);
});

gulp.task('shockpkg-install:install-mac', async () => {
	await exec('shockpkg', [
		'install',
		'shockwave-projector-director-11.0.0-mac-mac',
		'shockwave-projector-director-11.0.0-win-mac',
		'shockwave-projector-director-11.0.0-hotfix-1-mac-mac',
		'shockwave-projector-director-11.0.0-hotfix-3-mac-mac',
		'shockwave-projector-director-11.0.0-hotfix-3-win-mac',
		'shockwave-projector-director-11.5.0-mac-mac',
		'shockwave-projector-director-11.5.0-win-mac',
		'shockwave-projector-director-11.5.8-mac-mac',
		'shockwave-projector-director-11.5.8-win-mac',
		'shockwave-projector-director-11.5.9-mac-mac',
		'shockwave-projector-director-11.5.9-win-mac',
		'shockwave-projector-director-12.0.0-mac-mac',
		'shockwave-projector-director-12.0.0-win-mac'
	]);
});

gulp.task('shockpkg-install', gulp.series([
	'shockpkg-install:update',
	'shockpkg-install:install-win',
	'shockpkg-install:install-mac'
]));

gulp.task('shockpkg-install-ci', gulp.series([
	'shockpkg-install:update',
	'shockpkg-install:install-win',
	platformIsMac ? 'shockpkg-install:install-mac' : null
].filter(Boolean)));

// prepack

gulp.task('prepack', gulp.series([
	'clean',
	'build'
]));

// default

gulp.task('default', gulp.series([
	'all'
]));
