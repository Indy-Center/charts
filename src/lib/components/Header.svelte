<!-- src/lib/components/Header.svelte -->
<script lang="ts">
	import type { SessionContext, User } from '@indy-center/identity';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import AirportSearch from './AirportSearch.svelte';
	import UserChip from './UserChip.svelte';
	import { chartToSlug } from '$lib/slug';
	import IconTakeoff from '~icons/mdi/airplane-takeoff';
	import IconTower from '~icons/mdi/radio-tower';

	let {
		user,
		session = null,
		currentPath = '/',
		identityUrl,
		actions
	}: {
		user: User | null;
		session?: SessionContext | null;
		currentPath?: string;
		identityUrl?: string;
		actions?: Snippet;
	} = $props();

	type StatusPill = { kind: 'flying' | 'controlling'; text: string };

	const statusPill = $derived.by<StatusPill | null>(() => {
		if (!session) {
			return null;
		}
		if (session.activeFlightPlan) {
			const fp = session.activeFlightPlan;
			return { kind: 'flying', text: `${fp.departure} → ${fp.arrival}` };
		}
		if (session.activeSession) {
			const callsign = session.activeSession.vatsimData.callsign;
			return { kind: 'controlling', text: callsign };
		}
		return null;
	});

	function pickAirport(id: string) {
		goto(`/${id.toLowerCase()}`);
	}

	function pickChart(id: string, chart: { chart_name: string; pdf_url: string }) {
		goto(`/${id.toLowerCase()}/${chartToSlug(chart.chart_name)}`);
	}
</script>

<div class="sticky top-0 z-10 w-full border-b border-zinc-800/50 bg-zinc-900/80 backdrop-blur-lg">
	<div class="flex w-full items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
		<a
			href="/"
			aria-label="Indy Center home"
			class="flex shrink-0 cursor-pointer items-center transition-opacity hover:opacity-80"
		>
			<img src="/indy-mark.svg" alt="Indy Center" class="h-8 w-auto invert" />
		</a>

		{#if statusPill}
			<a
				href="/"
				aria-label={statusPill.kind === 'flying'
					? 'Active flight plan'
					: 'Active controlling session'}
				class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-sky-700/40 bg-sky-900/20 px-2.5 py-1.5 text-xs font-medium tracking-wide text-sky-200 transition-colors hover:border-sky-500/60 hover:bg-sky-900/30 hover:text-sky-100"
			>
				{#if statusPill.kind === 'flying'}
					<IconTakeoff class="text-sm" />
				{:else}
					<IconTower class="text-sm" />
				{/if}
				<span class="font-mono">{statusPill.text}</span>
			</a>
		{/if}

		<div class="min-w-0 flex-1">
			<div class="mx-auto max-w-2xl">
				<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
			</div>
		</div>

		{#if actions}
			{@render actions()}
		{/if}

		<UserChip {user} {currentPath} {identityUrl} />
	</div>
</div>
