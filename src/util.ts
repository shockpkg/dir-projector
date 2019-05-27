import {
	Entry,
	PathType
} from '@shockpkg/archive-files';
// @ts-ignore
import _rcedit from 'rcedit';
import {
	parser as saxParser
} from 'sax';
import xmlEscape from 'xml-escape';

export interface IRceditOptionsVersionStrings {
	[key: string]: string;
}

export interface IRceditOptions {
	/**
	 * Icon path.
	 *
	 * @defaultValue null
	 */
	iconPath?: string | null;

	/**
	 * File version.
	 *
	 * @defaultValue null
	 */
	fileVersion?: string | null;

	/**
	 * Product version.
	 *
	 * @defaultValue null
	 */
	productVersion?: string | null;

	/**
	 * Version strings.
	 *
	 * @defaultValue null
	 */
	versionStrings?: IRceditOptionsVersionStrings | null;
}

/**
 * Default value if value is undefined.
 *
 * @param value Value.
 * @param defaultValue Default value.
 * @return Value or the default value if undefined.
 */
export function defaultValue<T, U>(
	value: T,
	defaultValue: U
): Exclude<T | U, undefined> {
	return value === undefined ? defaultValue : (value as any);
}

/**
 * Default null if value is undefined.
 *
 * @param value Value.
 * @return Value or null if undefined.
 */
export function defaultNull<T>(value: T) {
	return defaultValue(value, null);
}

/**
 * Default false if value is undefined.
 *
 * @param value Value.
 * @return Value or false if undefined.
 */
export function defaultFalse<T>(value: T) {
	return defaultValue(value, false);
}

/**
 * Default true if value is undefined.
 *
 * @param value Value.
 * @return Value or true if undefined.
 */
export function defaultTrue<T>(value: T) {
	return defaultValue(value, true);
}

/**
 * Check if Archive Entry is empty resource fork.
 *
 * @param entry Archive Entry.
 * @return Is empty resource fork.
 */
export function entryIsEmptyResourceFork(entry: Entry) {
	return entry.type === PathType.RESOURCE_FORK && !entry.size;
}

/**
 * Find path relative from base, if base matches.
 *
 * @param path Path to match against.
 * @param start Search start.
 * @param nocase Match case-insensitive.
 * @return Returns path, or null.
 */
export function pathRelativeBase(
	path: string,
	start: string,
	nocase = false
) {
	const p = nocase ? path.toLowerCase() : path;
	const s = nocase ? start.toLowerCase() : start;
	if (p === s) {
		return '';
	}
	if (p.startsWith(`${s}/`)) {
		return path.substr(s.length + 1);
	}
	return null;
}

/**
 * Same as pathRelativeBase, but retuns true on a match, else false.
 *
 * @param path Path to match against.
 * @param start Search start.
 * @param nocase Match case-insensitive.
 * @return Returns true on match, else false.
 */
export function pathRelativeBaseMatch(
	path: string,
	start: string,
	nocase = false
) {
	const p = nocase ? path.toLowerCase() : path;
	const s = nocase ? start.toLowerCase() : start;
	if (p === s) {
		return true;
	}
	if (p.startsWith(`${s}/`)) {
		return true;
	}
	return false;
}

/**
 * Trim a file extenion.
 *
 * @param path File path.
 * @param ext File extension.
 * @param nocase Match case-insensitive.
 * @return Path without file extension.
 */
export function trimExtension(
	path: string,
	ext: string,
	nocase = false
) {
	const p = nocase ? path.toLowerCase() : path;
	const e = nocase ? ext.toLowerCase() : ext;
	return p.endsWith(e) ? path.substr(0, p.length - e.length) : path;
}

/**
 * Escape string for XML.
 *
 * @param value String value.
 * @return Escaped string.
 */
export function xmlEntities(value: string) {
	return xmlEscape(value);
}

/**
 * Encode string into plist string tag.
 *
 * @param value String value.
 * @return Plist string.
 */
export function plistStringTag(value: string) {
	return `<string>${xmlEntities(value)}</string>`;
}

/**
 * A small utility function for replacing Info.plist values.
 *
 * @param xml XML string.
 * @param key Plist dict key.
 * @param value Plist dict value, XML tag.
 * @return Update document.
 */
export function infoPlistReplace(
	xml: string,
	key: string,
	value: string
) {
	let replaceTagStart = -1;
	let replaceTagEnd = -1;

	const parser = saxParser(true, {});

	// Get the tag path in a consistent way.
	const tagPath = () => {
		const tags = [...(parser as any).tags];
		const tag = (parser as any).tag;
		if (tag && tags[tags.length - 1] !== tag) {
			tags.push(tag);
		}
		return tags.map(o => o.name as string);
	};

	const dictTag = () => {
		const path = tagPath();
		if (
			path.length !== 3 ||
			path[0] !== 'plist' ||
			path[1] !== 'dict'
		) {
			return null;
		}
		return path[2];
	};

	let keyTag = false;
	let nextTag = false;

	parser.onerror = err => {
		throw err;
	};
	parser.ontext = text => {
		if (keyTag && text === key) {
			nextTag = true;
		}
	};
	parser.onopentag = node => {
		const tag = dictTag();
		if (!tag) {
			return;
		}
		if (tag === 'key') {
			keyTag = true;
			return;
		}
		if (!nextTag) {
			return;
		}

		if (replaceTagStart < 0) {
			replaceTagStart = parser.startTagPosition - 1;
		}
	};
	parser.onclosetag = node => {
		const tag = dictTag();
		if (!tag) {
			return;
		}
		if (tag === 'key') {
			keyTag = false;
			return;
		}
		if (!nextTag) {
			return;
		}
		nextTag = false;

		if (replaceTagEnd < 0) {
			replaceTagEnd = parser.position;
		}
	};

	parser.write(xml).close();

	// No change.
	if (replaceTagStart < 0 || replaceTagEnd < 0) {
		return xml;
	}

	// Splice in new value.
	const before = xml.substr(0, replaceTagStart);
	const after = xml.substr(replaceTagEnd);
	return `${before}${value}${after}`;
}

/**
 * Uses rcedit to edit the resources of a Windows EXE.
 * Requires either Windows or wine in the path.
 *
 * @param path File path.
 * @param options Options object.
 */
export async function rcedit(
	path: string,
	options: IRceditOptions
) {
	const opts: {[key: string]: any} = {};
	if (options.iconPath) {
		opts.icon = options.iconPath;
	}
	if (typeof options.fileVersion === 'string') {
		opts['file-version'] = options.fileVersion;
	}
	if (typeof options.productVersion === 'string') {
		opts['product-version'] = options.productVersion;
	}
	if (options.versionStrings) {
		opts['version-string'] = options.versionStrings;
	}
	await new Promise((resolve, reject) => {
		_rcedit(path, opts, (err: any) => {
			if (err) {
				reject(err);
				return;
			}
			resolve();
		});
	});
}
