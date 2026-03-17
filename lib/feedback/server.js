import crypto from "node:crypto";

import {
  buildFeedbackExcerpt,
  FEEDBACK_SOURCE,
  FEEDBACK_TYPE_OPTIONS,
  formatFeedbackTypeLabel,
  validateFeedbackSubmission,
} from "@/lib/feedback/shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

const DEFAULT_DIGEST_RECIPIENT = "athenaeumgroupllc@gmail.com";
const MAX_SUBMISSIONS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeEnv = (name) => String(process.env[name] || "").trim();

const formatDigestTimestamp = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));

const getDigestRecipientEmail = () =>
  normalizeEnv("FEEDBACK_DIGEST_TO_EMAIL") || DEFAULT_DIGEST_RECIPIENT;

const getDigestFromEmail = () => {
  const value = normalizeEnv("FEEDBACK_DIGEST_FROM_EMAIL");
  if (!value) {
    throw new Error("FEEDBACK_DIGEST_FROM_EMAIL is required to send the weekly feedback digest.");
  }
  return value;
};

const getResendApiKey = () => {
  const value = normalizeEnv("RESEND_API_KEY");
  if (!value) {
    throw new Error("RESEND_API_KEY is required to send the weekly feedback digest.");
  }
  return value;
};

const getObservedIp = (request) => {
  const forwardedForHeader = String(request.headers.get("x-forwarded-for") || "");
  const forwardedIp = forwardedForHeader
    .split(",")
    .map((segment) => segment.trim())
    .find(Boolean);

  return forwardedIp || String(request.headers.get("x-real-ip") || "").trim() || null;
};

const buildRequestIpHash = (request) => {
  const observedIp = getObservedIp(request);
  if (!observedIp) {
    return null;
  }

  const hashSalt =
    normalizeEnv("FEEDBACK_IP_HASH_SALT") || normalizeEnv("LEGAL_IP_HASH_SALT");

  return crypto
    .createHash("sha256")
    .update(`${hashSalt}::${observedIp}`)
    .digest("hex");
};

const resolveAuthenticatedUser = async ({ request, admin }) => {
  const authorizationHeader = String(request.headers.get("authorization") || "");
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const accessToken = authorizationHeader.slice(7).trim();
  if (!accessToken) {
    return null;
  }

  const { data, error } = await admin.auth.getUser(accessToken);
  if (error || !data?.user) {
    return null;
  }

  return data.user;
};

const enforceFeedbackRateLimit = async ({ admin, ipHash, userId }) => {
  if (!ipHash && !userId) {
    return;
  }

  let query = admin
    .from("feedback_submissions")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - ONE_HOUR_MS).toISOString());

  if (ipHash) {
    query = query.eq("ip_hash", ipHash);
  } else if (userId) {
    query = query.eq("user_id", userId);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(`Unable to apply feedback rate limiting: ${error.message}`);
  }

  if ((count || 0) >= MAX_SUBMISSIONS_PER_HOUR) {
    const rateLimitError = new Error(
      "Too many feedback submissions came from this device recently. Please try again in a little while."
    );
    rateLimitError.status = 429;
    throw rateLimitError;
  }
};

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const startOfUtcWeek = (date) => {
  const dayStart = startOfUtcDay(date);
  const daysSinceMonday = (dayStart.getUTCDay() + 6) % 7;
  return new Date(dayStart.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
};

const getWeeklyDigestWindow = (now = new Date()) => {
  const windowEnd = startOfUtcWeek(now);
  const windowStart = new Date(windowEnd.getTime() - ONE_WEEK_MS);
  return {
    windowStart,
    windowEnd,
  };
};

const summarizeFeedback = (submissions) => {
  const countsByType = Object.fromEntries(
    FEEDBACK_TYPE_OPTIONS.map((option) => [option.value, 0])
  );

  submissions.forEach((submission) => {
    if (countsByType[submission.feedback_type] !== undefined) {
      countsByType[submission.feedback_type] += 1;
    }
  });

  return {
    totalCount: submissions.length,
    countsByType,
  };
};

const loadDigestRun = async ({ admin, windowStartIso, windowEndIso }) => {
  const { data, error } = await admin
    .from("feedback_digest_runs")
    .select("*")
    .eq("window_start", windowStartIso)
    .eq("window_end", windowEndIso)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to read digest history: ${error.message}`);
  }

  return data;
};

const reserveDigestRun = async ({ admin, windowStartIso, windowEndIso, recipientEmail }) => {
  const existingRun = await loadDigestRun({
    admin,
    windowStartIso,
    windowEndIso,
  });

  if (existingRun?.status === "sent") {
    return {
      record: existingRun,
      status: "already_sent",
    };
  }

  if (existingRun?.status === "pending") {
    return {
      record: existingRun,
      status: "already_running",
    };
  }

  if (existingRun) {
    const { data, error } = await admin
      .from("feedback_digest_runs")
      .update({
        recipient_email: recipientEmail,
        status: "pending",
        error_message: null,
        provider_message_id: null,
        sent_at: null,
      })
      .eq("id", existingRun.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Unable to reserve feedback digest window: ${error.message}`);
    }

    return {
      record: data,
      status: "reserved",
    };
  }

  const { data, error } = await admin
    .from("feedback_digest_runs")
    .insert({
      window_start: windowStartIso,
      window_end: windowEndIso,
      recipient_email: recipientEmail,
      status: "pending",
    })
    .select("*")
    .single();

  if (!error) {
    return {
      record: data,
      status: "reserved",
    };
  }

  if (error.code === "23505") {
    const latestRun = await loadDigestRun({
      admin,
      windowStartIso,
      windowEndIso,
    });

    return {
      record: latestRun,
      status: latestRun?.status === "sent" ? "already_sent" : "already_running",
    };
  }

  throw new Error(`Unable to reserve feedback digest window: ${error.message}`);
};

