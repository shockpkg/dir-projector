import {readFileSync} from 'node:fs';
import {deflateRawSync} from 'node:zlib';

const {name, version, engines} = JSON.parse(readFileSync('./package.json'));

const node = engines.node
	.split(/[^\d.]+/)
	.filter(s => s.length)
	.map(s => [...s.split('.').map(s => +s || 0), 0, 0].slice(0, 3))
	.sort((a, b) => a[2] - b[2])
	.sort((a, b) => a[1] - b[1])
	.sort((a, b) => a[0] - b[0])[0]
	.join('.');

const launchers = (manifest => {
	const r = {};
	for (const {name, file} of manifest) {
		r[name] = deflateRawSync(readFileSync(`launchers/data/${file}`), {
			level: 9
		}).toString('base64');
	}
	return r;
})(JSON.parse(readFileSync('./launchers/manifest.json')));

export default api => {
	const env = api.env();
	api.cache(() => env);
	const modules = env === 'esm' ? false : 'commonjs';
	const ext = modules ? '.js' : '.mjs';
	const presets = [];
	const plugins = [];
	presets.push(
		[
			'@babel/preset-env',
			{
				modules,
				exclude: ['proposal-dynamic-import'],
				targets: {
					node
				}
			}
		],
		['@babel/preset-typescript']
	);
	plugins.push(
		[
			'esm-resolver',
			{
				source: {
					extensions: [
						[['.js', '.mjs', '.jsx', '.mjsx', '.ts', '.tsx'], ext]
					]
				}
			}
		],
		[
			'search-and-replace',
			{
				rules: [
					{
						search: '#{NAME}',
						replace: name
					},
					{
						search: '#{VERSION}',
						replace: version
					},
					{
						search: '#{LAUNCHERS}',
						replace: launchers
					}
				]
			}
		]
	);
	if (modules === 'commonjs') {
		plugins.push([
			'@babel/plugin-transform-modules-commonjs',
			{
				importInterop: 'node'
			}
		]);
	}
	return {
		presets,
		plugins
	};
};
