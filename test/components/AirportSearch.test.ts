// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AirportSearch from '$lib/components/AirportSearch.svelte';
import { airportCache } from '$lib/airport-cache';

describe('AirportSearch', () => {
	beforeEach(() => airportCache.clear());

	it('shows common airports when input is empty', async () => {
		const onSelectAirport = vi.fn();
		const onSelectChart = vi.fn();
		render(AirportSearch, { onSelectAirport, onSelectChart });
		await fireEvent.focus(screen.getByRole('combobox'));
		expect(screen.getByText('IND')).toBeInTheDocument();
		expect(screen.getByText('CMH')).toBeInTheDocument();
	});

	it('filters common airports by prefix on 1-2 chars', async () => {
		const onSelectAirport = vi.fn();
		const onSelectChart = vi.fn();
		render(AirportSearch, { onSelectAirport, onSelectChart });
		const input = screen.getByRole('combobox');
		await fireEvent.input(input, { target: { value: 'IN' } });
		expect(screen.getByText('IND')).toBeInTheDocument();
		expect(screen.queryByText('CMH')).not.toBeInTheDocument();
	});

	it('emits onSelectAirport when an airport row is chosen', async () => {
		const onSelectAirport = vi.fn();
		const onSelectChart = vi.fn();
		render(AirportSearch, { onSelectAirport, onSelectChart });
		await fireEvent.focus(screen.getByRole('combobox'));
		await fireEvent.click(screen.getByText('IND'));
		expect(onSelectAirport).toHaveBeenCalledWith('IND');
	});
});
