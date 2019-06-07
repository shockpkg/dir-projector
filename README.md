# dir-projector

Package for creating Shockwave Director projectors

[![npm](https://img.shields.io/npm/v/@shockpkg/dir-projector.svg)](https://npmjs.com/package/@shockpkg/dir-projector)
[![node](https://img.shields.io/node/v/@shockpkg/dir-projector.svg)](https://nodejs.org)

[![dependencies](https://david-dm.org/shockpkg/dir-projector.svg)](https://david-dm.org/shockpkg/dir-projector)
[![size](https://packagephobia.now.sh/badge?p=@shockpkg/dir-projector)](https://packagephobia.now.sh/result?p=@shockpkg/dir-projector)
[![downloads](https://img.shields.io/npm/dm/@shockpkg/dir-projector.svg)](https://npmcharts.com/compare/@shockpkg/dir-projector?minimal=true)

[![travis-ci](https://travis-ci.org/shockpkg/dir-projector.svg?branch=master)](https://travis-ci.org/shockpkg/dir-projector)


# Overview

Creates Shockwave Director projectors from a projector skeleton.

Takes either a directory containing a skeleton or a shockpkg projector package file.

Certain features may only work on certain platforms.

Reading DMG projector packages is only supported on MacOS.

Features that modify Windows EXE resources requires either Windows or Wine in the path.

Currently only flat projectors are supported, not the kind that Director makes where everything is appended to the main binary in some format, and extracted to a temporary directory when run.


# Usage

## Basic Usage

### Windows

```js
import {ProjectorWindows} from '@shockpkg/dir-projector';

async function main() {
	const projector = new ProjectorWindows({
		skeleton: 'projector.zip',
		movieFile: 'movie.dir',
		movieName: 'movie.dir',
		configFile: 'config.ini'
	});
	await projector.write('out-dir-windows', 'application.exe');
}
main().catch(err => {
	process.exitCode = 1;
	console.error(err);
});
```

### Mac App

```js
import {ProjectorMacApp} from '@shockpkg/dir-projector';

async function main() {
	const projector = new ProjectorMacApp({
		skeleton: 'projector.dmg',
		movieFile: 'movie.dir',
		movieName: 'movie.dir',
		configFile: 'config.ini'
	});
	await projector.write('out-dir-macapp', 'application.app');
}
main().catch(err => {
	process.exitCode = 1;
	console.error(err);
});
```


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019 JrMasterModelBuilder

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
