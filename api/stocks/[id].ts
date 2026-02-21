import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "../../lib/supabase.js";
import { deleteStockSchema } from "../../lib/schemas.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parsed = deleteStockSchema.safeParse({ id: req.query.id });
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid stock ID" });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("stocks")
      .delete()
      .eq("id", parsed.data.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ deleted: parsed.data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
