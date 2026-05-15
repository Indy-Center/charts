import { fetchCharts } from '$lib/server/aviationapi';
import { normalizeForApi } from '$lib/airport-id';
import type { AirportInfo, Chart, ChartGroup, ChartsByGroup } from '$lib/types';

export type FlightChartRole = 'departure' | 'arrival' | 'alternate';

export type FlightChartMoreGroup = { group: ChartGroup; charts: Chart[] };

export type FlightChartSection = {
	role: FlightChartRole;
	filedId: string;
	airport: AirportInfo;
	primary: Chart[];
	more: FlightChartMoreGroup[];
};

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

// Procedure tokens in a route string look like `SPILR1` (SID) or `JAKTZ2`
// (STAR). FAA chart names spell the revision number out: `SPILR ONE (RNAV)`,
// `JAKTZ TWO (RNAV)`. Convert the digit to the word form and match charts
// whose name begins with `<prefix> <word>`.
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
	// Fallback: any chart whose name starts with the alpha prefix.
	return charts.find((c) => c.chart_name.toUpperCase().startsWith(`${prefix} `)) ?? null;
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

function collectMore(
	byGroup: ChartsByGroup,
	included: Set<string>,
	groups: ChartGroup[]
): FlightChartMoreGroup[] {
	const out: FlightChartMoreGroup[] = [];
	for (const group of groups) {
		const remaining = byGroup[group].filter((c) => !included.has(c.pdf_url));
		if (remaining.length > 0) {
			out.push({ group, charts: remaining });
		}
	}
	return out;
}

function buildSection(
	role: FlightChartRole,
	filedId: string,
	airport: AirportInfo,
	byGroup: ChartsByGroup,
	matchedSid: Chart | null,
	matchedStar: Chart | null
): FlightChartSection {
	const diagram = byGroup.airport_diagram;
	if (role === 'departure') {
		const primary = [...diagram, ...(matchedSid ? [matchedSid] : [])];
		const included = new Set(primary.map((c) => c.pdf_url));
		return {
			role,
			filedId,
			airport,
			primary,
			more: collectMore(byGroup, included, ['general', 'departure'])
		};
	}
	if (role === 'arrival') {
		const primary = [...diagram, ...(matchedStar ? [matchedStar] : []), ...byGroup.approach];
		const included = new Set(primary.map((c) => c.pdf_url));
		return {
			role,
			filedId,
			airport,
			primary,
			more: collectMore(byGroup, included, ['general', 'arrival'])
		};
	}
	// alternate: airport diagram + all approaches; no 'more' since the role
	// filter is already this tight.
	const primary = [...diagram, ...byGroup.approach];
	return { role, filedId, airport, primary, more: [] };
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

	const { first: sidToken, last: starToken } = parseRouteEndpoints(fp.route);

	const results = await Promise.allSettled(
		targets.map(async ({ role, id }): Promise<FlightChartSection> => {
			const apiId = normalizeForApi(id) ?? id;
			const data = await fetchCharts(apiId, fetch);
			const matchedSid =
				role === 'departure' && sidToken
					? matchProcedureChart(data.chartsByGroup.departure, sidToken)
					: null;
			const matchedStar =
				role === 'arrival' && starToken
					? matchProcedureChart(data.chartsByGroup.arrival, starToken)
					: null;
			return buildSection(role, id, data.airport, data.chartsByGroup, matchedSid, matchedStar);
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
