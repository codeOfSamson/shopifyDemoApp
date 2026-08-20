import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

// Register this URL as a `products/update` webhook (Admin API or Shopify
// admin UI). This is the "on demand" half of the caching answer — product
// pages stay cached indefinitely until Shopify tells us something changed.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Always verify Shopify's HMAC signature — an unauthenticated endpoint
  // that can trigger revalidation is a cheap DoS vector otherwise.
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (digest !== hmac) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const handle = payload.handle as string | undefined;

  if (handle) {
    revalidateTag(`product:${handle}`);
  }

  return NextResponse.json({ ok: true });
}
