// Self-check de la logica del carrito, sin framework. Correr con:
//   npx tsx src/store/cart.logic.test.ts
import assert from 'node:assert/strict';
import type { Product } from '../api/products.api';
import {
  addItem,
  changeQty,
  computeTotal,
  removeItem,
  totalUnits,
  type CartItem,
} from './cart.logic';

const p = (id: string, price: number): Product => ({
  id,
  name: `prod-${id}`,
  price,
  active: true,
  categoryId: null,
  category: null,
});

const burger = p('a', 5);
const cola = p('b', 1.5);

// addItem crea y luego incrementa sin duplicar
let items: CartItem[] = [];
items = addItem(items, burger);
items = addItem(items, burger);
items = addItem(items, cola);
assert.equal(items.length, 2, 'no debe duplicar el mismo producto');
assert.equal(items[0].qty, 2, 'segundo add incrementa qty');

// no muta el array original (inmutabilidad para Zustand/React)
const before = addItem([], burger);
const after = addItem(before, burger);
assert.notEqual(before, after, 'debe devolver un array nuevo');
assert.equal(before[0].qty, 1, 'no debe mutar el array previo');

// total con redondeo a 2 decimales: 5*2 + 1.5*1 = 11.5
assert.equal(computeTotal(items), 11.5, 'total incorrecto');
assert.equal(totalUnits(items), 3, 'unidades incorrectas');

// changeQty resta y elimina al llegar a 0
items = changeQty(items, 'b', -1);
assert.equal(
  items.some((i) => i.product.id === 'b'),
  false,
  'qty 0 debe eliminar el item',
);
items = changeQty(items, 'a', 3);
assert.equal(items[0].qty, 5, 'delta positivo suma');

// removeItem quita el producto indicado
items = removeItem(items, 'a');
assert.equal(items.length, 0, 'removeItem debe vaciar el carrito');

// redondeo de flotantes: 0.1*3 = 0.30000000000000004 -> 0.3
assert.equal(computeTotal([{ product: p('c', 0.1), qty: 3 }]), 0.3);

console.log('OK cart.logic');
