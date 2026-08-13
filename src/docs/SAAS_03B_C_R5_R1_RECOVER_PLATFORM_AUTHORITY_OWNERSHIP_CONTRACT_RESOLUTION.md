# SaaS-03B-C-R5-R1 — Recover Platform Authority Ownership Contract Resolution

## Authority and scope

The identifier is the first available child of R5 in the Implementation Order.
The decision reconciles Architecture Freeze and ADR-006; 03B-A/A-R1; the
validated Foundation and C1 lineage; R1 Recovery/Revoke; R2 Bootstrap; R3-R1
through R3-R7; R4 and R4-C1/R1; package 0.10.0 Authority/Registry/Command/audit
contracts; the Store, Bootstrap and their unit/Emulator evidence. Normative
architecture controls the decision, the package is shared physical authority,
and Functions is implementation evidence. This phase changes documentation
only and starts no command.

## Result and blocker reproduction

Result: **RESULT B — SHARED RECOVER OWNERSHIP CONTRACT GAP**. R5 remains
unimplemented. Package 0.10.0 exposes Authority schema v1, Command schema v2
and Registry schema v1. Its Authority matrix requires a non-null
`transitionCommandId` for `provisioning`, `revoking` and `recovery_required`,
but requires null for `active` and `revoked`. The Store resumes the same owner,
conflicts on another owner and clears ownership on stable states.

Consequently, `active/null` plus a missing/stale claim cannot distinguish a
winning Recover from a competitor before Auth effects. Registry
`lastCommandId`, bootstrap history, correlation, audit, actor, timestamps,
claims and process locks are not Authority ownership. Separately, an Authority
owned by a prior command cannot be reinterpreted under a new Recover command:
command type, payload hash and correlation remain immutable and the Store
correctly conflicts on owner mismatch.

## Strategy decision

- **A — active to recovery_required:** rejected. It removes persisted active
  authority while retaining a count, can deauthorize the last administrator,
  and contradicts the rule that claim failure cannot remove active authority.
- **B — active to provisioning:** rejected. Provisioning describes authority
  not yet activated and has the same authorization/count inconsistency.
- **C — active with a non-null Recover owner:** selected. The Authority remains
  authoritative and counted while the owner serializes claim reconciliation.
- **D — new state:** rejected; no new lifecycle meaning is needed.
- **E — separate ownership document/field:** rejected as unnecessary after C;
  `transitionCommandId` remains the unique owner primitive.
- **F — Registry-only serialization:** rejected. Registry is a global ordering
  point and history, not target ownership, and cannot prove same-target resume.

Strategy C changes the package-owned status-owner matrix and therefore cannot
be implemented with schema v1. Platform Authority schema v2 keeps the same 14
fields but permits `active` with either null (stable) or a valid owner (Recover
claim reconciliation). `revoked` remains null-only; provisioning, revoking and
recovery_required remain owner-required. Cross-document Store validation must
prove that an active non-null owner identifies a schema-v2
`RecoverPlatformAdmin` command in `running/prepared` or
`recovery_required/prepared`; package shape validation alone does not grant
authority or authorize ownership.

## Active reconciliation invariants

Prepare is atomic across new Command, Authority, Registry and Critical audit:
`active/null -> active/recoverCommandId`, command `running/prepared`, Registry
`in_progress`, revision +1, `lastCommandId = recoverCommandId`, server updated
time, and `activeCount` delta 0. The Authority remains eligible for ordinary
platform authorization because status stays active; claims remain non-authority.

Resume and recovery-required deltas are 0. If Auth reconciliation fails after
prepare, command becomes `recovery_required/prepared`, Registry becomes
`recovery_required`, and Authority remains `active/recoverCommandId`; it stays
authorized and counted. Finalize verifies Auth, Identity and claim, records
server-owned claim sync, clears the owner atomically, completes Registry and
command, and applies delta 0. A single active administrator therefore remains
persisted authority throughout; last-admin safety is not weakened.

Concurrent Recover commands serialize on Registry and the target Authority.
Exactly one null-to-command owner claim can commit; the loser rereads a foreign
owner and receives `CONFLICT` before Auth. Recover on distinct Authorities may
progress through separate committed stages, but Registry mutations serialize,
each real stage increments revision once and updates lastCommandId as history.

## Authorized break-glass handoff

Handoff is allowed only as an explicit transaction, never generic takeover.
Same command/payload/correlation is resume, not handoff. A new Recover may
replace a prior owner only when all of these are true:

- the new two-person approval is valid and binds environment, project and the
  same target UID;
- Authority is `provisioning` or `recovery_required` and its current owner is
  the prior command ID;
- prior command exists, validates, is the exact ID stored on the target
  Authority path, and is `recovery_required/prepared`;
- prior type is `RecoverPlatformAdmin`;
- Registry validates as `recovery_required`, its count is coherent, and the
  Auth/Identity target preconditions pass before the transaction;
- the new Recover command is `pending/not_started` with its own valid binding;
- all documents are reread in one retry-safe transaction.

