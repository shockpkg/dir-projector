# dir-projector

Package for creating Shockwave Director projectors

[![npm](https://img.shields.io/npm/v/@shockpkg/dir-projector.svg)](https://npmjs.com/package/@shockpkg/dir-projector)
[![node](https://img.shields.io/node/v/@shockpkg/dir-projector.svg)](https://nodejs.org)

[![dependencies](https://david-dm.org/shockpkg/dir-projector.svg)](https://david-dm.org/shockpkg/dir-projector)
[![size](https://packagephobia.now.sh/badge?p=@shockpkg/dir-projector)](https://packagephobia.now.sh/result?p=@shockpkg/dir-projector)
[![downloads](https://img.shields.io/npm/dm/@shockpkg/dir-projector.svg)](https://npmcharts.com/compare/@shockpkg/dir-projector?minimal=true)

[![travis-ci](https://travis-ci.com/shockpkg/dir-projector.svg?branch=master)](https://travis-ci.com/shockpkg/dir-projector)


# Overview

Creates Shockwave Director projectors from a projector skeleton.

Takes either a directory containing a skeleton or a shockpkg projector package file.

Can also create bundles that group the projector and resources in a directory beside a single launcher for Windows or within an application bundle for macOS.

Reading DMG projector packages is only supported on macOS.

Currently only flat projectors are supported, not the kind that Director makes where everything is appended to the main binary in some format, and extracted to a temporary directory when run.


# Usage

## Projector

### Windows

```js
import {ProjectorWindows32} from '@shockpkg/dir-projector';

const projector = new ProjectorWindows('projector-windows32/application.exe');

// Optional custom icon.
projector.iconFile = 'icon.ico';

// Optional custom PE resource strings.
projector.versionStrings = {
	FileVersion: '3.1.4',
	ProductVersion: '3.1.4',
	CompanyName: 'Custom Company Name',
	FileDescription: 'Custom File Description',
	LegalCopyright: 'Custom Legal Copyright',
	ProductName: 'Custom Product Name',
	LegalTrademarks: 'Custom Legal Trademarks',
	OriginalFilename: 'CustomOriginalFilename.exe',
	InternalName: 'CustomInternalName',
	Comments: 'Custom Comments'
};

// Optional Lingo startup script.
projector.lingoFile = 'lingo.ini';

// Optional splash screen image.
projector.splashImageFile = 'splash.bmp';

// Optionally use system installed Shockwave libraries.
// projector.shockwave = true;

// Xtras included (all in this case).
projector.includeXtras = {
	'': null
};

// Optionally nest Xtras in Configuration directory.
projector.nestXtrasConfiguration = true;

// Optionally fix Shockwave 3D Xtra InstalledDisplayDrivers reading.
projector.patchShockwave3dInstalledDisplayDriversSize = true;

await projector.withFile('skeleton.zip', 'config.ini');
```

### Mac App

```js
import {ProjectorMacApp} from '@shockpkg/dir-projector';

const projector = new ProjectorMacApp('projector-macapp/application.app');

// Optional custom icon.
projector.iconFile = 'icon.icns';

// Optionally change main binary name.
projector.binaryName = 'application';

// Optionally base Info.plist file.
projector.infoPlistFile = 'Info.plist';

// Optionally custom PkgInfo file.
projector.pkgInfoFile = 'PkgInfo';

// Optionally update bundle name.
projector.bundleName = 'application';

// Optional Lingo startup script.
projector.lingoFile = 'lingo.ini';

// Optional splash screen image.
projector.splashImageFile = 'splash.pict';

// Optionally use system installed Shockwave libraries.
// projector.shockwave = true;

// Xtras included (all in this case).
projector.includeXtras = {
	'': null
};

// Optionally nest Xtras in Configuration directory.
// projector.nestXtrasConfiguration = true;

// Optionally nest Xtras inside the app Contents directory.
projector.nestXtrasContents = true;

// Optionally use Intel-only skeleton.
// projector.intel = true;

await projector.withFile('skeleton.dmg', 'config.ini');
```


## Bundle

### Windows

```js
import {BundleWindows32} from '@shockpkg/dir-projector';

const bundle = new BundleWindows32('bundle-windows32/application.exe');

// Use projector property to set options.
bundle.projector.includeXtras = {
	'': null
};

await bundle.withFile('skeleton.zip', 'config.ini', async b => {
	// Add resources in callback.
	await b.copyResource('movie.dir', 'movie.dir');
});
```

### Mac App

```js
import {BundleMacApp} from '@shockpkg/dir-projector';

const bundle = new BundleMacApp('bundle-macapp/application.app');

// Use projector property to set options.
bundle.projector.includeXtras = {
	'': null
};

await bundle.withFile('skeleton.dmg', 'config.ini', async b => {
	// Add resources in callback.
	await b.copyResource('movie.dir', 'movie.dir');
});
```


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019-2020 JrMasterModelBuilder

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
