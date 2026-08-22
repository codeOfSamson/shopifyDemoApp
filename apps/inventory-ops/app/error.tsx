"use client";

import { Card, Button } from "@repo/ui";

// Standard Next.js App Router error boundary — catches anything thrown
// while rendering this app's routes (e.g. a bad/revoked Admin API token)
// so a reviewer never sees a raw stack trace, mirroring the "never let a
// raw error reach the user" discipline in apps/web/app/cart/AddToCartButton.tsx.
export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <Card className="max-w-md">
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          Couldn&apos;t load the inventory dashboard. This is usually a bad or
          revoked Shopify Admin API token — check{" "}
          <code>SHOPIFY_ADMIN_API_ACCESS_TOKEN</code> in{" "}
          <code>apps/inventory-ops/.env.local</code>.
        </p>
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error.message}
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
