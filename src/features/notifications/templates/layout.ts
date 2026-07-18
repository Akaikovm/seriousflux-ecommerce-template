export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export type EmailBrandContext = {
  storeName: string;
  supportEmail: string;
  logoUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Shared transactional layout — provider-agnostic HTML + plain text wrapper.
 */
export function wrapTransactionalEmail(input: {
  brand: EmailBrandContext;
  title: string;
  bodyHtml: string;
  bodyText: string;
}): RenderedEmail {
  const store = escapeHtml(input.brand.storeName);
  const support = escapeHtml(input.brand.supportEmail);
  const title = escapeHtml(input.title);

  const logo =
    input.brand.logoUrl && input.brand.logoUrl.trim()
      ? `<p style="margin:0 0 24px;"><img src="${escapeHtml(input.brand.logoUrl)}" alt="${store}" width="120" style="max-width:120px;height:auto;" /></p>`
      : `<p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#111;">${store}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f6f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;padding:32px;border-radius:8px;">
          <tr><td>
            ${logo}
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${title}</h1>
            ${input.bodyHtml}
            <p style="margin:32px 0 0;font-size:13px;color:#666;line-height:1.5;">
              ${store}<br />
              ${support ? `Questions? Reply to this email or contact ${support}.` : ""}
            </p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    input.brand.storeName,
    "",
    input.title,
    "",
    input.bodyText,
    "",
    input.brand.supportEmail
      ? `Questions? Contact ${input.brand.supportEmail}.`
      : "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  return { subject: input.title, html, text };
}

export { escapeHtml };
