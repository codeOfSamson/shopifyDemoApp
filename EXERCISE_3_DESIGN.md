# Exercise 3 — landing-page-per-creative (`/lp/[slug]`)

## Data source: headless CMS entry (e.g. Sanity)

- New "Landing Page" document type: `slug`, linked product handle (or variant ID + discount code), campaign name, flight start/end dates, status (draft/published/archived).
- Marketing edits directly in the CMS UI — no PR, no engineering involvement per campaign.
- CMS owns the slug → offer mapping only. Shopify stays the source of truth for product/price/inventory — the CMS never duplicates catalog data, just points at it.

## Rendering: on-demand tag revalidation

- `/lp/[slug]/page.tsx` fetches the CMS entry by slug, then the linked Shopify product — both tagged (`lp:${slug}`, `product:${handle}`).
- CMS webhook (fires on publish) hits a route handler that calls `revalidateTag('lp:${slug}')` — same mechanism as the existing `products/update` Shopify webhook.
- Result: cached indefinitely between edits, near-zero staleness right after a publish. No polling, no timer-based guesswork.
- Known/high-traffic campaigns can be pre-rendered via `generateStaticParams` pulling live slugs from the CMS at build time; anything created after deploy falls back to on-demand generation and gets cached going forward — same pattern already sketched in `app/products/[handle]/page.tsx`.

## Guardrails against sprawl

- **Naming/expiry convention** — slug pattern enforced in the CMS schema (required `campaignId` field), plus a required flight end date. Expired entries (`status !== 'live' after endDate`) stop resolving instead of staying live forever as orphaned pages.
- **Cap + monitoring** — a dashboard listing every live `/lp/*` page with owner + expiry, and an alert if the live-page count or creation rate crosses a threshold. Catches sprawl early without gatekeeping every publish.
- Deliberately **no separate approval workflow** on top of this. The CMS's own draft → publish state already gives a lightweight review point; adding a second gate would just reintroduce engineering as the bottleneck this exercise is designed to remove.

## Why these tradeoffs

Ties back to what production ownership actually looks like here: self-serve speed for marketing (CMS + on-demand revalidation, no PR in the loop), and instrumented ownership for engineering (tag-based invalidation instead of timers, monitoring instead of manual review) — rather than either overbuilding process or leaving the door open to unbounded page sprawl.
