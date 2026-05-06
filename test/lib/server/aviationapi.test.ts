import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchCharts, AviationApiError } from '$lib/server/aviationapi';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures');
const kind = readFileSync(join(fixturesDir, 'aviationapi-kind.json'), 'utf8');
const i69 = readFileSync(join(fixturesDir, 'aviationapi-i69.json'), 'utf8');
const empty = readFileSync(join(fixturesDir, 'aviationapi-empty.json'), 'utf8');
const malformed = readFileSync(join(fixturesDir, 'aviationapi-malformed.json'), 'utf8');

function mockFetch(body: string, status = 200) {
  return vi.fn(async () =>
    new Response(body, { status, headers: { 'content-type': 'application/json' } })
  );
}

describe('fetchCharts', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('parses a valid KIND response', async () => {
    const f = mockFetch(kind);
    const result = await fetchCharts('KIND', f);
    expect(result.airport.faa_ident).toBe('IND');
    expect(result.chartsByGroup.airport_diagram.length).toBeGreaterThan(0);
    expect(f).toHaveBeenCalledWith(
      expect.stringContaining('airport=KIND'),
      expect.anything()
    );
  });

  it('parses an alphanumeric ident response', async () => {
    const f = mockFetch(i69);
    const result = await fetchCharts('I69', f);
    expect(result.airport.faa_ident).toBe('I69');
  });

  it('handles an empty-charts airport', async () => {
    const f = mockFetch(empty);
    const result = await fetchCharts('ZZZ', f);
    expect(result.chartsByGroup.approach).toEqual([]);
  });

  it('throws upstream_unavailable on 5xx', async () => {
    const f = mockFetch('Internal Server Error', 500);
    await expect(fetchCharts('XXX', f)).rejects.toMatchObject({
      kind: 'upstream_unavailable'
    });
  });

  it('throws upstream_shape_mismatch on malformed', async () => {
    const f = mockFetch(malformed);
    await expect(fetchCharts('YYY', f)).rejects.toMatchObject({
      kind: 'upstream_shape_mismatch'
    });
  });

  it('throws upstream_unavailable on network error', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    await expect(fetchCharts('AAA', f)).rejects.toMatchObject({
      kind: 'upstream_unavailable'
    });
  });
});
