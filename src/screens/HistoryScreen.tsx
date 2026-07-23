import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getSale,
  listSales,
  type PaymentMethod,
  type Sale,
} from '../api/sales.api';
import { getSummary, type StatsSummary } from '../api/stats.api';
import { todayRange, weekRange } from '../lib/date-range';
import { useAuthStore } from '../store/auth.store';

function formatPrice(n: number) {
  return `$ ${n.toFixed(2)}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
};

function countUnits(sale: Sale) {
  return (sale.items ?? []).reduce((acc, i) => acc + i.qty, 0);
}

function SummaryCard({
  label,
  summary,
}: {
  label: string;
  summary: StatsSummary | null;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardTotal}>{formatPrice(summary?.total ?? 0)}</Text>
      <Text style={styles.cardMeta}>
        {summary?.count ?? 0} {summary?.count === 1 ? 'venta' : 'ventas'}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [today, setToday] = useState<StatsSummary | null>(null);
  const [week, setWeek] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Sale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const day = todayRange();
      const [daySales, daySummary, weekSummary] = await Promise.all([
        listSales(day),
        getSummary(day),
        getSummary(weekRange()),
      ]);
      setSales(daySales);
      setToday(daySummary);
      setWeek(weekSummary);
    } catch {
      setError('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarga al volver a la pestaña: si se registro una venta en "Nueva venta",
  // el historial ya la muestra sin pull-to-refresh manual.
  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  async function openDetail(sale: Sale) {
    setDetail(sale);
    setDetailLoading(true);
    try {
      // El listado no trae los nombres de producto (solo el conteo); el detalle si.
      setDetail(await getSale(sale.id));
    } catch {
      // Se queda con los datos del listado: total y hora ya son correctos.
    } finally {
      setDetailLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    );
  }

  if (error && sales.length === 0) {
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
        data={sales}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={['#ea580c']}
            tintColor="#ea580c"
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.hello} numberOfLines={1}>
                Hola, {user?.name ?? ''}
              </Text>
              <TouchableOpacity
                onPress={() => void logout()}
                accessibilityRole="button"
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cards}>
              <SummaryCard label="Hoy" summary={today} />
              <SummaryCard label="Esta semana" summary={week} />
            </View>

            {error && <Text style={styles.inlineError}>{error}</Text>}

            <Text style={styles.sectionTitle}>Ventas de hoy</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyHint}>
              Todavía no hay ventas hoy. Registra una en la pestaña Nueva venta.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const units = countUnits(item);
          return (
            <TouchableOpacity
              style={styles.sale}
              onPress={() => void openDetail(item)}
              accessibilityRole="button"
              accessibilityLabel={`Venta de ${formatTime(item.createdAt)}, ${formatPrice(item.total)}`}
            >
              <View style={styles.saleInfo}>
                <Text style={styles.saleTime}>{formatTime(item.createdAt)}</Text>
                <Text style={styles.saleMeta}>
                  {PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod}
                  {units > 0 && ` · ${units} ${units === 1 ? 'ítem' : 'ítems'}`}
                </Text>
              </View>
              <Text style={styles.saleTotal}>{formatPrice(item.total)}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={detail !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle de venta</Text>
            {detail && (
              <>
                <Text style={styles.modalMeta}>
                  {formatDateTime(detail.createdAt)} ·{' '}
                  {PAYMENT_LABELS[detail.paymentMethod] ?? detail.paymentMethod}
                </Text>

                {detailLoading ? (
                  <ActivityIndicator color="#ea580c" style={styles.modalLoader} />
                ) : (
                  <View style={styles.lines}>
                    {(detail.items ?? []).map((item) => (
                      <View key={item.id} style={styles.line}>
                        <Text style={styles.lineName} numberOfLines={1}>
                          {item.product?.name ?? 'Producto'}
                        </Text>
                        <Text style={styles.lineQty}>
                          {item.qty} × {formatPrice(item.unitPrice)}
                        </Text>
                        <Text style={styles.lineSubtotal}>
                          {formatPrice(item.subtotal)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(detail.total)}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setDetail(null)}
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  listContent: { padding: 12, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  hello: { flex: 1, fontSize: 18, fontWeight: '700', color: '#18181b' },
  logoutText: { color: '#ea580c', fontWeight: '600', fontSize: 13 },
  cards: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 2,
  },
  cardLabel: { fontSize: 13, color: '#71717a' },
  cardTotal: { fontSize: 22, fontWeight: '700', color: '#18181b' },
  cardMeta: { fontSize: 12, color: '#a1a1aa' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181b',
    marginTop: 18,
    marginBottom: 4,
  },
  inlineError: { color: '#dc2626', fontSize: 13, marginTop: 10 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#ea580c',
  },
  retryText: { color: '#fff', fontWeight: '600' },
  empty: { paddingVertical: 28, paddingHorizontal: 12 },
  emptyHint: { fontSize: 14, color: '#71717a', textAlign: 'center' },
  sale: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  saleInfo: { flex: 1 },
  saleTime: { fontSize: 16, fontWeight: '600', color: '#18181b' },
  saleMeta: { fontSize: 13, color: '#71717a', marginTop: 2 },
  saleTotal: { fontSize: 16, fontWeight: '700', color: '#18181b' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#18181b' },
  modalMeta: { fontSize: 13, color: '#71717a' },
  modalLoader: { marginVertical: 20 },
  lines: { marginTop: 8, gap: 2 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  lineName: { flex: 1, fontSize: 15, color: '#18181b' },
  lineQty: { fontSize: 13, color: '#71717a' },
  lineSubtotal: {
    minWidth: 72,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  totalLabel: { fontSize: 16, color: '#52525b' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#18181b' },
  closeBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f4f4f5',
  },
  closeText: { color: '#18181b', fontWeight: '600', fontSize: 15 },
});
