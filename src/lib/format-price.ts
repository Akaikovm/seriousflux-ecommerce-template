/**
 * Formats a monetary amount with Intl for storefront display.
 *
 * Currency usually comes from the product; locale should come from
 * StoreSettings so formatting matches the store's market.
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
