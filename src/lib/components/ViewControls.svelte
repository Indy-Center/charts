<script lang="ts">
	import type { ViewState } from '$lib/types';

	let {
		view,
		onChange
	}: {
		view: ViewState;
		onChange: (next: ViewState) => void;
	} = $props();

	const ROTATIONS: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];

	function patch(p: Partial<ViewState>) {
		onChange({ ...view, ...p });
	}

	function zoomIn() {
		patch({ zoom: Math.min(4, +(view.zoom * 1.25).toFixed(3)) });
	}
	function zoomOut() {
		patch({ zoom: Math.max(0.5, +(view.zoom * 0.8).toFixed(3)) });
	}
	function rotate() {
		const i = ROTATIONS.indexOf(view.rotation);
		patch({ rotation: ROTATIONS[(i + 1) % 4] });
	}
	function toggleInvert() {
		patch({ invert: !view.invert });
	}
</script>

<div class="flex items-center gap-1 text-zinc-200">
	<button
		type="button"
		aria-label="Zoom out"
		class="rounded px-2 py-1 hover:bg-zinc-800/70"
		onclick={zoomOut}
	>
		−
	</button>
	<span class="min-w-[3.5rem] text-center text-xs tabular-nums text-zinc-400">
		{Math.round(view.zoom * 100)}%
	</span>
	<button
		type="button"
		aria-label="Zoom in"
		class="rounded px-2 py-1 hover:bg-zinc-800/70"
		onclick={zoomIn}
	>
		+
	</button>
	<button
		type="button"
		aria-label="Rotate 90 degrees"
		class="rounded px-2 py-1 hover:bg-zinc-800/70"
		onclick={rotate}
	>
		⟳
	</button>
	<button
		type="button"
		aria-label="Invert colors"
		aria-pressed={view.invert}
		class={['rounded px-2 py-1 hover:bg-zinc-800/70', view.invert && 'text-sky-400']}
		onclick={toggleInvert}
	>
		◐
	</button>
</div>
