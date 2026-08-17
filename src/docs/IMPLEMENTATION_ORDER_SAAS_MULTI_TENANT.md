# Orden de implementación SaaS multi-tenant

## Current checkpoint - SaaS-03B-E-R1 RegistrationRequest Backend Contract Freeze

- `SaaS-03B-D = completed_and_published`
- `SaaS-03B-E = in_progress`
- `SaaS-03B-E-R1 = contract_authored_pending_validation`
- `Selected scope = RegistrationRequest lifecycle`
- `ApproveRegistrationRequest = contract_frozen_pending_validation`
- `RejectRegistrationRequest = contract_frozen_pending_validation`
- `Membership = dependency_only`
- `Course = out_of_scope`
- `Enrollment = out_of_scope`
- `Implementation = not_authorized`
- `Functions mutation = not_authorized`
- `Firebase mutation = not_authorized`
- `Next gate = validate SaaS-03B-E-R1 RegistrationRequest backend contract freeze`
## Current checkpoint - SaaS-03B-D Final Tenant Bootstrap / Lifecycle Closure

The authoritative SaaS-03B-D seven-workflow Tenant catalogue is technically complete
and all backend implementation sequences have been published.

BootstrapTenant = independently_validated

UpdateTenantProfile = backend_sequence_closed
UpdateTenantSettings = backend_sequence_closed
UpdateTenantBranding = backend_sequence_closed

SuspendTenant = backend_sequence_closed
RestoreTenant = backend_sequence_closed
ArchiveTenant = backend_sequence_closed

R7 update/configuration family = completed

Published lifecycle implementation commits:

SuspendTenant = 936e036
RestoreTenant = 8cf78b2
ArchiveTenant = f43dd49612ee52218b91e39ada345b7e0a49dbaa

Final ArchiveTenant validation:

authority = 6/6 PASS
command = 9/9 PASS
transaction store = 12/12 PASS
targeted total = 27/27 PASS
Functions complete suite = 246/246 PASS
Functions TypeScript check = PASS
Functions build = PASS
entrypoint boundary = PASS

No public Tenant lifecycle handler exists.

No protected Firebase surface is modified by this documentary closure.

Current roadmap state:

SaaS-03B-D = completed_pending_final_documentary_commit_and_human_push
SaaS-03B-E = blocked_pending_03B_D_closure_publication
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started

Historical checkpoints below remain immutable evidence of the state that existed
when they were created.

After independent review, controlled documentary commit and human publication:

SaaS-03B-D = completed

Only after publication may the authoritative next SaaS-03B-E checkpoint be derived.

Do not invent a SaaS-03B-E internal identifier, implementation shape or technical
scope before this closure has been published.

---

## Current checkpoint - SaaS-03B-D-R7-R3 UpdateTenantBranding Backend Implementation and Update Family Closure

R7-R3 materializes and validates the trusted-backend UpdateTenantBranding
workflow after R7-R1 closed its mutation/concurrency semantics and R7-R2
materialized its portable contract.

The complete ordered update/configuration family is now technically
implemented:

UpdateTenantProfile = backend_sequence_closed
UpdateTenantSettings = backend_sequence_closed
UpdateTenantBranding = backend_sequence_closed

R7 update/configuration family = completed

R7-R3 validation evidence:

UpdateTenantBranding authority = 10/10 PASS
UpdateTenantBranding transaction store = 9/9 PASS
UpdateTenantBranding command = 6/6 PASS
Functions complete suite = 169/169 PASS
portable Branding contract = 13/13 PASS
shared package regression = 96/96 PASS
package TypeScript check = PASS
git diff --check = PASS

Technical implementation commit:

b8850381f288e2d72d63782d6109d62035dae451

feat(saas): implement update tenant branding backend

No public UpdateTenantBranding handler exists.

No protected Firebase surface was modified.

No Tenant lifecycle implementation has started.

R4 established that the update family must complete before lifecycle
implementation begins. That dependency is now technically satisfied.

Current roadmap state:

SaaS-03B-D-R5-R2 = completed
UpdateTenantProfile = backend_sequence_closed

SaaS-03B-D-R6 = completed
SaaS-03B-D-R6-R1 = completed
UpdateTenantSettings = backend_sequence_closed

SaaS-03B-D-R7 = completed
SaaS-03B-D-R7-R1 = completed
SaaS-03B-D-R7-R2 = completed
SaaS-03B-D-R7-R3 = completed_pending_documentary_commit_and_push
UpdateTenantBranding = backend_sequence_closed

R7 update/configuration family = completed

SuspendTenant = ready_for_contract_resolution_after_R7_publication
RestoreTenant = blocked_pending_SuspendTenant_sequence
ArchiveTenant = blocked_pending_SuspendTenant_sequence

SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started

Historical checkpoints below remain immutable evidence of the state that
existed when they were created. Their previous
blocked_pending_update_family_completion values are not rewritten.

After human review, documentary commit and publication of R7, derive only the
minimum authoritative next checkpoint for SuspendTenant contract resolution.

Do not invent the next identifier before publication.

Do not start RestoreTenant or ArchiveTenant.

---

## Current checkpoint - SaaS-03B-D-R6-R1 UpdateTenantSettings Mutation and Optimistic Concurrency Contract Resolution

R6 identified that UpdateTenantSettings could not be materialized without first
closing mutation composition and optimistic-concurrency semantics.

R6-R1 resolves those blockers normatively.

Closed decisions:

- UpdateTenantSettings uses complete replacement of caller-owned Settings fields;
- registrationPolicy is replaced as one exact four-boolean object;
- featureFlags is replaced as one complete boolean map;
- Tenant must be active;
- persisted Settings gains server-owned integer version >= 1;
- BootstrapTenant initializes Settings version to 1;
- UpdateTenantSettings requires expectedVersion;
- transaction requires persisted.version == expectedVersion;
- successful update increments version exactly once;
- stale expectedVersion returns CONFLICT;
- legacy unversioned Settings require explicit migration and are not silently upgraded;
- behavioral payload contains tenantId + expectedVersion + settings;
- replay never increments version again.

No package or Functions code has been modified by R6/R6-R1.
No protected Firebase file has been modified.
No deployment has occurred.

Current roadmap state:

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

After publication, derive only the minimum shared-contract materialization
checkpoint for UpdateTenantSettings.

---
## Current checkpoint - SaaS-03B-D-R5-R2 UpdateTenantProfile Backend Implementation

R5-R2 implements and validates the executable trusted-backend
`UpdateTenantProfile` workflow closed normatively by R5 and materialized in the
shared package by R5-R1.

Implemented backend surface:

```text
authorization/updateTenantProfileAuthority.ts
commands/updateTenantProfile.ts
persistence/updateTenantProfileTransactionStore.ts
```

with dedicated authority, transaction-store and command tests.

The workflow now enforces:

- verified authenticated actor;
- persisted Identity coherence;
- active Tenant;
- canonical MembershipKey lookup from authenticated UID;
- authoritative approved Membership;
- tenant_admin authority;
- tenant.update capability;
- package-valid AuthorityResolution;
- transaction-time Identity/Tenant/MembershipKey/Membership reread;
- behavioral-payload idempotency;
- exact replay binding;
- field-scoped profile update plus server-owned updatedAt;
- exact privileged Command persistence;
- exactly one non-PII Tenant audit.

Final validation:

```text
Functions TypeScript check = PASS
Functions lint = PASS
Functions tests = 119/119 PASS
Focused UpdateTenantProfile = 36/36 PASS
Shared package tests = 69/69 PASS
Shared package TypeScript check = PASS
```

No public UpdateTenantProfile handler exists.
No protected Firebase file was modified.
No deploy occurred.

Current roadmap state:

```text
SaaS-03B-D-R5 = completed
SaaS-03B-D-R5-R1 = completed
SaaS-03B-D-R5-R2 = completed_pending_human_review_and_push
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

After R5-R2 human review and publication, close the UpdateTenantProfile sequence
and derive only the minimum next checkpoint for UpdateTenantSettings.

---
## Current checkpoint - SaaS-03B-D-R5-R1 UpdateTenantProfile Shared Contract Materialization

R5-R1 materializes the exact UpdateTenantProfile contract closed by R5 in
`@mipymetic/saas-contracts@0.15.0`.

The shared package now owns:

- `COMMAND_TYPES.UPDATE_TENANT_PROFILE`;
- completed-only atomic Tenant command-stage authorization;
- exact UpdateTenantProfile input and patch field constants;
- exact input validation;
- behavioral payload projection;
- exact universal seven-field Tenant command result validation;
- exact Privileged audit literals and non-PII audit allowlists;
- runtime exports and generated TypeScript declarations.

The additive public surface is released as:

```text
@mipymetic/saas-contracts
0.14.0 -> 0.15.0
```

Root consumes workspace version 0.15.0.
Functions consume the exact vendored artifact:

```text
functions/vendor/mipymetic-saas-contracts-0.15.0.tgz
```

Canonical artifact evidence:

```text
entries: 66
SHA-256: 5c1a5825247376696ecaca3ae99ab8b625759a32e106161602e719e9d6ce6108
npm shasum: ccb90ce6cd6c6a9f4b50226bd12510dcba46f8bf
integrity: sha512-yL4Ahx64eqltQ7Zi/ghMQWaMH30jqoJK8+Fan7DWlhtFc2Hj4Faw0Cn/L7iVZeMrqHbuC1HnefIFPzNszZU/mg==
```

Two independent packs produced the same SHA-256.

Validation is green:

```text
package tests = 69/69 PASS
package topology = 5/5 PASS
package TypeScript check = PASS
strict NodeNext declarations = PASS
deterministic declarations = PASS
artifact reproducibility = PASS
Functions TypeScript check = PASS
```

No executable UpdateTenantProfile Functions implementation exists yet.

No changes were made to Firestore Rules, indexes, Storage Rules, Firebase
configuration or client Firebase initialization.

Current roadmap state:

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed
SaaS-03B-D-R5 = completed
SaaS-03B-D-R5-R1 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = shared_contract_materialized_pending_R5_R1_push
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

After human review and publication of R5-R1, derive only the minimum next
checkpoint for executable UpdateTenantProfile backend implementation.

Do not start UpdateTenantSettings, UpdateTenantBranding, SuspendTenant,
RestoreTenant or ArchiveTenant before the UpdateTenantProfile sequence is closed.

---
## Current checkpoint - SaaS-03B-D-R5 UpdateTenantProfile Contract Resolution

R5 closes the exact normative command boundary for UpdateTenantProfile.

The command remains trusted-backend only and is authorized for an authenticated
Identity with approved same-Tenant tenant_admin authority and tenant.update.

The canonical external input is:

```text
{
  commandId,
  correlationId,
  tenantId,
  patch
}
```

The patch is non-empty and may contain only:

- displayName
- shortName
- country
- locale
- timezone

No caller-controlled membershipId, authority, lifecycle field, timestamp,
expectedVersion, expectedUpdatedAt or other concurrency token is authorized.

Tenant authority must be derived server-side from authenticated uid through the
canonical MembershipKey -> Membership lookup, with package validation and exact
tenant_admin / tenant.update authority.

Concurrency remains transaction/reread based with field-scoped Tenant updates.
The command must never replace a stale whole-Tenant snapshot. No new persisted
Tenant version field is introduced.

The stable result remains the universal seven-field Tenant command result.
Successful execution uses succeeded/completed and produces one Tenant-scoped
Privileged audit without profile values or Membership identifiers.

R5 is documentation-only. Package materialization and Functions implementation
have not started.

Current roadmap state:

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

After human review and publication of R5, derive only the minimum shared-package
materialization microphase for UpdateTenantProfile. Do not implement the Functions
command before that shared contract materialization is published.

Do not start UpdateTenantSettings, UpdateTenantBranding, SuspendTenant,
RestoreTenant or ArchiveTenant.

---
## Current checkpoint - SaaS-03B-D-R4 Deferred Tenant Workflow Contract and Sequence Reconciliation

R4 closes the post-BootstrapTenant ordering ambiguity for the remaining six
authorized Phase-D Tenant workflows.

The remaining work is split into two ordered families:

```text
Family A - Tenant update/configuration
1. UpdateTenantProfile
2. UpdateTenantSettings
3. UpdateTenantBranding

Family B - Tenant lifecycle
4. SuspendTenant
5. RestoreTenant
6. ArchiveTenant
```

The update family must complete before lifecycle implementation begins.

R4 is documentation-only. No package, Functions, Domain, Shared/client, Rules,
indexes, Firebase configuration, UI, remote Firebase operation or deploy is part
of this reconciliation.

The next executable family is UpdateTenantProfile first. Its exact payload,
optionality/nullability, update-token/version binding, replay semantics, audit
allowlists, resourceType and exhaustive error mapping must be closed before
technical implementation.

Current roadmap state:

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = blocked_pending_exact_contract_materialization_after_R4_push
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

After human review and publication of R4, inspect only the authoritative
UpdateTenantProfile contracts and derive the minimum next identifier from the
published genealogy. Do not begin UpdateTenantSettings, UpdateTenantBranding or
any lifecycle command before the UpdateTenantProfile sequence is closed.

---
## Current checkpoint - SaaS-03B-D-R3-C1 Independent BootstrapTenant Review

R3-C1 completes the full independent post-repair review of BootstrapTenant.
The complete R1 through R5 repair lineage is published and the final independent
revalidation found no new technical defect or contract gap.

BootstrapTenant remains an internal Firestore-only command. Its canonical
Platform Admin authority is preserved, the Tenant aggregate remains atomic,
replay is read-only, malformed and conflicting states fail closed, audit routing
is destination-owned, and contention/retry behavior remains coherent.

Validation evidence:

- Functions 83/83 PASS
- BootstrapTenant Emulator 7/7 PASS
- PlatformCommandTransactionStore Emulator 11/11 PASS
- BootstrapPlatformAdmins Emulator 3/3 PASS
- RecoverPlatformAdmin Emulator 3/3 PASS
- RevokePlatformAdmin Emulator 5/5 PASS
- package @mipymetic/saas-contracts@0.14.0: 57/57 PASS
- RegistrationRequest precheck 52 / 34 ALLOW / 18 DENY
- Membership precheck 81 / 44 / 37
- Course precheck 114 / 32 / 82
- Enrollment precheck 111 / 42 / 69
- Firestore Rules preflight 222 / 88 ALLOW / 134 DENY
- general tests 35/35 PASS
- production build PASS
- Node syntax checks PASS
- global lint baseline unchanged at 13 errors / 8 warnings
- attributable lint delta = 0
- root audit unchanged at 25 vulnerabilities
- Functions audit unchanged at 7 moderate
- protected file hashes unchanged
- Firebase remote not used
- deploy not performed

The first regression Emulator attempt after deleting generated functions/lib
failed before business execution with ERR_MODULE_NOT_FOUND. Rebuilding the
derived Functions output restored the expected environment and every regression
suite passed. This is classified as test-environment preparation, not a product
defect.

Current roadmap state:

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed
SaaS-03B-D-R3-C1-R4 = completed
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed
SaaS-03B-D-R3-C1-R5-R2 = completed
SaaS-03B-D-R3-C1-R5 = completed
SaaS-03B-D-R3-C1 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_ready_for_deferred_workflow_contract_resolution_after_R3_C1_push
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and publication of R3-C1, do not implement any deferred
Tenant workflow directly. First perform the minimum roadmap/contract
reconciliation required to establish the authoritative order and contract
boundary for:

- UpdateTenantProfile
- UpdateTenantSettings
- UpdateTenantBranding
- SuspendTenant
- RestoreTenant
- ArchiveTenant

No identifier for that next reconciliation is assigned by this checkpoint.
It must be derived from the published genealogy rather than invented.

---
## Current checkpoint - SaaS-03B-D-R3-C1-R5 BootstrapTenant audit authority scope specific review

R5 independently validates the BootstrapTenant Tenant-audit authority and
destination-scope repair after the published R5-R2 Foundation/caller cutover.

The canonical human Platform Admin remains platform-scoped with `tenantId=null`.
Both BootstrapTenant audits use the exact canonical actor. The Tenant audit uses
an explicit Tenant destination; the platform audit uses an explicit platform
destination. Foundation validates AuthorityResolution and destination before
writes, and derives both routing and `AuditEvent.tenantId` exclusively from the
destination. Executable synthetic Platform Admin authority residual count is zero.

The previously blocked mandatory Emulator evidence was completed manually.
BootstrapTenant aggregate, zero-write failures, replay, corrupted replay,
contention and retry characterization pass. Platform Store,
BootstrapPlatformAdmins, Recover and Revoke regressions pass. Functions are
83/83, package 57/57, repository suites and prechecks pass, Rules preflight is
222/88/134, general tests are 35/35, production build and Node syntax checks
pass. Clean global lint remains the legacy 13 errors/8 warnings with
attributable delta zero. Supply-chain baseline is unchanged and protected file
hashes match exactly. No Firebase remote or deploy was used.

Historical blockers are now classified:

```text
BOOTSTRAP_TENANT_TENANT_AUDIT_AUTHORITY_SCOPE_INVALID = CLOSED
SHARED_FOUNDATION_AUDIT_AUTHORITY_DESTINATION_SCOPE_GAP = CLOSED
R5_R2_SCOPE_DEPENDENCY_CONTRADICTION = CLOSED
ENVIRONMENT_EVIDENCE_GATE_BLOCKED = RESOLVED_ENVIRONMENTALLY
```

Current roadmap state:

```text
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed
SaaS-03B-D-R3-C1-R5-R2 = completed
SaaS-03B-D-R3-C1-R5 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1 = blocked_pending_R5_push_then_full_independent_revalidation
BootstrapTenant = audit_scope_independently_validated_pending_full_R3_C1_review
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and publication, execute only:

`SaaS-03B-D-R3-C1 - Independent BootstrapTenant Review`.

Do not start another Tenant workflow or later SaaS phase before that review is closed.

---
## Current checkpoint — SaaS-03B-D-R3-C1-R5-R2 audit destination materialization

R5-R2 completes the atomic Foundation/caller cutover approved by R5-R2-R1.
Audit destination is explicit and exact; canonical AuthorityResolution is
validated and preserved; routing and `AuditEvent.tenantId` derive only from the
destination. All callers migrated without fallback. The Tenant Bootstrap caller
now uses canonical Platform Admin authority plus explicit Tenant destination,
with no other business or aggregate change.

Functions, isolated clean validation, package, Emulator suites, repository
prechecks, Rules preflight, general tests and production build pass. Package
0.14.0 and AuditEvent schema v1 remain unchanged. Legacy lint and supply-chain
baselines have attributable delta zero; protected files remain intact.

```text
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed
SaaS-03B-D-R3-C1-R5-R2 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R5_R2_push_then_specific_review
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-D-R3-C1-R5 —
BootstrapTenant Tenant Audit Authority Scope Repair / Specific Review`.

## Current checkpoint — SaaS-03B-D-R3-C1-R5-R2-R1 cutover scope reconciliation

