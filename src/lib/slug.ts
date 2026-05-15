import type { Chart, ChartsByGroup } from './types';
import { CHART_GROUP_ORDER } from './types';

export function chartToSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
}

export function resolveSlug(slug: string, charts: Chart[]): Chart | null {
	const normalized = slug.toLowerCase();
	for (const chart of charts) {
		if (chartToSlug(chart.chart_name) === normalized) return chart;
	}
	return null;
}

export function pickDefaultChart(byGroup: ChartsByGroup): Chart | null {
	for (const group of CHART_GROUP_ORDER) {
		const list = byGroup[group];
		if (list && list.length > 0) return list[0];
	}
	return null;
}
