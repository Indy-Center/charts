// test/lib/server/pinned-airports.test.ts
import { describe, it, expect, vi } from 'vitest';
import { pinnedAirports } from '../../../src/lib/server/pinned-airports';
import type { SessionContext } from '@indy-center/identity';
import { zidTree } from './__fixtures__/zid-tree';
import {
	towerController,
	traconController,
	observer,
	inactivePosition,
	multiPosition
} from './__fixtures__/vnas-controllers';
import { flightPlan } from './__fixtures__/flight-plans';

function withSession(
	activeSession: SessionContext['activeSession'],
	activeFlightPlan: SessionContext['activeFlightPlan'] = null
): SessionContext {
	return {
		user: {} as any,
		roles: [],
		sessionExpiresAt: new Date(),
		activeSession,
		activeFlightPlan
	};
}

describe('pinnedAirports', () => {
	describe('mode resolution', () => {
		it('returns mode: none when session is null', () => {
			expect(pinnedAirports(null, zidTree)).toEqual({ airports: [], mode: 'none' });
		});

		it('returns mode: none when both activeSession and activeFlightPlan are null', () => {
			expect(pinnedAirports(withSession(null, null), zidTree)).toEqual({
				airports: [],
				mode: 'none'
			});
		});

		it('returns mode: controlling when activeSession is present', () => {
			const r = pinnedAirports(withSession(towerController('IND')), zidTree);
			expect(r.mode).toBe('controlling');
		});

		it('returns mode: flying when only activeFlightPlan is present', () => {
			const r = pinnedAirports(withSession(null, flightPlan()), zidTree);
			expect(r.mode).toBe('flying');
		});

		it("prefers controlling when both are non-null (shouldn't happen, but defined behavior)", () => {
			const r = pinnedAirports(withSession(towerController('IND'), flightPlan()), zidTree);
			expect(r.mode).toBe('controlling');
		});
	});

	describe('controlling-mode airports', () => {
		it('returns [] for an observer', () => {
			expect(pinnedAirports(withSession(observer()), zidTree).airports).toEqual([]);
		});

		it('returns [] when all positions are inactive', () => {
			expect(pinnedAirports(withSession(inactivePosition('IND')), zidTree).airports).toEqual([]);
		});

		it('returns the airport plus its child ATCTs when controlling a combined AtctTracon', () => {
			// IND in the fixture is an AtctTracon with BAK as a child Atct.
			expect(pinnedAirports(withSession(towerController('IND')), zidTree).airports).toEqual([
				'BAK',
				'IND'
			]);
		});

		it('returns just the standalone airport when controlling a pure-tower position', () => {
			// EVV in the fixture is an AtctTracon with no child Atcts.
			expect(pinnedAirports(withSession(towerController('EVV')), zidTree).airports).toEqual([
				'EVV'
			]);
		});

		it('unions positions, deduped and sorted', () => {
			const c = multiPosition(['IND', 'EVV', 'IND']);
			// IND → [BAK, IND]; EVV → [EVV]. Unioned + sorted.
			expect(pinnedAirports(withSession(c), zidTree).airports).toEqual(['BAK', 'EVV', 'IND']);
		});

		it('skips positions whose facilityId is not in the tree, warns', () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const c = multiPosition(['IND', 'ZZZ']);
			// IND yields [BAK, IND]; ZZZ logs and contributes nothing.
			expect(pinnedAirports(withSession(c), zidTree).airports).toEqual(['BAK', 'IND']);
			expect(warn).toHaveBeenCalledTimes(1);
			expect(warn.mock.calls[0]![0]).toContain('ZZZ');
		});
	});

	describe('flying-mode airports', () => {
		it('returns departure and arrival', () => {
			const r = pinnedAirports(
				withSession(null, flightPlan({ departure: 'KIND', arrival: 'KCMH' })),
				zidTree
			);
			expect(r.airports).toEqual(['KCMH', 'KIND']);
		});

		it('includes alternate when present', () => {
			const r = pinnedAirports(
				withSession(null, flightPlan({ departure: 'KIND', arrival: 'KCMH', alternate: 'KDAY' })),
				zidTree
			);
			expect(r.airports).toEqual(['KCMH', 'KDAY', 'KIND']);
		});

		it('omits alternate when it is an empty string', () => {
			const r = pinnedAirports(
				withSession(null, flightPlan({ departure: 'KIND', arrival: 'KCMH', alternate: '' })),
				zidTree
			);
			expect(r.airports).toEqual(['KCMH', 'KIND']);
		});

		it('dedupes if alternate equals departure or arrival', () => {
			const r = pinnedAirports(
				withSession(null, flightPlan({ departure: 'KIND', arrival: 'KCMH', alternate: 'KIND' })),
				zidTree
			);
			expect(r.airports).toEqual(['KCMH', 'KIND']);
		});

		it('does NOT walk the ARTCC tree (flight-plan airports are taken verbatim)', () => {
			// Sanity: the tree lookup is only used in controlling mode. Verify by
			// passing a flight plan with airports that wouldn't be in any ARTCC tree —
			// they should still appear.
			const r = pinnedAirports(
				withSession(null, flightPlan({ departure: 'KJFK', arrival: 'KLAX' })),
				zidTree
			);
			expect(r.airports).toEqual(['KJFK', 'KLAX']);
		});
	});
});