R5-R2-R1 resolves `R5_R2_SCOPE_DEPENDENCY_CONTRADICTION`. The Foundation API
change and every required caller migration are one atomic technical cutover.
The sole permitted Tenant Store adaptation replaces its synthetic Platform Admin
authority with the unchanged canonical actor and supplies an explicit Tenant
destination. This is a mechanical API migration, not new business or
authorization semantics.

The previous R5-R2 STOP was correct because publishing Foundation alone would
break or invalidate a production caller. R5-R1 remains authoritative. After
this resolution is published, the same R5-R2 identifier resumes with its
joint-Foundation-and-required-callsite scope; no compatibility fallback or
intermediate broken commit is allowed. R5 then performs the distinct
BootstrapTenant-specific review and regression characterization.

```text
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5-R2 = ready_for_joint_foundation_and_required_callsite_cutover_after_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R5_R2_cutover_then_specific_review
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1-R5-R2 — Audit
Destination Scope Foundation Materialization` under this reconciled scope.

## Current checkpoint — SaaS-03B-D-R3-C1-R5-R1 audit destination contract resolution

R5-R1 closes `SHARED_FOUNDATION_AUDIT_AUTHORITY_DESTINATION_SCOPE_GAP`
without technical changes. `AuthorityResolution.tenantId` remains exclusively
actor authority scope; persisted `AuditEvent.tenantId` is exclusively the
audited Tenant/destination scope. Future Foundation materialization must accept
an exact platform-or-Tenant destination, validate canonical authority and
destination coherence, and derive path and event Tenant ID from destination.
Authority must never be mutated for routing.

The audit schema remains v1 and roots remain unchanged, so package, migration,
Rules, index and Firebase configuration changes are unnecessary. Published R4
commit `090caf659131ec2db8ff8d43b532ca9a8f85e881` also reconciles R4 to completed
while preserving its historical pre-push state.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed
SaaS-03B-D-R3-C1-R4 = completed
SaaS-03B-D-R3-C1-R5-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R1_push_then_foundation_materialization
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-D-R3-C1-R5-R2 — Audit
Destination Scope Foundation Materialization`. Do not repair BootstrapTenant R5
until that Foundation checkpoint is published.

## Current checkpoint — SaaS-03B-D-R3-C1-R4 Store authority repair

R4 repairs `BOOTSTRAP_TENANT_STORE_ACTOR_AUTHORITY_UNVALIDATED`. The Store now
consumes the package 0.14.0 runtime validator, restricts valid resolutions to
the canonical human Platform Admin with `platform.tenant_create`, and binds the
validated actor to Membership approval, Command and both audits. Invalid actors
are physically zero-write; the nine-document checkpoint, replay, contention and
retry invariants remain intact.

The complete historical blocker lineage is preserved in the R4 report,
including replay binding, aggregate validation, persisted Membership, audit
authority, shared runtime validation and normative actor-matrix gaps.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed
SaaS-03B-D-R3-C1-R4 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1 = blocked_pending_R4_push_and_revalidation
BootstrapTenant = repaired_pending_independent_revalidation
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`.

## Current checkpoint — SaaS-03B-D-R3-C1-R4-R1 authority runtime materialization

The actor matrix closed by R4-R1-R1 is now materialized in
`@mipymetic/saas-contracts@0.14.0` as a portable exact-shape runtime union and
validator. Foundation validates human resolver output and the two approved
system operators at their trust boundaries. Package, Functions, repository,
precheck, Rules, build, lint-baseline, audit and protected-file gates pass.

The Tenant Bootstrap Store remains deliberately unchanged. R4 may consume this
shared primitive only after human review and publication of this checkpoint.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R4 = blocked_pending_R4_R1_push_then_repair
SaaS-03B-D-R3-C1 = blocked_pending_R4_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1-R4 —
BootstrapTenant Store Actor Authority Validation Repair`.

## Current checkpoint — SaaS-03B-D-R3-C1-R4-R1-R1 authority actor matrix resolution

The attempted R3-C1-R4 Store actor-authority repair stopped correctly because
`AuthorityResolution` had no authoritative runtime validator. R4-R1 then proved
that materialization was blocked by an incomplete actor/authority matrix.
R4-R1-R1 closes that normative gap without changing technical files.

The resolved model is a closed union of human authority and system operator
resolutions. Human roles are singleton and capabilities exactly match the
canonical ordered package matrix. System operators are limited to
`platform_system` and command-specific `platform_recovery`, use null Tenant
scope and exact empty role/capability arrays. Every variant has six required
fields and rejects unknown fields. Package materialization and Foundation
composition remain the next gate; the Tenant Store is not repaired here.

The R3-C1-R3 documentation commit `b7104a49f30b179c563669db3111632f8719573a`
is published and an ancestor of current `main`, so its former pre-push state is
reconciled to `completed` while its historical checkpoint remains intact.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R4-R1 = blocked_pending_R1_R1_push_then_materialization
SaaS-03B-D-R3-C1-R4 = blocked_pending_R4_R1_materialization
SaaS-03B-D-R3-C1 = blocked_pending_R4_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1-R4-R1 — Authority
Resolution Runtime Contract Resolution and Materialization`. Do not resume the
Tenant Store repair before shared materialization is published.

**Estado:** plan corregido y listo para aprobación de implementación
**Estrategia:** expand → migrate → contract
**Regla:** ninguna fase activa enforcement ni elimina compatibilidad antes de
cumplir su gate.

## Current checkpoint — SaaS-03B-D-R3-C1-R3 audit contract authority repair

R3-C1-R3 repairs `BOOTSTRAP_TENANT_AUDIT_CONTRACT_LOCALLY_DUPLICATED`.
BootstrapTenant now consumes package-owned audit literals and enforces exact
package-owned allowlists for both summaries and metadata. Both audits remain
inside the atomic nine-document checkpoint and all regression gates pass.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1 = blocked_pending_R3_push_and_revalidation
BootstrapTenant = repaired_pending_independent_revalidation
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`.

## Previous checkpoint — SaaS-03B-D-R3-C1-R2 Store aggregate validation repair

R3-C1-R2 closes `BOOTSTRAP_TENANT_STORE_NEW_AGGREGATE_UNVALIDATED`.
Before its first write, the Tenant Bootstrap Store validates every NEW
aggregate candidate with package-owned validators, proves the cross-document
first-admin composition and validates the persisted result binding. Nominal
server timestamp intent is verified while only native Firestore transforms are
persisted. Unit and Emulator evidence proves malformed NEW aggregate rejection
is physically zero-write and valid creation remains one atomic nine-document
checkpoint.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1 = blocked_pending_R2_push_and_independent_revalidation
BootstrapTenant = repaired_pending_independent_revalidation
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`. Do not start another Tenant workflow.

## Previous checkpoint — SaaS-03B-D-R3-C1-R2-R1 persisted Membership validator

The attempted R3-C1-R2 Store aggregate repair stopped before technical edits
because the package had no authoritative persisted Membership validator.
R3-C1-R2-R1 resolves only that shared gap. `@mipymetic/saas-contracts@0.13.0`
now exports the pure, exact-shape, legacy-unversioned
`validatePersistedMembership`; Functions consumes its reproducible vendored
artifact. The Tenant Store and BootstrapTenant semantics remain unchanged.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R2 = blocked_pending_R1_push_then_resume
SaaS-03B-D-R3-C1 = blocked_pending_R2_completion_and_revalidation
BootstrapTenant = repaired_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1-R2 —
BootstrapTenant Store Aggregate Validation Repair`. Do not rerun R3-C1 until
R3-C1-R2 is completed and published.

## Current checkpoint — SaaS-03B-D-R3-C1-R1 replay result binding repair

The independent R3-C1 review found
`BOOTSTRAP_TENANT_REPLAY_RESULT_BINDING_UNVALIDATED`: a structurally valid but
foreign persisted result could be accepted and hidden by a reconstructed replay
response. R3-C1-R1 now validates the exact Command/result composition in both
the orchestration pre-read and the Store race path. The original committed
result must retain `replayed=false`; only the returned read-only replay uses
`replayed=true`. Incoherent results fail with `CONTRACT_VIOLATION` and zero
writes.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = blocked_pending_R1_push_and_revalidation
SaaS-03B-D-R3-C1-R1 = completed_pending_human_review_and_push
BootstrapTenant = repaired_pending_independent_revalidation
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`. Do not start another Tenant workflow.

## Previous checkpoint — SaaS-03B-D-R3 BootstrapTenant implementation

No implementation identifier was assigned in the published roadmap. After R1
contract reconciliation and R2 shared materialization, the minimum consistent
identifier is `SaaS-03B-D-R3 — BootstrapTenant Implementation`.

BootstrapTenant is implemented as an internal command with no public handler.
It validates server-derived actor, Auth and Identity evidence, persisted active
Platform Authority and `platform.tenant_create`, then atomically creates the
Tenant aggregate, first Membership and MembershipKey, tenant-admin Authority
State, completed Command, and tenant/platform Critical audits. Auth writes are
zero. Unit and Firestore Emulator gates pass.

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = completed_pending_human_review_and_push
BootstrapTenant = implemented_and_validated
BootstrapTenant independent review = ready_not_started_after_R3_push
SaaS-03B-D = in_progress_pending_BootstrapTenant_independent_review
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`. Do not start the six deferred workflows, 03B-E/F or
Phase 4.

## Previous checkpoint — SaaS-03B-D-R2 shared contract materialization

R2 materializes only the closed BootstrapTenant shared subset in
`@mipymetic/saas-contracts@0.12.0`: exact input/hash projection, seven-field
Tenant result, audit allowlists, completed-only stage authorization, persisted
Tenant/config/MembershipKey/tenant-admin Authority State validators and the
canonical key encoder. Root and Functions use the reproducible vendor artifact.
No business command, handler, Store or other phase-D command type is created.

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1-R1 = completed
SaaS-03B-D-R2 = completed_pending_human_review_and_push
SaaS-03B-D = contracts_materialized_ready_for_first_implementation_microphase_after_R2_push
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, execute only the first BootstrapTenant
implementation microphase derived from the genealogy. Do not start the six
deferred workflows, 03B-E/F or Phase 4.

## Previous checkpoint — SaaS-03B-D-R2-R1-R1 Bootstrap envelope/result resolution

R2-R1-R1 resolves the contradictions reported by R2-R1 without technical
materialization. CorrelationId is a required command-envelope/input binding but
is excluded from behavioral hashing. Generated membershipId remains internal
aggregate state and is recovered through MembershipKey; it does not extend the
universal seven-field Tenant result. First-admin Membership and key use nullable
`originRequestId: null`.

Tenant-admin Authority State starts at count 1, revision 1 and current command
lastCommandId. Bootstrap commits directly to succeeded/completed with no orphan
pending command. Tenant and platform Critical audits use the exact shared
`BootstrapTenant.create` operation and bounded allowlists. All Bootstrap shared
contracts are now closed for later R2 package materialization.

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R2-R1 = completed_pending_R2_R1_R1_push
SaaS-03B-D-R2 = blocked_pending_R2_R1_R1_push_and_materialization
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_contract_materialization
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R2 — Tenant Bootstrap and
Lifecycle Shared Contract Materialization`, limited first to the now-closed
BootstrapTenant shared contracts. Do not implement BootstrapTenant.

## Previous checkpoint — SaaS-03B-D-R2-R1 Bootstrap shared-contract contradiction

R2-R1 recovered several authoritative physical decisions: Tenant, Settings,
Branding and Membership are legacy-unversioned exact shapes; uidKey is the
approved versioned Base64URL encoding; membershipId is independently generated;
and Bootstrap is a nine-document, Firestore-only atomic aggregate with zero Auth
writes.

The resolution nevertheless stops with `RESULT D`. R1 requires generated
membershipId in the command result, while the current result contract permits
exactly seven fields and has no membershipId. MembershipKey requires
originRequestId although first-admin bootstrap has no RegistrationRequest.
Bootstrap's exact payload also omits correlationId required by command v2, and
the authority-state initial revision/lastCommandId plus audit literals remain
unspecified. Choosing values would invent a persisted contract.

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1 = blocked_pending_R2_R1_R1
SaaS-03B-D-R2 = blocked_pending_R2_R1_resolution
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_contract_completion
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

Next execute only `SaaS-03B-D-R2-R1-R1 — BootstrapTenant Command Envelope,
MembershipKey Origin and Result Contract Resolution`. It is documentation-only
and must not implement or materialize BootstrapTenant.

## Previous checkpoint — SaaS-03B-D-R2 shared-contract materialization blocker

R2 audited the published R1 contract inventory and stopped before technical
edits with `RESULT C`. Package 0.11.0 still contains only BootstrapTenant among
the seven phase-D commands. No new authoritative source closes the exact
settings/branding shapes, membershipKey encoder/value schema, tenant-admin
authority-state schema/validator, Bootstrap result/audit ambiguity, or the six
missing command payload/repeat/audit contracts.

Partial materialization would invent persisted contracts, so no command type,
validator, declaration, artifact or Functions dependency changed. The gaps
separate naturally into Bootstrap shared persistence, tenant-admin updates and
platform lifecycle semantics. Only the next minimum resolution is identified;
later resolution identifiers are deliberately deferred.

```text
SaaS-03B-C = completed
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = blocked_pending_R2_R1_normative_resolution
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_contract_completion
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

Next execute only `SaaS-03B-D-R2-R1 — Tenant Bootstrap Shared Persistence and
Result Contract Resolution`. It is normative and must not implement
BootstrapTenant or any other Tenant business command.

## Previous checkpoint — SaaS-03B-D-R1 Tenant bootstrap/lifecycle contract reconciliation

The published aggregate closure commit
`9d09725345917760c57cb76b5069b7fc18d9b0dd` advances SaaS-03B-C from its
pre-push pending state to `completed`. No 03B-C technical blocker remains.

The first 03B-D audit confirms the contractual name
`Tenant/first-admin bootstrap/lifecycle` and its seven-workflow catalogue:
BootstrapTenant; profile, settings and branding updates; and suspend, restore
and archive lifecycle commands. These are three distinct authority/transaction
families and cannot safely be delivered as one opaque implementation.

The package contains BootstrapTenant and all seven capabilities, but lacks the
other six command types, exact command payload/result/audit contracts, persisted
Tenant/config/key validators, the tenant-admin authority-state validator and a
canonical membershipKey encoder. The outcome is `RESULT C + D`: normative gaps
remain and 03B-D is split into an ordered sequence. R1 is documentation-only;
no Tenant business command, package change, Rules change or handler was created.

```text
SaaS-03B-B = completed
Privileged Backend Foundation = independently_validated
Platform Command Transaction Store = implemented_and_emulator_validated
BootstrapPlatformAdmins = independently_validated
RecoverPlatformAdmin = independently_validated
RevokePlatformAdmin = independently_validated
SaaS-03B-C = completed
SaaS-03B-D-R1 = completed_pending_human_review_and_push
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_R2
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-D-R2 — Tenant Bootstrap
and Lifecycle Shared Contract Materialization`. R2 closes and physically
materializes shared contracts without implementing Tenant business commands.

## Previous checkpoint — SaaS-03B-C aggregate privileged platform backend closure

The aggregate closure review passes without technical changes. Foundation, the package-owned schemas, Transaction Store, Bootstrap, Recover and Revoke remain mutually coherent and independently validated. The cross-command matrix preserves `transitionCommandId` as the only target-local owner, treats Registry `lastCommandId` as global history only, rejects command-type reuse/takeover, and keeps every activeCount delta exact and idempotent.

Functions pass 67/67 and clean isolated validation. Firestore Emulator passes the combined Store/Bootstrap/Recover/Revoke suite 22/22. Package 0.11.0 remains unchanged at 40/40; Shared 51/51, repositories 360/360, all prechecks, Rules 222/88/134, general 35/35 and production build pass. Protected hashes, supply-chain baselines and legacy lint remain unchanged. Rules impact is `RULES_IMPACT_NONE`; indexes, Storage and Firebase configuration also require no change.

```text
SaaS-03B-B = completed
Privileged Backend Foundation = independently_validated
Platform Command Transaction Store = implemented_and_emulator_validated
SaaS-03B-C-R4 = completed
SaaS-03B-C-R4-C1 = completed
BootstrapPlatformAdmins = independently_validated
SaaS-03B-C-R5 = completed
SaaS-03B-C-R5-C1 = completed
RecoverPlatformAdmin = independently_validated
SaaS-03B-C-R6 = completed
SaaS-03B-C-R6-C1 = completed
RevokePlatformAdmin = independently_validated
SaaS-03B-C = completed_pending_human_review_and_push
SaaS-03B-D = ready_not_started_after_03B_C_push
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, SaaS-03B-D is the next eligible phase but remains not started in this checkpoint.

## Previous checkpoint — SaaS-03B-C-R6-C1 independent Revoke revalidation

The complete independent post-repair review passes. R6-C1-R1 makes new Revoke prepare atomic, and R6-C1-R2 requires a read-only Command/Authority/Registry checkpoint proof before any existing Revoke can reach Auth. Forensic review found no scope drift, generic ownership bypass, lifecycle shortcut, orphan command, count/revision drift or audit leak.

Functions pass 67/67 and clean isolated validation. Firestore Emulator passes Revoke 5/5, Store 11/11, Bootstrap 3/3 and Recover 3/3. Package 0.11.0 remains unchanged at 40/40; Shared 51/51, repositories 360/360, prechecks, Rules 222/88/134, general 35/35 and production build pass. Legacy lint remains 13 errors/8 warnings, supply-chain baselines and protected hashes remain unchanged.

```text
SaaS-03B-C-R6 = completed
SaaS-03B-C-R6-C1-R1 = completed
SaaS-03B-C-R6-C1-R2 = completed
SaaS-03B-C-R6-C1 = completed_pending_human_review_and_push
RevokePlatformAdmin = independently_validated
BootstrapPlatformAdmins = independently_validated
RecoverPlatformAdmin = independently_validated
SaaS-03B-C = ready_for_aggregate_closure_review
SaaS-03B-D = blocked_pending_03B_C_closure
Phase 4 = not_started
```

After human review and push, perform only the roadmap aggregate closure review for SaaS-03B-C. Do not start 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R6-C1-R2 Revoke resume lifecycle repair

The second independent R6-C1 review found `REVOKE_EXISTING_RESUME_AUTHORITY_LIFECYCLE_UNVALIDATED`: an existing `running/prepared` or `recovery_required/prepared` Revoke was classified from Command binding alone, so an incoherent Authority checkpoint could reach Auth before Store finalization rejected it.

R6-C1-R2 adds a narrow, read-only, Revoke-specific Store checkpoint proof. Before any Auth effect, one transaction rereads and validates Command, Authority and Registry together. Running resume now requires `revoking/currentCommandId` with a completed Registry; recovery resume requires `recovery_required/currentCommandId` with a recovery-required Registry. Foreign owners conflict and every other lifecycle fails closed without Command, Authority, Registry, audit, count or revision mutation. Replay ordering and R6-C1-R1 atomic new-command prepare remain unchanged.

