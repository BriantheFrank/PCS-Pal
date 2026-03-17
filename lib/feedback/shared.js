export const FEEDBACK_SOURCE = "web_app";

export const FEEDBACK_TYPE_OPTIONS = [
  { value: "bug_problem", label: "Bug / Problem" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general_feedback", label: "General Feedback" },
];

export const FEEDBACK_TYPE_LABELS = Object.fromEntries(
  FEEDBACK_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

export const FEEDBACK_LIMITS = {
  titleMin: 4,
  titleMax: 120,
  messageMin: 12,
  messageMax: 4000,
  pagePathMax: 255,
  emailMax: 320,
  pageTitleMax: 160,
  userAgentMax: 512,
  platformMax: 120,
  languageMax: 32,
  referrerMax: 255,
};

const FEEDBACK_TYPES = new Set(FEEDBACK_TYPE_OPTIONS.map((option) => option.value));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeInlineText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeMultilineText = (value) =>
  String(value ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

const truncate = (value, maxLength) => String(value || "").slice(0, maxLength);

export const formatFeedbackTypeLabel = (value) => FEEDBACK_TYPE_LABELS[value] || "Feedback";

export const buildFeedbackExcerpt = (value, maxLength = 180) => {
  const normalized = normalizeMultilineText(value).replace(/\s+/g, " ");
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

export const sanitizeBrowserContext = (context) => {
  const source = context && typeof context === "object" ? context : {};

  const candidate = {
    pageTitle: truncate(normalizeInlineText(source.pageTitle), FEEDBACK_LIMITS.pageTitleMax),
    referrer: truncate(normalizeInlineText(source.referrer), FEEDBACK_LIMITS.referrerMax),
    userAgent: truncate(normalizeInlineText(source.userAgent), FEEDBACK_LIMITS.userAgentMax),
    platform: truncate(normalizeInlineText(source.platform), FEEDBACK_LIMITS.platformMax),
    language: truncate(normalizeInlineText(source.language), FEEDBACK_LIMITS.languageMax),
    viewportWidth: Number.isFinite(Number(source.viewportWidth))
      ? Math.max(0, Math.round(Number(source.viewportWidth)))
      : null,
    viewportHeight: Number.isFinite(Number(source.viewportHeight))
      ? Math.max(0, Math.round(Number(source.viewportHeight)))
      : null,
  };

  return Object.fromEntries(
    Object.entries(candidate).filter(([, value]) => value !== "" && value !== null)
  );
};

export const validateFeedbackSubmission = (input) => {
  const values = {
    feedbackType: normalizeInlineText(input?.feedbackType),
    title: truncate(normalizeInlineText(input?.title), FEEDBACK_LIMITS.titleMax),
    message: truncate(normalizeMultilineText(input?.message), FEEDBACK_LIMITS.messageMax),
    followUpEmail: truncate(normalizeInlineText(input?.followUpEmail).toLowerCase(), FEEDBACK_LIMITS.emailMax),
    pagePath: truncate(normalizeInlineText(input?.pagePath) || "/", FEEDBACK_LIMITS.pagePathMax),
    source: truncate(normalizeInlineText(input?.source) || FEEDBACK_SOURCE, 32),
    website: truncate(normalizeInlineText(input?.website), 80),
    browserContext: sanitizeBrowserContext(input?.browserContext),
    experienceRating: null,
  };

  const numericRating = Number(input?.experienceRating);
  if (Number.isInteger(numericRating) && numericRating >= 1 && numericRating <= 5) {
    values.experienceRating = numericRating;
  }

  const errors = {};

  if (!FEEDBACK_TYPES.has(values.feedbackType)) {
    errors.feedbackType = "Choose a feedback type.";
  }

  if (values.title.length < FEEDBACK_LIMITS.titleMin) {
    errors.title = "Add a short summary so the feedback is easier to triage.";
  }

  if (values.message.length < FEEDBACK_LIMITS.messageMin) {
    errors.message = "Add a little more detail so the issue or idea is understandable.";
  }

  if (values.followUpEmail && !EMAIL_PATTERN.test(values.followUpEmail)) {
    errors.followUpEmail = "Enter a valid email address or leave it blank.";
  }

  if (!values.pagePath.startsWith("/") || values.pagePath.startsWith("//")) {
    errors.pagePath = "Feedback route context is invalid.";
  }

  return {
    values,
    errors,
    honeypotTriggered: Boolean(values.website),
  };
};
