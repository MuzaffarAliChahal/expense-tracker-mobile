import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { MonthlyReport } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Banner, Card } from '../components/ui';
import { colors } from '../theme';
import { formatMoney, monthTitle } from '../utils/format';

export function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function ReportScreen() {
  const { api } = useAuth();
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    setReport(null);
    api.monthlyReport(period.year, period.month)
      .then((r) => { setReport(r); setError(null); })
      .catch(() => setError('Could not load the report'));
  }, [api, period]));

  const max = Math.max(1, ...(report?.byCategory.map((c) => c.total) ?? [1]));

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={styles.header}>
        <Pressable onPress={() => setPeriod(shiftMonth(period.year, period.month, -1))} style={styles.nav} accessibilityLabel="Previous month">
          <Text style={styles.navText}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{monthTitle(period.year, period.month)}</Text>
        <Pressable onPress={() => setPeriod(shiftMonth(period.year, period.month, 1))} style={styles.nav} accessibilityLabel="Next month">
          <Text style={styles.navText}>›</Text>
        </Pressable>
      </View>
      <Banner text={error} />
      {!report ? <ActivityIndicator /> : (
        <>
          <Card>
            <Text style={styles.muted}>Total spent</Text>
            <Text style={styles.total}>{formatMoney(report.total)}</Text>
            <Text style={styles.muted}>{report.count} expense{report.count === 1 ? '' : 's'}</Text>
          </Card>
          <Card>
            <Text style={styles.section}>By category</Text>
            {report.byCategory.length === 0 && <Text style={styles.muted}>Nothing recorded this month.</Text>}
            {report.byCategory.map((c) => (
              <View key={c.category ?? 'none'} style={{ marginBottom: 12 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cat}>{c.category ?? 'Uncategorized'}</Text>
                  <Text style={styles.cat}>{formatMoney(c.total)}</Text>
                </View>
                <View style={styles.track}><View style={[styles.bar, { width: `${(c.total / max) * 100}%` }]} /></View>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nav: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  navText: { fontSize: 24, color: colors.primary },
  month: { fontSize: 20, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  total: { fontSize: 34, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  section: { fontWeight: '700', color: colors.text, marginBottom: 12, fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cat: { color: colors.text, fontWeight: '600' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5, backgroundColor: colors.primary },
});
