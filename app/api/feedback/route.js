import { NextResponse } from "next/server";

import { createFeedbackSubmission } from "@/lib/feedback/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Feedback submissions must be valid JSON.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await createFeedbackSubmission({
      request,
      payload,
    });

    return NextResponse.json(result, {
      status: 201,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.status === 400
            ? "Please review the feedback form and try again."
            : error?.message || "Unable to submit feedback right now. Please try again later.",
        details: error?.details || null,
      },
      {
        status: error?.status || 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
