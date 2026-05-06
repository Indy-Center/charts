// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChartList from '$lib/components/ChartList.svelte';
import type { Chart, ChartsByGroup } from '$lib/types';

const mk = (n: string, change = false): Chart => ({
	chart_name: n,
	chart_sequence: '0',
	pdf_name: `${n}.pdf`,
	pdf_url: `https://x/${n}.pdf`,
	did_change: change
});

const groups: ChartsByGroup = {
	airport_diagram: [mk('AIRPORT DIAGRAM')],
	general: [mk('TAKEOFF MINIMUMS')],
	approach: [mk('ILS RWY 05L', true)],
	departure: [],
	arrival: []
};

describe('ChartList', () => {
	it('renders only non-empty group headings', () => {
		render(ChartList, { byGroup: groups, selectedPdfUrl: undefined, onPick: () => {} });
		expect(screen.getByText('Airport Diagram')).toBeInTheDocument();
		expect(screen.getByText('General')).toBeInTheDocument();
		expect(screen.getByText('Approaches')).toBeInTheDocument();
		expect(screen.queryByText('Departures')).not.toBeInTheDocument();
		expect(screen.queryByText('Arrivals')).not.toBeInTheDocument();
	});

	it('marks the selected chart', () => {
		render(ChartList, {
			byGroup: groups,
			selectedPdfUrl: 'https://x/AIRPORT DIAGRAM.pdf',
			onPick: () => {}
		});
		const item = screen.getByRole('button', { name: /AIRPORT DIAGRAM/ });
		expect(item).toHaveAttribute('aria-current', 'true');
	});

	it('shows did_change badge', () => {
		render(ChartList, { byGroup: groups, selectedPdfUrl: undefined, onPick: () => {} });
		const ils = screen.getByRole('button', { name: /ILS RWY 05L/ });
		expect(ils.querySelector('[aria-label="Changed this cycle"]')).toBeTruthy();
	});

	it('calls onPick with the chart when clicked', async () => {
		const onPick = vi.fn();
		render(ChartList, { byGroup: groups, selectedPdfUrl: undefined, onPick });
		await fireEvent.click(screen.getByRole('button', { name: /TAKEOFF MINIMUMS/ }));
		expect(onPick).toHaveBeenCalledOnce();
		expect(onPick.mock.calls[0][0].chart_name).toBe('TAKEOFF MINIMUMS');
	});
});
