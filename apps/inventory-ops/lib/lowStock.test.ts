import { stockStatus, LOW_STOCK_THRESHOLD } from "./lowStock";

describe("stockStatus", () => {
  it("returns 'out' when available is 0 or less", () => {
    expect(stockStatus(0)).toBe("out");
    expect(stockStatus(-1)).toBe("out");
  });

  it("returns 'low' when available is at or below the threshold", () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD)).toBe("low");
    expect(stockStatus(1)).toBe("low");
  });

  it("returns 'in-stock' when available is above the threshold", () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD + 1)).toBe("in-stock");
  });

  it("respects a custom threshold", () => {
    expect(stockStatus(5, 2)).toBe("in-stock");
    expect(stockStatus(2, 2)).toBe("low");
  });
});
