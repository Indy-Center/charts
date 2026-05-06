<script lang="ts">
	import { getDocument, loadPdfDocument, type DocCache, type DocLoader } from '$lib/pdf';
	import type { ViewState } from '$lib/types';

	let {
		pdfUrl,
		airportIdent,
		chartName,
		view,
		onChange,
		onPageInfo,
		docCache,
		loader = loadPdfDocument
	}: {
		pdfUrl: string;
		airportIdent: string;
		chartName: string;
		view: ViewState;
		onChange: (next: ViewState) => void;
		onPageInfo: (info: { current: number; total: number }) => void;
		docCache: DocCache;
		loader?: DocLoader;
	} = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();
	let error = $state<string | null>(null);
	let loading = $state(true);

	let renderToken = 0;

	const SMART_PAGE_PATTERNS = /TAKEOFF|ALTERNATE|MINIMUMS/i;

	function shouldSmartDetect(name: string): boolean {
		return SMART_PAGE_PATTERNS.test(name);
	}

	const detectedPageByUrl = new Map<string, number>();

	async function detectPage(
		doc: import('pdfjs-dist').PDFDocumentProxy,
		ident: string,
		url: string
	): Promise<number> {
		const cached = detectedPageByUrl.get(url);
		if (cached) return cached;
		const target = ident.toUpperCase();
		for (let p = 1; p <= doc.numPages; p++) {
			const page = await doc.getPage(p);
			const text = await page.getTextContent();
			const flat = text.items
				.map((i) => ('str' in i ? (i as { str: string }).str : ''))
				.join(' ')
				.toUpperCase();
			if (flat.includes(target)) {
				detectedPageByUrl.set(url, p);
				return p;
			}
		}
		detectedPageByUrl.set(url, 1);
		return 1;
	}

	function patch(p: Partial<ViewState>) {
		onChange({ ...view, ...p });
	}

	async function renderNow() {
		if (!canvasEl) return;
		const myToken = ++renderToken;
		error = null;
		loading = true;
		try {
			const doc = await getDocument(pdfUrl, docCache, loader);
			if (myToken !== renderToken) return;

			let pageToRender = view.page;
			if (doc.numPages > 1 && shouldSmartDetect(chartName) && airportIdent) {
				pageToRender = await detectPage(doc, airportIdent, pdfUrl);
				if (myToken !== renderToken) return;
			}

			onPageInfo({ current: pageToRender, total: doc.numPages });
			const page = await doc.getPage(pageToRender);
			if (myToken !== renderToken) return;
			const baseViewport = page.getViewport({ scale: 1 });
			const containerW = containerEl?.clientWidth ?? window.innerWidth;
			const containerH = containerEl?.clientHeight ?? window.innerHeight;
			const fitScale = Math.min(
				containerW / baseViewport.width,
				containerH / baseViewport.height
			);
			const scale = fitScale * view.zoom;
			const viewport = page.getViewport({ scale, rotation: view.rotation });
			canvasEl.width = Math.ceil(viewport.width);
			canvasEl.height = Math.ceil(viewport.height);
			const ctx = canvasEl.getContext('2d');
			if (!ctx) throw new Error('2d context unavailable');
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
			await page.render({ canvas: canvasEl, canvasContext: ctx, viewport }).promise;
			if (myToken !== renderToken) return;
			if (view.invert) applyInvert(ctx, canvasEl.width, canvasEl.height);
			loading = false;
		} catch (err) {
			if (myToken !== renderToken) return;
			console.error('chart render failed', pdfUrl, err);
			error = "Couldn't load this chart";
			loading = false;
		}
	}

	function applyInvert(ctx: CanvasRenderingContext2D, w: number, h: number) {
		const img = ctx.getImageData(0, 0, w, h);
		const data = img.data;
		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
		}
		ctx.putImageData(img, 0, 0);
	}

	// Re-render when inputs change.
	$effect(() => {
		void pdfUrl;
		void view.zoom;
		void view.rotation;
		void view.invert;
		void view.page;
		if (canvasEl) renderNow();
	});

	// Wheel = zoom.
	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
		patch({ zoom: clamp(view.zoom * factor, 1, 4) });
	}

	// Drag = pan.
	let dragging = false;
	let dragStartX = 0;
	let dragStartY = 0;
	let dragOriginPanX = 0;
	let dragOriginPanY = 0;

	function onMouseDown(e: MouseEvent) {
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragOriginPanX = view.panX;
		dragOriginPanY = view.panY;
	}
	function onMouseMove(e: MouseEvent) {
		if (!dragging) return;
		patch({
			panX: dragOriginPanX + (e.clientX - dragStartX),
			panY: dragOriginPanY + (e.clientY - dragStartY)
		});
	}
	function onMouseUp() {
		dragging = false;
	}
	function onDblClick() {
		patch({ zoom: clamp(view.zoom * 1.5, 1, 4) });
	}

	function clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	function retry() {
		docCache.delete(pdfUrl);
		renderNow();
	}
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div
	bind:this={containerEl}
	class="absolute inset-0 flex items-center justify-center overflow-hidden"
	onwheel={onWheel}
	onmousedown={onMouseDown}
	ondblclick={onDblClick}
	role="presentation"
>
	<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
	<canvas
		bind:this={canvasEl}
		role="img"
		aria-label="Chart"
		style:transform={`translate(${view.panX}px, ${view.panY}px)`}
		class="select-none"
	></canvas>
	{#if loading && !error}
		<div
			class="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/85 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md"
		>
			loading…
		</div>
	{/if}
	{#if error}
		<div
			class="rounded-lg border border-zinc-800 bg-zinc-900/95 p-4 text-center backdrop-blur-md"
		>
			<p class="text-sm text-zinc-200">{error}</p>
			<button
				type="button"
				onclick={retry}
				class="mt-2 rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500"
			>
				Retry
			</button>
		</div>
	{/if}
</div>
