export {
  OrderService,
  OrderError,
  ORDERS_COLLECTION,
} from "./order.service";

// AdminOrderService (firebase-admin) must NOT be re-exported here — client
// barrels would pull Node-only modules into the browser. Import from
// `@/features/orders/services/order.admin` in server code only.
