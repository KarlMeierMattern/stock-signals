import { z } from "zod";

export const addStockSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(10)
    .transform((s) => s.toUpperCase().trim()),
});

export const deleteStockSchema = z.object({
  id: z.string().uuid(),
});

export type Stock = {
  id: string;
  symbol: string;
  name: string | null;
  last_sma_status: "above" | "below" | null;
  created_at: string;
  updated_at: string;
};

export type Alert = {
  id: string;
  stock_id: string;
  symbol: string;
  price: number;
  sma_200: number;
  triggered_at: string;
};
