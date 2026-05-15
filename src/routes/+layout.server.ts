// src/routes/+layout.server.ts
import { pinnedAirports, type PinnedAirports } from '$lib/server/pinned-airports';
import { getArtccTree } from '$lib/server/artcc-tree';

// Identity worker URL — read from the platform env (Cloudflare vars in
// wrangler.jsonc set this in production). Falls back to local-dev wrangler
// when nothing is configured.
function resolveIdentityUrl(platform: App.Platform | undefined): string {
	const fromEnv = (platform?.env as Record<string, unknown> | undefined)?.PUBLIC_IDENTITY_URL;
	if (typeof fromEnv === 'string' && fromEnv.length > 0) {
		return fromEnv;
	}
	return 'http://localhost:8787';
}

export async function load({ locals, platform }) {
	const session = locals.session;
	const identityUrl = resolveIdentityUrl(platform);
	const empty: PinnedAirports = { airports: [], mode: 'none' };

	if (!session || (!session.activeSession && !session.activeFlightPlan)) {
		return { session, pinnedAirports: empty, identityUrl };
	}

	// Flying mode doesn't need the ARTCC tree — short-circuit when only a flight
	// plan is active, so the tree fetch only happens when we actually need it.
	if (!session.activeSession && session.activeFlightPlan) {
		return {
			session,
			pinnedAirports: pinnedAirports(session, null as never),
			identityUrl
		};
	}

	let pinned = empty;
	try {
		const tree = await getArtccTree();
		pinned = pinnedAirports(session, tree);
	} catch (err) {
		console.error('[+layout.server] ARTCC tree unavailable, pinning row hidden', err);
	}
	return { session, pinnedAirports: pinned, identityUrl };
}
