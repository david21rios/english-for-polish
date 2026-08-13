# SaaS-03B-D-R3-C1-R1 — BootstrapTenant Replay Result Binding Repair

## Decision

COMPLETE. The repair is implemented and validated, pending human review, push,
and a fresh independent R3-C1 revalidation.

## Defect and cause

R3-C1 confirmed `BOOTSTRAP_TENANT_REPLAY_RESULT_BINDING_UNVALIDATED`.
`validateBootstrapTenantResult` correctly validated an isolated seven-field
shape, but neither BootstrapTenant orchestration nor the Store race path proved
that the persisted result belonged to the persisted Command and Tenant. The
orchestrator reconstructed a response from current input, hiding corruption.

The package contract was complete: the original committed execution persists
`replayed=false`, while a later exact replay returns `replayed=true` without
mutating persistence. Command/result composition belongs in Functions.

## Repair

A pure BootstrapTenant-specific composition helper now requires:

- result commandId equals persisted Command commandId;
- result correlationId equals persisted Command correlationId;
- operation is `BootstrapTenant`;
- resourceType is `tenant`;
- resourceId equals the coherent persisted/request tenantId;
- status is `succeeded`;
- persisted replayed is exactly false.

The helper first consumes the package validator's `.ok`. Any malformed or
incoherent value raises `CONTRACT_VIOLATION`; it never heals or rewrites data.
Both the orchestration pre-read and the Store's existing-command transaction
path call the same helper, covering the concurrency window without generic
flags or package changes.

## Evidence

- BEFORE: a result using foreign commandId, correlationId and resourceId with
  `replayed=true` passed the isolated package validator and was accepted by the
  published replay path.
- AFTER unit matrix: foreign commandId/correlationId/resourceId, wrong
  operation/resourceType/status/replayed, missing/extra field and malformed
  identifier all fail with `CONTRACT_VIOLATION` and zero mutations.
- Correct replay returns the exact seven-field response with `replayed=true`,
  while the persisted canonical result remains byte/semantic-equivalent with
  `replayed=false`.
- Functions: 73/73 (baseline 71), check/build/lint PASS, TS7016 zero, strict and
  noImplicitAny enabled, ESM PASS.
- BootstrapTenant Firestore Emulator: 5/5, including physical corruption of
  commandId, correlationId and resourceId, zero healing/writes, valid replay,
  contention and retry regressions.
- Platform Store/BootstrapPlatformAdmins/Recover/Revoke Emulator: 22/22 PASS.
  Emulator and hub shut down; Java process count zero.
- Clean isolated Functions `npm ci`, check, build, 73/73 tests, lint and ESM:
  PASS.
- Package 0.12.0 remains unchanged: 45/45, types/imports/purity/cycles PASS;
  artifact SHA-256
  `b1cf45cc5e36f1b4d09929dc47ac79b3b7d7e86eb01b633c46cdf13f9636dcdb`.
- Shared/repositories remain 51/59/23/51/46. Prechecks remain 111/42/69,
  114/32/82, 81/44/37 and 52/34/18. Rules preflight remains 222/88/134;
  general tests 35/35, root build and 287 Node checks PASS.
- Global lint baseline after removing derived Functions output is 13 errors and
  8 warnings; attributable delta is zero. Audits remain root 25 findings
  (3 low, 9 moderate, 13 high) and Functions 7 moderate, delta zero.
- Protected hashes match. Firebase remote and deployment were not used.

## Scope and state

Technical changes are limited to BootstrapTenant orchestration, its narrow
Store helper, unit tests and Emulator characterization. Package, Domain,
Shared/client, Rules, indexes, Firebase config and UI are unchanged.

`SaaS-03B-D-R3-C1-R1 = completed_pending_human_review_and_push`;
`SaaS-03B-D-R3-C1 = blocked_pending_R1_push_and_revalidation`; and
`BootstrapTenant = repaired_pending_independent_revalidation`. After push, the
only next phase is the resumed independent R3-C1 review. No push is performed.
