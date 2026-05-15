// src/lib/server/identity.ts
import type { RequestEvent } from '@sveltejs/kit';
import type { SessionContext } from '@indy-center/identity';

/**
 * Read the session cookie, validate via the IDENTITY service binding, and
 * return the joined SessionContext. Returns null when:
 *   - no session cookie is present
 *   - the IDENTITY binding is not configured (local dev, misconfig)
 *   - the binding throws (network error, identity deploy in progress)
 *   - the binding returns null (unknown/expired/invalidated token)
 *
 * Charts never sets, refreshes, or deletes the session cookie. Identity owns
 * the cookie lifecycle through its /login and /logout endpoints.
 */
export async function getSessionContext(event: RequestEvent): Promise<SessionContext | null> {
	const token = event.cookies.get('fic_session');
	if (!token) {
		return null;
	}

	const identity = event.platform?.env.IDENTITY;
	if (!identity) {
		return null;
	}

	try {
		return await identity.getSessionContext(token);
	} catch (err) {
		console.error('[charts] identity.getSessionContext threw', err);
		return null;
	}
}
