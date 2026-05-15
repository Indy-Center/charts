import { fetchCharts } from '$lib/server/aviationapi';
import { normalizeForApi } from '$lib/airport-id';
import type { PinboardEntry, PinboardRole } from '$lib/pinboard';

function normalize(id: string): string {
	return id.replace(/^K/i, '').toUpperCase();
}

export async function load({ parent, params, fetch }) {
	const parentData = await parent();
	const session = parentData.session;
	const currentId = normalize(params.airport);

	// Decide which OTHER airports to load alongside the current one. The current
	// airport's data is fetched separately by the universal +layout.ts, so this
	// server load only fetches the rest of the pinboard.
	const others: { id: string; role: PinboardRole }[] = [];

	if (session?.activeFlightPlan) {
		const fp = session.activeFlightPlan;
		const seen = new Set<string>([currentId]);
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
			others.push({ id: trimmed, role });
		};
		add(fp.departure, 'departure');
		add(fp.arrival, 'arrival');
		add(fp.alternate, 'alternate');
	} else if (
		parentData.pinnedAirports.mode === 'controlling' &&
		parentData.pinnedAirports.airports.length > 0
	) {
		const seen = new Set<string>([currentId]);
		for (const id of parentData.pinnedAirports.airports) {
			const key = normalize(id);
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			others.push({ id, role: 'controlling' });
		}
	}

	if (others.length === 0) {
		return { pinboard: [] as PinboardEntry[] };
	}

	const results = await Promise.allSettled(
		others.map(async ({ id, role }): Promise<PinboardEntry> => {
			const apiId = normalizeForApi(id) ?? id;
			const data = await fetchCharts(apiId, fetch);
			return { id, role, airport: data };
		})
	);

	const pinboard: PinboardEntry[] = [];
	for (const r of results) {
		if (r.status === 'fulfilled') {
			pinboard.push(r.value);
		} else {
			console.warn('[(viewer) pinboard] fetch failed', r.reason);
		}
	}

	return { pinboard };
}
