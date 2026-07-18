"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * Soft App Router navigations for Admin filter / pagination changes.
 *
 * Pair with `AdminTable` / `DataTable` `pending={isPending}` so the table
 * shows an in-table spinner while the RSC re-fetches.
 *
 * @example
 * const { isPending, push } = useAdminRouterTransition();
 * push("/admin/customers?status=active");
 * <AdminTable pending={isPending} ... />
 */
export function useAdminRouterTransition() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const push = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router],
  );

  const replace = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href);
      });
    },
    [router],
  );

  return { isPending, push, replace, startTransition };
}
