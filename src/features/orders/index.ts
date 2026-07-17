export type {
  PaymentProviderId,
  OrderStatus,
  OrderWritableStatus,
  OrderPaymentStatus,
  OrderItem,
  OrderShippingAddress,
  OrderShippingMethod,
  OrderPayment,
  OrderPaymentUpdateInput,
  OrderTotals,
  OrderCreateInput,
  Order,
} from "./types";

export { OrderService, OrderError, ORDERS_COLLECTION } from "./services";
export { generateOrderNumber } from "./lib/order-number";
export { mapOrder } from "./lib/map-order";
export {
  normalizeOrderStatus,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getAllowedOrderTransitions,
  canTransitionOrderStatus,
  getOrderStatusFilterOptions,
  getAdminPaymentStatusOptions,
  getOrderStatusSelectOptions,
} from "./lib/order-status";
export type { OrderCanonicalStatus } from "./lib/order-status";
export { OrderStatusBadge, PaymentStatusBadge } from "./components";
