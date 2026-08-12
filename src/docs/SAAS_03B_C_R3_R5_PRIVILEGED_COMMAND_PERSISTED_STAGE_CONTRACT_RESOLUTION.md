# SaaS-03B-C-R3-R5 — Privileged Command Persisted Stage Contract Resolution

## Purpose and definition

The v1 privileged-command record has 18 required exact-shape fields and no
persisted saga checkpoint. `running` and `recovery_required` therefore cannot
distinguish work before Firestore prepare from work whose prepare transaction
already committed. This resolution closes that gap without code.

`stage` means the last logical saga checkpoint whose durable state can be
proved from persisted documents, or whose external state must be reread before
continuation. It is not command status, audit naming, Authority/Registry state,
ownership, correlation, result, error, capability, or attempt number.

## Canonical catalog and field

Future public name: `PRIVILEGED_COMMAND_STAGES` in the existing package
`commands` surface. Exact frozen order, keys and values:

1. `NOT_STARTED: "not_started"`
2. `PREPARED: "prepared"`
3. `COMPLETED: "completed"`

The record field is exactly `stage`. It is required, non-null, enum-valued and
backend-owned. Client payloads cannot provide or mutate it. A newly created
record starts at `not_started`; this states that no Authority/Registry prepare
mutation has committed. `prepared` states that command-specific Firestore
prepare has committed and external Auth state must be observed/reconciled
before finalization. `completed` states that finalization committed atomically
with the succeeded record and final audit.

There is intentionally no `effect_applied`, `verification`, `finalize_pending`,
or generic `unknown` value. Auth calls are not transactional. After any success,
missing result, timeout, uncertain result, or process death, `prepared` remains
the strongest safe persisted statement. Verification is repeated before the
final transaction. A crash before finalization therefore cannot cause blind
effect replay or ambiguous double-finalization.

## Command × stage matrix

All three approved platform commands use the same minimal checkpoints; every
other command type is outside this platform-stage contract until separately
approved.

| Command | not_started | prepared | completed |
|---|---:|---:|---:|
| BootstrapPlatformAdmins | ALLOWED | ALLOWED | ALLOWED |
| RecoverPlatformAdmin | ALLOWED | ALLOWED | ALLOWED |
| RevokePlatformAdmin | ALLOWED | ALLOWED | ALLOWED |

An unknown command or stage is rejected. Existing non-platform command types
cannot use these stage invariants merely because they share the generic command
record; their future stage policy requires separate authorization before v2
materialization supports their writers.

## Status × stage matrix

| Status | not_started | prepared | completed |
|---|---:|---:|---:|
| pending | ALLOWED | DENIED | DENIED |
| running | ALLOWED | ALLOWED | DENIED |
| succeeded | DENIED | DENIED | ALLOWED |
| failed_retryable | ALLOWED | DENIED | DENIED |
| failed_terminal | ALLOWED | DENIED | DENIED |
| recovery_required | DENIED | ALLOWED | DENIED |

`running + not_started` means a leased attempt is validating/claiming the
command before prepare commits. `running + prepared` means active external-state
reconciliation or finalization work after prepare. The existing lease rule is
unchanged: only `running` may have non-null `leaseExpiresAt`.

`failed_retryable + not_started` is limited to retryable infrastructure failure
before any prepare commit and before any possible external effect.
`failed_terminal + not_started` is limited to immutable validation,
authorization, approval, conflict, or precondition failure before prepare.
Neither failure status may conceal a committed prepare or possible Auth effect.
After prepare, partial, failed, unverified, or uncertain external work is
`recovery_required + prepared`.

## Transitions, replay, and resume

Allowed stage transitions are `not_started → prepared → completed`, plus a
same-value no-op at each stage. Backward transitions and skipping directly from
`not_started` to `completed` are denied. The package will own catalog and
validation matrices; the Store will own legal mutation execution and each
command will own its business saga.

A succeeded command must be `completed`. Identical command ID, behavioral hash,
and correlation replays its stored result and performs no stage, Authority,
Registry, count, revision, ownership, or audit mutation.

Same-command `running + prepared` or `recovery_required + prepared` resumes by
rereading command, Registry, owned Authority records, and Auth state. It never
claims ownership again or repeats a count mutation already represented by
prepare. A different non-null `transitionCommandId` is `CONFLICT`; stage never
authorizes takeover. Competing Bootstrap remains serialized by Registry
`in_progress`/`recovery_required`, not by stage alone.

## Per-command prepared semantics

For Bootstrap, `prepared` proves Registry `in_progress`, activeCount zero, both
Authorities provisioning and owned by the command. Correct claims are retained,
missing claims are applied, uncertain outcomes are reread first, unexpected
claims or verification mismatch become `recovery_required + prepared`, and
only verified targets permit atomic completion with activeCount two.

For Recover, `prepared` proves the command owns any required recoverable
Authority transition and the Registry/command/audit prepare stage committed.
An already-active reconciliation leaves activeCount unchanged; activation from
non-active increments once only at finalization. Correct claims are retained,
missing claims reconciled, uncertain outcomes reread, and unexpected/mismatched
state remains `recovery_required + prepared`.

For Revoke, `prepared` proves active→revoking, ownership assignment, Registry
revision/history and the single activeCount decrement committed atomically.
A present claim is removed; absence is a safe observable state; uncertain
removal is reread first. Unexpected claims require fail-closed recovery. A
missing Auth user after prepare is acceptable evidence that no credential
retains the claim, subject to the approved verification/audit rules. Resume
never decrements again. Finalization changes the owned Authority to revoked,
clears ownership and leaves activeCount unchanged.

Audit event stage labels such as claim-observed, verification, recovery-required
and finalize remain event descriptions. They are related to, but are not values
of, the persisted command-stage catalog and cannot override it.

## Schema evolution and deployment

Adding required `stage` changes the exact persisted record from 18 to 19 fields,
so `COMMAND_SCHEMA_VERSION` advances from 1 to 2. Missing, v1, unknown, future,
missing-stage, unknown-stage, invalid command-stage, invalid status-stage,
unknown-field, missing-field, and malformed-timestamp records fail closed.
No reader infers stage from v1 status and there is no automatic v1→v2 migration.

Repository evidence is `NO_PERSISTED_PRODUCTION_COMMAND_DATA_EVIDENCE`: there
are no public privileged handlers, implemented business commands, backend
deployment performed by these phases, or remote Firebase use. This is bounded
repository evidence, not a claim about every external Firebase project.

First deployment writes only v2. If a v1 record is discovered before rollout,
deployment stops and a separate evidence-based migration/compatibility phase is
required. Writers always provide schema v2, `stage=not_started`, and approved
server-owned timestamps. Payloads cannot provide stage, schema, internal status,
lease, attempts, or timestamps.

Physical authority will be `@mipymetic/saas-contracts/commands`, using explicit
existing exports and generated declarations. No new subpath is needed. This is
an additive public API but a breaking persisted-schema revision; npm SemVer is
expected to advance minor from 0.9.0 when materialized because no supported v1
production reader/writer compatibility is promised and package consumers gain
new public values/validation.

## Next materialization, risk, and rollback

The next technical microphase materializes schema v2, catalog/matrices,
validators/types/tests/artifact, and explicit `privileged_command` and
`platform_audit` timestamp normalization from the already approved R3-R1
physical/logical policy. It must not implement the Transaction Store.

Primary risk is treating an audit action as a durable checkpoint; the minimal
catalog prevents that. Rollback before deployment is the future technical
commit. After any v2 write, rollback to a v1-only reader is prohibited without
data reconciliation.
