"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { establishAdminSessionAction } from "@/features/auth/lib/admin-session-actions";
import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { AdminSurface } from "@/features/admin/ui/AdminSurface";
import { getFirebaseAuth } from "@/firebase/auth";
import { translateAuthError, useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Admin sign-in form (RFC-017 / GAP-002).
 *
 * Requires resolved session with role=admin and status=active, then
 * establishes an httpOnly server session cookie before entering the dashboard.
 */
export function AdminLoginForm() {
  const t = useT();
  const {
    user,
    role,
    status,
    loading: authLoading,
    signIn,
    signOut,
  } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const establishingSession = useRef(false);

  const isAuthorizedAdmin =
    user !== null && role === "admin" && status === "active";

  useEffect(() => {
    if (authLoading || !isAuthorizedAdmin || establishingSession.current) {
      return;
    }

    establishingSession.current = true;
    void (async () => {
      try {
        const idToken = await getFirebaseAuth().currentUser?.getIdToken();
        if (!idToken) {
          await signOut();
          setError(t("auth.adminNotAuthorized"));
          return;
        }

        const result = await establishAdminSessionAction(idToken);
        if (!result.ok) {
          await signOut();
          setError(t("auth.adminNotAuthorized"));
          return;
        }

        router.replace("/admin");
      } catch {
        await signOut();
        setError(t("auth.signInFailed"));
      } finally {
        establishingSession.current = false;
      }
    })();
  }, [authLoading, isAuthorizedAdmin, router, signOut, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const session = await signIn({ email: email.trim(), password });

      if (session.role !== "admin" || session.status !== "active") {
        await signOut();
        setError(t("auth.adminNotAuthorized"));
        return;
      }

      establishingSession.current = true;

      const idToken = await getFirebaseAuth().currentUser?.getIdToken();
      if (!idToken) {
        establishingSession.current = false;
        await signOut();
        setError(t("auth.adminNotAuthorized"));
        return;
      }

      const result = await establishAdminSessionAction(idToken);
      if (!result.ok) {
        establishingSession.current = false;
        await signOut();
        setError(t("auth.adminNotAuthorized"));
        return;
      }

      router.replace("/admin");
    } catch (err) {
      establishingSession.current = false;
      if (err instanceof AuthError) {
        setError(translateAuthError(err, t));
      } else {
        setError(t("auth.signInFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (isAuthorizedAdmin && !error)) {
    return (
      <AdminSurface compact className="w-full max-w-md">
        <div className="flex justify-center py-6">
          <LoadingState width="12rem" height="2.25rem" />
        </div>
      </AdminSurface>
    );
  }

  return (
    <AdminSurface compact className="w-full max-w-md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <h1 className="admin-page-header__title text-[1.25rem]">
            {t("auth.adminSignInTitle")}
          </h1>
          <p className="admin-page-header__description">
            {t("auth.adminSignInDescription")}
          </p>
        </div>

        <Input
          label={t("common.email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label={t("common.password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error}
        />

        <Button
          type="submit"
          loading={loading}
          fullWidth
          className="admin-btn-accent"
        >
          {t("auth.signInCta")}
        </Button>
      </form>
    </AdminSurface>
  );
}
