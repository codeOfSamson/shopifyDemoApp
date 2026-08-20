// Stand-in for a real headless CMS (e.g. Sanity) client. Swap the body of
// fetchLandingPageBySlug for a real `@sanity/client` query — the exported
// function's signature and caching wrapper stay the same.

import { unstable_cache } from "next/cache";

export type LandingPage = {
  slug: string;
  campaignId: string;
  productHandle: string;
  discountCode?: string;
  status: "draft" | "published" | "archived";
  endDate?: string; // ISO date; page stops resolving after this
};

// Mock CMS content — replace with a real Sanity query in production.
const LANDING_PAGES: LandingPage[] = [
  {
    slug: "summer-sale-ig",
    campaignId: "SUMMER24",
    productHandle: "shoes",
    discountCode: "SUMMER10",
    status: "published",
    endDate: "2026-09-30",
  },
];

async function fetchLandingPageBySlug(
  slug: string,
): Promise<LandingPage | null> {
  const entry = LANDING_PAGES.find((lp) => lp.slug === slug);
  if (!entry) return null;

  // Naming/expiry guardrail: unpublished or expired entries don't resolve.
  const expired = entry.endDate ? new Date(entry.endDate) < new Date() : false;
  if (entry.status !== "published" || expired) return null;

  return entry;
}

// unstable_cache is the tag-based caching primitive for non-fetch data
// sources (DB calls, SDK calls) — same revalidateTag mechanism as the
// fetch-based Shopify reads, just without a raw fetch() to attach next.tags to.
export const getLandingPageBySlug = (slug: string) =>
  unstable_cache(() => fetchLandingPageBySlug(slug), ["landing-page", slug], {
    tags: [`lp:${slug}`],
  })();
