import fs from "node:fs";
import path from "node:path";

import { baseArrivalData } from "@/base-arrival-data";
import { NATIVE_BASE_DETAIL_SLUGS, getNativeBaseDetailPath, isNativeBaseDetailSlug } from "@/lib/bases/base-route-map";
import { pcsBaseSocialLinksBySlug } from "@/lib/bases/pcs-community-links";

const SECTION_REGEX = /<section class="base-detail">([\s\S]*?)<\/section>/g;
const CARD_REGEX = /<div class="base-card">([\s\S]*?)<\/div>/g;
const PARAGRAPH_REGEX = /<p(?: class="[^"]*")?>([\s\S]*?)<\/p>/g;
const LINK_REGEX = /<a class="card-link" href="([^"]+)">([\s\S]*?)<\/a>/g;
const LIST_ITEM_REGEX = /<li>([\s\S]*?)<\/li>/g;

const decodeHtml = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&larr;/g, "<-")
    .replace(/\s+/g, " ")
    .trim();

const stripTags = (value = "") => decodeHtml(String(value).replace(/<[^>]+>/g, " "));

const getLegacyDetailFilePath = (slug) => path.join(process.cwd(), `base-${slug}.html`);

const extractRequired = (html, pattern, description) => {
  const match = html.match(pattern);
  if (!match) {
    throw new Error(`Unable to extract ${description} from legacy base detail HTML.`);
  }
  return match;
};

const parseCard = (cardHtml) => {
  const title = stripTags(extractRequired(cardHtml, /<h3>([\s\S]*?)<\/h3>/, "card title")[1]);
  const paragraphs = Array.from(cardHtml.matchAll(PARAGRAPH_REGEX)).map((match) => stripTags(match[1]));
  const links = Array.from(cardHtml.matchAll(LINK_REGEX)).map((match) => ({
    href: decodeHtml(match[1]),
    label: stripTags(match[2]),
    openInNewTab: false,
  }));
  const listItems = Array.from(cardHtml.matchAll(LIST_ITEM_REGEX)).map((match) => stripTags(match[1]));

  return {
    title,
    paragraphs,
    links,
    listItems,
  };
};

const parseStaticSections = (html) =>
  Array.from(html.matchAll(SECTION_REGEX)).map((sectionMatch) => {
    const sectionHtml = sectionMatch[1];
    const title = stripTags(extractRequired(sectionHtml, /<h2>([\s\S]*?)<\/h2>/, "section title")[1]);
    const cards = Array.from(sectionHtml.matchAll(CARD_REGEX)).map((cardMatch) => parseCard(cardMatch[1]));

    return {
      title,
      cards,
    };
  });

const buildArrivalSection = (slug) => {
  const base = baseArrivalData[slug];
  if (!base) {
    return null;
  }

  return {
    title: "Arrival & Reporting",
    intro: `${base.installationName} arrival details are most useful when they answer one question quickly: where do I start on day one?`,
    cards: [
      {
        title: "Where to report on arrival",
        paragraphs: [base.receptionDescription],
        links: [
          {
            label: "Official reception guidance",
            href: base.receptionOfficialLink,
            openInNewTab: true,
          },
          {
            label: "Open in Google Maps",
            href: base.receptionGoogleMapsLink,
            openInNewTab: true,
          },
        ].filter((link) => Boolean(link.href)),
        listItems: [],
      },
      {
        title: "Official installation guidance",
        paragraphs: [base.reportingInfoNote],
        links: [
          {
            label: "Installation overview",
            href: base.baseHomepageLink,
            openInNewTab: true,
          },
          {
            label: "Newcomer / overview page",
            href: base.newcomerLink,
            openInNewTab: true,
          },
        ].filter((link) => Boolean(link.href)),
        listItems: [],
      },
    ],
  };
};


const buildPcsCommunitySection = (slug, installationName) => {
  const socialLinks = pcsBaseSocialLinksBySlug[slug] || [];
  if (!socialLinks.length) {
    return null;
  }

  return {
    title: "PCS community groups for this duty station",
    intro:
      "You do not have to plan this move alone. These vetted groups can help with local housing questions, school transitions, and first-week tips from families already on the ground.",
    cards: [
      {
        title: `${installationName} PCS online community`,
        paragraphs: [
          "Use these groups for practical move support, neighborhood recommendations, and real-time local insights.",
        ],
        links: socialLinks.map((link) => ({ ...link, openInNewTab: true })),
        listItems: [],
      },
    ],
  };
};

