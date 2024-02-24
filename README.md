# DIR Projector

Package for creating Shockwave Director projectors

[![npm](https://img.shields.io/npm/v/@shockpkg/dir-projector.svg)](https://npmjs.com/package/@shockpkg/dir-projector)
[![node](https://img.shields.io/node/v/@shockpkg/dir-projector.svg)](https://nodejs.org)

[![size](https://packagephobia.now.sh/badge?p=@shockpkg/dir-projector)](https://packagephobia.now.sh/result?p=@shockpkg/dir-projector)
[![downloads](https://img.shields.io/npm/dm/@shockpkg/dir-projector.svg)](https://npmcharts.com/compare/@shockpkg/dir-projector?minimal=true)

[![Build Status](https://github.com/shockpkg/dir-projector/workflows/main/badge.svg)](https://github.com/shockpkg/dir-projector/actions?query=workflow%3Amain+branch%3Amaster)

# Overview

Creates Shockwave Director projectors from a projector skeleton.

Takes either a directory containing a skeleton or a shockpkg projector package file.

Can also create bundles that group the projector and resources in a directory beside a single launcher for Windows or within an application bundle for macOS.

Reading DMG projector packages is only supported on macOS.

Currently only flat projectors are supported, not the kind that Director makes where everything is appended to the main binary in some format, and extracted to a temporary directory when run.

# Usage

## Projector

### Otto

#### Windows

```js
import {ProjectorOttoWindows} from '@shockpkg/dir-projector';

const projector = new ProjectorOttoWindows('projector-windows/application.exe');

// Required skeleton.
projector.skeleton = 'skeleton.zip';

// File to create config file with.
projector.configFile = 'config.ini';

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

await projector.write();
```

#### Mac

```js
import {ProjectorOttoMac} from '@shockpkg/dir-projector';

const projector = new ProjectorOttoMac('projector-mac/application.app');

// Required skeleton.
projector.skeleton = 'skeleton.zip';

// File to create config file with.
projector.configFile = 'config.ini';

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

await projector.write();
```

### HTML

```js
import {ProjectorHtml} from '@shockpkg/dir-projector';

const projector = new ProjectorHtml('projector-html/application.html');

// Required properties.
projector.src = 'movie.dir';
projector.width = 640;
projector.height = 480;

// Optionally configure HTML document.
p.lang = 'en-US';
p.title = 'A "special" title with <html> characters';
p.background = '#000000';
p.color = '#999999';

// Optionally configure object/param/embed elements.
p.bgcolor = '#000000';
p.id = 'element-id';
p.name = 'element-name';
p.codebase =
	'http://download.macromedia.com/pub/shockwave/cabs/director/sw.cab#version=12,0,0,112';
p.pluginspage = 'http://www.macromedia.com/shockwave/download/';
p.swStretchStyle = 'none';
p.swStretchHAlign = 'center';
p.swStretchVAlign = 'center';
p.swRemote =
	"swSaveEnabled='false' swVolume='false' swRestart='false' swPausePlay='false' swFastForward='false' swContextMenu='true'";
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

await projector.write();
```

## Bundle

### Otto

#### Windows

```js
import {BundleOttoWindows} from '@shockpkg/dir-projector';

const bundle = new BundleOttoWindows('bundle-windows/application.exe');

// Use projector property to set options.
bundle.projector.skeleton = 'skeleton.zip';

// File to create config file with.
bundle.projector.configFile = 'config.ini';

await bundle.write(async b => {
	// Add resources in callback.
	await b.copyResource('movie.dir', 'movie.dir');
});
```

#### Mac

```js
import {BundleOttoMac} from '@shockpkg/dir-projector';

const bundle = new BundleOttoMac('bundle-mac/application.app');

// Use projector property to set options.
bundle.projector.skeleton = 'skeleton.zip';

// File to create config file with.
bundle.projector.configFile = 'config.ini';

await bundle.write(async b => {
	// Add resources in callback.
	await b.copyResource('movie.dir', 'movie.dir');
});
```

### HTML

```js
import {BundleHtml} from '@shockpkg/dir-projector';

const bundle = new BundleHtml('bundle-html/application.html');

// Use projector property to set options.
bundle.projector.src = 'movie.dir';
bundle.projector.width = 640;
bundle.projector.height = 480;

await bundle.write(async b => {
	// Add resources in callback.
	await b.copyResource('movie.dir', 'movie.dir');
});
```

A bundle can also be made "flat" into an empty directory with nesting the resources or adding a launcher stub by passing true as the second argument to the constructor.

# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.

# License

Copyright (c) 2019-2024 JrMasterModelBuilder

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.
