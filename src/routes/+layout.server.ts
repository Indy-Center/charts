// src/routes/+layout.server.ts
import { pinnedAirports, type PinnedAirports } from '$lib/server/pinned-airports';
import { getArtccTree } from '$lib/server/artcc-tree';

export async function load({ locals }) {
	const session = locals.session;
	const empty: PinnedAirports = { airports: [], mode: 'none' };

	if (!session || (!session.activeSession && !session.activeFlightPlan)) {
		return { session, pinnedAirports: empty };
	}

	// Flying mode doesn't need the ARTCC tree — short-circuit when only a flight
	// plan is active, so the tree fetch only happens when we actually need it.
	if (!session.activeSession && session.activeFlightPlan) {
		return { session, pinnedAirports: pinnedAirports(session, null as never) };
	}

	let pinned = empty;
	try {
		const tree = await getArtccTree();
		pinned = pinnedAirports(session, tree);
	} catch (err) {
		console.error('[+layout.server] ARTCC tree unavailable, pinning row hidden', err);
	}
	return { session, pinnedAirports: pinned };
}
