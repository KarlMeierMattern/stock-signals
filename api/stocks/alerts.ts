import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "../../lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("triggered_at", { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ alerts: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
