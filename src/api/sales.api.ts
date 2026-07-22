import { api } from './client';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
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
