import type { DateRange } from '../lib/date-range';
import { api } from './client';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  // Solo viene en el detalle (GET /sales/:id); en el listado no se carga.
  product?: { id: string; name: string };
}

export interface Sale {
  id: string;
  createdAt: string;
  total: number;
  paymentMethod: PaymentMethod;
  userId: string;
  items: SaleItem[];
}

export interface CreateSaleInput {
  items: { productId: string; qty: number }[];
  paymentMethod?: PaymentMethod;
}

export async function createSale(input: CreateSaleInput) {
  const { data } = await api.post<Sale>('/sales', input);
  return data;
}

export async function listSales(range?: DateRange) {
  const { data } = await api.get<Sale[]>('/sales', { params: range });
  return data;
}

export async function getSale(id: string) {
  const { data } = await api.get<Sale>(`/sales/${id}`);
  return data;
}
