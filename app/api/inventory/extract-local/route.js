import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DORMANT_MESSAGE =
  "Photo extraction is not active in this build yet. Save room photos now and add items manually.";

export async function POST() {
  return NextResponse.json(
    {
      error: DORMANT_MESSAGE,
      code: "EXTRACTION_DORMANT",
      localOnly: true,
    },
    {
      status: 501,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
