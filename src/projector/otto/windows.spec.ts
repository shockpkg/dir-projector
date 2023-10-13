import {shouldTest, getInstalledPackagesSync} from '../../util.spec';

export function listSamples() {
	if (!shouldTest('windows-i386')) {
		return [];
	}
	const r = [];
	for (const name of getInstalledPackagesSync()) {
		const m = name.match(/^shockwave-projector-director-([\d.]+)-\w+-win$/);
		if (!m) {
			continue;
		}
		const version = m[1].split('.').map(Number);
		if (version[0] < 7) {
			continue;
		}
		r.push({
			name,
			version,
			patchShockwave3dInstalledDisplayDriversSize:
				version[0] > 8 || (version[0] === 8 && version[1] >= 5)
		});
	}
	return r;
}

export const versionStrings = {
	FileVersion: '3.14.15.92',
	ProductVersion: '3.1.4.1',
	CompanyName: 'Custom Company Name',
	FileDescription: 'Custom File Description',
	LegalCopyright: 'Custom Legal Copyright',
	ProductName: 'Custom Pruduct Name',
	LegalTrademarks: 'Custom Legal Trademarks',
	OriginalFilename: 'CustomOriginalFilename.exe',
	InternalName: 'CustomInternalName',
	Comments: 'Custom Comments'
};
