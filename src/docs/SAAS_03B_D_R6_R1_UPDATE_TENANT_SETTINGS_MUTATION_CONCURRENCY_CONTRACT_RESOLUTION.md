# SaaS-03B-D-R6-R1 - UpdateTenantSettings Mutation and Optimistic Concurrency Contract Resolution

## Decision

**RESULT A - the mutation and optimistic-concurrency contract for UpdateTenantSettings is closed.**

R6 identified two blocking ambiguities:

1. merge-versus-replace semantics;
2. optimistic concurrency / version-CAS semantics.

R6-R1 resolves only those prerequisites.

This checkpoint is documentation-only.

It does not materialize the command in @mipymetic/saas-contracts.
It does not modify the persisted Settings validator.
It does not modify BootstrapTenant.
It does not implement Functions code.
It does not modify Firestore Rules, indexes or Firebase configuration.
It does not deploy.

## Command mutation model

UpdateTenantSettings uses complete Settings replacement semantics for caller-owned
configuration fields.

The external command payload contains:

```text
{
  commandId,
  correlationId,
  tenantId,
  expectedVersion,
  settings
}
```

where settings contains exactly:

```text
defaultLocale
registrationPolicy
featureFlags
supportEmail
supportUrl
```

The caller does not provide:

```text
tenantId inside settings
updatedAt
version
authority
role
capability
membershipId
server timestamps
unknown fields
```

## Replacement semantics

The five caller-owned Settings fields are replaced as one coherent Settings value
object.

UpdateTenantSettings is not a sparse patch command.

This avoids ambiguous mixed states between registration policy, feature flags and
support configuration.

The persisted tenantId remains server-bound to the target Tenant.

The persisted updatedAt remains server-owned.

## RegistrationPolicy semantics

registrationPolicy is replaced as a complete nested object.

It must contain exactly:

```text
openRegistration
invitationOnly
institutionalEmailOnly
manualApprovalRequired
```

All four fields are required booleans.

Nested partial patching is not allowed.

Unknown RegistrationPolicy fields are rejected.

## featureFlags semantics

featureFlags is replaced as a complete boolean map.

Each value must be boolean.

Key-level merge semantics are not part of UpdateTenantSettings.

Key removal occurs only by omission from the replacement map submitted by the
caller.

No null tombstones or delete markers are accepted.

## Nullable support fields

supportEmail may be null or a valid non-empty text value accepted by the shared
Settings contract.

supportUrl may be null or a valid HTTPS URL accepted by the shared Settings
contract.

## Tenant lifecycle

UpdateTenantSettings requires:

```text
Tenant exists
Tenant.status == active
```

Suspended or archived Tenants fail with FAILED_PRECONDITION.

A missing Tenant fails with NOT_FOUND.

## Authority

Authority remains:

```text
authenticated Identity
approved same-Tenant tenant_admin
tenant.manage_settings
```

Authority is server-derived through the canonical MembershipKey -> Membership
lookup.

Caller-supplied authority evidence is forbidden.

## Persisted Settings version

The Settings document gains one server-owned integer concurrency field:

```text
version
```

The canonical persisted Settings shape becomes:

```text
tenantId
defaultLocale
registrationPolicy
featureFlags
supportEmail
supportUrl
version
updatedAt
```

version is:

- required;
- integer;
- >= 1;
- server-owned;
- incremented exactly once per successful UpdateTenantSettings commit;
- never writable directly by callers.

## Initial version

New Tenant Settings created by BootstrapTenant use:

```text
version: 1
```

The first successful UpdateTenantSettings changes:

```text
1 -> 2
```

and every later successful update increments by exactly one.

## Existing unversioned Settings compatibility

Existing valid Settings documents without version are legacy persisted state.

They must not be silently accepted as version 0 or version 1 by the executable
UpdateTenantSettings command.

Before UpdateTenantSettings can operate on such a Tenant, the Settings document
must be migrated through an explicit compatibility/migration step.

The command itself does not perform schema migration.

This prevents ambiguous CAS behavior and avoids assigning historical revision
meaning retroactively.

## expectedVersion

The command requires:

```text
expectedVersion
```

expectedVersion is:

- required;
- integer;
- >= 1;
- caller-provided concurrency evidence;
- included in the exact command input;
- excluded from persisted Settings except through the resulting increment.

The transaction point-reads the authoritative Settings document and requires:

```text
persisted.version == expectedVersion
```

If not equal:

```text
CONFLICT
```

No blind retry is performed with a changed expectedVersion.

The caller must reread Settings and deliberately resubmit.

## CAS semantics

The successful Firestore transaction performs:

