// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ChartCanvas from '$lib/components/ChartCanvas.svelte';
import { DEFAULT_VIEW_STATE } from '$lib/types';

function makeFakeDoc(pageTexts: string[]) {
	return {
		numPages: pageTexts.length,
		getPage: vi.fn(async (n: number) => ({
			getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 100 * scale }),
			render: () => ({ promise: Promise.resolve() }),
			getTextContent: async () => ({
				items: pageTexts[n - 1].split(' ').map((s) => ({ str: s }))
			})
		}))
	};
}

describe('ChartCanvas', () => {
	it('renders a canvas and invokes the loader once for the URL', async () => {
		const loader = vi.fn(async () => makeFakeDoc(['placeholder']) as any);
		const onChange = vi.fn();
		const onPageInfo = vi.fn();
		const cache = new Map();

		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			airportIdent: 'IND',
			chartName: 'AIRPORT DIAGRAM',
			view: { ...DEFAULT_VIEW_STATE },
			onChange,
			onPageInfo,
			docCache: cache,
			loader
		});

		await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('img', { name: /chart/i })).toBeInTheDocument();
	});

	it('uses cached doc on second render of same URL', async () => {
		const loader = vi.fn(async () => makeFakeDoc(['placeholder']) as any);
		const cache = new Map();
		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			airportIdent: 'IND',
			chartName: 'AIRPORT DIAGRAM',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPageInfo: () => {},
			docCache: cache,
			loader
		});
		await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			airportIdent: 'IND',
			chartName: 'AIRPORT DIAGRAM',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPageInfo: () => {},
			docCache: cache,
			loader
		});
		await waitFor(() => {
			expect(loader).toHaveBeenCalledTimes(1);
		});
	});

	it('jumps to the page containing the airport ident for minimums docs', async () => {
		const loader = vi.fn(async () =>
			makeFakeDoc(['ALABAMA stuff', 'CALIFORNIA stuff', 'INDIANAPOLIS IND charts here', 'OHIO stuff']) as any
		);
		const onPageInfo = vi.fn();
		render(ChartCanvas, {
			pdfUrl: 'https://example/min.pdf',
			airportIdent: 'IND',
			chartName: 'TAKEOFF MINIMUMS',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPageInfo,
			docCache: new Map(),
			loader
		});

		await waitFor(() => expect(onPageInfo).toHaveBeenCalledWith({ current: 3, total: 4 }));
	});

	it('does not smart-detect for non-minimums charts', async () => {
		const loader = vi.fn(async () =>
			makeFakeDoc(['IND stuff', 'IND stuff again', 'IND stuff yet again']) as any
		);
		const onPageInfo = vi.fn();
		render(ChartCanvas, {
			pdfUrl: 'https://example/apd.pdf',
			airportIdent: 'IND',
			chartName: 'AIRPORT DIAGRAM',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPageInfo,
			docCache: new Map(),
			loader
		});
		await waitFor(() => expect(onPageInfo).toHaveBeenCalledWith({ current: 1, total: 3 }));
	});
});
