# Inventory micro-frontend portfolio pivot — design

## Context

This repo started as a small Shopify Storefront API practice exercise
(product page, cart, a CMS-style landing page, a webhook handler). The
goal now is to evolve it into a portfolio piece for a **Tech Inventory
Engineering, Senior Frontend Engineer** role. The JD emphasizes:
frontend architecture (incl. micro-frontends), shared component
libraries/design systems, modern React (Suspense, transitions), REST/
GraphQL integration, and lightweight testing/CI/observability.
Accessibility is explicitly deprioritized for this pass. Timeline: a
few days.

The existing Shopify Storefront integration (`lib/shopify.ts`,
`app/products`, `app/cart`, `app/lp`) is real and working against a
live dev store (`development-store-yaepbqzm.myshopify.com`) and stays
as-is, just relocated into the monorepo. All new inventory data is
**real Shopify data** (Admin API), not mocked — the user will populate
the dev store's catalog directly in Shopify admin.

## Goals

- Demonstrate a genuine micro-frontend split (two independently
  buildable/deployable Next.js apps), not just modular folders in one
  app.
- Demonstrate a shared design system / component library consumed by
  both apps.
- Demonstrate modern React data/UX patterns: streaming Suspense
  boundaries and `useTransition`-driven interactions against real,
  deliberately-slowed network calls.
- Keep testing, CI, and observability present but intentionally light
  — signal competence, not exhaustive coverage.
- Everything reads from the real Shopify dev store (Storefront API for
  the shop, Admin API for inventory) — no synthetic/mock datasets.

## Non-goals

- Accessibility audit/compliance work (explicitly deferred).
- A real observability backend (Datadog/Sentry) — a structured logger
  stand-in is sufficient.
- Exhaustive test coverage — a handful of meaningful tests per layer.
- Multi-tenant auth, user accounts, or write operations against
  inventory (read-only dashboard).

## Architecture

pnpm workspace monorepo:

```
apps/
  web/             existing storefront: product page, cart, landing
                    pages, webhooks. Relocated as-is from repo root.
                    Also hosts the shell nav that links into inventory.
  inventory-ops/    new. Small, separate Next.js app — the actual
                    micro-frontend. Inventory dashboard: stock levels,
                    low-stock flags, search/filter, a streamed
                    "reorder recommendations" panel.
packages/
  ui/               shared design system: Tailwind config + primitives
                    (Button, Input, Select, Badge, Table, Card,
                    AppShell/Sidebar, Toast, Skeleton). Consumed by
                    both apps.
  utils/            small shared helpers: `withLatency()` (artificial
                    delay wrapper for demoing loading states) and a
                    structured `logger`.
  config/           shared `tsconfig.base.json` and ESLint config.
```

`apps/web` mounts `apps/inventory-ops` via **Next.js Multi-Zones**:
`web`'s `next.config` rewrites `/inventory/:path*` to the
inventory-ops app's deployment URL (locally, a second dev server on
its own port); `inventory-ops` sets `basePath: "/inventory"`. The two
apps have independent `package.json`s, independent build/deploy
pipelines, and share code only through the `packages/*` workspace
packages — that's what makes this a real micro-frontend split rather
than a folder convention.

Root `package.json` gets workspace-wide scripts (`pnpm -r lint`,
`pnpm -r build`, etc.) via pnpm workspaces (no Turborepo — not enough
task-graph complexity here to justify it).

## Data layer

- `apps/web` keeps `lib/shopify.ts` (Storefront API) untouched.
- `apps/inventory-ops` gets `lib/shopifyAdmin.ts`: a fetch wrapper
  against Shopify's Admin GraphQL API (`SHOPIFY_ADMIN_API_ACCESS_TOKEN`,
  server-only env var — never exposed to the client, since Admin API
  tokens are highly privileged). Queries: paginated product list with
  variants, `inventoryItem.inventoryLevels` (quantity per location),
  and a search variant using Shopify's `query` string syntax
  (`title:*foo*`) for the live-search feature.
- **Prerequisite (manual, one-time, user-performed):** create a custom
  app in the Shopify dev store admin with `read_products`,
  `read_inventory`, `read_locations` scopes, generate an Admin API
  access token, add products/variants with stock in the dev store, and
  set `SHOPIFY_ADMIN_API_ACCESS_TOKEN` (+ reuse `SHOPIFY_STORE_DOMAIN`)
  in `apps/inventory-ops/.env.local`. Until that token is present,
  the dashboard renders a clear "connect your Admin API token" empty
  state instead of erroring.
- `withLatency()` from `packages/utils` wraps specific calls (the
  search/filter path and the "reorder recommendations" computation)
  with a randomized artificial delay — real Shopify calls are
  typically too fast to show meaningful loading UI, so this is what
  actually makes the Suspense/transition demo visible.

## React patterns showcase (inventory-ops)

- **Streaming Suspense:** the inventory list page is an async Server
  Component that renders the product/stock table immediately, while a
  separate "Reorder recommendations" panel (computed via a slower,
  latency-wrapped call) sits in its own `<Suspense>` boundary with a
  skeleton fallback — demonstrating out-of-order streaming, not just a
  single route-level loading state.
- **`useTransition`:** the search/filter input is a Client Component;
  typing calls a Server Action (through `withLatency`) wrapped in
  `startTransition`. `isPending` drives a subtle "stale while
  refreshing" treatment on the table (dimmed/disabled, not a blocking
  spinner), keeping the input itself responsive.

## Design system & styling

Tailwind CSS v4 in both apps, configured through the shared `ui`
package's tokens (spacing/color/type scale). Modern, simple, neutral
admin look: sidebar + content area for `inventory-ops`; the existing
`web` pages (product, cart, landing page) get restyled using the same
`ui` primitives for visual consistency across the two zones, since a
reviewer clicking between them should feel one product, not two
prototypes glued together.

## Testing

- **Unit/component (Jest + React Testing Library):** a few components
  in `packages/ui` (e.g. `Badge` low-stock variants, `Table` empty
  state) and the low-stock/threshold calculation utility in
  `inventory-ops`.
- **E2E (Playwright):** 2–3 flows — view inventory list with real
  data, filter to low-stock items, and the existing add-to-cart flow
  in `web`. Not exhaustive; enough to prove the harness and pattern.

## CI/CD

One GitHub Actions workflow, root-triggered: install (pnpm, cached) →
lint → typecheck → Jest → Playwright (smoke) → build both apps.
Kept as a single simple workflow file rather than a matrix — scope
matches "simple CI/CD" from the requirements, not a full release
pipeline.

## Observability (lightweight)

`packages/utils`'s `logger` gives structured (JSON) log lines instead
of bare `console.log`. `apps/web` wires Next's `useReportWebVitals`
to a `/api/observability` route handler that logs the metric —
a stand-in for "this is where a real APM/RUM vendor would plug in,"
without standing up real infrastructure.

## Migration of existing code

`app/`, `lib/`, existing routes and the webhook handlers move verbatim
into `apps/web/` (path aliases, `next.config`, env var names unchanged
where possible) — this is a relocation, not a rewrite, to avoid
regressing the working Shopify integration.

## Out of scope for this pass

Accessibility work, write/mutate operations on inventory, real
observability backend, auth, deployment automation beyond the CI
build/test workflow (a manual Vercel deploy is fine for the portfolio
link).
