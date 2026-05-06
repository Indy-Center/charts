import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { normalizeForApi } from '$lib/airport-id';
import { fetchCharts, AviationApiError } from '$lib/server/aviationapi';

const SUCCESS_HEADERS = {
  'cache-control': 'public, max-age=86400, stale-while-revalidate=86400'
};

export const GET: RequestHandler = async ({ params, fetch }) => {
  const apiId = normalizeForApi(params.airport ?? '');
  if (!apiId) {
    return json({ error: 'invalid_airport_id' }, { status: 400 });
  }

  try {
    const data = await fetchCharts(apiId, fetch);
    return json(data, { headers: SUCCESS_HEADERS });
  } catch (err) {
    if (err instanceof AviationApiError) {
      return json({ error: err.kind }, { status: 502 });
    }
    return json({ error: 'upstream_unavailable' }, { status: 502 });
  }
};
