"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { buildSignupHref } from "@/features/auth/lib/safe-redirect";
import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";

type LoginFormProps = {
  /** Page heading. */
  title?: string;
  /** Supporting copy under the title. */
  description?: string;
  /** Where to navigate after a successful sign-in. Defaults to `/account`. */
  redirectTo?: string;
  /** Show links to signup / forgot-password. Defaults to true. */
  showAccountLinks?: boolean;
};

/**
 * Shared email/password + Google login form (RFC-017 / RFC-018).
 * Uses AuthProvider only — never Firebase Auth directly.
 */
export function LoginForm({
  title = "Sign in",
  description = "Sign in to your account.",
  redirectTo = "/account",
  showAccountLinks = true,
}: LoginFormProps) {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn({ email: email.trim(), password });
      router.replace(redirectTo);
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

  const signupHref = buildSignupHref(redirectTo);

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <GoogleAuthButton
          label="Continue with Google"
          redirectTo={redirectTo}
          onError={setError}
        />

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

        {showAccountLinks ? (
          <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
            <p>
              No account?{" "}
              <Link
                href={signupHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
