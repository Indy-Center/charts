import type { PDFDocumentProxy } from 'pdfjs-dist';

export type DocCache = Map<string, PDFDocumentProxy>;
export type DocLoader = (url: string) => Promise<PDFDocumentProxy>;

export function createDocCache(): DocCache {
  return new Map();
}

export async function getDocument(
  url: string,
  cache: DocCache,
  loader: DocLoader
): Promise<PDFDocumentProxy> {
  const cached = cache.get(url);
  if (cached) return cached;
  const doc = await loader(url);
  cache.set(url, doc);
  return doc;
}

/**
 * Default browser-side loader. Lazily imports pdfjs-dist + worker so it
 * doesn't get pulled into the SSR bundle.
 */
export async function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  const pdfjs = await import('pdfjs-dist');
  // Worker is bundled by Vite via ?url import.
  const worker = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const task = pdfjs.getDocument({ url, withCredentials: false });
  return task.promise;
}
