import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, User, setAuthTokenGetter } from "@workspace/api-client-react";

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
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("jwt_token"));
  const [user, setUser] = useState<User | null>(null);

  // Configure custom-fetch to use our token getter
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("jwt_token"));
  }, []);

  const { data: me, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (me) {
      setUser(me);
    }
    if (error) {
      logout();
    }
  }, [me, error]);

  const login = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("jwt_token");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading: !!token && isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "SUPER_ADMIN",
    isAgent: user?.role === "AGENT",
    isCustomer: user?.role === "CUSTOMER",
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
