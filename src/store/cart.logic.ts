import type { Product } from '../api/products.api';

export interface CartItem {
  product: Product;
  qty: number;
}

/** Agrega +1 (o crea) el producto en el carrito. Devuelve un array nuevo. */
export function addItem(items: CartItem[], product: Product): CartItem[] {
  const exists = items.some((i) => i.product.id === product.id);
  if (exists) {
    return items.map((i) =>
      i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i,
    );
  }
  return [...items, { product, qty: 1 }];
}

/** Suma `delta` a la cantidad; si queda <= 0, elimina el item. */
export function changeQty(
  items: CartItem[],
  productId: string,
  delta: number,
): CartItem[] {
  return items
    .map((i) => (i.product.id === productId ? { ...i, qty: i.qty + delta } : i))
    .filter((i) => i.qty > 0);
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.product.id !== productId);
}

/**
 * Total de referencia para mostrar en el cliente. El monto autoritativo lo
 * recalcula el backend con los precios de la BD (no confia en el cliente).
 */
export function computeTotal(items: CartItem[]): number {
  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  return Math.round(total * 100) / 100;
}

/** Cantidad total de unidades en el carrito (para el badge). */
export function totalUnits(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}
