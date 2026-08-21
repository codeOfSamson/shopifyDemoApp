import { Suspense } from "react";
import { Card, Skeleton } from "@repo/ui";
import { hasAdminCredentials, listInventoryProducts } from "@/lib/shopifyAdmin";
import { flattenRows } from "@/lib/inventoryRow";
import { SearchFilter } from "./SearchFilter";
import { ReorderRecommendations } from "./ReorderRecommendations";

export default async function InventoryPage() {
  if (!hasAdminCredentials()) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">Connect your Shopify Admin API token</h1>
        <p className="mt-2 text-sm text-slate-600">
          Set <code>SHOPIFY_ADMIN_API_ACCESS_TOKEN</code> and <code>SHOPIFY_STORE_DOMAIN</code> in{" "}
          <code>apps/inventory-ops/.env.local</code> to see live inventory data here.
        </p>
      </Card>
    );
  }

  const { products } = await listInventoryProducts({ first: 50 });
  const rows = flattenRows(products);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Inventory</h1>
      <SearchFilter initialRows={rows} />
      <Suspense
        fallback={
          <Card>
            <Skeleton className="h-24 w-full" />
          </Card>
        }
      >
        <ReorderRecommendations products={products} />
      </Suspense>
    </div>
  );
}
