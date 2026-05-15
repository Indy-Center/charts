// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChartListCard from '$lib/components/ChartListCard.svelte';
import type { Chart, ChartsByGroup } from '$lib/types';
import { __resetPinsForTests, isUserPinned } from '$lib/chart-pins';

const mk = (n: string): Chart => ({
	chart_name: n,
	chart_sequence: '0',
	pdf_name: `${n}.pdf`,
	pdf_url: `https://x/${n}.pdf`,
	did_change: false
});

const byGroup: ChartsByGroup = {
	airport_diagram: [mk('AIRPORT DIAGRAM')],
	general: [mk('TAKEOFF MINIMUMS'), mk('ALTERNATE MINIMUMS')],
	approach: [mk('ILS OR LOC RWY 10L'), mk('ILS OR LOC RWY 28R')],
	departure: [mk('SPILR ONE (RNAV)')],
	arrival: []
};

beforeEach(() => {
	__resetPinsForTests();
});

describe('ChartListCard', () => {
	it('renders airport id and optional role label in the header', () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			airportName: 'LOUISVILLE MUHAMMAD ALI INTL',
			roleLabel: 'Departure',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		expect(screen.getByText('KSDF')).toBeInTheDocument();
		expect(screen.getByText('Departure')).toBeInTheDocument();
		expect(screen.getByText(/Louisville Muhammad Ali Intl/)).toBeInTheDocument();
	});

	it('renders the full chart list when expanded (default)', () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		expect(screen.getByRole('button', { name: 'AIRPORT DIAGRAM' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'TAKEOFF MINIMUMS' })).toBeInTheDocument();
	});

	it('collapses when the header is clicked, hiding the chart list', async () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		const toggle = screen.getByRole('button', { name: /collapse KSDF/i });
		await fireEvent.click(toggle);
		expect(screen.queryByRole('button', { name: 'AIRPORT DIAGRAM' })).not.toBeInTheDocument();
		// Header still visible
		expect(screen.getByText('KSDF')).toBeInTheDocument();
	});

	it('shows defaultPins as chips when collapsed', () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			defaultPins: [byGroup.airport_diagram[0]!, byGroup.departure[0]!],
			defaultCollapsed: true,
			selected: null,
			onPick: () => {}
		});
		// Chips are buttons named after their chart, visible while collapsed
		expect(screen.getByRole('button', { name: 'AIRPORT DIAGRAM' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'SPILR ONE (RNAV)' })).toBeInTheDocument();
		// Unpinned charts are not visible while collapsed
		expect(screen.queryByRole('button', { name: 'TAKEOFF MINIMUMS' })).not.toBeInTheDocument();
	});

	it('renders no chip strip when collapsed with no pins', () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			defaultCollapsed: true,
			selected: null,
			onPick: () => {}
		});
		// Only the header button is present
		const buttons = screen.getAllByRole('button');
		expect(buttons).toHaveLength(1);
	});

	it('emits onPick when a chart is clicked', async () => {
		const onPick = vi.fn();
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick
		});
		await fireEvent.click(screen.getByRole('button', { name: 'AIRPORT DIAGRAM' }));
		expect(onPick).toHaveBeenCalledOnce();
		expect(onPick.mock.calls[0][0].chart_name).toBe('AIRPORT DIAGRAM');
	});

	it('marks the selected chart with aria-current', () => {
		const diagram = byGroup.airport_diagram[0]!;
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: diagram,
			onPick: () => {}
		});
		expect(screen.getByRole('button', { name: 'AIRPORT DIAGRAM' })).toHaveAttribute(
			'aria-current',
			'true'
		);
	});

	it('renders an Open link when href is provided', () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			href: '/ksdf',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		const link = screen.getByRole('link');
		expect(link.getAttribute('href')).toBe('/ksdf');
	});

	it('toggling the pin button updates the chart-pins store', async () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		const pinBtn = screen.getByRole('button', { name: /^Pin AIRPORT DIAGRAM$/ });
		await fireEvent.click(pinBtn);
		expect(isUserPinned('KSDF', byGroup.airport_diagram[0]!.pdf_url)).toBe(true);
	});
});
