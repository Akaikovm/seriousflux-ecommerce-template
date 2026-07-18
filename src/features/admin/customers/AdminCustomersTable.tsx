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
    { value: "", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const roleOptions = [
    { value: "", label: "All roles" },
    { value: "customer", label: "Customer" },
    { value: "staff", label: "Staff" },
    { value: "admin", label: "Admin" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "name_asc", label: "Name A–Z" },
    { value: "name_desc", label: "Name Z–A" },
  ];

  const columns: AdminDataTableColumn<AdminCustomerView>[] = [
    {
      id: "customer",
      header: "Customer",
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
      header: "Role",
      cell: (customer) => <CustomerRoleBadge role={customer.role} />,
    },
    {
      id: "status",
      header: "Status",
      cell: (customer) => <CustomerStatusBadge status={customer.status} />,
    },
    {
      id: "created",
      header: "Created",
      cell: (customer) => (
        <span className="text-muted-foreground">
          {formatDate(customer.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      cell: (customer) => (
        <AdminRowActions>
          <Link
            href={`/admin/customers/${customer.id}`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              View
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

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="People"
        title="Customers"
        description="Manage customer profiles, roles, and account status."
      />

      <AdminTableToolbar>
        <Input
          label="Search this page"
          name="customer-search"
          placeholder="Name or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Status"
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
          label="Role"
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
          label="Sort"
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
        Search filters the current page only. Use status, role, and sort for
        server-side results.
      </p>

      <AdminTable
        columns={columns}
        rows={filtered}
        getRowId={(customer) => customer.id}
        pending={isPending}
        emptyTitle="No customers found"
        emptyDescription={
          customers.length === 0
            ? "Customers appear here after storefront signup or Google sign-in."
            : "Try a different search on this page, or clear filters."
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {filtered.length} of {customers.length} on this page
              {pageSize ? ` · up to ${pageSize} per page` : ""}
            </span>
            <div className="flex items-center gap-2">
              {hasCursor ? (
                <Button
                  type="button"
                  className="admin-action-btn admin-btn-ghost"
                  onClick={() => push(firstPageHref)}
                >
                  First page
                </Button>
              ) : null}
              {nextPageHref ? (
                <Button
                  type="button"
                  className="admin-action-btn admin-btn-ghost"
                  onClick={() => push(nextPageHref)}
                >
                  Next
                </Button>
              ) : null}
            </div>
          </div>
        }
      />
    </AdminPage>
  );
}
