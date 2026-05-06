import { describe, it, expect } from 'vitest';
import { chartToSlug, resolveSlug, pickDefaultChart } from '$lib/slug';
import type { Chart, ChartsByGroup } from '$lib/types';

const ils05L: Chart = {
  chart_name: 'ILS OR LOC RWY 05L',
  chart_sequence: '50750',
  pdf_name: 'a.pdf',
  pdf_url: 'https://example/a.pdf',
  did_change: false
};
const giibs: Chart = {
  chart_name: 'GIIBS FOUR (RNAV)',
  chart_sequence: '30000',
  pdf_name: 'b.pdf',
  pdf_url: 'https://example/b.pdf',
  did_change: false
};
const apd: Chart = {
  chart_name: 'AIRPORT DIAGRAM',
  chart_sequence: '70000',
  pdf_name: 'c.pdf',
  pdf_url: 'https://example/c.pdf',
  did_change: false
};

describe('chartToSlug', () => {
  it.each([
    ['ILS OR LOC RWY 05L', 'ils-or-loc-rwy-05l'],
    ['GIIBS FOUR (RNAV)', 'giibs-four-rnav'],
    ['ILS Y RWY 23R', 'ils-y-rwy-23r'],
    ['ILS/DME RWY 14', 'ils-dme-rwy-14'],
    ['  multiple   spaces  ', 'multiple-spaces']
  ])('%s -> %s', (input, expected) => {
    expect(chartToSlug(input)).toBe(expected);
  });
});

describe('resolveSlug', () => {
  const charts: Chart[] = [ils05L, giibs, apd];

  it('finds exact slug match', () => {
    expect(resolveSlug('ils-or-loc-rwy-05l', charts)).toBe(ils05L);
  });

  it('finds case-insensitive match', () => {
    expect(resolveSlug('ILS-OR-LOC-RWY-05L', charts)).toBe(ils05L);
  });

  it('returns null on no match', () => {
    expect(resolveSlug('does-not-exist', charts)).toBeNull();
  });
});

describe('pickDefaultChart', () => {
  const apdGroup: ChartsByGroup = {
    airport_diagram: [apd],
    general: [],
    approach: [ils05L],
    departure: [],
    arrival: []
  };
  const noApd: ChartsByGroup = {
    airport_diagram: [],
    general: [],
    approach: [ils05L],
    departure: [],
    arrival: []
  };
  const empty: ChartsByGroup = {
    airport_diagram: [],
    general: [],
    approach: [],
    departure: [],
    arrival: []
  };

  it('picks airport diagram when present', () => {
    expect(pickDefaultChart(apdGroup)).toBe(apd);
  });

  it('falls back to first approach when no diagram', () => {
    expect(pickDefaultChart(noApd)).toBe(ils05L);
  });

  it('returns null on empty airport', () => {
    expect(pickDefaultChart(empty)).toBeNull();
  });
});
