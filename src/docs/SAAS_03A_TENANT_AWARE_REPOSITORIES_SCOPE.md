# 03A — Tenant-aware repositories scope

## Status and purpose

```text
03A = READY_NOT_STARTED
Mode = expand + shadow
Implementation = NOT STARTED
```

03A will add tenant-aware Firestore repositories without replacing legacy
services, changing screens, migrating data or enabling enforcement.

## Canonical location

The proposed location is `src/services/saas/<domain>/`.

The repository already groups infrastructure-facing application services under
`src/services/<domain>/`, while `src/domain/` contains pure frozen contracts.
The `saas` namespace keeps new repositories visibly separate from legacy
`firestoreService.js`, existing course/test services and future UI consumers.
It avoids introducing a new top-level architectural convention and supports
removal of the namespace only after a later contract phase. No directory is
created in this design phase.

## Repository order

1. `IdentityRepository`
2. `TenantRepository`
3. `RegistrationRequestRepository`
4. `MembershipRepository`
5. `CourseRepository`
6. `EnrollmentRepository`

This follows the six Persistence Roots and dependency graph: Identity and
Tenant are independent roots; Request and Membership reference both; Course
depends on Tenant; Enrollment depends on Tenant, Membership and Course.

## Repository boundaries

| Repository | Root and canonical paths | Client-safe operations in 03A | Backend-only/deferred operations | Query Contracts |
| --- | --- | --- | --- | --- |
| IdentityRepository | `identities/{uid}` | get own Identity; update approved self profile fields | create, platform reads/updates, anonymization | FQ-IDN-001; IDN-001–003 |
| TenantRepository | `tenants/{tenantId}` plus fixed settings/branding documents | get authorized Tenant and approved configuration projections | create, lifecycle, settings/branding mutations, platform lists | FQ-TEN-001–004; TEN-001–003/008 |
| RegistrationRequestRepository | tenant Request and approved lookup paths | self get/list reads allowed by current Rules | create/cancel/approve/reject/expire and lookup mutations | FQ-RRQ contracts; RRQ access patterns |
| MembershipRepository | `tenants/{tenantId}/memberships/{membershipId}` and read-only lookup/collection-group flows | own point/list reads and authorized tenant reads | approval, role/status transitions, key writes/repair | FQ-MEM-001–007; MEM-001–005/010–011 |
| CourseRepository | `tenants/{tenantId}/courses/{courseId}` | authorized point/list/catalog reads | create/update/activate/archive and CAS writes | FQ-CRS-001–007; CRS-001–007/012–013 |
| EnrollmentRepository | `tenants/{tenantId}/enrollments/{enrollmentId}` | authorized self/tenant point and bounded list reads | create and administrative transitions; self mutation only when a later Rule/contract explicitly enables it | FQ-ENR-001–008; ENR-001–007/012–013 |

03A repository methods must not expose a client write merely because a domain
operation exists. Current Firestore Rules and the write-authority matrix are
the boundary: cross-root, lifecycle, lookup, role/status and audit-bearing
commands remain backend-only and are not implemented as browser writes.

## Common contracts

- `tenantId` is mandatory for every institutional repository call and must
  match path and serialized document fields; Identity is the explicit global
  exception.
- Repository APIs accept canonical IDs, never infer an active tenant from UI
  globals and never offer unscoped institutional collection scans.
- Firestore timestamps are converted through explicit serializers; writes use
  server timestamps only where the approved client contract permits them.
- Serializers validate known shapes, preserve `null` semantics, reject unknown
  fields and keep domain objects independent from SDK snapshots.
- Errors use a small stable taxonomy: invalid argument, unauthenticated,
  forbidden, not found, conflict/precondition, unavailable and data-contract
  violation; raw Firebase details are retained only as non-sensitive causes.
- Every query implements its approved filters, ordering, cursor and limit from
  the corresponding Query Contract. No repository silently broadens a query.

## Test strategy

Each repository will require unit tests for serialization, path construction,
tenantId mismatch and error mapping, plus Firestore Emulator integration tests
for its client-safe operations, cross-tenant denial, query constraints,
timestamps and pagination. Backend-only methods must be absent or fail closed;
03A does not mock them as successful client operations.

## Expand/shadow coexistence

- new SaaS repositories coexist with all legacy services;
- no automatic dual-write;
- no replacement or deletion of `firestoreService.js`;
- no component, page, hook, Context or route consumes the repositories yet;
- no data migration, cutover, remote access or deployment;
- no legacy collection or compatibility Rule is removed;
- later shadow integration compares outcomes before any enforcement.

## Exclusions

There is no Storage/Media repository, physical AuditLog repository, forum,
progress, legacy tests, presentations or support repository in 03A. Invitation
and audit repositories from the older generic roadmap are superseded for this
scope: RegistrationRequest is the frozen root, while authoritative audit and
invitation/approval commands belong to privileged backend phase 03B.

03A also excludes React Providers, Context API, hooks, guards, routes, pages,
UI, migration, cutover, legacy deletion, Cloud Functions, backend commands,
Rules/index changes and deployment. Phase 04 integrates Providers after 03A;
Phase 06 first changes access components and pages after its prior gates.

## Entry gate

All prerequisites are satisfied: Domain 1.2.0, persistence, topology, query and
write contracts, security review, Rules design/implementation, runtime 201/201,
no-Storage decision and legacy compatibility. Human approval of SaaS-02C.2H is
complete. 03A is ready but not started.

## First implementation microphases

To keep one responsibility per change, the first repository step is split:

```text
SaaS-03A = in_progress
SaaS-03A.1A = completed
SaaS-03A.1A-C1 = completed_pending_human_push
SaaS-03A.1B = ready_not_started
```

### SaaS-03A.1A — Shared SaaS Firestore repository infrastructure

Purpose: establish only the common client-safe repository foundations needed
by later tenant-aware repositories. Expected new files live under
`src/services/saas/shared/` and cover explicit Firebase dependency injection,
canonical path/ID guards, Firestore timestamp conversion, snapshot
serialization primitives and stable repository error mapping. Unit tests cover
path construction, tenantId mismatch, timestamp conversion, unknown-field
rejection and error mapping; narrowly scoped Emulator tests may verify that the
shared harness targets Firestore only. It creates no domain repository and
performs no remote operation.

It excludes `IdentityRepository`, all other repositories, business queries,
backend commands, React integration, migration, dual-write, Rules/index
changes, Storage and deployment.

### SaaS-03A.1B — IdentityRepository

Purpose: implement only the global Identity root on top of the approved shared
infrastructure: self read plus the Rule-approved self-profile update contract,
with serializer, error and unit/Emulator coverage. It remains separate because
Identity is the first concrete repository and the explicit non-tenant root.

At design time, neither microphase was started by this document.

## SaaS-03A.1A implementation result

The shared, pure Firestore repository infrastructure is implemented under
`src/services/saas/shared/` and documented in
`SAAS_03A_1A_SHARED_REPOSITORY_INFRASTRUCTURE.md`. It provides validated IDs,
the ten canonical path strings, tenant consistency, ISO timestamp conversion,
snapshot allowlisting, normalized errors and explicit dependency injection.
It performs no Firestore operation and implements no functional repository.

The C1 code review passed after strengthening sensitive-key sanitization. The
51-test contract and all architectural boundaries remain intact. SaaS-03A.1B
is ready but was not started.
