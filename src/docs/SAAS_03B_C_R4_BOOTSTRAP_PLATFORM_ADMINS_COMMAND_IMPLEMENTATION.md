# SaaS-03B-C-R4 — Bootstrap Platform Admins Command Implementation

## Result and contract

`BootstrapPlatformAdmins` is implemented and validated as an internal Functions
service API, without callable/HTTP transport or deployment. Its closed input
requires `commandId`, `correlationId`, `environment`, `confirmationId`, and
exactly two distinct `{ uid, expectedNormalizedEmail }` targets. All fields are
required/non-null; unknown and authority-spoofing fields fail closed.
Correlation is immutably command-bound while the behavioral hash covers the
environment, confirmation and targets.

## Boundaries and saga

An injected approval port verifies the out-of-band confirmation, environment
and target set. Injected Identity and Auth ports verify UID, enabled/verified
Auth users, normalized email and persisted Identity coherence. The Admin
adapter preserves unrelated claims and writes only `platformRole =
platform_admin`; claims never become authority.

Prepare atomically claims Registry and both absent Authorities, keeps
`activeCount = 0`, and moves the command to `running/prepared`. Auth effects
run outside Firestore transactions, A before B. Correct claims are no-ops;
uncertain writes are reread; unexpected claims fail closed. Partial/uncertain
effects enter `recovery_required/prepared`, retain both owners and count zero,
using forward recovery without compensation.

Same-command resume rereads persisted state, Identities, Auth users and claims
without repeating prepare. After both targets verify, finalize atomically makes
Authorities active, clears ownership, writes server-owned activation/claim-sync
times, completes Registry with `activeCount 0 -> 2`, and persists
`succeeded/completed`. Concurrent/repeated finalize is read-only, preventing a
second increment or audit. Replay is also read-only and returns `replayed=true`.

The exact seven-field result contains no PII. Critical audits use deterministic
IDs and allowlisted stage/environment/confirmation/target-index metadata, never
email, claims, raw payload, token or secret.

## Evidence

Functions are 40/40 (seven Bootstrap unit tests). Firestore Emulator 1.21.0 on
Temurin Java 21 passes 3/3 command tests: one competing owner; retry-safe
prepare without duplicate Authority/audit or revision drift; finalize count
exactly two; and same-owner recovery resume. The Store suite remains 5/5.

Strict TypeScript, TS7016 zero, lint 0/0, clean isolated install/build/tests,
ESM smoke and 8/8 runtime imports pass. Package stays 0.10.0 and 40/40; Shared
51/51; repositories 59/59, 23/23, 51/51, 46/46; four prechecks; Rules
222/88/134; general 35/35; root build; and 306 Node checks pass. Global lint is
the recorded legacy 13 errors/8 warnings with attributable delta zero.

Package/artifact and dependencies are unchanged. Root debt remains the recorded
25 findings and Functions 7 moderate. Protected Firebase/Rules/index files keep
their hashes. No Firebase remote operation, deploy or push occurred.

## Risk, rollback and continuity

Approval and Auth remain injected operational boundaries; real ceremony and
deployment validation are later controlled work. Firestore concurrency is real
local-emulator evidence; Auth uncertainty uses deterministic reread fakes.
Rollback before push is removal of the six technical paths and these docs; no
remote data or migration exists.

`SaaS-03B-C-R4 = completed_pending_human_review_and_push`; Bootstrap is
`implemented_and_validated`; Recover is `ready_not_started`; Revoke remains
sequence-blocked; SaaS-03B-C is `in_progress`; 03B-D and Phase 4 remain blocked
and not started.
