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
import { OrderError, OrderService } from "@/features/orders/services";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export type CheckoutFormProps = {
  items: CartItem[];
  currency: string;
  defaultCountry: string;
  /** Called only after OrderService.create succeeds — before redirect. */
  onOrderCreated: () => void;
};

function toInitialValues(defaultCountry: string): CheckoutFormValues {
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
  };
}

/**
 * Controlled checkout form (RFC-013).
 * Persists through OrderService only — never imports Firebase.
 */
export function CheckoutForm({
  items,
  currency,
  defaultCountry,
  onOrderCreated,
}: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const shippingMethods = getAvailableShippingMethods();

  const [values, setValues] = useState<CheckoutFormValues>(() =>
    toInitialValues(defaultCountry),
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

    setLoading(true);

    try {
      const order = await new OrderService().create({
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
      });

      // Clear cart only after a durable Order exists.
      onOrderCreated();
      toast.success("Order placed successfully.");
      router.push(
        `/checkout/confirmation?order=${encodeURIComponent(order.id)}&ref=${encodeURIComponent(order.orderNumber)}`,
      );
    } catch (err) {
      if (err instanceof OrderError) {
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

      <section className="flex flex-col gap-4" aria-labelledby="checkout-customer">
        <h2
          id="checkout-customer"
          className="text-base font-semibold tracking-tight text-foreground"
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

      <section className="flex flex-col gap-4" aria-labelledby="checkout-shipping">
        <h2
          id="checkout-shipping"
          className="text-base font-semibold tracking-tight text-foreground"
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

      <section className="flex flex-col gap-4" aria-labelledby="checkout-method">
        <h2
          id="checkout-method"
          className="text-base font-semibold tracking-tight text-foreground"
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

      <Button type="submit" fullWidth disabled={loading || items.length === 0}>
        {loading ? "Placing order…" : "Place order"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Payment will be available in a future update. Your order is saved as
        pending payment.
      </p>
    </form>
  );
}
