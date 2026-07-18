/**
 * Format a Firestore Timestamp or Date for Account UI.
 */
export function formatAccountDate(
  value: { toDate: () => Date } | Date | string | undefined,
  locale: string,
): string {
  if (!value) {
    return "—";
  }

  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
          ? value
          : value.toDate();

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatAccountDateTime(
  value: { toDate: () => Date } | Date | string | undefined,
  locale: string,
): string {
  if (!value) {
    return "—";
  }

  try {
    const date =
      typeof value === "string"
        ? new Date(value)
        : value instanceof Date
          ? value
          : value.toDate();

    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "—";
  }
}

function providerLabel(provider: string): string {
  switch (provider) {
    case "mercadopago":
      return "Mercado Pago";
    case "cash_on_delivery":
      return "Cash on Delivery";
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return provider;
  }
}

export { providerLabel };
