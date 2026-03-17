"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import {
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  formatFeedbackStatusLabel,
  formatFeedbackTypeLabel,
} from "@/lib/feedback/shared";

const FEEDBACK_TYPE_FILTER_OPTIONS = [{ value: "all", label: "All types" }, ...FEEDBACK_TYPE_OPTIONS];

const createInitialSummary = () => ({
  totalCount: 0,
  countsByStatus: Object.fromEntries(FEEDBACK_STATUS_OPTIONS.map((option) => [option.value, 0])),
  countsByType: Object.fromEntries(FEEDBACK_TYPE_OPTIONS.map((option) => [option.value, 0])),
});

const initialDashboardState = {
  loading: false,
  error: "",
  errorStatus: 0,
  items: [],
  summary: createInitialSummary(),
  viewer: null,
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Unknown";

const formatBrowserContext = (browserContext) => {
  const parts = [];

  if (browserContext?.pageTitle) {
    parts.push(browserContext.pageTitle);
  }

  if (browserContext?.platform) {
    parts.push(browserContext.platform);
  }

  if (browserContext?.language) {
    parts.push(browserContext.language);
  }

  if (browserContext?.viewportWidth && browserContext?.viewportHeight) {
    parts.push(`${browserContext.viewportWidth}x${browserContext.viewportHeight}`);
  }

  return parts.join(" | ");
};

export function AdminFeedbackPage() {
  const router = useRouter();
  const { status, user, session } = useNativeAuth();
  const [filters, setFilters] = useState({
    status: "new",
    feedbackType: "all",
  });
  const [dashboard, setDashboard] = useState(initialDashboardState);
  const [updatingSubmissionId, setUpdatingSubmissionId] = useState("");

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/account/feedback");
    }
  }, [router, status, user]);

  useEffect(() => {
    if (status !== "ready" || !user || !session?.access_token) {
      return;
    }

    let cancelled = false;

    const loadDashboard = async () => {
      setDashboard((current) => ({
        ...current,
        loading: true,
        error: "",
        errorStatus: 0,
      }));

      try {
        const searchParams = new URLSearchParams({
          status: filters.status,
          feedbackType: filters.feedbackType,
          limit: "50",
        });

        const response = await fetch(`/api/feedback/admin?${searchParams.toString()}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw Object.assign(
            new Error(payload?.error || "Unable to load submitted feedback right now."),
            { status: response.status }
          );
        }

        if (cancelled) {
          return;
        }

        setDashboard({
          loading: false,
          error: "",
          errorStatus: 0,
          items: payload.items || [],
          summary: payload.summary || createInitialSummary(),
          viewer: payload.viewer || null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDashboard((current) => ({
          ...current,
          loading: false,
          error: error?.message || "Unable to load submitted feedback right now.",
          errorStatus: error?.status || 500,
        }));
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [filters.feedbackType, filters.status, session?.access_token, status, user, user?.id]);

  if (status === "loading") {
    return (
      <div className="info-panel signup-page-card">
        <p className="eyebrow">Feedback Review</p>
        <h2>Loading internal feedback review</h2>
        <p className="signup-page-status" aria-live="polite">
          Checking your session and loading the latest submissions.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="info-panel signup-page-card">
        <p className="eyebrow">Feedback Review</p>
        <h2>Redirecting to sign in</h2>
        <p className="signup-page-status" aria-live="polite">
          You need to sign in before reviewing submitted feedback.
        </p>
      </div>
    );
  }

  const handleStatusUpdate = async (submissionId, nextStatus) => {
    setUpdatingSubmissionId(submissionId);
    setDashboard((current) => ({
      ...current,
      error: "",
      errorStatus: 0,
    }));

    try {
      const response = await fetch("/api/feedback/admin", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          status: nextStatus,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update feedback status right now.");
      }

      setDashboard((current) => {
        const nextItems = current.items
          .map((item) => (item.id === submissionId ? payload.item : item))
          .filter((item) => (filters.status === "all" ? true : item.status === filters.status));

        const nextCountsByStatus = {
          ...current.summary.countsByStatus,
        };

        const previousItem = current.items.find((item) => item.id === submissionId);
        if (previousItem && previousItem.status !== payload.item.status) {
          nextCountsByStatus[previousItem.status] = Math.max(
            0,
            (nextCountsByStatus[previousItem.status] || 0) - 1
          );
          nextCountsByStatus[payload.item.status] =
            (nextCountsByStatus[payload.item.status] || 0) + 1;
        }

        return {
          ...current,
          items: nextItems,
          summary: {
            ...current.summary,
            countsByStatus: nextCountsByStatus,
          },
        };
      });
    } catch (error) {
      setDashboard((current) => ({
        ...current,
        error: error?.message || "Unable to update feedback status right now.",
        errorStatus: 500,
      }));
    } finally {
      setUpdatingSubmissionId("");
    }
  };

  const accessDenied = dashboard.errorStatus === 403;

  return (
    <div className="account-page-layout">
      <section className="info-panel signup-page-card account-page-column">
        <p className="eyebrow">Internal Review</p>
        <h2>Submitted feedback</h2>
        <p>
          Review new product feedback, triage by status, and keep the queue moving without opening
          Supabase for every pass.
        </p>
        <p className="legal-settings-status" aria-live="polite" data-tone={dashboard.error ? "error" : "neutral"}>
          {dashboard.error ||
            (dashboard.viewer?.email
              ? `Signed in as ${dashboard.viewer.email}.`
              : "Allowlisted internal accounts can review submitted feedback here.")}
        </p>

        {accessDenied ? (
          <div className="feedback-admin-empty">
            <p>
              This account is not allowlisted for internal feedback review. Add the account email to
              `FEEDBACK_ADMIN_EMAILS` in Vercel to grant access.
            </p>
            <p>
              <Link href="/account">Back to account settings</Link>
            </p>
          </div>
        ) : (
          <>
            <section className="account-settings-block">
              <h3>Queue summary</h3>
              <div className="feedback-admin-chip-row">
                <button
                  type="button"
                  className={`feedback-admin-chip ${filters.status === "all" ? "is-active" : ""}`}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      status: "all",
                    }))
                  }
                >
                  All ({dashboard.summary.totalCount})
                </button>
                {FEEDBACK_STATUS_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`feedback-admin-chip ${filters.status === option.value ? "is-active" : ""}`}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        status: option.value,
                      }))
                    }
                  >
                    {option.label} ({dashboard.summary.countsByStatus[option.value] || 0})
                  </button>
                ))}
              </div>
              <div className="feedback-admin-filters">
                <label>
                  Filter by type
                  <select
                    value={filters.feedbackType}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        feedbackType: event.target.value,
                      }))
                    }
                  >
                    {FEEDBACK_TYPE_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="auth-shell-button"
                  onClick={() =>
                    setFilters({
                      status: "new",
                      feedbackType: "all",
                    })
                  }
                >
                  Reset filters
                </button>
              </div>
            </section>

            <section className="account-settings-block">
              <h3>Submissions</h3>
              {dashboard.loading ? (
                <p className="legal-settings-status" aria-live="polite">
                  Loading submitted feedback...
                </p>
              ) : dashboard.items.length === 0 ? (
                <div className="feedback-admin-empty">
                  <p>No feedback submissions match the current filters.</p>
                </div>
              ) : (
                <div className="feedback-admin-list">
                  {dashboard.items.map((item) => {
                    const browserContextSummary = formatBrowserContext(item.browser_context);
                    const isUpdating = updatingSubmissionId === item.id;

                    return (
                      <article className="feedback-admin-card" key={item.id}>
                        <div className="feedback-admin-card-header">
                          <div className="feedback-admin-card-heading">
                            <p className="feedback-admin-meta">
                              {formatDateTime(item.created_at)} | {item.page_path || "/"} |{" "}
                              {item.identity}
                            </p>
                            <h4>{item.title}</h4>
                          </div>
                          <div className="feedback-admin-badge-row">
                            <span className="feedback-admin-badge feedback-admin-badge-type">
                              {formatFeedbackTypeLabel(item.feedback_type)}
                            </span>
                            <span
                              className={`feedback-admin-badge feedback-admin-badge-status feedback-status-${item.status}`}
                            >
                              {formatFeedbackStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>

                        <p className="feedback-admin-message">{item.message}</p>

                        <dl className="account-meta feedback-admin-details">
                          <div>
                            <dt>Follow-up</dt>
                            <dd>{item.follow_up_email || item.user_email || "Not provided"}</dd>
                          </div>
                          <div>
                            <dt>Signed-in user</dt>
                            <dd>{item.user_id || "Anonymous"}</dd>
                          </div>
                          <div>
                            <dt>Rating</dt>
                            <dd>{item.experience_rating ? `${item.experience_rating} / 5` : "No rating"}</dd>
                          </div>
                          <div>
                            <dt>Browser context</dt>
                            <dd>{browserContextSummary || "No browser context captured"}</dd>
                          </div>
                        </dl>

                        <div className="feedback-admin-actions">
                          {FEEDBACK_STATUS_OPTIONS.map((option) => (
                            <button
                              type="button"
                              key={option.value}
                              className={option.value === item.status ? "auth-shell-button" : ""}
                              disabled={option.value === item.status || isUpdating}
                              onClick={() => handleStatusUpdate(item.id, option.value)}
                            >
                              {isUpdating && option.value !== item.status
                                ? "Saving..."
                                : `Mark ${option.label.toLowerCase()}`}
                            </button>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </section>

      <aside className="info-panel signup-page-card account-page-side">
        <p className="eyebrow">Operator Notes</p>
        <h2>Review workflow</h2>
        <ul className="signup-page-list">
          <li>New submissions appear here as soon as they are stored in Supabase.</li>
          <li>Use the status chips to focus on `new`, `reviewed`, or `archived` items.</li>
          <li>Use the status buttons on each item to move it through triage.</li>
          <li>
            The weekly digest still lands in `athenaeumgroupllc@gmail.com`, but this route gives a
            faster in-app review surface between digests.
          </li>
        </ul>
        <p className="account-copy">
          Internal route: <code>/account/feedback</code>. This page is intentionally `noindex` and
          only works for allowlisted operator accounts.
        </p>
      </aside>
    </div>
  );
}
