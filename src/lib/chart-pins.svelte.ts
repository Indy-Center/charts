// Shared, tab-scoped pin / tracked-airport store. Survives client-side
// navigation (module is loaded once per tab) but not page reloads.
//
// An airport is "tracked" once the user visits it or pins a chart in it. Every
// tracked airport gets a follower card in the pinboard / dashboard so the user
// can hop back to airports they've recently looked at. The user can drop a
// tracked airport with the X on its card (`untrackAirport`); a hard reload
// clears the whole set.
//
// Pinning is a layer on top: when collapsed, the follower card surfaces pinned
// charts as quick-access chips. Two pin operations live here:
//   - "Added" pins — charts the user explicitly pinned.
//   - "Removed" defaults — server-suggested pins (airport diagram, matched
//     SID/STAR for plan/controlling slots) the user has unpinned.
//
// Effective pin state for a (airport, chart) pair is computed by
// `isPinned(airportId, pdfUrl, isDefault)`.

import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Chart, ChartGroup, ChartsByGroup } from './types';

export type PinnedChart = {
	chart_name: string;
	pdf_url: string;
	group: ChartGroup;
};

type AirportPinState = {
	name: string | undefined;
	added: SvelteMap<string, PinnedChart>;
	removed: SvelteSet<string>;
};

// Per-airport pin state. SvelteMap so reads inside $derived react to changes.
const byAirport = new SvelteMap<string, AirportPinState>();

// Display order: most-recently-tracked at index 0. Maintained as a plain $state
// array so `trackedAirports` can return it directly without any reverse-walk
// trickery. trackAirport unshifts (deduping); untrackAirport splices out.
let trackOrder = $state<string[]>([]);

function key(airportId: string): string {
	return airportId.toUpperCase();
}

function ensureState(airportId: string, airportName?: string): AirportPinState {
	const k = key(airportId);
	let s = byAirport.get(k);
	if (!s) {
		s = { name: airportName, added: new SvelteMap(), removed: new SvelteSet() };
		byAirport.set(k, s);
	} else if (airportName && !s.name) {
		s.name = airportName;
	}
	return s;
}

/** True if the user has explicitly added this chart as a custom pin. */
export function isUserAdded(airportId: string, pdfUrl: string): boolean {
	return byAirport.get(key(airportId))?.added.has(pdfUrl) ?? false;
}

/** True if the user has explicitly removed this default. */
export function isUserRemoved(airportId: string, pdfUrl: string): boolean {
	return byAirport.get(key(airportId))?.removed.has(pdfUrl) ?? false;
}

/** Effective pin state. */
export function isPinned(airportId: string, pdfUrl: string, isDefault: boolean): boolean {
	if (isUserAdded(airportId, pdfUrl)) {
		return true;
	}
	if (isDefault && !isUserRemoved(airportId, pdfUrl)) {
		return true;
	}
	return false;
}

/**
 * Toggle pin state for a chart. The caller passes whether the chart is a
 * server-provided default so we know which bucket to flip.
 */
export function togglePin(
	airportId: string,
	airportName: string | undefined,
	chart: PinnedChart,
	isDefault: boolean
): void {
	const state = ensureState(airportId, airportName);
	const currentlyPinned = isPinned(airportId, chart.pdf_url, isDefault);
	if (currentlyPinned) {
		if (isDefault) {
			state.removed.add(chart.pdf_url);
		} else {
			state.added.delete(chart.pdf_url);
		}
	} else {
		if (isDefault) {
			state.removed.delete(chart.pdf_url);
		} else {
			state.added.set(chart.pdf_url, chart);
		}
	}
}

/**
 * Mark an airport as tracked. First-time tracking unshifts the airport to the
 * top of `trackOrder`; revisits are no-ops so cycling between two airports
 * doesn't make them swap positions in the follower row.
 */
export function trackAirport(airportId: string, airportName?: string): void {
	const k = key(airportId);
	ensureState(airportId, airportName);
	if (trackOrder.includes(k)) {
		return;
	}
	trackOrder.unshift(k);
}

/** Drop an airport from the follower row, including any pin state. */
export function untrackAirport(airportId: string): void {
	const k = key(airportId);
	byAirport.delete(k);
	const idx = trackOrder.indexOf(k);
	if (idx >= 0) {
		trackOrder.splice(idx, 1);
	}
}

/** True when the airport has been tracked (visited or pinned). */
export function isTracked(airportId: string): boolean {
	return byAirport.has(key(airportId));
}

/** Charts the user explicitly added for this airport, in insertion order. */
export function userAddedFor(airportId: string): PinnedChart[] {
	const state = byAirport.get(key(airportId));
	if (!state) {
		return [];
	}
	return Array.from(state.added.values());
}

/** Reactive view of the user-removed default pdf_urls. */
export function userRemovedFor(airportId: string): ReadonlySet<string> {
	return byAirport.get(key(airportId))?.removed ?? EMPTY_SET;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

export type FollowerAirport = {
	airportId: string;
	airportName: string | undefined;
	pins: PinnedChart[];
};

/**
 * Every airport the user has visited or pinned, most-recently-tracked first.
 * Pass `excludeIds` (uppercased airport codes) to filter out airports already
 * represented by server-driven cards (plan / controlling slots).
 */
export function trackedAirports(excludeIds: ReadonlySet<string> = EMPTY_SET): FollowerAirport[] {
	const out: FollowerAirport[] = [];
	for (const k of trackOrder) {
		if (excludeIds.has(k)) {
			continue;
		}
		const state = byAirport.get(k);
		if (!state) {
			continue;
		}
		out.push({
			airportId: k,
			airportName: state.name,
			pins: Array.from(state.added.values())
		});
	}
	return out;
}

/**
 * Reshape a list of PinnedChart back into the ChartsByGroup structure that
 * `ChartListCard` consumes. Used to render follower-airport cards: we don't
 * have the full chart list for those airports, but the pins themselves carry
 * enough metadata (name, pdf_url, group) to look like one.
 */
export function pinsToChartsByGroup(pins: readonly PinnedChart[]): ChartsByGroup {
	const out: ChartsByGroup = {
		airport_diagram: [],
		general: [],
		approach: [],
		departure: [],
		arrival: []
	};
	for (const p of pins) {
		out[p.group].push({
			chart_name: p.chart_name,
			pdf_url: p.pdf_url,
			chart_sequence: '',
			pdf_name: '',
			did_change: false
		} satisfies Chart);
	}
	return out;
}

// --- backwards-compat shim so the existing test suite keeps working.

/** @deprecated Use `isUserAdded` or `isPinned(_, _, isDefault)` instead. */
export function isUserPinned(airportId: string, pdfUrl: string): boolean {
	return isUserAdded(airportId, pdfUrl);
}

/** Test seam — reset all pin state. */
export function __resetPinsForTests(): void {
	byAirport.clear();
	trackOrder.length = 0;
}
