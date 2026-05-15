// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChartListCard from '$lib/components/ChartListCard.svelte';
import type { Chart, ChartsByGroup } from '$lib/types';

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

	it('collapses when the chevron is clicked, hiding the body', async () => {
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick: () => {}
		});
		expect(screen.getByText('AIRPORT DIAGRAM')).toBeInTheDocument();
		const toggle = screen.getByRole('button', { name: /collapse/i });
		await fireEvent.click(toggle);
		expect(screen.queryByText('AIRPORT DIAGRAM')).not.toBeInTheDocument();
		// Header is still visible
		expect(screen.getByText('KSDF')).toBeInTheDocument();
	});

	it('renders primary list above a Show more toggle when primary is provided', async () => {
		const primary = [byGroup.airport_diagram[0]!, byGroup.departure[0]!];
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			primary,
			selected: null,
			onPick: () => {}
		});
		// Primary entries render at the top of the body.
		expect(screen.getByRole('button', { name: /AIRPORT DIAGRAM/ })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /SPILR ONE/ })).toBeInTheDocument();
		// 'TAKEOFF MINIMUMS' is in chartsByGroup but not in primary - hidden until expanded.
		expect(screen.queryByRole('button', { name: /TAKEOFF MINIMUMS/ })).not.toBeInTheDocument();
		const showMore = screen.getByRole('button', { name: /show \d+ more/i });
		await fireEvent.click(showMore);
		expect(screen.getByRole('button', { name: /TAKEOFF MINIMUMS/ })).toBeInTheDocument();
	});

	it('emits onPick when a chart is clicked', async () => {
		const onPick = vi.fn();
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			selected: null,
			onPick
		});
		await fireEvent.click(screen.getByRole('button', { name: /AIRPORT DIAGRAM/ }));
		expect(onPick).toHaveBeenCalledOnce();
		expect(onPick.mock.calls[0][0].chart_name).toBe('AIRPORT DIAGRAM');
	});

	it('marks the selected chart with aria-current in the primary list', () => {
		const diagram = byGroup.airport_diagram[0]!;
		render(ChartListCard, {
			airportId: 'KSDF',
			chartsByGroup: byGroup,
			primary: [diagram],
			selected: diagram,
			onPick: () => {}
		});
		expect(screen.getByRole('button', { name: /AIRPORT DIAGRAM/ })).toHaveAttribute(
			'aria-current',
			'true'
		);
	});

	it('renders an airport-link header when href is provided', () => {
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
});
