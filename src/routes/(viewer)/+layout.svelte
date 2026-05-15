<!-- src/routes/(viewer)/+layout.svelte -->
<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

<Header user={data.session?.user ?? null} currentPath={page.url.pathname} />
<div class="flex min-h-0 flex-1 flex-col">
	{@render children()}
</div>