`BootstrapPlatformAdmins` ownership is not eligible because an unactivated
provisioning target is not a previously established Authority and Bootstrap
must resume its two-target saga. `RevokePlatformAdmin` ownership is never
eligible: its saga must resume or be resolved by its own contract, and Recover
cannot undo revocation. A prior running command is a live owner and conflicts,
regardless of lease; no lease expiry authorizes takeover. Pending, succeeded, failed-retryable,
failed-terminal, malformed or missing prior commands are ineligible: malformed
or missing ownership evidence is `CONTRACT_VIOLATION`; valid but disallowed
states are `FAILED_PRECONDITION`; a live/different owner is `CONFLICT`.

The existing two-person Recover confirmation is sufficient evidence; no PII,
approver identity or new approval field is persisted. The prior command remains
immutable historical `recovery_required/prepared`. The atomic handoff writes
the new command `running/prepared`, changes Authority to
`provisioning/newRecoverCommandId`, changes Registry to `in_progress`, applies
count delta 0, increments revision once, sets lastCommandId and server time, and
writes a Critical handoff audit. If the new attempt later fails, Authority,
Registry and command become `recovery_required` owned by the new command.

Exact prior-owner matrix:

| Prior evidence | Decision |
|---|---|
| same Recover command and binding | `SAME_OWNER_RESUME` |
| Recover, `recovery_required/prepared`, Authority `recovery_required` | `ALLOW_HANDOFF` with new approval |
| Recover, `running/prepared` | `CONFLICT`; live owner, lease expiry does not change this |
| Bootstrap, any owned transitional state | `FAILED_PRECONDITION`; Bootstrap must resume |
| Revoke, any owned transitional state | `FAILED_PRECONDITION`; Revoke must resume |
| valid pending/not-started, succeeded/completed, failed-retryable/not-started or failed-terminal/not-started | `FAILED_PRECONDITION` |
| missing or malformed prior command | `CONTRACT_VIOLATION` |
| concurrent handoff already committed | reread foreign owner, `CONFLICT` |
| state/type outside the platform-command model | `NOT_APPLICABLE` / fail closed |

For a previously non-active recoverable Authority, successful finalize changes
`provisioning/newOwner -> active/null` and increments activeCount exactly once.
Same-owner retry, handoff retry and repeated finalize apply no second delta.

## Store, audit and error contract

The current generic `mutate` API cannot safely validate the prior command or
distinguish ownership claim from authorized handoff. The materialization must
add narrow atomic Store primitives (names to follow repository conventions)
for active Recovery ownership claim and prior-owner handoff. They must read the
new command, prior command when applicable, Authority and Registry before all
writes, enforce package validators, precompute audit IDs, prohibit external
effects and remain Emulator-testable.

Ownership claim/handoff audit is Critical with operation
`RecoverPlatformAdmin.prepare` or `RecoverPlatformAdmin.ownership_handoff`,
resourceType `platform_authority`, resourceId target UID, result
`succeeded`/`recovery_required`, bounded `authorityStatus`, `registryState` and
`activeCount` summaries, and allowlisted `stage`, environment, project and
confirmation metadata. It contains no email, claim object, payload, approval
artifact, credentials, secrets or prior command payload.

Existing error codes suffice: invalid input `INVALID_ARGUMENT`; invalid
approval `FORBIDDEN`; missing target evidence `NOT_FOUND`; malformed ownership
or Registry evidence `CONTRACT_VIOLATION`; ineligible lifecycle
`FAILED_PRECONDITION`; live/competing/concurrent owner `CONFLICT`; transient
infrastructure `UNAVAILABLE`. No new error or result field is required. The
stable seven-field result remains operation `RecoverPlatformAdmin`,
resourceType `platform_authority`, resourceId target UID and no PII.

## Package and migration impact

Required shared materialization:

1. `PLATFORM_AUTHORITY_SCHEMA_VERSION: 1 -> 2`;
2. generated type literal and validator update for the v2 status-owner matrix;
3. explicit tests for active null/non-null, stable revoked, all transitional
   owners and unknown/future versions;
4. Functions Store types/readers/writers and Bootstrap regression updates;
5. canonical artifact/version/lockfile cutover and isolated consumption tests.

This is a public additive/semantic contract release following the repository's
0.x schema precedent; expected SemVer is minor `0.10.0 -> 0.11.0`, subject to
the materialization's canonical SemVer audit. V1 and v2 must not share changed
semantics. The first approved writer emits v2 only; v1 readers do not infer an
owner or stage. Repository history records no remote privileged-backend deploy
or command execution, so no automatic migration is authorized. Any discovered
persisted v1 Authority at deployment is a STOP requiring a separate inventory
and migration decision.

Bootstrap remains normatively unchanged but must consume schema v2 and rerun
unit/Emulator regression. Rules, indexes, Storage and Firebase configuration
have no impact. Recover/Revoke interaction remains owner-based: same-target
Revoke conflicts while Recover owns it; different-target operations serialize
only their Registry stages.

## Continuity

No technical files changed and technical regression is
`NOT_RUN_DOCUMENTATION_ONLY`. After human review and push, the exact next
microphase is `SaaS-03B-C-R5-R1-R1 — Recover Platform Authority Ownership
Shared Contract Materialization`. Recover implementation remains blocked until
that package and Store boundary pass their own tests and Emulator evidence.

Rollback before push is removal of this document and its roadmap checkpoint.
No Firebase remote operation, deploy, data mutation or push occurred.
