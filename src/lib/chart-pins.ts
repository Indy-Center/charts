// Tab-scoped store of pinned charts, keyed by airport identifier. Survives
// client-side navigation (module is loaded once per tab) but not page reloads.
// A future iteration could persist to URL hash or localStorage for sharing.
//
// Default pins are passed into ChartListCard via the `defaultPins` prop and
// merged with the user's overrides at render time. The store only tracks
// user-toggled state — defaults are inert here.

import { SvelteMap, SvelteSet } from 'svelte/reactivity';

// One SvelteMap per airport keyed on normalized airport id. Lazy-init on
// the WRITE path only — the read path (`userPinsFor`) never mutates so it
// stays safe to call inside $derived without tripping state_unsafe_mutation.
const pinsByAirport = new SvelteMap<string, SvelteSet<string>>();
const EMPTY: SvelteSet<string> = new SvelteSet<string>();

function normalize(airportId: string): string {
	return airportId.toUpperCase();
}

/** Returns true when the user has explicitly pinned this chart. */
export function isUserPinned(airportId: string, pdfUrl: string): boolean {
	const set = pinsByAirport.get(normalize(airportId));
	return set?.has(pdfUrl) ?? false;
}

/** Toggle the user-pin state for a chart. Defaults are unaffected — they live alongside via the `defaultPins` prop. */
export function togglePin(airportId: string, pdfUrl: string): void {
	const key = normalize(airportId);
	let set = pinsByAirport.get(key);
	if (!set) {
		set = new SvelteSet<string>();
		pinsByAirport.set(key, set);
	}
	if (set.has(pdfUrl)) {
		set.delete(pdfUrl);
	} else {
		set.add(pdfUrl);
	}
}

/** Reactive view of the user-pin set for an airport. Safe to call from a $derived. */
export function userPinsFor(airportId: string): SvelteSet<string> {
	return pinsByAirport.get(normalize(airportId)) ?? EMPTY;
}

/** Test seam — reset all pin state. */
export function __resetPinsForTests(): void {
	pinsByAirport.clear();
}
