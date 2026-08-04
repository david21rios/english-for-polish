# SaaS-03A.6A-R1 — Enrollment query, pagination, cursor and index contract

## Purpose and authorities

This document freezes the executable read contract required before implementing
`EnrollmentRepository`. It reconciles the 03A.6A audit, Domain 1.2.0,
Architecture Freeze, physical/persistence models, access patterns, current
Rules, query/index contracts and the established Membership/Course patterns.
No code, test, Rule or index is created here.

Rules are not filters. Every list must prove embedded `tenantId` and canonical
`status`; self authorization must also prove the referenced `membershipId`.
Teacher cohort, collection-group and every client write remain denied.

## Physical model and lifecycle

`ENROLLMENT_PHYSICAL_MODEL_CONTRACT = RESOLVED`.

Path: `tenants/{tenantId}/enrollments/{enrollmentId}`.

| Field | Type | Required | Nullable | Immutable | Authority |
| --- | --- | ---: | ---: | ---: | --- |
| enrollmentId | non-empty string | yes | no | yes | backend |
| tenantId | non-empty string | yes | no | yes | backend |
| membershipId | non-empty string | yes | no | yes | backend |
| courseId | non-empty string | yes | no | yes | backend |
| status | canonical enum | yes | no | lifecycle | backend |
| enrolledAt | timestamp | yes | no | yes | backend |
| updatedAt | timestamp | yes | no | lifecycle | backend |
| completedAt | timestamp/null | yes | yes | lifecycle | backend |
| cancelledAt | timestamp/null | yes | yes | lifecycle | backend |

The seven-field Domain object is the academic core; the physical projection
authoritatively adds both terminal timestamps. All nine fields are physically
required. Unknown/missing fields, SDK objects and incoherent IDs fail closed.
Timestamps serialize to canonical UTC ISO-8601 strings. Serializer context
always includes expected Tenant and Enrollment IDs and additionally expected
Membership ID for self-list results.

| State | completedAt | cancelledAt | Transition |
| --- | --- | --- | --- |
| pending | null | null | active/cancelled |
| active | null | null | completed/cancelled |
| completed | timestamp | null | terminal |
| cancelled | null | timestamp | terminal |

Invalid timestamp combinations are contract violations. Membership suspended or
removed retains self historical ownership. Tenant suspended permits self history
but not admin reads; Tenant archived denies client reads. Course archival neither
rewrites nor hides existing Enrollment history. All writes remain backend-only.

## Ownership and API

```text
OWNER = Tenant
BOUNDARY = tenantId
SELF = Enrollment.membershipId -> same-Tenant Membership.uid
COURSE = Enrollment.courseId -> same-Tenant Course
```

The repository performs no Membership/Course lookup, join or N+1 authorization
check. It accepts no UID or role. Rules remain authoritative.

Final API:

```text
createEnrollmentRepository(dependencies)
getEnrollment(tenantId, enrollmentId)
listOwnEnrollmentsForMembership(tenantId, membershipId, options?)
listTenantEnrollmentsForAdmin(tenantId, options?)
```

Point get is actor-neutral because Rules decide access. It accepts no options,
status, Membership or access mode and performs exactly one document read.
Separate list methods prevent caller-selected authorization.

## Executable list shapes

Normative constraint order: tenantId, actor-specific equality, status, primary
order, document-ID order, startAfter, limit.

Self without requested status:

```text
collection(tenants/{tenantId}/enrollments)
where(tenantId == tenantId)
where(membershipId == membershipId)
where(status in [pending, active, completed, cancelled])
orderBy(enrolledAt, desc)
orderBy(documentId(), desc)
[startAfter(Date(enrolledAt), enrollmentId)]
limit(pageSize + 1)
```

Admin without requested status:

```text
collection(tenants/{tenantId}/enrollments)
where(tenantId == tenantId)
where(status in [pending, active, completed, cancelled])
orderBy(updatedAt, desc)
orderBy(documentId(), desc)
[startAfter(Date(updatedAt), enrollmentId)]
limit(pageSize + 1)
```

When status is requested, each fixed `in` becomes equality to one canonical
status. Consumers cannot provide an array. The all-status predicate is required
so Rules can prove canonical status; collection path alone does not prove the
embedded Tenant.

