# SaaS-03B-D-R7-R1 - UpdateTenantBranding Mutation and Optimistic Concurrency Contract Resolution

## Decision

**RESULT A - the mutation and optimistic-concurrency contract for UpdateTenantBranding is closed.**

SaaS-03B-D-R7 established UpdateTenantBranding as the current ordered Tenant
workflow and identified the Branding-specific decisions that had to be closed
before shared-contract materialization.

R7-R1 resolves those prerequisites only.

This checkpoint is documentation-only.

It does not modify the shared package, Functions implementation, Firestore Rules,
indexes, Firebase configuration or remote Firebase state.

It does not itself migrate existing Branding documents.

## Command mutation model

UpdateTenantBranding uses one complete composed Branding replacement request.

The command input is:

~~~text
{
  commandId,
  correlationId,
  tenantId,
  expectedVersion,
  branding
}
~~~

The caller-owned branding object contains exactly:

~~~text
{
  displayName,
  logoUrl,
  faviconUrl,
  colors
}
~~~

The caller may not provide or mutate:

~~~text
tenantId
version
updatedAt
~~~

Unknown command fields are invalid.

Unknown Branding fields are invalid.

Server-owned Branding fields supplied by the caller are invalid.

## Branding replacement semantics

UpdateTenantBranding replaces the complete caller-owned Branding value as one
composed configuration object.

It is not a partial patch.

The replacement covers exactly:

~~~text
displayName
logoUrl
faviconUrl
colors
~~~

The persisted tenantId remains immutable.

The persisted version is server-owned.

The persisted updatedAt is server-owned.

## Colors replacement semantics

colors is replaced as one complete exact object.

Its required shape is:

~~~text
{
  primary,
  secondary,
  accent
}
~~~

Partial color-map mutation is not part of the command contract.

Missing required color keys are invalid.

Unknown color keys are invalid.

## Nullable Branding fields

The existing Branding nullability contract remains authoritative.

The following fields are nullable:

~~~text
displayName
logoUrl
faviconUrl
~~~

colors is required and is not nullable.

R7-R1 does not strengthen URL or color-format validation beyond the currently
authorized contract.

## Tenant lifecycle precondition

The target Tenant must exist.

The target Tenant must not be archived.

R7-R1 does not invent an additional suspended-Tenant restriction that is not
present in the authoritative UpdateTenantBranding contract.

## Authority

The command actor is an authenticated Identity.

The business authority is an approved same-Tenant tenant_admin.

The required capability is:

~~~text
tenant.manage_branding
~~~

Authority must be derived and revalidated by the trusted backend.

Caller-provided role, authority or capability claims are not authoritative.

The command is Tenant-scoped.

The target is the fixed Branding root:

~~~text
tenants/{tenantId}/configuration/branding
~~~

## Persisted Branding version

The Branding document gains one server-owned integer concurrency field:

~~~text
version
~~~

The resulting persisted Branding field set is:

~~~text
tenantId
displayName
logoUrl
faviconUrl
colors
version
updatedAt
~~~

version is:

~~~text
required
integer
server-owned
not caller mutable
~~~

A successful UpdateTenantBranding mutation advances exactly one Branding
revision.

## Initial version

New Tenant Branding created by BootstrapTenant uses:

~~~text
version: 1
~~~

This represents the first persisted Branding revision.

BootstrapTenant input does not gain a caller-provided Branding version field.

The version is assigned by trusted backend persistence.

## Existing unversioned Branding compatibility

Existing valid Branding documents without version are legacy persisted state.

They must not be silently interpreted as version 0 or version 1.

Before executable UpdateTenantBranding can operate on such a Branding document,
that document must pass through an explicit compatibility or migration step.

UpdateTenantBranding itself does not perform schema migration.

This prevents ambiguous compare-and-set behavior and prevents historical Branding
state from receiving an invented revision identity.

No remote Firebase migration is authorized by R7-R1.

## expectedVersion

The command requires:

~~~text
expectedVersion
~~~

