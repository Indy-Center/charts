import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/routes/api/charts/[airport]/+server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures');
const kindBody = readFileSync(join(fixturesDir, 'aviationapi-kind.json'), 'utf8');
const malformed = readFileSync(join(fixturesDir, 'aviationapi-malformed.json'), 'utf8');

function makeEvent(airport: string, fetchImpl: typeof fetch) {
	return {
		params: { airport },
		fetch: fetchImpl,
		request: new Request(`http://test/api/charts/${airport}`),
		platform: undefined
	} as unknown as Parameters<typeof GET>[0];
}

describe('GET /api/charts/[airport]', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('returns 400 for invalid airport id', async () => {
		const f = vi.fn();
		const resp = await GET(makeEvent('XX', f));
		expect(resp.status).toBe(400);
		const body = await resp.json();
		expect(body.error).toBe('invalid_airport_id');
		expect(f).not.toHaveBeenCalled();
	});

	it('proxies and returns normalized data on success', async () => {
		const f = vi.fn(
			async () =>
				new Response(kindBody, { status: 200, headers: { 'content-type': 'application/json' } })
		);
		const resp = await GET(makeEvent('IND', f));
		expect(resp.status).toBe(200);
		const body = await resp.json();
		expect(body.airport.faa_ident).toBe('IND');
		expect(body.chartsByGroup.airport_diagram).toBeInstanceOf(Array);
	});

	it('returns 502 upstream_unavailable on 5xx', async () => {
		const f = vi.fn(async () => new Response('boom', { status: 500 }));
		const resp = await GET(makeEvent('KIND', f));
		expect(resp.status).toBe(502);
		const body = await resp.json();
		expect(body.error).toBe('upstream_unavailable');
	});

	it('returns 502 upstream_shape_mismatch on bad payload', async () => {
		const f = vi.fn(
			async () =>
				new Response(malformed, { status: 200, headers: { 'content-type': 'application/json' } })
		);
		const resp = await GET(makeEvent('KIND', f));
		expect(resp.status).toBe(502);
		const body = await resp.json();
		expect(body.error).toBe('upstream_shape_mismatch');
	});
});
