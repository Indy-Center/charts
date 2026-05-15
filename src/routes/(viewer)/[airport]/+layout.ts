import { error } from '@sveltejs/kit';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';
import type { AirportData } from '$lib/types';
import { airportCache } from '$lib/airport-cache';
import { normalizeForApi } from '$lib/airport-id';

export const load: LayoutLoad = async ({ params, fetch }) => {
	const id = params.airport;
	const apiId = normalizeForApi(id);
	if (!apiId) error(400, 'Invalid airport identifier');

	if (browser) {
		const cached = airportCache.get(id);
		if (cached) return { airport: cached };
	}

	const resp = await fetch(`/api/charts/${encodeURIComponent(id)}`);
	if (resp.status === 400) error(400, `"${id.toUpperCase()}" is not a valid airport identifier.`);
	if (!resp.ok) {
		error(
			404,
			`No charts available for "${id.toUpperCase()}". The airport may not exist or the charts service is temporarily unavailable.`
		);
	}

	const data = (await resp.json()) as AirportData;
	if (browser) {
		airportCache.set(data);
	}
	return { airport: data };
};
