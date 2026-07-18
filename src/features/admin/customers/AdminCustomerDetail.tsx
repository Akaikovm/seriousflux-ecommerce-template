"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

import type {
  AdminCustomerOrderSummary,
  AdminCustomerView,
} from "@/features/admin/customers/admin-customer-view";
import { CustomerAvatar } from "@/features/admin/customers/CustomerAvatar";
import {
  CustomerRoleBadge,
  CustomerStatusBadge,
} from "@/features/admin/customers/CustomerBadges";
import type { AdminOrderView } from "@/features/admin/orders/admin-order-view";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminBackLink,
  AdminBreadcrumb,
  AdminPage,
  AdminPageHeader,
  AdminSaveBar,
  AdminSection,
  AdminStatCard,
  AdminTable,
} from "@/features/admin/ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { PersistedRole } from "@/features/auth/types";
import {
  CustomerAdminError,
  CustomerAdminService,
} from "@/features/customers/services";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/orders/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/format-price";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

const customerAdminFormSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  phone: z.string(),
  photoURL: z.string(),
  role: z.enum(["customer", "staff", "admin"]),
  status: z.enum(["active", "inactive"]),
});

type CustomerAdminFormValues = z.infer<typeof customerAdminFormSchema>;
type FieldErrors = Partial<Record<keyof CustomerAdminFormValues, string>>;

type AdminCustomerDetailProps = {
  customer: AdminCustomerView;
  orders: AdminOrderView[];
  summary: AdminCustomerOrderSummary;
  locale: string;
  currency: string;
};

