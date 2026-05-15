<!-- src/routes/(landing)/+layout.svelte -->
<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import UserChip from '$lib/components/UserChip.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();

	// The bare landing route stays hero-only — no sticky header, just a
	// floating UserChip in the top-right corner. Every other route under the
	// (landing) group (e.g. /dashboard) gets the full Header.
	const isHero = $derived(page.route.id === '/(landing)');
</script>

<div class="flex flex-1 flex-col">
	{#if isHero}
		<div class="absolute top-3 right-3 z-10 sm:top-4 sm:right-4">
			<UserChip
				user={data.session?.user ?? null}
				currentPath={page.url.pathname}
				identityUrl={data.identityUrl}
			/>
		</div>
	{:else}
		<Header
			user={data.session?.user ?? null}
			session={data.session}
			currentPath={page.url.pathname}
			identityUrl={data.identityUrl}
		/>
	{/if}

	<main class="flex flex-1 flex-col">
		{@render children()}
	</main>

	<footer class="flex shrink-0 items-center justify-center py-3">
		<div class="mx-auto max-w-6xl px-4 text-center">
			<p class="mb-1 text-xs leading-tight text-zinc-400">
				This site is not affiliated with the Federal Aviation Administration or any governing aviation
				body. All content contained herein is approved only for use on the VATSIM network.
			</p>
			<p class="text-xs leading-tight text-zinc-500">
				Copyright {new Date().getFullYear()} Steve Crow · charts powered by
				<a
					href="https://aviationapi.com"
					target="_blank"
					rel="noopener"
					class="cursor-pointer transition-colors hover:text-zinc-400"
				>
					AviationAPI
				</a>
			</p>
		</div>
	</footer>
</div>
