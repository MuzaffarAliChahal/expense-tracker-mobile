import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from '../theme';

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null]}
        accessibilityLabel={label}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Button({ title, onPress, busy, variant = 'primary' }: {
  title: string; onPress: () => void; busy?: boolean; variant?: 'primary' | 'ghost' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [styles.button, styles[variant], pressed && { opacity: 0.8 }]}
    >
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, variant === 'ghost' && { color: colors.primary }]}>{title}</Text>}
    </Pressable>
  );
}

export function Banner({ text }: { text: string | null }) {
  return text ? <Text style={styles.banner} accessibilityRole="alert">{text}</Text> : null;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 16, borderWidth: 1, borderColor: colors.border },
  field: { marginBottom: 12 },
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, backgroundColor: '#fff' },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, marginTop: 4, fontSize: 13 },
  button: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  primary: { backgroundColor: colors.primary },
  ghost: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.danger },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  banner: { backgroundColor: '#fef2f2', color: colors.danger, padding: 10, borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
});
