const RENAMED_BASE_TITLES = {
  "fort-bragg": "Fort Liberty (formerly Fort Bragg)",
  "fort-benning": "Fort Moore (formerly Fort Benning)",
  "fort-lee": "Fort Gregg-Adams (formerly Fort Lee)",
  "fort-gordon": "Fort Eisenhower (formerly Fort Gordon)",
  "fort-hood": "Fort Cavazos (formerly Fort Hood)",
  "fort-polk": "Fort Johnson (formerly Fort Polk)",
};

export const getDisplayBaseName = (slug, fallbackName) =>
  RENAMED_BASE_TITLES[slug] || fallbackName;
