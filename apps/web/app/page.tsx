import Link from "next/link";
import { Card } from "@repo/ui";

// Lightweight, honest landing page — no mock catalog listing here (this
// project doesn't fabricate Shopify data anywhere). Links straight to a
// known real product handle instead of pretending to be a full PLP.
// Link styling mirrors @repo/ui's Button visual language (see Button.tsx's
// `primary`/`secondary` variant classes) since Button itself renders a
// <button>, not a link. Uses next/link (both destinations are in this
// same app) rather than a plain <a>, unlike the intentionally
// full-page-load cross-zone nav links in TopNav/AppShell.
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">Tech Inventory Shop</h1>
        <p className="mt-2 text-sm text-slate-600">
          A real Shopify Storefront-API-backed shop. Start with a product,
          add it to your cart, then check the checkout flow.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/products/shoes"
            className="inline-flex items-center justify-center rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            View a product
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            View cart
          </Link>
        </div>
      </Card>
    </main>
  );
}
