# Refactor Notes (2026-04-10)

## Shared sync orchestration

Checklist, inventory, and logistics reconciliation now share a common orchestration helper in `lib/sync/reconcile-local-remote.js`.

Each domain still owns:
- local storage keys
- normalization
- remote fetch/push logic
- compatibility snapshot backup behavior

This lowers drift risk between the three persistence flows while preserving existing tables/keys.

## Local room photo storage

Room photo handling now routes through `lib/room-photo-storage.js`, which prefers IndexedDB-backed storage (`lib/local-photo-store.js`) and falls back to legacy localStorage storage (`lib/local-room-photo-storage.js`) when IndexedDB is unavailable.

This keeps current local-only free-tier behavior and room association while reducing reliance on large localStorage JSON payloads.

## Dormant extraction status

The local extraction API endpoint is now explicitly dormant (`501` + `EXTRACTION_DORMANT`) and no longer returns filename-derived pseudo-AI suggestions.

UI copy in the room extraction panel now states the feature is staged for later activation.

## Route/config ownership

No redirect manifest behavior was changed in this pass. Existing canonical/legacy route behavior remains in place.

## Deferred follow-up

- Additional decomposition of `native-inventory-page.js` and `native-logistics-page.js` into dedicated orchestration hooks and presentational modules.
- Further auth provider internal split (session bootstrap vs profile/legal/move modules).
- Broader static analysis/type coverage once TypeScript migration strategy is chosen.
