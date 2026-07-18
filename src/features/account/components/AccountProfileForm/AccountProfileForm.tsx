"use client";

import { useState, type FormEvent } from "react";

import { AccountAvatar } from "@/features/account/components/AccountAvatar";
import { useAccountProfile } from "@/features/account/hooks/useAccountProfile";
import { useCurrentUser } from "@/features/auth/hooks";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Input";
import { LoadingState } from "@/shared/ui/LoadingState";
import { useToast } from "@/shared/ui/Toast";

type ProfileDraft = {
  displayName: string;
  photoURL: string;
  phone: string;
};

/**
 * Edit displayName, photoURL, phone. Email / role / status / uid read-only.
 */
export function AccountProfileForm() {
  const { user, customerId, role, status } = useCurrentUser();
  const { profile, loading, error, saving, updateProfile } =
    useAccountProfile();
  const toast = useToast();

  const [draft, setDraft] = useState<ProfileDraft | null>(null);

  const displayName = draft?.displayName ?? profile?.displayName ?? "";
  const photoURL = draft?.photoURL ?? profile?.photoURL ?? "";
  const phone = draft?.phone ?? profile?.phone ?? "";

  function patchDraft(partial: Partial<ProfileDraft>) {
    setDraft({
      displayName,
      photoURL,
      phone,
      ...partial,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const ok = await updateProfile({
      displayName,
      photoURL: photoURL.trim() || null,
      phone,
    });

    if (ok) {
      setDraft(null);
      toast.success("Profile updated.");
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="3rem" />
        <LoadingState height="3rem" />
        <LoadingState height="3rem" />
      </div>
    );
  }

  if (!profile) {
    return (
      <EmptyState
        title="Profile unavailable"
        description={error ?? "We could not load your profile."}
      />
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="storefront-heading text-[clamp(1.75rem,3vw,2.25rem)] text-foreground">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your display name, photo URL, and phone. Email cannot be
          changed here.
        </p>
      </header>

      <Card padding="lg">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <AccountAvatar
              photoURL={photoURL || profile.photoURL}
              displayName={displayName || profile.displayName}
              size="lg"
            />
            <p className="text-sm text-muted-foreground">
              Preview of your profile photo. Paste an https image URL below, or
              keep the one from Google.
            </p>
          </div>

          <Input
            label="Display name"
            name="displayName"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(event) =>
              patchDraft({ displayName: event.target.value })
            }
          />

          <Input
            label="Photo URL"
            name="photoURL"
            type="url"
            placeholder="https://"
            value={photoURL}
            onChange={(event) => patchDraft({ photoURL: event.target.value })}
            helperText="Optional https link to an avatar image."
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => patchDraft({ phone: event.target.value })}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={profile.email || user?.email || ""}
            readOnly
            disabled
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Role" name="role" value={role} readOnly disabled />
            <Input
              label="Status"
              name="status"
              value={status ?? "—"}
              readOnly
              disabled
            />
            <Input
              label="Customer id"
              name="uid"
              value={customerId ?? ""}
              readOnly
              disabled
            />
          </div>

          {error && !saving ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
