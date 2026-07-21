"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { AdminCustomerView } from "@/features/admin/customers/admin-customer-view";
import { CustomerAvatar } from "@/features/admin/customers/CustomerAvatar";
import {
  CustomerRoleBadge,
  CustomerStatusBadge,
} from "@/features/admin/customers/CustomerBadges";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminPage,
  AdminPageHeader,
  AdminRowActions,
  AdminTable,
  AdminTableToolbar,
  useAdminRouterTransition,
} from "@/features/admin/ui";
import type { PersistedRole } from "@/features/auth/types";
import type { CustomerAdminListSort } from "@/features/customers/types";
import { useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

type AdminCustomersTableProps = {
  customers: AdminCustomerView[];
  locale: string;
  nextCursor: string | null;
  pageSize: number;
  query: {
    status: string;
    role: string;
    sort: CustomerAdminListSort;
    cursor: string | null;
  };
};

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function matchesSearch(customer: AdminCustomerView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    customer.displayName.toLowerCase().includes(q) ||
    customer.email.toLowerCase().includes(q)
  );
}

function buildHref(
  pathname: string,
  params: {
    status?: string;
    role?: string;
    sort?: string;
    cursor?: string | null;
  },
): string {
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.role) {
    search.set("role", params.role);
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }
  if (params.cursor) {
    search.set("cursor", params.cursor);
  }
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Admin customers list (RFC-022).
 * Server filters/sort/pagination; name/email search within the current page.
 */
export function AdminCustomersTable({
  customers,
  locale,
  nextCursor,
  pageSize,
  query,
}: AdminCustomersTableProps) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending, push } = useAdminRouterTransition();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return customers.filter((customer) => matchesSearch(customer, search));
  }, [customers, search]);

  function replaceQuery(next: {
    status?: string;
    role?: string;
    sort?: string;
  }) {
    const href = buildHref(pathname, {
      status: next.status ?? query.status,
      role: next.role ?? query.role,
      sort: next.sort ?? query.sort,
      cursor: null,
    });
    push(href);
  }

  const statusOptions = [
    { value: "", label: t("admin.customers.allStatuses") },
    { value: "active", label: t("admin.customers.status.active") },
    { value: "inactive", label: t("admin.customers.status.inactive") },
  ];

  const roleOptions = [
    { value: "", label: t("admin.customers.allRoles") },
    { value: "customer", label: t("admin.customers.role.customer") },
    { value: "staff", label: t("admin.customers.role.staff") },
    { value: "admin", label: t("admin.customers.role.admin") },
  ];

  const sortOptions = [
    { value: "newest", label: t("admin.customers.sort.newest") },
    { value: "oldest", label: t("admin.customers.sort.oldest") },
    { value: "name_asc", label: t("admin.customers.sort.nameAsc") },
    { value: "name_desc", label: t("admin.customers.sort.nameDesc") },
  ];

  const columns: AdminDataTableColumn<AdminCustomerView>[] = [
    {
      id: "customer",
      header: t("admin.customers.columns.customer"),
      cell: (customer) => (
        <div className="flex items-center gap-3">
          <CustomerAvatar
            name={customer.displayName || customer.email}
            photoURL={customer.photoURL}
          />
          <div className="min-w-0">
            <Link
              href={`/admin/customers/${customer.id}`}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {customer.displayName || "—"}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {customer.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      header: t("admin.customers.columns.role"),
      cell: (customer) => <CustomerRoleBadge role={customer.role} />,
    },
    {
      id: "status",
      header: t("admin.customers.columns.status"),
      cell: (customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      id: "created",
      header: t("admin.customers.columns.created"),
      cell: (customer) => (
        <span className="text-muted-foreground">
          {formatDate(customer.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: t("common.actions"),
      className: "text-right",
      cell: (customer) => (
        <AdminRowActions>
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              {t("admin.common.view")}
            </Button>
          </Link>
        </AdminRowActions>
      ),
    },
  ];

  const firstPageHref = buildHref(pathname, {
    status: query.status,
    role: query.role,
    sort: query.sort,
    cursor: null,
  });

  const nextPageHref = nextCursor
    ? buildHref(pathname, {
        status: query.status,
        role: query.role,
        sort: query.sort,
        cursor: nextCursor,
      })
    : null;

  const hasCursor = Boolean(searchParams.get("cursor"));

  const pageFooterLabel = [
    t("admin.customers.pageFooter", {
      filtered: filtered.length,
      total: customers.length,
    }),
    pageSize
      ? t("admin.customers.perPage", { count: pageSize })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow={t("admin.customers.eyebrow")}
        title={t("admin.customers.title")}
        description={t("admin.customers.description")}
      />

      <AdminTableToolbar>
        <Input
          label={t("admin.customers.searchThisPage")}
          name="customer-search"
          placeholder={t("admin.customers.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label={t("common.status")}
          name="customer-status-filter"
          options={statusOptions}
          value={query.status}
          onChange={(event) => {
            const value = event.target.value;
            replaceQuery({
              status: value === "active" || value === "inactive" ? value : "",
            });
          }}
        />
        <Select
          label={t("admin.customers.fields.role")}
          name="customer-role-filter"
          options={roleOptions}
          value={query.role}
          onChange={(event) => {
            const value = event.target.value;
            const role: PersistedRole | "" =
              value === "customer" || value === "staff" || value === "admin"
                ? value
                : "";
            replaceQuery({ role });
          }}
        />
        <Select
          label={t("admin.customers.sortLabel")}
          name="customer-sort"
          options={sortOptions}
          value={query.sort}
          onChange={(event) => {
            const value = event.target.value as CustomerAdminListSort;
            replaceQuery({ sort: value });
          }}
        />
      </AdminTableToolbar>

      <p className="mb-3 text-xs text-muted-foreground">
        {t("admin.customers.searchPageHint")}
      </p>

      <AdminTable
        columns={columns}
        rows={filtered}
        getRowId={(customer) => customer.id}
        pending={isPending}
        emptyTitle={t("admin.customers.emptyTitle")}
        emptyDescription={
          customers.length === 0
            ? t("admin.customers.emptyDescription")
            : t("admin.customers.emptyFilteredDescription")
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{pageFooterLabel}</span>
            <div className="flex items-center gap-2">
              {hasCursor ? (
                <Button
                  type="button"
                  className="admin-action-btn admin-btn-ghost"
                  onClick={() => push(firstPageHref)}
                >
                  {t("admin.customers.firstPage")}
                </Button>
              ) : null}
              {nextPageHref ? (
                <Button
                  type="button"
                  className="admin-action-btn admin-btn-ghost"
                  onClick={() => push(nextPageHref)}
                >
                  {t("admin.customers.nextPage")}
                </Button>
              ) : null}
            </div>
          </div>
        }
      />
    </AdminPage>
  );
}
