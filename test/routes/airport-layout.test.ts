import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ browser: false }));

import { load } from '../../src/routes/[airport]/+layout';
import type { AirportData } from '$lib/types';

const sampleData: AirportData = {
  airport: { country: 'USA', faa_ident: 'IND', is_military: false },
  chartsByGroup: { airport_diagram: [], general: [], approach: [], departure: [], arrival: [] }
};

function makeEvent(airport: string, fetchImpl: typeof fetch) {
  return {
    params: { airport },
    fetch: fetchImpl,
    url: new URL(`http://test/${airport}`),
    route: { id: '/[airport]' }
  } as unknown as Parameters<typeof load>[0];
}

describe('airport layout load', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('throws 400 on invalid airport ident', async () => {
    const f = vi.fn();
    await expect(load(makeEvent('XX', f))).rejects.toMatchObject({ status: 400 });
    expect(f).not.toHaveBeenCalled();
  });

  it('fetches and returns airport data on success', async () => {
    const f = vi.fn(async () =>
      new Response(JSON.stringify(sampleData), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const result = (await load(makeEvent('IND', f))) as { airport: AirportData };
    expect(result.airport).toEqual(sampleData);
    expect(f).toHaveBeenCalledWith('/api/charts/IND');
  });

  it('throws 400 when endpoint returns 400', async () => {
    const f = vi.fn(async () => new Response('{"error":"invalid_airport_id"}', { status: 400 }));
    await expect(load(makeEvent('KIND', f))).rejects.toMatchObject({ status: 400 });
  });

  it('throws 404 when endpoint returns 502 (likely unknown airport)', async () => {
    const f = vi.fn(async () => new Response('{"error":"upstream_unavailable"}', { status: 502 }));
    await expect(load(makeEvent('KFOO', f))).rejects.toMatchObject({ status: 404 });
  });
});
