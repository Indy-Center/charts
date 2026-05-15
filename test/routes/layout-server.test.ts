// test/routes/layout-server.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from '../../src/routes/+layout.server';
import { __resetCacheForTests } from '../../src/lib/server/artcc-tree';
import { zidTree } from '../lib/server/__fixtures__/zid-tree';
import { approachController, towerController } from '../lib/server/__fixtures__/vnas-controllers';
import { flightPlan } from '../lib/server/__fixtures__/flight-plans';
import type { SessionContext } from '@indy-center/identity';

beforeEach(() => {
	__resetCacheForTests();
});

afterEach(() => {
	vi.restoreAllMocks();
});

function mockTreeFetch() {
	vi.spyOn(globalThis, 'fetch').mockResolvedValue(
		new Response(JSON.stringify({ id: 'ZID', facility: zidTree }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		})
	);
}

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

function makeEvent(session: SessionContext | null) {
	return { locals: { session } } as unknown as Parameters<typeof load>[0];
}

describe('+layout.server load', () => {
	it('returns empty pinnedAirports when session is null, without fetching', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const result = await load(makeEvent(null));
		expect(result.session).toBeNull();
		expect(result.pinnedAirports).toEqual({ airports: [], mode: 'none' });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns empty pinnedAirports when both activeSession and activeFlightPlan are null, without fetching', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const session = withSession(null, null);
		const result = await load(makeEvent(session));
		expect(result.session).toBe(session);
		expect(result.pinnedAirports).toEqual({ airports: [], mode: 'none' });
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('returns controlled airports and mode: controlling for an active controller session', async () => {
		mockTreeFetch();
		// IND_APP is an approach position at the IND AtctTracon, so it pulls in
		// the satellite Atct (BAK) too. A tower-only position would just be ['IND'].
		const session = withSession(approachController('IND'), null);
		const result = await load(makeEvent(session));
		expect(result.pinnedAirports.airports).toEqual(['BAK', 'IND']);
		expect(result.pinnedAirports.mode).toBe('controlling');
	});

	it('returns flying airports without fetching the ARTCC tree when only a flight plan is active', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const session = withSession(null, flightPlan());
		const result = await load(makeEvent(session));
		expect(result.pinnedAirports.mode).toBe('flying');
		expect(result.pinnedAirports.airports).toEqual(['KCMH', 'KIND']);
		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('falls back to empty pinnedAirports when the ARTCC fetch fails on a cold cache', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
		const session = withSession(towerController('IND'), null);
		const result = await load(makeEvent(session));
		expect(result.pinnedAirports).toEqual({ airports: [], mode: 'none' });
	});
});
