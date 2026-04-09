import { readFileSync } from "node:fs";
import path from "node:path";

import {
  normalizeRichTextHtml,
  normalizeLegacySourceHtml,
  rewriteLegacyHref,
  stripHtmlToText,
} from "@/lib/content/legacy-html";

export const GUIDE_SLUGS = [
  "receiving-pcs-orders",
  "attending-pcs-briefings",
  "confirming-report-dates",
  "applying-advance-pay",
  "updating-deers-rapids",
  "hand-carry-essentials",
  "pcs-documents-checklist",
  "moving-with-kids-and-pets",
];

const GUIDE_FILE_MAP = Object.freeze({
  "receiving-pcs-orders": "receiving-pcs-orders.html",
  "attending-pcs-briefings": "attending-pcs-briefings.html",
  "confirming-report-dates": "confirming-report-dates.html",
  "applying-advance-pay": "applying-advance-pay.html",
  "updating-deers-rapids": "updating-deers-rapids.html",
});

const STUB_GUIDES = Object.freeze({
  "hand-carry-essentials": {
    title: "Hand-carry essentials for PCS travel",
    subtitle: "Keep irreplaceable items with you instead of placing them in HHG.",
    sections: [
      { id: "intro", type: "intro", title: "Why this step matters", intro: "Carry critical documents, medications, and must-have items so your first week is not blocked by delayed shipments." },
      { id: "items", type: "bullets", title: "What to carry", items: ["Orders and IDs", "Medical records and prescriptions", "School and pet paperwork", "Basic clothing and chargers"] },
    ],
  },
  "pcs-documents-checklist": {
    title: "PCS documents checklist",
    subtitle: "Build one packet for housing, medical, school, and finance tasks.",
    sections: [
      { id: "intro", type: "intro", title: "Why this step matters", intro: "A single packet prevents delays during in-processing and enrollment appointments." },
      { id: "items", type: "bullets", title: "Documents to include", items: ["Orders and amendments", "Birth certificates and marriage documents", "Immunization and school records", "Lease, insurance, and vehicle records"] },
    ],
  },
  "moving-with-kids-and-pets": {
    title: "Moving with kids and pets",
    subtitle: "Plan family routines and travel breaks before moving week starts.",
    sections: [
      { id: "intro", type: "intro", title: "Why this step matters", intro: "Family travel is easier when school transitions, pet paperwork, and daily routines are planned ahead of time." },
      { id: "items", type: "bullets", title: "Family prep checklist", items: ["Coordinate school handoff dates", "Prepare pet vaccination and travel certificates", "Pack comfort items and snacks", "Build a first-week routine plan"] },
    ],
  },
});

const guidePageCache = new Map();

const extractMatches = (source, pattern) => Array.from(String(source || "").matchAll(pattern));

const getGuideFilePath = (slug) => {
  const fileName = GUIDE_FILE_MAP[slug];
  return fileName ? path.join(process.cwd(), fileName) : "";
};

const buildGuideChecklistItemBlocks = (sectionHtml) => {
  const matches = extractMatches(sectionHtml, /<div class="checklist-item">/g);

  return matches.map((match, index) => {
    const startIndex = match.index;
    const endIndex = index + 1 < matches.length ? matches[index + 1].index : sectionHtml.length;
    return sectionHtml.slice(startIndex, endIndex);
  });
};

const parseGuideChecklistItems = (sectionHtml, slug) =>
  buildGuideChecklistItemBlocks(sectionHtml).map((itemHtml, index) => ({
    id: `${slug}-check-${index + 1}`,
    title: stripHtmlToText(itemHtml.match(/<span class="item-title">([\s\S]*?)<\/span>/)?.[1] || ""),
    helpHtml: normalizeRichTextHtml(itemHtml.match(/<p class="item-help">([\s\S]*?)<\/p>/)?.[1] || ""),
  }));

const parseGuideBulletSection = (sectionHtml) =>
  extractMatches(sectionHtml.match(/<ul class="recommended-list">([\s\S]*?)<\/ul>/)?.[1] || "", /<li>([\s\S]*?)<\/li>/g).map(
    (match) => normalizeRichTextHtml(match[1])
  );

