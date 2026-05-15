import { fetchCharts } from '$lib/server/aviationapi';
import { normalizeForApi } from '$lib/airport-id';
import type { AirportData, Chart } from '$lib/types';
import type { PinboardEntry, PinboardRole } from '$lib/pinboard';

function normalize(id: string): string {
	return id.replace(/^K/i, '').toUpperCase();
}

const DIGIT_TO_WORD = [
	'ZERO',
	'ONE',
	'TWO',
	'THREE',
	'FOUR',
	'FIVE',
	'SIX',
	'SEVEN',
	'EIGHT',
	'NINE'
] as const;

// Match a route token like `SPILR1` to a chart name like `SPILR ONE (RNAV)`.
function matchProcedureChart(charts: Chart[], routeToken: string): Chart | null {
	const m = routeToken.match(/^([A-Z]+?)(\d+)?$/);
	if (!m) {
		return null;
	}
	const prefix = m[1]!;
	const digitStr = m[2];
	if (digitStr && digitStr.length === 1) {
		const word = DIGIT_TO_WORD[Number(digitStr)];
		const target = `${prefix} ${word}`;
		const exact = charts.find((c) => c.chart_name.toUpperCase().startsWith(target));
		if (exact) {
			return exact;
		}
	}
	return charts.find((c) => c.chart_name.toUpperCase().startsWith(`${prefix} `)) ?? null;
}

function defaultPinsFor(
	role: PinboardRole,
	airport: AirportData,
	sidToken: string | null,
	starToken: string | null
): Chart[] {
	const pins: Chart[] = [];
	// Airport diagram is always a high-confidence default.
	pins.push(...airport.chartsByGroup.airport_diagram);
	if (role === 'departure' && sidToken) {
		const sid = matchProcedureChart(airport.chartsByGroup.departure, sidToken);
		if (sid) {
			pins.push(sid);
		}
	}
	if (role === 'arrival' && starToken) {
		const star = matchProcedureChart(airport.chartsByGroup.arrival, starToken);
		if (star) {
			pins.push(star);
		}
	}
	// Alternate and controlling get just the airport diagram by default — we're
	// not confident enough to auto-pin specific approaches.
	return pins;
}

function parseRouteEndpoints(route: string | undefined): {
	first: string | null;
	last: string | null;
} {
	if (!route) {
		return { first: null, last: null };
	}
	const tokens = route
		.trim()
		.split(/\s+/)
		.filter((t) => t.length > 0);
	if (tokens.length === 0) {
		return { first: null, last: null };
	}
	if (tokens.length === 1) {
		return { first: tokens[0]!, last: null };
	}
	return { first: tokens[0]!, last: tokens[tokens.length - 1]! };
}

export async function load({ parent, params, fetch }) {
	const parentData = await parent();
	const session = parentData.session;
	const currentKey = normalize(params.airport);

	// Build the canonical ordered list of pinboard slots. Order is fixed by mode
	// (dep / arr / alt for flying, alphabetical for controlling, current first
	// for off-context). This makes card positions stable as the user navigates
	// between airports in the same session.
	type Slot = { id: string; role: PinboardRole };
	const slots: Slot[] = [];
	const seen = new Set<string>();
	const add = (id: string | undefined, role: PinboardRole) => {
		if (!id) {
			return;
		}
		const trimmed = id.trim();
		if (!trimmed) {
			return;
		}
		const key = normalize(trimmed);
		if (seen.has(key)) {
			return;
		}
		seen.add(key);
		slots.push({ id: trimmed, role });
	};

	let sidToken: string | null = null;
	let starToken: string | null = null;
	if (session?.activeFlightPlan) {
		const fp = session.activeFlightPlan;
		({ first: sidToken, last: starToken } = parseRouteEndpoints(fp.route));
		add(fp.departure, 'departure');
		add(fp.arrival, 'arrival');
		add(fp.alternate, 'alternate');
	} else if (
		parentData.pinnedAirports.mode === 'controlling' &&
		parentData.pinnedAirports.airports.length > 0
	) {
		const sorted = [...parentData.pinnedAirports.airports].sort();
		for (const id of sorted) {
			add(id, 'controlling');
		}
	}

	// If the current airport isn't already in the canonical list (off-context),
	// prepend it so it always appears in the pinboard.
	if (!seen.has(currentKey)) {
		slots.unshift({ id: params.airport, role: 'controlling' });
		seen.add(currentKey);
	}

	if (slots.length === 0) {
		return { pinboard: [] as PinboardEntry[] };
	}

	// Fetch chart data for every slot EXCEPT the current airport. The current
	// airport's data comes from the universal +layout.ts and we splice it in
	// client-side to avoid the duplicate fetch.
	const fetchTargets = slots.filter((s) => normalize(s.id) !== currentKey);
	const results = await Promise.allSettled(
		fetchTargets.map(async ({ id, role }): Promise<PinboardEntry> => {
			const apiId = normalizeForApi(id) ?? id;
			const data = await fetchCharts(apiId, fetch);
			return {
				id,
				role,
				airport: data,
				defaultPins: defaultPinsFor(role, data, sidToken, starToken),
				isCurrent: false
			};
		})
	);

	const fetchedByKey = new Map<string, PinboardEntry>();
	for (const r of results) {
		if (r.status === 'fulfilled') {
			fetchedByKey.set(normalize(r.value.id), r.value);
		} else {
			console.warn('[(viewer) pinboard] fetch failed', r.reason);
		}
	}

	// Assemble final ordered pinboard. For the current airport slot, leave
	// `airport` as null — the client will fill it from the universal load's
	// data so we don't double-fetch.
	const pinboard: PinboardEntry[] = [];
	for (const slot of slots) {
		const key = normalize(slot.id);
		const isCurrent = key === currentKey;
		if (isCurrent) {
			pinboard.push({
				id: slot.id,
				role: slot.role,
				airport: null,
				defaultPins: [],
				isCurrent: true
			});
		} else {
			const entry = fetchedByKey.get(key);
			if (entry) {
				pinboard.push({
					id: entry.id,
					role: entry.role,
					airport: entry.airport,
					defaultPins: entry.defaultPins,
					isCurrent: false
				});
			}
			// If a non-current fetch failed we just drop that slot.
		}
	}

	return { pinboard };
}
