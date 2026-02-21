import { addStockSchema, deleteStockSchema } from "../lib/schemas";

describe("addStockSchema", () => {
  it("accepts valid uppercase symbol", () => {
    const result = addStockSchema.safeParse({ symbol: "AAPL" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.symbol).toBe("AAPL");
  });

  it("uppercases and trims input", () => {
    const result = addStockSchema.safeParse({ symbol: " msft " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.symbol).toBe("MSFT");
  });

  it("rejects empty symbol", () => {
    const result = addStockSchema.safeParse({ symbol: "" });
    expect(result.success).toBe(false);
  });

  it("rejects symbol longer than 10 chars", () => {
    const result = addStockSchema.safeParse({ symbol: "ABCDEFGHIJK" });
    expect(result.success).toBe(false);
  });

  it("rejects missing symbol", () => {
    const result = addStockSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("deleteStockSchema", () => {
  it("accepts valid UUID", () => {
    const result = deleteStockSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    const result = deleteStockSchema.safeParse({ id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = deleteStockSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
