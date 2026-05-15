import { fetchCharts } from '$lib/server/aviationapi';
import { normalizeForApi } from '$lib/airport-id';
import type { AirportInfo, ChartGroup, ChartsByGroup } from '$lib/types';

export type FlightChartRole = 'departure' | 'arrival' | 'alternate';

// Chart groups that are relevant for a pilot at each leg of the flight.
// Departure: airport diagram + DPs/SIDs and any general airport info.
// Arrival: airport diagram + STARs + approach plates (the pilot may end up
// flying any of them depending on weather/ATC) + general.
// Alternate: airport diagram + approach plates only — backup, briefer set.
const ROLE_GROUPS: Record<FlightChartRole, ChartGroup[]> = {
	departure: ['airport_diagram', 'general', 'departure'],
	arrival: ['airport_diagram', 'general', 'arrival', 'approach'],
	alternate: ['airport_diagram', 'approach']
};

export type FlightChartSection = {
	role: FlightChartRole;
	filedId: string;
	airport: AirportInfo;
	chartsByGroup: ChartsByGroup;
};

function emptyByGroup(): ChartsByGroup {
	return {
		airport_diagram: [],
		general: [],
		approach: [],
		departure: [],
		arrival: []
	};
}

function filterByRole(byGroup: ChartsByGroup, role: FlightChartRole): ChartsByGroup {
	const allowed = new Set<ChartGroup>(ROLE_GROUPS[role]);
	const out = emptyByGroup();
	for (const group of allowed) {
		out[group] = byGroup[group];
	}
	return out;
}

export async function load({ parent, fetch }) {
	const { session } = await parent();
	const fp = session?.activeFlightPlan;
	if (!fp) {
		return { flightCharts: null };
	}

	const targets: { role: FlightChartRole; id: string }[] = [
		{ role: 'departure', id: fp.departure },
		{ role: 'arrival', id: fp.arrival }
	];
	if (fp.alternate && fp.alternate.trim()) {
		targets.push({ role: 'alternate', id: fp.alternate.trim() });
	}

	const results = await Promise.allSettled(
		targets.map(async ({ role, id }): Promise<FlightChartSection> => {
			const apiId = normalizeForApi(id) ?? id;
			const data = await fetchCharts(apiId, fetch);
			return {
				role,
				filedId: id,
				airport: data.airport,
				chartsByGroup: filterByRole(data.chartsByGroup, role)
			};
		})
	);

	const flightCharts = results
		.filter((r): r is PromiseFulfilledResult<FlightChartSection> => r.status === 'fulfilled')
		.map((r) => r.value);

	for (const r of results) {
		if (r.status === 'rejected') {
			console.warn('[(landing)/+page.server] flight-chart fetch failed', r.reason);
		}
	}

	return { flightCharts: flightCharts.length > 0 ? flightCharts : null };
}
