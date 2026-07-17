import type { OrderPaymentStatus } from "@/features/orders/types";

/**
 * Maps a Mercado Pago payment status onto our Order payment vocabulary.
 *
 * Never invents paid status from pending/authorized — only `approved` → `paid`.
 */
export function mapMercadoPagoStatusToOrderPaymentStatus(
  status: string,
): OrderPaymentStatus {
  switch (status) {
    case "approved":
      return "paid";
    case "authorized":
      return "authorized";
    case "pending":
    case "in_process":
    case "in_mediation":
      return "pending";
    case "rejected":
    case "cancelled":
      return "failed";
    case "refunded":
    case "charged_back":
      return "refunded";
    default:
      return "pending";
  }
}
