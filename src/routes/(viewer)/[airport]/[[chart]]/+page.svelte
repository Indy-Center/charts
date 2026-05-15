<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate, replaceState } from '$app/navigation';
	import ChartViewer from '$lib/components/ChartViewer.svelte';
	import { displayForm } from '$lib/airport-id';
	import { chartToSlug } from '$lib/slug';

	let { data } = $props();

	let showSlugError = $state(false);
	let slugErrorTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (data.slugError) {
			showSlugError = true;
			if (slugErrorTimer) clearTimeout(slugErrorTimer);
			slugErrorTimer = setTimeout(() => {
				showSlugError = false;
			}, 4000);
		}
		return () => {
			if (slugErrorTimer) clearTimeout(slugErrorTimer);
		};
	});

	// Canonicalize URL after each navigation settles.
	// - airport segment is lowercased
	// - if no slug was in the URL, leave it bare (don't auto-append default chart's slug)
	// - if the slug 404'd, drop it (default chart is rendering, toast tells the user)
	// - if the slug resolved, normalize to its canonical form
	//
	// The setTimeout defers past initial hydration: replaceState() throws
	// "router not initialized" when called synchronously inside the very first
	// afterNavigate callback (during _hydrate).
	afterNavigate(() => {
		setTimeout(() => {
			const expectedAirport = data.airport.airport.faa_ident.toLowerCase();
			const slugProvided = !!page.params.chart;
			const hadSlugError = !!data.slugError;

			let wantPath: string;
			if (!slugProvided || hadSlugError || !data.selected) {
				wantPath = `/${expectedAirport}`;
			} else {
				wantPath = `/${expectedAirport}/${chartToSlug(data.selected.chart_name)}`;
			}

			if (page.url.pathname !== wantPath) {
				replaceState(wantPath, page.state);
			}
		}, 0);
	});

	let pageTitle = $derived.by(() => {
		const id = displayForm(data.airport.airport.faa_ident, data.airport.airport.icao_ident);
		return data.selected ? `${id} — ${data.selected.chart_name}` : id;
	});
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<ChartViewer airport={data.airport} selected={data.selected} pinboard={data.pinboard} />

{#if data.slugError && showSlugError}
	<div
		class="pointer-events-none fixed bottom-3 left-3 rounded border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md"
		role="status"
	>
		Couldn't find chart "{data.slugError}".
	</div>
{/if}
