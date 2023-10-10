import {describe, it} from 'node:test';
import {deepStrictEqual, strictEqual} from 'node:assert';
import {createHash} from 'node:crypto';

import {machoAppLauncher, machoTypesData} from './mac';

const unhex = (hex: string) => Buffer.from(hex.replace(/\s/g, ''), 'hex');

function sha256(data: Buffer) {
	return createHash('sha256').update(data).digest('hex');
}

const machoTypes = [
	{
		name: 'slim: ppc',
		data: unhex('FE ED FA CE 00 00 00 12 00 00 00 0A'),
		format: {
			cpuType: 0x00000012,
			cpuSubtype: 10
		},
		launcher:
			'17414c123fe82ac74a89fad9c80e36d8b612ded5a520e35f3c33eabe75a023a7'
	},
	{
		name: 'slim: i386',
		data: unhex('CE FA ED FE 07 00 00 00 03 00 00 00'),
		format: {
			cpuType: 0x00000007,
			cpuSubtype: 3
		},
		launcher:
			'e52e19fce336130824dcfd4731bf85db7e8e96628ef8c6a49769dc5247ef6ed0'
	},
	{
		name: 'fat: ppc, i386',
		data: unhex(
			[
				'CA FE BA BE 00 00 00 02',
				'00 00 00 12 00 00 00 0A 00 00 00 00 00 00 00 00 00 00 00 00',
				'00 00 00 07 00 00 00 03 00 00 00 00 00 00 00 00 00 00 00 00'
			].join('')
		),
		format: [
			{
				cpuType: 0x00000012,
				cpuSubtype: 10
			},
			{
				cpuType: 0x00000007,
				cpuSubtype: 3
			}
		],
		launcher:
			'fcf8fa0449ff4e6302deb70d5223a962f878ab046c3bf1fb0d9522ac07847adb'
	}
];

void describe('util/mac', () => {
	void describe('machoTypesData', () => {
		for (const {name, data, format} of machoTypes) {
			void it(name, () => {
				deepStrictEqual(machoTypesData(data), format);
			});
		}
	});

	void describe('machoAppLauncher', () => {
		for (const {name, format, launcher} of machoTypes) {
			void it(name, async () => {
				const data = await machoAppLauncher(format);
				deepStrictEqual(machoTypesData(data), format);
				strictEqual(sha256(data), launcher);
			});
		}
	});
});
