// test/lib/server/artcc-tree.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	__resetCacheForTests,
	collectAtctDescendants,
	findFacility,
	getArtccTree
} from '../../../src/lib/server/artcc-tree';
import { zidTree } from './__fixtures__/zid-tree';

beforeEach(() => {
	__resetCacheForTests();
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

describe('findFacility', () => {
	it('returns the root when its id matches', () => {
		expect(findFacility(zidTree, 'ZID')).toBe(zidTree);
	});

	it('finds a nested child by id (DFS)', () => {
		expect(findFacility(zidTree, 'IND')?.name).toBe('Indianapolis Tower');
		expect(findFacility(zidTree, 'S56')?.name).toBe('Indianapolis Approach');
	});

	it('returns null for an unknown id', () => {
		expect(findFacility(zidTree, 'XXX')).toBeNull();
	});
});

describe('collectAtctDescendants', () => {
	it('returns just the node when the node is itself an ATCT', () => {
		const ind = findFacility(zidTree, 'IND')!;
		expect(collectAtctDescendants(ind).map((f) => f.id)).toEqual(['IND']);
	});

	it('returns all ATCT descendants of a TRACON', () => {
		const tracon = findFacility(zidTree, 'S56')!;
		const atcts = collectAtctDescendants(tracon)
			.map((f) => f.id)
			.sort();
		expect(atcts).toEqual(['EVV', 'IND']);
	});

	it('returns all ATCT descendants of the ARTCC', () => {
		const atcts = collectAtctDescendants(zidTree)
			.map((f) => f.id)
			.sort();
		expect(atcts).toEqual(['EVV', 'IND']);
	});

	it('returns an empty list when no ATCTs are below the node', () => {
		const subset = findFacility(zidTree, 'ZID_subset')!;
		expect(collectAtctDescendants(subset)).toEqual([]);
	});
});

describe('getArtccTree', () => {
	function mockFetch(body: unknown) {
		return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify(body), {
				status: 200,
				headers: { 'content-type': 'application/json' }
			})
		);
	}

	it('fetches and parses the ZID tree on first call', async () => {
		const fetchSpy = mockFetch({ id: 'ZID', facility: zidTree });
		const tree = await getArtccTree();
		expect(tree.id).toBe('ZID');
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it('skips fetching within the TTL', async () => {
		const fetchSpy = mockFetch({ id: 'ZID', facility: zidTree });
		vi.setSystemTime(new Date(1_000_000));
		await getArtccTree();
		vi.setSystemTime(new Date(1_000_000 + 1000)); // < 24h
		await getArtccTree();
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it('coalesces concurrent calls', async () => {
		let resolveBody: (v: string) => void = () => {};
		const bodyPromise = new Promise<string>((res) => (resolveBody = res));
		const fetchSpy = vi
			.spyOn(globalThis, 'fetch')
			.mockReturnValue(
				bodyPromise.then(
					(b) => new Response(b, { status: 200, headers: { 'content-type': 'application/json' } })
				)
			);
		const inflight = Promise.all([getArtccTree(), getArtccTree(), getArtccTree()]);
		resolveBody(JSON.stringify({ id: 'ZID', facility: zidTree }));
		await inflight;
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it('keeps the previous tree when a refresh fails', async () => {
		const fetchSpy = mockFetch({ id: 'ZID', facility: zidTree });
		await getArtccTree();
		vi.setSystemTime(new Date(Date.now() + 25 * 60 * 60 * 1000)); // > 24h TTL
		fetchSpy.mockRejectedValueOnce(new Error('network down'));
		const tree = await getArtccTree();
		expect(tree.id).toBe('ZID');
	});

	it('throws when cache is cold and the fetch fails', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
		await expect(getArtccTree()).rejects.toThrow();
	});
});
