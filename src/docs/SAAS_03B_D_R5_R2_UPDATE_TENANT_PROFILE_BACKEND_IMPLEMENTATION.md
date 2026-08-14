# SaaS-03B-D-R5-R2 - UpdateTenantProfile Backend Implementation

## Decision

**RESULT A - the executable trusted-backend UpdateTenantProfile workflow is implemented and validated.**

R5-R2 implements the backend command boundary defined by SaaS-03B-D-R5 and
materialized in the shared package by SaaS-03B-D-R5-R1.

This checkpoint implements only the internal trusted-backend workflow.
It does not publish an HTTP or callable handler, modify Firestore Rules,
modify Firebase configuration, integrate client code or deploy.

## Published genealogy

```text
SaaS-03B-D-R5
  -> SaaS-03B-D-R5-R1
    -> SaaS-03B-D-R5-R2
```

R5-R1 was published at commit:

```text
3bab4d6652a9e45949d929bb189754ef5c0f6ff6
```

R5-R2 is the minimum executable backend checkpoint required after the shared
contract materialization.

## Implemented source surface

The implementation consists of exactly six new Functions source/test files:

```text
functions/src/authorization/updateTenantProfileAuthority.ts
functions/src/commands/updateTenantProfile.ts
functions/src/persistence/updateTenantProfileTransactionStore.ts
functions/src/__tests__/updateTenantProfileAuthority.test.ts
functions/src/__tests__/updateTenantProfileTransactionStore.test.ts
functions/src/__tests__/updateTenantProfile.test.ts
```

No pre-existing tracked file is modified by the backend implementation.

## Command input

The command consumes the package-owned exact input contract:

```text
{
  commandId,
  correlationId,
  tenantId,
  patch
}
```

Input parsing uses:

```text
validateUpdateTenantProfileInput
```

Unknown top-level fields, malformed identifiers, empty patches, forbidden
profile fields and invalid profile values fail closed.

## Authentication and authority

The authenticated UID is derived only from the verified backend authentication
context.

Authority resolution follows the R5 canonical path:

```text
authenticated uid
  -> persisted Identity
  -> active Tenant
  -> encodeMembershipUidKey(uid)
  -> MembershipKey
  -> authoritative membershipId
  -> Membership
  -> tenant_admin
  -> tenant.update
  -> package-valid AuthorityResolution
```

The resolver validates:

- persisted Identity existence and UID coherence;
- exact persisted Tenant contract and active lifecycle;
- exact MembershipKey contract;
- MembershipKey tenantId, uid and approved status;
- exact persisted Membership contract;
- Membership and MembershipKey coherence;
- approved Membership lifecycle;
- tenant_admin role;
- tenant.update capability;
- final package-owned AuthorityResolution contract.

No caller-supplied membershipId is accepted as authority evidence.

## Transaction authority reread

Authority is not trusted only from the pre-transaction resolution.

The authoritative transaction rereads:

```text
Identity
Tenant
MembershipKey
Membership
```

before any business write.

This preserves R5 Firestore retry semantics: transaction retries revalidate
Tenant state and authority evidence before the profile patch can commit.

## Tenant lifecycle

UpdateTenantProfile requires an active Tenant.

Suspended or archived Tenants fail with a precondition error before business
writes.

## Behavioral payload and idempotency

The command uses the package-owned behavioral projection:

```text
{
  tenantId,
  patch
}
```

via:

```text
updateTenantProfileBehavioralPayload
canonicalPayloadHash
```

commandId and correlationId are excluded from the behavioral hash.

Changing the patch changes the behavioral hash.

Changing only commandId or correlationId does not change the behavioral hash.

## Replay

The transaction point-reads the privileged Command before new writes.

An existing command replays only when its authoritative bindings remain
coherent, including:

- command type;
- payload hash;
- correlationId;
- Tenant target;
- actor UID;
- actor type;
- authority;
- succeeded status;
- completed stage;
- exact stable persisted result.

Payload or correlation conflicts fail closed.

Malformed replay state or result fails as a contract violation.

A valid replay performs zero business writes and returns replayed=true while
the persisted canonical result retains replayed=false.

