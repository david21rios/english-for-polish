# SaaS-03B-D-R5 - UpdateTenantProfile Contract Resolution

## Decision

**RESULT A - the exact normative contract for UpdateTenantProfile is closed.**

This phase is documentation-only. It does not materialize the command in
@mipymetic/saas-contracts, implement Functions code, modify Domain or Shared/client
code, change Firestore Rules or indexes, use Firebase remote services, or deploy.

R4 established UpdateTenantProfile as the first remaining executable Tenant workflow.
R5 closes only the exact command boundary required before technical materialization.

## Command identity

```text
command type: UpdateTenantProfile
actor: authenticated Identity
authority: approved same-Tenant tenant_admin
capability: tenant.update
scope: tenant
resourceType: tenant
audit level: privileged
```

The command is trusted-backend only.

## Exact input

The canonical input is:

```text
{
  commandId,
  correlationId,
  tenantId,
  patch
}
```

All four top-level fields are required.
Unknown top-level fields are rejected.

`commandId`, `correlationId` and `tenantId` must pass the package canonical
document-identifier validator before any Firestore path construction.

`patch` is an exact non-empty object containing one or more and at most all five
of the following fields:

```text
displayName
shortName
country
locale
timezone
```

No other patch field is permitted.

## Patch value contract

- displayName: required to be a trimmed non-empty string when present;
- shortName: required to be a trimmed non-empty string when present;
- country: required to be an uppercase two-letter country code when present;
- locale: required to be a canonical BCP 47 value when present;
- timezone: required to be a trimmed non-empty string when present.

Patch fields are optional individually but the patch itself must contain at least
one field.

No profile field is nullable.

The command does not accept a complete Tenant snapshot.
It never performs stale whole-document replacement.

## Forbidden input

The following are forbidden as caller-controlled command fields:

- actorUid;
- actorType;
- authority;
- role or roles;
- capability or capabilities;
- membershipId;
- tenantType;
- status;
- createdAt;
- updatedAt;
- suspendedAt;
- archivedAt;
- Settings fields;
- Branding fields;
- server timestamps;
- expectedVersion;
- expectedUpdatedAt;
- revision;
- arbitrary metadata;
- unknown fields.

There is no authoritative Tenant version field in the current persisted Tenant
contract. R5 therefore does not invent expectedVersion, expectedUpdatedAt or an
equivalent concurrency token.

## Authority lookup

`membershipId` is not part of the external command input.

The authenticated actor UID is server-derived. Tenant authority resolution for
this workflow must follow the canonical Membership lookup model:

```text
tenantId + authenticated uid
  -> canonical uidKey
  -> tenants/{tenantId}/membershipKeys/{uidKey}
  -> authoritative membershipId
  -> tenants/{tenantId}/memberships/{membershipId}
```

The MembershipKey and Membership must both be validated through their package-owned
runtime contracts and must agree on tenantId, uid, membershipId and nonterminal
authority state.

The Membership must be approved and its role must resolve to tenant_admin.
The resulting AuthorityResolution must be package-valid and must contain
tenant.update.

A caller-supplied membershipId must never be accepted as authority evidence.

## Tenant preconditions

The authoritative Tenant is point-read by tenantId.

The Tenant must:

- exist;
- pass validatePersistedTenant after timestamp normalization;
- have the requested tenantId;
- be active.

Suspended or archived Tenants cannot execute UpdateTenantProfile.

## Behavioral payload and idempotency

correlationId remains an immutable command-envelope binding but is excluded from
the behavioral payload hash, following the existing command model.

The behavioral payload is exactly:

```text
{
  tenantId,
  patch
}
```

The payload is canonically serialized and hashed together with command type
UpdateTenantProfile.

An existing succeeded command replays only when all authoritative bindings remain
coherent:

- commandId;
- commandType;
- payloadHash;
- correlationId;
- actorUid;
- actorType;
- authority;
- tenantId;
- succeeded status;
- completed stage;
- exact persisted result.

Payload or correlation mismatch is CONFLICT.
Malformed persisted command/result state is CONTRACT_VIOLATION.

No recovery_required stage is required because the operation contains no external
effect and completes in one Firestore transaction.

## Concurrency model

UpdateTenantProfile uses one Firestore transaction.

