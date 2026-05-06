<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { replaceState } from '$app/navigation';
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

  // Canonicalize URL airport segment to lowercase FAA form once on mount.
  onMount(() => {
    const expected = data.airport.airport.faa_ident.toLowerCase();
    const current = (page.params.airport ?? '').toLowerCase();
    if (current !== expected) {
      const tail = data.selected ? `/${chartToSlug(data.selected.chart_name)}` : '';
      replaceState(`/${expected}${tail}`, page.state);
    }
  });

  // If a slug was provided but didn't resolve, drop it from the URL —
  // the default chart is already rendering, the toast tells the user why.
  $effect(() => {
    if (data.slugError) {
      const expected = data.airport.airport.faa_ident.toLowerCase();
      replaceState(`/${expected}`, page.state);
    }
  });

  let pageTitle = $derived.by(() => {
    const id = displayForm(data.airport.airport.faa_ident, data.airport.airport.icao_ident);
    return data.selected ? `${id} — ${data.selected.chart_name}` : id;
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

{#key data.airport.airport.faa_ident}
  <ChartViewer airport={data.airport} selected={data.selected} />
{/key}

{#if data.slugError && showSlugError}
  <div
    class="pointer-events-none fixed bottom-3 left-3 rounded border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md"
    role="status"
  >
    Couldn't find chart "{data.slugError}".
  </div>
{/if}
