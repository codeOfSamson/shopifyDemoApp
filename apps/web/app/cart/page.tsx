import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify";
import { Card, Table, type TableColumn } from "@repo/ui";

type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    title: string;
    price: { amount: string; currencyCode: string };
    product: { title: string };
  };
};

const columns: TableColumn<CartLine>[] = [
  { key: "product", header: "Product", render: (line) => line.merchandise.product.title },
  { key: "variant", header: "Variant", render: (line) => line.merchandise.title },
  { key: "qty", header: "Qty", render: (line) => String(line.quantity) },
  {
    key: "price",
    header: "Price",
    render: (line) => `${line.merchandise.price.amount} ${line.merchandise.price.currencyCode}`,
  },
];

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;

  if (!cartId) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <Card>
          <h1 className="text-2xl font-semibold">Your cart</h1>
          <p className="mt-2 text-sm text-slate-600">
            No cart cookie found yet — add something from a product page first.
          </p>
        </Card>
      </main>
    );
  }

  const cart = await getCart(cartId);

  if (!cart) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <Card>
          <h1 className="text-2xl font-semibold">Your cart</h1>
          <p className="mt-2 text-sm text-slate-600">
            Cookie has a cartId (<code>{cartId}</code>) but Shopify returned no cart for it — it may have
            expired or the ID is stale.
          </p>
        </Card>
      </main>
    );
  }

  const lines: CartLine[] = cart.lines.edges.map((edge: { node: CartLine }) => edge.node);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">Your cart</h1>
        <div className="mt-4">
          <Table<CartLine> columns={columns} rows={lines} getRowKey={(line) => line.id} emptyMessage="Your cart is empty." />
        </div>
        <p className="mt-4 text-right text-lg font-medium">
          Total: {cart.cost.totalAmount.amount} {cart.cost.totalAmount.currencyCode}
        </p>
        <a href={cart.checkoutUrl} className="mt-4 inline-block text-brand-600 hover:underline">
          Checkout
        </a>
      </Card>
    </main>
  );
}
