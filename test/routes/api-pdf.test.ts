import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/routes/api/pdf/+server';

function makeEvent(targetUrl: string | null, fetchImpl: typeof fetch) {
	const search = targetUrl === null ? '' : `?url=${encodeURIComponent(targetUrl)}`;
	return {
		url: new URL(`http://test/api/pdf${search}`),
		fetch: fetchImpl,
		request: new Request(`http://test/api/pdf${search}`)
	} as unknown as Parameters<typeof GET>[0];
}

describe('GET /api/pdf', () => {
	beforeEach(() => vi.restoreAllMocks());

	it('returns 400 when url param missing', async () => {
		const f = vi.fn();
		await expect(GET(makeEvent(null, f))).rejects.toMatchObject({ status: 400 });
		expect(f).not.toHaveBeenCalled();
	});

	it('returns 400 for invalid url', async () => {
		const f = vi.fn();
		await expect(GET(makeEvent('not-a-url', f))).rejects.toMatchObject({ status: 400 });
		expect(f).not.toHaveBeenCalled();
	});

	it('returns 400 for disallowed host', async () => {
		const f = vi.fn();
		await expect(GET(makeEvent('https://evil.example/foo.pdf', f))).rejects.toMatchObject({
			status: 400
		});
		expect(f).not.toHaveBeenCalled();
	});

	it('streams the upstream body on success', async () => {
		const body = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
		const f = vi.fn(
			async () =>
				new Response(body, { status: 200, headers: { 'content-type': 'application/pdf' } })
		);
		const resp = await GET(makeEvent('https://charts-v2.aviationapi.com/260416/foo.pdf', f));
		expect(resp.status).toBe(200);
		expect(resp.headers.get('content-type')).toBe('application/pdf');
		expect(resp.headers.get('cache-control')).toContain('max-age=86400');
		const got = new Uint8Array(await resp.arrayBuffer());
		expect(Array.from(got)).toEqual([0x25, 0x50, 0x44, 0x46]);
	});

	it('returns 502 on upstream non-OK', async () => {
		const f = vi.fn(async () => new Response('boom', { status: 500 }));
		await expect(
			GET(makeEvent('https://charts-v2.aviationapi.com/260416/foo.pdf', f))
		).rejects.toMatchObject({ status: 502 });
	});

	it('returns 502 on upstream network error', async () => {
		const f = vi.fn(async () => {
			throw new TypeError('fetch failed');
		});
		await expect(
			GET(makeEvent('https://charts-v2.aviationapi.com/260416/foo.pdf', f))
		).rejects.toMatchObject({ status: 502 });
	});
});
