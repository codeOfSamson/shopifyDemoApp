# Tech Inventory — Shopify-backed micro-frontend demo

A two-zone Next.js portfolio project: a real Shopify Storefront-API shop
(`apps/web`) and a real Shopify Admin-API inventory dashboard
(`apps/inventory-ops`), independently built/deployed and mounted together
via **Next.js Multi-Zones**, sharing a design system (`packages/ui`) and
a couple of small cross-cutting utilities (`packages/utils`). All data is
live — there is no mock dataset anywhere in this repo.

## Architecture

```
apps/
  web/             storefront: PDP, cart, CMS-style landing pages,
                    Shopify webhook receiver. Talks to the Storefront API.
  inventory-ops/    inventory dashboard: stock levels, low-stock flags,
                    live search, a streamed "reorder recommendations"
                    panel. Talks to the Admin API. Mounted at /inventory.
packages/
  ui/               shared Tailwind-based design system (Button, Badge,
                    Input, Card, Table, Skeleton, AppShell).
  utils/            structured logger + an artificial-latency wrapper
                    used to make Suspense/useTransition loading states
                    visible against Shopify's normally-fast responses.
  config/           shared tsconfig base.
```

`apps/web` reverse-proxies `/inventory/*` to `apps/inventory-ops` (Next.js
Multi-Zones) — the two apps have independent `package.json`s and build
pipelines, sharing code only through the `packages/*` workspace packages.

## React patterns on display

- **Streaming Suspense**: the inventory page's "Reorder recommendations"
  panel is a separately-awaited async Server Component in its own
  `<Suspense>` boundary, so it visibly streams in after the main table.
- **`useTransition`**: the inventory search box calls a Server Action
  wrapped in `startTransition`, keeping the input responsive while
  `isPending` drives a "stale while refreshing" table treatment.

## Setup

### 1. Shopify dev store (free, ~10 min)

1. Create a free store at https://www.shopify.com/partners → Stores →
   Add store → "Development store".
2. Add a few products with variants and stock quantities.
3. **Storefront API** (for `apps/web`): Settings → Apps and sales
   channels → Develop apps → Create an app → enable Storefront API
   scopes → install → copy the token into `apps/web/.env.local`
   (`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`).
4. **Admin API** (for `apps/inventory-ops`): same app (or a new one) →
   Admin API integration → enable `read_products`, `read_inventory`,
   `read_locations` → install → copy the token into
   `apps/inventory-ops/.env.local` (`SHOPIFY_STORE_DOMAIN`,
   `SHOPIFY_ADMIN_API_ACCESS_TOKEN`). See
   `apps/inventory-ops/.env.local.example`.

### 2. Install & run

```bash
pnpm install
pnpm dev   # runs both apps concurrently: web on :3000, inventory-ops on :3001
```

Visit `http://localhost:3000` for the shop, `http://localhost:3000/inventory`
for the dashboard (proxied from :3001 through the Multi-Zones rewrite).

### 3. Tests

```bash
pnpm -r test              # Jest unit/component tests (packages/ui, packages/utils, inventory-ops)
pnpm exec playwright test # e2e — requires both .env.local files populated with real tokens
```

### 4. CI

`.github/workflows/ci.yml` runs lint/typecheck/test/build on every push.
`.github/workflows/e2e.yml` is manually triggered (`workflow_dispatch`) —
Playwright hits the real external Shopify store, which is a deliberately
excluded dependency from the main push-gated pipeline.