Functions pass 67/67; clean isolated validation passes. Firestore Emulator passes Revoke 5/5, Bootstrap 3/3, Recover 3/3 and Store 11/11. Package 0.11.0 remains 40/40; Shared 51/51, repositories 360/360, prechecks, Rules 222/88/134, general 35/35 and production build pass. Legacy lint remains 13 errors/8 warnings, supply-chain baselines and protected hashes remain unchanged.

```text
SaaS-03B-C-R6 = implemented
SaaS-03B-C-R6-C1-R1 = completed
SaaS-03B-C-R6-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-C-R6-C1 = blocked_pending_R2_push_and_revalidation
RevokePlatformAdmin = repaired_pending_independent_revalidation
SaaS-03B-C = blocked_pending_R6_C1_revalidation
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`. Do not start 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R6-C1-R1 Revoke prepare atomicity repair

The independent R6-C1 review found `REVOKE_COMMAND_PREPARE_ATOMICITY_BROKEN`: new Revoke execution created a pending command before the transactional lifecycle and last-admin decision. R6-C1-R1 replaces that write with read-only existing-command inspection and a narrow Revoke-only Store prepare primitive. Command, Authority, Registry decrement/revision and Critical audit now commit together or not at all.

Functions pass 65/65. Firestore Emulator passes Store 11/11, Bootstrap 3/3, Recover 3/3 and Revoke 4/4; loser commands are physically absent for same-target and last-two-admin contention. Package 0.11.0 and full SaaS, Rules, build, lint, supply-chain and protected-hash baselines remain unchanged.

```text
SaaS-03B-C-R6 = implemented
SaaS-03B-C-R6-C1 = blocked_pending_R1_human_review_push_and_revalidation
SaaS-03B-C-R6-C1-R1 = completed_pending_human_review_and_push
RevokePlatformAdmin = repaired_pending_independent_revalidation
SaaS-03B-C = blocked_pending_R6_C1_revalidation
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`. Do not start 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R6 RevokePlatformAdmin implementation

`RevokePlatformAdmin` is implemented as an internal authenticated command. Server-derived actor Identity/Authority and the package capability matrix guard the operation; self-revoke and last-admin revoke fail closed. Prepare owns the target and decrements `activeCount` exactly once, Auth claim removal remains outside Firestore transactions, forward recovery retains ownership, and finalization/replay are idempotent.

Functions pass 64/64. Local Firestore Emulator passes Store 11/11, Bootstrap 3/3, Recover 3/3 and Revoke 3/3, including same-target contention and the last-two-admin invariant. Package 0.11.0 remains unchanged at 40/40. Full SaaS, Rules, build, protected-hash and supply-chain baselines pass with attributable delta zero.

```text
SaaS-03B-C-R5 = completed
SaaS-03B-C-R5-C1 = completed
RecoverPlatformAdmin = independently_validated
SaaS-03B-C-R6 = completed_pending_human_review_and_push
RevokePlatformAdmin = implemented_and_validated
Revoke independent review = ready_not_started
SaaS-03B-C = in_progress_pending_revoke_independent_review
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`. Do not start 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R5-C1 independent Recover revalidation

The independent post-repair review passes. R5-C1-R1 removed the generic active
owner capability and R5-C1-R2 made active lifecycle validation precede owner
classification. Forensic, unit, clean isolated and real Firestore Emulator
evidence now closes Recover without technical changes in C1.

Functions pass 58/58; Firestore Emulator passes Store 11/11, Bootstrap 3/3 and
Recover 3/3. Package 0.11.0 remains unchanged at 40/40. Full SaaS regressions,
protected hashes, supply-chain baselines and the 13-error/8-warning legacy lint
baseline remain stable with attributable delta zero.

```text
SaaS-03B-C-R5 = completed
SaaS-03B-C-R5-C1-R1 = completed
SaaS-03B-C-R5-C1-R2 = completed
SaaS-03B-C-R5-C1 = completed_pending_human_review_and_push
RecoverPlatformAdmin = independently_validated
RevokePlatformAdmin = ready_not_started
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, continue only with the roadmap-authorized
RevokePlatformAdmin implementation/reconciliation sequence. Do not start
03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R5-C1-R2 active lifecycle repair

R5-C1 revalidation found that the active-claim primitive's shared same-owner
early return preceded its Authority status check. R5-C1-R2 now validates the
primitive-specific lifecycle first: active claim accepts only `active`, then
classifies null/same/foreign owner. All non-active same-owner states fail
closed. Handoff retains its distinct provisioning resume and the active failure
checkpoint remains narrow and idempotent.

Functions pass 58/58. Firestore Emulator passes Store 11/11, Bootstrap 3/3 and
Recover 3/3. Package 0.11.0 remains unchanged at 40/40; full regressions,
protected hashes and the 13-error/8-warning legacy source lint baseline remain
stable with attributable delta zero.

```text
SaaS-03B-C-R5-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-C-R5-C1 = blocked_pending_R2_push_and_revalidation
RecoverPlatformAdmin = repaired_pending_independent_revalidation
RevokePlatformAdmin = blocked
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-C-R5-C1 — Independent
RecoverPlatformAdmin Revalidation`. Do not start Revoke, 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R5-C1-R1 owner-scope repair

The independent R5-C1 review stopped on
`RECOVER_TRANSITION_OWNER_FLAG_UNSCOPED`: generic Store mutation exposed a flag
that could preserve ownership on an active Authority for commands other than
Recover. R5-C1-R1 removes that generic capability and rejects transition
lookalikes at runtime. `claimActiveRecoveryOwnership` is again the sole active
claim route; a second narrow Recover-only primitive persists the active
recovery-required checkpoint without rewriting Authority or count.

Functions pass 56/56. Firestore Emulator passes Store 10/10, Bootstrap 3/3 and
Recover 3/3; package 0.11.0 remains unchanged at 40/40. Full regressions pass.
The historical lint discrepancy is reconciled: generated `functions/lib`
contributed three transient errors (16 total); with derived output removed the
source baseline remains 13 errors/8 warnings and attributable delta is zero.

```text
SaaS-03B-C-R5-C1-R1 = completed_pending_human_review_and_push
SaaS-03B-C-R5-C1 = blocked_pending_R1_push_and_revalidation
RecoverPlatformAdmin = repaired_pending_independent_revalidation
RevokePlatformAdmin = blocked
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-C-R5-C1 — Independent
RecoverPlatformAdmin Review`. Do not start Revoke, 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R5 RecoverPlatformAdmin implementation

`RecoverPlatformAdmin` is implemented as an internal break-glass command on
Authority schema v2 and the narrow Transaction Store ownership primitives.
Approval, Auth and exact persisted Identity validation precede ownership; Auth
effects remain outside transactions. Active reconciliation is count-neutral,
prior-Recover handoff is the only handoff, non-active activation increments
exactly once, forward recovery retains ownership, and replay is read-only.

Functions are 54/54. Recover, Bootstrap and Store Firestore Emulator suites are
3/3, 3/3 and 9/9. Package 0.11.0 remains 40/40 and unchanged; full repository,
precheck, Rules, general and build regression passes. No Revoke command, public
handler, Rules/index/config change, Firebase remote operation or deployment was
created.

```text
SaaS-03B-C-R5 = completed_pending_human_review_and_push
RecoverPlatformAdmin = implemented_and_validated
RevokePlatformAdmin = ready_not_started_pending_recover_independent_review
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-C-R5-C1 — Independent
RecoverPlatformAdmin Review`. Do not implement Revoke, 03B-D or Phase 4 yet.

## Previous checkpoint — SaaS-03B-C-R5-R1-R1 ownership materialization

The shared Recover ownership contract is physically materialized. Platform
Authority schema v2 preserves the same fields and permits an active Authority
to remain authoritative while a Recover command owns claim reconciliation.
Package 0.11.0, generated declarations and the canonical artifact are coherent.

The Transaction Store exposes narrow active-claim and authorized prior-Recover
handoff primitives. Unit and Firestore Emulator evidence prove one-winner
concurrency, no Bootstrap/Revoke takeover, count-zero ownership changes and
exactly-once Recovery activation. Bootstrap remains valid on Authority v2.

```text
SaaS-03B-C-R5-R1-R1 = completed_pending_human_review_and_push
Recover ownership shared contract = materialized
Platform Authority schema = v2
@mipymetic/saas-contracts = 0.11.0
Platform Command Transaction Store = recovery_ownership_ready
BootstrapPlatformAdmins = regression_validated_on_authority_v2
RecoverPlatformAdmin = ready_not_started_after_R5_R1_R1_push
RevokePlatformAdmin = blocked_pending_recovery_sequence
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-C-R5 —
RecoverPlatformAdmin Implementation`. Do not start Revoke, 03B-D or Phase 4.

## Previous checkpoint — SaaS-03B-C-R5-R1 Recover ownership resolution

`SaaS-03B-C-R5` stopped during Audit Before Edit because Authority schema v1
cannot own an `active` claim-reconciliation transition and cannot authorize a
new break-glass command to replace a prior transition owner. R5-R1 closes the
normative policy as **RESULT B — SHARED RECOVER OWNERSHIP CONTRACT GAP**.

The selected model keeps a previously active Authority active and counted while
a Recover command temporarily owns claim reconciliation. An authorized handoff
is limited to a prior Recover command in `recovery_required/prepared`;
Bootstrap, live-command and Revoke ownership cannot be taken over. This
requires Platform Authority schema v2, a revised status-owner
matrix and atomic Store claim/handoff primitives before Recover implementation.

```text
SaaS-03B-C-R4 = completed
SaaS-03B-C-R4-C1 = completed
BootstrapPlatformAdmins = independently_validated
SaaS-03B-C-R5-R1 = completed_pending_human_review_and_push
Recover ownership boundary = normatively_resolved_pending_shared_materialization
RecoverPlatformAdmin = blocked_pending_shared_ownership_materialization
RevokePlatformAdmin = blocked
SaaS-03B-C = in_progress_blocked_pending_R5_R1_materialization
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, execute only `SaaS-03B-C-R5-R1-R1 — Recover
Platform Authority Ownership Shared Contract Materialization`. Do not resume R5
until that package/Store boundary is independently available.

## Previous checkpoint — SaaS-03B-C-R4-C1 independent Bootstrap revalidation

The complete independent R4-C1 revalidation after the published R4-C1-R1
repair is PASS. It independently rejects malformed persisted Identity values,
requires both targets to validate before any prepare/Auth effect, and preserves
the approved Bootstrap payload, approval, claims, forward recovery, resume,
finalize, replay, audit and physical-timestamp contracts.

Functions remain 43/43 and package 40/40. Real Firestore Emulator evidence
remains Bootstrap 3/3 and Store 5/5, including competing ownership, transaction
retry, recovery resume and finalize idempotency. The clean isolated Functions
validation, full SaaS regression, protected hashes and dependency baselines all
pass with no technical change.

```text
SaaS-03B-C-R4 = completed
SaaS-03B-C-R4-C1 = completed_pending_human_review_and_push
SaaS-03B-C-R4-C1-R1 = completed
BootstrapPlatformAdmins = independently_validated
RecoverPlatformAdmin = ready_not_started
RevokePlatformAdmin = blocked_pending_recovery_or_next_sequence
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push of this documentation-only closure, Recovery may
begin only in its separate authorized microphase.

## Previous checkpoint — SaaS-03B-C-R4-C1-R1 persisted Identity repair

The independent R4-C1 review stopped fail-closed after proving that the
Bootstrap Firestore Identity boundary accepted exact-key documents with
malformed values. `SaaS-03B-C-R4-C1-R1` repairs only that defect.

The Functions boundary now normalizes Identity `createdAt`/`updatedAt` from
native Firestore Timestamp to canonical ISO and validates all eight required
fields before Bootstrap prepare. Both targets must pass before any command,
Registry, Authority, audit or Auth write. Unit, clean-install and real Emulator
regressions pass without package, Domain, Shared, Rules or Firebase changes.

```text
SaaS-03B-C-R4 = implemented
SaaS-03B-C-R4-C1 = blocked_pending_R1_human_review_push_and_revalidation
SaaS-03B-C-R4-C1-R1 = completed_pending_human_review_and_push
BootstrapPlatformAdmins = repaired_pending_independent_revalidation
RecoverPlatformAdmin = blocked
RevokePlatformAdmin = blocked
SaaS-03B-C = blocked_pending_R4_C1_revalidation
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, rerun the complete `SaaS-03B-C-R4-C1` from a
clean published HEAD. Do not begin Recovery before that independent closure.

## Previous checkpoint — SaaS-03B-C-R4 BootstrapPlatformAdmins

`SaaS-03B-C-R4` implements the first internal privileged business command on
the validated Foundation and transaction Store. It uses the exact payload,
injected approval/Auth/Identity boundaries, atomic prepare/recovery/finalize,
sequential claim reconciliation, forward recovery, stable replay and Critical
audit. Unit and real Firestore Emulator evidence proves competing-bootstrap
exclusion, retry-safe prepare, recovery resume and finalize idempotency.

```text
SaaS-03B-C-R4 = completed_pending_human_review_and_push
BootstrapPlatformAdmins = implemented_and_validated
RecoverPlatformAdmin = ready_not_started
RevokePlatformAdmin = blocked_pending_recovery_or_next_sequence
SaaS-03B-C = in_progress
SaaS-03B-D = blocked
Phase 4 = not_started
```

No public handler, Recovery/Revoke implementation, package, Domain, Shared,
Rules, index or Firebase configuration change was introduced. After human
review and push, continue only with RecoverPlatformAdmin.

## Previous checkpoint — SaaS-03B-C-R3-R7 transaction Store boundary

The first `SaaS-03B-C-R3-R7` execution stopped fail-closed as
`BLOCKED_EMULATOR_RUNTIME_UNAVAILABLE`: the Emulator artifact existed but Java
did not. It left no candidate implementation or staging. This resumed execution
uses the same identifier after Java became available.

The Platform Command Transaction Store is implemented on the validated
transaction ports. It validates Registry, Authority and Command reads, enforces
`transitionCommandId` ownership, updates revision/count/last-command and audit
atomically, and keeps Firebase Admin in the adapter. Firestore Emulator 1.21.0
evidence covers competing ownership, same-owner resume, last-two-admin
concurrency, callback retry, single committed deltas/audits and native server
timestamps. No command saga, Auth effect, handler, Rules/index/config change or
remote Firebase operation was introduced.

```text
SaaS-03B-C-R3-R7 = completed_pending_human_review_and_push
Platform Command Transaction Store = implemented_and_emulator_validated
SaaS-03B-C = ready_to_implement_business_commands_after_R3_R7_push
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, `SaaS-03B-C` may implement only the already closed
Bootstrap, Recovery and Revoke contracts. `SaaS-03B-D` remains blocked.

## Previous checkpoint — SaaS-03B-C-R3-R6 stage and timestamp materialization

`SaaS-03B-C-R3-R6` materializes the published R3-R5 contract without starting
the Platform Command Transaction Store. `@mipymetic/saas-contracts` advances
to `0.10.0`: command schema v2 has the required backend-owned `stage`, the
ordered frozen stage catalog, and fail-closed command/status matrices. V1 is
rejected without inference or migration.

The Functions boundary now writes command and platform-audit authoritative
times through `ServerOwnedTimestamp` and normalizes their explicitly declared
Firestore Timestamp fields to canonical UTC ISO before portable validation.
No Store, handler, business command, Rules, index or Firebase configuration was
created or changed.

```text
SaaS-03B-C-R3-R6 = completed_pending_human_review_and_push
Stage + Command/Audit Timestamp Technical Materialization = completed_pending_human_review_and_push
Platform Command Transaction Store Boundary = ready_not_started_after_push
SaaS-03B-C = blocked_pending_transaction_store
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, start only the Platform Command Transaction Store
Boundary. Bootstrap, Recovery and Revoke remain unimplemented.

## Previous checkpoint — SaaS-03B-C-R3-R5 privileged command stage resolution

`SaaS-03B-C-R3-R5` closes the persisted checkpoint contract required by the
future Platform Command Transaction Store. The package-owned catalog to be
materialized is ordered `not_started`, `prepared`, `completed`, persisted in a
required non-null backend-owned `stage` field. It is deliberately smaller than
the audit-stage vocabulary: uncertain or partial Auth effects retain
`prepared`, enter `recovery_required`, and force an external-state reread.

The exact command record advances from schema v1/18 fields to v2/19 fields.
Current readers and writers will be v2-only; no stage is inferred from a v1
status. Repository evidence shows no handlers, deployed privileged backend or
implemented business commands, so unexpected v1 persisted data blocks rollout
and requires a separate migration decision rather than automatic conversion.

```text
SaaS-03B-C-R3-R5 = completed_pending_human_review_and_push
Privileged Command Persisted Stage Contract Resolution = completed_pending_human_review_and_push
Stage + Command/Audit Timestamp Technical Materialization = blocked_pending_R3_R5_push
Platform Command Transaction Store Boundary = blocked_pending_stage_timestamp_materialization
SaaS-03B-C = blocked_pending_transaction_store
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, materialize schema v2, the stage catalog/matrices,
and command/audit timestamp shapes together. Do not start the Store yet.

## Previous checkpoint — SaaS-03B-C-R3-R4 Registry validation and timestamp boundary

`SaaS-03B-C-R3-R4` materializes the two published prerequisites for the
Platform Command Transaction Store: the package-owned frozen registry state
catalog and exact fail-closed registry validator, plus the Functions-local
portable boundary for server-owned Firestore timestamps. The shared package
advances additively to `0.9.0`; Functions consumes its single reproducible
vendored artifact.

Firestore native `Timestamp` values are normalized by the Admin adapter to
canonical ISO strings before portable core validation. Core writes can request
server time only through an identity-safe Functions token which the adapter
maps to `FieldValue.serverTimestamp()`. This checkpoint does not implement the
Transaction Store, any platform command, handler, Rules change or deployment.

```text
SaaS-03B-C-R3-R4 = completed_pending_human_review_and_push
Registry Validation + Timestamp Boundary prerequisite = completed_pending_human_review_and_push
Platform Command Transaction Store Boundary = blocked_pending_R3_R4_push
SaaS-03B-C = blocked_pending_transaction_store
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, the Platform Command Transaction Store Boundary
becomes `ready_not_started`. Do not start it in this microphase.

## Previous checkpoint — SaaS-03B-C-R3-R3 Registry contract resolution

`SaaS-03B-C-R3-R3` closes the exact Platform Authority Registry state and
last-command contract required before its runtime validator can be
materialized. The canonical ordered state catalog is `uninitialized`,
`in_progress`, `completed`, `recovery_required`, targeted for explicit frozen
exports from `@mipymetic/saas-contracts/authority`.

The Registry exists before the first privileged command. Its exact initial v1
state is `uninitialized`, `activeCount=0`, `revision=0`,
`lastCommandId=null`, with a non-null server-owned `updatedAt`. `lastCommandId`
is a required-nullable history/coordination field: null only while
`uninitialized`; every other state requires the valid identifier of the most
recent command that transactionally mutated the Registry. It is not Authority
transition ownership.

