"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";
import { buildLoginHref } from "@/features/auth/lib/safe-redirect";
import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { requestNotification } from "@/features/notifications";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";

type SignupFormProps = {
  /** Where to navigate after a successful sign-up. Defaults to `/account`. */
  redirectTo?: string;
};

/**
 * Customer signup form (RFC-017 / RFC-018).
 * Creates Auth user + customers/{uid} with role=customer.
 * Google uses the same bootstrap path.
 */
export function SignupForm({ redirectTo = "/account" }: SignupFormProps) {
  const { signUp } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      requestNotification({
        event: "account.welcome",
        email: email.trim(),
        displayName: displayName.trim() || undefined,
      });
      router.replace(redirectTo);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Unable to create your account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const loginHref = buildLoginHref(redirectTo);

  return (
    <Card className="w-full max-w-md" padding="lg">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Create account
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign up with Google or email. Guest checkout still works without an
            account.
          </p>
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
            label="Name"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />

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
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={error}
            helperText="At least 6 characters."
          />

          <Button type="submit" loading={loading} fullWidth>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
