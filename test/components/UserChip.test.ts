// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UserChip from '$lib/components/UserChip.svelte';

describe('UserChip', () => {
	it('renders a Sign in link when user is null, encoding the current path as return_url', () => {
		render(UserChip, { user: null, currentPath: '/kind' });
		const link = screen.getByRole('link', { name: /sign in/i });
		expect(link).toBeInTheDocument();
		const href = link.getAttribute('href')!;
		expect(href).toContain('identity.flyindycenter.com/login');
		expect(href).toContain(encodeURIComponent('https://charts.flyindycenter.com/kind'));
	});

	it("renders the user's name and a Sign out link when user is present", () => {
		render(UserChip, {
			user: {
				id: 'u1',
				cid: '1',
				email: 'x@y.com',
				isActive: true,
				vatsimData: { cid: '1', personal: { name_first: 'Pat', name_last: 'Q', email: 'x@y.com' } },
				attributes: {},
				createdAt: 0,
				updatedAt: 0
			},
			currentPath: '/'
		});
		expect(screen.getByText(/pat/i)).toBeInTheDocument();
		const out = screen.getByRole('link', { name: /sign out/i });
		expect(out.getAttribute('href')).toContain('identity.flyindycenter.com/logout');
	});
});