## Write surface

The successful transaction writes exactly three business effects:

```text
1. Tenant field-scoped profile update
2. privileged Command record
3. one Tenant audit event
```

The Tenant update contains only:

```text
fields present in the package-valid profile patch
+ server-owned updatedAt
```

The workflow cannot write:

```text
tenantType
status
createdAt
suspendedAt
archivedAt
Settings
Branding
Membership
MembershipKey
Course
Enrollment
platform audit data
```

The transaction store revalidates the complete shared UpdateTenantProfile input
before constructing the write.

## Stable result

The stable command result remains:

```text
{
  commandId,
  correlationId,
  operation: "UpdateTenantProfile",
  resourceType: "tenant",
  resourceId: tenantId,
  status: "succeeded",
  replayed
}
```

The persisted result uses replayed=false.

A replay response may return replayed=true without mutating the persisted
canonical result.

No profile values, Membership identifiers or PII are returned.

## Audit

Exactly one Tenant-scoped Privileged audit event is written on successful new
execution.

The package-owned audit contract is used.

The audit contains only the approved summaries:

```text
beforeSummary:
  tenantStatus

afterSummary:
  tenantStatus

metadata:
  stage
  changedFieldCount
```

Profile values and Membership identifiers are excluded from audit data.

## Validation

Final Functions regression:

```text
Functions TypeScript check = PASS
Functions lint = PASS
Functions tests = 119/119 PASS
```

Focused UpdateTenantProfile suite:

```text
36/36 PASS
```

Shared package regression:

```text
package tests = 69/69 PASS
package TypeScript check = PASS
```

The focused coverage includes:

- exact shared input parsing;
- malformed and forbidden input rejection;
- authentication requirement;
- persisted Identity validation;
- active Tenant requirement;
- MembershipKey authority lookup;
- authoritative Membership lookup;
- tenant_admin enforcement;
- tenant.update capability enforcement;
- package-valid AuthorityResolution;
- transaction authority reread;
- behavioral payload hashing;
- commandId/correlationId hash exclusion;
- patch hash sensitivity;
- exact profile write surface;
- server-owned updatedAt;
- exact Command persistence;
- exact Tenant audit persistence;
- audit PII exclusion;
- replay read-only behavior;
- payload conflict;
- correlation conflict;
- malformed persisted replay rejection;
- forbidden patch rejection;
- invalid profile value rejection;
- zero writes on rejected execution.

## Firebase and public surface

No changes were made to:

```text
.firebaserc
firebase.json
src/firebase.js
firestore.rules
firestore.indexes.json
storage.rules
```

No public UpdateTenantProfile HTTP or callable handler exists.

No Firebase remote service was used.
No deploy occurred.

Rules impact for this internal backend implementation remains:

```text
RULES_IMPACT_NONE
```

Any later public invocation surface requires an independent security and Rules
review before exposure.

## Explicit boundary

R5-R2 does not implement:

- public HTTP handler;
- callable Firebase handler;
- client integration;
- Firestore Rules changes;
- Firestore index changes;
- Storage Rules changes;
- Firebase configuration changes;
- UpdateTenantSettings;
- UpdateTenantBranding;
- SuspendTenant;
- RestoreTenant;
- ArchiveTenant;
- deployment.

## State

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed
SaaS-03B-D-R5 = completed
SaaS-03B-D-R5-R1 = completed
SaaS-03B-D-R5-R2 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = backend_implemented_pending_R5_R2_push
UpdateTenantSettings = blocked_pending_UpdateTenantProfile_sequence
UpdateTenantBranding = blocked_pending_UpdateTenantSettings_sequence
SuspendTenant = blocked_pending_update_family_completion
RestoreTenant = blocked_pending_update_family_completion
ArchiveTenant = blocked_pending_update_family_completion
SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

## Next gate

After human review, commit and publication of R5-R2, close the
UpdateTenantProfile sequence and derive only the minimum next checkpoint for
UpdateTenantSettings.

Do not start UpdateTenantBranding or Tenant lifecycle commands before their
ordered predecessors are closed.
