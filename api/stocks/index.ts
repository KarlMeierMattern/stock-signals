import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabase } from "../../lib/supabase";
import { addStockSchema } from "../../lib/schemas";
import { getQuote } from "../../lib/twelve-data";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === "GET") {
      return await listStocks(res);
    }
    if (req.method === "POST") {
      return await addStock(req, res);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}

async function listStocks(res: VercelResponse) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stocks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ stocks: data });
}

async function addStock(req: VercelRequest, res: VercelResponse) {
  const parsed = addStockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { symbol } = parsed.data;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("stocks")
    .select("id")
    .eq("symbol", symbol)
    .single();

  if (existing) {
    return res.status(409).json({ error: `${symbol} is already in your portfolio` });
  }

  let name: string | null = null;
  try {
    const quote = await getQuote(symbol);
    name = quote.name;
  } catch {
    // Symbol validation via Twelve Data — if it fails, symbol is likely invalid
    return res.status(400).json({ error: `Invalid or unsupported symbol: ${symbol}` });
  }

  const { data, error } = await supabase
    .from("stocks")
    .insert({ symbol, name })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(201).json({ stock: data });
}
