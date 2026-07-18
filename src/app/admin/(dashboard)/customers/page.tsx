import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminCustomersTable,
  toAdminCustomerView,
} from "@/features/admin/customers";
import { AdminLoadingState } from "@/features/admin/ui";
import type { PersistedRole, UserStatus } from "@/features/auth/types";
import {
  CustomerAdminError,
  CustomerAdminService,
} from "@/features/customers/services";
import type { CustomerProfile } from "@/features/customers/types";
import type { CustomerAdminListSort } from "@/features/customers/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Customers",
};

type AdminCustomersPageProps = {
  searchParams: Promise<{
    status?: string;
    role?: string;
    sort?: string;
    cursor?: string;
  }>;
};

function parseSort(value: string | undefined): CustomerAdminListSort {
  if (
    value === "oldest" ||
    value === "name_asc" ||
    value === "name_desc" ||
    value === "newest"
  ) {
    return value;
  }
  return "newest";
}

function parseStatus(value: string | undefined): UserStatus | undefined {
  if (value === "active" || value === "inactive") {
    return value;
  }
  return undefined;
}

function parseRole(value: string | undefined): PersistedRole | undefined {
  if (value === "customer" || value === "staff" || value === "admin") {
    return value;
  }
  return undefined;
}

/**
 * Admin customers — `/admin/customers`.
 */
export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const role = parseRole(params.role);
  const sort = parseSort(params.sort);
  const cursor = params.cursor?.trim() || null;

  const settings = await getStoreSettings();

  let items: CustomerProfile[] = [];
  let nextCursor: string | null = null;
  let pageSize = 25;

  try {
    const result = await new CustomerAdminService().list({
      ...(status ? { status } : {}),
      ...(role ? { role } : {}),
      sort,
      ...(cursor ? { cursor } : {}),
    });
    items = result.items;
    nextCursor = result.nextCursor;
    pageSize = result.pageSize;
  } catch (error) {
    if (error instanceof CustomerAdminError) {
      console.error(`[CustomerAdminService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CustomerAdminService] Unexpected error listing customers",
        error,
      );
    }
  }

  return (
    <Suspense fallback={<AdminLoadingState />}>
      <AdminCustomersTable
        customers={items.map(toAdminCustomerView)}
        locale={settings.locale}
        nextCursor={nextCursor}
        pageSize={pageSize}
        query={{
          status: status ?? "",
          role: role ?? "",
          sort,
          cursor,
        }}
      />
    </Suspense>
  );
}
