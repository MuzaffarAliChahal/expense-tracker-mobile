import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import type { Category } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Banner, Button, Card, Field } from '../components/ui';
import { colors } from '../theme';
import { todayIso } from '../utils/format';
import { validateExpense } from '../utils/validation';

export function AddExpenseScreen() {
  const { api } = useAuth();
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [spentOn, setSpentOn] = useState(todayIso());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.categories().then(setCategories).catch(() => setMessage('Could not load categories')); }, [api]);

  async function addCategory() {
    if (!newCategory.trim()) return;
    try {
      const c = await api.createCategory(newCategory);
      setCategories((prev) => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(c.id);
      setNewCategory('');
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Could not add category');
    }
  }

  async function save() {
    const v = validateExpense({ amount, description, spentOn }, todayIso());
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await api.createExpense({
        amount: Number(amount.replace(',', '.')),
        description: description.trim() || undefined,
        spentOn,
        categoryId,
      });
      navigation.goBack();
    } catch (e) {
      if (e instanceof ApiError) {
        setMessage(e.message);
        setErrors(e.fieldErrors);
      } else {
        setMessage('Could not save. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  const yesterday = todayIso(new Date(Date.now() - 86_400_000));

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <Banner text={message} />
        <Field label="Amount" value={amount} onChangeText={setAmount} error={errors.amount} keyboardType="decimal-pad" placeholder="0.00" />
        <Field label="Description" value={description} onChangeText={setDescription} error={errors.description} placeholder="e.g. Lunch with client" />
        <Field label="Date (YYYY-MM-DD)" value={spentOn} onChangeText={setSpentOn} error={errors.spentOn} />
        <View style={styles.chips}>
          <Chip label="Today" active={spentOn === todayIso()} onPress={() => setSpentOn(todayIso())} />
          <Chip label="Yesterday" active={spentOn === yesterday} onPress={() => setSpentOn(yesterday)} />
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          <Chip label="None" active={categoryId == null} onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
          ))}
        </View>
        <View style={styles.newCat}>
          <View style={{ flex: 1 }}>
            <Field label="New category" value={newCategory} onChangeText={setNewCategory} placeholder="e.g. Health" />
          </View>
          <Pressable onPress={addCategory} style={styles.addBtn} accessibilityRole="button">
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
        <Button title="Save expense" onPress={save} busy={busy} />
      </Card>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', color: colors.text, marginBottom: 6, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  newCat: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  addBtn: { marginBottom: 12, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.primarySoft },
  addText: { color: colors.primary, fontWeight: '700' },
});