expectedVersion is caller-provided concurrency evidence.

It must be a valid integer revision value.

It is behavioral input because it determines whether the requested replacement
is authorized against the Branding revision observed by the caller.

It is not persisted as a second concurrency field.

## CAS semantics

UpdateTenantBranding executes in one Firestore transaction.

The transaction rereads authoritative state before mutation.

The authoritative Branding revision must satisfy:

~~~text
persisted.version == expectedVersion
~~~

If the equality check fails, the command returns:

~~~text
CONFLICT
~~~

A successful mutation writes:

~~~text
version = expectedVersion + 1
~~~

and assigns a server-owned updatedAt.

There is no blind retry using a changed expectedVersion.

After a stale-write conflict, the caller must reread Branding and deliberately
submit a new command using the newly observed revision.

Firestore transaction retries caused by infrastructure-level optimistic
concurrency do not relax any command precondition.

Every retry must revalidate authoritative state and version equality.

## Transaction write surface

The successful atomic command writes the authoritative Branding replacement,
the persisted Command state and the Tenant-scoped audit required by the existing
write-authority model.

The transaction does not change Tenant ownership.

The transaction does not change Membership role or capability state.

The transaction does not create cross-Tenant Branding state.

## Behavioral payload

The behavioral payload is:

~~~text
{
  tenantId,
  expectedVersion,
  branding
}
~~~

The canonical command payload hash binds:

~~~text
command type
tenantId
expectedVersion
complete caller-owned branding value
~~~

commandId identifies the persisted command.

correlationId remains part of authoritative command binding and replay
coherence.

The target Tenant binding must remain coherent with the persisted command.

## Replay

An existing succeeded UpdateTenantBranding command may replay only when its
authoritative bindings remain coherent.

Replay requires coherence of at least:

~~~text
command type
commandId
correlationId
tenantId
behavioral payload
payload hash
persisted result
~~~

A valid replay returns the existing successful result.

A replay does not apply the Branding replacement again.

A replay does not increment version again.

A payload or correlation mismatch is:

~~~text
CONFLICT
~~~

A malformed persisted Command is:

~~~text
CONTRACT_VIOLATION
~~~

A malformed persisted result is:

~~~text
CONTRACT_VIOLATION
~~~

## Result

The successful command result contains exactly:

~~~text
{
  commandId,
  correlationId,
  operation,
  resourceType,
  resourceId,
  status,
  replayed
}
~~~

The result literals are:

~~~text
operation: "UpdateTenantBranding"
resourceType: "tenantBranding"
resourceId: tenantId
status: "succeeded"
~~~

replayed records whether the result came from a coherent previously succeeded
command.

## Audit

UpdateTenantBranding uses Privileged audit.

The normative audit identity is:

~~~text
operation: UpdateTenantBranding.update
level: Privileged
resourceType: tenantBranding
resourceId: tenantId
result: succeeded
~~~

Branding values must not be copied unrestricted into audit records.

The allowed before-summary surface is structural version information only.

The allowed after-summary surface is structural version information only.

Audit metadata may contain structural execution information such as:

~~~text
stage
previousVersion
nextVersion
~~~

Raw Branding values, including display names, URLs and color values, are not
authorized merely because they participated in the mutation.

A later materialization checkpoint must encode exact portable audit allowlists
consistent with this boundary.

## Error mapping

The Branding-specific command error mapping is:

~~~text
INVALID_ARGUMENT
  malformed command input
  malformed complete Branding payload
  malformed expectedVersion
  unknown command fields
  unknown Branding fields
  caller attempts to provide server-owned Branding fields

UNAUTHENTICATED
  unauthenticated actor

FORBIDDEN
  missing Membership authority
  foreign Membership authority
  Membership is not tenant_admin
  missing tenant.manage_branding capability
  cross-Tenant authority attempt

NOT_FOUND
  target Tenant does not exist
  target Branding document does not exist

FAILED_PRECONDITION
  target Tenant is archived
  legacy unversioned Branding requires explicit migration
  invalid external reference

