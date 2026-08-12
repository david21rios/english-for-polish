# SaaS-03B-C-R1 — Platform Recovery and Revocation Command Contract Resolution

> Subsequent resolution: `SaaS-03B-C-R1-R1` closes the shared contract gap by
> adding package-owned capability `platform.authority_revoke`, scoped to
> `platform_authority` at platform scope and assigned only to `platform_admin`.
> This preserves the original gap as historical traceability; Recovery remains
> capability-free and revoke implementation remains outside this document.

## Decision

`SaaS-03B-C-R1` is a new resolution identifier beneath `SaaS-03B-C`; no prior
identifier existed for this gap. This documentation-only microphase closes the
business contracts of `RecoverPlatformAdmin` and `RevokePlatformAdmin` without
implementing them or reopening `BootstrapPlatformAdmins`.

Result: **CONTRACTS_CLOSED_BUT_SHARED_CONTRACT_GAP**. Package 0.6.1 contains
the necessary command/status/record, authority lifecycle/registry, audit,
error, path and validation primitives except an exact capability for ordinary
platform-authority revocation. Recovery is break-glass and intentionally has no
role capability. Revoke must not be authorized by role alone, so implementation
waits for a package-owned capability and matrix assignment whose identifier
must be approved by a separate shared-contract microphase.

## Common rules

- Persisted `platformAuthorities/{uid}` is authority; claims are cache hints.
- Inputs are exact-shape. Unknown fields, client timestamps, actor, role,
  authority, capabilities, claims, credentials, secrets, SDK objects and raw
  Auth records are forbidden.
- Identifiers use package validation. Environment/project binding uses the
  closed foundation configuration; local/demo is `demo-polish-learning` only.
- Existing command records, canonical hashing, status/lease rules, retry limit
  5 and 20-second timeout apply. Same ID/payload replays or resumes; another
  payload is `CONFLICT` and Critical audit.
- Firestore stage transactions atomically update authority, registry, command
  and audit. Auth Admin effects occur between transactions, never inside one.
- Stable result is exactly `{ commandId, correlationId, operation,
  resourceType, resourceId, status, replayed }`: operation is the package
  command type, resourceType=`platform_authority`, resourceId=target UID,
  status=`succeeded`; no PII or raw records.
- Stage audit level is Critical. Allowed summaries are `authorityStatus`,
  `registryState`, `activeCount`; allowed metadata is `stage`, `environment`,
  `projectId`, `confirmationId`, `replayed`. Existing audit bounds apply.
- `confirmationId` references an immutable external approval. An injected
  verifier attests two distinct human approvers, validity, and exact command,
  target, environment and project scope. Approval contents/approver IDs are not
  persisted here. No approval collection is invented.

## RecoverPlatformAdmin

### Purpose, actor and payload

Recovery restores one previously established authority whose persisted/Auth
state is recoverable. It is neither initial bootstrap nor an ordinary route to
create platform administrators.

The executor is a least-privilege out-of-band ADC principal represented by its
verified principal identifier. It may be one approver; the two approvers must
be distinct humans. No active platform authority or role capability is required
because recovery exists for loss of ordinary access.

```text
{
  commandId,
  correlationId,
  environment,
  projectId,
  confirmationId,
  target: { uid, expectedNormalizedEmail }
}
```

Every field and target subfield is required and non-null; none is optional.
Cardinality is exactly one. Auth user must exist, be enabled and email-verified
with matching normalized email. Identity must exist, be exact-shape and match
UID. `createMissingIdentity` is **OUT_OF_SCOPE**.

### Target matrix

| Authority state | Decision |
|---|---|
| missing | reject; initial bootstrap only for an uninitialized registry, otherwise integrity resolution |
| provisioning | resume only when owned by this command; otherwise conflict |
| active | recover only missing/stale claim; correct state is successful replay/no-op evidence |
| revoking | reject; owning revoke must resume |
| revoked | reject; terminal history |
| recovery_required | recover through provisioning and verification |

Registry input is exact-shape `completed` or `recovery_required`. `uninitialized`
requires bootstrap; `in_progress` requires bootstrap resume. Count must match
the relevant directly-read active records; arbitrary drift is
`CONTRACT_VIOLATION`, never silent repair. Claim reconciliation of an already
active authority leaves count unchanged. Recovery_required -> active increments
once at finalize. Every stage increments revision once and sets lastCommandId
and server updatedAt. Success leaves registry `completed`; a post-prepare
external failure leaves `recovery_required`.

### Saga and completion

1. **prepare:** verify operator, approval, environment/project, Auth, Identity,
   authority, registry and command; claim running command; retain active or move
   recovery_required -> provisioning; update registry and Critical audit.
2. **apply-claim:** preserve unrelated claims and set only platformRole. An
   already-correct claim is safe resume.
3. **verify:** reread enabled/verified Auth user, email and claim.
4. **finalize:** transactionally reread state; set authority active and server
   activation/claim-sync evidence; increment count only if previously non-active;
   complete registry and command and append final audit.
