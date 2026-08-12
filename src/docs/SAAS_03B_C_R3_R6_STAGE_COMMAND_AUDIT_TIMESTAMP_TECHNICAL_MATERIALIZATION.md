# SaaS-03B-C-R3-R6 — Stage + Command/Audit Timestamp Technical Materialization

## Result

This microphase materializes the contracts closed by R3-R5. It does not create
the Platform Command Transaction Store, a callable handler, or any business
command. The result is `completed_pending_human_review_and_push`.

## Command schema v2

`@mipymetic/saas-contracts` advances from `0.9.0` to `0.10.0`. The public,
ordered and frozen `PRIVILEGED_COMMAND_STAGES` catalog is `not_started`,
`prepared`, `completed`. `COMMAND_SCHEMA_VERSION` is 2 and the exact record has
19 fields, adding required non-null backend-owned `stage` after `status`.

New records are v2, `pending + not_started`, and use a server-owned timestamp
token for `startedAt`; neither schema version nor stage comes from the envelope.
Readers reject v1, missing/unknown stages, future schemas, extra/missing fields,
and all unapproved combinations. There is no v1 inference or migration.

Only `BootstrapPlatformAdmins`, `RecoverPlatformAdmin`, and
`RevokePlatformAdmin` have an approved stage contract. The exact status matrix
is: pending/not_started; running/not_started|prepared; succeeded/completed;
failed_retryable/not_started; failed_terminal/not_started; and
recovery_required/prepared. The existing lease rule remains independent:
non-null lease is allowed only for running.

## Timestamp boundary

The shape-aware Functions adapter now recognizes `privileged_command` and
`platform_audit`, in addition to Authority and Registry. It converts only the
declared Admin Firestore Timestamp fields to canonical UTC ISO strings:

- command: required `startedAt`; nullable `completedAt`, `failedAt`,
  `expiresAt`, `leaseExpiresAt`;
- audit: required `requestedAt`, `executedAt`.

Command creation and audit writing request authoritative time through the
identity-safe `ServerOwnedTimestamp` token. The Admin adapter alone translates
that token to `FieldValue.serverTimestamp()`. Package/core surfaces never see
Firebase SDK values, and no process clock simulates server ownership.

## Artifact and verification

The canonical artifact is
`functions/vendor/mipymetic-saas-contracts-0.10.0.tgz` (15,402 bytes):

- SHA-256: `a07d283ebae2b6a81d7460eaeddbeeea6f7caf577611dc8c92d7ad014f1caca1`;
- npm shasum: `a555ead4914c3d9ab8b1f713699b12eddc79546f`;
- integrity: `sha512-8n1pWG16g3slhJ8QDvjPkr6N5b2Nfygsz/aXRLekHdAYyRefL/0KahDJpZHcCbMkjcCc47FX6OaIiUi+0CWIJQ==`;
- 60 entries; source/types/README/package metadata only; tests, node_modules,
  tsbuildinfo, secrets and temporaries excluded.

Generated declarations equal the versioned declarations and contain no `any`.
Package tests pass 40/40; Functions strict TypeScript, build, lint and tests pass
27/27. Shared passes 51/51; repositories pass 59/59, 23/23, 51/51, 46/46;
prechecks retain 111/42/69, 114/32/82, 81/44/37, 52/34/18; Rules preflight
retains 222/88/134; production build passes. Root audit remains the recorded
25 findings and Functions remains 7 moderate; package runtime dependencies are
zero and the attributable supply-chain delta is zero.

## Risk, rollback and next step

Deployment must stop if unexpected v1 command data exists; it must not infer a
stage. Rollback before deployment is the two local commits/artifact cutover.
After deployment, reverting the reader to v1 is not compatible with v2 data and
requires a separately approved migration decision.

Protected Rules, indexes, Storage and Firebase configuration hashes remain
unchanged. Firebase remote, Emulator and deploy were not used. After human
review and push, the next authorized work is the Platform Command Transaction
Store Boundary; the three platform commands remain not implemented.
