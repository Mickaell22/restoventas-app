import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { listProducts, type Product } from '../api/products.api';
import { createSale, type PaymentMethod } from '../api/sales.api';
import { computeTotal, totalUnits } from '../store/cart.logic';
import { useCartStore } from '../store/cart.store';

function formatPrice(n: number) {
  return `$ ${n.toFixed(2)}`;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transfer.' },
  { value: 'other', label: 'Otro' },
];

export default function NewSaleScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);

  const items = useCartStore((s) => s.items);
  const add = useCartStore((s) => s.add);
  const changeQty = useCartStore((s) => s.changeQty);
  const clear = useCartStore((s) => s.clear);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Solo productos activos: los inactivos no se venden.
      const all = await listProducts();
      setProducts(all.filter((p) => p.active));
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  // qty en carrito por productId, para el badge de cada producto.
  const qtyById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of items) map[i.product.id] = i.qty;
    return map;
  }, [items]);

  const total = computeTotal(items);
  const units = totalUnits(items);

  async function onRegister() {
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const sale = await createSale({
        items: items.map((i) => ({ productId: i.product.id, qty: i.qty })),
        paymentMethod: payment,
      });
      clear();
      setPayment('cash');
      Alert.alert('Venta registrada', `Total: ${formatPrice(sale.total)}`);
    } catch (e) {
      const msg =
        (e as AxiosError<{ message?: string | string[] }>)?.response?.data
          ?.message ?? 'No se pudo registrar la venta. Revisa la conexión.';
      Alert.alert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmClear() {
    Alert.alert('Vaciar carrito', '¿Quitar todos los ítems?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: () => clear() },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar producto"
        accessibilityLabel="Buscar producto"
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />

      <FlatList
        style={styles.productList}
        data={filtered}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={filtered.length === 0 && styles.emptyList}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyHint}>
              {products.length === 0
                ? 'No hay productos activos. Crea alguno en la pestaña Productos.'
                : 'Sin resultados para la búsqueda.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const inCart = qtyById[item.id] ?? 0;
          return (
            <TouchableOpacity
              style={styles.product}
              onPress={() => add(item)}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${item.name}`}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
              </View>
              {inCart > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{inCart}</Text>
                </View>
              ) : (
                <Text style={styles.addHint}>+</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.cart}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>
            Carrito{units > 0 ? ` · ${units}` : ''}
          </Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={confirmClear} accessibilityRole="button">
              <Text style={styles.clearText}>Vaciar</Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          <Text style={styles.cartEmpty}>
            Toca un producto para agregarlo a la venta.
          </Text>
        ) : (
          <FlatList
            style={styles.cartList}
            data={items}
            keyExtractor={(i) => i.product.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.cartRow}>
                <View style={styles.cartRowInfo}>
                  <Text style={styles.cartRowName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.cartRowMeta}>
                    {formatPrice(item.product.price)} · {formatPrice(item.product.price * item.qty)}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => changeQty(item.product.id, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar uno de ${item.product.name}`}
                  >
                    <Text style={styles.stepText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepQty}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => changeQty(item.product.id, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar uno de ${item.product.name}`}
                  >
                    <Text style={styles.stepText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        <View style={styles.payments}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.payChip, payment === m.value && styles.payChipSelected]}
              onPress={() => setPayment(m.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: payment === m.value }}
            >
              <Text
                style={[
                  styles.payChipText,
                  payment === m.value && styles.payChipTextSelected,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.registerBtn,
            (items.length === 0 || submitting) && styles.registerDisabled,
          ]}
          onPress={onRegister}
          disabled={items.length === 0 || submitting}
          accessibilityRole="button"
          accessibilityLabel="Registrar venta"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerText}>Registrar venta</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyList: { flexGrow: 1 },
  emptyHint: { fontSize: 14, color: '#71717a', textAlign: 'center' },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ea580c',
  },
  retryText: { color: '#fff', fontWeight: '600' },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  productList: { flex: 1, marginTop: 8 },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: '#18181b' },
  productPrice: { fontSize: 13, color: '#71717a', marginTop: 2 },
  addHint: { fontSize: 22, color: '#ea580c', fontWeight: '400', width: 28, textAlign: 'center' },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cart: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartTitle: { fontSize: 16, fontWeight: '700', color: '#18181b' },
  clearText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  cartEmpty: { fontSize: 14, color: '#a1a1aa', paddingVertical: 8 },
  cartList: { maxHeight: 200 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  cartRowInfo: { flex: 1 },
  cartRowName: { fontSize: 15, fontWeight: '600', color: '#18181b' },
  cartRowMeta: { fontSize: 13, color: '#71717a', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, color: '#ea580c', fontWeight: '600', lineHeight: 22 },
  stepQty: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#18181b' },
  payments: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  payChip: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  payChipSelected: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  payChipText: { color: '#52525b', fontSize: 13 },
  payChipTextSelected: { color: '#fff', fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalLabel: { fontSize: 16, color: '#52525b' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#18181b' },
  registerBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  registerDisabled: { opacity: 0.5 },
  registerText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
