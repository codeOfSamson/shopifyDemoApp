import { NextRequest, NextResponse } from "next/server";
import { logger } from "@repo/utils";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  logger.info("web-vital", body);
  return NextResponse.json({ ok: true });
}
