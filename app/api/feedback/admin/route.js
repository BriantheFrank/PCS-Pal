import { NextResponse } from "next/server";

import {
  getFeedbackAdminDashboard,
  updateFeedbackSubmissionStatus,
} from "@/lib/feedback/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(request) {
  try {
    const result = await getFeedbackAdminDashboard({
      request,
      searchParams: request.nextUrl.searchParams,
    });

    return NextResponse.json(result, {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to load feedback review data right now.",
      },
      {
        status: error?.status || 500,
        headers: noStoreHeaders,
      }
    );
  }
}

export async function PATCH(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Feedback review updates must be valid JSON.",
      },
      {
        status: 400,
        headers: noStoreHeaders,
      }
    );
  }

  try {
    const result = await updateFeedbackSubmissionStatus({
      request,
      submissionId: payload?.submissionId,
      nextStatus: payload?.status,
    });

    return NextResponse.json(result, {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to update feedback status right now.",
      },
      {
        status: error?.status || 500,
        headers: noStoreHeaders,
      }
    );
  }
}
