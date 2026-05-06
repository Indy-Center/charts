// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ChartCanvas from '$lib/components/ChartCanvas.svelte';
import { DEFAULT_VIEW_STATE } from '$lib/types';

function makeFakeDoc() {
	const page = {
		getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 100 * scale }),
		render: () => ({ promise: Promise.resolve() })
	};
	return {
		numPages: 1,
		getPage: vi.fn(async () => page)
	};
}

describe('ChartCanvas', () => {
	it('renders a canvas and invokes the loader once for the URL', async () => {
		const loader = vi.fn(async () => makeFakeDoc() as any);
		const onChange = vi.fn();
		const onPagesKnown = vi.fn();
		const cache = new Map();

		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			view: { ...DEFAULT_VIEW_STATE },
			onChange,
			onPagesKnown,
			docCache: cache,
			loader
		});

		await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('img', { name: /chart/i })).toBeInTheDocument();
	});

	it('uses cached doc on second render of same URL', async () => {
		const loader = vi.fn(async () => makeFakeDoc() as any);
		const cache = new Map();
		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPagesKnown: () => {},
			docCache: cache,
			loader
		});
		await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

		render(ChartCanvas, {
			pdfUrl: 'https://example/test.pdf',
			view: { ...DEFAULT_VIEW_STATE },
			onChange: () => {},
			onPagesKnown: () => {},
			docCache: cache,
			loader
		});
		await waitFor(() => {
			expect(loader).toHaveBeenCalledTimes(1);
		});
	});
});
