import type { InventoryProduct } from "./shopifyAdmin";

export type InventoryRow = {
  key: string;
  productTitle: string;
  variantTitle: string;
  sku: string | null;
  price: string;
  available: number;
};

export function flattenRows(products: InventoryProduct[]): InventoryRow[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      key: variant.id,
      productTitle: product.title,
      variantTitle: variant.title,
      sku: variant.sku,
      price: variant.price,
      available: variant.available,
    })),
  );
}
