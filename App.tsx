import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AddExpenseScreen } from './src/screens/AddExpenseScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { ReportScreen } from './src/screens/ReportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;

function HomeTabs() {
  const { demo } = useAuth();
  return (
    <Tabs.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Tabs.Screen name="Expenses" component={ExpensesScreen}
        options={{ tabBarIcon: icon('≡'), headerRight: demo ? () => <Text style={{ marginRight: 16, color: colors.primary }}>Demo</Text> : undefined }} />
      <Tabs.Screen name="Report" component={ReportScreen} options={{ tabBarIcon: icon('▦'), title: 'Monthly report' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: icon('⚙') }} />
    </Tabs.Navigator>
  );
}

function Root() {
  const { ready, signedIn } = useAuth();
  if (!ready) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  }
  return (
    <Stack.Navigator>
      {signedIn ? (
        <>
          <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add expense', presentation: 'modal' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Root />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
