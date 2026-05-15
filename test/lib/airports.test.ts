import { describe, it, expect } from 'vitest';
import { COMMON_AIRPORTS } from '$lib/airports';

describe('COMMON_AIRPORTS', () => {
	it('contains the expected ICAOs from community-website', () => {
		expect(COMMON_AIRPORTS).toEqual([
			'KCMH',
			'KCRW',
			'KCVG',
			'KDAY',
			'KEVV',
			'KHTS',
			'KHUF',
			'KIND',
			'KLEX',
			'KPKB',
			'KSDF'
		]);
	});

	it('every entry is a 4-letter K-prefixed ICAO', () => {
		for (const icao of COMMON_AIRPORTS) {
			expect(icao).toMatch(/^K[A-Z]{3}$/);
		}
	});
});
