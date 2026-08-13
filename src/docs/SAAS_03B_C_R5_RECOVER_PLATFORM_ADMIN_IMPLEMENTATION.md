# SaaS-03B-C-R5 — RecoverPlatformAdmin Implementation

## Result

`RecoverPlatformAdmin` is implemented and validated as an internal break-glass
business command. It has no callable/HTTP handler and does not implement
`RevokePlatformAdmin`. The command consumes `@mipymetic/saas-contracts` 0.11.0,
Platform Authority schema v2, command schema v2 and the R5-R1-R1 Transaction
Store ownership primitives.

## Closed command surface

The exact, closed payload is `commandId`, `correlationId`, `environment`,
`projectId`, `confirmationId` and one `target` containing only `uid` and
`expectedNormalizedEmail`. Every field is required and non-nullable. Unknown,
authority-bearing, credential, timestamp, SDK and approval-detail fields fail
closed. Package-owned identifier validation is consumed through explicit
`ValidationResult.ok` checks.

The injected approval port attests the confirmation, environment, project,
target and two-distinct-human boundary before persistence or Auth effects. The
command validates the complete persisted Identity shape and Auth user
eligibility/coherence before ownership. Approval and Auth/Identity details are
not persisted.

## Ownership and saga

- An active Authority is claimed with `claimActiveRecoveryOwnership` as
  `active/null -> active/currentRecoverCommandId`. It remains authoritative and
  counted; Registry revision advances once, `lastCommandId` records the Recover
  command, and command state becomes `running/prepared` atomically with a
  Critical audit.
- Handoff uses `handoffRecoveryOwnership` only from a prior
  `RecoverPlatformAdmin` command in `recovery_required/prepared`, producing
  `provisioning/newRecoverCommandId`. The prior command is immutable.
  Bootstrap, Revoke, live, missing and malformed prior owners are rejected; no
  generic or lease-expiry takeover exists.
- Auth runs only after committed ownership and outside Firestore transactions.
  It preserves unrelated claims, changes only `platformRole`, rereads after a
  write or uncertain result, and treats an incompatible role as a contract
  violation.
- Failures after prepare use forward recovery. Active reconciliation retains
  `active/currentRecoverCommandId`; non-active recovery uses
  `recovery_required/currentRecoverCommandId`. Registry and command become
  `recovery_required` / `prepared`; there is no cross-service rollback.
- Finalization clears ownership, persists server-owned claim-sync timestamps,
  completes Registry and command, and writes Critical audit atomically. Active
  reconciliation has count delta zero. Non-active activation increments by one
  exactly once. Repeated or concurrent finalization is read-only/idempotent.

The stable result has exactly `commandId`, `correlationId`, `operation`,
`resourceType`, `resourceId`, `status` and `replayed`, with operation
`RecoverPlatformAdmin`, resource type `platform_authority` and resource ID the
target UID. Replay is read-only and produces no Auth write, Store mutation,
Registry revision, count delta or audit.

## Security and audit

All command, Registry, Authority and Identity reads are normalized then
validated fail-closed. Firestore callback work is deterministic: no Auth,
network, randomness or process-clock authoritative timestamps. Audit IDs are
precomputed, level is `CRITICAL`, metadata is bounded to stage/environment/
project/confirmation, and no email, raw claim, raw payload, approval artifact,
credential, secret, SDK object or stack is included.

## Evidence

- Functions clean install/check/build/tests/lint: PASS; 54/54 tests; strict and
  `noImplicitAny`; TS7016 = 0; TypeScript errors = 0; lint = 0/0.
- Recover unit tests: 7/7. Recover Firestore Emulator: 3/3. Bootstrap Emulator:
  3/3. Transaction Store Emulator: 9/9. The combined 15/15 run proves active
  one-winner contention, prior-Recover handoff, count-neutral reconciliation,
  exactly-once activation, transaction retry safety, physical server
  timestamps and atomic audits.
- Package: 40/40, runtime imports 8/8, purity/cycles/declarations unchanged;
  canonical 0.11.0 artifact SHA-256
  `302c3a0960318eeab982618d9b720b3cf66c920cbc9688e91e6c9cc04a2b5c58`.
- Repository suites: RegistrationRequest 52/52, Membership 81/81, Course
  114/114 and Enrollment 112/112. The canonical prechecks remain respectively
  52, 81, 114 and 111 cases with their approved classifications.
- Rules preflight: 222/222 (88 ALLOW, 134 DENY). General tests: 35/35. Root
  production build: PASS. Protected Firebase/Rules hashes are unchanged.
- Root audit remains 25 (3 low, 9 moderate, 13 high); Functions remains 7
  moderate. No dependency change or audit fix was made.
- Global lint currently reports 16 legacy errors and 8 warnings. Recover and
  Functions lint are clean, so the attributable delta is zero. The older
  documented 13-error baseline has drifted outside this microphase and was not
  modified.

Only local demo Firestore Emulator was used (Temurin 21.0.12, Emulator 1.21.0,
Firebase CLI 15.24.0), with clean shutdown. No Firebase remote operation,
deployment, Rules/index/config change or migration occurred. Native Node is
24.15.0; the declared Functions engine remains Node 22 with ES2022/NodeNext.

## Risk, rollback and next step

The remaining operational risks are the intentional break-glass approval port
integration and future independent review. Rollback is the technical commit;
no remote data exists from this work. Encountering a schema-v1 Authority in a
future deployment remains a fail-closed STOP requiring separate inventory and
migration.

State: `SaaS-03B-C-R5 = completed_pending_human_review_and_push` and
`RecoverPlatformAdmin = implemented_and_validated`. After human review and
push, the exact next microphase is an independent R5-C1 review. Revoke remains
not implemented; SaaS-03B-D and Phase 4 remain blocked/not started.