const buildDigestEmail = ({ windowStart, windowEnd, submissions, summary }) => {
  const startLabel = formatDigestTimestamp(windowStart.toISOString());
  const endLabel = formatDigestTimestamp(windowEnd.toISOString());
  const summaryLines = FEEDBACK_TYPE_OPTIONS.map(
    (option) => `${option.label}: ${summary.countsByType[option.value] || 0}`
  );

  const groupedSubmissions = FEEDBACK_TYPE_OPTIONS.map((option) => ({
    ...option,
    items: submissions.filter((submission) => submission.feedback_type === option.value),
  }));

  const formatSubmissionItemHtml = (submission) => {
    const identity =
      submission.follow_up_email ||
      submission.user_email ||
      submission.user_id ||
      "Anonymous";

    return `<li style="margin-bottom: 18px;">
  <strong>${escapeHtml(formatFeedbackTypeLabel(submission.feedback_type))}</strong> - ${escapeHtml(submission.title)}<br />
  <span style="color: #5d6a73;">${escapeHtml(formatDigestTimestamp(submission.created_at))} UTC | ${escapeHtml(submission.page_path || "/")} | ${escapeHtml(String(identity))}</span><br />
  <span>${escapeHtml(buildFeedbackExcerpt(submission.message, 220))}</span>
</li>`;
  };

  const formatSubmissionItemText = (submission) => {
    const identity =
      submission.follow_up_email ||
      submission.user_email ||
      submission.user_id ||
      "Anonymous";

    return [
      `${formatFeedbackTypeLabel(submission.feedback_type)} - ${submission.title}`,
      `${formatDigestTimestamp(submission.created_at)} UTC | ${submission.page_path || "/"} | ${identity}`,
      buildFeedbackExcerpt(submission.message, 260),
    ].join("\n");
  };

  const htmlSections = groupedSubmissions
    .filter((group) => group.items.length > 0)
    .map(
      (group) => `<section style="margin-top: 24px;">
  <h2 style="margin-bottom: 10px;">${escapeHtml(group.label)} (${group.items.length})</h2>
  <ol style="padding-left: 20px;">
    ${group.items.map(formatSubmissionItemHtml).join("")}
  </ol>
</section>`
    )
    .join("");

  const textSections = groupedSubmissions
    .filter((group) => group.items.length > 0)
    .map((group) =>
      [
        `${group.label} (${group.items.length})`,
        group.items.map(formatSubmissionItemText).join("\n\n"),
      ].join("\n")
    )
    .join("\n\n");

  const subject = `PCS Pal weekly feedback digest: ${summary.totalCount} submission${
    summary.totalCount === 1 ? "" : "s"
  }`;

  return {
    subject,
    html: `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #22303b; line-height: 1.5;">
    <h1 style="margin-bottom: 8px;">PCS Pal weekly feedback digest</h1>
    <p style="margin-top: 0;">Window: ${escapeHtml(startLabel)} UTC to ${escapeHtml(endLabel)} UTC</p>
    <p><strong>Total submissions:</strong> ${summary.totalCount}</p>
    <ul>
      ${summaryLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
    </ul>
    ${htmlSections || "<p>No feedback submissions were recorded during this window.</p>"}
  </body>
</html>`,
    text: [
      "PCS Pal weekly feedback digest",
      `Window: ${startLabel} UTC to ${endLabel} UTC`,
      `Total submissions: ${summary.totalCount}`,
      ...summaryLines,
      "",
      textSections || "No feedback submissions were recorded during this window.",
    ].join("\n"),
  };
};

