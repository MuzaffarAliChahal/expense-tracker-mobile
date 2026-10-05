import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Expense } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Banner } from '../components/ui';
import { colors } from '../theme';
import { formatDate, formatMoney } from '../utils/format';

const PAGE_SIZE = 20;

export function ExpensesScreen() {
  const { api } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<Expense[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    setLoading(true);
    try {
      const res = await api.expenses(nextPage, PAGE_SIZE);
      setItems((prev) => (replace ? res.content : [...prev, ...res.content]));
      setPage(nextPage);
      setHasMore(nextPage + 1 < res.totalPages);
      setError(null);
    } catch {
      setError('Could not load expenses. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  // Reload whenever the tab gets focus, e.g. after adding an expense.
  useFocusEffect(useCallback(() => { void load(0, true); }, [load]));

  const confirmDelete = (e: Expense) =>
    Alert.alert('Delete expense?', `${e.description ?? 'Expense'} · ${formatMoney(e.amount)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await api.deleteExpense(e.id);
          setItems((prev) => prev.filter((x) => x.id !== e.id));
        },
      },
    ]);

  return (
    <View style={styles.screen}>
      <Banner text={error} />
      <FlatList
        data={items}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : { paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(0, true); }} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (hasMore && !loading) void load(page + 1, false); }}
        ListFooterComponent={loading && items.length > 0 ? <ActivityIndicator style={{ margin: 16 }} /> : null}
        ListEmptyComponent={loading ? <ActivityIndicator /> : <Text style={styles.empty}>No expenses yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => confirmDelete(item)} style={styles.row} accessibilityHint="Long press to delete">
            <View style={styles.dot}><Text style={styles.dotText}>{(item.categoryName ?? '?').slice(0, 1)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.description || 'Expense'}</Text>
              <Text style={styles.meta}>{item.categoryName ?? 'Uncategorized'} · {formatDate(item.spentOn)}</Text>
            </View>
            <Text style={styles.amount}>{formatMoney(item.amount)}</Text>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="Add expense"
        onPress={() => navigation.navigate('AddExpense' as never)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  dot: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dotText: { color: colors.primary, fontWeight: '800' },
  title: { fontWeight: '600', color: colors.text, fontSize: 15 },
  meta: { color: colors.muted, marginTop: 2, fontSize: 13 },
  amount: { fontWeight: '700', color: colors.text, fontSize: 15 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.muted },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 30, marginTop: -2 },
});
