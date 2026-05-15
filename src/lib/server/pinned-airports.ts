// src/lib/server/pinned-airports.ts
import type { SessionContext } from '@indy-center/identity';
import { collectAtctDescendants, findFacility, type Facility } from './artcc-tree';

export type PinnedAirports = {
	airports: string[];
	mode: 'controlling' | 'flying' | 'none';
};

/**
 * Resolve which airports to surface on the home page for the current session.
 *
 *  - If the user is actively controlling, return the airports under their
 *    positions by walking the ZID ARTCC tree. Observer and inactive positions
 *    contribute nothing.
 *  - Otherwise, if the user has a filed VATSIM flight plan, return the
 *    departure, arrival, and (when non-empty) alternate. Flight-plan airports
 *    are taken verbatim — no tree lookup.
 *  - Otherwise return an empty list with mode: 'none'.
 *
 * Controlling wins over flying when both are present (a single CID shouldn't
 * have both, but the tie-break makes the function total).
 */
export function pinnedAirports(session: SessionContext | null, tree: Facility): PinnedAirports {
	if (session?.activeSession && !session.activeSession.isObserver) {
		const airports = new Set<string>();
		for (const pos of session.activeSession.positions) {
			if (!pos.isActive) {
				continue;
			}
			const facility = findFacility(tree, pos.facilityId);
			if (!facility) {
				console.warn(`[pinned-airports] facility not in tree: ${pos.facilityId}`);
				continue;
			}
			for (const atct of collectAtctDescendants(facility)) {
				airports.add(atct.id);
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
