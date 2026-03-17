import { NextResponse } from "next/server";

import { runWeeklyFeedbackDigest } from "@/lib/feedback/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getCronSecret = () => String(process.env.CRON_SECRET || "").trim();

export async function GET(request) {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "CRON_SECRET is required for the weekly feedback digest endpoint.",
      },
      { status: 500 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runWeeklyFeedbackDigest();
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to send the weekly feedback digest right now.",
      },
      { status: 500 }
    );
  }
}
