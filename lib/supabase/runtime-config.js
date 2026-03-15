export const getSupabaseRuntimeConfig = () => ({
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  googleAuthEnabled: process.env.SUPABASE_ENABLE_GOOGLE_AUTH === "true",
});
