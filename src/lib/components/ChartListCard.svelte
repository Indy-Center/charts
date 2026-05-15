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
	import { CHART_GROUP_LABELS, CHART_GROUP_ORDER } from '$lib/types';
	import type { Chart, ChartsByGroup } from '$lib/types';
	import { isUserPinned, togglePin, userPinsFor } from '$lib/chart-pins';

	let {
		airportId,
		airportName,
		roleLabel,
		href,
		chartsByGroup,
		defaultPins = [],
		selected = null,
		onPick,
		defaultCollapsed = false
	}: {
		airportId: string;
		airportName?: string;
		roleLabel?: string;
		href?: string;
		chartsByGroup: ChartsByGroup;
		defaultPins?: Chart[];
		selected?: Chart | null;
		onPick: (chart: Chart) => void;
		defaultCollapsed?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	let collapsed = $state(defaultCollapsed);

	// Effective pins = server defaults ∪ user-toggled, deduped by pdf_url and
	// rendered in the order charts appear in chartsByGroup so the chip order
	// is stable across renders.
	const userPins = $derived(userPinsFor(airportId));

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
		const set = new Set<string>(defaultPins.map((c) => c.pdf_url));
		for (const url of userPins) {
			set.add(url);
		}
		return allChartsOrdered.filter((c) => set.has(c.pdf_url));
	});

	function isPinned(chart: Chart): boolean {
		return (
			defaultPins.some((p) => p.pdf_url === chart.pdf_url) || isUserPinned(airportId, chart.pdf_url)
		);
	}

	function onTogglePin(chart: Chart, e: MouseEvent) {
		e.stopPropagation();
		togglePin(airportId, chart.pdf_url);
	}

	function titleCase(s: string): string {
		return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<section
	aria-label={`${airportId}${roleLabel ? ` (${roleLabel})` : ''}`}
	class="rounded-lg border border-zinc-800/60 bg-zinc-900/85 shadow-lg backdrop-blur-md"
>
	<button
		type="button"
		aria-expanded={!collapsed}
		aria-label={collapsed ? `Expand ${airportId}` : `Collapse ${airportId}`}
		onclick={() => (collapsed = !collapsed)}
		class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-t-lg px-4 py-3 text-left transition-colors hover:bg-zinc-800/40"
	>
		<div class="flex min-w-0 items-baseline gap-2">
			<span class="font-mono text-sm font-semibold tracking-wider text-zinc-100">
				{airportId}
			</span>
			{#if airportName}
				<span class="truncate text-xs text-zinc-500">{titleCase(airportName)}</span>
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if href}
				<a
					{href}
					onclick={(e) => e.stopPropagation()}
					aria-label={`Open ${airportId} chart viewer`}
					class="cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase transition-colors hover:bg-zinc-800/60 hover:text-sky-300"
				>
					Open
				</a>
			{/if}
			{#if roleLabel}
				<span class="text-[10px] font-semibold tracking-[0.18em] text-sky-400 uppercase">
					{roleLabel}
				</span>
			{/if}
			<IconChevron
				class={`text-base text-zinc-500 transition-transform ${collapsed ? '-rotate-90' : ''}`}
			/>
		</div>
	</button>

	{#if collapsed}
		{#if effectivePins.length > 0}
			<div class="flex flex-wrap gap-1 border-t border-zinc-800/60 px-3 py-2">
				{#each effectivePins as chart (chart.pdf_url)}
					{@const isSelected =
						!!selected &&
						chart.chart_name === selected.chart_name &&
						chart.pdf_url === selected.pdf_url}
					<button
						type="button"
						aria-current={isSelected ? 'true' : undefined}
						onclick={() => onPick(chart)}
						class={[
							'cursor-pointer rounded px-2 py-0.5 text-[11px] tracking-wide transition-colors',
							isSelected
								? 'bg-sky-500/20 text-sky-100'
								: 'bg-zinc-800/60 text-zinc-300 hover:bg-sky-500/15 hover:text-sky-100'
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
							{#each chartsByGroup[group] as chart (chart.pdf_url)}
								{@const isSelected =
									!!selected &&
									chart.chart_name === selected.chart_name &&
									chart.pdf_url === selected.pdf_url}
								{@const pinned = isPinned(chart)}
								<li class="flex items-center gap-1">
									<button
										type="button"
										aria-current={isSelected ? 'true' : undefined}
										onclick={() => onPick(chart)}
										class={[
											'flex flex-1 cursor-pointer items-center gap-2 rounded px-2 py-1 text-left transition-colors',
											isSelected
												? 'bg-sky-500/15 text-sky-100'
												: 'text-zinc-200 hover:bg-zinc-800/70 hover:text-zinc-50'
										]}
									>
										<span class="truncate">{chart.chart_name}</span>
									</button>
									<button
										type="button"
										onclick={(e) => onTogglePin(chart, e)}
										aria-label={pinned ? `Unpin ${chart.chart_name}` : `Pin ${chart.chart_name}`}
										aria-pressed={pinned}
										class={[
											'shrink-0 cursor-pointer rounded p-1 transition-colors',
											pinned
												? 'text-sky-400 hover:bg-zinc-800/70 hover:text-sky-300'
												: 'text-zinc-600 hover:bg-zinc-800/70 hover:text-zinc-300'
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