5. **failure:** uncertain/failed Auth verification marks non-active authority,
   registry and command recovery_required with Critical audit. An already-active
   authority remains authoritative; claim failure cannot remove its authority.

Success requires reread Auth/claim/Identity, active exact authority, coherent
registry/count/revision, succeeded command and final audit in the final commit.
Same succeeded command returns `replayed=true`; running/recovery_required resumes
from observations; terminal failure remains terminal.

## RevokePlatformAdmin

### Purpose, actor and payload

Revoke retires one active authority without deleting its history. Actor must be
an authenticated, enabled user with coherent Identity, active persisted
platform authority, and the missing future package-owned revoke capability.
Two-person approval/out-of-band execution is not required. **Self-revoke is
FORBIDDEN** because it prevents the actor from safely completing its own saga.

```text
{ commandId, correlationId, targetUid }
```

All fields are required/non-null; none is optional. Unknown/common forbidden
fields are rejected.

### Target matrix and last-admin

| Target state | Decision |
|---|---|
| missing | NOT_FOUND |
| active | allow after actor/capability/registry checks |
| provisioning | FAILED_PRECONDITION; bootstrap/recovery must finish |
| revoking, same command | RESUME |
| revoking, another command | CONFLICT |
| revoked, same succeeded command | REPLAY |
| revoked, another command | FAILED_PRECONDITION |
| recovery_required, same command | RESUME via revoking |
| recovery_required, another command | recovery command required / CONFLICT |

The prepare transaction rereads actor, target, registry and command and rejects
activeCount <= 1. Registry serialization ensures concurrent revokes from count
2 yield at most one decrement to 1; the other retries and fails last-admin.
Active -> revoking and decrement occur atomically exactly once. Resume never
decrements again.

### Saga and completion

1. **prepare:** validate actor/capability/input; claim running command; atomically
   active -> revoking, decrement count, increment revision, set lastCommandId
   and append Critical audit.
2. **clear-claim:** preserve unrelated claims and remove platformRole. Already
   absent is safe resume, not success. Unexpected platformRole is
   `CONTRACT_VIOLATION` and is not overwritten.
3. **verify:** reread claims. Missing Auth after prepare is acceptable evidence
   that no credential retains the claim, but must be audited/finalized.
4. **finalize:** reread state; revoking -> revoked; set server revoked evidence,
   complete command, retain decremented count, increment registry revision and
   append final audit.
5. **failure:** uncertain Auth/verification marks target, command and registry
   recovery_required. Count stays decremented because target stopped being
   authority at prepare. Resume goes recovery_required -> revoking without a
   second decrement.

Success requires revoked authority, absent claim or verified missing Auth user,
coherent count/revision/lastCommandId, succeeded command and final audit.

## Concurrency, errors and recovery

| Competition | Decision |
|---|---|
| two recoveries, same target | same command replay/resume; different commands conflict |
| recoveries, different targets | registry serialization; allow only coherent targets/count |
| recover vs revoke, same target | persisted owner/state wins; other conflicts |
| revokes, same target | same command resume; different commands conflict |
| revokes, different targets | registry serialization and last-admin reread |
| last-two-admin concurrent revoke | one may commit 2 -> 1; other FAILED_PRECONDITION |

| Condition | BACKEND_ERROR_CODE |
|---|---|
| invalid/unknown input or approval identifier | INVALID_ARGUMENT |
| invalid/expired/wrongly scoped/insufficient approval | FORBIDDEN |
| unauthenticated revoke actor | UNAUTHENTICATED |
| incoherent actor or missing capability | FORBIDDEN |
| required target/Auth/Identity missing | NOT_FOUND |
| shape, UID or claim-value contract drift | CONTRACT_VIOLATION |
| disallowed lifecycle or last-admin | FAILED_PRECONDITION |
| registry/count/history drift | CONTRACT_VIOLATION |
| payload mismatch or competing owner | CONFLICT |
| temporary Auth/Firestore/verification failure | UNAVAILABLE |
| exhausted retry after committed stage | UNAVAILABLE plus recovery_required |
| unclassified internal failure | INTERNAL/UNKNOWN, sanitized, Critical audit |

Pre-commit infrastructure failure is retryable. After prepare it is resumable.
Validation/precondition failure is terminal. No cross-service rollback is
promised; observed state is reconciled. Claim absence alone never establishes
authority success or revoke completion.

## Exposure and implications

03B-C is internal non-exported tooling. Recovery is out-of-band; revoke has no
public callable handler in this phase. App Check and public rate limiting are
not applicable. Direct document paths mean no Rules or index change. Firebase
configuration remains unchanged and only synthetic Emulator execution is
authorized until a separate remote gate.

No package change is needed for Recovery. Before Revoke implementation, a
separate shared-contract microphase must add and assign an exact platform
authority revoke capability. No other command, authority, audit, error, path or
validator primitive is missing.

Rollback is documentary: revert this document and its roadmap checkpoint. After
human review/push, resolve the shared capability gap. 03B-C implementation,
03B-D/E/F and Phase 4 remain not started.
