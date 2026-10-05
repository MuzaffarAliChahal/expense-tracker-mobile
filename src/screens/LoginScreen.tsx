import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Banner, Button, Card, Field } from '../components/ui';
import { colors } from '../theme';
import { validateCredentials } from '../utils/validation';

export function LoginScreen() {
  const { signIn, register, startDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const v = validateCredentials(email, password, mode === 'register' ? fullName : undefined);
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'login') await signIn(email, password);
      else await register(fullName, email, password);
    } catch (e) {
      if (e instanceof ApiError) {
        setMessage(e.status === 401 ? 'Wrong email or password.' : e.message);
        setErrors(e.fieldErrors);
      } else {
        setMessage('Cannot reach the server. Check the API URL or try the demo.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Expense Tracker</Text>
        <Text style={styles.subtitle}>Track spending on the go. Your data stays private to your account.</Text>
        <Card>
          <Banner text={message} />
          {mode === 'register' && (
            <Field label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" />
          )}
          <Field label="Email" value={email} onChangeText={setEmail} error={errors.email}
            autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} error={errors.password}
            secureTextEntry autoComplete="password" />
          <Button title={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} busy={busy} />
          <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); setMessage(null); }}>
            <Text style={styles.switch}>
              {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
            </Text>
          </Pressable>
        </Card>
        <View style={{ height: 16 }} />
        <Button title="Try the demo (no server needed)" variant="ghost" onPress={() => void startDemo()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: colors.bg },
  logo: { fontSize: 30, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  switch: { color: colors.primary, textAlign: 'center', marginTop: 14, fontWeight: '600' },
});
