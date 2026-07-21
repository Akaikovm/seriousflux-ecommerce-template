"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AccountError,
  AccountService,
} from "@/features/account/services";
import type { AccountProfileUpdateInput } from "@/features/account/types";
import { useCurrentUser } from "@/features/auth/hooks";
import type { CustomerProfile } from "@/features/customers/types";
import { useT } from "@/i18n";

type UseAccountProfileResult = {
  profile: CustomerProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  updateProfile: (input: AccountProfileUpdateInput) => Promise<boolean>;
};

/**
 * Loads and updates the signed-in customer's profile via AccountService.
 */
export function useAccountProfile(): UseAccountProfileResult {
  const t = useT();
  const { customerId, loading: authLoading } = useCurrentUser();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      if (!customerId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const next = await new AccountService().getProfile(customerId);
        if (!cancelled) {
          setProfile(next);
        }
      } catch (err) {
        if (!cancelled) {
          setProfile(null);
          setError(
            err instanceof AccountError
              ? err.message
              : t("account.loadFailed"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, customerId, t]);

  const updateProfile = useCallback(
    async (input: AccountProfileUpdateInput): Promise<boolean> => {
      if (!customerId) {
        setError(t("account.mustSignIn"));
        return false;
      }

      setSaving(true);
      setError(null);
      try {
        const next = await new AccountService().updateProfile(
          customerId,
          input,
        );
        setProfile(next);
        return true;
      } catch (err) {
        setError(
          err instanceof AccountError
            ? err.message
            : t("account.saveFailed"),
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [customerId, t],
  );

  return {
    profile,
    loading: authLoading || loading,
    error,
    saving,
    updateProfile,
  };
}