function toInitialValues(customer: AdminCustomerView): CustomerAdminFormValues {
  return {
    displayName: customer.displayName,
    phone: customer.phone ?? "",
    photoURL: customer.photoURL ?? "",
    role: customer.role,
    status: customer.status,
  };
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Admin customer detail + edit (RFC-022).
 * Persists through CustomerAdminService only — no Auth profile sync.
 */
export function AdminCustomerDetail({
  customer,
  orders,
  summary,
  locale,
  currency,
}: AdminCustomerDetailProps) {
  const router = useRouter();
  const toast = useToast();
  const { user, role } = useCurrentUser();

  const [values, setValues] = useState<CustomerAdminFormValues>(() =>
    toInitialValues(customer),
  );
  const [snapshot, setSnapshot] = useState<CustomerAdminFormValues>(() =>
    toInitialValues(customer),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(snapshot);

  const roleOptions = [
    { value: "customer", label: "Customer" },
    { value: "staff", label: "Staff (reserved — no Admin access yet)" },
    { value: "admin", label: "Admin" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  function setField<K extends keyof CustomerAdminFormValues>(
    key: K,
    value: CustomerAdminFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleDiscard() {
    setValues({ ...snapshot });
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || !isDirty) {
      return;
    }

    if (!user || role !== "admin") {
      setFormError("You must be signed in as an admin to save.");
      return;
    }

    setFormError(null);
    const parsed = customerAdminFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CustomerAdminFormValues | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      const photoTrimmed = parsed.data.photoURL.trim();
      await new CustomerAdminService().update(
        customer.id,
        {
          displayName: parsed.data.displayName,
          phone: parsed.data.phone,
          photoURL: photoTrimmed.length > 0 ? photoTrimmed : null,
          role: parsed.data.role,
          status: parsed.data.status,
        },
        { uid: user.uid, role: role as PersistedRole },
      );

      toast.success("Customer updated.");
      setSnapshot({ ...parsed.data });
      setValues({ ...parsed.data });
      router.refresh();
    } catch (err) {
      const message =
        err instanceof CustomerAdminError
          ? err.message
          : "Unable to save customer. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const orderColumns: AdminDataTableColumn<AdminOrderView>[] = useMemo(
    () => [
      {
        id: "orderNumber",
        header: "Order",
        cell: (order) => (
          <Link
            href={`/admin/orders/${order.id}`}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {order.orderNumber}
          </Link>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: (order) => (
          <span className="text-muted-foreground">
            {formatDate(order.createdAt, locale)}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total",
        cell: (order) =>
          formatPrice(order.totals.total, order.currency || currency, locale),
      },
      {
        id: "payment",
        header: "Payment",
        cell: (order) => <PaymentStatusBadge status={order.payment.status} />,
      },
      {
        id: "fulfillment",
        header: "Fulfillment",
        cell: (order) => <OrderStatusBadge status={order.status} />,
      },
    ],
    [currency, locale],
  );

  return (
    <AdminPage>
      <AdminBreadcrumb
        items={[
          { label: "Customers", href: "/admin/customers" },
          { label: customer.displayName || customer.email || "Customer" },
        ]}
      />
      <AdminBackLink href="/admin/customers">Back to customers</AdminBackLink>

      <AdminPageHeader
        eyebrow="People"
        title={customer.displayName || "Customer"}
        description={customer.email}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CustomerRoleBadge role={values.role} />
            <CustomerStatusBadge status={values.status} />
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-4">
        <CustomerAvatar
          name={customer.displayName || customer.email}
          photoURL={values.photoURL || customer.photoURL}
          size="md"
        />
        <div className="min-w-0 text-sm text-muted-foreground">
          <p>Customer since {formatDate(customer.createdAt, locale)}</p>
          <p className="mt-1 break-all font-mono text-xs">ID: {customer.id}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Orders" value={summary.orderCount} />
        <AdminStatCard
          label="Total spent"
          value={formatPrice(summary.totalSpent, currency, locale)}
          hint="Paid orders only"
        />
        <AdminStatCard
          label="Customer since"
          value={formatDate(customer.createdAt, locale)}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <AdminSection
          title="Profile"
          description="Display name, phone, and photo URL. Email cannot be changed here."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="displayName"
              label="Display name"
              value={values.displayName}
              error={fieldErrors.displayName}
              disabled={loading}
              onChange={(event) => setField("displayName", event.target.value)}
            />
            <Input
              name="email"
              label="Email"
              value={customer.email}
              disabled
            />
            <Input
              name="phone"
              label="Phone"
              value={values.phone}
              error={fieldErrors.phone}
              disabled={loading}
              onChange={(event) => setField("phone", event.target.value)}
            />
            <Input
              name="photoURL"
              label="Photo URL"
              value={values.photoURL}
              error={fieldErrors.photoURL}
              disabled={loading}
              placeholder="https://"
              onChange={(event) => setField("photoURL", event.target.value)}
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Access"
          description="Role and status control Admin access. Inactive admins cannot sign in to Admin. Storefront soft-block for inactive customers is not enforced yet."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Role"
              name="role"
              options={roleOptions}
              value={values.role}
              error={fieldErrors.role}
              disabled={loading}
              onChange={(event) =>
                setField("role", event.target.value as PersistedRole)
              }
            />
            <Select
              label="Status"
              name="status"
              options={statusOptions}
              value={values.status}
              error={fieldErrors.status}
              disabled={loading}
              onChange={(event) =>
                setField(
                  "status",
                  event.target.value === "inactive" ? "inactive" : "active",
                )
              }
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            The last active admin cannot be demoted or deactivated. You may
            demote yourself only when another active admin exists.
          </p>
        </AdminSection>

        <AdminSaveBar
          dirty={isDirty}
          loading={loading}
          onDiscard={handleDiscard}
        />
      </form>

      <div className="mt-8">
        <AdminSection
          title="Order history"
          description="Orders linked to this customer id. Guest checkouts without a customer id are not listed."
        >
          <AdminTable
            columns={orderColumns}
            rows={orders}
            getRowId={(order) => order.id}
            emptyTitle="No orders"
            emptyDescription="This customer has not placed any authenticated orders yet."
            footer={
              orders.length > 0
                ? `${orders.length} order${orders.length === 1 ? "" : "s"}`
                : undefined
            }
          />
        </AdminSection>
      </div>
    </AdminPage>
  );
}
