import {
	platformIsMac,
	shouldTest,
	getInstalledPackagesSync
} from '../../util.spec';

export function listSamples() {
	if (!shouldTest('mac')) {
		return [];
	}
	const r = [];
	for (const name of getInstalledPackagesSync()) {
		const m = name.match(
			/^shockwave-projector-director-([\d.]+)-\w+-mac(-zip)?$/
		);
		if (!m) {
			continue;
		}
		if (!platformIsMac && m[2] !== '-zip') {
			continue;
		}
		const version = m[1].split('.').map(Number);
		if (version[0] < 11) {
			continue;
		}
		r.push({
			name,
			version,
			nestXtrasContents:
				version[0] > 11 || (version[0] === 11 && version[1] >= 5),
			intel:
				version[0] > 11 ||
				(version[0] === 11 && version[1] >= 5 && version[2] >= 9)
		});
	}
	return r;
}
