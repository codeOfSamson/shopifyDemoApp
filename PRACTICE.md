# Practice exercises (do these before reading the reference code)

These mirror the two things the JD says you'll own in the first 60 days:
PDP conversion fixes, and a landing-page-per-creative system marketing can
run without you. Time-box yourself — the real paid trial is "small."

## Exercise 1 — PDP audit fix (≈30–45 min)
Pretend a PDP audit flagged: "Add-to-cart button shows no loading/error
state; if a variant is out of stock, the button still submits and users
see a raw Shopify error." Fix it:
- Disable/relabel the button when the selected variant is unavailable
  (Storefront API exposes `availableForSale` on variants).
- Add a pending state (`useFormStatus` / `useTransition`) so double-clicks
  can't fire two mutations.
- Catch the cart API error and show a friendly inline message instead of
  letting it throw.

## Exercise 2 — Cache revalidation (≈20 min, this is the screening question)
Without looking at `lib/shopify.ts`, write from scratch:
- A product fetch tagged so it can be invalidated on demand.
- A cart mutation that is guaranteed never to be served from the shared
  edge/data cache.
- One sentence on *why* those two need different caching treatment.

## Exercise 3 — Landing-page-per-creative (≈45 min, stretch)
Marketing wants to launch `/lp/[slug]` pages tied to ad creatives, each
possibly pointing at a different product/variant/discount, without
opening a PR. Sketch (code or just a short design doc):
- Where the slug → product/offer mapping lives (Shopify metafields? a
  headless CMS entry? a JSON config?) so marketing can edit it without you.
- How the page stays fast (static generation + `generateStaticParams`,
  or ISR with a short revalidate) even though content changes often.
- How you'd avoid this turning into an uncapped, ungoverned page sprawl.

There's no single right answer to Exercise 3 — they're testing judgment
about ownership and guardrails, not a specific tech choice.
