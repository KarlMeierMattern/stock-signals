import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkAllStocks } from "../../lib/sma-checker";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const results = await checkAllStocks();
    const alerted = results.filter((r) => r.alerted);
    const errors = results.filter((r) => r.error);

    return res.status(200).json({
      processed: results.length,
      alerted: alerted.length,
      errors: errors.length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
