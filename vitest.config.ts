import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		setupFiles: ['./test/setup.ts'],
		projects: [
			{
				extends: true,
				resolve: {
					conditions: ['browser']
				},
				test: {
					name: 'components',
					include: ['test/components/**/*.test.ts'],
					environment: 'jsdom'
				}
			},
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['test/**/*.test.ts'],
					exclude: ['test/components/**'],
					environment: 'node'
				}
			}
		]
	}
});
