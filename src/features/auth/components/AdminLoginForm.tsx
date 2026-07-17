"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Email/password sign-in form for the admin area (RFC-011).
 */
export function AdminLoginForm() {
  const { user, loading: authLoading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn({ email: email.trim(), password });
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

  if (authLoading || user) {
    return (
      <div className="flex w-full max-w-md justify-center py-12">
        <LoadingState width="12rem" height="2.5rem" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">Admin sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your store account to manage products, categories, and
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

        <Button type="submit" loading={loading} fullWidth>
          Sign in
        </Button>
      </form>
    </Card>
  );
}
