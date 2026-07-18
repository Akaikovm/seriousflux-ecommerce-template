import type { Order } from "@/features/orders/types";

import {
  escapeHtml,
  wrapTransactionalEmail,
  type EmailBrandContext,
  type RenderedEmail,
} from "./layout";

function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function orderLinesHtml(order: Order, locale: string): string {
  const rows = order.items
    .map((item) => {
      const line = formatMoney(
        item.unitPrice * item.quantity,
        order.currency,
        locale,
      );
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(item.productName)} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");

  const total = formatMoney(order.totals.total, order.currency, locale);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;font-size:14px;">
    ${rows}
    <tr>
      <td style="padding:12px 0 0;font-weight:700;">Total</td>
      <td style="padding:12px 0 0;text-align:right;font-weight:700;">${escapeHtml(total)}</td>
    </tr>
  </table>`;
}

function orderLinesText(order: Order, locale: string): string {
  const lines = order.items.map(
    (item) =>
      `- ${item.productName} × ${item.quantity}: ${formatMoney(item.unitPrice * item.quantity, order.currency, locale)}`,
  );
  lines.push(
    `Total: ${formatMoney(order.totals.total, order.currency, locale)}`,
  );
  return lines.join("\n");
}

export function renderOrderCreated(
  order: Order,
  brand: EmailBrandContext,
  locale: string,
): RenderedEmail {
  const number = escapeHtml(order.orderNumber);
  return wrapTransactionalEmail({
    brand,
    title: `Order ${order.orderNumber} received`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(order.customerName)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">We received your order <strong>${number}</strong>.</p>
      ${orderLinesHtml(order, locale)}`,
    bodyText: `Hi ${order.customerName},\n\nWe received your order ${order.orderNumber}.\n\n${orderLinesText(order, locale)}`,
  });
}

export function renderPaymentApproved(
  order: Order,
  brand: EmailBrandContext,
  locale: string,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `Payment confirmed — ${order.orderNumber}`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(order.customerName)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Payment for order <strong>${escapeHtml(order.orderNumber)}</strong> was confirmed. We are preparing your order.</p>
      ${orderLinesHtml(order, locale)}`,
    bodyText: `Hi ${order.customerName},\n\nPayment for order ${order.orderNumber} was confirmed.\n\n${orderLinesText(order, locale)}`,
  });
}

export function renderPaymentFailed(
  order: Order,
  brand: EmailBrandContext,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `Payment unsuccessful — ${order.orderNumber}`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(order.customerName)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">We could not confirm payment for order <strong>${escapeHtml(order.orderNumber)}</strong>. You can try again from checkout or contact us for help.</p>`,
    bodyText: `Hi ${order.customerName},\n\nWe could not confirm payment for order ${order.orderNumber}. You can try again from checkout or contact us for help.`,
  });
}

export function renderOrderCancelled(
  order: Order,
  brand: EmailBrandContext,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `Order ${order.orderNumber} cancelled`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(order.customerName)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Order <strong>${escapeHtml(order.orderNumber)}</strong> has been cancelled. If you have questions, reply to this email.</p>`,
    bodyText: `Hi ${order.customerName},\n\nOrder ${order.orderNumber} has been cancelled. If you have questions, contact us.`,
  });
}

export function renderOrderShipped(
  order: Order,
  brand: EmailBrandContext,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `Order ${order.orderNumber} shipped`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(order.customerName)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Good news — order <strong>${escapeHtml(order.orderNumber)}</strong> is on its way.</p>
      <p style="margin:0;font-size:14px;color:#444;">Shipping to: ${escapeHtml(order.shippingAddress.line1)}, ${escapeHtml(order.shippingAddress.city)}</p>`,
    bodyText: `Hi ${order.customerName},\n\nOrder ${order.orderNumber} has shipped.\nShipping to: ${order.shippingAddress.line1}, ${order.shippingAddress.city}`,
  });
}

export function renderAdminOrderCreated(
  order: Order,
  brand: EmailBrandContext,
  locale: string,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `New order ${order.orderNumber}`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">A new order was placed.</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      ${orderLinesHtml(order, locale)}`,
    bodyText: `New order ${order.orderNumber}\nCustomer: ${order.customerName} (${order.customerEmail})\n\n${orderLinesText(order, locale)}`,
  });
}

export function renderAdminPaymentReceived(
  order: Order,
  brand: EmailBrandContext,
  locale: string,
): RenderedEmail {
  return wrapTransactionalEmail({
    brand,
    title: `Payment received — ${order.orderNumber}`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Payment was confirmed for order <strong>${escapeHtml(order.orderNumber)}</strong>.</p>
      <p style="margin:0 0 8px;font-size:14px;"><strong>Customer:</strong> ${escapeHtml(order.customerName)} (${escapeHtml(order.customerEmail)})</p>
      ${orderLinesHtml(order, locale)}`,
    bodyText: `Payment received for ${order.orderNumber}\nCustomer: ${order.customerName} (${order.customerEmail})\n\n${orderLinesText(order, locale)}`,
  });
}

export function renderAccountWelcome(input: {
  displayName: string;
  brand: EmailBrandContext;
}): RenderedEmail {
  const name = input.displayName.trim() || "there";
  return wrapTransactionalEmail({
    brand: input.brand,
    title: `Welcome to ${input.brand.storeName}`,
    bodyHtml: `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">Thanks for creating an account at <strong>${escapeHtml(input.brand.storeName)}</strong>. You can sign in anytime to track orders and manage your profile.</p>`,
    bodyText: `Hi ${name},\n\nThanks for creating an account at ${input.brand.storeName}. You can sign in anytime to track orders and manage your profile.`,
  });
}
