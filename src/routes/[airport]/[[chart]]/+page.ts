import type { PageLoad } from './$types';
import { CHART_GROUP_ORDER } from '$lib/types';
import { resolveSlug, pickDefaultChart } from '$lib/slug';

export const load: PageLoad = async ({ params, parent }) => {
  const { airport } = await parent();
  const allCharts = CHART_GROUP_ORDER.flatMap((g) => airport.chartsByGroup[g]);

  if (!params.chart) {
    return {
      selected: pickDefaultChart(airport.chartsByGroup),
      slugError: null as string | null
    };
  }

  const found = resolveSlug(params.chart, allCharts);
  if (found) return { selected: found, slugError: null };

  return {
    selected: pickDefaultChart(airport.chartsByGroup),
    slugError: params.chart
  };
};
