"use server";

import { listInventoryProducts, type InventoryProduct } from "@/lib/shopifyAdmin";
import { withLatency } from "@repo/utils";

const searchInventorySlowly = withLatency(
  async (query: string): Promise<InventoryProduct[]> => {
    const { products } = await listInventoryProducts({
      first: 50,
      searchQuery: query ? `title:*${query}*` : undefined,
    });
    return products;
  },
  { minMs: 400, maxMs: 1000 },
);

export async function searchInventory(query: string): Promise<InventoryProduct[]> {
  return searchInventorySlowly(query);
}