## Query Contract disposition

| ID | Classification | Decision for 03A.6B |
| --- | --- | --- |
| FQ-ENR-001 | CLIENT_SELF / CLIENT_TENANT_ADMIN | include as neutral point get |
| FQ-ENR-002 | CLIENT_SELF | include through self Membership method |
| FQ-ENR-003 | DEFERRED / BACKEND_ONLY | exclude; teacher cohort is Rules-blocked |
| FQ-ENR-004 | CLIENT_TENANT_ADMIN | include through admin method |
| FQ-ENR-005 | BACKEND_ONLY | exclude; lookup is not uniqueness |
| FQ-ENR-006 | CLIENT_SELF | same executable family as FQ-ENR-002 |
| FQ-ENR-007 | DEFERRED | exclude ambiguous owner/course variants |
| FQ-ENR-008 | SYSTEM_ONLY | exclude cross-root create validation |

No tenant-admin Membership/Course filter is exposed now. Teacher, platform
bypass and Enrollment collection-group stay denied.

## Options and pagination

Both list methods accept the closed shape `{ status?, pageSize?, cursor? }`.
Options may be absent/undefined. Null, arrays, non-plain objects, explicit
undefined, unknown keys, multiple statuses and noncanonical values are invalid.
Prohibited keys include tenantId, membershipId, courseId, UID, role, accessMode,
where, constraints, order, direction, offset and collectionGroup.

```text
MIN_PAGE_SIZE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
```

Invalid page size produces `INVALID_ARGUMENT`; no clamp occurs. Queries use
limit-plus-one. Lookahead is excluded from items and cursor. Empty/terminal pages
have null cursor and `hasMore=false`.

```text
Object.freeze({ items: Object.freeze([...]), nextCursor, hasMore })
```

## Cursor contract

```text
version = 1
policy = enrollment_standard_v1
max length = 2048
encoding = canonical JSON -> UTF-8 -> unpadded Base64URL
query kinds = enrollment_self_membership | enrollment_tenant_admin
```

Self binding: tenantId, membershipId, status-or-null,
`enrolledAt_desc_documentId_desc`, policy. Admin binding: tenantId,
status-or-null, `updatedAt_desc_documentId_desc`, policy.

Self position is `{ enrolledAt, documentPath }`; admin position is
`{ updatedAt, documentPath }`. Path is exactly
`tenants/{tenantId}/enrollments/{enrollmentId}`. Resume uses the Date timestamp
and simple enrollmentId, matching collection-query `documentId()` ordering.

Decode validates exact allowlists, version, kind, binding, policy, status,
ordering, Membership where applicable, timestamp, path, Tenant/document ID,
Base64URL, fatal UTF-8, JSON and size. Malformed syntax/schema/position produces
`INVALID_ARGUMENT`; a valid token incompatible with kind, Tenant, Membership,
status, order or policy produces `CONTRACT_VIOLATION`.

## Errors, SDK and read budget

Operation names: `get_enrollment`, `list_own_enrollments_for_membership`,
`list_tenant_enrollments_for_admin`, `decode_enrollment_cursor`,
`serialize_enrollment`.

Shared taxonomy applies: INVALID_ARGUMENT, UNAUTHENTICATED, FORBIDDEN,
NOT_FOUND, CONFLICT, FAILED_PRECONDITION, UNAVAILABLE, CONTRACT_VIOLATION and
UNKNOWN. Details expose no IDs, payload, snapshot, cursor, email or credential.

Injected SDK contract: db, doc, getDoc, collection, query, where, orderBy,
documentId, limit, startAfter, getDocs. No collectionGroup, write dependency or
global Firebase import is allowed.

| Operation | Budget | Auxiliary repository reads |
| --- | --- | ---: |
| point get | one document read | 0 |
| self list | one query + N documents | 0 |
| admin list | one query + N documents | 0 |

## Index contract

All candidates use `collectionGroup: enrollments`, `queryScope: COLLECTION`.
The implicit `__name__` suffix is DESC.

