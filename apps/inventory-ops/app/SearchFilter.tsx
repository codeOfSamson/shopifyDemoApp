"use client";

import { useState, useTransition } from "react";
import { Badge, Input, Table, type TableColumn } from "@repo/ui";
import { stockStatus } from "@/lib/lowStock";
import { flattenRows, type InventoryRow } from "@/lib/inventoryRow";
import { searchInventory } from "./actions";

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

export function SearchFilter({ initialRows }: { initialRows: InventoryRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    setQuery(value);
    startTransition(async () => {
      const products = await searchInventory(value);
      setRows(flattenRows(products));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search inventory by product title…"
        aria-label="Search inventory"
      />
      <div className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}>
        <Table<InventoryRow>
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.key}
          emptyMessage="No matching products."
        />
      </div>
    </div>
  );
}
