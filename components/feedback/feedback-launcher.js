"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { FEEDBACK_SOURCE, FEEDBACK_TYPE_OPTIONS } from "@/lib/feedback/shared";

const initialStatus = {
  message: "",
  tone: "neutral",
  submitted: false,
};

const buildInitialFormState = (email = "") => ({
  feedbackType: FEEDBACK_TYPE_OPTIONS[0].value,
  title: "",
  message: "",
  followUpEmail: email,
  experienceRating: "",
  website: "",
});

const captureBrowserContext = () => {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    pageTitle: document.title || "",
    referrer: document.referrer || "",
    userAgent: window.navigator.userAgent || "",
    platform: window.navigator.platform || "",
    language: window.navigator.language || "",
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  };
};

export function FeedbackLauncher() {
  const pathname = usePathname();
  const { session, user } = useNativeAuth();
  const signedInEmail = user?.email || "";
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(() => buildInitialFormState(signedInEmail));
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (open) {
      setFormState((current) =>
        current.followUpEmail || !signedInEmail
          ? current
          : {
              ...current,
              followUpEmail: signedInEmail,
            }
      );
    }
  }, [open, signedInEmail]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setStatus(initialStatus);
  }, [pathname]);

  const currentPath = pathname || "/";

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormState(buildInitialFormState(signedInEmail));
    setStatus(initialStatus);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({
      message: "Sending feedback...",
      tone: "neutral",
      submitted: false,
    });

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...formState,
          pagePath:
            typeof window === "undefined"
              ? currentPath
              : `${window.location.pathname}${window.location.search || ""}` || currentPath,
          browserContext: captureBrowserContext(),
          source: FEEDBACK_SOURCE,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fieldMessage =
          payload?.details && typeof payload.details === "object"
            ? Object.values(payload.details).find(Boolean)
            : null;

        throw new Error(fieldMessage || payload?.error || "Unable to submit feedback right now.");
      }

      setStatus({
        message: "Thanks. Your feedback has been recorded for review.",
        tone: "success",
        submitted: true,
      });
      setFormState(buildInitialFormState(signedInEmail));
    } catch (error) {
      setStatus({
        message: error?.message || "Unable to submit feedback right now.",
        tone: "error",
        submitted: false,
      });
    }
  };

  return (
    <>
      <button
        type="button"
        className="feedback-trigger"
        onClick={() => {
          setOpen(true);
          setStatus(initialStatus);
        }}
      >
        Feedback
      </button>

      {open ? (
        <div
          className="feedback-modal-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <div>
                <p className="eyebrow">PCS Pal Feedback</p>
                <h2 id="feedback-modal-title">Report a bug, request a feature, or share feedback</h2>
              </div>
              <button
                type="button"
                className="feedback-close-button"
                aria-label="Close feedback form"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <p className="feedback-copy">
              Keep it short. Route context is attached automatically, and signed-in account details
              are added when they are available.
            </p>

            {status.submitted ? (
              <div className="info-panel signup-page-card">
                <p className="signup-page-status" data-tone={status.tone} aria-live="polite">
                  {status.message}
                </p>
                <div className="feedback-modal-actions">
                  <button type="button" className="auth-shell-button" onClick={() => setOpen(false)}>
                    Close
                  </button>
                  <button
                    type="button"
                    className="auth-create-account-link auth-create-account-link-secondary"
                    onClick={resetForm}
                  >
                    Send another note
                  </button>
                </div>
              </div>
            ) : (
              <form className="feedback-form" onSubmit={handleSubmit}>
                <label>
                  Feedback type
                  <select
                    value={formState.feedbackType}
                    onChange={(event) => handleChange("feedbackType", event.target.value)}
                  >
                    {FEEDBACK_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Short summary
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(event) => handleChange("title", event.target.value)}
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  Details
                  <textarea
                    rows="5"
                    value={formState.message}
                    onChange={(event) => handleChange("message", event.target.value)}
                    maxLength={4000}
                    required
                  ></textarea>
                </label>

                <label>
                  Follow-up email (optional)
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={formState.followUpEmail}
                    onChange={(event) => handleChange("followUpEmail", event.target.value)}
                    maxLength={320}
                  />
                </label>

                <label>
                  Experience rating (optional)
                  <select
                    value={formState.experienceRating}
                    onChange={(event) => handleChange("experienceRating", event.target.value)}
                  >
                    <option value="">No rating</option>
                    <option value="5">5 - Great</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Mixed</option>
                    <option value="2">2 - Frustrating</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </label>

                <input
                  type="text"
                  className="feedback-honeypot"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formState.website}
                  onChange={(event) => handleChange("website", event.target.value)}
                />

                <div className="feedback-route-context">
                  <strong>Current page:</strong> {currentPath}
                </div>

                <p className="signup-page-status" data-tone={status.tone} aria-live="polite">
                  {status.message}
                </p>

                <div className="feedback-modal-actions">
                  <button type="submit">Send feedback</button>
                  <button
                    type="button"
                    className="auth-shell-button"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
