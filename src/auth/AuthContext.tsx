import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createHttpApi } from '../api/client';
import { createDemoApi } from '../api/demo';
import type { ExpenseApi } from '../api/types';
import { storage } from './storage';

const TOKEN_KEY = 'expense.jwt';
const MODE_KEY = 'expense.mode';
const URL_KEY = 'expense.apiUrl';
const DEFAULT_URL = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://10.0.2.2:8080';

interface AuthState {
  ready: boolean;
  signedIn: boolean;
  demo: boolean;
  apiUrl: string;
  api: ExpenseApi;
  signIn(email: string, password: string): Promise<void>;
  register(fullName: string, email: string, password: string): Promise<void>;
  startDemo(): Promise<void>;
  signOut(): Promise<void>;
  setApiUrl(url: string): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [apiUrl, setUrl] = useState(DEFAULT_URL);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const signOut = useCallback(async () => {
    await storage.remove(TOKEN_KEY);
    await storage.remove(MODE_KEY);
    setToken(null);
    setDemo(false);
  }, []);

  const http = useMemo(() => createHttpApi(apiUrl, () => tokenRef.current, () => void signOut()), [apiUrl, signOut]);
  const demoApi = useMemo(() => createDemoApi(), []);
  const api = demo ? demoApi : http;

  useEffect(() => {
    (async () => {
      const [savedToken, savedMode, savedUrl] = await Promise.all([
        storage.get(TOKEN_KEY),
        storage.get(MODE_KEY),
        storage.get(URL_KEY),
      ]);
      if (savedUrl) setUrl(savedUrl);
      setDemo(savedMode === 'demo');
      setToken(savedToken);
      setReady(true);
    })();
  }, []);

  const save = async (accessToken: string, mode: 'live' | 'demo') => {
    await storage.set(TOKEN_KEY, accessToken);
    await storage.set(MODE_KEY, mode);
    setDemo(mode === 'demo');
    setToken(accessToken);
  };

  const value: AuthState = {
    ready,
    signedIn: token != null,
    demo,
    apiUrl,
    api,
    signIn: async (email, password) => save((await http.login(email.trim(), password)).accessToken, 'live'),
    register: async (fullName, email, password) =>
      save((await http.register(fullName.trim(), email.trim(), password)).accessToken, 'live'),
    startDemo: async () => save((await demoApi.login('demo@example.com', 'demo-password')).accessToken, 'demo'),
    signOut,
    setApiUrl: async (url) => {
      await storage.set(URL_KEY, url);
      setUrl(url);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
