import { describe, it, expect, vi } from 'vitest';
import { createDocCache, getDocument } from '$lib/pdf';

describe('createDocCache + getDocument', () => {
  it('caches results from the loader', async () => {
    const cache = createDocCache();
    const loader = vi.fn(async (url: string) => ({ url, fingerprint: 'abc' }));
    const a = await getDocument('https://example/a.pdf', cache, loader as any);
    const b = await getDocument('https://example/a.pdf', cache, loader as any);
    expect(a).toBe(b);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('separate URLs map to separate entries', async () => {
    const cache = createDocCache();
    const loader = vi.fn(async (url: string) => ({ url }));
    await getDocument('https://example/a.pdf', cache, loader as any);
    await getDocument('https://example/b.pdf', cache, loader as any);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed loads', async () => {
    const cache = createDocCache();
    let attempts = 0;
    const loader = async (url: string) => {
      attempts++;
      if (attempts === 1) throw new Error('fail');
      return { url } as any;
    };
    await expect(getDocument('https://example/a.pdf', cache, loader)).rejects.toThrow('fail');
    await expect(getDocument('https://example/a.pdf', cache, loader)).resolves.toEqual({
      url: 'https://example/a.pdf'
    });
    expect(attempts).toBe(2);
  });
});