const parseGuideLinkGroups = (sectionHtml) =>
  extractMatches(
    sectionHtml.match(/<div class="checklist-section-body">([\s\S]*?)<\/div>/)?.[1] || "",
    /<div>\s*<h3>([\s\S]*?)<\/h3>\s*<ul class="recommended-list">([\s\S]*?)<\/ul>\s*<\/div>/g
  ).map((match, groupIndex) => ({
    id: `group-${groupIndex + 1}`,
    title: stripHtmlToText(match[1]),
    links: extractMatches(match[2], /<a class="text-link" href="([^"]+)">([\s\S]*?)<\/a>/g).map(
      (linkMatch) => ({
        href: rewriteLegacyHref(linkMatch[1]),
        label: stripHtmlToText(linkMatch[2]),
      })
    ),
  }));

const parseGuideSection = (sectionHtml, slug, index) => {
  const title = stripHtmlToText(sectionHtml.match(/<h2>([\s\S]*?)<\/h2>/)?.[1] || "");
  const sectionId = `${slug}-${index + 1}`;

  switch (title) {
    case "Why this step matters":
      return {
        id: sectionId,
        type: "intro",
        title,
        intro: stripHtmlToText(sectionHtml.match(/<p class="checklist-intro">([\s\S]*?)<\/p>/)?.[1] || ""),
      };
    case "Detailed sub-checklist":
      return {
        id: sectionId,
        type: "checklist",
        title,
        items: parseGuideChecklistItems(sectionHtml, slug),
      };
    case "Common pitfalls & pro tips":
      return {
        id: sectionId,
        type: "bullets",
        title,
        items: parseGuideBulletSection(sectionHtml),
      };
    case "Helpful links & related pages":
      return {
        id: sectionId,
        type: "link-groups",
        title,
        groups: parseGuideLinkGroups(sectionHtml),
      };
    default:
      return {
        id: sectionId,
        type: "bullets",
        title,
        items: parseGuideBulletSection(sectionHtml),
      };
  }
};

const parseGuidePageData = (slug, html) => {
  const normalizedHtml = normalizeLegacySourceHtml(html);
  const fileName = GUIDE_FILE_MAP[slug];
  const title = stripHtmlToText(normalizedHtml.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] || "");
  const subtitle = stripHtmlToText(
    normalizedHtml.match(/<p class="subtitle">([\s\S]*?)<\/p>/)?.[1] || ""
  );
  const headerBackLink = normalizedHtml.match(/<a class="text-link" href="([^"]+)">([\s\S]*?)<\/a>/);
  const footerLinks = extractMatches(
    normalizedHtml.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1] || "",
    /<a class="text-link" href="([^"]+)">([\s\S]*?)<\/a>/g
  ).map((match) => ({
    href: rewriteLegacyHref(match[1]),
    label: stripHtmlToText(match[2]),
  }));
  const footerDisclaimer = stripHtmlToText(
    normalizedHtml.match(
      /<footer class="site-footer">[\s\S]*?<p>\s*This content is for planning purposes only([\s\S]*?)<\/p>/
    )?.[0] || ""
  );
  const sectionBlocks = extractMatches(
    normalizedHtml,
    /<section class="checklist-section">([\s\S]*?)<\/section>/g
  ).map((match) => match[0]);
  const rawBackLinkHref = rewriteLegacyHref(headerBackLink?.[1] || "pcs-checklist.html");
  const resolvedBackLinkHref =
    rawBackLinkHref === "/checklist" ? "/military-pcs-checklist" : rawBackLinkHref;

  return {
    slug,
    fileName,
    routePath: `/guides/${slug}`,
    legacyAliasPath: `/${fileName}`,
    title,
    subtitle,
    backLink: {
      href: resolvedBackLinkHref,
      label: stripHtmlToText(headerBackLink?.[2] || "&larr; Back to PCS checklist"),
    },
    description: subtitle,
    sections: sectionBlocks.map((sectionHtml, index) => parseGuideSection(sectionHtml, slug, index)),
    footerLinks,
    footerDisclaimer,
  };
};

export const getGuidePageData = (slug) => {
  if (STUB_GUIDES[slug]) {
    return {
      slug,
      fileName: "",
      routePath: `/guides/${slug}`,
      legacyAliasPath: "",
      description: STUB_GUIDES[slug].subtitle,
      backLink: { href: "/military-pcs-checklist", label: "← Back to PCS checklist" },
      footerLinks: [],
      footerDisclaimer: "",
      ...STUB_GUIDES[slug],
    };
  }

  if (!GUIDE_FILE_MAP[slug]) {
    return null;
  }

  if (!guidePageCache.has(slug)) {
    guidePageCache.set(slug, parseGuidePageData(slug, readFileSync(getGuideFilePath(slug), "utf8")));
  }

  return guidePageCache.get(slug);
};
