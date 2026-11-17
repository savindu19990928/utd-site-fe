"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  getAccessToken,
  getRefreshToken,
  setAuthExpiredHandler,
  setAuthTokens,
} from "@/lib/api-client";
import type { RegisterPayload, UserProfile } from "@/lib/types";
import { useToast } from "./ToastProvider";

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (username: string, password: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
  refreshProfile: () => Promise<UserProfile | null>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
      return profile;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    setAuthTokens(null);
    setUser(null);
    showToast("Signed out of your Universal Tool Depot account.", "info");
  }, [showToast]);

  useEffect(() => {
    setAuthExpiredHandler(() => {
      setUser(null);
    });

    const bootstrap = async () => {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (!access && !refresh) {
        setIsLoading(false);
        return;
      }
      try {
        if (!access && refresh) {
          const refreshed = await api.refresh(refresh);
          if (refreshed?.access) {
            setAuthTokens({ access: refreshed.access, refresh });
          }
        }
        const profile = await api.getProfile();
        setUser(profile);
      } catch {
        setAuthTokens(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();

    return () => {
      setAuthExpiredHandler(null);
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await api.login(username, password);
    setAuthTokens(tokens);
    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await api.register(payload);
    const tokens = await api.login(payload.username, payload.password);
    setAuthTokens(tokens);
    const profile = await api.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    isAdmin: user?.role === "ADMIN",
    isCustomer: user?.role === "CUSTOMER",
    login,
    register,
    logout,
    refreshProfile,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
