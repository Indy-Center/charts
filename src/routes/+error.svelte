<script lang="ts">
  import { page } from '$app/state';
</script>

<main class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
  <h1 class="text-3xl font-semibold tracking-tight text-zinc-100">{page.status}</h1>
  <p class="text-sm text-zinc-400">{page.error?.message ?? 'Something went wrong.'}</p>
  <div class="flex gap-3">
    <a href="/" class="rounded border border-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:border-sky-600 hover:text-sky-300">
      Home
    </a>
    {#if page.status >= 500}
      <button
        type="button"
        onclick={() => location.reload()}
        class="rounded bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-500"
      >
        Retry
      </button>
    {/if}
  </div>
</main>
