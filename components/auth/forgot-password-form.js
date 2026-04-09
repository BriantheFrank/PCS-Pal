"use client";

import { useState } from "react";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    setStatus("Sending reset link...");

    try {
      const supabase = await getBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw error;
      }
      setStatus("If an account exists, a password reset link has been sent.");
      event.currentTarget.reset();
    } catch (error) {
      setStatus(error?.message || "Unable to send reset link right now.");
    }
  };

  return (
    <form className="auth-form signup-page-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <button type="submit">Send reset link</button>
      <p className="signup-page-status">{status}</p>
    </form>
  );
}
