import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';

const ALLOWED_HOSTS = new Set(['charts-v2.aviationapi.com']);

export const GET: RequestHandler = async ({ url, fetch }) => {
	const target = url.searchParams.get('url');
	if (!target) error(400, 'Missing url parameter');

	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		error(400, 'Invalid url');
	}
	if (!ALLOWED_HOSTS.has(parsed.host)) error(400, 'Disallowed host');

	let upstream: Response;
	try {
		upstream = await fetch(target, { headers: { accept: 'application/pdf' } });
	} catch {
		error(502, 'Upstream fetch failed');
	}
	if (!upstream.ok) error(502, `Upstream returned ${upstream.status}`);

	return new Response(upstream.body, {
		status: 200,
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'application/pdf',
			'cache-control': 'public, max-age=86400, stale-while-revalidate=86400'
		}
	});
};
