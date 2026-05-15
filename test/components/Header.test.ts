// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Header from '$lib/components/Header.svelte';

describe('Header', () => {
	it('renders the Indy Center logo as a home link', () => {
		render(Header, { user: null, currentPath: '/' });
		const homeLink = screen.getByRole('link', { name: /indy center|home/i });
		expect(homeLink.getAttribute('href')).toBe('/');
	});

	it('renders the airport search combobox', () => {
		render(Header, { user: null, currentPath: '/' });
		expect(screen.getByRole('combobox')).toBeInTheDocument();
	});

	it('renders a Connect with VATSIM link when user is null', () => {
		render(Header, { user: null, currentPath: '/' });
		expect(screen.getByRole('link', { name: /connect with vatsim/i })).toBeInTheDocument();
	});

	it('renders the user name when authenticated', () => {
		render(Header, {
			user: {
				id: 'u1',
				cid: '1',
				email: 'x@y.com',
				isActive: true,
				vatsimData: { cid: '1', personal: { name_first: 'Sam', name_last: 'C', email: 'x@y.com' } },
				attributes: {},
				createdAt: 0,
				updatedAt: 0
			},
			currentPath: '/'
		});
		expect(screen.getByText(/sam/i)).toBeInTheDocument();
	});
});