const buildHelpfulStopsSection = (slug) => {
  const base = baseArrivalData[slug];
  if (!base) {
    return null;
  }

  const cards = [];

  if (base.visitorCenterTitle || base.visitorCenterLink || base.visitorCenterGoogleMapsLink) {
    cards.push({
      title: base.visitorCenterTitle || "Visitor center / gate access",
      paragraphs: [
        "Keep the gate or visitor-control location handy in case you need directions, temporary pass support, or the clearest first stop onto post.",
      ],
      links: [
        {
          label: "Official visitor guidance",
          href: base.visitorCenterLink,
          openInNewTab: true,
        },
        {
          label: "Open in Google Maps",
          href: base.visitorCenterGoogleMapsLink,
          openInNewTab: true,
        },
      ].filter((link) => Boolean(link.href)),
      listItems: [],
    });
  }

  if (base.lodgingLink || base.lodgingGoogleMapsLink) {
    cards.push({
      title: base.lodgingTitle || "Temporary lodging",
      paragraphs: [
        "If housing is not ready on arrival, keep the post temporary-lodging option and driving directions saved before travel day.",
      ],
      links: [
        {
          label: "Official lodging page",
          href: base.lodgingLink,
          openInNewTab: true,
        },
        {
          label: "Open in Google Maps",
          href: base.lodgingGoogleMapsLink,
          openInNewTab: true,
        },
      ].filter((link) => Boolean(link.href)),
      listItems: [],
    });
  }

  if (base.housingLink) {
    cards.push({
      title: "Housing",
      paragraphs: [
        "Use the housing office link for waitlists, family housing guidance, and first-week lease or neighborhood questions.",
      ],
      links: [{ label: "Official housing page", href: base.housingLink, openInNewTab: true }],
      listItems: [],
    });
  }

  if (base.medicalLink) {
    cards.push({
      title: "Medical and clinics",
      paragraphs: [
        "Confirm the installation hospital or clinic and any TRICARE enrollment steps before the first week fills up.",
      ],
      links: [{ label: "Official medical guidance", href: base.medicalLink, openInNewTab: true }],
      listItems: [],
    });
  }

  if (base.transportationLink) {
    cards.push({
      title: "Transportation / household goods",
      paragraphs: [
        "Keep the household goods office page close for shipment delivery, storage-in-transit, and travel-day questions.",
      ],
      links: [
        {
          label: "Official transportation page",
          href: base.transportationLink,
          openInNewTab: true,
        },
      ],
      listItems: [],
    });
  }

  if (base.deersIdCardLink) {
    cards.push({
      title: "DEERS / ID cards",
      paragraphs: [
        "If you need RAPIDS or ID-card support early, use the official locator before you arrive on post.",
      ],
      links: [{ label: "Official ID card locator", href: base.deersIdCardLink, openInNewTab: true }],
      listItems: [],
    });
  }

  return {
    title: "Helpful First-Week Stops",
    intro: "These links cover the on-post offices and services that are most likely to matter as soon as you arrive.",
    cards,
  };
};

export const getBaseDetailPageData = (slug) => {
  if (!isNativeBaseDetailSlug(slug)) {
    return null;
  }

  const html = fs.readFileSync(getLegacyDetailFilePath(slug), "utf8");
  const headerMatch = extractRequired(
    html,
    /<p class="eyebrow">([\s\S]*?)<\/p>[\s\S]*?<h1>([\s\S]*?)<\/h1>[\s\S]*?<p class="subtitle">([\s\S]*?)<\/p>[\s\S]*?<p>([\s\S]*?)<\/p>/,
    "detail header"
  );
  extractRequired(html, /<a class="back-link" href="([^"]+)">([\s\S]*?)<\/a>/, "back link");

  const parsedStaticSections = parseStaticSections(html);
  const base = baseArrivalData[slug];
  const pcsCommunitySection = buildPcsCommunitySection(slug, base?.installationName || "This installation");

  return {
    slug,
    baseId: slug,
    routePath: getNativeBaseDetailPath(slug),
    legacyPath: `base-${slug}.html`,
    eyebrow: stripTags(headerMatch[1]),
    heading: stripTags(headerMatch[2]),
    subtitle: stripTags(headerMatch[3]),
    overview: stripTags(headerMatch[4]),
    installationName: base?.installationName || stripTags(headerMatch[2]),
    arrivalSection: buildArrivalSection(slug),
    helpfulStopsSection: buildHelpfulStopsSection(slug),
    pcsCommunitySection,
    staticSections: parsedStaticSections,
    backLink: {
      href: "/bases",
      label: "Back to destination base research",
    },
  };
};

export const getMigratedBaseDetailPageData = () =>
  NATIVE_BASE_DETAIL_SLUGS.map((slug) => getBaseDetailPageData(slug)).filter(Boolean);
