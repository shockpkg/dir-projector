'use strict';

const fs = require('fs').promises;

const packages = [
	['7-win', [
		'shockwave-projector-director-7.0.0-win-win',
		'shockwave-projector-director-7.0.2-2-win-win',
		'shockwave-projector-director-7.0.2-trial-win-win',
		'shockwave-projector-director-7.0.2-win-win'
	]],
	['8.0-win', [
		'shockwave-projector-director-8.0.0-trial-win-win',
		'shockwave-projector-director-8.0.0-win-win'
	]],
	['8.5-win', [
		'shockwave-projector-director-8.5.0-win-win',
		'shockwave-projector-director-8.5.0-trial-win-win',
		'shockwave-projector-director-8.5.1-win-win',
		'shockwave-projector-director-8.5.1-trial-win-win'
	]],
	['9-win', [
		'shockwave-projector-director-9.0.0-win-win',
		'shockwave-projector-director-9.0.0-trial-win-win'
	]],
	['10-win', [
		'shockwave-projector-director-10.0.0-mac-win',
		'shockwave-projector-director-10.0.0-win-win',
		'shockwave-projector-director-10.1.0-mac-win',
		'shockwave-projector-director-10.1.0-win-win',
		'shockwave-projector-director-10.1.1-mac-win',
		'shockwave-projector-director-10.1.1-win-win'
	]],
	['11.0-win', [
		'shockwave-projector-director-11.0.0-mac-win',
		'shockwave-projector-director-11.0.0-win-win',
		'shockwave-projector-director-11.0.0-hotfix-1-mac-win',
		'shockwave-projector-director-11.0.0-hotfix-3-mac-win',
		'shockwave-projector-director-11.0.0-hotfix-3-win-win'
	]],
	['11.5-win', [
		'shockwave-projector-director-11.5.0-mac-win',
		'shockwave-projector-director-11.5.0-win-win',
		'shockwave-projector-director-11.5.8-mac-win',
		'shockwave-projector-director-11.5.8-win-win',
		'shockwave-projector-director-11.5.9-mac-win',
		'shockwave-projector-director-11.5.9-win-win'
	]],
	['12-win', [
		'shockwave-projector-director-12.0.0-mac-win',
		'shockwave-projector-director-12.0.0-win-win'
	]],
	['11.0-mac', [
		'shockwave-projector-director-11.0.0-mac-mac-zip',
		'shockwave-projector-director-11.0.0-win-mac-zip',
		'shockwave-projector-director-11.0.0-hotfix-1-mac-mac-zip',
		'shockwave-projector-director-11.0.0-hotfix-3-mac-mac-zip',
		'shockwave-projector-director-11.0.0-hotfix-3-win-mac-zip'
	]],
	['11.5-mac', [
		'shockwave-projector-director-11.5.0-mac-mac-zip',
		'shockwave-projector-director-11.5.0-win-mac-zip',
		'shockwave-projector-director-11.5.8-mac-mac-zip',
		'shockwave-projector-director-11.5.8-win-mac-zip',
		'shockwave-projector-director-11.5.9-mac-mac-zip',
		'shockwave-projector-director-11.5.9-win-mac-zip'
	]],
	['12-mac', [
		'shockwave-projector-director-12.0.0-mac-mac-zip',
		'shockwave-projector-director-12.0.0-win-mac-zip'
	]]
];

const platforms = [
	['linux', 'ubuntu-20.04', packages]
];

const nodeVersions = [
	['10', '10.0.0', {}],
	['15', '15.13.0', {}]
];

function template(name, runsOn, nodeVersion, lint, packages) {
	const install = packages.length ?
		`    - run: npm run shockpkg -- install ${packages.join(' ')}` :
		'';
	const linting = lint ? `    - run: npm run lint` : '';
	return `
name: '${name}'

on: push

jobs:
  build:
    runs-on: '${runsOn}'

    steps:
    - uses: actions/checkout@v2

    - uses: actions/setup-node@v1
      with:
        node-version: '${nodeVersion}'

    - run: npm install
    - run: npm run clean
    - run: npm run shockpkg -- update --summary
${install}
${linting}
    - run: npm run build
    - run: npm run test
`.trim() + '\n';
	}

async function main() {
	await fs.writeFile('main.yml', template(
		'main',
		platforms[0][1],
		nodeVersions[nodeVersions.length - 1][0],
		true,
		[]
	));

	for (const [platform, runsOn, packages] of platforms) {
		for (const [nodeVer, nodeVersion, options] of nodeVersions) {
			for (const [pkg, pkgs] of packages) {
				const name = `${platform}_${nodeVer}_${pkg}`;
				await fs.writeFile(`${name}.yml`, template(
					name,
					runsOn,
					nodeVersion,
					false,
					pkgs
				));
			}
		}
	}
}
main().catch(err => {
	process.exitCode = 1;
	console.error(err);
});
