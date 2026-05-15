// test/lib/server/identity.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionContext } from '../../../src/lib/server/identity';
import type { SessionContext } from '@indy-center/identity';

function makeEvent(
	opts: {
		cookie?: string;
		identity?: { getSessionContext: (token: string) => Promise<SessionContext | null> };
	} = {}
) {
	return {
		cookies: { get: (name: string) => (name === 'fic_session' ? opts.cookie : undefined) },
		platform: opts.identity ? { env: { IDENTITY: opts.identity } } : { env: {} }
	} as unknown as import('@sveltejs/kit').RequestEvent;
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('getSessionContext', () => {
	it('returns null when there is no session cookie', async () => {
		const event = makeEvent({});
		expect(await getSessionContext(event)).toBeNull();
	});

	it('returns null when IDENTITY binding is not available', async () => {
		const event = makeEvent({ cookie: 'abc' });
		expect(await getSessionContext(event)).toBeNull();
	});

	it('returns null and logs when the binding throws', async () => {
		const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
		const event = makeEvent({
			cookie: 'abc',
			identity: { getSessionContext: () => Promise.reject(new Error('rpc down')) }
		});
		expect(await getSessionContext(event)).toBeNull();
		expect(consoleErr).toHaveBeenCalled();
	});

	it('returns the SessionContext when the binding returns one', async () => {
		const ctx: SessionContext = {
			user: {
				id: 'u1',
				cid: '1',
				email: 'x@y.com',
				isActive: true,
				vatsimData: { cid: '1', personal: { email: 'x@y.com' } },
				attributes: {},
				createdAt: 0,
				updatedAt: 0
			} as any,
			roles: [],
			sessionExpiresAt: new Date(),
			activeSession: null,
			activeFlightPlan: null
		};
		const event = makeEvent({
			cookie: 'abc',
			identity: { getSessionContext: async () => ctx }
		});
		const result = await getSessionContext(event);
		expect(result).toBe(ctx);
	});
});
