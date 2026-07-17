import { OrderError, OrderService } from "@/features/orders/services";
import type { Order, OrderCreateInput } from "@/features/orders/types";
import { getPaymentProvider } from "@/features/payments/providers";
import type { PaymentMethod } from "@/features/payments/types";
import { PaymentError } from "./payment-error";

export type PaymentCheckoutInput = {
  paymentMethod: PaymentMethod;
  /** Order payload — `paymentProvider` is set by PaymentService from `paymentMethod`. */
  orderInput: Omit<OrderCreateInput, "paymentProvider">;
};

export type PaymentCheckoutOutput = {
  order: Order;
  redirectUrl: string;
};

/**
 * Single entry point for checkout payment flows (RFC-015 / RFC-016.5).
 *
 * Creates the order, delegates to the selected provider, and returns
 * the post-checkout redirect URL. Checkout must never import providers directly.
 *
 * Provider behavior (redirect vs confirmation) is owned by each provider —
 * this service stays provider-agnostic.
 */
export class PaymentService {
  constructor(private readonly orderService: OrderService = new OrderService()) {}

  async checkout(input: PaymentCheckoutInput): Promise<PaymentCheckoutOutput> {
    let provider;
    try {
      provider = getPaymentProvider(input.paymentMethod);
    } catch (error) {
      throw new PaymentError(
        "The selected payment method is not available.",
        "invalid-method",
        { cause: error },
      );
    }

    try {
      const order = await this.orderService.create({
        ...input.orderInput,
        paymentProvider: input.paymentMethod,
      });

      const { redirectUrl } = await provider.createCheckout({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: order.payment.amount,
        currency: order.currency,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        order,
      });

      return { order, redirectUrl };
    } catch (error) {
      if (error instanceof PaymentError || error instanceof OrderError) {
        throw error;
      }
      throw new PaymentError(
        "We could not complete checkout. Please try again.",
        "checkout-failed",
        { cause: error },
      );
    }
  }
}
