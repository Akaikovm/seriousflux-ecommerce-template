"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { AdminSurface } from "@/features/admin/ui/AdminSurface";
import { translateAuthError, useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Admin sign-in form (RFC-017).
 *
 * Requires resolved session with role=admin and status=active.
 * Authentication alone is not enough.
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

  const isAuthorizedAdmin =
    user !== null && role === "admin" && status === "active";

  useEffect(() => {
    if (!authLoading && isAuthorizedAdmin) {
      router.replace("/admin");
    }
  }, [authLoading, isAuthorizedAdmin, router]);

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

      router.replace("/admin");
    } catch (err) {
      if (err instanceof AuthError) {
        setError(translateAuthError(err, t));
      } else {
        setError(t("auth.signInFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isAuthorizedAdmin) {
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
