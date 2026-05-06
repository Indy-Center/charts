import type { AirportData } from './types';

const store = new Map<string, AirportData>();

export const airportCache = {
  get(id: string): AirportData | undefined {
    return store.get(id.toUpperCase());
  },
  set(data: AirportData): void {
    store.set(data.airport.faa_ident.toUpperCase(), data);
  },
  has(id: string): boolean {
    return store.has(id.toUpperCase());
  },
  clear(): void {
    store.clear();
  }
};
