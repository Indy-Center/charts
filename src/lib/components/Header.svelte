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

<div class="sticky top-0 z-10 w-full bg-zinc-950/85 backdrop-blur-md">
	<!-- No border, no max-width cap, tight side padding (px-3) so the logo
	     aligns with the left edge of the pinboard cards on the chart viewer.
	     Search sits snug next to the logo; right block uses ml-auto to push
	     itself to the page's right edge. Reads as floating widgets, not a
	     banded header strip. -->
	<div class="flex w-full items-center gap-2 px-3 py-2.5 sm:gap-3">
		<a
			href="/"
			aria-label="Indy Center home"
			class="flex shrink-0 cursor-pointer items-center transition-opacity hover:opacity-80"
		>
			<img src="/indy-mark.svg" alt="Indy Center" class="h-7 w-auto invert" />
		</a>

		<div class="min-w-0 max-w-xl flex-1">
			<AirportSearch onSelectAirport={pickAirport} onSelectChart={pickChart} />
		</div>

		<div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
			{#if actions}
				{@render actions()}
			{/if}

			{#if statusPill}
				<a
					href="/dashboard"
					aria-label={statusPill.kind === 'flying'
						? 'Active flight plan'
						: 'Active controlling session'}
					title={statusPill.kind === 'flying' ? 'Active flight plan' : 'Active controlling session'}
					class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
				>
					{#if statusPill.kind === 'flying'}
						<IconTakeoff class="text-sm text-sky-400" />
					{:else}
						<IconTower class="text-sm text-sky-400" />
					{/if}
					<span class="hidden font-mono tracking-wide sm:inline">{statusPill.text}</span>
				</a>
			{/if}

			<UserChip {user} {currentPath} {identityUrl} />
		</div>
	</div>
</div>
