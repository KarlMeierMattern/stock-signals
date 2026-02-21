import type { CheckResult } from "../lib/sma-checker";

// Mock modules before imports
const mockGetStockData = jest.fn();
const mockSendSignalEmail = jest.fn();
const mockSupabaseFrom = jest.fn();

jest.mock("../lib/twelve-data", () => ({
  getStockData: (...args: unknown[]) => mockGetStockData(...args),
  delay: () => Promise.resolve(),
}));

jest.mock("../lib/email", () => ({
  sendSignalEmail: (...args: unknown[]) => mockSendSignalEmail(...args),
}));

jest.mock("../lib/supabase", () => ({
  getSupabase: () => ({ from: mockSupabaseFrom }),
}));

jest.mock("../lib/env", () => ({
  getEnv: () => ({
    TWELVE_DATA_API_KEY: "test",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test",
    RESEND_API_KEY: "test",
    CRON_SECRET: "test",
    ALERT_EMAIL: "test@example.com",
  }),
}));

import { checkAllStocks } from "../lib/sma-checker";

function mockSupabaseChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, jest.Mock> = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    returns: jest.fn(),
  };
  Object.assign(chain, overrides);
  for (const fn of Object.values(chain)) {
    if (typeof fn === "function" && !fn.mockReturnThis) {
      // default: return this for chaining
    }
  }
  return chain;
}

describe("checkAllStocks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when no stocks in portfolio", async () => {
    const stocksChain = mockSupabaseChain();
    stocksChain.returns = jest.fn().mockResolvedValue({ data: [], error: null });
    stocksChain.select = jest.fn().mockReturnValue({
      order: jest.fn().mockReturnValue(stocksChain),
      returns: stocksChain.returns,
    });
    mockSupabaseFrom.mockReturnValue(stocksChain);

    const results = await checkAllStocks();
    expect(results).toEqual([]);
  });

  it("alerts on crossover from above to below SMA", async () => {
    const stocks = [
      { id: "1", symbol: "AAPL", name: "Apple", last_sma_status: "above" },
    ];

    let callCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "stocks" && callCount === 0) {
        callCount++;
        return {
          select: jest.fn().mockReturnValue({
            returns: jest.fn().mockResolvedValue({ data: stocks, error: null }),
          }),
        };
      }
      if (table === "alerts") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      }
      // stocks update
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    mockGetStockData.mockResolvedValue({
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 145.0,
      sma200: 150.0,
    });

    mockSendSignalEmail.mockResolvedValue(undefined);

    const results = await checkAllStocks();

    expect(results).toHaveLength(1);
    expect(results[0].alerted).toBe(true);
    expect(results[0].status).toBe("below");
    expect(mockSendSignalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: "AAPL",
        price: 145.0,
        sma200: 150.0,
      })
    );
  });

  it("does not alert when already below SMA (no crossover)", async () => {
    const stocks = [
      { id: "1", symbol: "AAPL", name: "Apple", last_sma_status: "below" },
    ];

    let callCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "stocks" && callCount === 0) {
        callCount++;
        return {
          select: jest.fn().mockReturnValue({
            returns: jest.fn().mockResolvedValue({ data: stocks, error: null }),
          }),
        };
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    mockGetStockData.mockResolvedValue({
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 145.0,
      sma200: 150.0,
    });

    const results = await checkAllStocks();

    expect(results).toHaveLength(1);
    expect(results[0].alerted).toBe(false);
    expect(results[0].status).toBe("below");
    expect(mockSendSignalEmail).not.toHaveBeenCalled();
  });

  it("does not alert when price is above SMA", async () => {
    const stocks = [
      { id: "1", symbol: "AAPL", name: "Apple", last_sma_status: null },
    ];

    let callCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "stocks" && callCount === 0) {
        callCount++;
        return {
          select: jest.fn().mockReturnValue({
            returns: jest.fn().mockResolvedValue({ data: stocks, error: null }),
          }),
        };
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    mockGetStockData.mockResolvedValue({
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 160.0,
      sma200: 150.0,
    });

    const results = await checkAllStocks();

    expect(results).toHaveLength(1);
    expect(results[0].alerted).toBe(false);
    expect(results[0].status).toBe("above");
    expect(mockSendSignalEmail).not.toHaveBeenCalled();
  });

  it("handles API errors gracefully per stock", async () => {
    const stocks = [
      { id: "1", symbol: "BAD", name: null, last_sma_status: null },
    ];

    let callCount = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "stocks" && callCount === 0) {
        callCount++;
        return {
          select: jest.fn().mockReturnValue({
            returns: jest.fn().mockResolvedValue({ data: stocks, error: null }),
          }),
        };
      }
      return {
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    });

    mockGetStockData.mockRejectedValue(new Error("Symbol not found"));

    const results = await checkAllStocks();

    expect(results).toHaveLength(1);
    expect(results[0].error).toBe("Symbol not found");
    expect(results[0].alerted).toBe(false);
  });
});
