"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { RoleResolver } from "@/features/auth/services/role-resolver.service";
import type {
  AppRole,
  AuthenticatedSession,
  AuthUser,
  ResetPasswordInput,
  SignInCredentials,
  SignUpCredentials,
  UserStatus,
} from "@/features/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  role: AppRole;
  status: UserStatus | null;
  customerId: string | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<AuthenticatedSession>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthenticatedSession>;
  signInWithGoogle: () => Promise<AuthenticatedSession>;
  signOut: () => Promise<void>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Global auth session provider (RFC-017 / RFC-018).
 *
 * Subscribes to Firebase Auth via AuthService, then resolves role/status
 * from Firestore through RoleResolver. Mount once at the application root.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [authService] = useState(() => new AuthService());
  const [roleResolver] = useState(() => new RoleResolver());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole>("guest");
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setRole("guest");
    setStatus(null);
    setCustomerId(null);
  }, []);

  const applySession = useCallback((session: AuthenticatedSession) => {
    setUser(session.user);
    setRole(session.role);
    setStatus(session.status);
    setCustomerId(session.customerId);
  }, []);

  const applyResolvedSession = useCallback(
    async (authUser: AuthUser | null) => {
      if (!authUser) {
        clearSession();
        return;
      }

      try {
        const session = await roleResolver.resolve(authUser);
        applySession(session);
      } catch {
        // Fail closed for privileged access: treat as guest if resolution fails.
        // Storefront may retry on next auth event; admin RequireRole will deny.
        clearSession();
      }
    },
    [applySession, clearSession, roleResolver],
  );

  useEffect(() => {
    return authService.observeAuthState((nextUser) => {
      void (async () => {
        setLoading(true);
        await applyResolvedSession(nextUser);
        setLoading(false);
      })();
    });
  }, [authService, applyResolvedSession]);

  const signIn = useCallback(
    async (credentials: SignInCredentials): Promise<AuthenticatedSession> => {
      const authUser = await authService.signIn(credentials);
      const session = await roleResolver.resolve(authUser);
      applySession(session);
      return session;
    },
    [applySession, authService, roleResolver],
  );

  const signUp = useCallback(
    async (credentials: SignUpCredentials): Promise<AuthenticatedSession> => {
      const { user: authUser, isNewCustomer } =
        await authService.signUp(credentials);
      const session = await roleResolver.resolve(authUser);
      const next = { ...session, isNewCustomer };
      applySession(next);
      return next;
    },
    [applySession, authService, roleResolver],
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthenticatedSession> => {
    const { user: authUser, isNewCustomer } =
      await authService.signInWithGoogle();
    const session = await roleResolver.resolve(authUser);
    const next = { ...session, isNewCustomer };
    applySession(next);
    return next;
  }, [applySession, authService, roleResolver]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    clearSession();
  }, [authService, clearSession]);

  const resetPassword = useCallback(
    async (input: ResetPasswordInput) => {
      await authService.resetPassword(input);
    },
    [authService],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      status,
      customerId,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
    }),
    [
      user,
      role,
      status,
      customerId,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the auth session. Must be used under AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
