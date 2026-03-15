import {
  LEGAL_DOC_FALLBACKS,
  LEGAL_DOC_TYPES,
  createFallbackLegalDocs,
} from "@/legal-documents";

export const REQUIRED_LEGAL_ACKNOWLEDGMENT_MESSAGE =
  "Please agree to the Terms of Use and acknowledge the Privacy Policy to create an account.";

const LEGAL_DOCUMENT_FIELDS =
  "doc_type, title, version, effective_date, url, review_status, content_hash";

const LEGAL_ROUTE_ALIASES = Object.freeze({
  "terms-of-use.html": "/terms",
  "/terms-of-use.html": "/terms",
  terms: "/terms",
  "/terms": "/terms",
  "privacy-policy.html": "/privacy",
  "/privacy-policy.html": "/privacy",
  privacy: "/privacy",
  "/privacy": "/privacy",
});

export const normalizeFullName = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");

export const buildLegalDocumentState = (documents = []) => {
  const legalDocs = createFallbackLegalDocs();

  documents.forEach((document) => {
    if (!document?.doc_type) {
      return;
    }

    legalDocs[document.doc_type] = {
      docType: document.doc_type,
      title: document.title || LEGAL_DOC_FALLBACKS[document.doc_type]?.title || "Legal Document",
      version: document.version || LEGAL_DOC_FALLBACKS[document.doc_type]?.version || "",
      effectiveDate:
        document.effective_date || LEGAL_DOC_FALLBACKS[document.doc_type]?.effectiveDate || "",
      url: document.url || LEGAL_DOC_FALLBACKS[document.doc_type]?.url || "",
      reviewStatus:
        document.review_status === "attorney_reviewed"
          ? "Attorney reviewed"
          : LEGAL_DOC_FALLBACKS[document.doc_type]?.reviewStatus || "Draft pending attorney review",
      reviewStatusCode:
        document.review_status ||
        LEGAL_DOC_FALLBACKS[document.doc_type]?.reviewStatusCode ||
        "draft_pending_attorney_review",
      contentHash: document.content_hash || "",
    };
  });

  const loadedDocTypes = new Set(documents.map((document) => document?.doc_type).filter(Boolean));

  return {
    legalDocs,
    authoritative:
      loadedDocTypes.has(LEGAL_DOC_TYPES.terms) && loadedDocTypes.has(LEGAL_DOC_TYPES.privacy),
  };
};

const getLegalDoc = (docType, legalDocs) => legalDocs?.[docType] || LEGAL_DOC_FALLBACKS[docType] || null;

export const getLegalVersionSnapshot = (legalDocs) => ({
  termsVersion: getLegalDoc(LEGAL_DOC_TYPES.terms, legalDocs)?.version || "",
  privacyVersion: getLegalDoc(LEGAL_DOC_TYPES.privacy, legalDocs)?.version || "",
});

export const resolveLegalDocumentHref = (docType, legalDocs) => {
  const rawUrl = String(getLegalDoc(docType, legalDocs)?.url || "").trim();

  if (!rawUrl) {
    return docType === LEGAL_DOC_TYPES.terms ? "/terms" : "/privacy";
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  return LEGAL_ROUTE_ALIASES[rawUrl] || (rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`);
};

export const loadActiveLegalDocuments = async (supabase) => {
  const { data, error } = await supabase
    .from("legal_documents")
    .select(LEGAL_DOCUMENT_FIELDS)
    .eq("is_active", true);

  const nextState = buildLegalDocumentState(data || []);

  return {
    ...nextState,
    error,
  };
};

export const fetchLegalContext = async () => {
  try {
    const response = await fetch("/api/legal-context", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Legal context request failed.");
    }

    return await response.json();
  } catch (_error) {
    return {
      observedAt: new Date().toISOString(),
      ipHash: null,
      ipHashMethod: "unavailable",
      userAgent: typeof window === "undefined" ? "" : window.navigator.userAgent,
    };
  }
};

export const buildLegalAcceptancePayload = ({ versionSnapshot, legalContext }) => ({
  terms_version: versionSnapshot.termsVersion,
  privacy_version: versionSnapshot.privacyVersion,
  accepted_at: legalContext.observedAt || new Date().toISOString(),
  acceptance_method: "signup_checkbox",
  ip_hash: legalContext.ipHash,
  ip_hash_method: legalContext.ipHashMethod,
  user_agent: legalContext.userAgent || (typeof window === "undefined" ? "" : window.navigator.userAgent),
  session_id:
    typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `signup-${Date.now()}`,
});

export const signUpWithEmail = async (
  supabase,
  { fullName, email, password, marketingConsent, legalAcceptance }
) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
        name: fullName || null,
        marketing_consent: Boolean(marketingConsent),
        signup_source: "create_account_page",
        legal_acceptance: legalAcceptance,
      },
    },
  });
