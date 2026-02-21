import { getEnv } from "./env.js";

const BASE_URL = "https://api.twelvedata.com";

type QuoteResponse = {
  symbol: string;
  name: string;
  close: string;
  previous_close: string;
  is_market_open: boolean;
};

type SmaResponse = {
  values: Array<{ datetime: string; sma: string }>;
};

type TwelveDataError = {
  code: number;
  message: string;
  status: string;
};

async function fetchTwelveData<T>(path: string, params: Record<string, string>): Promise<T> {
  const { TWELVE_DATA_API_KEY } = getEnv();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("apikey", TWELVE_DATA_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Twelve Data API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status === "error") {
    const err = data as TwelveDataError;
    throw new Error(`Twelve Data API error: ${err.message}`);
  }

  return data as T;
}

export async function getQuote(symbol: string) {
  const data = await fetchTwelveData<QuoteResponse>("/quote", { symbol });
  return {
    symbol: data.symbol,
    name: data.name,
    price: parseFloat(data.close),
  };
}

export async function getSma200(symbol: string) {
  const data = await fetchTwelveData<SmaResponse>("/sma", {
    symbol,
    interval: "1day",
    time_period: "200",
    outputsize: "1",
  });

  if (!data.values?.length) {
    throw new Error(`No SMA data returned for ${symbol}`);
  }

  return parseFloat(data.values[0].sma);
}

export async function getStockData(symbol: string) {
  const [quote, sma200] = await Promise.all([
    getQuote(symbol),
    getSma200(symbol),
  ]);

  return {
    symbol: quote.symbol,
    name: quote.name,
    price: quote.price,
    sma200,
  };
}

const RATE_LIMIT_DELAY_MS = 8_000;

export function delay(ms: number = RATE_LIMIT_DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
