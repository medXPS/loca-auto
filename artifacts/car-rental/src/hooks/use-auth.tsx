import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, getGetMeQueryKey, User, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("jwt_token"));

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("jwt_token"));
  }, []);

  const { data: me, isLoading: queryLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem("jwt_token");
      setAuthTokenGetter(() => null);
      setToken(null);
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
    }
  }, [error, queryClient]);

  const login = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken);
    setAuthTokenGetter(() => newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setAuthTokenGetter(() => null);
    setToken(null);
    queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
  };

  const user = me ?? null;

  // Stay in loading state until the query resolves (either user data or error).
  // This closes the race window where isLoading flips to false before user state
  // is populated, which would incorrectly redirect to /connexion.
  const isLoading = !!token && (queryLoading || (!me && !error));

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!me,
    isAdmin: me?.role === "SUPER_ADMIN",
    isAgent: me?.role === "AGENT",
    isCustomer: me?.role === "CUSTOMER",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
