import { describe, it, expect, vi } from 'vitest';
import { createDocCache, getDocument, proxyPdfUrl } from '$lib/pdf';

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

describe('proxyPdfUrl', () => {
  it('rewrites charts-v2.aviationapi.com URLs through the proxy', () => {
    const result = proxyPdfUrl('https://charts-v2.aviationapi.com/260416/00203ad.pdf');
    expect(result).toBe('/api/pdf?url=https%3A%2F%2Fcharts-v2.aviationapi.com%2F260416%2F00203ad.pdf');
  });

  it('passes through other hosts unchanged', () => {
    const url = 'https://example.com/foo.pdf';
    expect(proxyPdfUrl(url)).toBe(url);
  });

  it('passes through non-URLs unchanged', () => {
    expect(proxyPdfUrl('relative/path.pdf')).toBe('relative/path.pdf');
  });
});
