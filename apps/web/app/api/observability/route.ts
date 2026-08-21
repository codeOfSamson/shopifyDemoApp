import { NextRequest, NextResponse } from "next/server";
import { logger } from "@repo/utils";

export async function POST(req: NextRequest) {
  const body = await req.json();
  logger.info("web-vital", body);
  return NextResponse.json({ ok: true });
}
