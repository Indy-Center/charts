import { z } from 'zod';
import type { AirportData, Chart, ChartsByGroup } from '$lib/types';

const ChartSchema = z.object({
	chart_name: z.string(),
	chart_sequence: z.string(),
	pdf_name: z.string(),
	pdf_url: z.string().url(),
	did_change: z.boolean()
});

const AirportInfoSchema = z.object({
	city: z.string().optional(),
	state_abbr: z.string().optional(),
	state_full: z.string().optional(),
	country: z.string(),
	icao_ident: z.string().optional(),
	faa_ident: z.string(),
	airport_name: z.string().optional(),
	is_military: z.boolean()
});

const ChartsSchema = z.object({
	airport_diagram: z.array(ChartSchema).default([]),
	general: z.array(ChartSchema).default([]),
	departure: z.array(ChartSchema).default([]),
	arrival: z.array(ChartSchema).default([]),
	approach: z.array(ChartSchema).default([])
});

const ResponseSchema = z.object({
	airport_data: AirportInfoSchema,
	charts: ChartsSchema
});

export type AviationApiErrorKind = 'upstream_unavailable' | 'upstream_shape_mismatch';

export class AviationApiError extends Error {
	constructor(
		public kind: AviationApiErrorKind,
		message: string,
		public cause?: unknown
	) {
		super(message);
		this.name = 'AviationApiError';
	}
}

const BASE = 'https://api-v2.aviationapi.com/v2/charts';

export async function fetchCharts(
	apiId: string,
	fetchImpl: typeof fetch = fetch
): Promise<AirportData> {
	let resp: Response;
	try {
		resp = await fetchImpl(`${BASE}?airport=${encodeURIComponent(apiId)}`, {
			headers: { accept: 'application/json' }
		});
	} catch (err) {
		throw new AviationApiError('upstream_unavailable', `network error fetching ${apiId}`, err);
	}

	if (!resp.ok) {
		throw new AviationApiError(
			'upstream_unavailable',
			`upstream returned ${resp.status} for ${apiId}`
		);
	}

	let raw: unknown;
	try {
		raw = await resp.json();
	} catch (err) {
		throw new AviationApiError('upstream_shape_mismatch', `non-json body for ${apiId}`, err);
	}

	const parsed = ResponseSchema.safeParse(raw);
	if (!parsed.success) {
		throw new AviationApiError(
			'upstream_shape_mismatch',
			`validation failed for ${apiId}: ${parsed.error.message}`,
			parsed.error
		);
	}

	const chartsByGroup: ChartsByGroup = {
		airport_diagram: parsed.data.charts.airport_diagram as Chart[],
		general: parsed.data.charts.general as Chart[],
		departure: parsed.data.charts.departure as Chart[],
		arrival: parsed.data.charts.arrival as Chart[],
		approach: parsed.data.charts.approach as Chart[]
	};

	return {
		airport: parsed.data.airport_data,
		chartsByGroup
	};
}
