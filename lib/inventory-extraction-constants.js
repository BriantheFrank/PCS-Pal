export const EXTRACTION_LIMITS = Object.freeze({
  maxPhotosPerRun: 8,
  maxPreparedBytesPerPhoto: 2_000_000,
  maxPreparedBytesPerRun: 10_000_000,
  maxSuggestedItemsPerRun: 24,
  requestTimeoutMs: 20_000,
  maxRetries: 1,
});

export const EXTRACTION_COPY = Object.freeze({
  localOnly: "Free plan: your original room photos stay on this device.",
  syncedItems: "Saved inventory items sync to your PCS account.",
  reviewRequired: "AI suggestions are estimates. Review and edit before saving.",
});