```text
1. reread authenticated authority evidence
2. reread active Tenant
3. reread Settings
4. validate complete persisted Settings contract
5. compare persisted.version with expectedVersion
6. construct complete replacement Settings document
7. set version = expectedVersion + 1
8. set updatedAt = server-owned timestamp
9. write Settings
10. write privileged Command
11. write one Tenant audit
```

The transaction retries only under Firestore transaction semantics.

On retry, all authoritative preconditions and version equality are checked again.

## Behavioral payload

The behavioral payload is exactly:

```text
{
  tenantId,
  expectedVersion,
  settings
}
```

commandId and correlationId remain command-envelope bindings and are excluded from
the behavioral payload hash.

expectedVersion is behavioral because it determines whether the mutation is
authorized against the observed Settings revision.

## Replay

An existing succeeded command may replay only when authoritative command bindings
remain coherent, including:

- command type;
- payload hash;
- correlationId;
- actor UID;
- authority;
- tenantId;
- succeeded status;
- completed stage;
- exact persisted stable result.

A replay does not reapply the Settings write and does not increment version again.

Payload or correlation mismatch is CONFLICT.

Malformed persisted command or result is CONTRACT_VIOLATION.

## Write surface

Successful new execution writes exactly:

```text
1. configuration/settings
2. privileged Command
3. one Tenant-scoped Privileged audit
```

It does not modify:

- Tenant profile fields;
- Branding;
- Membership;
- MembershipKey;
- Courses;
- Enrollments;
- platform audit data.

## Result

The stable result uses the universal seven-field Tenant command shape:

```text
{
  commandId,
  correlationId,
  operation: "UpdateTenantSettings",
  resourceType: "tenant",
  resourceId: tenantId,
  status: "succeeded",
  replayed
}
```

The result does not expose Settings values.

## Audit

The command produces one Tenant-scoped Privileged audit.

Canonical operation:

```text
UpdateTenantSettings.update
```

The audit must not contain supportEmail, supportUrl, feature flag values or policy
values.

The exact audit summary/metadata allowlists remain for the later command-contract
materialization checkpoint to encode, but they must remain non-PII and may include
only structural concurrency information such as stage and version transition.

## Error mapping

```text
INVALID_ARGUMENT
  malformed identifiers
  malformed complete settings payload
  malformed expectedVersion
  unknown fields

UNAUTHENTICATED
  missing authenticated actor

FORBIDDEN
  missing/foreign/non-approved Membership authority
  non-tenant_admin role
  missing tenant.manage_settings
  cross-Tenant authority

NOT_FOUND
  Tenant missing
  Settings missing

FAILED_PRECONDITION
  Tenant suspended or archived
  legacy unversioned Settings document requiring explicit migration

CONFLICT
  expectedVersion does not equal authoritative persisted version
  command payload/correlation binding conflict

CONTRACT_VIOLATION
  malformed persisted Tenant
  malformed MembershipKey
  malformed Membership
  malformed versioned Settings
  malformed Command
  malformed persisted result

UNAVAILABLE / INTERNAL
  infrastructure failure mapped by existing backend taxonomy
```

## Package impact required after this checkpoint

The next materialization checkpoint must update at least:

```text
TENANT_SETTINGS_FIELDS
validateTenantSettings
BootstrapTenant Settings construction
UpdateTenantSettings command identity
UpdateTenantSettings input validator
UpdateTenantSettings behavioral payload
UpdateTenantSettings result validator
UpdateTenantSettings audit literals/allowlists
TypeScript declarations
Functions vendor artifact
package version
```

## Migration boundary

Introducing version changes the persisted Settings schema.

Therefore the technical materialization phase must explicitly verify the repository
for existing versioned fixtures/data assumptions and document compatibility.

No remote Firebase migration is authorized by R6-R1.

Any production migration is a separate human-reviewed operation.

## Explicit boundary

R6-R1 does not:

- modify package source;
- modify Functions source;
- modify BootstrapTenant yet;
- modify Firestore Rules;
- modify indexes;
- modify Firebase configuration;
- deploy;
- start UpdateTenantBranding;
- start lifecycle commands.

## State

```text
SaaS-03B-D-R5-R2 = published
UpdateTenantProfile = backend_sequence_closed
SaaS-03B-D-R6 = blocker_resolved_by_R6_R1
SaaS-03B-D-R6-R1 = completed_pending_human_review_and_push
UpdateTenantSettings = mutation_concurrency_contract_closed_pending_materialization
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

After human review and publication of R6/R6-R1 documentation, derive the minimum
UpdateTenantSettings shared-contract materialization checkpoint.

Do not implement Functions before shared-contract materialization is published.
