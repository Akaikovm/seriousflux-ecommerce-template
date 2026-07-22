"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AccountService } from "@/features/account/services";
import type { CartItem } from "@/features/cart/types";
import { useCartStore } from "@/features/cart/store/cart.store";
import { useCurrentUser } from "@/features/auth/hooks";
import { createCheckoutFormSchema } from "@/features/checkout/lib/checkout-form-schema";
import { revalidateCheckoutCart } from "@/features/checkout/lib/revalidate-checkout-cart";
import {
  getAvailableShippingMethods,
  getShippingMethodById,
  STANDARD_SHIPPING_METHOD,
} from "@/features/checkout/lib/shipping-methods";
import type { CheckoutFormValues } from "@/features/checkout/types";
import { OrderError } from "@/features/orders/services";
import { requestNotification } from "@/features/notifications";
import { PaymentMethodSelector } from "@/features/payments/components/PaymentMethodSelector";
import {
  PaymentError,
  PaymentService,
} from "@/features/payments/services";
import type {
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/features/payments/types";
import { PAYMENT_METHODS } from "@/features/payments/types";
import { useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export type CheckoutFormProps = {
  items: CartItem[];
  currency: string;
  defaultCountry: string;
  /** Enabled + registered options from StoreSettings (RFC-016.5). */
  paymentOptions: CheckoutPaymentOption[];
  /** Called only after checkout succeeds — before redirect. */
  onOrderCreated: () => void;
};

function toInitialValues(
  defaultCountry: string,
  defaultPaymentMethod: PaymentMethod,
): CheckoutFormValues {
  return {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: defaultCountry,
    shippingMethodId: STANDARD_SHIPPING_METHOD.id,
    paymentMethod: defaultPaymentMethod,
  };
}

/**
 * Controlled checkout form (RFC-013, RFC-015, RFC-016.5, RFC-017, RFC-018).
 * Order + payment orchestration goes through PaymentService only.
 * Payment methods are configuration-driven — no hardcoded provider assumptions.
 * When authenticated, attaches `customerId` and prefills name / email / phone.
 */
export function CheckoutForm({
  items,
  currency,
  defaultCountry,
  paymentOptions,
  onOrderCreated,
}: CheckoutFormProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const { user, customerId, loading: authLoading } = useCurrentUser();
  const shippingMethods = getAvailableShippingMethods(t);
  const enabledMethodIds = paymentOptions.map((option) => option.id);
  // First enabled option by sortOrder; PAYMENT_METHODS[0] only seeds empty state (submit blocked).
  const defaultPaymentMethod = paymentOptions[0]?.id ?? PAYMENT_METHODS[0];

  const [values, setValues] = useState<CheckoutFormValues>(() =>
    toInitialValues(defaultCountry, defaultPaymentMethod),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Prefill empty customer fields from the signed-in session / profile.
   * Never overwrites values the shopper already typed.
   */
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      const sessionName = user.displayName?.trim() ?? "";
      const sessionEmail = user.email?.trim() ?? "";

      setValues((current) => ({
        ...current,
        fullName: current.fullName.trim() || sessionName,
        email: current.email.trim() || sessionEmail,
      }));

      if (!customerId) {
        return;
      }

      try {
        const profile = await new AccountService().getProfile(customerId);
        if (cancelled || !profile) {
          return;
        }

        setValues((current) => ({
          ...current,
          fullName: current.fullName.trim() || profile.displayName.trim() || "",
          email: current.email.trim() || profile.email.trim() || "",
          phone: current.phone.trim() || profile.phone?.trim() || "",
        }));
      } catch {
        // Prefill is best-effort — checkout still works with empty fields.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, customerId]);

  function setField<K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setFormError(null);
    const parsed = createCheckoutFormSchema(t).safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CheckoutFormValues | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    if (!enabledMethodIds.includes(parsed.data.paymentMethod)) {
      setFieldErrors({
        paymentMethod: t("checkout.paymentUnavailable"),
      });
      return;
    }

    const method = getShippingMethodById(parsed.data.shippingMethodId, t);
    if (!method) {
      setFieldErrors({
        shippingMethodId: t("checkout.validation.shippingRequired"),
      });
      return;
    }

    if (items.length === 0) {
      const message = t("checkout.inventory.cartEmpty");
      setFormError(message);
      toast.error(message);
      return;
    }

    if (paymentOptions.length === 0) {
      const message = t("checkout.noPaymentMethods");
      setFormError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      const revalidated = await revalidateCheckoutCart(items);

      if (
        revalidated.cartSnapshots.length > 0 &&
        (revalidated.errorCode === "priceUpdated" ||
          revalidated.errorCode === "insufficientStock")
      ) {
        useCartStore.getState().replaceItems(revalidated.cartSnapshots);
      }

      if (!revalidated.ok) {
        const message = revalidated.errorCode
          ? t(`checkout.inventory.${revalidated.errorCode}`)
          : (revalidated.message ??
            t("checkout.inventory.insufficientStock"));
        setFormError(message);
        toast.error(message);
        setLoading(false);
        return;
      }

      const { order, redirectUrl } = await new PaymentService().checkout({
        paymentMethod: parsed.data.paymentMethod,
        orderInput: {
          ...(customerId ? { customerId } : {}),
          customerEmail: parsed.data.email,
          customerName: parsed.data.fullName,
          customerPhone: parsed.data.phone,
          items: revalidated.orderItems,
          shippingAddress: {
            fullName: parsed.data.fullName,
            line1: parsed.data.address,
            city: parsed.data.city,
            state: parsed.data.state,
            postalCode: parsed.data.postalCode,
            country: parsed.data.country,
            phone: parsed.data.phone,
          },
          shippingMethod: {
            id: method.id,
            label: method.label,
            cost: method.cost,
          },
          currency,
        },
      });

      // Fire-and-forget — never blocks or rolls back the order (RFC-019).
      requestNotification({ event: "order.created", orderId: order.id });

      onOrderCreated();
      toast.success(t("checkout.orderSuccess"));
      router.push(redirectUrl);
      // Keep the submit button loading until navigation unmounts this page.
      return;
    } catch (err) {
      if (err instanceof PaymentError || err instanceof OrderError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = t("checkout.errors.placeOrderFailed");
        setFormError(message);
        toast.error(message);
      }
      setLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={handleSubmit}
      noValidate
    >
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <section
        className="flex flex-col gap-4"
        aria-labelledby="checkout-customer"
      >
        <h2
          id="checkout-customer"
          className="storefront-heading text-lg tracking-tight text-foreground"
        >
          {t("checkout.customerInformation")}
        </h2>
        <Input
          name="fullName"
          label={t("checkout.fullName")}
          autoComplete="name"
          value={values.fullName}
          onChange={(event) => setField("fullName", event.target.value)}
          error={fieldErrors.fullName}
          disabled={loading}
          required
        />
        <Input
          name="email"
          type="email"
          label={t("checkout.email")}
          autoComplete="email"
          value={values.email}
          onChange={(event) => setField("email", event.target.value)}
          error={fieldErrors.email}
          disabled={loading}
          required
        />
        <Input
          name="phone"
          type="tel"
          label={t("checkout.phone")}
          autoComplete="tel"
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value)}
          error={fieldErrors.phone}
          disabled={loading}
          required
        />
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border/70 pt-8"
        aria-labelledby="checkout-shipping"
      >
        <h2
          id="checkout-shipping"
          className="storefront-heading text-lg tracking-tight text-foreground"
        >
          {t("checkout.shippingInformation")}
        </h2>
        <Input
          name="address"
          label={t("checkout.address")}
          autoComplete="street-address"
          value={values.address}
          onChange={(event) => setField("address", event.target.value)}
          error={fieldErrors.address}
          disabled={loading}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="city"
            label={t("checkout.city")}
            autoComplete="address-level2"
            value={values.city}
            onChange={(event) => setField("city", event.target.value)}
            error={fieldErrors.city}
            disabled={loading}
            required
          />
          <Input
            name="state"
            label={t("checkout.state")}
            autoComplete="address-level1"
            value={values.state}
            onChange={(event) => setField("state", event.target.value)}
            error={fieldErrors.state}
            disabled={loading}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="postalCode"
            label={t("checkout.postalCode")}
            autoComplete="postal-code"
            value={values.postalCode}
            onChange={(event) => setField("postalCode", event.target.value)}
            error={fieldErrors.postalCode}
            disabled={loading}
            required
          />
          <Input
            name="country"
            label={t("checkout.country")}
            autoComplete="country-name"
            value={values.country}
            onChange={(event) => setField("country", event.target.value)}
            error={fieldErrors.country}
            disabled={loading}
            required
          />
        </div>
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border/70 pt-8"
        aria-labelledby="checkout-method"
      >
        <h2
          id="checkout-method"
          className="storefront-heading text-lg tracking-tight text-foreground"
        >
          {t("checkout.shippingMethod")}
        </h2>
        <Select
          name="shippingMethodId"
          label={t("checkout.method")}
          value={values.shippingMethodId}
          onChange={(event) => setField("shippingMethodId", event.target.value)}
          error={fieldErrors.shippingMethodId}
          disabled={loading}
          options={shippingMethods.map((method) => ({
            value: method.id,
            label:
              method.cost === 0
                ? t("checkout.freeShippingLabel", { label: method.label })
                : method.label,
          }))}
        />
      </section>

      <section
        className="flex flex-col gap-4 border-t border-border/70 pt-8"
        aria-labelledby="checkout-payment"
      >
        <h2
          id="checkout-payment"
          className="storefront-heading text-lg tracking-tight text-foreground"
        >
          {t("checkout.paymentMethod")}
        </h2>
        <PaymentMethodSelector
          value={values.paymentMethod}
          onChange={(method) => setField("paymentMethod", method)}
          options={paymentOptions}
          disabled={loading}
          error={fieldErrors.paymentMethod}
        />
      </section>

      <Button type="submit" fullWidth disabled={loading || items.length === 0}>
        {loading ? t("checkout.placingOrder") : t("checkout.placeOrder")}
      </Button>
    </form>
  );
}
