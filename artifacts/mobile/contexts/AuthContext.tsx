import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

const TOKEN_KEY = "auth_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let _globalLogout: (() => Promise<void>) | null = null;

export function triggerGlobalLogout(): void {
  _globalLogout?.();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadToken() {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          setToken(stored);
          setAuthTokenGetter(() => stored);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    loadToken();
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setAuthTokenGetter(null);
  }, []);

  const login = useCallback(async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
  }, []);

  useEffect(() => {
    _globalLogout = logout;
    return () => {
      _globalLogout = null;
    };
  }, [logout]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useProtectedRoute() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [token, isLoading, segments, router]);
}
