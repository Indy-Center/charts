<!-- src/lib/components/Header.svelte -->
<script lang="ts">
	import type { User } from '@indy-center/identity';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import AirportSearch from './AirportSearch.svelte';
	import UserChip from './UserChip.svelte';
	import { chartToSlug } from '$lib/slug';

	let {
		user,
		currentPath = '/',
		identityUrl,
		actions
	}: {
		user: User | null;
		currentPath?: string;
		identityUrl?: string;
		actions?: Snippet;
	} = $props();

	function pickAirport(id: string) {
		goto(`/${id.toLowerCase()}`);
	}

	function pickChart(id: string, chart: { chart_name: string; pdf_url: string }) {
		goto(`/${id.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}
</script>

<div class="sticky top-0 z-10 w-full border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-lg">
	<div class="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:px-4 sm:py-3.5">
		<a
			href="/"
			aria-label="Indy Center home"
			class="flex shrink-0 cursor-pointer items-center transition-opacity hover:opacity-80"
		>
			<img src="/indy-mark-dark.svg" alt="Indy Center" class="h-8 w-auto" />
		</a>

		<div class="min-w-0 flex-1">
			<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
		</div>

		{#if actions}
			{@render actions()}
		{/if}

		<UserChip {user} {currentPath} {identityUrl} />
	</div>
</div>
