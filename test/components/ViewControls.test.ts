// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ViewControls from '$lib/components/ViewControls.svelte';
import { DEFAULT_VIEW_STATE } from '$lib/types';

describe('ViewControls', () => {
	it('shows current zoom percent', () => {
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE, zoom: 1.5 }, onChange: () => {} });
		expect(screen.getByText('150%')).toBeInTheDocument();
	});

	it('emits zoom-in', async () => {
		const onChange = vi.fn();
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE }, onChange });
		await fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ zoom: 1.25 }));
	});

	it('emits zoom-out clamped at 1', async () => {
		const onChange = vi.fn();
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE }, onChange });
		await fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ zoom: 1 }));
	});

	it('cannot zoom below 1', async () => {
		const onChange = vi.fn();
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE, zoom: 1 }, onChange });
		await fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ zoom: 1 }));
	});

	it('rotates by 90 deg', async () => {
		const onChange = vi.fn();
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE, rotation: 0 }, onChange });
		await fireEvent.click(screen.getByRole('button', { name: /rotate/i }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ rotation: 90 }));
	});

	it('toggles invert', async () => {
		const onChange = vi.fn();
		render(ViewControls, { view: { ...DEFAULT_VIEW_STATE, invert: true }, onChange });
		await fireEvent.click(screen.getByRole('button', { name: /invert/i }));
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ invert: false }));
	});
});
