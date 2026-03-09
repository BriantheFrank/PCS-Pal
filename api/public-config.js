module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const googleAuthEnabled = process.env.SUPABASE_ENABLE_GOOGLE_AUTH === "true";

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      error:
        "Missing SUPABASE_URL or SUPABASE_ANON_KEY. Configure Vercel/project environment variables.",
    });
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    googleAuthEnabled,
  });
};
