"use client";

import { useRef, useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Request-sequencing guard: rapid typing can fire several searches whose
  // responses resolve out of order. Only the response matching the latest
  // request id is applied, so a slower earlier response can't clobber a
  // fresher one.
  const latestRequestId = useRef(0);

  function handleChange(value: string) {
    setQuery(value);
    const requestId = ++latestRequestId.current;
    startTransition(async () => {
      try {
        const products = await searchInventory(value);
        if (requestId !== latestRequestId.current) return;
        setRows(flattenRows(products));
        setError(null);
      } catch (err) {
        if (requestId !== latestRequestId.current) return;
        console.error(err);
        setError("Couldn't search inventory right now. Try again.");
      }
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
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
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
