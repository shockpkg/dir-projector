import {writeFile} from 'fs/promises';

import {Projector} from '../projector';

/**
 * HTML encode.
 *
 * @param s Raw strings.
 * @returns HTML strings.
 */
function he(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * ProjectorHtml object.
 */
export class ProjectorHtml extends Projector {
	/**
	 * The HTML document title.
	 */
	public title: string | null = null;

	/**
	 * HTML document background style.
	 */
	public background: string | null = null;

	/**
	 * HTML document color style.
	 */
	public color: string | null = null;

	/**
	 * Required <object> classid attribute.
	 */
	public classid: string = 'clsid:166B1BCA-3F9C-11CF-8075-444553540000';

	/**
	 * Required <embed> type attribute.
	 */
	public type: string = 'application/x-director';

	/**
	 * The <object> codebase attribute.
	 */
	public codebase: string | null = null;

	/**
	 * The <embed> codebase attribute.
	 */
	public pluginspage: string | null = null;

	/**
	 * Required src/movie URL.
	 */
	public src: string = '';

	/**
	 * Required movie width.
	 */
	public width: string | number | null = null;

	/**
	 * Required movie height.
	 */
	public height: string | number | null = null;

	/**
	 * The movie background color.
	 */
	public bgColor: string | null = null;

	/**
	 * The movie stretch style (none | meet | fill | stage).
	 */
	public swStretchStyle: string | null = null;

	/**
	 * The stretch horizontal alignment (left | center | right).
	 */
	public swStretchHAlign: string | null = null;

	/**
	 * The stretch vertical alignment (top | center | bottom).
	 */
	public swStretchVAlign: string | null = null;

	/**
	 * A set of parameters in the form of "swVolume='false' swRestart='true'".
	 * Boolean: swSaveEnabled.
	 * Boolean: swVolume.
	 * Boolean: swRestart.
	 * Boolean: swPausePlay.
	 * Boolean: swFastForward.
	 * Boolean: swContextMenu.
	 */
	public swRemote: string | null = null;

	/**
	 * Custom parameter 1.
	 */
	public sw1: string | null = null;

	/**
	 * Custom parameter 2.
	 */
	public sw2: string | null = null;

	/**
	 * Custom parameter 3.
	 */
	public sw3: string | null = null;

	/**
	 * Custom parameter 4.
	 */
	public sw4: string | null = null;

	/**
	 * Custom parameter 5.
	 */
	public sw5: string | null = null;

	/**
	 * Custom parameter 6.
	 */
	public sw6: string | null = null;

	/**
	 * Custom parameter 7.
	 */
	public sw7: string | null = null;

	/**
	 * Custom parameter 8.
	 */
	public sw8: string | null = null;

	/**
	 * Custom parameter 9.
	 */
	public sw9: string | null = null;

	/**
	 * The progress attribute (controls loading screen?).
	 */
	public progress: string | boolean | null = null;

	/**
	 * The logo attribute (controls loading screen?).
	 */
	public logo: string | boolean | null = null;

	/**
	 * The playerversion attribute (for update checking?).
	 */
	public playerVersion: string | number | null = null;

	/**
	 * Custom HTML to use instead of generated HTML.
	 */
	public html: string | (() => string) | (() => Promise<string>) | null =
		null;

	/**
	 * ProjectorHtml constructor.
	 *
	 * @param path Output path.
	 */
	constructor(path: string) {
		super(path);
	}

	/**
	 * @inheritdoc
	 */
	public async write() {
		await writeFile(this.path, this.getHtmlDefault());
	}

	/**
	 * Get HTML document code.
	 *
	 * @returns HTML code.
	 */
	public async getHtml() {
		const {html} = this;
		if (html) {
			return typeof html === 'function' ? html() : html;
		}
		return this.getHtmlDefault();
	}

	/**
	 * Get the default HTML document code.
	 *
	 * @returns HTML code.
	 */
	public getHtmlDefault() {
		const {
			title,
			background,
			color,
			classid,
			type,
			codebase,
			pluginspage,
			src,
			width,
			height,
			bgColor,
			swStretchStyle,
			swStretchHAlign,
			swStretchVAlign,
			swRemote,
			sw1,
			sw2,
			sw3,
			sw4,
			sw5,
			sw6,
			sw7,
			sw8,
			sw9,
			progress,
			logo,
			playerVersion
		} = this;

		if (!src) {
			throw new Error('Required property: src');
		}
		if (width === null) {
			throw new Error('Required property: width');
		}
		if (height === null) {
			throw new Error('Required property: height');
		}

		const object = new Map<string, string>();
		object.set('classid', classid);
		if (codebase !== null) {
			object.set('codebase', codebase);
		}
		object.set('width', `${width}`);
		object.set('height', `${height}`);

		const param = new Map<string, string>();
		param.set('movie', src);

		const embed = new Map<string, string>();
		embed.set('type', type);
		if (pluginspage !== null) {
			embed.set('pluginspage', pluginspage);
		}
		embed.set('width', `${width}`);
		embed.set('height', `${height}`);
		embed.set('src', src);

		for (const [k, v] of [
			['bgcolor', bgColor],
			['swstretchstyle', swStretchStyle],
			['swstretchhalign', swStretchHAlign],
			['swStretchvalign', swStretchVAlign],
			['swremote', swRemote],
			['sw1', sw1],
			['sw2', sw2],
			['sw3', sw3],
			['sw4', sw4],
			['sw5', sw5],
			['sw6', sw6],
			['sw7', sw7],
			['sw8', sw8],
			['sw9', sw9],
			['progress', progress],
			['logo', logo],
			['playerversion', playerVersion]
		] as [string, string | number | boolean | null][]) {
			if (v !== null) {
				param.set(k, `${v}`);
				embed.set(k, `${v}`);
			}
		}

		return [
			'<!DOCTYPE html>',
			'<html>',
			' <head>',
			'  <meta charset="UTF-8">',
			...(title === null ? [] : [`  <title>${he(title)}</title>`]),
			'  <meta http-equiv="X-UA-Compatible" content="IE=Edge">',
			'  <style>',
			'   * {',
			'    margin: 0;',
			'    padding: 0;',
			'   }',
			'   html,',
			'   body {',
			'    height: 100%;',
			'   }',
			'   body {',
			...(background === null
				? []
				: [`    background: ${he(background)};`]),
			...(color === null ? [] : [`    color: ${he(color)};`]),
			'    font-family: Verdana, Geneva, sans-serif;',
			'   }',
			'   object,',
			'   embed {',
			'    display: block;',
			'    outline: 0;',
			'   }',
			'   object:focus,',
			'   embed:focus {',
			'    outline: 0;',
			'   }',
			'   .main {',
			'    display: table;',
			'    height: 100%;',
			'    width: 100%;',
			'   }',
			'   .player {',
			'    display: table-cell;',
			'    vertical-align: middle;',
			'   }',
			'   .player object,',
			'   .player embed {',
			'    margin: 0 auto;',
			'   }',
			'  </style>',
			' </head>',
			' <body>',
			'  <div class="main">',
			'   <div class="player">',
			'    <object',
			...[...object.entries()].map(([a, v]) => `     ${a}="${he(v)}"`),
			'    >',
			...[...param.entries()].map(
				([a, v]) => `     <param name="${a}" value="${he(v)}">`
			),
			'     <embed',
			...[...embed.entries()].map(([a, v]) => `      ${a}="${he(v)}"`),
			'     >',
			'    </object>',
			'   </div>',
			'  </div>',
			' </body>',
			'</html>',
			''
		]
			.map(s => s.replace(/^\s+/, s => '\t'.repeat(s.length)))
			.join('\n');
	}
}