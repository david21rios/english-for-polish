# SaaS-03B-C-R6 — RevokePlatformAdmin Implementation

## Result

`RevokePlatformAdmin` is implemented and validated as an internal privileged command. The identifier is R6 according to the published SaaS-03B-C genealogy. No callable/HTTP handler, independent review, 03B-D work, Firebase remote operation or deployment is included.

## Contract and authorization

The exact closed payload is `commandId`, `correlationId` and `targetUid`; all fields are required and non-nullable, and unknown or authority-bearing input is rejected. Package-owned identifier validators are consumed through explicit `ValidationResult.ok` checks.

The actor comes only from authenticated context. Its Auth user and exact persisted Identity are validated, its persisted Platform Authority must be active, and `platform.authority_revoke` is resolved from the package-owned capability matrix. Claims are never authority. Self-revoke fails before any mutation.

## Saga and persistence

- Prepare atomically changes the target from `active/null` to `revoking/currentCommandId`, decrements Registry `activeCount` exactly once, advances revision, records `lastCommandId`, sets the command to `running/prepared`, and writes a deterministic Critical audit.
- Registry `activeCount <= 1` fails closed. Real Firestore concurrency from two active admins proves that exactly one revoke commits and the final count is one.
- Auth runs outside transactions. Only `platformRole` is removed; unrelated claims are preserved. An absent claim is safe, an unexpected value fails closed, an uncertain write is reread, and a missing Auth user after prepare is accepted only as observed absence of the derived claim.
- Post-prepare failure uses forward recovery. Narrow Revoke-only Store primitives checkpoint `recovery_required/prepared` and resume without a second decrement or generic takeover.
- Finalization atomically produces `revoked/null`, server-owned `revokedAt`, server-derived `revokedBy`, a succeeded/completed command and a Critical final audit. Finalize/replay are idempotent and do not mutate the count again.

The stable result has exactly seven fields: `commandId`, `correlationId`, `operation`, `resourceType`, `resourceId`, `status` and `replayed`, with `RevokePlatformAdmin`, `platform_authority`, the target UID and `succeeded`. No PII, raw claim, payload, credential, secret, SDK object or snapshot is persisted in the result or audit.

## Evidence

- Functions: strict TypeScript check/build, lint and ESM smoke pass; TS7016 and TypeScript errors are zero; 64/64 tests pass (six Revoke tests, baseline 58).
- Clean isolated Functions install/check/build/tests/lint/ESM passes without root `node_modules` dependence.
- Local Firestore Emulator (Temurin 21.0.12, Emulator 1.21.0, Firebase CLI 15.24.0): combined 20/20 passes — Store 11/11, Bootstrap 3/3, Recover 3/3 and Revoke 3/3. Revoke proves success/replay, same-target one-winner contention, and last-two-admin serialization. Store/Recover suites retain real retry, same-owner, atomic audit and idempotent-finalization evidence.
- Package 0.11.0 remains unchanged and passes 40/40, strict type/runtime import, purity and cycle checks. Shared/repository suites pass 230/230. All four prechecks retain their exact published classifications; Rules preflight is 222/222 (88 ALLOW, 134 DENY); general tests are 35/35; production build and Node checks pass.
- Global source lint remains the legacy 13 errors/8 warnings; attributable delta is zero. Root audit remains 25 findings (3 low, 9 moderate, 13 high), and Functions remains 7 moderate; dependency delta is zero.
- Protected Rules/index/config hashes are unchanged. Only a local demo emulator was used and it was stopped cleanly.

## Risks, rollback and next step

Residual risk is limited to the required independent R6-C1 review and future operational adapter wiring. Rollback is the local technical commit; this phase performed no migration, remote write or deployment.

State: `SaaS-03B-C-R6 = completed_pending_human_review_and_push` and `RevokePlatformAdmin = implemented_and_validated`. The next exact microphase, after human review and push, is `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`. SaaS-03B-D and Phase 4 remain blocked/not started.
