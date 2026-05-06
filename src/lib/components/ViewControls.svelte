<script lang="ts">
	import IconZoomOut from '~icons/mdi/magnify-minus-outline';
	import IconZoomIn from '~icons/mdi/magnify-plus-outline';
	import IconRotate from '~icons/mdi/rotate-right';
	import IconInvert from '~icons/mdi/invert-colors';
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
		patch({ zoom: Math.max(1, +(view.zoom * 0.8).toFixed(3)) });
	}
	function rotate() {
		const i = ROTATIONS.indexOf(view.rotation);
		patch({ rotation: ROTATIONS[(i + 1) % 4] });
	}
	function toggleInvert() {
		patch({ invert: !view.invert });
	}
</script>

<div
	class="flex items-center gap-0.5 rounded-lg border border-zinc-800/60 bg-zinc-900/85 p-1 text-zinc-300 backdrop-blur-md"
>
	<button
		type="button"
		aria-label="Zoom out"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
		onclick={zoomOut}
	>
		<IconZoomOut />
	</button>
	<button
		type="button"
		aria-label="Zoom in"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
		onclick={zoomIn}
	>
		<IconZoomIn />
	</button>
	<button
		type="button"
		aria-label="Rotate 90 degrees"
		class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
		onclick={rotate}
	>
		<IconRotate />
	</button>
	<button
		type="button"
		aria-label="Invert colors"
		aria-pressed={view.invert}
		class={[
			'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-800/70 hover:text-zinc-100',
			view.invert && 'text-sky-400 hover:text-sky-300'
		]}
		onclick={toggleInvert}
	>
		<IconInvert />
	</button>
</div>
