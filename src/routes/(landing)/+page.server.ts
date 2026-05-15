import { fetchCharts } from '$lib/server/aviationapi';
import { normalizeForApi } from '$lib/airport-id';
import type { AirportInfo, Chart, ChartGroup, ChartsByGroup } from '$lib/types';

export type ChartBoardRole = 'departure' | 'arrival' | 'alternate' | 'controlling';

export type ChartBoardSection = {
	role: ChartBoardRole;
	filedId: string;
	airport: AirportInfo;
	// The full role-filtered chart set for this airport. ChartListCard shows
	// this as the expanded list (with per-row pin toggles).
	chartsByGroup: ChartsByGroup;
	// Server-curated high-confidence pins (airport diagram + matched SID/STAR
	// for flying roles, airport diagram only for controlling). Rendered as
	// chips when the card is collapsed.
	defaultPins: Chart[];
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

// Match a procedure token like `SPILR1` (SID) or `JAKTZ2` (STAR) to a chart
// name like `SPILR ONE (RNAV)`. Converts the trailing digit to its word form.
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

// Chart groups that are relevant per role. Controllers get the full role-
// agnostic view (everything except STARs and SIDs which they reference rarely
// for vector work — but actually they use them too, so we leave it broad).
const ROLE_GROUPS: Record<ChartBoardRole, ChartGroup[]> = {
	departure: ['airport_diagram', 'general', 'departure'],
	arrival: ['airport_diagram', 'general', 'arrival', 'approach'],
	alternate: ['airport_diagram', 'approach'],
	controlling: ['airport_diagram', 'general', 'approach', 'departure', 'arrival']
};

function emptyByGroup(): ChartsByGroup {
	return { airport_diagram: [], general: [], approach: [], departure: [], arrival: [] };
}

function filterByRole(byGroup: ChartsByGroup, role: ChartBoardRole): ChartsByGroup {
	const allowed = new Set<ChartGroup>(ROLE_GROUPS[role]);
	const out = emptyByGroup();
	for (const group of allowed) {
		out[group] = byGroup[group];
	}
	return out;
}

function buildSection(
	role: ChartBoardRole,
	filedId: string,
	airport: AirportInfo,
	byGroup: ChartsByGroup,
	matchedSid: Chart | null,
	matchedStar: Chart | null
): ChartBoardSection {
	const roleFiltered = filterByRole(byGroup, role);
	const diagram = roleFiltered.airport_diagram;
	let defaultPins: Chart[];
	if (role === 'departure') {
		defaultPins = [...diagram, ...(matchedSid ? [matchedSid] : [])];
	} else if (role === 'arrival') {
		defaultPins = [...diagram, ...(matchedStar ? [matchedStar] : [])];
	} else {
		// Alternate or controlling: high-confidence default is the airport diagram only.
		defaultPins = [...diagram];
	}
	return { role, filedId, airport, chartsByGroup: roleFiltered, defaultPins };
}

export async function load({ parent, fetch }) {
	const { session, pinnedAirports } = await parent();

	const fp = session?.activeFlightPlan;
	const controlling = pinnedAirports.mode === 'controlling' && pinnedAirports.airports.length > 0;

	// Decide which airports to load. Flying mode wins if both are somehow active.
	let targets: { role: ChartBoardRole; id: string }[];
	let sidToken: string | null = null;
	let starToken: string | null = null;

	if (fp) {
		targets = [
			{ role: 'departure', id: fp.departure },
			{ role: 'arrival', id: fp.arrival }
		];
		if (fp.alternate && fp.alternate.trim()) {
			targets.push({ role: 'alternate', id: fp.alternate.trim() });
		}
		({ first: sidToken, last: starToken } = parseRouteEndpoints(fp.route));
	} else if (controlling) {
		targets = pinnedAirports.airports.map((id) => ({ role: 'controlling' as const, id }));
	} else {
		return { chartBoard: null };
	}

	const results = await Promise.allSettled(
		targets.map(async ({ role, id }): Promise<ChartBoardSection> => {
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

	const chartBoard = results
		.filter((r): r is PromiseFulfilledResult<ChartBoardSection> => r.status === 'fulfilled')
		.map((r) => r.value);

	for (const r of results) {
		if (r.status === 'rejected') {
			console.warn('[(landing)/+page.server] chart-board fetch failed', r.reason);
		}
	}

	return { chartBoard: chartBoard.length > 0 ? chartBoard : null };
}
