# SaaS-03B-C-R2 — BootstrapPlatformAdmins Command Contract Reconciliation

## Identity and result

No existing identifier covered the two gaps found by the 03B-C Audit Before
Edit. The new direct resolution is `SaaS-03B-C-R2`. It is documentation-only.

Result: **BOOTSTRAP CONTRACT FULLY CLOSED**. No shared primitive is missing.

## Historical gaps

03B-A-R1 listed an exact Bootstrap input without `correlationId`, while the
validated foundation requires it in `CommandEnvelope`, the exact persisted
command record and every audit event. It also allowed either resuming Auth claim
effects or clearing claims/resetting records after partial failure without a
deterministic selection rule.

## Final input and correlation contract

```text
{
  commandId,
  correlationId,
  environment,
  confirmationId,
  targets: [
    { uid, expectedNormalizedEmail },
    { uid, expectedNormalizedEmail }
  ]
}
```

Every field and nested field is required, non-null and exact-shape. There are
no optional fields. Unknown fields are rejected. Actor, roles, authority,
capabilities, claims, client timestamps, credentials, secrets, tokens, private
keys, service-account material and raw SDK/Auth objects are forbidden.
Identifiers use the package validator; environment uses closed configuration.
`confirmationId` references immutable two-person approval and is distinct from
correlation. Targets are exactly two, distinct by UID, and contain only the two
shown fields.

The operator supplies `correlationId`. It is validated as a document identifier,
persisted immutably and used unchanged by every audit event and stable result.
It is not generated server-side.

Consistent with 03B-A-R1, correlation is trace context and is excluded from the
canonical behavioral hash. That hash covers command type plus `environment`,
`confirmationId` and the ordered two-target value. An existing command record
still binds its original correlation: same command ID with a different
correlation ID is `CONFLICT`, even when the hash matches. Replay and resume use
and return the persisted original value; a later invocation cannot replace it.

## Deterministic partial-effect policy

Bootstrap uses **forward recovery only** after prepare. It never automatically
clears a correctly observed claim, deletes history or resets the registry. Auth
and Firestore cannot be rolled back atomically. Claims remain non-authoritative
until both authorities are activated in finalize.

| Claim A | Claim B | Required action |
|---|---|---|
| correct | correct | verify both and finalize |
| correct | missing | retain A, apply B, reread both |
| missing | correct | apply A, retain B, reread both |
| missing | missing | apply A then B, reread both |
| correct | uncertain | reread B; retain if correct, apply if missing |
| uncertain | missing/not attempted | reread A before any write, then reconcile both |
| uncertain | uncertain | reread both before any write, then reconcile missing claims |
| SDK success but verification mismatch | any | recovery_required; reread; never finalize |
| unexpected platformRole | any | CONTRACT_VIOLATION and recovery_required; do not overwrite |

Correct means exactly `platformRole = platform_admin`, preserving unrelated
claims. Missing means the property is absent. Uncertain describes an SDK result
that does not prove whether the effect committed. A non-approved present value
is unexpected and requires out-of-band security reconciliation.

If A fails before any possible effect, B is not attempted. If A succeeds and B
fails, A remains and B is retried. For uncertainty, no compensating write occurs
until reread establishes current state. Cleanup is not an automatic branch.

## Authority, registry and command matrices

| Stage | Authority A/B | bootstrapState | activeCount | Command |
|---|---|---|---:|---|
| initial | absent | uninitialized | 0 | absent |
| prepare | provisioning / provisioning | in_progress | 0 | running |
| partial/uncertain effect | recovery_required / recovery_required | recovery_required | 0 | recovery_required |
| resume claimed | provisioning / provisioning | in_progress | 0 | running |
| finalize | active / active | completed | 2 | succeeded |

Prepare creates both authority histories. Any known or uncertain post-prepare
failure marks both non-active records recovery-required and preserves command
ownership. Resume moves both to provisioning only for that command. Finalize
alone activates them.