```text
SaaS-03B-C-R3-R3 = completed_pending_human_review_and_push
Registry Contract Resolution = completed_pending_human_review_and_push
Registry Validation + Timestamp Boundary prerequisite = blocked_pending_R3_R3_push
Platform Command Transaction Store Boundary = blocked_pending_prerequisite_boundary_implementation
SaaS-03B-C = blocked_pending_transaction_store
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, resume the technical Registry Validation and
Server-Owned Timestamp Boundary prerequisite. Do not start the Transaction
Store or business commands yet.

## Current checkpoint — SaaS-03B-C-R3-R2 transition ownership materialization

`SaaS-03B-C-R3-R2` materializes the already approved portable timestamp,
independent Authority/Registry schema versions, and Platform Authority
transition-owner contract. `@mipymetic/saas-contracts` advances additively to
`0.8.0`; Functions consumes the canonical reproducible artifact. Platform
Authority schema v1 is exact and fail-closed, and `transitionCommandId` is
required/nullable according to the approved status-owner matrix.

This microphase does not implement cross-document ownership coordination, the
Transaction Store, BootstrapPlatformAdmins, RecoverPlatformAdmin or
RevokePlatformAdmin.

```text
SaaS-03B-C-R3-R2 = completed_pending_human_review_and_push
Platform Authority Transition Ownership Resolution = completed_pending_human_review_and_push
Platform Command Transaction Store Boundary = blocked_pending_ownership_push
SaaS-03B-C = blocked_pending_transaction_store
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, the Platform Command Transaction Store Boundary
becomes `ready_not_started`. Do not begin it in this microphase.

## Current checkpoint — SaaS-03B-C-R3-R1 portable timestamp resolution

`SaaS-03B-C-R3-R1` closes the portable persisted timestamp policy required by
Platform Authority Transition Ownership. The logical shared value is a
canonical UTC ISO-8601 string with exactly millisecond precision
(`YYYY-MM-DDTHH:mm:ss.sssZ`). Firestore continues to persist its native
timestamp value; an SDK adapter converts that value to the portable string on
read. `serverTimestamp()` remains a write transform owned by the adapter and is
never a persisted value or package contract.

The package validator to be materialized with Transition Ownership must accept
only the canonical non-null string. Field contracts own nullability. Authority
`createdAt` and `updatedAt` are non-null; `activatedAt`, `revokedAt` and
`lastClaimSyncAt` accept the canonical value or `null`. Client/business payloads
cannot supply these server-owned fields. No client repository, Rules, index,
package, artifact or Functions change is made by this documentation-first
resolution.

```text
SaaS-03B-C-R3-R1 = completed_pending_human_review_and_push
Platform Authority Transition Ownership Resolution = blocked_pending_R3_R1_push
Platform Command Transaction Store Boundary = blocked
SaaS-03B-C = blocked
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, resume Transition Ownership and materialize this
primitive together with the Authority validator. Do not start the Transaction
Store or 03B-C yet.

## Current checkpoint — SaaS-03B-C-R3 authority schema versioning resolution

`SaaS-03B-C-R3` closes the persisted-schema policy that blocked transition
ownership. The current 12-field Platform Authority is classified as a legacy,
unversioned design; `AUTHORITY_SCHEMA_VERSION = 1` has persisted meaning only
for the registry in the current implementation. Authority and registry will be
versioned independently.

The first explicit Platform Authority schema will use
`PLATFORM_AUTHORITY_SCHEMA_VERSION = 1` and a required server-owned
`schemaVersion` discriminator. Registry retains version 1 under the future
unambiguous name `PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION`. Missing or
unknown versions fail closed. Repository evidence shows no privileged backend
deployment or production Platform Authority writer, so the first deployment
may write only the new current schema; no compatibility reader or migration is
authorized.

```text
SaaS-03B-C-R3 = completed_pending_human_review_and_push
Platform Authority Transition Ownership Resolution = blocked_pending_R3_push
Platform Command Transaction Store Boundary = blocked
SaaS-03B-C = blocked
SaaS-03B-D = blocked
Phase 4 = not_started
```

After human review and push, resume the ownership resolution. Do not implement
the Transaction Store or 03B-C yet.

## Current checkpoint — SaaS-03B-C-R2 BootstrapPlatformAdmins reconciliation

`SaaS-03B-C-R2` closes the two BootstrapPlatformAdmins gaps found by the first
03B-C implementation audit. `correlationId` is required operator input and the
immutable correlation value of the command record and every saga audit event.
It is excluded from the canonical behavioral payload hash, as required by
03B-A-R1, but a repeated command ID with a different correlation ID is a
`CONFLICT` before replay or resume.

Partial, failed or uncertain Auth claim application has one deterministic
policy: forward recovery. Authority remains non-active, command and registry
enter `recovery_required`, Auth state is reread, and the same command resumes
missing effects until finalization atomically activates both authorities. There
is no automatic cleanup, reset or cross-service rollback.

```text
SaaS-03B-C-R2 = completed_pending_human_review_and_push
SaaS-03B-C-R1 = completed
SaaS-03B-C-R1-R1 = completed
SaaS-03B-C = blocked_pending_bootstrap_contract_resolution_push
SaaS-03B-D = blocked
SaaS-03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, `SaaS-03B-C` becomes `ready_to_implement`.

## Current checkpoint — SaaS-03B-C-R1-R1 revoke capability resolution

The shared contract gap found by `SaaS-03B-C-R1` is resolved by the subordinate
microphase `SaaS-03B-C-R1-R1`. Package-owned capability
`platform.authority_revoke` is a platform-scoped `platform_authority` contract,
assigned only to `platform_admin`. It authorizes an ordinary revoke attempt; it
does not bypass last-admin protection and is not used by break-glass Recovery.

The additive public contract advances `@mipymetic/saas-contracts` from `0.6.1`
to `0.7.0`, including generated declarations and the canonical Functions
artifact. No command implementation, Rules change, Firebase operation or
03B-D work is part of this resolution.

```text
SaaS-03B-C-R1-R1 = completed_pending_human_review_and_push
SaaS-03B-C-R1 = completed
SaaS-03B-C = blocked_pending_shared_gap_push
SaaS-03B-D = blocked
SaaS-03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, `SaaS-03B-C` becomes `ready_to_implement`.

## Current checkpoint — SaaS-03B-C-R1 platform recovery/revocation contracts

The post-foundation scope audit proved that `RecoverPlatformAdmin` and
`RevokePlatformAdmin` had names and lifecycle outlines but no executable command
contracts. New resolution microphase `SaaS-03B-C-R1` now closes their payloads,
actors, approvals, target matrices, sagas, registry/count semantics,
idempotency, audit, errors, recovery and completion criteria without code.

Recovery is an out-of-band two-person break-glass ceremony and intentionally
requires no role capability. Revoke is an ordinary active-platform-authority
operation and must be capability-authorized. Package 0.6.1 has no exact
platform-authority-revoke capability, so implementation remains blocked pending
a shared-contract microphase; this document does not invent one.

```text
SaaS-03B-B = completed
SaaS-03B-B-C1 = completed
SaaS-03B-C-R1 = completed_pending_human_review_and_push
SaaS-03B-C = blocked_pending_shared_contract_resolution
SaaS-03B-D = blocked
SaaS-03B-E/F = not_started
Phase 4 = not_started
Privileged Backend Foundation = independently_validated
```

Next after human review and push: resolve the missing package-owned revoke
capability in an explicitly scoped shared-contract microphase. Do not implement
03B-C or begin 03B-D.

## Current checkpoint — SaaS-03B-B-C1-R2 independent foundation closure

The complete independent post-R2-R3 review validates persisted-record shape and
status invariants, authorization/config repairs, transaction/audit/error
foundations, strict TypeScript consumption, clean Functions isolation and the
unchanged root regression baselines. No technical defect remains in the
authorized foundation scope.

```text
SaaS-03B-B = completed
SaaS-03B-B-C1-R1 = completed
SaaS-03B-B-C1-R2-R1 = completed
SaaS-03B-B-C1-R2-R2 = completed
SaaS-03B-B-C1-R2-R3 = completed
SaaS-03B-B-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-B-C1 = completed
SaaS-03B-C = ready_not_started
Privileged Backend Foundation = independently_validated
```

Next after human review and push: reconstruct the exact SaaS-03B-C contract
from the current normative sources. Do not start it from historical memory.

## Current checkpoint — SaaS-03B-B-C1-R2-R3 command record status invariants repair

Independent C1-R2 revalidation found that R2-R2 validated `leaseExpiresAt` as a
nullable timestamp without enforcing its approved relationship with command
status. R2-R3 now permits a non-null lease only for `running`; pending,
succeeded, retryable failure, terminal failure and recovery-required records
must store a null lease. The complete unchanged regression matrix passes.

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R2-R3 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R3_human_review_push_and_revalidation
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
```

Next after human review and push: reexecute the independent full C1-R2
validation. Do not start 03B-C.

## Current checkpoint — SaaS-03B-B-C1-R2-R2 persisted command record repair

The independent C1-R2 revalidation proved that persisted Firestore command data
was cast directly to `CommandRecord`, allowing a partial succeeded record to be
accepted as replay. R2-R2 now validates exact fields, schema version, identifiers,
types, shared command/status/error literals, SHA-256 payload hashes, timestamps
and JSON result shape before idempotency. Malformed records fail closed.

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed
SaaS-03B-B-C1-R2-R1 = completed
SaaS-03B-B-C1-R2-R2 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R2_human_review_and_revalidation
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
```

Next after human review and push: reexecute the independent full C1 validation.
Do not start 03B-C.

## Current checkpoint — SaaS-03B-B-C1-R2-R1 identifier validation repair

The independent post-repair review found that three Functions consumers treated
the result-based `validateDocumentIdentifier` contract as throwing and therefore
accepted invalid authenticated and command identifiers. R2-R1 now discriminates
`validation.ok` explicitly without changing the shared package. Empty,
whitespace, dot, dot-dot and slash identifiers fail closed; the complete clean
Functions and root regression matrices pass.

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed
SaaS-03B-B-C1-R2-R1 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R1_human_review_and_push
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
Bootstrap platform_admin = not_started
```

Next after human review and push: perform a post-identifier-repair independent
full C1 revalidation. Do not start 03B-C.

## Current checkpoint — SaaS-03B-B-C1-R1 authority coherence repair

