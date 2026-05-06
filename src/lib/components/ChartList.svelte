<script lang="ts">
	import type { Chart, ChartsByGroup } from '$lib/types';
	import { CHART_GROUP_ORDER, CHART_GROUP_LABELS } from '$lib/types';

	let {
		byGroup,
		selectedPdfUrl,
		onPick
	}: {
		byGroup: ChartsByGroup;
		selectedPdfUrl: string | undefined;
		onPick: (chart: Chart) => void;
	} = $props();

	// Some airports list distinct chart names that share a single booklet PDF
	// (e.g. BOS' TAKEOFF MINIMUMS and DIVERSE VECTOR AREA both ne1to.pdf).
	// Show one row per PDF, keeping the first occurrence's name.
	const visibleByGroup = $derived.by(() => {
		const seen = new Set<string>();
		const out: ChartsByGroup = {
			airport_diagram: [],
			general: [],
			approach: [],
			departure: [],
			arrival: []
		};
		for (const g of CHART_GROUP_ORDER) {
			for (const c of byGroup[g]) {
				if (seen.has(c.pdf_url)) continue;
				seen.add(c.pdf_url);
				out[g].push(c);
			}
		}
		return out;
	});
</script>

<div class="flex max-h-[60vh] min-w-[240px] flex-col gap-3 overflow-y-auto pr-1 text-sm">
	{#each CHART_GROUP_ORDER as group (group)}
		{#if visibleByGroup[group].length > 0}
			<div>
				<h3 class="mb-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
					{CHART_GROUP_LABELS[group]}
				</h3>
				<ul class="flex flex-col gap-0.5">
					{#each visibleByGroup[group] as chart (chart.pdf_url)}
						{@const isSelected = chart.pdf_url === selectedPdfUrl}
						<li>
							<button
								type="button"
								aria-current={isSelected ? 'true' : undefined}
								onclick={() => onPick(chart)}
								class={[
									'flex w-full cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-left transition-colors',
									isSelected
										? 'bg-sky-500/15 text-sky-100'
										: 'text-zinc-200 hover:bg-zinc-800/70 hover:text-zinc-50'
								]}
							>
								<span class="truncate">{chart.chart_name}</span>
								{#if chart.did_change}
									<span
										aria-label="Changed this cycle"
										class="h-1.5 w-1.5 rounded-full bg-sky-500"
									></span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</div>
