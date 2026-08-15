# SaaS-03B-D-R7-R3 - UpdateTenantBranding Backend Implementation

## 1. Scope

R7-R3 materializes the trusted-backend implementation of UpdateTenantBranding
after the normative mutation/concurrency contract was closed in R7-R1 and the
portable shared contract was materialized in R7-R2.

R7-R3 is the final technical member of Family A defined by R4:

1. UpdateTenantProfile
2. UpdateTenantSettings
3. UpdateTenantBranding

R7-R3 does not implement Tenant lifecycle operations.

## 2. Implemented backend surface

The executable Functions surfaces added by R7-R3 are:

- functions/src/authorization/updateTenantBrandingAuthority.ts
- functions/src/commands/updateTenantBranding.ts
- functions/src/persistence/updateTenantBrandingTransactionStore.ts

The dedicated tests are:

- functions/src/__tests__/updateTenantBrandingAuthority.test.ts
- functions/src/__tests__/updateTenantBranding.test.ts
- functions/src/__tests__/updateTenantBrandingTransactionStore.test.ts

## 3. Authority

UpdateTenantBranding requires:

- verified authenticated Identity;
- coherent persisted Identity;
- active Tenant;
- canonical MembershipKey lookup from the authenticated UID;
- coherent approved Membership;
- same-Tenant tenant_admin;
- TENANT_MANAGE_BRANDING capability;
- package-valid AuthorityResolution.

Authority is revalidated before authoritative writes.

## 4. Mutation and concurrency

UpdateTenantBranding performs complete replacement of caller-owned Branding
fields while preserving server-owned persistence semantics.

The persisted Branding contract is versioned.

The caller provides expectedVersion.

The authoritative transaction requires persisted.version to equal
expectedVersion before mutation.

A successful write increments the version exactly once.

A stale expectedVersion fails with conflict semantics.

A replay never increments the version again.

## 5. Idempotency

The behavioral payload consists of:

- tenantId;
- expectedVersion;
- branding.

Envelope identifiers are excluded from the behavioral hash.

Replay is accepted only when command type, payload hash, correlationId,
authority binding and stable result binding are coherent.

A valid replay is read-only.

## 6. Stable result contract

The canonical result is:

- operation = UpdateTenantBranding;
- resourceType = tenantBranding;
- resourceId = tenantId;
- status = succeeded;
- replayed = boolean.

The backend result remains aligned with the portable
@mipymetic/saas-contracts contract.

## 7. Audit

The UpdateTenantBranding audit is privileged and non-raw.

The exact audit maps are:

Before summary:
- brandingVersion.

After summary:
- brandingVersion.

Metadata:
- stage;
- previousVersion;
- nextVersion.

Raw Branding values are not emitted into audit summaries or metadata.

## 8. Validation evidence

The R7-R3 semantic closure established:

- UpdateTenantBranding authority tests: 10/10 PASS;
- UpdateTenantBranding transaction-store tests: 9/9 PASS;
- UpdateTenantBranding command tests: 6/6 PASS;
- UpdateTenantSettings regression control: PASS;
- complete Functions suite: 169/169 PASS;
- portable UpdateTenantBranding contract: 13/13 PASS;
- complete shared package regression: 96/96 PASS;
- shared package TypeScript check: PASS;
- git diff --check: PASS;
- strict UTF-8/LF validation: PASS.

## 9. Protected boundaries

R7-R3 does not modify:

- firestore.rules;
- firestore.indexes.json;
- storage.rules;
- firebase.json;
- .firebaserc;
- src/firebase.js;
- packages/saas-contracts.

No public UpdateTenantBranding handler is created.

No Firebase deployment is performed.

## 10. Update family closure

The ordered update/configuration family is now technically implemented:

- UpdateTenantProfile = backend_sequence_closed;
- UpdateTenantSettings = backend_sequence_closed;
- UpdateTenantBranding = backend_sequence_closed.

Therefore the R4 prerequisite requiring completion of the update family before
Tenant lifecycle implementation is technically satisfied.

## 11. Lifecycle boundary

R7-R3 does not implement:

- SuspendTenant;
- RestoreTenant;
- ArchiveTenant.

The canonical Domain lifecycle already contains the relevant transition and
capability authority, but executable lifecycle command contracts must not be
invented from that evidence alone.

After publication of R7, the minimum next checkpoint for SuspendTenant must be
derived from the published genealogy and the existing normative Domain and
persistence authority.

RestoreTenant and ArchiveTenant remain blocked behind the SuspendTenant
sequence unless a later authoritative reconciliation explicitly changes that
ordering.

## 12. Git evidence

Technical implementation commit:

b8850381f288e2d72d63782d6109d62035dae451

Commit subject:

feat(saas): implement update tenant branding backend

The technical commit contains exactly six R7-R3 files.

At documentary materialization time:

- local main = b8850381f288e2d72d63782d6109d62035dae451;
- origin/main = c4c7e51365bfb763b8554594a94aff8ae6d475db;
- local main is exactly one commit ahead;
- no push is performed by this step.

## 13. Closure state

SaaS-03B-D-R7 = completed

SaaS-03B-D-R7-R1 = completed

SaaS-03B-D-R7-R2 = completed

SaaS-03B-D-R7-R3 = completed_pending_documentary_commit_and_push

UpdateTenantProfile = backend_sequence_closed

UpdateTenantSettings = backend_sequence_closed

UpdateTenantBranding = backend_sequence_closed

R7 update/configuration family = completed

SuspendTenant = ready_for_contract_resolution_after_R7_publication

RestoreTenant = blocked_pending_SuspendTenant_sequence

ArchiveTenant = blocked_pending_SuspendTenant_sequence

SaaS-03B-D = in_progress_ordered_deferred_workflows

SaaS-03B-E = blocked_pending_03B_D

SaaS-03B-F = blocked_pending_previous_sequence

Phase 4 = not_started

No identifier for the next SuspendTenant checkpoint is assigned by R7-R3.

The identifier must be derived after documentary close and publication.