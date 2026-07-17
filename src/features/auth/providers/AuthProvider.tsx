"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AuthService } from "@/features/auth/services";
import type { AuthUser, SignInCredentials } from "@/features/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Client auth session provider (RFC-011).
 *
 * Subscribes to Firebase Auth state via AuthService.
 * UI components must never import Firebase Auth directly.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [service] = useState(() => new AuthService());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return service.onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, [service]);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: (credentials) => service.signInWithEmail(credentials),
    signOut: () => service.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the current auth session. Must be used under AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
