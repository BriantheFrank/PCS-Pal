export const resolveSafeNextPath = (value, fallbackPath = "/") => {
  const candidate = String(value || "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallbackPath;
  }

  if (candidate.startsWith("/sign-in") || candidate.startsWith("/create-account")) {
    return fallbackPath;
  }

  return candidate;
};