The transaction rereads the authoritative Tenant and authority evidence before
writes.

The write is a field-scoped update containing only fields present in the canonical
patch plus server-owned updatedAt.

The command must never write tenantType, status, createdAt, suspendedAt, archivedAt
or any configuration root.

No explicit Tenant version token is added.

Concurrent UpdateTenantProfile and PlatformUpdateTenantMetadata operations remain
compatible because each operation updates only its owned fields rather than replacing
a stale Tenant snapshot.

Firestore transaction retry semantics and authoritative reread provide serialization
for overlapping writes. A retry must revalidate Tenant state and authority before the
authoritative field patch commits.

## Writes

The successful transaction writes exactly:

1. the allowed Tenant profile field patch plus server-owned updatedAt;
2. the privileged Command record;
3. one Tenant audit event.

No Settings, Branding, Membership, MembershipKey, Course, Enrollment or platform
audit document is changed.

Rejected commands and contention losers perform zero business writes.

## Result contract

The result uses the universal seven-field Tenant command shape:

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

No profile values, Membership identifiers or PII are returned in the stable result.

## Audit contract

The command produces one Tenant-scoped Privileged audit.

Canonical audit literals:

```text
operation: UpdateTenantProfile.update
resourceType: tenant
resourceId: tenantId
result: succeeded
level: privileged
destination: tenant / tenantId
```

The canonical tenant-admin AuthorityResolution is preserved unchanged and the
audit destination is explicit.

Profile values must not be copied into audit summaries or metadata.

The audit summary contract is deliberately non-PII:

```text
beforeSummary: { tenantStatus: "active" }
afterSummary:  { tenantStatus: "active" }
metadata:      { stage: "completed", changedFieldCount: <1..5> }
```

The implementation must use exact package-owned allowlists for these keys.

## Error mapping

The normative mapping is:

```text
INVALID_ARGUMENT
  malformed identifier, malformed/empty patch, invalid field value, unknown field

UNAUTHENTICATED
  no valid authenticated actor

FORBIDDEN
  Membership absent/foreign/non-approved, non-tenant_admin authority,
  missing tenant.update capability, cross-Tenant authority

NOT_FOUND
  Tenant does not exist

FAILED_PRECONDITION
  Tenant exists but is not active

CONFLICT
  command payload/correlation binding conflict or incompatible authoritative
  concurrent command binding

CONTRACT_VIOLATION
  malformed persisted Tenant, MembershipKey, Membership, AuthorityResolution,
  Command or persisted result

UNAVAILABLE / INTERNAL
  mapped infrastructure failure according to the existing backend taxonomy
```

No new backend error code is introduced.

## Command stage

UpdateTenantProfile is an atomic Firestore-only Tenant command.

Its successful persisted Command state is:

```text
status = succeeded
stage = completed
```

R5 authorizes later package materialization of UpdateTenantProfile as an atomic
Tenant command using the existing completed stage. It does not authorize a new
command stage.

## Protected infrastructure

No prerequisite modification is authorized for:

- firestore.rules;
- firestore.indexes.json;
- storage.rules;
- firebase.json;
- .firebaserc;
- src/firebase.js.

Firestore Rules regression remains mandatory during executable implementation and
independent review.

## Materialization boundary

R5 closes the normative contract only.

The next microphase must materialize this exact contract in the shared package
before implementing the Functions command.

That materialization may add:

- COMMAND_TYPES.UPDATE_TENANT_PROFILE;
- atomic Tenant command-stage allowlisting;
- exact UpdateTenantProfile input field constants;
- exact patch field constants;
- validateUpdateTenantProfileInput;
- updateTenantProfileBehavioralPayload;
- exact result constants and validator;
- audit literals and audit field allowlists;
- generated TypeScript declarations;
- package exports;
- SemVer/package artifact updates required by the additive public surface.

It must not implement the business command in the same microphase unless a later
published gate explicitly authorizes doing so.

## State

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed
SaaS-03B-D-R5 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = contract_closed_pending_shared_materialization_after_R5_push
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

After human review and publication of R5, derive and execute only the minimum shared
contract materialization microphase for UpdateTenantProfile.

Do not implement UpdateTenantProfile in Functions yet.
Do not start UpdateTenantSettings, UpdateTenantBranding or any Tenant lifecycle
command.