"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { resolveSafeNextPath } from "@/lib/auth/navigation";

const CLOUD_UNAVAILABLE_MESSAGE = "We could not open sign-in right now. Please refresh and try again.";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user, errorMessage, signInWithEmail } = useNativeAuth();
  const [submitState, setSubmitState] = useState({
    message: "",
    tone: "neutral",
    isSubmitting: false,
  });
  const nextPath = useMemo(
    () => resolveSafeNextPath(searchParams.get("next"), "/military-pcs-checklist"),
    [searchParams]
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    router.replace(nextPath);
  }, [nextPath, router, user]);

  useEffect(() => {
    if (status !== "error") {
      return;
    }

    setSubmitState((current) =>
      current.message
        ? current
        : {
            message: errorMessage || CLOUD_UNAVAILABLE_MESSAGE,
            tone: "error",
            isSubmitting: false,
          }
    );
  }, [errorMessage, status]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (status === "error") {
      setSubmitState({
        message: errorMessage || CLOUD_UNAVAILABLE_MESSAGE,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setSubmitState({
      message: "Opening your account...",
      tone: "neutral",
      isSubmitting: true,
    });

    const { error } = await signInWithEmail(email, password);
    if (error) {
      setSubmitState({
        message: error.message,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    setSubmitState({
      message: "Signed in. Taking you to your saved plans...",
      tone: "success",
      isSubmitting: false,
    });
    router.replace(nextPath);
  };

  return (
    <div className="info-panel signup-page-card">
      <p className="eyebrow">Sign In</p>
      <h2>Return to your PCS Pal workspace</h2>
      <p>
        Sign in with the email and password already tied to your checklist, inventory, and logistics
        details.
      </p>
      <p className="signup-page-status" data-tone={submitState.tone} aria-live="polite">
        {submitState.message}
      </p>
      <form className="auth-form signup-page-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <Link className="text-link" href="/forgot-password">
          Forgot password?
        </Link>
        <button type="submit" disabled={submitState.isSubmitting || status === "error"}>
          {submitState.isSubmitting ? "Opening your account..." : "Sign in"}
        </button>
      </form>
      <div className="signup-page-actions">
        <Link className="auth-create-account-link signup-page-link" href="/create-account">
          Create account
        </Link>
      </div>
    </div>
  );
}
