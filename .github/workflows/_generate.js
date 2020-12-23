'use strict';

const fs = require('fs').promises;

const packages = [
	'shockwave-projector-director-7.0.0-win-win',
	'shockwave-projector-director-7.0.2-2-win-win',
	'shockwave-projector-director-7.0.2-trial-win-win',
	'shockwave-projector-director-7.0.2-win-win',
	'shockwave-projector-director-8.0.0-trial-win-win',
	'shockwave-projector-director-8.0.0-win-win',
	'shockwave-projector-director-8.5.0-win-win',
	'shockwave-projector-director-8.5.0-trial-win-win',
	'shockwave-projector-director-8.5.1-win-win',
	'shockwave-projector-director-8.5.1-trial-win-win',
	'shockwave-projector-director-9.0.0-win-win',
	'shockwave-projector-director-9.0.0-trial-win-win',
	'shockwave-projector-director-10.0.0-mac-win',
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
	'shockwave-projector-director-12.0.0-win-win',
	'shockwave-projector-director-11.0.0-mac-mac-zip',
	'shockwave-projector-director-11.0.0-win-mac-zip',
	'shockwave-projector-director-11.0.0-hotfix-1-mac-mac-zip',
	'shockwave-projector-director-11.0.0-hotfix-3-mac-mac-zip',
	'shockwave-projector-director-11.0.0-hotfix-3-win-mac-zip',
	'shockwave-projector-director-11.5.0-mac-mac-zip',
	'shockwave-projector-director-11.5.0-win-mac-zip',
	'shockwave-projector-director-11.5.8-mac-mac-zip',
	'shockwave-projector-director-11.5.8-win-mac-zip',
	'shockwave-projector-director-11.5.9-mac-mac-zip',
	'shockwave-projector-director-11.5.9-win-mac-zip',
	'shockwave-projector-director-12.0.0-mac-mac-zip',
	'shockwave-projector-director-12.0.0-win-mac-zip'
];

const platforms = [
	['linux', 'ubuntu-20.04', packages]
];

const nodeVersions = [
	['10.0.0', {
		lint: false
	}],
	['15.5.0', {
		lint: true
	}]
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
		for (const [nodeVersion, options] of nodeVersions) {
			const name = `${platform}_${nodeVersion}`;
			await fs.writeFile(`${name}.yml`, template(
				name,
				runsOn,
				nodeVersion,
				options.lint,
				packages
			));
		}
	}
}
main().catch(err => {
	process.exitCode = 1;
	console.error(err);
});
