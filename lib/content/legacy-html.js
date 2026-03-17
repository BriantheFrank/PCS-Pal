import { legacyHtmlAliasRedirects } from "../legacy-route-manifest.mjs";

const MOJIBAKE_FIXUPS = [
  ["\u00e2\u20ac\u201c", "\u2013"],
  ["\u00e2\u20ac\u2122", "\u2019"],
  ["\u00e2\u20ac\u0153", "\u201c"],
  ["\u00e2\u20ac\u009d", "\u201d"],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u00a2", "\u2022"],
  ["\u00e2\u2013\u00be", "\u25be"],
];

const HTML_ENTITY_MAP = new Map([
  ["&amp;", "&"],
  ["&lt;", "<"],
  ["&gt;", ">"],
  ["&quot;", '"'],
  ["&#39;", "'"],
  ["&nbsp;", " "],
  ["&larr;", "\u2190"],
  ["&rarr;", "\u2192"],
  ["&ndash;", "\u2013"],
  ["&mdash;", "\u2014"],
  ["&ldquo;", "\u201c"],
  ["&rdquo;", "\u201d"],
  ["&lsquo;", "\u2018"],
  ["&rsquo;", "\u2019"],
]);

const LEGACY_DESTINATION_MAP = new Map(
  legacyHtmlAliasRedirects.map(({ source, destination }) => [
    String(source || "").replace(/^\//, ""),
    destination,
  ])
);

export const normalizeLegacySourceHtml = (html) =>
  MOJIBAKE_FIXUPS.reduce(
    (currentHtml, [corruptedText, normalizedText]) =>
      currentHtml.split(corruptedText).join(normalizedText),
    String(html || "")
  );

export const decodeHtmlEntities = (value) =>
  String(value || "").replace(
    /&(amp|lt|gt|quot|#39|nbsp|larr|rarr|ndash|mdash|ldquo|rdquo|lsquo|rsquo);/g,
    (entity) => HTML_ENTITY_MAP.get(entity) || entity
  );

export const stripHtmlToText = (value) =>
  decodeHtmlEntities(normalizeLegacySourceHtml(value).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

export const rewriteLegacyHref = (href) => {
  const normalizedHref = String(href || "").trim();
  if (!normalizedHref) {
    return "";
  }

  if (
    normalizedHref.startsWith("#") ||
    normalizedHref.startsWith("mailto:") ||
    normalizedHref.startsWith("tel:") ||
    /^https?:\/\//i.test(normalizedHref)
  ) {
    return normalizedHref;
  }

  const withoutDotSlash = normalizedHref.replace(/^\.\//, "").replace(/^\//, "");
  if (LEGACY_DESTINATION_MAP.has(withoutDotSlash)) {
    return LEGACY_DESTINATION_MAP.get(withoutDotSlash);
  }

  if (withoutDotSlash.endsWith(".html")) {
    return `/${withoutDotSlash.replace(/\.html$/i, "")}`;
  }

  return normalizedHref;
};

export const normalizeRichTextHtml = (html) =>
  normalizeLegacySourceHtml(html)
    .replace(
      /href="([^"]+)"/g,
      (_match, href) => `href="${rewriteLegacyHref(decodeHtmlEntities(href))}"`
    )
    .replace(/\s+/g, " ")
    .trim();

export const buildSlugFromTitle = (value) =>
  stripHtmlToText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
