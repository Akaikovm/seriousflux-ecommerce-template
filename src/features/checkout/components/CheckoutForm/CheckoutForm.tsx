"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { CartItem } from "@/features/cart/types";
import { checkoutFormSchema } from "@/features/checkout/lib/checkout-form-schema";
import { mapCartItemsToOrderItems } from "@/features/checkout/lib/map-cart-to-order-items";
import {
  getAvailableShippingMethods,
  getShippingMethodById,
  STANDARD_SHIPPING_METHOD,
} from "@/features/checkout/lib/shipping-methods";
import type { CheckoutFormValues } from "@/features/checkout/types";
import { OrderError } from "@/features/orders/services";
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
 * Controlled checkout form (RFC-013, RFC-015, RFC-016.5).
 * Order + payment orchestration goes through PaymentService only.
 * Payment methods are configuration-driven — no hardcoded provider assumptions.
 */
export function CheckoutForm({
  items,
  currency,
  defaultCountry,
  paymentOptions,
  onOrderCreated,
}: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const shippingMethods = getAvailableShippingMethods();
  const enabledMethodIds = paymentOptions.map((option) => option.id);
  // First enabled option by sortOrder; PAYMENT_METHODS[0] only seeds empty state (submit blocked).
  const defaultPaymentMethod = paymentOptions[0]?.id ?? PAYMENT_METHODS[0];

  const [values, setValues] = useState<CheckoutFormValues>(() =>
    toInitialValues(defaultCountry, defaultPaymentMethod),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const parsed = checkoutFormSchema.safeParse(values);

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
        paymentMethod: "The selected payment method is not available.",
      });
      return;
    }

    const method = getShippingMethodById(parsed.data.shippingMethodId);
    if (!method) {
      setFieldErrors({ shippingMethodId: "Select a shipping method." });
      return;
    }

    if (items.length === 0) {
      const message = "Your cart is empty.";
      setFormError(message);
      toast.error(message);
      return;
    }

    if (paymentOptions.length === 0) {
      const message = "No payment methods are available.";
      setFormError(message);
      toast.error(message);
      return;
    }

    setLoading(true);

    try {
      const { redirectUrl } = await new PaymentService().checkout({
        paymentMethod: parsed.data.paymentMethod,
        orderInput: {
          customerEmail: parsed.data.email,
          customerName: parsed.data.fullName,
          customerPhone: parsed.data.phone,
          items: mapCartItemsToOrderItems(items),
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

      onOrderCreated();
      toast.success("Order placed successfully.");
      router.push(redirectUrl);
    } catch (err) {
      if (err instanceof PaymentError || err instanceof OrderError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = "We could not place your order. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    } finally {
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
          Customer information
        </h2>
        <Input
          name="fullName"
          label="Full name"
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
          label="Email"
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
          label="Phone"
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
          Shipping information
        </h2>
        <Input
          name="address"
          label="Address"
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
            label="City"
            autoComplete="address-level2"
            value={values.city}
            onChange={(event) => setField("city", event.target.value)}
            error={fieldErrors.city}
            disabled={loading}
            required
          />
          <Input
            name="state"
            label="State / province"
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
            label="Postal code"
            autoComplete="postal-code"
            value={values.postalCode}
            onChange={(event) => setField("postalCode", event.target.value)}
            error={fieldErrors.postalCode}
            disabled={loading}
            required
          />
          <Input
            name="country"
            label="Country"
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
          Shipping method
        </h2>
        <Select
          name="shippingMethodId"
          label="Method"
          value={values.shippingMethodId}
          onChange={(event) => setField("shippingMethodId", event.target.value)}
          error={fieldErrors.shippingMethodId}
          disabled={loading}
          options={shippingMethods.map((method) => ({
            value: method.id,
            label:
              method.cost === 0
                ? `${method.label} — Free`
                : `${method.label}`,
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
          Payment method
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
        {loading ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}