`activeCount` stays zero through prepare, Auth effects, verification failure and
recovery. Finalize atomically sets exactly two only after both claims, Auth users
and Identities are reread and verified. Replay never increments again.

Each Firestore stage transaction increments registry `revision` exactly once,
sets `lastCommandId` to this command and uses server `updatedAt`: prepare,
mark-recovery-required, resume-claim and finalize. Auth calls alone do not mutate
registry metadata.

- `running`: an actively leased stage;
- `failed_retryable`: retryable infrastructure failure before prepare commits
  and before any possible external effect;
- `recovery_required`: prepare committed and an effect is partial, uncertain,
  failed or unverified;
- `failed_terminal`: immutable validation, approval or precondition failure
  before prepare; no authority/registry mutation occurred;
- `succeeded`: final proof and Critical audit committed atomically.

Attempts remain limited to five and execution timeout to twenty seconds.
Exhaustion after prepare retains `recovery_required`; it does not erase history.

## Resume, idempotency and concurrency

Resume starts by validating and rereading command, registry, both authorities,
both Auth users and claims, and both Identities. It verifies ownership, hash and
immutable correlation. It may idempotently set a missing approved claim while
preserving unrelated claims. It may not recreate authorities, increment count,
overwrite unexpected roles, or change command, targets, confirmation,
environment or correlation.

Same ID plus same behavioral payload and correlation replays/resumes. A changed
hash or correlation conflicts. A different command conflicts while registry is
`in_progress` or `recovery_required`, and fails precondition after `completed`.
There is exactly one initial bootstrap.

## Result, audit and errors

```text
{
  commandId,
  correlationId,
  operation: "BootstrapPlatformAdmins",
  resourceType: "platform_authority_registry",
  resourceId: "authorityRegistry",
  status: "succeeded",
  replayed
}
```

Every event is Critical and uses the persisted command/correlation. Stages are
prepare, claim-observed/applied per target, verification, recovery-required,
resume and finalize. Summaries are limited to authority status, registry state
and activeCount. Metadata is limited to stage, environment, confirmationId and
replayed. Emails, approver identities, targets, claims, raw Auth snapshots,
payloads, credentials and secrets are forbidden.

Existing errors suffice: malformed input is `INVALID_ARGUMENT`; invalid
approval is `FORBIDDEN`; required Auth/Identity absence uses the approved
`NOT_FOUND`/precondition mapping; shape, UID, claim or registry drift is
`CONTRACT_VIOLATION`; bootstrapped state is `FAILED_PRECONDITION`; payload,
correlation or competing owner is `CONFLICT`; temporary infrastructure failure
is `UNAVAILABLE`; other failures are sanitized `INTERNAL`/`UNKNOWN`.

## Completion proof

Before success, rereads must prove:

1. both enabled, verified Auth users match expected normalized emails;
2. both claims contain exactly the approved platformRole;
3. both exact Identities match their Auth UIDs;
4. both exact authority records are provisioning and owned by this command;
5. registry ownership/history is coherent and activeCount is zero;
6. the validated command record, hash and correlation are coherent;
7. one final transaction activates both, completes registry with activeCount
   two, succeeds the command and appends the final Critical audit.

Only after that commit may success be returned. Claims alone grant nothing.

## Architecture, risk and readiness

Package 0.7.0 and the validated foundation already provide every command,
status, record, authority, registry, audit, validation and error primitive.
Shared primitives missing: zero. No technical or Firebase change is required.

The residual risk is prolonged recovery-required state after uncertain or
unexpected Auth evidence. This is safer than destructive compensation and is
observable, resumable and history-preserving. Reconciliation is forward saga
completion, not rollback.

```text
SaaS-03B-C-R2 = completed_pending_human_review_and_push
SaaS-03B-C = blocked_pending_bootstrap_contract_resolution_push
SaaS-03B-D = blocked
SaaS-03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, all three 03B-C command contracts are closed and
`SaaS-03B-C` becomes `ready_to_implement`.
