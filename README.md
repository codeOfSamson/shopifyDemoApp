# Headless Shopify Trial Practice

A reference mini-storefront that exercises the exact skills the 99Brands/HLTH
role needs: Storefront API reads with tag-based revalidation, a cart flow
that correctly avoids the shared cache, and a webhook that keeps product
data fresh. Read `PRACTICE.md` first — do the exercises yourself before
reading the reference code.

## 1. Get a real Shopify dev store (free, ~10 min)

1. Go to https://www.shopify.com/partners and create a free Partner account.
2. In the Partner dashboard: Stores → Add store → "Development store" →
   pick "Create a store to test and build."
3. Add a couple of products (Products → Add product) with variants so you
   have real handles/inventory to query.
4. Settings → Apps and sales channels → Develop apps → Create an app.
   - Enable Storefront API scopes: `unauthenticated_read_product_listings`,
     `unauthenticated_write_checkouts` (or cart mutation scopes), etc.
   - Install the app, copy the **Storefront API access token**.
5. Fill in `.env.local` (copy from `.env.example`) with your store domain
   and token.

## 2. Install & run

```bash
npm install
npm run dev
```

## 3. Files

- `lib/shopify.ts` — thin GraphQL client for the Storefront API
- `app/products/[handle]/page.tsx` — PDP: tagged, revalidatable product fetch
- `app/cart/actions.ts` — Server Actions for cart mutations (no-store by design)
- `app/api/cart/route.ts` — Route Handler alternative to Server Actions
- `app/api/webhooks/products-update/route.ts` — webhook receiver that calls
  `revalidateTag` when Shopify tells you a product changed

## 4. Wiring up the real webhook (optional, for full realism)

Shopify won't reach `localhost`. Use the Shopify CLI's tunnel or `ngrok`,
register the webhook (Settings → Notifications → Webhooks, or via the Admin
API) pointing at `https://<tunnel>/api/webhooks/products-update`, then edit
a product's title in the Shopify admin and watch the PDP update without a
full redeploy.
# shopifyDemoApp
