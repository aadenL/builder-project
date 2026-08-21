type NewsletterTemplateOptions = {
  recipientName: string;
  heading: string;
  message: string;
  listingUrl: string;
  eventDate?: string;
  eventAddress?: string;
  unsubscribeUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function newsletterTemplate({
  recipientName,
  heading,
  message,
  listingUrl,
  eventDate,
  eventAddress,
  unsubscribeUrl,
}: NewsletterTemplateOptions) {
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />");

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px;">
          <div style="background:#fff;border-radius:16px;padding:32px;">
            <p>Hello ${escapeHtml(recipientName)},</p>

            <h1>${escapeHtml(heading)}</h1>

            <p style="line-height:1.7">${safeMessage}</p>

            ${
              eventDate
                ? `<p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>`
                : ""
            }

            ${
              eventAddress
                ? `<p><strong>Location:</strong> ${escapeHtml(eventAddress)}</p>`
                : ""
            }

            <p style="margin-top:24px">
              <a
                href="${escapeHtml(listingUrl)}"
                style="display:inline-block;background:#0f766e;color:#fff;
                padding:12px 20px;border-radius:8px;text-decoration:none"
              >
                View listing
              </a>
            </p>

            <hr style="margin:32px 0;border:0;border-top:1px solid #ddd" />

            <p style="font-size:12px;color:#64748b">
              You received this email because you subscribed to
              Preconstruction Listings updates.
            </p>

            <p style="font-size:12px;color:#64748b">
              Preconstruction Listings<br />
              Your business mailing address<br />
              Ontario, Canada
            </p>

            <p style="font-size:12px">
              <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