| ID | Tenant-aware fields | State |
| --- | --- | --- |
| FI-ENR-001 | tenantId ASC, membershipId ASC, enrolledAt DESC | deferred; canonical status is never omitted |
| FI-ENR-002 | tenantId ASC, membershipId ASC, status ASC, enrolledAt DESC | required by self method |
| FI-ENR-003 | tenantId ASC, courseId ASC, enrolledAt DESC | deferred with cohort query |
| FI-ENR-004 | tenantId ASC, courseId ASC, status ASC, enrolledAt DESC | deferred with cohort query |
| FI-ENR-005 | tenantId ASC, status ASC, updatedAt DESC | required by admin method |
| FI-ENR-006 | tenantId ASC, membershipId ASC, courseId ASC, enrolledAt DESC | backend-only lookup |
| FI-ENR-007 | no single executable definition | replaced by deferred explicit variants |

Only FI-ENR-002 and FI-ENR-005 are required for 03A.6B. The fixed all-status
`in` and exact equality share each definition. No additional or collection-group
index is approved. Materialization belongs to a later controlled phase.

## Deferred responsibilities and coexistence

Membership+Course uniqueness/re-enrollment is backend/deferred; no key or client
enforcement exists. Cross-Tenant self aggregation is
`DEFERRED_APPLICATION_COMPOSITION`; no fan-out/global cursor is designed.

`EnrollmentRepository = shadow_only_no_migration_no_dual_write`. UI, Providers,
Context, hooks, guards, migration, dual-write, legacy Course integration,
progress, grades, certification, attendance, service replacement and deployment
are excluded.

## Future test matrix

Tests must cover nine-field serialization, all states/lifecycle combinations,
unknown/missing fields, IDs/path/Tenant/Membership consistency, SDK timestamp
removal and freezing; self/admin point access; Tenant and Membership lifecycle;
foreign/anonymous/platform/teacher denial; exact/all-status list shapes,
ordering, ties, options, page bounds, lookahead and terminal pages; cursor
round-trip/cross-binding/malformed classes; writes and collection-group denied;
Firestore-only runtime and FI-ENR-002/005 traceability.

## Residual decisions and readiness

Deferred without blocking 03A.6B: teacher/course cohorts, admin Membership/Course
variants, FI-ENR-001/003/004/006/007 materialization, re-enrollment uniqueness,
global composition, post-archive operational policy, writes and integration.

```text
ENROLLMENT_QUERY_CONTRACT = RESOLVED
ENROLLMENT_PAGINATION_CONTRACT = RESOLVED
ENROLLMENT_CURSOR_CONTRACT = RESOLVED
ENROLLMENT_INDEX_CONTRACT = RESOLVED
ENROLLMENT_PHYSICAL_MODEL_CONTRACT = RESOLVED
ENROLLMENT_API_CONTRACT = RESOLVED

SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A = incomplete_superseded_by_resolution
SaaS-03A.6A-R1 = completed_pending_human_contract_review
SaaS-03A.6B = ready_not_started
EnrollmentRepository = not_created
```

R1 decision: `COMPLETE`. No subsequent phase is started.

## Implementation trace

SaaS-03A.6B implements this contract without divergence: the API remains
read-only and minimal; every list includes tenant and canonical status; self
also includes Membership; pagination/cursor policies are unchanged. The
implementation has 46 passing unit tests and remains shadow-only.

```text
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed_pending_human_code_review
EnrollmentRepository = implemented_shadow
```

C1 confirms the implementation matches this contract without divergence.
03A.6B is completed and 03A.6B-C1 awaits human push.

03A.6I materializes FI-ENR-002 and FI-ENR-005 locally with the exact tenant,
Membership, status and timestamp field sequences frozen here. No additional
query family is indexed. Emulator validation and production deployment are not
performed; 03A.6R-A is blocked pending 6I-C1 review and commit.

The 6I-C1 controlled review confirms the two materialized signatures exactly
match R1. No additional Enrollment index is authorized. 6R-A is
`ready_not_started` after the isolated commits.

6R-A translates this contract into 111 Firestore-only runtime Test IDs covering
self/admin queries, both indexes, pagination, cursor and denial shapes. Runtime
is not executed; 6R-A-C1 is the next unstarted review phase.

6R-A-C1 reconciles the suite to 111 IDs by adding direct default and empty-page
guarantees. R1 remains unchanged; B1 is ready but not started.
