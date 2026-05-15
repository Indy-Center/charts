// Lazy chart-data fetcher for follower (user-pinned-only) airports.
//
// The pinboard's server load only knows about plan/controlling/current
// airports — anything the user has pinned on their own is client-side state.
// To make a follower card behave identically to a plan/controlling card
// (expand shows the full chart list, pinning toggles work the same), we fetch
// the full ChartsByGroup on demand via the existing /api/charts/:id endpoint
// and cache it in a reactive SvelteMap. The fetch happens once per airport
// per tab session; subsequent renders read from the cache.

import { SvelteMap } from 'svelte/reactivity';
import type { AirportData } from './types';

const data = new SvelteMap<string, AirportData>();
const inflight = new Map<string, Promise<void>>();

function key(airportId: string): string {
	return airportId.toUpperCase();
}

/** Reactive — returns the fetched data when available, or undefined while loading. */
export function getFollowerCharts(airportId: string): AirportData | undefined {
	return data.get(key(airportId));
}

/** Kick off a fetch if one isn't already in flight. Idempotent. */
export function ensureFollowerCharts(airportId: string): void {
	const k = key(airportId);
	if (data.has(k) || inflight.has(k)) {
		return;
	}
	const promise = (async () => {
		try {
			const resp = await fetch(`/api/charts/${encodeURIComponent(k)}`);
			if (!resp.ok) {
				return;
			}
			const json = (await resp.json()) as AirportData;
			data.set(k, json);
		} catch {
			// Network failed — silent; the follower card stays on synthesized pins.
		} finally {
			inflight.delete(k);
		}
	})();
	inflight.set(k, promise);
}

/** Test seam. */
export function __resetFollowerChartsForTests(): void {
	data.clear();
	inflight.clear();
}
