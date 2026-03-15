import { NextResponse } from "next/server";

import { getSupabaseRuntimeConfig } from "@/lib/supabase/runtime-config";

export const dynamic = "force-dynamic";

export function GET() {
  const config = getSupabaseRuntimeConfig();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Configure Vercel/project environment variables.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
