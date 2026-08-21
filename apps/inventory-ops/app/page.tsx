import { Card, Table, Badge, type TableColumn } from "@repo/ui";
import { hasAdminCredentials, listInventoryProducts } from "@/lib/shopifyAdmin";
import { flattenRows, type InventoryRow } from "@/lib/inventoryRow";
import { stockStatus } from "@/lib/lowStock";

const columns: TableColumn<InventoryRow>[] = [
  { key: "product", header: "Product", render: (row) => row.productTitle },
  { key: "variant", header: "Variant", render: (row) => row.variantTitle },
  { key: "sku", header: "SKU", render: (row) => row.sku ?? "—" },
  { key: "price", header: "Price", render: (row) => `$${row.price}` },
  {
    key: "stock",
    header: "Stock",
    render: (row) => {
      const status = stockStatus(row.available);
      const tone = status === "out" ? "danger" : status === "low" ? "warning" : "success";
      const label =
        status === "out" ? "Out of stock" : status === "low" ? `Low (${row.available})` : `${row.available} in stock`;
      return <Badge tone={tone}>{label}</Badge>;
    },
  },
];

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
      <Table<InventoryRow> columns={columns} rows={rows} getRowKey={(row) => row.key} emptyMessage="No products found." />
    </div>
  );
}
