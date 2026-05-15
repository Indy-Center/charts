// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ChartMeta from '$lib/components/ChartMeta.svelte';

describe('ChartMeta', () => {
	it('renders chart name', () => {
		render(ChartMeta, { name: 'ILS RWY 05L', page: 1, totalPages: 1 });
		expect(screen.getByText('ILS RWY 05L')).toBeInTheDocument();
	});

	it('hides page indicator when single page', () => {
		render(ChartMeta, { name: 'X', page: 1, totalPages: 1 });
		expect(screen.queryByText(/page/i)).not.toBeInTheDocument();
	});

	it('shows page indicator when multi-page', () => {
		render(ChartMeta, { name: 'X', page: 2, totalPages: 4 });
		expect(screen.getByText(/2 \/ 4/)).toBeInTheDocument();
	});
});
