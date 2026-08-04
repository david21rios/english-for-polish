# 03A — Tenant-aware repositories scope

> Course runtime: 03A.5R-B1 completed with runtime failure; B1-FIX1 is
> incomplete pending separate Rules and query/index contract authorization;
> B2 is blocked. CourseRepository remains `implemented_shadow`.

> FIX2 is implemented but `incomplete_pending_runtime_validation`; FIX1 is
> superseded and B2 remains blocked.

> C1 accepted FIX2: `completed_pending_external_runtime`; FIX2-C1 is
> `completed_pending_human_push`; B2 remains blocked pending corrected evidence.

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

## SaaS-03A.1B implementation result

`IdentityRepository` is implemented under `src/services/saas/identity/` with
an exact eight-field serializer and the three client-safe operations approved
for `identities/{uid}`: self read, profile-field update and interface-locale
update. Dependencies are injected, update patches are field-scoped, timestamps
use `serverTimestamp()`, and no global Firebase instance or legacy consumer is
connected.

The 48 pure unit tests require no Emulator. Runtime authorization coverage is
deferred to the approved post-implementation revalidation microphase.

```text
SaaS-03A = in_progress
SaaS-03A.1B = completed
SaaS-03A.1B-C1 = completed_pending_human_push
SaaS-03A.2 — TenantRepository = ready_not_started
```

## SaaS-03A.2A implementation result

The client-safe Tenant shell repository is implemented under
`src/services/saas/tenant/`. Its only public operation is the injected point
read `getTenant(tenantId)`. The strict twelve-field physical serializer covers
the canonical ten required Tenant fields plus conditional nullable
`suspendedAt` and `archivedAt` lifecycle timestamps. Thirty-one pure unit tests
require no Emulator.

Settings and Branding remain unimplemented because current client Rules deny
both fixed configuration documents.

```text
SaaS-03A = in_progress
SaaS-03A.2 = in_progress
SaaS-03A.2A = completed
SaaS-03A.2A-C1 = completed_pending_human_push
SaaS-03A.2B = deferred_pending_rules_and_access_policy
SaaS-03A.3 — RegistrationRequestRepository = in_progress
```

## SaaS-03A.3A-R1 contract resolution

The first 03A.3A attempt stopped before code because RegistrationRequest page
sizes, cursor binding/encoding and index readiness were not operationally
defined. R1 now resolves those contracts for FQ-RRQ-001/002/003: self-only
filters, deterministic requestedAt/documentId order, 1/20/50 page policy,
limit-plus-one results, a validated unsigned base64url cursor v1 and four
required pending composite indexes.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R1-C1 = completed_pending_human_push
SaaS-03A.3A-R2 = ready_not_started
SaaS-03A.3I = pending_after_R2
SaaS-03A.3R = pending_after_index_materialization
```

R2 may implement only in expand/shadow mode. Index materialization and
Firestore-only Emulator validation must precede any Provider or UI consumer.

## SaaS-03A.3A-R2 implementation result

The client-safe RegistrationRequest repository is implemented in shadow mode
under `src/services/saas/registrationRequest/`. It exposes only self point read,
Tenant-scoped self list and cross-Tenant self collection-group list. Strict
serialization, closed options, limit-plus-one pagination and portable cursor
v1 follow R1. After FIX1, its 59 pure tests require no Emulator or
Firebase global.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A-R2 = completed_pending_human_code_review
SaaS-03A.3I = blocked_pending_R2_review
SaaS-03A.3R = blocked_by_indexes
```

SaaS-03A.3I subsequently materialized the four approved RegistrationRequest
composite definitions locally. No repository consumer, Rule or remote resource
was changed.

```text
SaaS-03A.3I = completed_pending_human_index_review
SaaS-03A.3R = blocked_pending_3I_review_and_commit
```

The controlled 03A.3I-C1 review confirmed the four definitions without
correction. SaaS-03A.3I is completed and 03A.3R is ready but not started.

No Provider/UI consumer or write is connected. Index materialization and
Firestore-only runtime validation remain mandatory before integration.

C1 completed the human review and isolated local commits. The review tightened
whitespace-only cursor rejection and path/requestId consistency without
changing R1 or the public API.

```text
SaaS-03A.3A-R2 = completed
SaaS-03A.3A-R2-C1 = completed_pending_human_push
SaaS-03A.3I = ready_not_started
SaaS-03A.3R = blocked_by_indexes
```

## SaaS-03A.3R-A runtime suite result

A separate integration suite now defines 52 Firestore-only cases for the real
RegistrationRequest repository, modular SDK, Rules, local query shapes,
pagination, cursors, and denials. It is not a UI integration and was not run in
this phase.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed_pending_human_test_review
SaaS-03A.3R-B = blocked_pending_3R_A_review
```

Human static review is complete. The suite remains unexecuted and disconnected
from consumers; 03A.3R-B is `ready_not_started`.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_manual_push_and_workflow
```

