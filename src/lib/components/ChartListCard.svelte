<!-- src/lib/components/ChartListCard.svelte -->
<!--
  Reusable collapsible card for a single airport's chart list. Used on the
  home page (one card per flight role) and on the chart viewer's pinboard
  (one card per pinboard slot).

  Collapsed view: airport id + role + chevron header. If any charts are
  pinned (via defaultPins from the server or the user's chart-pins store),
  they render as small clickable chips below the header.

  Expanded view: full ChartList. Each row has a pin/unpin toggle so users
  can curate their own quick-access set.
-->
<script lang="ts">
	import IconChevron from '~icons/mdi/chevron-down';
	import IconPin from '~icons/mdi/pin';
	import IconPinOutline from '~icons/mdi/pin-outline';
	import IconClose from '~icons/mdi/close';
	import IconTakeoff from '~icons/mdi/airplane-takeoff';
	import IconLanding from '~icons/mdi/airplane-landing';
	import IconAirport from '~icons/mdi/airport';
	import IconTower from '~icons/mdi/radio-tower';
	import { CHART_GROUP_LABELS, CHART_GROUP_ORDER } from '$lib/types';
	import type { Chart, ChartGroup, ChartsByGroup } from '$lib/types';
	import { isPinned, togglePin, userAddedFor, userRemovedFor } from '$lib/chart-pins.svelte';

	export type CardRole = 'departure' | 'arrival' | 'alternate' | 'controlling' | 'pinned';

	const ROLE_LABEL: Record<CardRole, string> = {
		departure: 'Departure',
		arrival: 'Arrival',
		alternate: 'Alternate',
		controlling: 'Controlling',
		pinned: 'Pinned'
	};

	let {
		airportId,
		airportName,
		role,
		href,
		chartsByGroup,
		defaultPins = [],
		selected = null,
		isCurrent = false,
		onPick,
		onDismiss,
		defaultCollapsed = false
	}: {
		airportId: string;
		airportName?: string;
		role?: CardRole;
		href?: string;
		chartsByGroup: ChartsByGroup;
		defaultPins?: Chart[];
		selected?: Chart | null;
		// True when this card represents the airport the user is currently
		// viewing. Subtly accents the card border so it's clear which airport
		// the on-screen chart belongs to, even when the card is collapsed.
		isCurrent?: boolean;
		onPick: (chart: Chart) => void;
		onDismiss?: () => void;
		defaultCollapsed?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	let collapsed = $state(defaultCollapsed);

	// Note: `collapsed` is initialised once from `defaultCollapsed` and then
	// owned by user toggles. We deliberately don't resync on prop changes so
	// that a user's manual expand/collapse choice survives navigation between
	// airports.

	// Effective pins = (server defaults minus user-removed) ∪ user-added,
	// deduped by pdf_url and rendered in the order charts appear in
	// chartsByGroup so the chip order is stable across renders.
	const removedDefaults = $derived(userRemovedFor(airportId));
	const addedPins = $derived(userAddedFor(airportId));

	const allChartsOrdered = $derived.by(() => {
		const out: Chart[] = [];
		for (const group of CHART_GROUP_ORDER) {
			for (const c of chartsByGroup[group]) {
				out.push(c);
			}
		}
		return out;
	});

	const effectivePins = $derived.by(() => {
		const set = new Set<string>();
		for (const d of defaultPins) {
			if (!removedDefaults.has(d.pdf_url)) {
				set.add(d.pdf_url);
			}
		}
		for (const a of addedPins) {
			set.add(a.pdf_url);
		}
		return allChartsOrdered.filter((c) => set.has(c.pdf_url));
	});

	function isChartPinned(chart: Chart): boolean {
		const isDefault = defaultPins.some((p) => p.pdf_url === chart.pdf_url);
		return isPinned(airportId, chart.pdf_url, isDefault);
	}

	function onTogglePin(chart: Chart, group: ChartGroup, e: MouseEvent) {
		e.stopPropagation();
		const isDefault = defaultPins.some((p) => p.pdf_url === chart.pdf_url);
		togglePin(
			airportId,
			airportName,
			{ chart_name: chart.chart_name, pdf_url: chart.pdf_url, group },
			isDefault
		);
	}

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<section
	aria-label={`${airportId}${role ? ` (${ROLE_LABEL[role]})` : ''}`}
	aria-current={isCurrent ? 'true' : undefined}
	class={['rounded-lg', isCurrent ? 'bg-sky-500/10' : 'bg-zinc-900/85']}
>
	<!--
	  Header uses an absolutely-positioned toggle button as an overlay so the
	  airport-ID link and X button can be true siblings rather than nested
	  inside another <button> (which Svelte warns about and browsers may
	  rewrite during hydration). Content sits in a pointer-events-none layer
	  on top; interactive children opt back in with pointer-events-auto.
	-->
	<div class="group relative rounded-t-lg">
		<button
			type="button"
			aria-expanded={!collapsed}
			aria-label={collapsed ? `Expand ${airportId}` : `Collapse ${airportId}`}
			onclick={() => (collapsed = !collapsed)}
			class="absolute inset-0 cursor-pointer rounded-t-lg focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:outline-none"
		></button>
		<div
			class="pointer-events-none relative z-10 flex items-center justify-between gap-2 px-4 py-3"
		>
			<!--
			  Stack ID over name so every header is the same height regardless of
			  airport-name length. Inline-wrap caused tall cards (long names) to
			  jut out next to short ones; the two-row block is consistent.
			-->
			<div class="flex min-w-0 items-center gap-2">
				{#if role}
					<span
						aria-label={ROLE_LABEL[role]}
						title={ROLE_LABEL[role]}
						class="flex shrink-0 text-sky-400"
					>
						{#if role === 'departure'}
							<IconTakeoff class="text-base" />
						{:else if role === 'arrival'}
							<IconLanding class="text-base" />
						{:else if role === 'controlling'}
							<IconTower class="text-base" />
						{:else}
							<IconAirport class="text-base" />
						{/if}
					</span>
				{/if}
				<div class="flex min-w-0 flex-col leading-tight">
					{#if href}
						<a
							{href}
							aria-label={`Open ${airportId} chart viewer`}
							class="pointer-events-auto cursor-pointer font-mono text-sm font-semibold tracking-wider text-zinc-100 hover:text-sky-300"
						>
							{airportId}
						</a>
					{:else}
						<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
							{airportId}
						</span>
					{/if}
					{#if airportName}
						<span class="truncate text-[11px] text-zinc-500">{titleCase(airportName)}</span>
					{/if}
				</div>
			</div>
			<div class="flex shrink-0 items-center gap-1">
				{#if onDismiss}
					<button
						type="button"
						aria-label={`Dismiss ${airportId}`}
						onclick={() => onDismiss?.()}
						class="pointer-events-auto flex cursor-pointer items-center justify-center rounded-md p-1 text-zinc-500 opacity-0 transition-opacity transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:opacity-100 group-hover:opacity-100"
					>
						<IconClose class="text-sm" />
					</button>
				{/if}
				<IconChevron
					class={`text-base text-zinc-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
				/>
			</div>
		</div>
	</div>

	{#if collapsed}
		{#if effectivePins.length > 0}
			<div class="flex flex-wrap gap-1 border-t border-zinc-800/60 px-3 py-2">
				{#each effectivePins as chart (`${chart.chart_name}:${chart.pdf_url}`)}
					{@const isSelected =
						!!selected &&
						chart.chart_name === selected.chart_name &&
						chart.pdf_url === selected.pdf_url}
					<button
						type="button"
						aria-current={isSelected ? 'true' : undefined}
						onclick={() => onPick(chart)}
						class={[
							'cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap transition-colors',
							isSelected
								? 'bg-sky-500/15 text-sky-100'
								: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
						]}
					>
						{chart.chart_name}
					</button>
				{/each}
			</div>
		{/if}
	{:else}
		<div
			class="flex max-h-[60vh] flex-col gap-3 overflow-y-auto border-t border-zinc-800/60 px-4 pt-2 pb-3 text-sm"
		>
			{#each CHART_GROUP_ORDER as group (group)}
				{#if chartsByGroup[group].length > 0}
					<div>
						<h3 class="mb-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
							{CHART_GROUP_LABELS[group]}
						</h3>
						<ul class="flex flex-col gap-0.5">
							{#each chartsByGroup[group] as chart (`${chart.chart_name}:${chart.pdf_url}`)}
								{@const isSelected =
									!!selected &&
									chart.chart_name === selected.chart_name &&
									chart.pdf_url === selected.pdf_url}
								{@const pinned = isChartPinned(chart)}
								<li class="group/row flex items-center gap-1">
									<button
										type="button"
										aria-current={isSelected ? 'true' : undefined}
										onclick={() => onPick(chart)}
										class={[
											'flex flex-1 cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition-colors',
											isSelected
												? 'bg-sky-500/15 text-sky-100'
												: 'text-zinc-200 hover:bg-zinc-800/60 hover:text-zinc-100'
										]}
									>
										<span class="truncate">{chart.chart_name}</span>
									</button>
									<button
										type="button"
										onclick={(e) => onTogglePin(chart, group, e)}
										aria-label={pinned ? `Unpin ${chart.chart_name}` : `Pin ${chart.chart_name}`}
										aria-pressed={pinned}
										class={[
											'shrink-0 cursor-pointer rounded-md p-1 transition-opacity transition-colors',
											pinned
												? 'text-sky-400 opacity-100 hover:bg-zinc-800/60'
												: 'text-zinc-500 opacity-0 hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:opacity-100 group-hover/row:opacity-100'
										]}
									>
										{#if pinned}
											<IconPin class="text-sm" />
										{:else}
											<IconPinOutline class="text-sm" />
										{/if}
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</section>
