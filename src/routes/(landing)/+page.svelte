<!-- src/routes/(landing)/+page.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { COMMON_AIRPORTS } from '$lib/airports';
	import AirportSearch from '$lib/components/AirportSearch.svelte';
	import { chartToSlug } from '$lib/slug';
	import type { Chart } from '$lib/types';
	import IconInfo from '~icons/mdi/information-outline';
	import IconTakeoff from '~icons/mdi/airplane-takeoff';
	import IconTower from '~icons/mdi/radio-tower';
	import IconArrow from '~icons/mdi/arrow-right';

	let { data } = $props();

	const displayList = COMMON_AIRPORTS.map((icao) => icao.replace(/^K/, ''));

	const activeCallout = $derived.by(() => {
		const session = data.session;
		if (!session) {
			return null;
		}
		if (session.activeFlightPlan) {
			const fp = session.activeFlightPlan;
			return {
				kind: 'flying' as const,
				title: 'Looks like you have a flight planned.',
				detail: `${fp.departure} → ${fp.arrival}`
			};
		}
		if (session.activeSession) {
			return {
				kind: 'controlling' as const,
				title: "You're signed in to a position.",
				detail: session.activeSession.vatsimData.callsign
			};
		}
		return null;
	});

	function pickAirport(faaId: string) {
		goto(`/${faaId.toLowerCase()}`);
	}

	function pickChart(faaId: string, chart: Chart) {
		goto(`/${faaId.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}
</script>

<div class="relative flex flex-1 flex-col items-center px-4 pt-20 sm:pt-28">
	<div
		aria-hidden="true"
		class="pointer-events-none absolute top-0 left-1/2 -z-0 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-sky-500/5 blur-3xl"
	></div>

	<div class="relative z-10 flex w-full max-w-2xl flex-col items-center">
		<img src="/indy-mark.svg" alt="Indy Center" class="mb-8 h-16 w-auto invert sm:h-20" />
		<h1 class="mb-8 text-center text-2xl font-semibold text-zinc-100 sm:text-3xl">Charts</h1>

		<div
			role="note"
			class="mb-4 flex w-full items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
		>
			<IconInfo class="mt-0.5 shrink-0 text-base text-sky-300" />
			<p>
				This feature is in active development. Reach out on the
				<a
					href="https://discord.indy.center"
					target="_blank"
					rel="noopener"
					class="cursor-pointer font-medium underline-offset-2 hover:underline"
				>
					Indy Center Discord
				</a>
				with feedback or to report a bug.
			</p>
		</div>

		<div class="w-full">
			<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} size="lg" />
		</div>

		{#if activeCallout}
			<a
				href="/dashboard"
				class="group mt-6 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-800/70 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-200 transition-colors hover:border-sky-500/40 hover:bg-zinc-900/85"
			>
				<span class="flex min-w-0 items-center gap-3">
					<span
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-300"
					>
						{#if activeCallout.kind === 'flying'}
							<IconTakeoff class="text-base" />
						{:else}
							<IconTower class="text-base" />
						{/if}
					</span>
					<span class="flex min-w-0 flex-col">
						<span class="truncate text-zinc-100">{activeCallout.title}</span>
						<span class="truncate font-mono text-xs text-zinc-400">{activeCallout.detail}</span>
					</span>
				</span>
				<span
					class="flex shrink-0 items-center gap-1 text-xs font-medium text-sky-300 transition-colors group-hover:text-sky-200"
				>
					<span class="hidden sm:inline">Open dashboard</span>
					<IconArrow class="text-sm transition-transform group-hover:translate-x-0.5" />
				</span>
			</a>
		{/if}

		<div class="mt-12 flex w-full flex-col items-center gap-3">
			<span class="text-[10px] font-semibold tracking-[0.2em] text-zinc-500 uppercase">
				Popular airports
			</span>
			<nav aria-label="Common airports" class="flex flex-wrap justify-center gap-2">
				{#each displayList as id (id)}
					<a
						href={`/${id.toLowerCase()}`}
						class="cursor-pointer rounded-md border border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs tracking-wider text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-zinc-100"
					>
						{id}
					</a>
				{/each}
			</nav>
		</div>
	</div>
</div>
