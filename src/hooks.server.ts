// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { getSessionContext } from '$lib/server/identity';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = await getSessionContext(event);
	return resolve(event);
};
