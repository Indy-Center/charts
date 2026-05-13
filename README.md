# charts

SvelteKit app deployed to `charts.flyindycenter.com`. Displays FAA terminal procedure charts for the current AIRAC cycle. Airport search with autocomplete, grouped chart list (airport diagram, general, departure, arrival, approach), and an in-browser PDF viewer. Chart data comes from AviationAPI v2.

[![Build and Deploy](https://github.com/Indy-Center/charts/actions/workflows/build-and-deploy.yml/badge.svg)](https://github.com/Indy-Center/charts/actions/workflows/build-and-deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Project layout

- `src/routes/+page.svelte` — landing page; airport search and common-airports grid.
- `src/routes/[airport]/` — airport page; fetches and groups charts for a given identifier.
- `src/routes/[airport]/[chart]/` — PDF viewer for a single chart.
- `src/routes/api/` — server routes backing the airport search autocomplete.
- `src/lib/server/aviationapi.ts` — typed AviationAPI v2 client with Zod validation.
- `src/lib/server/identity.ts` — identity RPC stub (unused in v1; wired in for future auth integration).
- `src/lib/airports.ts` — common airports list and airport metadata helpers.
- `src/lib/airport-cache.ts` — in-memory cache for AviationAPI responses.
- `src/lib/pdf.ts` — PDF.js rendering logic.
- `src/lib/viewer-cache.ts` — parsed PDF and per-chart view state cache across navigations.
- `src/lib/slug.ts` — chart name ↔ URL slug conversion.

## Local development

```bash
npm install
npm run dev     # http://localhost:5173
```

No secrets required for v1 — all chart data is fetched from the public AviationAPI endpoint at runtime. The `IDENTITY` service binding is declared in `wrangler.jsonc` but not called.

## Deployment

Pushing to `main` triggers `.github/workflows/build-and-deploy.yml`. Manual deploy:

```bash
npm run build && wrangler deploy
```

Requires a `CLOUDFLARE_WORKERS_API_KEY` repository secret with `Workers Scripts:Edit` permissions. Deploys to `charts.flyindycenter.com` via the custom domain route in `wrangler.jsonc`.

## Disclaimer

We are not affiliated with the FAA or any aviation governing body. This software is for flight simulation use on the [VATSIM](https://www.vatsim.net) network.
