const crypto = require("crypto");

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const forwardedForHeader = String(req.headers["x-forwarded-for"] || "");
  const observedIp = forwardedForHeader
    .split(",")
    .map((segment) => segment.trim())
    .find(Boolean);
  const ipHashSalt = process.env.LEGAL_IP_HASH_SALT || "";
  const ipHash = observedIp
    ? crypto
        .createHash("sha256")
        .update(`${ipHashSalt}::${observedIp}`)
        .digest("hex")
    : null;

  return res.status(200).json({
    observedAt: new Date().toISOString(),
    ipHash,
    ipHashMethod: ipHash ? (ipHashSalt ? "sha256_salted" : "sha256_unsalted") : "unavailable",
    userAgent: String(req.headers["user-agent"] || ""),
  });
};
