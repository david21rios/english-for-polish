# SaaS-03B-D-R6 - UpdateTenantSettings Contract Resolution Blocker

## Decision

**RESULT B - UpdateTenantSettings cannot yet be normatively closed or technically materialized.**

The ordered predecessor UpdateTenantProfile is published and its backend sequence
is closed.

UpdateTenantSettings is therefore the next authorized workflow to resolve, but the
current authoritative sources do not provide enough compatible information to
materialize an executable shared command contract without inventing persistence
or concurrency semantics.

This checkpoint is documentation-only.

No package contract is added.
No Functions implementation is added.
No Firestore Rules or indexes are changed.
No Firebase configuration is changed.
No deployment occurs.

## Published predecessor

```text
SaaS-03B-D-R5
  -> SaaS-03B-D-R5-R1
    -> SaaS-03B-D-R5-R2
```

Published R5-R2 commit:

```text
f01db079868a76b1feff33181f644005f00d14bd
```

## Resolved command authority

The following portions are sufficiently established:

```text
command: UpdateTenantSettings
actor: authenticated Identity
authority: approved same-Tenant tenant_admin
capability: tenant.manage_settings
scope: tenant
target: tenants/{tenantId}/configuration/settings
execution: trusted backend
audit level: privileged
```

Authority remains server-derived.

Caller-supplied role, authority, capability or membership identifiers are not
accepted as authority evidence.

## Resolved Tenant lifecycle

The executable contract must be fail-closed and require an active Tenant.

```text
active    -> eligible
suspended -> FAILED_PRECONDITION
archived  -> FAILED_PRECONDITION
missing   -> NOT_FOUND
```

Older wording that only states "not archived" is not sufficient to authorize
writes while the Tenant is suspended.

The active-only requirement is consistent with the tenant-admin security boundary
and the later update-family contract matrix.

## Existing persisted Settings contract

The current package-owned Tenant Settings document contains exactly:

```text
tenantId
defaultLocale
registrationPolicy
featureFlags
supportEmail
supportUrl
updatedAt
```

RegistrationPolicy contains exactly:

```text
openRegistration
invitationOnly
institutionalEmailOnly
manualApprovalRequired
```

The current persisted Settings contract contains no:

```text
version
revision
settingsVersion
settingsRevision
expectedVersion
expectedUpdatedAt
```

BootstrapTenant also creates the existing unversioned Settings shape.

## Blocking finding R6-B1 - optimistic concurrency contract is unresolved

The authoritative concurrency model requires concurrent Settings edits to avoid
lost updates.

Historical concurrency documents describe:

```text
Backend transaction + version CAS
Settings concurrent -> no lost update
stale editor -> conflict
explicit commandId + expectedVersion
```

They also describe an integer version incremented with compare-and-set inside the
backend transaction.

However, that version mechanism was explicitly proposed/deferred and was never
materialized into the canonical Settings persistence contract.

PM-005 remains the historical deferred physical-versioning decision.

Therefore R6 must not invent any of the following:

```text
version: 0
version: 1
revision
expectedVersion
expectedUpdatedAt
automatic migration semantics
bootstrap version initialization
CAS mismatch behavior beyond the generic conflict taxonomy
```

A revision implementation used by Platform Authority Registry or Tenant Admin
Authority State is not sufficient authority to copy that field into Tenant
Settings. Those are separate persisted contracts.

## Blocking finding R6-B2 - update composition semantics are unresolved

R4 explicitly requires closure of merge-versus-replace semantics before
UpdateTenantSettings implementation.

The current sources establish the complete persisted Settings value object and
describe the update surface as Settings/configuration, but they do not establish
an exact executable command payload that determines whether:

```text
1. the caller submits a complete Settings value object replacement;
2. the caller submits a partial field patch;
3. nested registrationPolicy is replaced as a whole;
4. registrationPolicy supports nested field patching;
5. featureFlags is replaced as a whole;
6. featureFlags supports key-level merge/removal semantics.
```

Those choices have materially different validation, replay and lost-update
semantics and cannot be inferred from UI behavior.

## Why transaction reread alone is not adopted

UpdateTenantProfile was able to close concurrency through transaction reread and
field-scoped writes because its owned field set and patch semantics were explicitly
closed and no concurrency token was authorized.

UpdateTenantSettings is different.

The historical Settings concurrency contract explicitly requires no lost update
and describes version CAS / stale-editor conflict behavior.

Replacing that requirement with simple transaction reread would silently change
the approved concurrency model.

R6 therefore does not reuse the Profile concurrency decision by analogy.

## Why version is not added now

Adding a Settings version field would modify the canonical persisted schema and
would require at minimum:

- exact field name;
- exact integer domain;
- initial value for newly bootstrapped Tenants;
- migration/backward-compatibility behavior for existing Settings documents;
- server-owned versus caller-owned status;
- exact expected-version input contract;
- compare-and-set semantics;
- increment semantics;
- replay interaction;
- malformed-version handling;
- conflict mapping;
- package validator changes;
- BootstrapTenant compatibility;
- Functions vendor artifact update;
- persistence and regression tests.

None of those may be invented inside UpdateTenantSettings implementation.

## What remains closed despite the blocker

The blocker does not reopen:

- UpdateTenantProfile;
- R5;
- R5-R1;
- R5-R2;
- tenant_admin role separation;
- tenant.manage_settings capability;
- Tenant Settings path;
- existing persisted Settings field ownership;
- backend-only write authority;
- Privileged audit classification.

## Required next resolution

Before UpdateTenantSettings shared command materialization, one minimum
prerequisite checkpoint must resolve the Settings mutation/concurrency contract.

That resolution must explicitly decide:

```text
A. full replacement vs partial patch
B. nested RegistrationPolicy mutation semantics
C. featureFlags replacement/merge/removal semantics
D. whether physical version CAS is still mandatory
E. if yes: exact persisted version field and initial value
F. exact expectedVersion command binding
G. exact increment and stale-write CONFLICT semantics
H. migration compatibility with existing unversioned Settings documents
I. BootstrapTenant initialization compatibility
J. behavioral payload and replay binding
```

Only after those decisions are closed may UpdateTenantSettings be materialized in
@mipymetic/saas-contracts.

## Explicitly prohibited next actions

Until the prerequisite resolution is closed, do not:

- add COMMAND_TYPES.UPDATE_TENANT_SETTINGS;
- add UpdateTenantSettings input/result validators;
- modify TENANT_SETTINGS_FIELDS;
- add version or revision to Tenant Settings;
- modify BootstrapTenant Settings persistence;
- implement UpdateTenantSettings Functions code;
- implement UpdateTenantBranding;
- implement Tenant lifecycle commands;
- modify Firestore Rules;
- deploy.

## State

```text
SaaS-03B-D-R5 = completed
SaaS-03B-D-R5-R1 = completed
SaaS-03B-D-R5-R2 = published
UpdateTenantProfile = backend_sequence_closed
SaaS-03B-D-R6 = blocked_pending_settings_mutation_concurrency_resolution
UpdateTenantSettings = blocked_pending_R6_prerequisite_resolution
UpdateTenantBranding = blocked_pending_UpdateTenantSettings_sequence
SuspendTenant = blocked_pending_update_family_completion
RestoreTenant = blocked_pending_update_family_completion
ArchiveTenant = blocked_pending_update_family_completion
SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

## Next checkpoint

Derive one documentation-only prerequisite checkpoint for the exact
UpdateTenantSettings mutation and optimistic-concurrency contract.

Do not begin package materialization or Functions implementation yet.
