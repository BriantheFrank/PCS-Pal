import { createClient } from "@supabase/supabase-js";

let runtimeConfigPromise;
let browserClientPromise;

export const loadPublicRuntimeConfig = async () => {
  if (!runtimeConfigPromise) {
    runtimeConfigPromise = fetch("/api/public-config", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error("Cloud configuration is unavailable.");
      }

      const config = await response.json();
      if (!config.supabaseUrl || !config.supabaseAnonKey) {
        throw new Error("Supabase URL or anon key is missing.");
      }

      return config;
    });
  }

  return runtimeConfigPromise;
};

export const getBrowserSupabaseClient = async () => {
  if (typeof window === "undefined") {
    throw new Error("Browser Supabase client is only available in the browser.");
  }

  if (!browserClientPromise) {
    browserClientPromise = loadPublicRuntimeConfig().then((config) =>
      createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    );
  }

  return browserClientPromise;
};

export const preloadBrowserSupabaseClient = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  return getBrowserSupabaseClient();
};
