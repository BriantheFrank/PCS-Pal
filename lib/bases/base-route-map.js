export const NATIVE_BASE_DETAIL_SLUGS = [
  "fort-bragg",
  "fort-hood",
  "joint-base-lewis-mcchord",
  "fort-campbell",
  "fort-bliss",
  "fort-stewart",
  "fort-belvoir",
  "fort-meade",
  "fort-riley",
  "fort-jackson",
  "fort-knox",
  "fort-polk",
  "fort-drum",
  "fort-sill",
  "fort-leonard-wood",
  "fort-benning",
  "fort-gordon",
  "fort-lee",
  "fort-carson",
  "fort-huachuca",
];

const NATIVE_BASE_DETAIL_SET = new Set(NATIVE_BASE_DETAIL_SLUGS);

export const isNativeBaseDetailSlug = (slug) => NATIVE_BASE_DETAIL_SET.has(String(slug || ""));

export const getNativeBaseDetailPath = (slug) => `/bases/${slug}`;
