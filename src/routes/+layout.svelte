<script lang="ts">
  import '../app.css';
  let { children } = $props();

  function onKeydown(e: KeyboardEvent) {
    const isInput =
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable);
    const isShortcut = (e.key === '/' && !isInput) || (e.key === 'k' && (e.metaKey || e.ctrlKey));
    if (!isShortcut) return;
    const search = document.querySelector<HTMLInputElement>('[role="combobox"]');
    if (!search) return;
    e.preventDefault();
    search.focus();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{@render children()}
