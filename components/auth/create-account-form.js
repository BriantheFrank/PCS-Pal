"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { LEGAL_DOC_TYPES } from "@/legal-documents";
import {
  REQUIRED_LEGAL_ACKNOWLEDGMENT_MESSAGE,
  buildLegalAcceptancePayload,
  fetchLegalContext,
  getLegalVersionSnapshot,
  normalizeFullName,
  resolveLegalDocumentHref,
  signUpWithEmail,
} from "@/lib/auth/create-account";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

const CLOUD_SIGNUP_UNAVAILABLE_MESSAGE = "Cloud sign-up is unavailable right now. Please try again later.";
const LEGAL_REGISTRY_UNAVAILABLE_MESSAGE =
  "Account creation is unavailable right now. Please refresh and try again.";
const LEGAL_VERSION_UNAVAILABLE_MESSAGE =
  "Current legal document versions are unavailable right now. Please try again in a moment.";
const LOADING_SIGNUP_MESSAGE = "Getting account setup ready";
const REDIRECT_TARGET = "/military-pcs-checklist";

export function CreateAccountForm() {
  const { status: sessionStatus, user, legalDocs, legalDocsAuthoritative, errorMessage } =
    useNativeAuth();
  const [submitState, setSubmitState] = useState({
    message: "",
    tone: "neutral",
    isSubmitting: false,
  });

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    window.location.replace(new URL(REDIRECT_TARGET, window.location.origin).toString());
  }, [user]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      setSubmitState((current) =>
        current.message
          ? current
          : {
              message: LOADING_SIGNUP_MESSAGE,
              tone: "neutral",
              isSubmitting: false,
            }
      );
      return;
    }

    if (sessionStatus === "error") {
      setSubmitState((current) =>
        current.message
          ? current
          : {
              message: errorMessage || CLOUD_SIGNUP_UNAVAILABLE_MESSAGE,
              tone: "error",
              isSubmitting: false,
            }
      );
      return;
    }

    setSubmitState((current) =>
      current.isSubmitting ||
      (current.message &&
        current.message !== LOADING_SIGNUP_MESSAGE &&
        current.message !== CLOUD_SIGNUP_UNAVAILABLE_MESSAGE &&
        current.message !== errorMessage)
        ? current
        : {
            message: "",
            tone: "neutral",
            isSubmitting: false,
          }
    );
  }, [errorMessage, sessionStatus]);

  const termsHref = useMemo(
    () => resolveLegalDocumentHref(LEGAL_DOC_TYPES.terms, legalDocs),
    [legalDocs]
  );
  const privacyHref = useMemo(
    () => resolveLegalDocumentHref(LEGAL_DOC_TYPES.privacy, legalDocs),
    [legalDocs]
  );
  const versionSnapshot = useMemo(() => getLegalVersionSnapshot(legalDocs), [legalDocs]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (typeof window === "undefined") {
      return;
    }

    const form = event.currentTarget;
    const formElements = form.elements;
    const legalAcknowledgmentInput = formElements.namedItem("required_legal_acknowledgment");
    if (legalAcknowledgmentInput instanceof HTMLInputElement) {
      legalAcknowledgmentInput.setCustomValidity("");
    }

    const formData = new FormData(form);
    const fullName = normalizeFullName(String(formData.get("full_name") || ""));
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");
    const marketingConsent = formData.get("marketing_consent") === "on";
    const legalAcknowledged = formData.get("required_legal_acknowledgment") === "on";

    if (!legalAcknowledged && legalAcknowledgmentInput instanceof HTMLInputElement) {
      legalAcknowledgmentInput.setCustomValidity(REQUIRED_LEGAL_ACKNOWLEDGMENT_MESSAGE);
      legalAcknowledgmentInput.reportValidity();
      return;
    }

    if (sessionStatus === "loading") {
      setSubmitState({
        message: LOADING_SIGNUP_MESSAGE,
        tone: "neutral",
        isSubmitting: false,
      });
      return;
    }

    if (sessionStatus === "error") {
      setSubmitState({
        message: errorMessage || CLOUD_SIGNUP_UNAVAILABLE_MESSAGE,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    if (!legalDocsAuthoritative) {
      setSubmitState({
        message: LEGAL_REGISTRY_UNAVAILABLE_MESSAGE,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    if (!versionSnapshot.termsVersion || !versionSnapshot.privacyVersion) {
      setSubmitState({
        message: LEGAL_VERSION_UNAVAILABLE_MESSAGE,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    let supabase;
    try {
      supabase = await getBrowserSupabaseClient();
    } catch (_error) {
      setSubmitState({
        message: CLOUD_SIGNUP_UNAVAILABLE_MESSAGE,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    const legalContext = await fetchLegalContext();
    const legalAcceptance = buildLegalAcceptancePayload({
      versionSnapshot,
      legalContext,
    });

    setSubmitState({
      message: "Creating your account...",
      tone: "neutral",
      isSubmitting: true,
    });

    const { data, error } = await signUpWithEmail(supabase, {
      fullName,
      email,
      password,
      marketingConsent,
      legalAcceptance,
    });

    if (error) {
      setSubmitState({
        message: error.message,
        tone: "error",
        isSubmitting: false,
      });
      return;
    }

    form.reset();

    if (data.session) {
      setSubmitState({
        message: "Account created. Taking you to your saved plans...",
        tone: "success",
        isSubmitting: false,
      });
      window.location.replace(new URL(REDIRECT_TARGET, window.location.origin).toString());
      return;
    }

    setSubmitState({
      message: "Account created. Check your email to confirm, then use the sign-in page to access your workspace.",
      tone: "success",
      isSubmitting: false,
    });
  };

  return (
    <div className="info-panel signup-page-card">
      <p className="eyebrow">New Account</p>
      <h2>Set up your planning space</h2>
      <p>
        Add your name, email address, and password to get started. Email confirmation helps keep your move information connected to your account.
      </p>
      <p className="signup-page-legal-note">
        PCS Pal is a planning and organizational service, not official government, legal, tax, or
        financial advice.
      </p>
      <p className="signup-page-status" data-tone={submitState.tone} aria-live="polite">
        {submitState.message}
      </p>
      <form className="auth-form signup-page-form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input type="text" name="full_name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm password
          <input type="password" name="confirm_password" autoComplete="new-password" minLength={8} required />
        </label>
        <div className="signup-legal-block">
          <label className="account-checkbox signup-consent-checkbox">
            <input
              type="checkbox"
              name="required_legal_acknowledgment"
              onInput={(event) => {
                event.currentTarget.setCustomValidity("");
              }}
              required
            />
            <span>
              I agree to the <Link href={termsHref}>Terms of Use</Link> and acknowledge the{" "}
              <Link href={privacyHref}>Privacy Policy</Link>.
            </span>
          </label>
          <p className="signup-legal-version-note">
            Current legal versions: <span>{versionSnapshot.termsVersion}</span> and{" "}
            <span>{versionSnapshot.privacyVersion}</span>.
          </p>
          <label className="account-checkbox signup-consent-checkbox">
            <input type="checkbox" name="marketing_consent" />
            <span>I want occasional PCS Pal updates and partner offers. Optional.</span>
          </label>
        </div>
        <button
          type="submit"
          disabled={
            submitState.isSubmitting || sessionStatus === "loading" || sessionStatus === "error"
          }
        >
          {submitState.isSubmitting ? "Creating your account..." : "Create account"}
        </button>
      </form>
      <div className="signup-page-actions">
        <Link className="auth-create-account-link signup-page-link" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
