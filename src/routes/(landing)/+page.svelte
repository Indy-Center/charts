<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { COMMON_AIRPORTS } from '$lib/airports';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const pinnedLabel = $derived(
		data.pinnedAirports.mode === 'controlling' ? 'Controlling' : 'Flying'
	);
</script>

<div class="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
	{#if data.pinnedAirports.airports.length > 0}
		<section class="mb-6">
			<h2 class="mb-3 text-sm font-semibold text-zinc-300">{pinnedLabel}</h2>
			<nav
				aria-label="Airports for your active session"
				class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
			>
				{#each data.pinnedAirports.airports as id (id)}
					<a
						href={`/${id.toLowerCase()}`}
						class="flex cursor-pointer items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800/50 py-3 font-mono text-sm font-medium tracking-wider text-zinc-200 transition-colors hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300"
					>
						{id}
					</a>
				{/each}
			</nav>
		</section>
	{/if}

	<section>
		<h2 class="mb-3 text-sm font-semibold text-zinc-300">Common airports</h2>
		<nav aria-label="Common airports" class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
			{#each displayList as id (id)}
				<a
					href={`/${id.toLowerCase()}`}
					class="flex cursor-pointer items-center justify-center rounded-md border border-zinc-700/50 bg-zinc-800/50 py-3 font-mono text-sm font-medium tracking-wider text-zinc-300 transition-colors hover:border-sky-600/50 hover:bg-zinc-800 hover:text-sky-300"
				>
					{id}
				</a>
			{/each}
		</nav>
	</section>
</div>
