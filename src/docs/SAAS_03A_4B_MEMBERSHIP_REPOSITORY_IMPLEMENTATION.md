# SaaS-03A.4B — MembershipRepository implementation

## Purpose and authority

This phase implements the approved 03A.4A-R1 client-self Membership contract
in shadow mode. It follows the existing functional RegistrationRequest pattern:
explicit dependency injection, strict SDK-independent serialization, closed
query builders, versioned portable cursors, immutable outputs, and normalized
repository errors.

No Rule, index, Domain, shared infrastructure, existing repository, UI,
Provider, legacy service, package, workflow, Firebase configuration, or remote
resource changes in this phase.

## Physical model and serializer

The repository reads only `tenants/{tenantId}/memberships/{membershipId}` and
the corresponding `memberships` collection/collection group. The serializer
requires the exact twelve physical fields:

```text
membershipId, tenantId, uid, role, status, originRequestId,
createdAt, approvedAt, approvedBy, updatedAt, suspendedAt, removedAt
```

Every key is physically required. `originRequestId`, `suspendedAt`, and
`removedAt` alone admit null. IDs, expected Tenant, expected owner, roles,
statuses, timestamps, and lifecycle combinations are validated fail-closed.
Approved Memberships cannot have `removedAt`; suspended Memberships require
`suspendedAt` and prohibit `removedAt`; removed Memberships require
`removedAt`. Historical `suspendedAt` remains permitted for approved/restored
and removed documents as frozen by R1. Timestamp outputs are canonical UTC ISO
strings. Unknown keys, SDK snapshots/references, Timestamp values, arrays, and
source mutation do not escape. Each result is a new frozen object.

## Factory, API, and dependencies

`createMembershipRepository(dependencies)` requires exactly:

```text
db, doc, getDoc, collection, collectionGroup, query, where,
orderBy, documentId, limit, startAfter, getDocs
```

The returned frozen API exposes only:

```text
getOwnMembership
listOwnMembershipsForTenant
listOwnMembershipsAcrossTenants
```

There is no Firebase global, singleton, mutable state, Auth lookup, Identity or
Tenant lookup, membershipKey access, write operation, administrative method,
or raw query surface.

## Query and pagination implementation

Both lists always apply `uid == expectedUid`. Optional `status` and `role` are
each one exact canonical equality and are appended in that order. Queries use
`createdAt DESC`, then `documentId() DESC`, and `limit(pageSize + 1)` with
`MIN=1`, `DEFAULT=20`, and `MAX=50`. Options are a closed plain object; null,
unknown/undefined fields, invalid enums/sizes, raw constraints, and arbitrary
ordering are rejected.

The result is frozen `{ items, nextCursor, hasMore }`. Lookahead determines
`hasMore`, is never returned, and the cursor position comes from the final
returned item. Any incompatible document aborts the complete operation.

## Cursor implementation

Membership cursor version 1 uses policy `membership_standard_v1` and query
kinds `membership_self_tenant` and `membership_self_collection_group`.
Binding contains exact `tenantId`, `uid`, `status`, `role`, order, and policy;
position contains canonical `createdAt` and full canonical `documentPath`.
Encoding is UTF-8 JSON to unpadded base64url using browser-portable
`TextEncoder`, `TextDecoder`, `btoa`, and `atob`, never `Buffer`. Tokens are at
most 2048 characters and exact-schema validated. Malformed tokens are
`INVALID_ARGUMENT`; valid but incompatible bindings are `CONTRACT_VIOLATION`.

For `startAfter`, the first value is a Date. Tenant collection queries derive
the simple membership ID from the cursor path; collection-group queries use
the full document path. No DocumentReference or DocumentSnapshot is exposed.

## Tests and exclusions

Unit coverage verifies all statuses, lifecycle, nullability, unknown and
missing fields, ID/Tenant/owner consistency, timestamp conversion,
immutability, point reads, four filter combinations, deterministic ordering,
lookahead, both cursor bound forms, cross-query cursor rejection, foreign
results, error mapping, dependency failure, and minimal public API.

The C1 review identified one fail-closed path-validation defect: tenant-scoped
list results validated embedded `tenantId` but did not independently compare
the Tenant segment of `snapshot.ref.path` with the requested Tenant. The list
now rejects that mismatch before serialization. No API, query shape, Rule,
index, lifecycle, or cursor contract changed.

Final coverage comprises 23 tests across three executable test files:

| Area | Positive contracts | Negative contracts |
|---|---|---|
| serializer | all statuses, all roles, retained lifecycle history, null preservation, immutability | missing/unknown fields, IDs/context, invalid roles/status/null values/timestamps/lifecycle |
| repository | canonical point read, four filter combinations, deterministic order, lookahead, terminal/empty pages, both cursor bound forms, immutable minimal API | missing/forbidden point reads, foreign UID/Tenant/path results, invalid options/cursors, dependency failures, Firebase mapping |
| options/cursor | defaults/bounds, exact binding, portable round-trip | invalid option types/ranges, malformed/overlong/path cursor, cross-Tenant/UID/status/role/query/order/policy bindings |

The eight R1 Membership indexes remain unmaterialized. Emulator/runtime,
index materialization, CI, UI integration, Providers, legacy replacement,
dual-write, migration, lifecycle commands, and deployment remain later or
excluded work.

## State and next phase

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

Residual risks are the eight unmaterialized indexes, unsigned cursor position
movement under concurrent writes, and shadow-mode absence of runtime/consumer
integration. No subsequent phase is initiated here.

## Index materialization trace

03A.4I locally materializes all eight R1 self-query indexes without changing
this repository. FI-MEM-005–008 use COLLECTION scope and FI-CG-001/002/006/007
use COLLECTION_GROUP scope. They remain undeployed and untested by Emulator.

```text
SaaS-03A.4B-C1 = completed
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
```

## Runtime suite preparation

03A.4R-A adds an isolated 81-case Firestore-only runtime suite without changing
the repository. It statically covers point reads, eight query variants,
pagination, cursors, serializer contracts, Rules denials, and membershipKeys.
The Emulator is not executed in this phase.

```text
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
MembershipRepository = implemented_shadow
```

## Runtime CI integration trace

SaaS-03A.4R-B1 adds only a static source precheck and an independent manual
Firestore-only runtime gate for the existing 81 Membership tests. The
repository, its public API and its 23 unit tests remain unchanged;
`MembershipRepository = implemented_shadow`. Runtime evidence is pending the
owner's push and a new `workflow_dispatch` execution.
