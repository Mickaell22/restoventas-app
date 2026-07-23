import type { DateRange } from '../lib/date-range';
import { api } from './client';

export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
}

export interface StatsSummary {
  total: number;
  count: number;
  topProducts: TopProduct[];
}

export async function getSummary(range?: DateRange) {
  const { data } = await api.get<StatsSummary>('/stats/summary', {
    params: range,
  });
  return data;
}
