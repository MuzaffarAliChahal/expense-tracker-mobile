import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field } from '../components/ui';
import { colors } from '../theme';

export function SettingsScreen() {
  const { apiUrl, setApiUrl, signOut, demo } = useAuth();
  const [url, setUrl] = useState(apiUrl);
  const [saved, setSaved] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text style={{ color: colors.muted, marginBottom: 10 }}>
          {demo ? 'You are using the offline demo. Data is kept in memory only.' : 'Connected to your expense-tracker-api server.'}
        </Text>
        <Field label="API URL" value={url} onChangeText={(t) => { setUrl(t); setSaved(false); }} autoCapitalize="none" keyboardType="url" />
        <Button title={saved ? 'Saved' : 'Save API URL'} variant="ghost" onPress={async () => { await setApiUrl(url.trim()); setSaved(true); }} />
      </Card>
      <Button title="Log out" variant="danger" onPress={() => void signOut()} />
    </ScrollView>
  );
}
