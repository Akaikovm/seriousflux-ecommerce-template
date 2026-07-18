"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { AdminSurface } from "@/features/admin/ui/AdminSurface";
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
        setError("This account is not authorized for admin access.");
        return;
      }

      router.replace("/admin");
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isAuthorizedAdmin) {
    return (
      <div className="flex w-full max-w-md justify-center py-12">
        <LoadingState width="12rem" height="2.5rem" />
      </div>
    );
  }

  return (
    <AdminSurface className="w-full max-w-md">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in with an admin account to manage products, categories, and
            settings.
          </p>
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
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
          Sign in
        </Button>
      </form>
    </AdminSurface>
  );
}
