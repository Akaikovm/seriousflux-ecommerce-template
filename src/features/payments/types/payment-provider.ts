import type { Order } from "@/features/orders/types";
import type { PaymentMethod } from "./payment-method";

/**
 * Context passed to a provider after an order document exists.
 * Providers never receive raw checkout form data — only order snapshots.
 */
export interface PaymentCheckoutContext {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  /** Full created order — providers may use line items and totals from here. */
  order: Order;
}

/**
 * Result of initiating a provider checkout flow.
 */
export interface PaymentCheckoutResult {
  /** Where the storefront should send the customer next. */
  redirectUrl: string;
}

/**
 * Provider contract for the payment abstraction (RFC-015 / RFC-016.5).
 *
 * Checkout and OrderService never import concrete providers — only PaymentService.
 * New providers implement this interface, register in the registry, and are
 * enabled via StoreSettings.paymentProviders — Checkout stays unchanged.
 */
export interface PaymentProvider {
  readonly id: PaymentMethod;

  /**
   * Initiates payment after order creation.
   * Online providers typically return an external redirect URL.
   * Offline providers (e.g. cash on delivery) return an in-app confirmation URL.
   */
  createCheckout(
    context: PaymentCheckoutContext,
  ): Promise<PaymentCheckoutResult>;

  /** Capture an authorized payment — reserved for webhook / admin flows. */
  capturePayment(transactionId: string): Promise<void>;

  /** Refund a captured payment — reserved for admin flows. */
  refund(transactionId: string, amount?: number): Promise<void>;
}
