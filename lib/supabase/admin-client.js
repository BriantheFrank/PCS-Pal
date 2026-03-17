import { createClient } from "@supabase/supabase-js";

let adminClient;

const getRequiredEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is required for server-side feedback operations.`);
  }
  return value;
};

export const getSupabaseAdminClient = () => {
  if (!adminClient) {
    adminClient = createClient(getRequiredEnv("SUPABASE_URL"), getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
};
