export const migratedPublicHtmlRewrites = [
  { source: "/index.html", destination: "/" },
  { source: "/pcs-checklist.html", destination: "/checklist" },
  { source: "/move-organizer.html", destination: "/organizer" },
  { source: "/move-inventory.html", destination: "/inventory" },
  { source: "/move-logistics.html", destination: "/logistics" },
  { source: "/base-fort-liberty.html", destination: "/bases/fort-liberty" },
  { source: "/base-fort-cavazos.html", destination: "/bases/fort-cavazos" },
  { source: "/base-fort-campbell.html", destination: "/bases/fort-campbell" },
  { source: "/base-fort-bliss.html", destination: "/bases/fort-bliss" },
  { source: "/base-fort-stewart.html", destination: "/bases/fort-stewart" },
  { source: "/base-fort-belvoir.html", destination: "/bases/fort-belvoir" },
  { source: "/base-fort-meade.html", destination: "/bases/fort-meade" },
  { source: "/base-fort-riley.html", destination: "/bases/fort-riley" },
  { source: "/base-fort-jackson.html", destination: "/bases/fort-jackson" },
  { source: "/base-fort-knox.html", destination: "/bases/fort-knox" },
  { source: "/base-fort-johnson.html", destination: "/bases/fort-johnson" },
  { source: "/base-fort-drum.html", destination: "/bases/fort-drum" },
  { source: "/base-fort-sill.html", destination: "/bases/fort-sill" },
  {
    source: "/base-fort-leonard-wood.html",
    destination: "/bases/fort-leonard-wood",
  },
  { source: "/base-fort-moore.html", destination: "/bases/fort-moore" },
  { source: "/base-fort-eisenhower.html", destination: "/bases/fort-eisenhower" },
  {
    source: "/base-fort-gregg-adams.html",
    destination: "/bases/fort-gregg-adams",
  },
  { source: "/base-fort-carson.html", destination: "/bases/fort-carson" },
  { source: "/base-fort-huachuca.html", destination: "/bases/fort-huachuca" },
  {
    source: "/base-joint-base-lewis-mcchord.html",
    destination: "/bases/joint-base-lewis-mcchord",
  },
  { source: "/bases.html", destination: "/bases" },
  { source: "/terms-of-use.html", destination: "/terms" },
  { source: "/privacy-policy.html", destination: "/privacy" },
  { source: "/about.html", destination: "/about" },
  { source: "/contact.html", destination: "/contact" },
  { source: "/create-account.html", destination: "/create-account" },
];

export const legacyJavaScriptAssets = [
  "auth-sync.js",
  "account-data.js",
  "checklist-data.js",
  "inventory-data.js",
  "logistics-data.js",
  "script.js",
  "bases-browser.js",
  "base-enhancements.js",
  "base-arrival-data.js",
  "pcs-reference-data.js",
  "legal-documents.js",
];

export const legacyStyleAssets = ["styles.css"];

export const legacyGuideHtmlFiles = [
  "receiving-pcs-orders.html",
  "attending-pcs-briefings.html",
  "confirming-report-dates.html",
  "applying-advance-pay.html",
  "updating-deers-rapids.html",
];

export const legacyBaseHtmlFiles = [
  "base-fort-belvoir.html",
  "base-fort-bliss.html",
  "base-fort-campbell.html",
  "base-fort-carson.html",
  "base-fort-cavazos.html",
  "base-fort-drum.html",
  "base-fort-eisenhower.html",
  "base-fort-gregg-adams.html",
  "base-fort-huachuca.html",
  "base-fort-jackson.html",
  "base-fort-johnson.html",
  "base-fort-knox.html",
  "base-fort-leonard-wood.html",
  "base-fort-liberty.html",
  "base-fort-meade.html",
  "base-fort-moore.html",
  "base-fort-riley.html",
  "base-fort-sill.html",
  "base-fort-stewart.html",
  "base-joint-base-lewis-mcchord.html",
];

export const legacyPublicHtmlFiles = [
  "index.html",
  "terms-of-use.html",
  "privacy-policy.html",
  "create-account.html",
];

export const legacyProtectedHtmlFiles = [
  "pcs-checklist.html",
  "move-organizer.html",
  "move-inventory.html",
  "move-logistics.html",
  "bases.html",
  ...legacyGuideHtmlFiles,
  ...legacyBaseHtmlFiles,
];

export const legacyHtmlFiles = [...legacyPublicHtmlFiles, ...legacyProtectedHtmlFiles];

export const legacyCopiedFiles = [
  ...legacyHtmlFiles,
  ...legacyJavaScriptAssets,
  ...legacyStyleAssets,
];

export const noIndexLegacyPaths = [
  "/create-account.html",
  "/create-account",
  "/checklist",
  "/organizer",
  "/inventory",
  "/logistics",
  "/bases",
  "/bases/:path*",
  "/app/:path*",
  ...legacyProtectedHtmlFiles.map((file) => `/${file}`),
];