CONFLICT
  expectedVersion differs from authoritative persisted version
  command payload binding conflict
  correlation binding conflict

CONTRACT_VIOLATION
  malformed persisted Branding
  malformed persisted Membership authority
  malformed persisted Command
  malformed persisted result

UNAVAILABLE / INTERNAL
  infrastructure failure according to the existing backend error taxonomy
~~~

R7-R1 does not redefine the repository-wide backend error taxonomy.

It maps UpdateTenantBranding conditions onto that existing taxonomy.

## Package impact required after this checkpoint

A later shared-contract materialization checkpoint must encode the closed
R7-R1 decisions.

That materialization is expected to address at least:

~~~text
TENANT_BRANDING_FIELDS
validateTenantBranding
BootstrapTenant Branding persistence

COMMAND_TYPES.UPDATE_TENANT_BRANDING
atomic Tenant command allowlisting where required

UpdateTenantBranding input field constants
Branding mutation field constants
validateUpdateTenantBrandingInput
updateTenantBrandingBehavioralPayload

UpdateTenantBranding result constants
validateUpdateTenantBrandingResult

audit literals
audit summary allowlists
audit metadata allowlists

generated TypeScript declarations
package exports
package tests
package version
Functions vendor artifact
~~~

The exact technical file set must be determined by the later materialization
gate from the repository state that exists at that time.

R7-R1 does not perform those changes.

## Bootstrap impact

The later materialization must update BootstrapTenant persisted Branding
construction so newly created Branding documents receive:

~~~text
version: 1
~~~

BootstrapTenant caller input remains version-free.

The version is backend-owned.

The materialization must preserve all unrelated BootstrapTenant semantics.

## Migration boundary

Introducing version changes the persisted Branding schema.

Existing unversioned Branding therefore requires explicit compatibility
consideration before executable UpdateTenantBranding may target that state.

R7-R1 does not authorize:

~~~text
remote production migration
bulk Firebase mutation
automatic legacy version assignment
implicit version 0
implicit version 1
~~~

Any production data migration is a separate human-reviewed operation.

## Explicit boundary

R7-R1 does not:

~~~text
modify packages/saas-contracts
modify Functions source
modify Firestore Rules
modify Firestore indexes
modify Firebase configuration
deploy
modify remote Firebase data
implement UpdateTenantBranding
implement SuspendTenant
implement RestoreTenant
implement ArchiveTenant
~~~

The only purpose of R7-R1 is to close the normative mutation and
optimistic-concurrency contract required by R7.

## What remains closed

R7-R1 does not reopen:

~~~text
BootstrapTenant workflow closure
UpdateTenantProfile sequence
UpdateTenantSettings sequence
SaaS-03B-D-R5
SaaS-03B-D-R6
tenant_admin role separation
tenant.manage_branding capability
Tenant Branding canonical path
Branding caller-owned field set
Branding field nullability
exact Branding colors shape
trusted-backend write authority
Privileged audit classification
Tenant update/configuration workflow ordering
~~~

## State

~~~text
SaaS-03B-D-R5 = completed
UpdateTenantProfile = backend_sequence_closed

SaaS-03B-D-R6 = completed
UpdateTenantSettings = backend_sequence_closed

SaaS-03B-D-R7 = in_progress
SaaS-03B-D-R7-R1 = contract_closed_pending_review_and_publication
UpdateTenantBranding = mutation_concurrency_contract_closed_pending_materialization

SuspendTenant = blocked_pending_update_family_completion
RestoreTenant = blocked_pending_update_family_completion
ArchiveTenant = blocked_pending_update_family_completion

SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
~~~

## Next gate

After independent human review and publication of R7-R1, derive only the minimum
shared-contract materialization checkpoint required to encode the closed
UpdateTenantBranding contract.

Do not implement the UpdateTenantBranding Functions command before its shared
contract materialization is independently completed and published.

Do not start SuspendTenant, RestoreTenant or ArchiveTenant before the
UpdateTenantBranding sequence is closed.