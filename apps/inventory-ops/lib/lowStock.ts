export const LOW_STOCK_THRESHOLD = 10;

export type StockStatus = "out" | "low" | "in-stock";

export function stockStatus(available: number, threshold: number = LOW_STOCK_THRESHOLD): StockStatus {
  if (available <= 0) return "out";
  if (available <= threshold) return "low";
  return "in-stock";
}
