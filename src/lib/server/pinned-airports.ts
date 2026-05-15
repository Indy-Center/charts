// src/lib/server/pinned-airports.ts
import type { SessionContext, VnasPosition } from '@indy-center/identity';
import {
	collectAtctDescendants,
	findFacility,
	isAirportFacility,
	type Facility
} from './artcc-tree';

// Tower / ground / clearance-delivery / ATIS positions are scoped to a single
// airport. Approach / departure / center walk down to all child airports
// under the facility. Detected via the callsign suffix (e.g. CMH_E_TWR → TWR).
const LOCAL_ONLY_SUFFIXES = new Set(['TWR', 'GND', 'DEL', 'ATIS']);

function isLocalOnly(pos: VnasPosition): boolean {
	const callsign = pos.callsign ?? pos.defaultCallsign;
	const suffix = callsign.split('_').pop()?.toUpperCase() ?? '';
	return LOCAL_ONLY_SUFFIXES.has(suffix);
}

export type PinnedAirports = {
	airports: string[];
	mode: 'controlling' | 'flying' | 'none';
};

/**
 * Resolve which airports to surface on the home page for the current session.
 *
 *  - If the user has an active controller session, return the airports under
 *    their positions by walking the ZID ARTCC tree. `isObserver` and the
 *    per-position `isActive` flag are ignored — vNAS reports `isActive=false`
 *    while a controller is still signing in or holding a position, and we
 *    want the dashboard to surface those airports anyway.
 *  - Otherwise, if the user has a filed VATSIM flight plan, return the
 *    departure, arrival, and (when non-empty) alternate. Flight-plan airports
 *    are taken verbatim — no tree lookup.
 *  - Otherwise return an empty list with mode: 'none'.
 *
 * Controlling wins over flying when both are present (a single CID shouldn't
 * have both, but the tie-break makes the function total).
 */
export function pinnedAirports(session: SessionContext | null, tree: Facility): PinnedAirports {
	if (session?.activeSession) {
		const airports = new Set<string>();
		for (const pos of session.activeSession.positions) {
			const facility = findFacility(tree, pos.facilityId);
			if (!facility) {
				console.warn(`[pinned-airports] facility not in tree: ${pos.facilityId}`);
				continue;
			}
			if (isLocalOnly(pos)) {
				// Tower / ground / delivery: just the airport itself, not the
				// satellite Atcts that live underneath an AtctTracon.
				if (isAirportFacility(facility)) {
					airports.add(facility.id);
				}
			} else {
				for (const atct of collectAtctDescendants(facility)) {
					airports.add(atct.id);
				}
			}
		}
		return { airports: [...airports].sort(), mode: 'controlling' };
	}

	if (session?.activeFlightPlan) {
		const fp = session.activeFlightPlan;
		const airports = new Set<string>();
		if (fp.departure) {
			airports.add(fp.departure);
		}
		if (fp.arrival) {
			airports.add(fp.arrival);
		}
		if (fp.alternate) {
			airports.add(fp.alternate);
		}
		return { airports: [...airports].sort(), mode: 'flying' };
	}

	return { airports: [], mode: 'none' };
}