const sendFeedbackDigestEmail = async ({ windowStart, windowEnd, submissions, summary }) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getDigestFromEmail(),
      to: [getDigestRecipientEmail()],
      ...buildDigestEmail({
        windowStart,
        windowEnd,
        submissions,
        summary,
      }),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || "The email provider rejected the feedback digest request."
    );
  }

  return payload;
};

export const createFeedbackSubmission = async ({ request, payload }) => {
  const admin = getSupabaseAdminClient();
  const { values, errors, honeypotTriggered } = validateFeedbackSubmission(payload);

  if (honeypotTriggered) {
    return {
      accepted: true,
      submissionId: null,
      createdAt: new Date().toISOString(),
    };
  }

  if (Object.keys(errors).length > 0) {
    const validationError = new Error("Feedback validation failed.");
    validationError.status = 400;
    validationError.details = errors;
    throw validationError;
  }

  const [user, ipHash] = await Promise.all([
    resolveAuthenticatedUser({ request, admin }),
    Promise.resolve(buildRequestIpHash(request)),
  ]);

  await enforceFeedbackRateLimit({
    admin,
    ipHash,
    userId: user?.id || null,
  });

  const { data, error } = await admin
    .from("feedback_submissions")
    .insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      follow_up_email: values.followUpEmail || null,
      feedback_type: values.feedbackType,
      title: values.title,
      message: values.message,
      page_path: values.pagePath,
      browser_context: values.browserContext,
      experience_rating: values.experienceRating,
      status: "new",
      source: values.source || FEEDBACK_SOURCE,
      ip_hash: ipHash,
    })
    .select("id, created_at")
    .single();

  if (error) {
    throw new Error("Unable to save feedback right now. Please try again later.");
  }

  return {
    accepted: true,
    submissionId: data.id,
    createdAt: data.created_at,
  };
};

export const runWeeklyFeedbackDigest = async () => {
  const admin = getSupabaseAdminClient();
  const { windowStart, windowEnd } = getWeeklyDigestWindow();
  const windowStartIso = windowStart.toISOString();
  const windowEndIso = windowEnd.toISOString();
  const recipientEmail = getDigestRecipientEmail();

  const reservation = await reserveDigestRun({
    admin,
    windowStartIso,
    windowEndIso,
    recipientEmail,
  });

  if (reservation.status === "already_sent") {
    return {
      status: "already_sent",
      feedbackCount: reservation.record?.feedback_count || 0,
      windowStart: windowStartIso,
      windowEnd: windowEndIso,
    };
  }

  if (reservation.status === "already_running") {
    return {
      status: "already_running",
      feedbackCount: reservation.record?.feedback_count || 0,
      windowStart: windowStartIso,
      windowEnd: windowEndIso,
    };
  }

  const digestRunId = reservation.record?.id;

  const { data: submissions, error: submissionsError } = await admin
    .from("feedback_submissions")
    .select(
      "id, created_at, feedback_type, title, message, page_path, user_id, user_email, follow_up_email, experience_rating"
    )
    .gte("created_at", windowStartIso)
    .lt("created_at", windowEndIso)
    .order("created_at", { ascending: false });

  if (submissionsError) {
    throw new Error(`Unable to load feedback submissions: ${submissionsError.message}`);
  }

  const summary = summarizeFeedback(submissions || []);

  try {
    const emailResponse = await sendFeedbackDigestEmail({
      windowStart,
      windowEnd,
      submissions: submissions || [],
      summary,
    });

    const { error: digestInsertError } = await admin
      .from("feedback_digest_runs")
      .update({
        recipient_email: recipientEmail,
        status: "sent",
        feedback_count: summary.totalCount,
        summary_json: summary,
        provider_message_id: emailResponse?.id || null,
        error_message: null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", digestRunId);

    if (digestInsertError) {
      throw new Error(`Unable to record digest state: ${digestInsertError.message}`);
    }

    return {
      status: "sent",
      feedbackCount: summary.totalCount,
      windowStart: windowStartIso,
      windowEnd: windowEndIso,
    };
  } catch (error) {
    if (digestRunId) {
      await admin
        .from("feedback_digest_runs")
        .update({
          recipient_email: recipientEmail,
          status: "failed",
          feedback_count: summary.totalCount,
          summary_json: summary,
          error_message: String(error?.message || error),
        })
        .eq("id", digestRunId);
    }

    throw error;
  }
};
