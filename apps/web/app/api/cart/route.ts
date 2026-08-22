import { NextRequest, NextResponse } from "next/server";
import { addCartLine } from "@/lib/shopify";

// Some teams prefer a Route Handler over Server Actions for cart ops
// (e.g. if a separate client app also needs to hit it). Either way,
// the critical line is the same: this must never be cached at the edge.
export async function POST(req: NextRequest) {
  const { cartId, merchandiseId } = await req.json();

  const result = await addCartLine(cartId, merchandiseId);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store", // belt-and-suspenders alongside fetch's no-store
    },
  });
}
