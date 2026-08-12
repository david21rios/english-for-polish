# SaaS-03B-C-R3-R3 — Platform Authority Registry State and Last-Command Contract Resolution

## Status and lineage

`SaaS-03B-C-R3-R3` is a documentation-only resolution, complete pending human
review and push. It follows the published schema-version, timestamp and
transition-ownership resolutions (`R3`, `R3-R1`, `R3-R2`). The attempted
Registry Validation and Server-Owned Timestamp Boundary correctly stopped
because a physical state catalog and exact `lastCommandId` nullability were not
yet approved. This resolution closes only those normative gaps.

## Evidence and exact persisted shape

03B-A-R1 defines `platformControl/authorityRegistry`, its exact six fields,
Bootstrap prerequisite `uninitialized`, the prepare/finalize/recovery stages,
and transactional count protection. R1 and R2 subsequently require every
Registry mutation to increment revision once, set `lastCommandId` to the
command, and use server `updatedAt`. R3 independently fixes Registry schema
version 1. No later authority contradicts those decisions.

Registry schema v1 has exactly these keys, in order:

```text
schemaVersion
bootstrapState
activeCount
revision
lastCommandId
updatedAt
```

Unknown or missing fields are invalid.

| Field | Required | Nullable | Contract |
| --- | --- | --- | --- |
| `schemaVersion` | yes | no | literal `PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION` (`1`) |
| `bootstrapState` | yes | no | one canonical Registry state |
| `activeCount` | yes | no | server-owned integer, `>= 0` |
| `revision` | yes | no | server-owned integer, `>= 0` |
| `lastCommandId` | yes | yes | null only for `uninitialized`; otherwise valid document/command ID |
| `updatedAt` | yes | no | server-owned persisted timestamp; logical canonical ISO UTC |

## Canonical state catalog

The future single physical authority is:

```text
PLATFORM_AUTHORITY_REGISTRY_STATES = {
  UNINITIALIZED: "uninitialized",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  RECOVERY_REQUIRED: "recovery_required"
}
```

Order and casing are contractual as shown. The future object and its derived
values must be frozen consistently with existing package enums. It is a public
shared persisted contract targeted to `@mipymetic/saas-contracts/authority`
and the package root through explicit exports. Functions must not define a
local duplicate.

State meanings:

- `uninitialized`: Registry exists but no Bootstrap command has claimed or
  mutated it. This state is used only before initial Bootstrap.
- `in_progress`: the command recorded in `lastCommandId` most recently mutated
  the Registry and Bootstrap/recovery work is actively resumable.
- `completed`: initial Bootstrap completed. It remains the normal global
  bootstrap state during ordinary recovery or revoke mutations unless a
  command must mark global recovery-required state.
- `recovery_required`: a committed Registry stage requires deterministic
  reconciliation/resume by the command recorded in `lastCommandId`.

`bootstrapState` retains its historical name. It is the global Platform
Authority bootstrap/recovery readiness state, not the lifecycle status of an
individual Authority. Ordinary revoke does not reset completed Bootstrap.

## Initial Registry

The Registry exists before the first privileged command so concurrent
Bootstrap attempts can transactionally contend on one canonical document. Its
exact initial logical values are:

```text
schemaVersion: 1
bootstrapState: "uninitialized"
activeCount: 0
revision: 0
lastCommandId: null
updatedAt: <non-null server-owned timestamp>
```

Creation/provisioning of this initial constraint document is an operational
prerequisite; it is not a business command implemented by this resolution.

## `lastCommandId`

`lastCommandId` is a required key and is nullable only in the exact initial
`uninitialized` state. It is Registry-wide history and optimistic coordination:
the valid ID of the most recent privileged command whose committed transaction
mutated Registry state, count, revision or recovery metadata.

It is not `transitionCommandId`, an Authority lock, `bootstrapCommandId`,
`correlationId`, actor identity or audit ID. A future Store must separately
compare Authority transition ownership where relevant.

| Registry state | Value | Meaning and replacement |
| --- | --- | --- |
| `uninitialized` | `null` only | no command has mutated the Registry |
| `in_progress` | valid non-null ID | command that most recently prepared or resumed Bootstrap/recovery |
| `completed` | valid non-null ID | most recent command whose transaction completed or mutated the completed Registry |
| `recovery_required` | valid non-null ID | command whose committed stage requires reconciliation |

Every approved Registry-mutating transaction replaces `lastCommandId` with its
own command ID, including prepare, recovery marking, resume, finalize, recovery
and ordinary revoke stages. A replay that performs no Registry write does not
replace it. Same-command resume may observe its own ID; a different-command
decision remains Store/business policy and cannot infer individual Authority
ownership from this field.

## Local state invariants

- `schemaVersion` is exactly 1.
- `activeCount` and `revision` are finite non-negative integers.
- `uninitialized` requires `activeCount=0`, `revision=0`, and
  `lastCommandId=null`.
- Non-`uninitialized` states require a valid non-null `lastCommandId`.
- `updatedAt` is required, non-null and server-owned for initial creation and
  every persisted Registry mutation.
- `revision` increments exactly once per committed Registry-mutating stage.

No additional universal count/state relation belongs to the local validator.
In particular, `in_progress` and `recovery_required` can legitimately retain
zero or nonzero counts depending on the already-approved saga, and
`completed` count correctness depends on directly-read Authority records.

## Lifecycle interactions

The approved Bootstrap path is:

```text
uninitialized -> in_progress -> completed
                       |
                       v
              recovery_required
                       |
                       +-> in_progress -> completed
```

`completed` is terminal for initial Bootstrap: it cannot return to
`uninitialized` or begin another initial Bootstrap. `recovery_required` is not
terminal. Direct `uninitialized -> completed`, `uninitialized ->
recovery_required`, and any transition back to `uninitialized` are forbidden.

RecoverPlatformAdmin accepts the already-approved completed or
recovery-required Registry contexts, updates count only when activation
eligibility actually changes, and records its command/revision/server time on
each Registry mutation. RevokePlatformAdmin preserves `bootstrapState` as
`completed` for the ordinary successful path while transactionally changing
count, revision, last command and server time. Command-specific count checks,
direct Authority reconciliation and transition ownership remain deferred to
the Transaction Store/business layer.

## Future validator and package authority

The future package-owned `validatePlatformAuthorityRegistry` must be pure,
non-throwing, frozen-`ValidationResult`, exact-shape and fail-closed. It must use
the new state catalog, explicit Registry version, identifier validator and
canonical persisted timestamp validator. Missing/unknown/future versions,
states, keys or invalid local invariants fail validation. Functions maps that
failure to its existing backend contract taxonomy without exposing raw data.

Adding the public state catalog and validator is backward-compatible public API
and must receive the SemVer increment appropriate to the package version at the
time of materialization (normally MINOR). This resolution does not reserve a
version and leaves the current package at `0.8.0`.

## Risks, rollback and next step

The main risk is confusing Registry-wide history with Authority ownership; the
separate fields and validation rules explicitly prevent that. A second risk is
overloading the local validator with saga/count policy; those cross-document
checks remain deferred.

Rollback is a documentation revert before technical materialization. No data,
package, Functions, Rules or Firebase state changed here.

After human review and push, resume the technical Platform Registry Validation
and Server-Owned Timestamp Transaction Boundary prerequisite. That phase may
materialize the state catalog, Registry validator, portable server-time token
and Firestore read normalization. It must stop before the Transaction Store.
