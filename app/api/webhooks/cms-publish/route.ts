import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Register this as the CMS's publish webhook (in Sanity: Manage > API >
// Webhooks). Same on-demand invalidation pattern as
// app/api/webhooks/products-update/route.ts, different source system —
// a landing page's cache stays valid indefinitely until the CMS says
// something published/changed.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.CMS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = await req.json();
  const slug = payload.slug as string | undefined;

  if (slug) {
    revalidateTag(`lp:${slug}`);
  }

  return NextResponse.json({ ok: true });
}
