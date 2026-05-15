import { describe, it, expect } from 'vitest';
import { normalizeForApi, displayForm } from '$lib/airport-id';

describe('normalizeForApi', () => {
	it.each([
		['IND', 'KIND'],
		['ind', 'KIND'],
		[' IND ', 'KIND'],
		['CMH', 'KCMH'],
		['KIND', 'KIND'],
		['kind', 'KIND'],
		['I69', 'I69'],
		['i69', 'I69'],
		['KI69', 'KI69'],
		['K1G1', 'K1G1']
	])('normalizes %s -> %s', (input, expected) => {
		expect(normalizeForApi(input)).toBe(expected);
	});

	it.each([
		['', null],
		['A', null],
		['AB', null],
		['ABCDE', null],
		['I-69', null]
	])('returns null for invalid %s', (input, expected) => {
		expect(normalizeForApi(input)).toBe(expected);
	});
});

describe('displayForm', () => {
	it('prefers FAA ident when present', () => {
		expect(displayForm('IND', 'KIND')).toBe('IND');
	});

	it('falls back to ICAO ident when FAA missing', () => {
		expect(displayForm(undefined, 'KIND')).toBe('KIND');
	});

	it('returns FAA when ICAO missing', () => {
		expect(displayForm('I69', undefined)).toBe('I69');
	});
});