Independent C1 characterization proved that the original foundation accepted a
mismatched persisted Identity and ignored unknown configuration keys. R1 now
validates Identity/path authority coherence, makes the configuration allowlist
effective, and enforces transaction budgets through the provided transaction
port. The repair passes 19/19 Functions tests and the complete unchanged root
regression matrix.

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed_pending_human_review_and_push
SaaS-03B-B-C1 = blocked_pending_R1_human_review_and_push
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_C1_revalidation
Bootstrap platform_admin = not_started
```

Next after human review and push: run `SaaS-03B-B-C1-R2`. Do not start 03B-C.

## Current checkpoint — SaaS-03B-B-R1 package topology reconciliation and foundation completion

The resumed 03B-B worktree consumes the canonical
`@mipymetic/saas-contracts@0.6.1` artifact exclusively. R1 corrected the single
stale, fail-closed topology-test expectation from 0.6.0 to 0.6.1; package tests
pass 28/28 without runtime, type-surface, export or SemVer changes. The existing
Functions foundation compiles under strict TypeScript, passes 18/18 tests,
preserves the Admin/transport boundaries, and contains no business command or
deployed handler.

```text
SaaS-03B-B0-I = completed
SaaS-03B-B-R1 = completed
SaaS-03B-B = completed_pending_human_review_and_push
SaaS-03B-B-C1 = ready_not_started
SaaS-03B-C = blocked_pending_03B_B_C1
Privileged Backend Foundation = implemented
Privileged business commands = not_started
```

Next after human review and push: execute the independent `SaaS-03B-B-C1`
foundation review. Do not begin SaaS-03B-C before that gate.

## Current checkpoint — SaaS-03B-B0-I-R4-C1-R2 post-repair revalidation

The independent post-repair review confirms package `0.6.1` is runtime-correct,
strict-TypeScript-consumable, pure and byte-reproducible. JavaScript/JSDoc stays
authoritative; 28 generated declarations cover all eight public subpaths with
zero `any`. Published clean checkouts with opposite EOL settings reproduce the
canonical artifact exactly. The 21-file partial 03B-B worktree remains intact.

```text
SaaS-03B-B0-I-R4-C1-R1 = completed
SaaS-03B-B0-I-R4-C1-R2 = completed_pending_human_review_and_push
B0_I_TYPESCRIPT_DECLARATION_SURFACE = validated
SaaS-03B-B0-I = completed
PURE_CONTRACT_PHYSICAL_EXTRACTION = completed
SaaS-03B-B = ready_to_resume_partial_implementation_after_R2_push
Privileged Backend = partial_uncommitted_not_completed
```

Next after human review and push: resume the existing partial 03B-B foundation,
cut over its vendored dependency from 0.6.0 to 0.6.1, retire 0.6.0 when safe,
and resolve the five remaining foundation-local TypeScript errors.

## Current checkpoint — SaaS-03B-B0-I-R4-C1-R1 TypeScript declaration repair

The first strict TypeScript consumer exposed a post-R4-C1 packaging defect: the
`0.6.0` artifact had no declaration surface. R4-C1-R1 repairs that surface
without changing runtime semantics. JavaScript/JSDoc remains authoritative, 28
deterministic declarations cover all eight public subpaths, package `0.6.1` has
zero runtime dependencies, and its canonical artifact is byte-reproducible. The
preexisting partial 03B-B Functions work remains uncommitted and excluded.

```text
SaaS-03B-B0-I-R4-C1-R1 = completed_pending_human_review_and_push
B0_I_TYPESCRIPT_DECLARATION_SURFACE = repaired
SaaS-03B-B0-I = completed_pending_post_repair_revalidation
SaaS-03B-B = blocked_pending_B0_I_types_repair_push_and_resume
Privileged Backend = partial_uncommitted_not_completed
```

Next after human review and push: independent post-repair R4-C1 revalidation.
The package/artifact change makes that review mandatory before resuming 03B-B.

## Current checkpoint — SaaS-03B-B0-I-R4-C1 independent final review

The independent R4-C1 review confirms R4 `RESULT A` and closes the physical
pure-contract extraction. Package authority, compatibility adapters, residual
Domain classifications, purity, clean installs, regressions, Rules parity,
scoped lint and byte-exact artifact reproduction all pass. No technical change
was required; the privileged backend remains uncreated.

```text
SaaS-03B-B0-I-R3 = completed
SaaS-03B-B0-I-R3-C1 = completed
SaaS-03B-B0-I-R4 = completed
SaaS-03B-B0-I-R4-C1 = completed_pending_human_review_and_push
SaaS-03B-B0-I = completed
PURE_CONTRACT_PHYSICAL_EXTRACTION = completed
SaaS-03B-B = ready_not_started
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B — Privileged backend
foundation`. It was not started by this review.

## Historical checkpoint — SaaS-03B-B0-I-R4 final package closure

R4 selected `RESULT A — NO ADDITIONAL TECHNICAL MIGRATION`. The final audit
found zero defective/unexplained duplication and zero missing approved shared
validators or runtime schemas. All nine Domain adapters and the eight earlier
client adapters remain legitimate compatibility surfaces; no technical change,
SemVer bump, or artifact regeneration was justified. Clean root/Functions
installs, all imports, tests, prechecks, Rules, build, scoped lint, package purity
and byte-exact artifact reproduction pass.

```text
SaaS-03B-B0-I-R3 = completed
SaaS-03B-B0-I-R3-C1 = completed
SaaS-03B-B0-I-R4 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R4-C1 = ready_not_started
PURE_CONTRACT_PHYSICAL_EXTRACTION = implementation_complete_pending_R4_C1
SaaS-03B-B = blocked_pending_B0_I_R4_C1
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R4-C1`. R4-C1 and 03B-B were
not started.

## Historical checkpoint — SaaS-03B-B0-I-R3-C1 independent final review

The final R3 review revalidated the published lint-gate reconciliation and the
deterministic-EOL repair. All R3 authority, compatibility, purity, artifact,
clean-install, regression, Rules, build, scoped-lint, and delta-based global-lint
gates pass. The package artifact is byte-identical from clean Windows checkouts
with opposite safe `core.autocrlf` settings. Native Linux/WSL was unavailable and
is not reported as passing.

```text
SaaS-03B-B0-I-R3-C1-R1 = completed
SaaS-03B-B0-I-R3-C1-R2 = completed
SaaS-03B-B0-I-R3-C1 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = completed
SaaS-03B-B0-I-R4 = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R4
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R4`. R4 and 03B-B were not
started by this review.

## Historical checkpoint — SaaS-03B-B0-I-R3-C1-R2 artifact reproducibility repair

R3-C1-R2 selected `SOLUTION_A`. The package now has a repository-controlled LF
policy and a regression test over all 30 shipped source files. Independent
checkouts with `core.autocrlf=false` and `core.autocrlf=true` generate the same
0.6.0 tarball byte-for-byte, preserving the canonical SHA-256
`6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`.
No package semantics, version, artifact, manifest or lockfile changed.

```text
SaaS-03B-B0-I-R3-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C1 = blocked_pending_R2_push_and_revalidation
SaaS-03B-B0-I-R3 = not_closed
SaaS-03B-B0-I-R4 = blocked
SaaS-03B-B = blocked_pending_B0_I_R3_R4
Privileged Backend = not_created
```

Next after human review and push: re-execute `SaaS-03B-B0-I-R3-C1`. R4 is not
started.

## Historical checkpoint — SaaS-03B-B0-I-R3-C1-R1 global lint gate reconciliation

The first independent R3-C1 review found that every R3 gate passed except the
repository-global lint command. R3-C1-R1 selected `RESOLUTION_A`: a clean
pre-R3 baseline reproduces exactly the current 13 errors and 8 warnings, none
of their 11 files changed during R3, and lint over all R3 changes and affected
compatibility surfaces passes with zero errors and zero warnings.

The R3-C1 lint contract is now scoped and delta-based without hiding global
debt: execute and report global lint, require `R3_SCOPED_LINT = PASS` and
`GLOBAL_LINT_R3_DELTA = 0`, and block on any R3-attributable lint error. The
existing global debt remains unresolved and separately tracked.

```text
SaaS-03B-B0-I-R3-C1-R1 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C1 = blocked_pending_R1_push_and_revalidation
SaaS-03B-B0-I-R3 = not_closed
SaaS-03B-B0-I-R4 = blocked
SaaS-03B-B = blocked_pending_B0_I_R3_R4
Privileged Backend = not_created
```

Next after human review and push: re-execute `SaaS-03B-B0-I-R3-C1` with the
reconciled lint gate. R4 is not started.

## Historical checkpoint — SaaS-03B-B0-I-R3-H residual authority closure

R3-H selected `RESULT_A`: 21 migrated contracts retain package physical
authority through Domain compatibility reexports; 12 JSDoc shapes remain
structural Domain authority; five complete workflows remain temporary Domain
runtime authority because no later normative source authorizes their extraction;
and `APPROVE_REGISTRATION_REQUEST` is backend-deferred. Rules literals, fixtures
and legacy CEFR copies are classified, while defective duplication remains zero.
No technical change, adapter removal, SemVer change or artifact regeneration is
required.

```text
SaaS-03B-B0-I-R3-H = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-C1 = ready_not_started
SaaS-03B-B0-I-R4 = blocked_pending_R3_C1
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = residual_authority_reconciled
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R3-C1 — Independent Final
Review of R3`. It is not started.

## Current checkpoint — SaaS-03B-B0-I-R3-G error/result reconciliation

R3-G selected `RESULT_A`: Shared `RepositoryError`, its nine client codes and
Firebase mapping remain the client compatibility surface. Package common/backend
error codes and command, audit and authority status/result contracts remain pure
declarations. Matching common strings are legitimate cross-surface overlap, not
duplicate authority. Package `0.6.0` and its vendored artifact remain unchanged.

```text
SaaS-03B-B0-I-R3-G = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-H = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = error_result_surfaces_reconciled
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R3-H — Residual duplication
elimination and final authority closure`. It is not started.

> Course gate definitive status: `SaaS-03A.5R-B2 = completed`, Course runtime
> 114/114 and CourseRepository `completed_in_shadow_mode`. The next ordered
> phase `SaaS-03A.6A-R1` completed its contract resolution. `SaaS-03A.6B` is
> `ready_not_started`; EnrollmentRepository remains uncreated.

## Convenciones transversales

- `tenantId` es la frontera técnica.
- Los datos académicos pertenecen al tenant.
- Firebase Authentication/token es autoridad de `emailVerified`.
- `status` es autoridad de lifecycle de membership.
- Toda migración es idempotente, reanudable, auditable y ensayada.
- El cutover usa mantenimiento corto por dominio según ADR-008.
- Las reglas usan deny-by-default y se prueban negativamente entre dos tenants.
- Los feature flags tienen owner, valor seguro y fecha de retirada.

## 00 — Documentación y baseline

### Objetivo

Aprobar ADR, contrato de datos, estados, ownership y alcance del tenant legacy.

### Archivos

- actualizar `src/docs/*`;
- no modificar código.

### Dependencias

Auditoría SaaS, ADR-001 a ADR-009 y auditoría histórica.

### Datos, reglas y migraciones

Ninguna mutación.

### Pruebas

- revisión de términos;
- verificación de diagramas;
- `git diff --check`.

### Aceptación y gate

- tenant receptor de datos legacy designado;
- decisiones sin alternativas abiertas;
- responsables de seguridad y migración asignados.

### Riesgo y rollback

Contradicción documental. Rollback limitado a documentación.

## 01A — Inventario remoto y Emulator scaffolding

### Objetivo

Capturar el estado remoto real y preparar una infraestructura local sin escribir
todavía reglas funcionales definitivas.

### Crear

```text
firebase.json
.firebaserc
firestore.indexes.json
tests/rules/fixtures/
tests/rules/helpers/
```

Los archivos de reglas pueden crearse como copias verificadas del estado remoto
o scaffolding deny-by-default para paths todavía inexistentes, no como contrato
tenant definitivo.

### Modificar

- `package.json`: scripts de emulador y pruebas;
- documentación de entornos;
- `src/firebase.js` sólo si se necesita conexión explícita al emulador.

### Dependencias

Fase 00. Puede avanzar en paralelo con 01B.

### Datos, reglas y migraciones

- inventario read-only de Auth, colecciones, subcolecciones, Storage, reglas e
  índices;
- ninguna migración.

### Pruebas

- Emulator arranca sin servicios remotos;
- fixtures no contienen datos reales;
- ruleset remoto queda archivado y comparado.

### Aceptación y gate

Baseline reproducible y diferencias remotas conocidas. Las reglas definitivas
esperan 01B.

### Riesgo y rollback

Riesgo de asumir que reglas locales son remotas. No desplegar. Rollback:
retirar scaffolding.

## 01B — Contratos, estados y matriz de capacidades

### Objetivo

Cerrar modelos puros antes de escribir reglas o repositorios funcionales.

01B se entrega mediante subfases aprobadas de forma independiente. `01B.1`
define exclusivamente el modelo organizacional (`Tenant`, `Membership`,
`TenantSettings`, `TenantBranding` y sus enums) en
`src/domain/organization/`. Completar 01B.1 no satisface por sí solo el gate de
01B ni habilita SaaS-02.

`01B.2` depende del vocabulario organizacional de 01B.1 y define exclusivamente
el modelo académico puro (`Course`, `Enrollment`, `LearningLanguage`,
`InterfaceLanguage` y sus enums) en `src/domain/academic/`. Completar 01B.2
tampoco satisface por sí solo el gate de 01B ni habilita SaaS-02.

`01B.3` depende de MembershipRole definido en 01B.1 y modela exclusivamente la
identidad global y la solicitud de acceso institucional (`Identity`,
`RegistrationRequest`, `RegistrationPolicy` y `AccessState`) en
`src/domain/identity/`. Completar 01B.3 tampoco satisface por sí solo el gate de
01B ni habilita SaaS-02.

`01B.4` depende de los roles y estados definidos en 01B.1 y 01B.3. Define
exclusivamente el catálogo declarativo de capacidades, PlatformRole, scopes,
matriz por rol y AuthorizationContext en `src/domain/authorization/`. No
implementa evaluación y tampoco satisface por sí solo el gate de 01B ni
habilita SaaS-02.

`01B.5` referencia los estados y roles ya aprobados para documentar creación,
actores y transiciones de RegistrationRequest, Membership, Enrollment, Course
y Tenant en `src/domain/workflow/`. No implementa máquinas de estado y tampoco
satisface por sí solo el gate de 01B ni habilita SaaS-02.

`01B.5A` reconcilia de forma controlada RegistrationRequestStatus,
MembershipStatus y las capacidades `course.activate` y
`platform.tenant_archive`, sin implementar lógica ni habilitar SaaS-02.

`01B.6` documenta el modelo relacional lógico, ownership, cardinalidades,
dependencias y Aggregate Roots sin diseñar persistencia. Tampoco satisface por
sí solo el gate de 01B ni habilita SaaS-02.

`01B.7` realiza la revisión cruzada de Architecture Freeze. `01B.7A` reconcilia
exclusivamente sus cinco hallazgos altos: identidad canónica de Membership,
precedencia de AccessState, capacidades self de Identity, idioma de soporte de
Course y frontera idempotente de aprobación. Los resultados quedan
`resolved_pending_reaudit`; sólo una reauditoría posterior puede declarar el
freeze y habilitar el gate hacia SaaS-02.

`01B.7B` reaudita el gate y `01B.7C` reconcilia exclusivamente sus seis
bloqueadores: AccessState tenant-scoped, BCP 47, RegistrationPolicy compuesto,
retirada self de Membership, eliminación de `membership.review` y ownership de
`interfaceLocale`. Los cierres permanecen
`resolved_pending_final_reaudit`; SaaS-02 continúa bloqueada hasta la decisión
independiente de 01B.7D.

`01B.7D` reaudita directamente contratos y documentos, cierra todos los
bloqueadores contractuales y aprueba `Architecture Freeze` para Domain 1.0.0;
la enmienda aditiva SaaS-02B.4A lo evoluciona posteriormente a Domain 1.1.0 sin
revocar el Freeze.
SaaS-01B queda finalizada.

`02A.1` define los Persistence Roots, referencias y fronteras lógicas sin diseño
físico. `02A.2` completa invariantes, operaciones, integridad referencial,
retención, idempotencia y concurrencia conceptual. Con 02A.2, el modelo lógico
de persistencia queda completo. `02B.1` inicia la fase tecnológica mediante el
catálogo de patrones de acceso Firestore, todavía sin decidir topología física,
paths, índices ni reglas. `02B.2` selecciona y documenta la topología híbrida,
document shapes, referencias, lookups y fronteras atómicas sin implementar
queries, reglas o índices. `02B.3` define 45 Query Contracts, índices
documentales, ordenamientos, cursores y límites conceptuales para los 70 Access
Patterns sin modificar Firebase. `02B.4` define autoridad de escritura,
transactions, concurrencia, idempotencia, lookups, audit y errores, pero queda
incompleta hasta revalidar los dos gaps de capability. `02B.4A` aplica una
enmienda aditiva controlada: incorpora `registration_request.cancel_self` y
`membership.restore`, evoluciona el dominio congelado a 1.1.0 y queda
`completed_pending_revalidation`. SaaS-02B.4 sigue incompleta hasta esa
revalidación. `02B.4B` cierra FWC-001/002 pero detecta FWR-001/002/003.
`02B.4C` enlaza las transiciones, añade `platform.tenant_restore`, formaliza
RestoreTenant/UpdateTenantProfile/PlatformUpdateTenantMetadata y evoluciona a
Domain 1.2.0 con estado `completed_pending_revalidation`. SaaS-02B.4 y SaaS-02B
siguen incompletas. `02B.4D` revalida esas correcciones y detecta exclusivamente
FWR-005/006/007. `02B.4E` completa los tres escenarios de concurrencia, las tres
filas de idempotencia y corrige el conteo vigente a 70 Access Patterns/10 Tenant
patterns; su estado es `completed_pending_revalidation`. SaaS-02B.4 permanece
INCOMPLETE hasta SaaS-02B.4F, SaaS-02B permanece INCOMPLETE, SaaS-02C no ha
comenzado y el Mandatory Firebase Security Review Gate sigue PENDING.

La revalidación independiente `02B.4F` verifica y cierra FWR-005/006/007 sin
alterar arquitectura. El estado definitivo es:

```text
SaaS-02B.4A = completed
SaaS-02B.4B = completed
SaaS-02B.4C = completed
SaaS-02B.4D = completed
SaaS-02B.4E = completed
SaaS-02B.4F = completed

SaaS-02B.4 = completed
SaaS-02B = completed

Mandatory Firebase Security Review Gate = REQUIRED
SaaS-02C = next, not started
```

El gate no ha sido ejecutado y SaaS-02C no ha comenzado.

El Mandatory Firebase Security Review Gate audita paths, actores, CRUD, campos,
transiciones, collection groups, backend-only, client candidates y riesgos. El
informe `FIREBASE_SECURITY_REVIEW_GATE.md` aprueba la preparación para el diseño
documental de Firestore Rules:

```text
Mandatory Firebase Security Review Gate = APPROVED
SaaS-02C = next, not started
```

SaaS-02C deberá comenzar por diseño documental de Firestore Rules, no por
implementación directa. Storage continúa deny-all hasta que exista un modelo de
recursos y ownership aprobado.

### Crear

```text
src/config/productConfig.js
src/config/localeConfig.js
src/config/cefrConfig.js
src/config/routeConfig.js
src/config/featureFlags.js
src/domain/organization/tenant.js
src/domain/organization/membership.js
src/domain/organization/tenantSettings.js
src/domain/organization/tenantBranding.js
src/domain/organization/enums.js
src/domain/academic/course.js
src/domain/academic/enrollment.js
src/domain/academic/learningLanguage.js
src/domain/academic/interfaceLanguage.js
src/domain/academic/enums.js
src/domain/identity/identity.js
src/domain/identity/registrationRequest.js
src/domain/identity/registrationPolicy.js
src/domain/identity/accessStatePrecedence.js
src/domain/identity/enums.js
src/domain/authorization/enums.js
src/domain/authorization/capabilities.js
src/domain/authorization/identitySelfCapabilities.js
src/domain/authorization/roleCapabilityMatrix.js
src/domain/authorization/authorizationContext.js
src/domain/workflow/actors.js
src/domain/workflow/registrationApproval.js
src/domain/workflow/registrationRequestWorkflow.js
src/domain/workflow/membershipWorkflow.js
src/domain/workflow/enrollmentWorkflow.js
src/domain/workflow/courseWorkflow.js
src/domain/workflow/tenantWorkflow.js
```

### Modificar

Ningún consumidor funcional.

### Dependencias

Fase 00. Puede avanzar en paralelo con 01A.

### Modelo afectado

- tenant;
- membership;
- roles/capabilities;
- course/enrollment;
- access state;
- invitation;
- audit event;
- códigos lingüísticos.

### Reglas

Especificar pseudoreglas y matriz; no desplegar rules definitivas.

### Pruebas

- normalizadores e invariantes;
- precedencia de estados;
- requisitos por rol;
- `status` canónico;
- `tenant_selection_required`;
- valores inválidos fail-closed.

### Aceptación y gate

- contratos aprobados;
- no hay `institutionId` nuevo ni rol `admin`;
- `student` requiere enrollment; roles administrativos no;
- `isActive` legacy tiene invariante y fecha de retirada.

### Riesgo y rollback

Bajo: módulos puros no conectados. Rollback: retirar artefactos nuevos.

## 02 — Reglas, índices y pruebas de aislamiento

### Objetivo

Implementar reglas definitivas basadas en contratos aprobados.

### Crear/modificar

```text
firestore.rules
firestore.indexes.json
tests/rules/firestore.*
```

Las referencias históricas de esta fase a `storage.rules` y
`tests/rules/storage.*` quedan
`superseded_for_current_no_storage_release`. La versión SaaS actual es
Firestore-only; `storage.rules` permanece deny-all y fuera del gate.

### Dependencias

01A y 01B completas.

### Modelo/reglas

- identidad propia;
- membership por tenant;
- capacidades;
- course/enrollment;
- Storage tenant-aware: `superseded_for_current_no_storage_release`;
- platform role global;
- invitaciones no legibles por clientes;
- auditoría append-only mediante backend.

### Migraciones

Ninguna.

### Pruebas

- tenant A no lee/escribe B;
- cada rol y estado;
- course/enrollment cruzado;
- usuario anónimo;
- platform admin sin acceso tenant implícito;
- Storage: excluido del gate vigente no-Storage;
- campos protegidos;
- consultas previstas e índices.

### Aceptación y gate

Suite de reglas verde en emulador y revisión de seguridad. No conectar UI antes.
Para la versión vigente, esta aceptación se limita a Firestore. Storage requiere
una fase arquitectónica futura independiente y no bloquea 03A.

### Riesgo y rollback

Divergencia con producción. Despliegue sólo tras plan de compatibilidad; rollback
al ruleset baseline versionado.

## 03A — Repositorios tenant-aware

### Objetivo

Añadir persistencia en modo expand sin retirar servicios legacy.

### Crear en una fase de implementación posterior

```text
src/services/saas/identity/identityRepository.js
src/services/saas/tenants/tenantRepository.js
src/services/saas/registrationRequests/registrationRequestRepository.js
src/services/saas/memberships/membershipRepository.js
src/services/saas/courses/courseRepository.js
src/services/saas/enrollments/enrollmentRepository.js
```

### Modificar

- extraer por dominio desde `firestoreService.js`;
- conservar adaptadores legacy con nombre explícito.

### Dependencias

Fase 02 cerrada bajo la política vigente Firestore-only y aprobación humana de
SaaS-02C.2H.

### Modelo/reglas

Paths aprobados y `tenantId` obligatorio.

### Migraciones

Sólo fixtures/staging.

### Pruebas

- repositorios con Emulator;
- tenant obligatorio;
- path/document coinciden;
- errores y timestamps;
- consultas acotadas.

### Aceptación y gate

Ningún repositorio institucional permite consulta global u omitir tenant.
Identity es la única raíz global explícita. 03A no contiene Storage/Media,
AuditLog físico, invitaciones backend, foros, progreso, tests legacy,
presentations ni soporte.

### Riesgo y rollback

Coexistencia temporal de capas. Mitigar con flags y fecha de retiro.

## 03B — Backend privilegiado y bootstrap

### Estado de auditoría contractual (2026-08-05)

`SaaS-03B-A` completed the architecture, authority, security and persistence
audit. It did not create backend code. The next required microphase is
`SaaS-03B-A-R1 — privileged backend, bootstrap, command, audit and environment
contract resolution`, with state `required_not_started`.

Implementation is not ready until R1 freezes the persistent platform authority,
audit and command-record paths, platform and Tenant bootstrap ceremonies,
invitation contract, transaction boundaries, secrets/environments and deployment
topology. The provisional MVP recommendation is Firebase Cloud Functions 2nd
gen on Node for ordinary commands, while initial platform bootstrap remains an
out-of-band one-use Admin SDK ceremony. Neither is implemented or deployed.

R1 subsequently resolved every mandatory foundation blocker. The approved
sequence is now `03B-B0` (pure contract extraction), then `03B-B` (Functions
foundation). Current state is:

```text
SaaS-03B-A-R1 = completed_pending_human_contract_review
SaaS-03B-B0 = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0
Privileged Backend = not_created
```

R1 freezes Firebase Cloud Functions 2nd gen, TypeScript/Node 22, callable human
transport, persistent `platformAuthorities`, global privileged command records,
separate platform/tenant audit roots, out-of-band platform bootstrap and atomic
Tenant/first-admin creation. No implementation or deployment has started.

B0 completed the design-only inventory for pure contracts. Because physical
movement was not authorized, the ordered next microphase is
`SaaS-03B-B0-I — pure contract physical extraction and compatibility adapters`.

```text
SaaS-03B-A-R1 = completed
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0_I
```

B0-I must create a dependency-free local contract package and preserve every
existing Domain/Shared/repository import through compatibility adapters. It may
not start Functions foundation behavior.

B0-I materialized a partial pure tree and safe adapters, then stopped at the
explicit package gate: package/workspace changes and Domain compatibility files
were outside its authority. Current state:

```text
SaaS-03B-B0-I = incomplete_package_topology_blocker
SaaS-03B-B0-I-R1 = required_not_started
SaaS-03B-B = blocked
```

R1 must approve a deployable local package topology and mechanical Domain
reexports before extraction can close.

### Objetivo

Crear operaciones que nunca deben ejecutarse desde el navegador.

### Crear

- backend/Functions equivalente;
- invitación/aceptación/revocación;
- roles y suspensión;
- creación de tenant y primer `tenant_admin`;
- bootstrap out-of-band de `platform_admin`;
- auditoría de plataforma/tenant.

### Modificar

- configuración de despliegue;
- reglas para bloquear mutaciones cliente.

### Dependencias

Fase 02. Puede avanzar en paralelo con 03A, coordinando schemas.

### Bootstrap

Script Admin SDK de un solo uso:

1. lista explícita UID + correo verificado;
2. precondición de cero `platform_admin`;
3. asignación claim + registro restringido;
4. evento auditable;
5. verificación de ambas cuentas;
6. inutilización/retirada del script.

`DEFAULT_ADMINS` mantiene sólo acceso legacy temporal.

### Invitaciones

- token aleatorio de un solo uso y hash persistido;
- HMAC del correo normalizado con secreto servidor;
- email cifrado/restringido sólo si es necesario;
- colección no legible por clientes;
- aceptación backend;
- expiración, revocación y replay protection;
- mensajes neutrales;
- retención y purga de vencidas.

### Pruebas

Bootstrap único, recuperación, no escalada, invitaciones concurrentes,
expiración, revocación, email incorrecto, replay y auditoría.

### Aceptación y gate

Dos `platform_admin` verificados sin memberships automáticas. Operaciones
privilegiadas no son ejecutables directamente por cliente.

### Riesgo y rollback

Pérdida de acceso. Mantener puente legacy detrás de flag hasta verificar
recuperación; no eliminar constante.

## 04 — Providers en shadow mode

### Objetivo

Construir resolución de sesión sin bloquear todavía el flujo legacy.

### Crear

```text
src/context/SessionContext.jsx
src/context/TenantContext.jsx
src/context/CourseContext.jsx
src/hooks/useSession.js
src/hooks/useActiveTenant.js
src/domain/access/resolveAccessState.js
```

### Modificar

- `main.jsx` para providers en shadow mode;
- telemetría segura de divergencias;
- no reemplazar aún `PrivateRoute`/`AdminRoute`.

### Dependencias

03A; integración privilegiada depende de 03B.

### Comportamiento

- resuelve memberships sin enforcement;
- `activeTenantId` vive en sesión/pestaña, preferentemente `sessionStorage`;
- `lastActiveTenantId` es preferencia opcional;
- revalida membership;
- Firebase Auth/token manda sobre `emailVerified`;
- un snapshot Firestore es informativo;
- curso/enrollment se resuelve según rol.

### Migraciones

Ninguna.

### Pruebas

Comparar resolución legacy/nueva, varias pestañas, logout, tenant suspendido,
roles, refresh y caché.

### Aceptación y gate

Shadow mode no cambia rutas ni acceso y produce resultados reconciliables.

### Riesgo y rollback

Lecturas adicionales/loaders. Desactivar provider/flag sin alterar datos.

## 05 — Bootstrap de datos de acceso legacy

### Objetivo

Crear el contexto mínimo que necesitan los usuarios actuales antes del
enforcement.

### Crear/migrar

1. tenant legacy explícitamente aprobado;
2. curso legacy con `learningLanguageCode` y `supportLanguageCode`;
3. memberships mínimas para usuarios legacy;
4. roles mapeados y revisados;
5. enrollments legacy activos para estudiantes;
6. `lastActiveTenantId` opcional;
7. mappings de IDs para migraciones posteriores.

### Dependencias

03A, 03B y 04.

### Reglas

Compatibles con legacy y paths nuevos durante expand.

### Cutover

Ventana de mantenimiento para cambios de perfil/membership si son mutables.

### Pruebas

- todos los usuarios esperados tienen membership;
- estudiantes tienen enrollment;
- teacher/tenant_admin no requieren enrollment;
- admins legacy no obtienen privilegios globales/tenant indebidos;
- conteos y roles reconciliados.

### Aceptación y gate

100 % de usuarios activos resolubles o lista explícita de excepciones aprobada.

### Riesgo y rollback

Mapeo de roles incorrecto. Conservar documentos legacy y desactivar consumers
nuevos.

## 06 — Activación progresiva de guardas

### Objetivo

Sustituir validación legacy por máquina de estados y capacidades.

### Crear

```text
src/components/routes/AccessRoute.jsx
src/pages/WorkspaceSelector.jsx
src/pages/AccessStatusPage.jsx
```

### Modificar

- `App.jsx`;
- `PrivateRoute.jsx`;
- `AdminRoute.jsx`;
- `RootRedirect.jsx`;
- Header/login/logout.

### Dependencias

Fase 05 reconciliada y 03B operativo.

### Estados y acceso por rol

- `student`: membership aprobada + enrollment/curso activos;
- `teacher`: membership aprobada; curso por operación;
- `tenant_admin`: membership aprobada; sin enrollment;
- `platform_admin`: contexto global sin acceso tenant implícito.

`tenant_selection_required`:

- condición: varias memberships aprobadas/activas y ninguna selección válida;
- ruta: `/select-workspace`;
- redirección: desde rutas tenant privadas;
- mensaje: seleccionar espacio de trabajo;
- acciones: seleccionar, logout, consultar estados;
- pruebas: selección, suspensión, back/refresh y pestañas.

### Activación

Feature flag por cohorte, métricas y rollback inmediato.

### Pruebas

Todos los estados, URL directa, cambio tenant, cambio rol, logout, múltiples
memberships y ausencia de enrollment por rol.

### Aceptación y gate

Ningún usuario legacy válido queda bloqueado; tenant A no abre B.

### Riesgo y rollback

Loops/bloqueo. Apagar flag y volver a guardas legacy.

## 07 — i18n shell y Auth

### Objetivo

Localizar interfaz pública y shell sin depender de una sesión autenticada.

### Crear

```text
src/i18n/I18nProvider.jsx
src/i18n/locales/{locale}/
src/hooks/useInterfaceLocale.js
src/components/locale/LocaleSelector.jsx
```

### Modificar

Welcome, Login, Register, VerificationPending, Header, Footer, errores globales,
perfil e `html lang`.

### Dependencias

01B para locale contract. Puede comenzar antes de 04; la sincronización
autenticada depende de Session.

### Resolución

Selección Welcome → temporal pre-registro → perfil → tenant default → plataforma.
Session sincroniza `interfaceLocale` tras autenticar. Nunca modifica idiomas del
curso.

### Migraciones

Fallback `pl-PL`; evitar escritura masiva si el resolver maneja ausencia.

### Pruebas

Anónimo, autenticado, precedencia, persistencia, fallback, fechas/números,
`html lang` y separación de idiomas académicos.

### Aceptación y gate

Welcome/Auth funcionan sin Session y el shell no mezcla locales iniciales.

### Riesgo y rollback

Catálogo incompleto. Fallback al locale de plataforma.

## 08A — Repositorios académicos por dominio

### Objetivo

Crear paths tenant/course sin migrar todavía producción.

### Entregas separadas

1. cursos, niveles y módulos;
2. lecciones conservando estructura íntegra;
3. definiciones de tests;
4. temas y misiones.

### Modificar

`services/courses/*`, `services/test/*`, `services/missions/*`,
`firestoreService.js` y repositorios administrativos por dominio.

### Dependencias

03A, 05 y reglas de 02.

### Pruebas

Dos tenants, mismo idioma, mismo A1, drafts, ownership, estructura de lección y
denegación cruzada.

### Aceptación y gate

Todos los repositorios académicos exigen tenant/curso y tienen mappings legacy.

### Riesgo y rollback

Adapters inconsistentes. No conectar consumidores hasta validación.

## 08B — Migración y cutover de contenido

### Objetivo

Migrar cursos, niveles, módulos, lecciones, tests, temas y misiones por dominio.

### Dependencias

08A y mappings aprobados. Providers existen y reglas están probadas.

### Estrategia por dominio

1. snapshot;
2. bloqueo temporal de escrituras;
3. delta final;
4. reconciliación IDs/referencias/conteos/hashes;
5. reglas + consumers;
6. smoke tests;
7. reapertura.

Dual-read es fallback de lectura, no captura de cambios. Dual-write/CDC queda
como alternativa futura.

### Modificar

Paneles académicos y páginas de curso/tema/misión, dominio por dominio.

### Pruebas

Integridad pedagógica, publicaciones, rutas lazy, referencias, restauración y
aislamiento.

### Aceptación y gate

Reconciliación 100 % o excepciones aprobadas; lectura nueva activa y legacy
intacto.

### Riesgo y rollback

Pérdida/duplicación. Revertir consumidores/rules y reabrir legacy; no borrar
origen.

## 09 — Progreso, tests e inscripciones

### Objetivo

Migrar estado académico a enrollment después de mappings de contenido.

### Modificar

`progressService.js`, `topicProgressService.js`,
`topicMissionAttemptService.js`, Test, Home, Profile y MissionChatPage.

### Dependencias

08B reconciliada y enrollments de 05.

### Migración

Por dominio con mantenimiento:

- progreso de lecciones;
- `userTests`, testHistory y niveles;
- topicProgress;
- mission attempts;
- XP/timestamps/completed flags.

Definir fuente canónica y reconciliar duplicados antes de copiar.

### Pruebas

Nivel por idioma, XP idempotente, reintentos, históricos, múltiples tenants,
enrollment suspendido y concurrencia.

### Aceptación y gate

Conteos, XP, tests e historiales reconciliados; dashboard usa enrollment.

### Riesgo y rollback

Mayor riesgo de regresión. Mantener legacy read-only y revertir consumers.

## 10A — Onboarding de estudiantes

### Objetivo

País → tenant → oferta → locale → identidad → verificación → solicitud →
aprobación → enrollment.

### Dependencias

03B, 06, 07 y 09.

### Modificar

Welcome, Register, Login, rutas y servicios de onboarding.

### Pruebas/aceptación

Políticas de acceso, email existente sin enumeración, estados y tenant aislado.
Ningún rol privilegiado es seleccionable.

### Rollback

Pausar nuevas solicitudes mediante feature flag.

## 10B — Invitaciones y aprobaciones

### Objetivo

Activar teacher/tenant_admin por invitación y cola de estudiantes.

### Dependencias

03B, 06 y 07. Puede avanzar en paralelo con 10A tras contratos compartidos.

### Modificar

Auth UI, acceptance pages y administración de memberships.

### Pruebas/aceptación

Identidad existente/nueva, TTL, revocación, replay, cambio email, concurrencia y
auditoría.

### Rollback

Revocar invitaciones pendientes y desactivar emisión; memberships existentes
permanecen.

## 10C — Panel docente

### Objetivo

Permitir operaciones pedagógicas por capacidad y curso seleccionado.

### Dependencias

08B, 09, 10B y i18n.

### Modificar

Navegación, paneles académicos, revisiones y reportes.

### Pruebas/aceptación

Teacher sin enrollment, cursos asignados, ownership tenant y ausencia de
privilegios administrativos.

### Rollback

Desactivar feature; contenido permanece tenant-owned.

## 10D — Panel tenant_admin

### Objetivo

Gestionar memberships, políticas, cursos y branding del tenant activo.

### Dependencias

10B y repositorios académicos. Puede avanzar en paralelo con 10C.

### Pruebas/aceptación

Sin enrollment, sin acceso a otro tenant, sin `platform_admin`, auditoría y
límites de configuración.

### Rollback

Desactivar panel; backend y datos permanecen.

## 11A — Foro y soporte

### Objetivo

Separar foro institucional/curso de soporte global de plataforma.

### Clasificación

- tenant: foro, reportes institucionales y soporte académico contextual;
- global: contacto comercial, mensajes públicos pre-registro y soporte general
  MiPyMeTIC.

### Dependencias

06, 08B y clasificación de datos.

### Pruebas/cutover

Mantenimiento por dominio, aislamiento, moderación, retención y datos públicos.

### Aceptación

Ningún foro tenant es global; datos de plataforma no se asignan artificialmente
a un tenant.

## 11B — Storage y presentaciones

### Objetivo

Migrar documentos y blobs sin redirects transparentes.

### Estrategia

- conservar blobs legacy;
- persistir `legacyStoragePath`;
- leer ruta nueva y fallback legacy controlado;
- verificar referencias/documentos/blobs;
- eliminar legacy sólo en fase 12 tras aprobación.

### Dependencias

02, 08B y membership estable.

### Pruebas/cutover

Rules Storage, cargas/descargas, referencias rotas, hashes y mantenimiento.

### Aceptación

100 % de referencias resueltas y tenant aislado.

## 11C — Gateway IA, cuotas y observabilidad

### Objetivo

Proteger claves y atribuir consumo por tenant/curso/operación.

### Dependencias

03B, 08B y contrato lingüístico.

### Modificar

`services/ai/*`, consumidores y configuración backend, preservando GeminiAudit.

### Pruebas/aceptación

Cuotas, errores, privacidad, idioma del curso, aislamiento y ausencia de clave
en cliente productivo.

### Rollback

Feature flag/fallback controlado; no mezclar con rollback Storage.

## 12 — Contract, limpieza y retirada legacy

### Objetivo

Retirar compatibilidad sólo después de observación y aprobación.

### Modificar/eliminar

- `organizationId`, statuses legacy y rol `admin/user`;
- `isActive` de membership si se conservó temporalmente;
- `DEFAULT_ADMINS`;
- rutas/consumers legacy;
- métodos equivalentes de `firestoreService.js`;
- blobs legacy aprobados;
- CSS confirmado no cargado;
- documentación y README.

### Dependencias

Todas las reconciliaciones completas. Bootstrap verificado antes de retirar
`DEFAULT_ADMINS`.

### Pruebas

Búsqueda legacy, rules, build, lint, integración, restauración, visual CSS y
auditoría de datos.

### Aceptación y gate

Cero autorización/rutas legacy, cero referencias rotas, documentación igual a
producción.

### Riesgo y rollback

Consumidor oculto. Release anterior y backups; no destruir datos nuevos.

## SaaS-02C — Security Rules

`02C.1` completa el diseño normativo de Firestore Security Rules sin modificar
Firebase: deny-by-default, helpers, presupuesto, 10 paths, 45 Query Contracts,
19 transiciones, dos client writes Identity y backend-only completo.

```text
Mandatory Firebase Security Review Gate = APPROVED
SaaS-02C.1 = completed
SaaS-02C.2 = next, not started
Storage Rules Design Gate = Not ready
```

SaaS-02C.2 no ha comenzado. Storage conserva postura deny-all.

### SaaS-02C.1A / SaaS-02C.1B — Legacy Rules reconciliation

```text
SaaS-02C.1 = completed
SaaS-02C.1A = completed
SaaS-02C.1B = completed

SaaS-02C.2A = next, not started (status at SaaS-02C.1B closure)

Storage architecture = not used in current SaaS target
Storage posture = deny-all
```

SaaS-02C.2 must begin in shadow deny-by-default mode. Legacy Rules must not be
removed until their consumers are migrated. The owner-provided legacy Rules are
a compatibility reference, not the SaaS authorization source.

### SaaS-02C.2A — Composite baseline and SaaS shadow deny-by-default

```text
SaaS-02C.2A = completed
SaaS-02C.2B = completed
SaaS-02C.2C = completed
SaaS-02C.2D = completed
SaaS-02C.2E = completed
SaaS-02C.2E-A = completed
SaaS-02C.2E-B = completed
SaaS-02C.2F = completed
SaaS-02C.2G = completed
SaaS-02C.2G-A = completed
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B1.1 = completed
SaaS-02C.2G-B1.2 = completed
SaaS-02C.2G-B1.2A = completed
SaaS-02C.2G-B1.3 = completed
SaaS-02C.2G-B1.4 = completed
SaaS-02C.2G-B1.5 = completed
SaaS-02C.2G-B1.6 = completed
SaaS-02C.2G-B1.7 = completed
SaaS-02C.2G-B2 = completed
SaaS-02C.2G-B2.1 = completed
SaaS-02C.2G-B2.1A = completed
SaaS-02C.2G-B2.1B = completed
SaaS-02C.2G-B2.2 = completed
SaaS-02C.2G-B2.3 = completed
SaaS-02C.2G-B2.3A = completed
SaaS-02C.2G-B2.3B = not required
SaaS-02C.2G-B2.4 = completed
SaaS-02C.2G-B2.4A = completed
SaaS-02C.2G-B2.4B = completed
SaaS-02C.2G-B2.4C = completed
SaaS-02C.2G-B2.5 = completed
SaaS-02C.2G-B3 = superseded_by_final_B2_scope
SaaS-02C.2G-C = superseded_by_final_B2_scope

SaaS-02C.2E-A resolved FRD-006 and FRD-007; SaaS-02C.2E-B implemented and
closed both findings locally. Mandatory human review of implemented Course and
Enrollment Rules is required before SaaS-02C.2F. No deployment was performed.
```

SaaS-02C.2F confirmed exact legacy semantic preservation, isolation between
legacy and SaaS helpers, safe match overlap, and that no legacy block is ready
for removal. Mandatory human review of legacy/SaaS compatibility is required
before any selective legacy hardening in SaaS-02C.2G.

SaaS-02C.2G-B1 is closed documentally and locally after the human joint review
of B1.6 and the B1.7 baseline comparison. B2.1 reconstructed the current
consumer contracts but found that Welcome accepts a one-character name while
the messages Rule requires at least two characters. B2.1 therefore requires a
separately authorized contract-reconciliation phase and B2.2 is blocked. No
Rule, consumer or test was changed.

SaaS-02C.2G-B2.1A applied the approved minimal consumer correction: Welcome
now validates its trimmed name at 2–100 characters before writing the unchanged
messages payload. Rules and the orphaned public-message service writer remain
unchanged. Mandatory human review of the Welcome component change is required
before SaaS-02C.2G-B2.1B. B2.2 remains blocked pending B2.1 closure.

SaaS-02C.2G will address selective hardening of legacy public and
client-writable blocks without breaking current consumers. No legacy
permission may be changed before human approval of the exact
`SAFE_TO_HARDEN_NOW` proposals documented by SaaS-02C.2G-A.

SaaS-02C.2G-B1.1 implemented only the approved `messages` create hardening.
Mandatory human review of messages create hardening is required before
SaaS-02C.2G-B1.2. No other hardening proposal is authorized by this status.

SaaS-02C.2G-B1.2 implemented only the approved forum post create hardening.
SaaS-02C.2G-B1.2A forensically confirmed that only posts create changed and
that the previously divergent final-response hash was a transcription error.
Mandatory human forensic review of B1.2A is required before SaaS-02C.2G-B1.3.
Replies, reports, support, social counters, updates and deletes remain outside
this authorization.

SaaS-02C.2G-B1.3 implemented only the approved forum reply create hardening.
Mandatory human review of forum reply create hardening is required before
SaaS-02C.2G-B1.4. Reports, support, social counters, updates, deletes and forum
migration remain outside this authorization.

SaaS-02C.2G-B1.4 implemented only the approved `forumReports` create
hardening. Mandatory human review of forumReports create hardening is required
before SaaS-02C.2G-B1.5. Support, administrative permissions, social counters,
updates, deletes and forum migration remain outside this authorization.

At B1.5 closure, SaaS-02C.2G-B1.5 had implemented only the approved
`supportTickets` create hardening, and B1.6 had not started. B1.6 was designated
to jointly revalidate messages, forum posts, forum replies, forumReports and
supportTickets.

SaaS-02C.2G-B1.6 jointly revalidated all five hardenings, consumer payloads,
userTests restoration, legacy/SaaS isolation, matches, helpers, catch-all and
Storage posture. Mandatory human joint review is required before
SaaS-02C.2G-B2. B2 has not started.

SaaS-02C.2G-B2.1B revalidated the Welcome/messages contract, the compatible
orphaned writer, the absence of new messages writers and the other four B1
consumer contracts. B2.1 is completed and B2.2 is ready for test design but
was not started. Mandatory human approval of the B2.1 closure is required
before SaaS-02C.2G-B2.2.

SaaS-02C.2G-B2.2 designed the 201-case executable Firestore Rules suite for
the five B1 hardenings without creating or running test files. Mandatory human
review of the executable test design is required before SaaS-02C.2G-B2.3.
Runtime execution in SaaS-02C.2G-B2.4 requires a separate owner decision
because Java installation and Emulator Suite execution are not authorized.

SaaS-02C.2G-B2.3 statically materialized all 201 unique IDs, but validation
found that the explicit B2.2 expectations total 82 ALLOW / 119 DENY because
RT-SAS contains 7/3 while its summary states 6/4. B2.4 remains blocked. A
separately authorized design correction must reconcile the expected-result
contract; no case expectation was changed silently.

SaaS-02C.2G-B2.3A forensically confirmed Alternative A: the detailed matrix
and static suite consistently contain 201 cases, 82 ALLOW and 119 DENY. The
previous 81/120 aggregate was an arithmetic documentation error. No test file
or expectation changed; B2.3B is not required and B2.4 remains blocked pending
a separate owner runtime decision.

SaaS-02C.2G-B2.4A determined that demo-only Firestore runtime validation is
feasible on an isolated hosted runner without local Java, Firebase login,
credentials, secrets, real-project access or deployment. The current command
also discovers the separate Storage baseline; B2.4B must create a
Firestore-only canonical execution boundary before creating the workflow.
Human approval is required before creating a GitHub Actions workflow. The
future workflow must use only the demo Firebase project, must not use secrets,
must not log in to Firebase and must not deploy any resource.

SaaS-02C.2G-B2.4B statically implemented the manual GitHub Actions workflow,
the exact seven-file Firestore-only package command and a zero-credential
security preflight. The workflow must not be executed until the owner has
reviewed the YAML, package scripts and CI preflight. Codex must not commit,
push or trigger the workflow. The owner will decide when to commit, push and
manually execute `workflow_dispatch`.

SaaS-02C.2G-B2.4C-A audited the workflow, package boundary, preflight,
canonical tests and complete worktree. Technical controls passed, but ignored
local files `.env.local` and `firebase-debug.log` trigger the explicit
sensitive-file gate. Their contents were not inspected. The phase is
`incomplete_requires_sensitive_file_owner_review`; B2.4C-B is blocked and
B2.5 is not started. Codex did not commit, push or execute the workflow.

SaaS-02C.2G-B2.4C-A1 reconciled the two local artifacts through metadata only.
They are ignored, untracked, unstaged, absent from diffs and unused by CI; no
sensitive filename is Git-visible. Their contents were not inspected.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = in_progress
SaaS-02C.2G-B2.4A = completed
SaaS-02C.2G-B2.4B = completed
SaaS-02C.2G-B2.4C-A = completed
SaaS-02C.2G-B2.4C-A1 = completed_pending_human_precommit_closure
SaaS-02C.2G-B2.4C-B = blocked_pending_manual_commit_push_and_workflow
SaaS-02C.2G-B2.5 = not started
```

Local ignored files do not form part of the commit. Codex must not inspect
their contents, stage them, delete them, commit, push or execute the workflow.
The owner must approve the final commit procedure.

SaaS-02C.2G-B2.4C-B1 created only the explicitly authorized local thematic
commits. Codex did not push any branch and did not execute the workflow.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = in_progress
SaaS-02C.2G-B2.4C-A = completed
SaaS-02C.2G-B2.4C-A1 = completed
SaaS-02C.2G-B2.4C-B1 = completed_pending_human_push
SaaS-02C.2G-B2.4C-B2 = blocked_pending_manual_push_and_workflow
SaaS-02C.2G-B2.5 = not started
```

The owner must review the commits, push the selected branch manually and
trigger `workflow_dispatch`.

SaaS-02C.2G-B2.4C-B2 received an owner statement that push and manual dispatch
occurred, but no completed workflow evidence. Codex only audited the supplied
placeholders and did not repeat or query the run.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_runtime_evidence_missing
SaaS-02C.2G-B2.4C-B1 = completed
SaaS-02C.2G-B2.4C-B2 = incomplete_requires_runtime_evidence
SaaS-02C.2G-B2.5 = blocked
```

No Firebase deployment was performed. B2.5 must not start until complete,
non-sensitive runtime evidence is supplied and reviewed.

SaaS-02C.2G-B2.4C-B2F1 classified the first runtime as
`TEST_HARNESS_CONFIGURATION_FAILURE`: Firestore started, but the shared test
environment also requested Storage, causing 201 setup failures before Rule
assertions. The helper now configures only Firestore; Storage remains deny-all
and unstarted.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_corrected_runtime_execution
SaaS-02C.2G-B2.4C-B2 = incomplete_test_harness_failure
SaaS-02C.2G-B2.4C-B2F1 = completed_pending_human_fix_review
SaaS-02C.2G-B2.5 = blocked
```

No corrected GitHub Actions execution was started. Human fix review is
required before any new runtime attempt.

SaaS-02C.2G-B2.4C-B2F2 committed the approved Firestore-only harness
correction locally as `ada8931` and recorded the failed-run evidence and
traceability. Codex did not push or execute GitHub Actions.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_corrected_runtime_execution
SaaS-02C.2G-B2.4C-B2 = incomplete_pending_corrected_runtime
SaaS-02C.2G-B2.4C-B2F1 = completed
SaaS-02C.2G-B2.4C-B2F2 = completed_pending_human_push
SaaS-02C.2G-B2.5 = blocked
```

The owner must review and push the corrective commits, then manually trigger
the Firestore Rules Runtime Validation workflow on `main`.

SaaS-02C.2G-B2.4C-B2F4 corrects the sole non-Rule failure from the second
runtime: RT-SEC-003 used an invalid three-segment document path. The second
run passed 200 cases; the remaining assertion did not execute. No Rule or
expectation changed.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_final_corrected_runtime
SaaS-02C.2G-B2.4C-B2 = incomplete_single_test_fixture_failure
SaaS-02C.2G-B2.4C-B2F3 = incomplete_200_passed_1_fixture_failed
SaaS-02C.2G-B2.4C-B2F4 = completed_pending_human_fix_review
SaaS-02C.2G-B2.5 = blocked
```

Human review and one final owner-triggered runtime execution are required.
B2.5 was not started.

SaaS-02C.2G-B2.4C-B2F5 records the isolated local correction commit
`3c34e9e7960108bf6f9275e009a202b56171e095`. Codex did not push or execute
GitHub Actions.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_final_corrected_runtime
SaaS-02C.2G-B2.4C-B2 = incomplete_pending_final_runtime
SaaS-02C.2G-B2.4C-B2F3 = incomplete_200_passed_1_fixture_failed
SaaS-02C.2G-B2.4C-B2F4 = completed
SaaS-02C.2G-B2.4C-B2F5 = completed_pending_human_push
SaaS-02C.2G-B2.5 = blocked
```

The owner must push the new HEAD and start a new manual workflow instance on
`main`; do not rerun the failed job on the earlier commit. B2.5 remains
blocked.

The local composite baseline preserves the owner-provided legacy compatibility
semantics and reserves all ten canonical SaaS paths with complete client deny.
SaaS-02C.2 is not complete. No deployment was performed.

## SaaS-02C.2G final closure

The owner confirmed that the official manually triggered Firestore Rules
Runtime Validation workflow succeeded on the latest `main` HEAD. Firestore
Emulator runtime passed the canonical 201 Test IDs: 82 expected ALLOW and 119
expected DENY. No deployment or later change occurred.

```text
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B2 = completed
SaaS-02C.2G-B2.1 = completed
SaaS-02C.2G-B2.2 = completed
SaaS-02C.2G-B2.3 = completed
SaaS-02C.2G-B2.4 = completed
SaaS-02C.2G-B2.5 = completed
SaaS-02C.2G = completed
```

The final reconciliation, deferred FLH backlog and residual risks are recorded
in `FIRESTORE_RULES_PROJECT_FINAL_CLOSURE.md`. Domain 1.2.0 and the architecture
freeze remain intact; Storage remains deny-all.

## SaaS-02C.2H no-Storage gate reconciliation

The owner approved the current release as Firestore-only. Historical generic
Phase 02 Storage requirements are
`superseded_for_current_no_storage_release`; Storage is not a prerequisite for
03A. Binary uploads, Media roots, Storage repositories, paths, Rules and
emulator execution remain excluded, and `storage.rules` remains deny-all.

```text
CURRENT_SAAS_STORAGE_POLICY = NO_STORAGE
SaaS-02C.2G = completed
SaaS-02C.2H = completed
SaaS-02C.2H-C1 = completed_pending_human_push
Phase 02 current no-storage scope = completed
03A — Repositorios tenant-aware = ready_not_started
04 — Providers en shadow mode = blocked_by_03A
06 — Activación progresiva de guardas = blocked_by_previous_phases
```

The exact 03A scope is documented in
`SAAS_03A_TENANT_AWARE_REPOSITORIES_SCOPE.md`. No repository or functional code
was created and 03A was not started.

The first implementation step is deliberately split by responsibility:

```text
SaaS-03A = in_progress
SaaS-03A.1A — Shared SaaS Firestore repository infrastructure = completed
SaaS-03A.1A-C1 — Human review and controlled commits = completed_pending_human_push
SaaS-03A.1B — IdentityRepository = ready_not_started
```

`SaaS-03A.1A` may create only shared Firestore dependency, path/ID guard,
timestamp serialization and repository error primitives with their scoped
tests. It does not create a concrete repository. `SaaS-03A.1B` subsequently
implements only `IdentityRepository`. Neither microphase is started here.

SaaS-03A.1A subsequently implemented only pure shared infrastructure under
`src/services/saas/shared/`: validated opaque IDs, ten canonical path strings,
exact tenant consistency, ISO timestamp conversion, snapshot allowlisting,
normalized repository errors and explicit Firestore dependency injection. Its
51 unit tests require no Emulator and no global Firebase instance. See
`SAAS_03A_1A_SHARED_REPOSITORY_INFRASTRUCTURE.md`.

The C1 review strengthened compound sensitive-key filtering without changing
the public contract or test count. SaaS-03A.1B is ready but remains unstarted.

SaaS-03A.1B subsequently implemented only `IdentityRepository` for the global
`identities/{uid}` root. Its exact serializer, dependency-injected read and two
Rule-approved field-scoped update operations are documented in
`SAAS_03A_1B_IDENTITY_REPOSITORY.md`. No UI, legacy service, Rule, index,
Storage resource or remote Firebase resource was changed.

```text
SaaS-03A = in_progress
SaaS-03A.1B = completed
SaaS-03A.1B-C1 = completed_pending_human_push
SaaS-03A.2 — TenantRepository = ready_not_started
```

SaaS-03A.2 was identified but not started.

SaaS-03A.2A subsequently implemented only the client-safe Tenant shell point
read at `tenants/{tenantId}`. The repository exposes no lists, writes,
privileged operations or configuration access. Its strict physical serializer
and 31 pure unit tests are documented in
`SAAS_03A_2A_TENANT_SHELL_REPOSITORY.md`.

```text
SaaS-03A = in_progress
SaaS-03A.2 = in_progress
SaaS-03A.2A = completed
SaaS-03A.2A-C1 = completed_pending_human_push
SaaS-03A.2B = deferred_pending_rules_and_access_policy
SaaS-03A.3 — RegistrationRequestRepository = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 — RegistrationRequest query, pagination, cursor and index contract resolution = completed
SaaS-03A.3A-R1-C1 = completed_pending_human_push
SaaS-03A.3A-R2 — RegistrationRequestRepository shadow implementation = ready_not_started
SaaS-03A.3I — RegistrationRequest index materialization = pending_after_R2
SaaS-03A.3R — RegistrationRequest Firestore Emulator validation = pending_after_index_materialization
```

Settings and Branding remain deferred because current client Rules deny their
fixed documents. SaaS-03A.3 was identified but not started.

SaaS-03A.3A-R2 subsequently implemented the three approved client-safe
RegistrationRequest reads in expand/shadow mode. Exact lifecycle serialization,
UID-bound queries, deterministic pagination and cursor v1 are backed by 59 pure
unit tests.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R2 = completed_pending_human_code_review
SaaS-03A.3I = blocked_pending_R2_review
SaaS-03A.3R = blocked_by_indexes
```

SaaS-03A.3I locally materialized FI-RRQ-001/002 and FI-CG-003/004 without
deploying them. Human index review and a controlled commit must complete before
the Firestore-only runtime phase.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3I = completed_pending_human_index_review
SaaS-03A.3R = blocked_pending_3I_review_and_commit
```

The 03A.3I-C1 review confirmed the local index file against installed Firebase
tooling and created isolated technical/documentary commits.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3I = completed
SaaS-03A.3I-C1 = completed_pending_human_push
SaaS-03A.3R = ready_not_started
```

The repository remains shadow-only. Human review, local index materialization
and Firestore-only Emulator validation must precede functional integration.

The R2-C1 review completed with two scoped fail-closed corrections and expanded
unit coverage. Index materialization is now the next ready, unstarted phase.

```text
SaaS-03A.3A-R2 = completed
SaaS-03A.3A-R2-C1 = completed_pending_human_push
SaaS-03A.3I = ready_not_started
SaaS-03A.3R = blocked_by_indexes
```

### SaaS-03A.3R-A — RegistrationRequest runtime suite

The Firestore-only integration suite is implemented with 52 isolated cases and
the fixed demo project. It remains unexecuted until human review; the canonical
201 Rules IDs remain a separate runtime suite and count.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed_pending_human_test_review
SaaS-03A.3R-B = blocked_pending_3R_A_review
```

Next: `SaaS-03A.3R-A-C1 — RegistrationRequest runtime suite review and
controlled commits`. 03A.3R-B remains blocked and no MembershipRepository work
starts here.

The controlled C1 review completed the static audit and isolated commits. The
next phase may integrate and execute the runtime suite, but is not started here.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed
SaaS-03A.3R-A-C1 = completed_pending_human_push
SaaS-03A.3R-B = ready_not_started
```

### SaaS-03A.3R-B1 — RegistrationRequest runtime CI integration

The existing manual workflow now contains a deterministic RegistrationRequest
precheck and a second, independent Firestore-only runtime session after the
unchanged canonical Rules runtime. No workflow run occurred in B1.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_manual_push_and_workflow
```

Next owner actions are push and a new manual `workflow_dispatch` on `main`.
MembershipRepository remains unstarted.

### SaaS-03A.3R-B1-FIX1 corrective closure

FIX1 resolved the nine failures from the first RegistrationRequest repository
runtime without changing Rules, indexes, Domain, Storage, or repository scope.
The corrected local gate passes all 52 cases. Hosted CI evidence is still
required before B2 can close the runtime sequence.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_corrected_runtime_evidence
```

Do not start MembershipRepository before the corrected hosted runtime is
reviewed.

### SaaS-03A.3R-B2 corrected runtime closure

The owner confirmed a new corrected `main` workflow succeeded with Rules
`201 / 201` and RegistrationRequest `52 / 52`. All nine former failures pass.
No Rule, index, Storage, repository, test, workflow, package, or Domain file
changed in B2.

```text
SaaS-03A = in_progress
SaaS-03A.3 = completed
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R2 = completed
SaaS-03A.3I = completed
SaaS-03A.3R = completed
SaaS-03A.3R-A = completed
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
RegistrationRequestRepository = completed_in_shadow_mode
SaaS-03A.4 = ready_not_started
```

Next: SaaS-03A.4 — MembershipRepository. It is not started here.

### SaaS-03A.4A — MembershipRepository contract and query audit

The audit confirms the canonical Membership root, 12-field physical projection,
three statuses, three tenant roles, owner history reads, client-denied keys and
writes, and collection-group self Rules. It also identifies blockers that make
repository implementation premature: tenant-self and history query shapes are
not closed, Standard pagination has no Membership numeric policy, no
Membership-specific cursor exists, index variants/materialization are pending,
and current Rules deny the documented tenant-admin read contracts.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_pending_contract_resolution
SaaS-03A.4A-R1 = required_not_started
SaaS-03A.4B = blocked
MembershipRepository = not_created
```

Next: `SaaS-03A.4A-R1 — Membership query, pagination, cursor, admin-policy and
index contract resolution`. Do not create MembershipRepository before that
contract review is complete.

### SaaS-03A.4A-R1 — Membership query, pagination, cursor and index resolution

R1 freezes the three client-self APIs and explicitly excludes all admin,
platform, key, lifecycle, and write operations. Both list scopes support the
four omitted/single-status/single-role/status-plus-role combinations, order by
`createdAt DESC` and document ID DESC, use page sizes 1/20/50 with lookahead,
and share a query-bound Membership Standard v1 cursor. Four COLLECTION and four
COLLECTION_GROUP indexes are specified for later 03A.4I materialization.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed_pending_human_contract_review
SaaS-03A.4B = ready_not_started
MembershipRepository = not_created
```

Next: R1 human contract review. Do not implement 03A.4B before that review.

### SaaS-03A.4B — MembershipRepository implementation

After R1 approval, the client-self repository is implemented in shadow mode
with the three frozen APIs, strict serializer, closed options, deterministic
pagination, and portable Membership v1 cursor. Admin, platform, key, write,
lifecycle, consumer, migration, and deployment surfaces remain absent. Eight
Membership indexes are still pending later local materialization.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
MembershipRepository = implemented_shadow
SaaS-03A.4B-C1 = completed_pending_human_push
SaaS-03A.4I = ready_not_started
```

C1 confirms the contract and corrects one fail-closed tenant result-path check;
23 focused unit tests pass. Next: `SaaS-03A.4I — Membership index
materialization`. It remains unstarted and no index JSON changes here.

### SaaS-03A.4I — Membership index materialization

Eight R1 indexes are materialized in local configuration: FI-MEM-005–008 and
FI-CG-001/002/006/007. The four RegistrationRequest indexes remain unchanged,
`fieldOverrides` remains empty, and no deployment or runtime execution occurs.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
MembershipRepository = implemented_shadow
```

Next: 03A.4R-A Membership repository runtime test suite. It is ready but not
started here; no workflow change or runtime execution occurs in C1.

### SaaS-03A.4R-A — Membership repository runtime test suite

The Firestore-only suite is prepared with 81 statically reconciled cases: 44
ALLOW and 37 DENY, classified as 44 SUCCESS, 26 RULES_DENY, 11 CONTRACT_ERROR,
and 0 NOT_FOUND. It uses the demo project, real modular SDK and repository,
isolated fixtures, and all eight Membership query shapes. No Emulator or CI
change occurs in this phase.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
MembershipRepository = implemented_shadow
```

Next: `SaaS-03A.4R-B1 — Membership runtime CI integration`; it remains
unstarted.

## SaaS-03A.4R-B1 CI integration result

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed
SaaS-03A.4R-B = in_progress
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-C1 = completed_pending_human_push
SaaS-03A.4R-B2 = blocked_pending_manual_push_and_workflow
MembershipRepository = implemented_shadow
```

Next: `SaaS-03A.4R-B2 — Membership runtime execution and closure`. It was not
started; owner push and a new manual workflow execution are required first.

## SaaS-03A.4R-B1-FIX1

The first Membership runtime reported 65/81 passed and 16 fixture-contamination
failures. FIX1 assigns the incompatible serializer fixture to a dedicated UID
and updates only RT-MEM-REP-012 to read it as self. Counts remain 81/44/37 and
44/26/11/0. Static correction and controlled review are complete; corrected
runtime remains pending GitHub Actions because Java is unavailable locally.
`SaaS-03A.4R-B1-FIX1 = completed`,
`SaaS-03A.4R-B1-FIX1-C1 = completed_pending_human_push`, and
`SaaS-03A.4R-B2 = blocked_pending_corrected_runtime_evidence`.

## SaaS-03A.4 final runtime closure

The owner published FIX1 and confirmed a new successful manual workflow on
corrected `main`: Rules 201/201, RegistrationRequest 52/52, and Membership
81/81. All sixteen historical fixture-contamination IDs pass. Membership is
complete in shadow mode; indexes remain undeployed and no functional consumer
or migration is activated.

```text
SaaS-03A = in_progress
SaaS-03A.4 = completed
SaaS-03A.4R = completed
SaaS-03A.4R-B = completed
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-FIX1 = completed
SaaS-03A.4R-B1-FIX1-C1 = completed
SaaS-03A.4R-B2 = completed
MembershipRepository = completed_in_shadow_mode
SaaS-03A.5A = ready_not_started
```

Next: `SaaS-03A.5A — CourseRepository contract and query audit`. It will audit
the physical model, Rules-compatible client reads, query/pagination/cursor
contracts, and conceptual indexes before implementation. It is not started.

## SaaS-03A.5A CourseRepository audit result

The audit confirms the tenant Course path, exact physical shape, lifecycle,
current role/status read policy, FQ-CRS-001..007 and conceptual
FI-CRS-001..005. It also confirms no Course collection-group, client write,
consumer, migration or legacy replacement. The generic query model does not
freeze Course numeric page sizes, a Course-specific cursor envelope, or the
minimum final list API/index variants, so implementation remains blocked.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_pending_contract_resolution
SaaS-03A.5A-R1 = required_not_started
SaaS-03A.5B = blocked
CourseRepository = not_created
```

Next: `SaaS-03A.5A-R1 — Course query, pagination, cursor and index contract
resolution`. No implementation, index materialization or runtime work starts.

## SaaS-03A.5A-R1 Course contract resolution

The resolution defines the minimal read-only API, distinct actor query shapes,
closed options, deterministic 1/20/50 pagination, Course cursor v1, exact nested
serialization and the five later Course indexes. No Rule, index JSON, code,
consumer or legacy service changes in R1.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed_pending_human_contract_review
SaaS-03A.5B = ready_not_started
CourseRepository = not_created
```

Next: human review of R1 followed by `SaaS-03A.5B — CourseRepository
implementation`. 5B is not started here.

## SaaS-03A.5B CourseRepository implementation

CourseRepository is implemented in shadow mode with the exact R1 point/list
surface, deep serializer, actor-shaped query contracts, closed pagination and
Course cursor v1. Forty-two focused tests cover positive and negative contracts.
No index, Rule, consumer, legacy service, migration or remote resource changes.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed_pending_human_code_review
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = next_not_started
```

Next: `SaaS-03A.5B-C1 — CourseRepository implementation review and controlled
commits`. It is not started here.

## SaaS-03A.5B-C1 CourseRepository review and controlled commits

The implementation and its focused coverage were reconciled with 5A/R1 and
current Rules. Course remains consumer-free shadow code; no index was
materialized and no runtime phase was started.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
SaaS-03A.5B-C1 = completed_pending_human_push
CourseRepository = implemented_shadow
SaaS-03A.5I = ready_not_started
```

Next: `SaaS-03A.5I — Course index materialization`. It remains not started.

## SaaS-03A.5I Course index materialization

The five contracted Course COLLECTION indexes are materialized locally without
deploy or Emulator validation. CourseRepository remains shadow-only.

```text
SaaS-03A.5I = completed_pending_human_index_review
SaaS-03A.5I-C1 = next_not_started
SaaS-03A.5R-A = blocked_pending_5I_review_and_commit
```

Next: `SaaS-03A.5I-C1 — Course index review and controlled commits`. It is not
started.

## Current R3-C checkpoint

`SaaS-03B-B0-I-R3-C = completed_pending_human_review_and_push` and
`SaaS-03B-B0-I-R3-D = ready_not_started`. Privileged backend remains blocked.

## SaaS-03B-B0-I-R3-D-R1 scope reconciliation

R3-D-R1 resolves the broad R3-A workflow classification. Future R3-D may
migrate only the five existing pure symbols `ACCESS_STATE_CONTEXT`,
`ACCESS_STATE_PRECEDENCE`, `NULL_ACCESS_STATE_CASES`,
`MEMBERSHIP_STATUS_TRANSITIONS`, and `ENROLLMENT_STATUS_TRANSITIONS`.
`TENANT_WORKFLOW`, `REGISTRATION_REQUEST_WORKFLOW`, `MEMBERSHIP_WORKFLOW`,
`COURSE_WORKFLOW`, and `ENROLLMENT_WORKFLOW` remain Domain-owned and are parity
consumers, not R3-D migration targets. No replacement symbols were invented.

```text
SaaS-03B-B0-I-R3-D-R1 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-D = blocked_pending_R1_push
SaaS-03B-B0-I-R3-E = blocked
SaaS-03B-B = blocked_pending_B0_I_R3_R4
```

## SaaS-03B-B0-I-R3-D lifecycle and transition migration

After publication of R3-D-R1, R3-D moved exactly the five existing pure
contracts `ACCESS_STATE_CONTEXT`, `ACCESS_STATE_PRECEDENCE`,
`NULL_ACCESS_STATE_CASES`, `MEMBERSHIP_STATUS_TRANSITIONS` and
`ENROLLMENT_STATUS_TRANSITIONS` to physical package authority. Domain remains
normative and provides reference-identical compatibility reexports. The five
complete workflow descriptors remain Domain-owned; no lifecycle API was
invented. Package `0.4.0`, its vendored Functions artifact, all parity gates and
all project regressions pass.

```text
SaaS-03B-B0-I-R3-D-R1 = completed
SaaS-03B-B0-I-R3-D = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-E = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = lifecycle_transition_contracts_migrated
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R3-E — Capabilities and
Authorization Matrices`. It is not started.

## SaaS-03B-B0-I-R3-E capability authorization migration

R3-E migrated the published 37 capability IDs and descriptors, six explicit
self assignments, and the unchanged Membership/platform role matrix to package
physical authority. Domain remains normative and exposes reference-identical
compatibility reexports. The historical R3-A count of 35 was reconciled to the
two capability contracts already added before R3-E. No permission, evaluator,
workflow or Rules behavior changed. Package `0.5.0`, isolated Functions import,
artifact reproducibility and all regressions pass.

```text
SaaS-03B-B0-I-R3-E = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-F = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = capability_authorization_contracts_migrated
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R3-F — CEFR and Language
Contracts`. It is not started.

## SaaS-03B-B0-I-R3-F CEFR and language reconciliation

R3-F selected `RESULT_A`: the exact frozen A1–C2 `CEFR_LEVELS` contract moved
to package physical authority, while the JSDoc-only `LearningLanguage` and
`InterfaceLanguage` shapes remain Domain-owned pending R3-H. Canonical BCP 47
validation was already package-owned and was not duplicated. Legacy CEFR
arrays/sets were audited but not functionally migrated. Package `0.6.0`, its
vendored artifact and all regressions pass.

```text
SaaS-03B-B0-I-R3-F = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-G = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = cefr_contract_migrated_languages_reconciled
Privileged Backend = not_created
```

Next after human review and push: `SaaS-03B-B0-I-R3-G — Errors / Results
Reconciliation`. It is not started.

## SaaS-03B-B0-I-R3-B foundational enum/status migration

Seven foundational contracts now have package physical authority at version
`0.2.0`; Domain paths reexport identical frozen objects. Values, Rules parity,
Functions isolation and artifact reproducibility pass.

```text
SaaS-03B-B0-I-R3-B = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = foundational_statuses_migrated
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R3-C — Roles and authority contracts`. Not started.

## SaaS-03A.5R-B2 Course runtime closure

Definitive fresh workflow evidence is SUCCESS: Rules 222/222,
RegistrationRequest 52/52, Membership 81/81 and Course 114/114; Course metadata
self-control passes and failed IDs are NONE. SaaS-03A.5 and 03A.5R are
completed. CourseRepository is `completed_in_shadow_mode`.

The next ordered phase is `SaaS-03A.6A - EnrollmentRepository contract and
query audit`, `ready_not_started`. It is not started.

SaaS-03A.6A subsequently completed the EnrollmentRepository contract and query
audit. The canonical root is tenant-owned and read-only for the future client
repository. Query shapes must prove embedded `tenantId`; self lists must also
prove the referenced own `membershipId`. Teacher cohort access, writes,
uniqueness and cross-Tenant aggregation remain deferred/backend-only. The
bounded query, pagination, cursor and tenant-aware index blockers are assigned
to `SaaS-03A.6A-R1`, `required_ready_not_started`. `SaaS-03A.6B` is blocked and
EnrollmentRepository remains `not_created`.

## SaaS-03A.5I-C1 Course index review and controlled commits

The five Course index definitions were accepted without technical correction;
the twelve preceding indexes remain structurally identical.

```text
SaaS-03A.5I = completed
SaaS-03A.5I-C1 = completed_pending_human_push
CourseRepository = implemented_shadow
SaaS-03A.5R-A = ready_not_started
```

Next: `SaaS-03A.5R-A — Course repository runtime test suite`. It is not started.

## SaaS-03A.5R-A Course repository runtime test suite

The 114-ID Firestore-only suite is reviewed but has not been executed.

```text
SaaS-03A.5R = in_progress
SaaS-03A.5R-A = completed
SaaS-03A.5R-A-C1 = completed_pending_human_push
SaaS-03A.5R-B1 = ready_not_started
```

Next: `SaaS-03A.5R-B1 — Course runtime CI integration`. It is ready but not
started.

## SaaS-03A.5R-B1 Course runtime CI integration

The workflow now prepares an independent 114-case Course gate after Rules,
RegistrationRequest and Membership. It has not been executed.

```text
SaaS-03A.5R-B = in_progress
SaaS-03A.5R-B1 = completed
SaaS-03A.5R-B1-C1 = completed_pending_human_push
SaaS-03A.5R-B2 = blocked_pending_manual_push_and_workflow
CourseRepository = implemented_shadow
```

Next: human push and new manual workflow execution; B2 is not started.

`SaaS-03A.5R-B1-FIX3` corrects the sole post-FIX2 failure,
`RT-CRS-REP-063`, without changing runtime counts, Rules, indexes or query
shapes. It is `completed_pending_external_runtime`; `SaaS-03A.5R-B2` remains
`blocked_pending_corrected_runtime_evidence` and is not started.

## SaaS-03A.6A-R1 Enrollment contract resolution

R1 freezes a read-only EnrollmentRepository contract with neutral point get,
explicit own-Membership list and distinct tenant-admin list. Canonical queries
bind tenant and status; self also binds Membership. Pagination, two cursor
families and tenant-aware FI-ENR-002/FI-ENR-005 are closed. Teacher cohorts,
global aggregation, uniqueness and writes remain excluded.

```text
SaaS-03A.6A = incomplete_superseded_by_resolution
SaaS-03A.6A-R1 = completed_pending_human_contract_review
SaaS-03A.6B = ready_not_started
EnrollmentRepository = not_created
```

SaaS-03A.6B has not started.

## SaaS-03A.6B EnrollmentRepository implementation

EnrollmentRepository is implemented read-only in shadow mode. The exact
nine-field physical serializer, point get, own-Membership and tenant-admin list
families, pagination and cursors have 46 passing unit tests. No Rules, indexes,
consumers, migration, runtime or deployment is included.

```text
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed_pending_human_code_review
EnrollmentRepository = implemented_shadow
SaaS-03A.6B-C1 = next_not_started
```

SaaS-03A.6B-C1 has not started.

## SaaS-03A.6B-C1 Enrollment implementation review

The controlled review accepted the read-only EnrollmentRepository and its 46
tests without technical correction. Technical and documentary changes are kept
in separate commits.

```text
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed_pending_human_push
EnrollmentRepository = implemented_shadow
SaaS-03A.6R-A = ready_not_started
```

SaaS-03A.6R-A has not started. Its earlier readiness is superseded by the
required local index materialization and controlled review sequence.

## SaaS-03A.6I Enrollment index materialization

FI-ENR-002 and FI-ENR-005 are materialized locally with the exact R1 field
orders. The other 17 indexes and `fieldOverrides` remain unchanged. Emulator
validation and production deployment are not performed.

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed_pending_human_push
SaaS-03A.6I = completed_pending_human_index_review
SaaS-03A.6I-C1 = next_not_started
SaaS-03A.6R-A = blocked_pending_6I_review_and_commit
EnrollmentRepository = implemented_shadow
```

The next microphase is `SaaS-03A.6I-C1 — Enrollment index review and
controlled commits` (`next_not_started`). It is not initiated.

## SaaS-03A.6I-C1 Enrollment index review

The final review accepts both Enrollment index signatures without technical
correction and preserves all previous indexes.

```text
SaaS-03A.6I = completed
SaaS-03A.6I-C1 = completed_pending_human_push
EnrollmentRepository = implemented_shadow
SaaS-03A.6R-A = ready_not_started
```

The next phase is `SaaS-03A.6R-A — Enrollment repository runtime test suite`.
It is ready but not initiated.

## SaaS-03A.6R-A Enrollment runtime suite

The Firestore-only runtime suite is statically prepared with 111 classified
Enrollment IDs and one metadata self-control. It is not executed.

```text
SaaS-03A.6R = in_progress
SaaS-03A.6R-A = completed_pending_human_test_review
SaaS-03A.6R-A-C1 = next_not_started
SaaS-03A.6R-B = blocked_pending_6R_A_review
EnrollmentRepository = implemented_shadow
```

The next phase is `SaaS-03A.6R-A-C1 — Enrollment runtime suite review and
controlled commits`. It is not initiated.

## SaaS-03A.6R-A-C1 Enrollment runtime suite review

The review accepts 111 final Test IDs after correcting only test-suite gaps.

```text
SaaS-03A.6R-A = completed
SaaS-03A.6R-A-C1 = completed_pending_human_push
SaaS-03A.6R-B1 = ready_not_started
EnrollmentRepository = implemented_shadow
```

The next phase is `SaaS-03A.6R-B1 — Enrollment runtime CI integration`; it is
not initiated.

## SaaS-03A.6R-B1 Enrollment runtime CI integration

The manual workflow now validates the Enrollment runtime registry statically
and, after the four preserved gates, runs its explicit test file in a fifth
independent Firestore-only Emulator lifecycle. Metadata remains 111/41/70 and
41/42/28/0. This integration was not executed locally or remotely.

```text
SaaS-03A.6R-B1 = completed
SaaS-03A.6R-B1-C1 = completed_pending_human_push
SaaS-03A.6R-B2 = blocked_pending_manual_push_and_workflow
EnrollmentRepository = implemented_shadow
```

The next action is owner push followed by a new manual workflow run on `main`;
B2 is not initiated.

## SaaS-03A.6R-F1 Enrollment runtime failure correction

The first external Enrollment gate failed four expectation assertions. F1
corrects only the runtime registry and its expected metadata: 111 IDs,
42 ALLOW, 69 DENY and outcomes 42/41/28/0. Local Firestore-only execution passes
all 112 Node tests including metadata. Repository, Rules and indexes are intact.
F1 awaits owner push and a new external workflow; B2 remains blocked.

`SaaS-03A.5R-B1-FIX4` resolves the third runtime's sole failure by changing
`RT-CRS-REP-120` from a duplicate canonical cross-Tenant mutation into a real
noncanonical path guarantee. FIX2 and FIX3 are completed; FIX4 is
`completed_pending_external_runtime`. B2 and EnrollmentRepository are not
started.

## SaaS-03A.6R-B2 definitive Enrollment closure

The owner published F1 and a completely new workflow run succeeded: Rules
222/222, RegistrationRequest 52/52, Membership 81/81, Course 114/114 and
Enrollment 111/111 plus metadata. SaaS-03A.6 and its runtime track are complete;
EnrollmentRepository remains completed in shadow mode.

```text
SaaS-03A = in_progress
SaaS-03A.6 = completed
SaaS-03A.6R = completed
SaaS-03A.6R-B1 = completed
SaaS-03A.6R-F1 = completed
SaaS-03A.6R-B2 = completed
EnrollmentRepository = completed_in_shadow_mode
SaaS-03B = ready_not_started
```

The next ordered phase is `SaaS-03B — Backend privilegiado y bootstrap`. It
creates server-only privileged operations, invitation lifecycle, Tenant and
first-admin bootstrap, out-of-band platform-admin bootstrap and audit. Phase 02
is its documented dependency; coordination with the completed 03A schemas is
required. It is not initiated.

## SaaS-03B-B0-I-R1 package topology resolution

R1 selecciona un package npm workspace privado para frontend/tests y un artifact
`npm pack` versionado dentro del futuro `functions/` deploy source. Domain 1.2.0
permanece normativo; su implementación portable se mueve al package en R3 con
compatibility reexports. El bloqueo queda resuelto contractualmente, no
implementado.

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-A = completed
SaaS-03B-A-R1 = completed
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I = incomplete_superseded_by_resolution
SaaS-03B-B0-I-R1 = completed_pending_human_architecture_review
SaaS-03B-B0-I-R2 = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R2_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = partial_uncommitted
PACKAGE_TOPOLOGY_BLOCKER = resolved
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R2 — package topology implementation`, no iniciada.

## SaaS-03B-B0-I-R2 package topology implementation

R2 implementa `@mipymetic/saas-contracts@0.1.0`, workspace/export maps, dos
lockfiles, artifact Functions contenido y ocho compatibility package imports.
Domain permanece intacto. Todas las validaciones pasan.

```text
SaaS-03B-B0-I-R2 = completed
SaaS-03B-B0-I-R2-C1 = next_not_started
SaaS-03B-B0-I-R3 = blocked_pending_R2_C1
SaaS-03B-B = blocked_pending_B0_I_R2_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = topology_implemented_pending_domain_migration
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R2-C1 — package topology review and controlled commits`.
No iniciada.

## SaaS-03B-B0-I-R2-C1 package topology closure

La revisión independiente confirmó commits aislados, package/exports,
workspace/lockfiles, instalaciones limpias, Functions aislado, artifact
reproducible, adapters y regresiones.

```text
SaaS-03B-B0-I-R2-C1 = completed_pending_human_push
SaaS-03B-B0-I-R3 = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = topology_verified_pending_domain_migration
PACKAGE_TOPOLOGY_BLOCKER = resolved
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R3 — Domain authority migration`. No iniciada.

## SaaS-03B-B0-I-R3-A Domain authority inventory

The read-only inventory identified 40 Domain contracts and approved an
incremental B–H/C1 plan. Twenty-seven executable contracts require package
authority plus Domain reexports; thirteen structural/cross-aggregate contracts
remain temporary Domain authority.

```text
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-A = completed_pending_human_plan_review
SaaS-03B-B0-I-R3-B = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = domain_inventory_completed
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R3-B — Foundational enums and status contracts`. Not
started.