## SaaS-03A.3R-B1-FIX1 runtime correction

The first hosted repository runtime exposed nine failures. FIX1 corrected the
test expectation for Rules existence masking, one authenticated UID mismatch,
the Web SDK `documentId()` field-value cursor projection, and the direct test
SDK map. Local runtime now passes `52 / 52`; Rules, indexes, Domain, public API,
and repository scope remain unchanged.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_corrected_runtime_evidence
```

MembershipRepository remains unstarted.

## SaaS-03A.3 corrected runtime closure

The corrected hosted workflow passed Rules `201 / 201` and
RegistrationRequest `52 / 52`. RegistrationRequestRepository is complete in
shadow mode with no consumer, Provider, legacy replacement, migration,
dual-write, or deployment.

```text
SaaS-03A = in_progress
SaaS-03A.3 = completed
SaaS-03A.3R = completed
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
RegistrationRequestRepository = completed_in_shadow_mode
SaaS-03A.4 = ready_not_started
```

SaaS-03A.4 — MembershipRepository is the next phase and remains unstarted.

## SaaS-03A.4A Membership contract and query audit

The physical 12-field Membership projection, canonical roles/statuses,
ownership, client self point read, and collection-group self Rules boundary are
audited. Implementation cannot start because Membership-specific query options,
tenant-scoped self shape, numeric pagination, cursor binding, role/status index
variants, and tenant-admin client policy are not closed. Current Rules permit
self history reads but deny tenant-admin foreign reads and all client writes.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_pending_contract_resolution
SaaS-03A.4A-R1 = required_not_started
SaaS-03A.4B = blocked
MembershipRepository = not_created
```

Next: `SaaS-03A.4A-R1 — Membership query, pagination, cursor, admin-policy and
index contract resolution`. It is not started here.

## SaaS-03A.4A-R1 Membership contract resolution

The client-self boundary is now frozen: owner point get, self tenant history
list, and self collection-group list. Status and role each allow zero or one
exact canonical equality, including their four combinations. Both list scopes
use `createdAt DESC`, document-ID DESC, page sizes 1/20/50, limit-plus-one, and
the Membership Standard v1 cursor. Eight self indexes are defined for later
materialization. Tenant-admin, platform, key, write, and lifecycle operations
remain excluded.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed_pending_human_contract_review
SaaS-03A.4B = ready_not_started
MembershipRepository = not_created
```

Next: human contract review of R1, followed by 03A.4B implementation. Neither
is started here.

## SaaS-03A.4B MembershipRepository implementation

The approved client-self MembershipRepository is implemented in shadow mode.
It exposes only owner point get, tenant-scoped self list, and collection-group
self list. Strict twelve-field serialization, all four status/role filter
combinations, 1/20/50 limit-plus-one pagination, and Membership cursor v1 are
implemented without Firebase globals, writes, keys, admin APIs, consumers, or
legacy replacement. The eight approved indexes remain pending 03A.4I.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
MembershipRepository = implemented_shadow
SaaS-03A.4B-C1 = completed_pending_human_push
SaaS-03A.4I = ready_not_started
```

C1 corrected explicit tenant-list result-path consistency and expanded focused
coverage to 23 passing tests. The repository remains shadow-only; no consumer,
write, key access, migration, Rule, or index materialization was added. Next is
03A.4I Membership index materialization, which is not started here.

## SaaS-03A.4I Membership index materialization

The four tenant-scoped and four collection-group Membership self-query indexes
are now materialized locally. Existing RegistrationRequest indexes and
`fieldOverrides` remain intact; no admin/key index, deploy, Emulator run, or
repository change occurred.

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

C1 found no technical index defect. Runtime 03A.4R-A is ready but is not
started here; MembershipRepository remains shadow-only and indexes undeployed.

## SaaS-03A.4R-A Membership runtime suite

