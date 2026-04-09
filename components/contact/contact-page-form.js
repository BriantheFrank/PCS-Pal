"use client";

import { useEffect, useState } from "react";

const CONTACT_REASON_OPTIONS = [
  { id: "ask_question", feedbackType: "general_feedback", label: "Ask a question" },
  { id: "report_problem", feedbackType: "bug_problem", label: "Report a problem" },
  { id: "suggest_feature", feedbackType: "feature_request", label: "Suggest a feature" },
  { id: "request_correction", feedbackType: "bug_problem", label: "Request a correction" },
  { id: "general_feedback", feedbackType: "general_feedback", label: "General feedback" },
];

const initialState = {
  name: "",
  email: "",
  contactReason: CONTACT_REASON_OPTIONS[0].id,
  message: "",
  issuePage: "",
};

const initialStatus = {
  message: "",
  tone: "neutral",
  submitted: false,
};

export function ContactPageForm() {
  const [formState, setFormState] = useState(initialState);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const message = params.get("message");
    if (topic || message) {
      setFormState((current) => ({
        ...current,
        contactReason: topic || current.contactReason,
        message: message || current.message,
      }));
    }
  }, []);

  const selectedReason =
    CONTACT_REASON_OPTIONS.find((option) => option.id === formState.contactReason) ||
    CONTACT_REASON_OPTIONS[0];

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setStatus({ message: "Sending your message...", tone: "neutral", submitted: false });

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedbackType: selectedReason.feedbackType,
          title: `Contact request: ${formState.name || "New message"}`,
          message:
            `${formState.message}\n\nNeed help with: ${selectedReason.label}` +
            (formState.issuePage ? `\nPage where this came up: ${formState.issuePage}` : ""),
          followUpEmail: formState.email,
          pagePath: "/contact",
          source: "contact_page",
          website: "",
          browserContext: {},
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Your message could not be sent right now. Please try again.");
      }

      setFormState(initialState);
      setStatus({
        message: "Thanks for reaching out. We received your message and will review it.",
        tone: "success",
        submitted: true,
      });
    } catch (error) {
      setStatus({
        message: error?.message || "Your message could not be sent right now. Please try again.",
        tone: "error",
        submitted: false,
      });
    }
  };

  return (
    <section className="info-panel legal-page-section">
      <h2>Send a message</h2>
      <p className="signup-page-status" data-tone={status.tone} aria-live="polite">
        {status.message}
      </p>
      <p className="account-copy">
        Use the form below and include as much detail as you can so we can review your message more quickly.
      </p>
      <form className="auth-form signup-page-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            type="text"
            name="name"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={formState.email}
            onChange={(event) => handleChange("email", event.target.value)}
            required
          />
        </label>
        <label>
          What do you need help with?
          <select
            name="contactReason"
            value={formState.contactReason}
            onChange={(event) => handleChange("contactReason", event.target.value)}
          >
            {CONTACT_REASON_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Message
          <textarea
            rows="6"
            name="message"
            value={formState.message}
            onChange={(event) => handleChange("message", event.target.value)}
            minLength={12}
            required
          ></textarea>
        </label>
        <label>
          Page where you found the issue (optional)
          <input
            type="text"
            name="issuePage"
            value={formState.issuePage}
            onChange={(event) => handleChange("issuePage", event.target.value)}
          />
        </label>
        <button type="submit">Send message</button>
      </form>
    </section>
  );
}
