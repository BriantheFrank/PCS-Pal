export const LEGAL_DOC_TYPES = Object.freeze({
  terms: "terms_of_use",
  privacy: "privacy_policy",
});

export const LEGAL_DOC_FALLBACKS = Object.freeze({
  [LEGAL_DOC_TYPES.terms]: Object.freeze({
    docType: LEGAL_DOC_TYPES.terms,
    title: "Terms of Use",
    version: "2026-03-12",
    effectiveDate: "2026-03-12",
    url: "terms-of-use.html",
    reviewStatus: "Current version published",
    reviewStatusCode: "current_version_published",
  }),
  [LEGAL_DOC_TYPES.privacy]: Object.freeze({
    docType: LEGAL_DOC_TYPES.privacy,
    title: "Privacy Policy",
    version: "2026-03-12",
    effectiveDate: "2026-03-12",
    url: "privacy-policy.html",
    reviewStatus: "Current version published",
    reviewStatusCode: "current_version_published",
  }),
});

export const LEGAL_PUBLIC_PATHS = Object.freeze(
  Object.values(LEGAL_DOC_FALLBACKS).map((document) => `/${document.url}`)
);

export const createFallbackLegalDocs = () =>
  Object.fromEntries(
    Object.entries(LEGAL_DOC_FALLBACKS).map(([docType, document]) => [
      docType,
      { ...document },
    ])
  );

export const getFallbackLegalDoc = (docType) =>
  createFallbackLegalDocs()[docType] || null;
