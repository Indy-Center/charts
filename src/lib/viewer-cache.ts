import type { PDFDocumentProxy } from 'pdfjs-dist';
import { SvelteMap } from 'svelte/reactivity';
import type { ViewState } from './types';

/**
 * Tab-scoped caches for the chart viewer. Keyed by `pdf_url`, which is
 * globally unique across airports, so a single shared map is correct.
 *
 * `parsedDocs` is a plain Map — used as a memoization cache by `getDocument`,
 * not read from for rendering, so it doesn't need reactivity.
 *
 * `viewStates` is a SvelteMap so `$derived` consumers update when zoom/pan/
 * rotate/invert change.
 */
export const parsedDocs = new Map<string, PDFDocumentProxy>();
export const viewStates = new SvelteMap<string, ViewState>();
