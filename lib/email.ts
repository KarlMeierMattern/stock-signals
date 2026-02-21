import { Resend } from "resend";
import { getEnv } from "./env";

export type SignalEmailData = {
  symbol: string;
  name: string;
  price: number;
  sma200: number;
  percentBelow: number;
};

function buildHtml(data: SignalEmailData): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #dc2626; margin-bottom: 16px;">BUY Signal: ${data.symbol}</h2>
      <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
        <strong>${data.name}</strong> has dropped below its 200-day Simple Moving Average.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280;">Current Price</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">$${data.price.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280;">200-Day SMA</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">$${data.sma200.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280;">Below SMA by</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #dc2626;">${data.percentBelow.toFixed(2)}%</td>
        </tr>
      </table>
      <p style="color: #9ca3af; font-size: 12px;">
        Signal generated at ${new Date().toISOString()}. This is not financial advice.
      </p>
    </div>
  `;
}

export async function sendSignalEmail(data: SignalEmailData) {
  const { RESEND_API_KEY, ALERT_EMAIL } = getEnv();
  const resend = new Resend(RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "Stock Signals <onboarding@resend.dev>",
    to: ALERT_EMAIL,
    subject: `BUY Signal: ${data.symbol} dropped below 200-day SMA`,
    html: buildHtml(data),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
