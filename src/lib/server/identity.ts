import type { RequestEvent } from '@sveltejs/kit';

/**
 * Identity integration seam.
 *
 * v1 returns null unconditionally. The shape of the eventual return type is
 * intentionally not nailed down here — we'll define it when we wire the
 * IDENTITY service binding and call validateSession via RPC.
 */
export async function getCurrentUser(_event: RequestEvent): Promise<null> {
	return null;
}
