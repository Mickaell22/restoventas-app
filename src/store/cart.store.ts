import { create } from 'zustand';
import type { Product } from '../api/products.api';
import { addItem, changeQty, removeItem, type CartItem } from './cart.logic';

interface CartState {
  items: CartItem[];
  add: (product: Product) => void;
  changeQty: (productId: string, delta: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (product) => set((s) => ({ items: addItem(s.items, product) })),
  changeQty: (productId, delta) =>
    set((s) => ({ items: changeQty(s.items, productId, delta) })),
  remove: (productId) => set((s) => ({ items: removeItem(s.items, productId) })),
  clear: () => set({ items: [] }),
}));
