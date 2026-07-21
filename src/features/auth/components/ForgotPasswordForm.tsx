"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { translateAuthError, useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";

/**
 * Password reset request form (RFC-017).
 */
export function ForgotPasswordForm() {
  const t = useT();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword({ email: email.trim() });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(translateAuthError(err, t));
      } else {
        setError(t("auth.forgotPasswordFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md" padding="lg">
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            {t("auth.forgotPasswordTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.forgotPasswordDescription")}
          </p>
        </div>

        {success ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {t("auth.forgotPasswordSuccess")}
          </p>
        ) : null}

        <Input
          label={t("common.email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
        />

        <Button type="submit" loading={loading} fullWidth>
          {t("auth.forgotPasswordCta")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("auth.backToSignIn")}
          </Link>
        </p>
      </form>
    </Card>
  );
}
