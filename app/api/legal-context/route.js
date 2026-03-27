import crypto from "node:crypto";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request) {
  const forwardedForHeader = String(request.headers.get("x-forwarded-for") || "");
  const observedIp = forwardedForHeader
    .split(",")
    .map((segment) => segment.trim())
    .find(Boolean);
  const ipHashSalt = String(process.env.LEGAL_IP_HASH_SALT || "").trim();
  const ipHash = observedIp && ipHashSalt
    ? crypto
        .createHash("sha256")
        .update(`${ipHashSalt}::${observedIp}`)
        .digest("hex")
    : null;

  return NextResponse.json(
    {
      observedAt: new Date().toISOString(),
      ipHash,
      ipHashMethod: ipHash ? "sha256_salted" : observedIp ? "unavailable_missing_salt" : "unavailable",
      userAgent: String(request.headers.get("user-agent") || ""),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
