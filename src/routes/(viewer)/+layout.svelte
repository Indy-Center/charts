<!-- src/routes/(viewer)/+layout.svelte -->
<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col">
	{@render children()}
</div>