An isolated 81-case Firestore-only suite is prepared under
`tests/integration/saas/membership/`. It covers the real repository, all eight
self-query shapes, pagination, cursor binding, serializer/lifecycle contracts,
ownership isolation, denied writes, membershipKeys, and unsafe queries. It has
not yet been executed with the Emulator and adds no consumer or write surface.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
MembershipRepository = implemented_shadow
```

## Membership runtime CI status

The manual workflow now keeps three independent contracts: Rules 201/82/119,
RegistrationRequest 52/34/18, and Membership 81/44/37. Membership outcomes are
44 SUCCESS, 26 RULES_DENY, 11 CONTRACT_ERROR and 0 NOT_FOUND. B1 is completed,
B1-C1 awaits human push, and B2 remains blocked pending a new manual workflow
run. MembershipRepository remains in shadow mode.

FIX1 isolates the deliberately incompatible Membership fixture from canonical
self listings without changing MembershipRepository or its client-safe scope.
Corrected runtime evidence remains required; B2 is blocked and not started.
FIX1 is completed, C1 is `completed_pending_human_push`, and
MembershipRepository remains `implemented_shadow`.

## MembershipRepository final shadow closure

The corrected manual workflow passed Rules 201/201, RegistrationRequest 52/52,
and Membership 81/81. SaaS-03A.4 and 03A.4R are completed;
`MembershipRepository = completed_in_shadow_mode`. No consumer, Provider, UI,
migration, dual-write, legacy replacement, remote validation, or deployment was
introduced. The next ordered repository is CourseRepository.

```text
SaaS-03A = in_progress
SaaS-03A.4 = completed
SaaS-03A.4R = completed
SaaS-03A.4R-B2 = completed
SaaS-03A.5A = ready_not_started
```

## SaaS-03A.5A CourseRepository contract and query audit

The Course path, twelve-field physical shape, draft/active/archived lifecycle,
role/status Rules matrix, FQ-CRS-001..007, FI-CRS-001..005 and legacy
coexistence are audited. Course has no approved collection-group read and every
client write remains backend-only. Exact list APIs/options, numeric pagination,
the Course cursor envelope and the final implemented index variants require a
separate resolution contract; no Course code exists.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_pending_contract_resolution
SaaS-03A.5A-R1 = required_not_started
SaaS-03A.5B = blocked
CourseRepository = not_created
```

Next: `SaaS-03A.5A-R1 — Course query, pagination, cursor and index contract
resolution`. It is not started here.

## SaaS-03A.5A-R1 Course contract resolution

R1 freezes the point read and three separate tenant list APIs for active,
teacher and tenant-admin shapes. It closes status/language options, 1/20/50
pagination, Course cursor v1, deep nested serialization and FI-CRS-001..005.
Rules remain authoritative; collection-group and every write stay excluded.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed_pending_human_contract_review
SaaS-03A.5B = ready_not_started
CourseRepository = not_created
```

Next is human contract review and then 5B. Neither is started here.

## SaaS-03A.5B CourseRepository shadow implementation

The R1 read-only repository now exists with point get, active catalog, teacher
catalog and tenant-admin list methods; strict nested serialization, closed
options, deterministic pagination and Course cursor v1. It has no consumer,
write, collection-group, index materialization, migration or legacy adapter.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed_pending_human_code_review
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = next_not_started
```

C1 technical review is next and is not started here.

## SaaS-03A.5B-C1 CourseRepository implementation review

The complete code and test review confirms the minimal read-only factory,
twelve-field deep serializer, actor-specific tenant queries, pagination and
Course cursor v1. Focused coverage is 47/47 (21 positive, 26 negative). Rules,
indexes, previous repositories, legacy services and consumers remain intact.

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

Next: `SaaS-03A.5I — Course index materialization`. It is not started here.

## SaaS-03A.5I Course index materialization

FI-CRS-001..005 are locally present with COLLECTION scope; the prior twelve
RegistrationRequest/Membership indexes remain intact. No deploy, Emulator,
consumer or repository change occurred.

```text
SaaS-03A.5I = completed_pending_human_index_review
SaaS-03A.5I-C1 = next_not_started
SaaS-03A.5R-A = blocked_pending_5I_review_and_commit
CourseRepository = implemented_shadow
```

## SaaS-03A.5I-C1 Course index review

The five Course indexes passed structural and contract review without technical
correction. No deploy or Emulator occurred.

```text
SaaS-03A.5I = completed
SaaS-03A.5I-C1 = completed_pending_human_push
SaaS-03A.5R-A = ready_not_started
CourseRepository = implemented_shadow
```

## SaaS-03A.5R-A Course runtime suite preparation

The Firestore-only suite is reviewed with 114 IDs and isolated tenant,
Membership and Course fixtures. Runtime was not executed.

```text
SaaS-03A.5R = in_progress
SaaS-03A.5R-A = completed
SaaS-03A.5R-A-C1 = completed_pending_human_push
SaaS-03A.5R-B1 = ready_not_started
CourseRepository = implemented_shadow
```

## SaaS-03A.5R-B1 Course runtime CI integration

The unchanged 114-case suite now has a static precheck and fourth manual
Firestore-only gate. Runtime was not executed.

```text
SaaS-03A.5R-A-C1 = completed
SaaS-03A.5R-B = in_progress
SaaS-03A.5R-B1 = completed
SaaS-03A.5R-B1-C1 = completed_pending_human_push
SaaS-03A.5R-B2 = blocked_pending_manual_push_and_workflow
CourseRepository = implemented_shadow
```
