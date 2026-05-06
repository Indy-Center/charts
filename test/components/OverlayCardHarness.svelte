<script lang="ts">
	import OverlayCard from '$lib/components/OverlayCard.svelte';
	let { title = 'Title', body = '', defaultCollapsed = false } = $props();
</script>

<OverlayCard {title} {defaultCollapsed}>
	{#snippet icon()}<span aria-hidden="true">i</span>{/snippet}
	{body}
</OverlayCard>
