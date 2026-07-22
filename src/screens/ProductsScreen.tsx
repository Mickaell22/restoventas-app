import { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  updateProduct,
  type Category,
  type Product,
} from '../api/products.api';

function formatPrice(n: number) {
  return `$ ${n.toFixed(2)}`;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        listProducts(),
        listCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setModalOpen(true);
  }

  function onSaved() {
    setModalOpen(false);
    void load();
  }

  function confirmDelete(product: Product) {
    Alert.alert(
      'Eliminar producto',
      `¿Eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              void load();
            } catch (e) {
              const msg =
                (e as AxiosError<{ message?: string }>)?.response?.data
                  ?.message ?? 'No se pudo eliminar el producto.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
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
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={products.length === 0 && styles.emptyList}
        onRefresh={() => void load(true)}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Sin productos</Text>
            <Text style={styles.emptyHint}>
              Toca el botón + para crear el primero.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>
                {item.name}
                {!item.active && <Text style={styles.inactive}> · inactivo</Text>}
              </Text>
              <Text style={styles.rowMeta}>
                {formatPrice(item.price)}
                {item.category ? ` · ${item.category.name}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => openEdit(item)}
            >
              <Text style={styles.iconEdit}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => confirmDelete(item)}
            >
              <Text style={styles.iconDelete}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ProductFormModal
        visible={modalOpen}
        product={editing}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={onSaved}
      />
    </View>
  );
}

interface FormProps {
  visible: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductFormModal({
  visible,
  product,
  categories,
  onClose,
  onSaved,
}: FormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reinicia el formulario cada vez que se abre (crear vs editar).
  useEffect(() => {
    if (!visible) return;
    setName(product?.name ?? '');
    setPrice(product ? String(product.price) : '');
    setCategoryId(product?.categoryId ?? null);
    setActive(product?.active ?? true);
    setFormError(null);
  }, [visible, product]);

  async function onSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    const parsedPrice = Number(price.replace(',', '.'));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setFormError('El precio debe ser un número mayor a 0.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: trimmed,
        price: Math.round(parsedPrice * 100) / 100,
        categoryId,
        active,
      };
      if (product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      onSaved();
    } catch (e) {
      const msg =
        (e as AxiosError<{ message?: string | string[] }>)?.response?.data
          ?.message ?? 'No se pudo guardar. Revisa la conexión.';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {product ? 'Editar producto' : 'Nuevo producto'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            editable={!saving}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            editable={!saving}
          />

          {categories.length > 0 && (
            <View style={styles.chips}>
              <Chip
                label="Sin categoría"
                selected={categoryId === null}
                onPress={() => setCategoryId(null)}
              />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  selected={categoryId === c.id}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Activo</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              disabled={saving}
              trackColor={{ true: '#ea580c' }}
            />
          </View>

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={onSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#18181b' },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '600', color: '#18181b' },
  rowMeta: { fontSize: 13, color: '#71717a', marginTop: 2 },
  inactive: { color: '#a1a1aa', fontWeight: '400' },
  iconBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  iconEdit: { color: '#ea580c', fontWeight: '600', fontSize: 13 },
  iconDelete: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 30, lineHeight: 34, fontWeight: '300' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  input: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  chipText: { color: '#52525b', fontSize: 13 },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { fontSize: 15, color: '#18181b' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhost: { borderWidth: 1, borderColor: '#e4e4e7' },
  btnGhostText: { color: '#52525b', fontWeight: '600' },
  btnPrimary: { backgroundColor: '#ea580c' },
  btnPrimaryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
