import { getSupabase } from "./supabase";
import { getStockData, delay } from "./twelve-data";
import { sendSignalEmail } from "./email";
import type { Stock } from "./schemas";

export type CheckResult = {
  symbol: string;
  price: number;
  sma200: number;
  status: "above" | "below";
  alerted: boolean;
  error?: string;
};

export async function checkAllStocks(): Promise<CheckResult[]> {
  const supabase = getSupabase();

  const { data: stocks, error } = await supabase
    .from("stocks")
    .select("*")
    .returns<Stock[]>();

  if (error) throw new Error(`Failed to fetch stocks: ${error.message}`);
  if (!stocks?.length) return [];

  const results: CheckResult[] = [];

  for (let i = 0; i < stocks.length; i++) {
    const stock = stocks[i];

    try {
      const data = await getStockData(stock.symbol);
      const status: "above" | "below" = data.price < data.sma200 ? "below" : "above";
      const crossedBelow = status === "below" && stock.last_sma_status !== "below";

      if (crossedBelow) {
        const percentBelow = ((data.sma200 - data.price) / data.sma200) * 100;

        await sendSignalEmail({
          symbol: data.symbol,
          name: data.name || stock.symbol,
          price: data.price,
          sma200: data.sma200,
          percentBelow,
        });

        await supabase.from("alerts").insert({
          stock_id: stock.id,
          symbol: stock.symbol,
          price: data.price,
          sma_200: data.sma200,
        });
      }

      await supabase
        .from("stocks")
        .update({ last_sma_status: status, name: data.name || stock.name })
        .eq("id", stock.id);

      results.push({
        symbol: stock.symbol,
        price: data.price,
        sma200: data.sma200,
        status,
        alerted: crossedBelow,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        symbol: stock.symbol,
        price: 0,
        sma200: 0,
        status: "above",
        alerted: false,
        error: message,
      });
    }

    // Rate limit: 8 req/min on free tier. We make 2 calls per stock,
    // so wait 16s between stocks to stay safely within limits.
    if (i < stocks.length - 1) {
      await delay(16_000);
    }
  }

  return results;
}
