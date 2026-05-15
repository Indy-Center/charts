// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import UserChip from '$lib/components/UserChip.svelte';

describe('UserChip', () => {
	it('renders a Sign in link when user is null, encoding the current path as return_url', () => {
		render(UserChip, {
			user: null,
			currentPath: '/kind',
			identityUrl: 'https://auth.flyindycenter.com'
		});
		const link = screen.getByRole('link', { name: /sign in/i });
		expect(link).toBeInTheDocument();
		const href = link.getAttribute('href')!;
		expect(href).toContain('auth.flyindycenter.com/login');
		expect(href).toContain('return_url=');
		expect(href).toContain(encodeURIComponent('/kind'));
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
			currentPath: '/',
			identityUrl: 'https://auth.flyindycenter.com'
		});
		expect(screen.getByText(/pat/i)).toBeInTheDocument();
		const out = screen.getByRole('link', { name: /sign out/i });
		expect(out.getAttribute('href')).toContain('auth.flyindycenter.com/logout');
	});

	it('falls back to localhost identity URL when identityUrl prop is omitted', () => {
		render(UserChip, { user: null, currentPath: '/' });
		const link = screen.getByRole('link', { name: /sign in/i });
		expect(link.getAttribute('href')).toContain('localhost:8787/login');
	});
});
