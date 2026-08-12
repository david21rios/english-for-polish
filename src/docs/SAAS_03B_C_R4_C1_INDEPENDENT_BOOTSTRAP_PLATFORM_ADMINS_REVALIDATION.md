# SaaS-03B-C-R4-C1 — Independent Bootstrap Platform Admins Revalidation

## Decision and forensic scope

The independent revalidation of the published R4 implementation after
R4-C1-R1 is PASS. The R4 technical commit contains only six Functions paths;
the R1 technical commit contains only five Functions paths; both documentation
commits contain documentation only. Package, Domain, Shared, Rules, client,
UI, Recovery, Revoke and public-handler scope remain untouched.

The exact Bootstrap input remains `commandId`, `correlationId`, `environment`,
`confirmationId` and exactly two distinct `{ uid, expectedNormalizedEmail }`
targets. Every field is required/non-null, unknown and spoofing fields fail
closed, and invalid document identifiers are rejected before path, persistence
or Auth use. Approval binds confirmation, environment and the target UID set.

## Persisted Identity and pre-prepare boundary

The exact required Identity fields are `uid`, `email`, `displayName`,
`photoURL`, `emailVerified`, `interfaceLocale`, `createdAt`, `updatedAt`.
String/type/nullability, UID/email coherence, verification, exact keys and both
timestamps are validated after shape-aware Firestore Timestamp normalization.
There are no defaults, silent cleanup or trusted persisted-data casts.

An independent malformed specimen with numeric `displayName`, object
`photoURL`, null `interfaceLocale`, invalid `createdAt` and array `updatedAt`
was rejected as `CONTRACT_VIOLATION`. Published negative matrices reject each
of those defects independently. Valid-A/malformed-B and malformed-A/valid-B
both leave command, Registry, Authority, prepare audit and Auth writes at zero.

Auth UID, target UID and Identity UID must match. Normalized Auth, expected and
Identity email must match; missing/disabled/unverified Auth users and malformed,
missing, mismatched or unverified Identities fail closed before prepare.

## Saga, recovery and replay

Claims remain derived cache only. Bootstrap preserves unrelated claims, writes
only `platformRole = platform_admin`, treats an already-correct claim as a
no-op, rereads uncertain writes and rejects unexpected roles.

Prepare atomically moves Registry to `in_progress`, creates both provisioning
Authorities owned by the same command, keeps `activeCount = 0`, persists
`running/prepared`, and writes its Critical audit. Auth effects stay outside the
transaction. Competing Bootstrap commands produce one owner; callback retry
does not duplicate Authorities, audit, revision or count.

Partial or uncertain effects use forward recovery only:
`recovery_required/prepared`, Registry `recovery_required`, unchanged ownership
and count zero. Same-owner resume rereads Command, Registry, Authorities,
Identities, Auth users and claims. Different-owner takeover fails closed.

Finalize requires both coherent targets and correct claims. It atomically makes
Authorities active, clears transition ownership, writes server timestamps,
completes Registry with `activeCount = 2`, persists `succeeded/completed`, and
writes one Critical audit. Repeated/concurrent finalize never produces count
four. Completed replay is read-only, performs no Auth/Store/audit mutation and
returns the exact seven-field non-PII result with `replayed = true`; payload or
correlation drift conflicts.

## Evidence

- Functions strict check/build/tests: 43/43; lint 0/0; TS7016 and TS errors 0.
- Clean isolated Functions install/check/build/tests, ESM and 8/8 runtime/type
  package consumption: PASS.
- Bootstrap Emulator: 3/3; Store Emulator: 5/5 on Firestore Emulator 1.21.0
  and Temurin Java 21.0.12; real retry observed and clean shutdown left zero
  Java processes.
- Package 0.10.0: 40/40; zero runtime dependencies/cycles; artifact SHA-256
  `a07d283ebae2b6a81d7460eaeddbeeea6f7caf577611dc8c92d7ad014f1caca1`.
- Shared 51/51; repositories 360/360 (59/59, 23/23, 51/51, 46/46); prechecks
  111/42/69, 114/32/82, 81/44/37 and 52/34/18; Rules 222/88/134; general
  35/35; production build PASS.
- Global lint remains the legacy 13 errors/8 warnings with attributable delta
  zero. Root audit is 25 (3 low, 9 moderate, 13 high); Functions is 7 moderate.
- All six protected hashes and the package artifact hash match their published
  values. No Firebase remote access, deploy or push occurred.

Timestamp reads remain Firestore Timestamp to canonical ISO to validator;
writes remain `ServerOwnedTimestamp` to `FieldValue.serverTimestamp()`. Audit
is Critical, bounded and linked to command/correlation without email, claims,
raw payload, secrets, snapshots or stack data.

## Risk, continuity and rollback

Auth and approval remain injected operational boundaries; real deployment and
ceremony validation are deferred. Native Node 22 was unavailable locally
(Node 24.15.0); engine 22, ES2022 and NodeNext remain configured. No technical
defect or new blocker was found.

Rollback before push is removal of this document and the checkpoint addition;
no technical or remote state changed. R4 is completed, R4-C1-R1 is completed,
R4-C1 is `completed_pending_human_review_and_push`, Bootstrap is independently
validated, and Recover is `ready_not_started` for a separate post-push phase.
