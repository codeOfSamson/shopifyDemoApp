import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify";

export default async function CartPage() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get("cartId")?.value;
  console.log("cookieStore", cookieStore);
  console.log("cartId", cartId);

  if (!cartId) {
    return (
      <main>
        <h1>Your cart</h1>
        <p>
          No cart cookie found yet — add something from a product page first.
        </p>
      </main>
    );
  }

  const cart = await getCart(cartId);

  if (!cart) {
    return (
      <main>
        <h1>Your cart</h1>
        <p>
          Cookie has a cartId (<code>{cartId}</code>) but Shopify returned no
          cart for it — it may have expired or the ID is stale.
        </p>
      </main>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = cart.lines.edges.map((edge: any) => edge.node);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems = lines.map((line: any) => (
    <li key={line.id}>
      {line.merchandise.product.title} — {line.merchandise.title} ×{" "}
      {line.quantity} — {line.merchandise.price.amount}{" "}
      {line.merchandise.price.currencyCode}
    </li>
  ));

  return (
    <main>
      <h1>Your cart</h1>
      {lines.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <ul>
          {lineItems}
        </ul>
      )}
      <p>
        Total: {cart.cost.totalAmount.amount}{" "}
        {cart.cost.totalAmount.currencyCode}
      </p>
      <a href={cart.checkoutUrl}>Checkout</a>
    </main>
  );
}
