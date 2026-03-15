# PCS Pal Legal Versioning and Acceptance

## What this adds
- Public legal pages:
  - `terms-of-use.html`
  - `privacy-policy.html`
- Shared legal metadata:
  - `legal-documents.js`
- Request metadata helper:
  - `api/legal-context.js`
- Additive migration:
  - `supabase/migrations/20260312000100_pcs_pal_legal_documents_and_acceptance.sql`

## Current document versions
- Terms of Use: `2026-03-12`
- Privacy Policy: `2026-03-12`
- Current review status: `draft_pending_attorney_review`

These are draft placeholders until attorney-reviewed final copy is approved.

## Database model
### `public.legal_documents`
Versioned registry of legal documents.

Key fields:
- `doc_type`
- `version`
- `effective_date`
- `url`
- `content_hash`
- `review_status`
- `is_active`

Design notes:
- Insert a new row for each new legal version.
- Keep only one active row per `doc_type`.
- Do not overwrite a published version in place.

### `public.legal_acceptances`
Immutable-style evidence rows for accepted legal documents.

Key fields:
- `user_id`
- `document_id`
- `accepted_at`
- `acceptance_method`
- `source_flow`
- `ip_hash`
- `ip_hash_method`
- `user_agent`
- `session_id`
- `document_version`
- `document_url`
- `document_content_hash`

Design notes:
- Snapshot fields are stored redundantly so an audit can still identify the accepted version even if the document registry changes later.
- Client writes are not allowed directly. Acceptance creation uses:
  - auth-user trigger capture during email signup
  - `public.record_current_legal_acceptance(...)` for signed-in re-acceptance flows

## Signup flow
Email signup now:
- requires an unchecked-by-default legal acknowledgment checkbox
- links directly to Terms of Use and Privacy Policy
- keeps optional marketing consent separate
- sends legal metadata through signup user metadata
- captures acceptance rows only if account creation succeeds
- blocks account creation if the current legal document registry is not available from Supabase

The trigger `public.capture_auth_signup_legal_state()` reads that metadata on `auth.users` insert, enforces it for the current email signup flow, and creates the authoritative acceptance rows.

## Account visibility
The account dropdown now shows:
- links to the current Terms of Use and Privacy Policy
- current accepted version/date status when available
- a small acknowledgment action for future re-consent and backfill of existing users

Current-user status is exposed through:
- `public.get_current_user_legal_status()`

## Updating legal documents safely
When legal copy changes materially:
1. Update the public HTML page.
2. Compute a new SHA-256 hash of the updated public file.
3. Create a new migration that deactivates the previous active row for that `doc_type` before activating the new one, or inserts the new row with `is_active = false` first.
4. In the same migration, insert the new `legal_documents` row with:
   - new `version`
   - new `effective_date`
   - new `content_hash`
   - `is_active = true`
5. Keep the old row for history.
6. Verify account status now reports `needs_reacceptance = true` for users who have not accepted the new active version.

Do not insert a second active row for the same document type before deactivating the current one. The partial unique index intentionally blocks that state.

PowerShell example:

```powershell
Get-FileHash -Algorithm SHA256 .\terms-of-use.html
Get-FileHash -Algorithm SHA256 .\privacy-policy.html
```

## Future re-consent path
This implementation includes the minimum foundation for future re-consent:
- active vs historical document versions
- per-user status query: `public.get_current_user_legal_status()`
- signed-in acknowledgment RPC: `public.record_current_legal_acceptance(...)`

What is not implemented in this pass:
- forced blocking re-consent flow across the entire app
- Google-auth legal acceptance flow
- admin/legal operator console for publishing document versions

## IP hash note
`api/legal-context.js` hashes the observed request IP before it is stored with acceptance evidence.

Recommended production setting:
- set `LEGAL_IP_HASH_SALT` in Vercel before legal launch

If `LEGAL_IP_HASH_SALT` is not set, the current fallback is an unsalted SHA-256 hash. That is better than storing a raw IP, but it still needs privacy/legal review before launch.

## Attorney review still required
Before production legal launch, obtain attorney review for:
- Terms of Use final language
- Privacy Policy final language
- governing law / dispute resolution / arbitration language
- liability limitation language
- privacy rights language by jurisdiction
- retention and deletion commitments
- salted-IP-hash decision and final privacy disclosure wording
