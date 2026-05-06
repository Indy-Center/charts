// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import OverlayCardHarness from './OverlayCardHarness.svelte';

describe('OverlayCard', () => {
	it('renders expanded content by default', () => {
		render(OverlayCardHarness, { title: 'Search', body: 'hello' });
		expect(screen.getByText('hello')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
	});

	it('collapses to an icon-only button when collapse clicked', async () => {
		render(OverlayCardHarness, { title: 'Search', body: 'hello' });
		await fireEvent.click(screen.getByRole('button', { name: /collapse/i }));
		expect(screen.queryByText('hello')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /expand search/i })).toBeInTheDocument();
	});

	it('re-expands when the badge is clicked', async () => {
		render(OverlayCardHarness, { title: 'Search', body: 'hello', defaultCollapsed: true });
		await fireEvent.click(screen.getByRole('button', { name: /expand search/i }));
		expect(screen.getByText('hello')).toBeInTheDocument();
	});
});
