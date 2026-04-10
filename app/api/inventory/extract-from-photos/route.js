import { NextResponse } from "next/server";

import { extractInventoryFromPhotos } from "@/lib/inventory-extraction/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Extraction request payload must be valid JSON.",
      },
      {
        status: 400,
        headers: noStoreHeaders,
      }
    );
  }

  try {
    const result = await extractInventoryFromPhotos({ request, payload });

    return NextResponse.json(result, {
      status: 200,
      headers: noStoreHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to extract inventory from photos right now.",
        details: error?.details || null,
      },
      {
        status: error?.status || 500,
        headers: noStoreHeaders,
      }
    );
  }
}
