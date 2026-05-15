import { describe, it, expect, beforeEach } from 'vitest';
import { airportCache } from '$lib/airport-cache';
import type { AirportData } from '$lib/types';

const sample: AirportData = {
	airport: { country: 'USA', faa_ident: 'IND', is_military: false },
	chartsByGroup: {
		airport_diagram: [],
		general: [],
		approach: [],
		departure: [],
		arrival: []
	}
};

describe('airportCache', () => {
	beforeEach(() => airportCache.clear());

	it('stores and retrieves by faa_ident', () => {
		airportCache.set(sample);
		expect(airportCache.get('IND')).toEqual(sample);
	});

	it('returns undefined for unknown ident', () => {
		expect(airportCache.get('ZZZ')).toBeUndefined();
	});

	it('case-insensitive lookup', () => {
		airportCache.set(sample);
		expect(airportCache.get('ind')).toEqual(sample);
	});

	it('also stores under icao_ident when present', () => {
		airportCache.set({
			airport: { country: 'USA', faa_ident: 'IND', icao_ident: 'KIND', is_military: false },
			chartsByGroup: { airport_diagram: [], general: [], approach: [], departure: [], arrival: [] }
		});
		expect(airportCache.get('IND')).toBeDefined();
		expect(airportCache.get('KIND')).toBeDefined();
	});
});
