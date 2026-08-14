# SaaS-03B-D-R7 - UpdateTenantBranding Contract Resolution Blocker

## Decision

**RESULT B - UpdateTenantBranding is the next ordered Tenant workflow, but its exact executable contract cannot yet be materialized without first resolving its Branding-specific mutation and concurrency contract.**

The ordered UpdateTenantSettings sequence is technically closed.

SaaS-03B-D-R4 establishes the Tenant update/configuration family in this order:

1. UpdateTenantProfile
2. UpdateTenantSettings
3. UpdateTenantBranding

UpdateTenantBranding is therefore the current authorized workflow.

This checkpoint is documentation-only.

It does not modify package source, Functions source, Firestore Rules, indexes,
Firebase configuration or remote Firebase state.

## Existing authority already closed

The authoritative sources already establish:

```text
command family: UpdateTenantBranding
actor: authenticated Identity
authority: approved same-Tenant tenant_admin
capability: tenant.manage_branding
scope: tenant
target: fixed Tenant branding root
path: tenants/{tenantId}/configuration/branding
Tenant requirement: exists and must not be archived
technical authority: trusted backend
atomicity: one Firestore transaction
audit class: Privileged
```

R4 further establishes:

```text
composed branding replacement within the Tenant-owned root
tenantId and server-owned fields remain immutable
invalid external references fail closed
writes Branding, Command and Tenant audit
transaction/CAS behavior
```

These decisions remain closed.

## Current physical Branding contract

The current persisted Branding contract is:

```text
tenantId
displayName
logoUrl
faviconUrl
colors
updatedAt
```

The exact colors object is:

```text
primary
secondary
accent
```

The currently materialized Branding contract contains no physical concurrency
field named:

```text
version
revision
brandingVersion
brandingRevision
```

BootstrapTenant also currently creates Branding without a concurrency token.

Therefore the executable repository currently represents Tenant Branding as an
unversioned persisted document.

## Conceptual concurrency authority

The authoritative write model classifies Settings/Branding configuration
mutations as trusted-backend transactional writes with version-CAS behavior.

The final write-authority revalidation classifies UpdateTenantBranding as:

```text
actor: tenant_admin
capability: tenant.manage_branding
scope: tenant
documents: config
authority: backend
atomicity: transaction/CAS
idempotency: command/version
status: Aligned
```

This establishes the requirement for a Branding concurrency contract.

It does not establish enough exact physical and executable detail to implement
that contract without further normative resolution.

## R4 required closure

SaaS-03B-D-R4 explicitly requires the implementation sequence to close:

```text
A. exact branding payload shape
B. replacement semantics
C. CAS/version binding
D. replay semantics
E. audit allowlists
F. resourceType
G. exhaustive error mapping
```

Those Branding-specific executable decisions are not yet completely defined.

## Physical concurrency gap

Before UpdateTenantBranding shared-command materialization, an explicit
Branding-specific prerequisite resolution must decide:

```text
A. whether the conceptual Branding version-CAS requirement becomes a physical
   persisted Branding version field;

B. if yes, the exact persisted field name;

C. the exact allowed numeric domain;

D. the initial value for Branding created by BootstrapTenant;

E. compatibility behavior for existing valid unversioned Branding documents;

F. the exact command-side concurrency input;

G. whether that input is named expectedVersion or another explicitly approved
   identifier;

H. exact transaction compare-and-set semantics;

I. exact increment semantics;

J. exact stale-write conflict behavior.
```

None of these decisions may be inherited automatically from
UpdateTenantSettings.

UpdateTenantSettings may be used as structural precedent only.

Branding requires its own normative resolution.

## Mutation contract gap

The prerequisite resolution must also close the exact command mutation boundary:

```text
A. exact UpdateTenantBranding command input fields;
B. exact caller-owned Branding fields;
C. composed replacement behavior;
D. exact colors replacement behavior;
E. nullability of displayName;
F. nullability of logoUrl;
G. nullability of faviconUrl;
H. external-reference validation behavior;
I. unknown-field rejection;
J. server-owned-field rejection.
```

The existing persisted Branding validator remains authoritative until a later
authorized materialization checkpoint explicitly changes it.

## Behavioral payload and replay gap

Before package materialization, the Branding-specific contract must explicitly
define:

```text
command identity
behavioral payload
payload-hash binding
correlation binding
target Tenant binding
successful persisted result
resourceType
resourceId
replayed semantics
payload conflict behavior
malformed persisted-command handling
malformed persisted-result handling
```

This blocker does not invent those values.

## Audit gap

UpdateTenantBranding requires Privileged audit.

The Branding-specific resolution must still define exact:

```text
audit operation
audit level
audit result
beforeSummary allowlist
afterSummary allowlist
metadata allowlist
resourceType
resourceId
destination scope
```

Branding values must not be copied unrestricted into audit records.

Only explicitly approved structural or minimized audit data may be persisted.

## Error mapping gap

R4 requires exhaustive error mapping before technical implementation.

The prerequisite resolution must explicitly classify at least:

```text
malformed input
unauthenticated actor
missing Membership authority
foreign Membership authority
non-tenant_admin Membership
missing tenant.manage_branding capability
cross-Tenant authority
missing Tenant
invalid Tenant lifecycle
missing Branding
malformed persisted Branding
invalid external reference
stale concurrency token
command binding conflict
malformed persisted Command
malformed persisted result
infrastructure failure
```

This blocker does not assign Branding-specific error codes where the existing
authority does not yet make them explicit.

## Why technical implementation remains blocked

Implementing UpdateTenantBranding now would require inventing one or more of:

```text
physical concurrency schema
initial version
legacy migration semantics
expected-version command field
compare-and-set behavior
increment behavior
stale-write behavior
behavioral payload binding
replay semantics
audit allowlists
result contract
error mapping
```

R4 explicitly requires these items to be closed before implementation.

Therefore Functions implementation and shared-contract materialization must not
begin yet.

## What remains closed

This blocker does not reopen:

```text
BootstrapTenant
UpdateTenantProfile
UpdateTenantSettings
SaaS-03B-D-R5 sequence
SaaS-03B-D-R6 sequence
tenant_admin role separation
tenant.manage_branding capability
Tenant Branding path
current Branding field ownership
trusted-backend write authority
Privileged audit classification
Tenant update/configuration workflow ordering
```

## Explicitly prohibited next actions

Until the Branding prerequisite resolution is closed, do not:

- add the executable UpdateTenantBranding command contract;
- modify TENANT_BRANDING_FIELDS;
- add version or revision to Tenant Branding;
- modify BootstrapTenant Branding persistence;
- implement UpdateTenantBranding Functions code;
- implement SuspendTenant;
- implement RestoreTenant;
- implement ArchiveTenant;
- modify Firestore Rules;
- modify Firestore indexes;
- modify Firebase configuration;
- deploy.

## State

```text
SaaS-03B-D-R5 = completed
UpdateTenantProfile = backend_sequence_closed

SaaS-03B-D-R6 = completed
UpdateTenantSettings = backend_sequence_closed

SaaS-03B-D-R7 = blocked_pending_branding_contract_resolution
UpdateTenantBranding = blocked_pending_R7_prerequisite_resolution

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
UpdateTenantBranding mutation and optimistic-concurrency contract.

That checkpoint must resolve only the missing Branding-specific decisions
identified by this blocker.

Do not begin shared-package materialization or Functions implementation yet.