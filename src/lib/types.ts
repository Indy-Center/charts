export type ChartGroup =
  | 'airport_diagram'
  | 'general'
  | 'departure'
  | 'arrival'
  | 'approach';

export const CHART_GROUP_ORDER: ChartGroup[] = [
  'airport_diagram',
  'general',
  'approach',
  'departure',
  'arrival'
];

export const CHART_GROUP_LABELS: Record<ChartGroup, string> = {
  airport_diagram: 'Airport Diagram',
  general: 'General',
  approach: 'Approaches',
  departure: 'Departures',
  arrival: 'Arrivals'
};

export interface Chart {
  chart_name: string;
  chart_sequence: string;
  pdf_name: string;
  pdf_url: string;
  did_change: boolean;
}

export interface AirportInfo {
  city?: string;
  state_abbr?: string;
  state_full?: string;
  country: string;
  icao_ident?: string;
  faa_ident: string;
  airport_name?: string;
  is_military: boolean;
}

export type ChartsByGroup = Record<ChartGroup, Chart[]>;

export interface AirportData {
  airport: AirportInfo;
  chartsByGroup: ChartsByGroup;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: 0 | 90 | 180 | 270;
  invert: boolean;
  page: number;
}

export const DEFAULT_VIEW_STATE: ViewState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  invert: true,
  page: 1
};
