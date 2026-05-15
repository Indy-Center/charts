// src/lib/server/artcc-tree.ts
import { z } from 'zod';

// Recursive ARTCC facility tree as exposed by data-api.vnas.vatsim.net.
// Lax (loose objects) — we only care about the fields below.

const FacilitySchema: z.ZodType<Facility> = z.lazy(() =>
	z.looseObject({
		id: z.string(),
		type: z.string(),
		name: z.string(),
		childFacilities: z.array(FacilitySchema).default([])
	})
);

const ArtccResponseSchema = z.looseObject({
	id: z.string(),
	facility: FacilitySchema
});

export type Facility = {
	id: string;
	type: string;
	name: string;
	childFacilities: Facility[];
};

const TREE_URL = 'https://data-api.vnas.vatsim.net/api/artccs/ZID';
const TTL_MS = 24 * 60 * 60 * 1000;

let cache: { tree: Facility; fetchedAt: number } | null = null;
let inflight: Promise<Facility> | null = null;

async function fetchTree(): Promise<Facility> {
	const res = await fetch(TREE_URL);
	if (!res.ok) {
		throw new Error(`[artcc-tree] status ${res.status}`);
	}
	const json = await res.json();
	const parsed = ArtccResponseSchema.parse(json);
	return parsed.facility;
}

export async function getArtccTree(): Promise<Facility> {
	if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
		return cache.tree;
	}
	if (inflight) {
		return inflight;
	}
	inflight = (async () => {
		try {
			const tree = await fetchTree();
			cache = { tree, fetchedAt: Date.now() };
			return tree;
		} catch (err) {
			console.error('[artcc-tree] refresh failed', err);
			if (cache) {
				return cache.tree; // stale on error
			}
			throw err;
		} finally {
			inflight = null;
		}
	})();
	return inflight;
}

export function findFacility(root: Facility, id: string): Facility | null {
	if (root.id === id) {
		return root;
	}
	for (const child of root.childFacilities) {
		const found = findFacility(child, id);
		if (found) {
			return found;
		}
	}
	return null;
}

export function collectAtctDescendants(root: Facility): Facility[] {
	const out: Facility[] = [];
	function walk(f: Facility) {
		if (f.type === 'ATCT') {
			out.push(f);
		}
		for (const c of f.childFacilities) {
			walk(c);
		}
	}
	walk(root);
	return out;
}

export function __resetCacheForTests(): void {
	cache = null;
	inflight = null;
}
