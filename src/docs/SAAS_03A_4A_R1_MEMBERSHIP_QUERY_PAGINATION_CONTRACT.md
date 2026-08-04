# SaaS-03A.4A-R1 — Membership query, pagination, cursor and index contract

## 1. Purpose and resolution boundary

This document resolves every implementation decision raised by the 03A.4A
audit. It defines only the client-self MembershipRepository. Administrative,
system, lifecycle, and lookup contracts remain explicit non-client contracts;
their exclusion is a final scope decision, not an implementation ambiguity.

No code, test, Rule, index JSON, package, workflow, or Firebase resource is
created or changed in R1.

## 2. Final FQ-MEM classification

| Contract | Final classification | Repository consequence |
|---|---|---|
| FQ-MEM-001 | CLIENT_SELF for owner point get; non-self actors excluded | implements `getOwnMembership` only |
| FQ-MEM-002 | BACKEND_ONLY | membershipKey lookup is never exposed |
| FQ-MEM-003 | CLIENT_SELF | implements tenant-scoped and collection-group self lists under the closed contracts below |
| FQ-MEM-004 | DEFERRED + RULES_POLICY_BLOCKER | no tenant-admin client API; current Rules deny foreign/broad reads |
| FQ-MEM-005 | CLIENT_SELF only for own historical slices through the two self list APIs; admin slice DEFERRED | no separate history method and no `in` filter |
| FQ-MEM-006 | SYSTEM_ONLY | no client API |
| FQ-MEM-007 | BACKEND_ONLY | no lifecycle, key, approval, or uniqueness API |

The Rules policy blocker is resolved for 03A.4B by excluding FQ-MEM-004 and
the admin slice of FQ-MEM-005. A later Rules-policy phase may reconsider them,
but 03A.4B must not anticipate that policy.

## 3. Final public operations

```text
getOwnMembership(tenantId, membershipId, uid)

listOwnMembershipsForTenant(tenantId, uid, options?)

listOwnMembershipsAcrossTenants(uid, options?)
```

`getOwnMembership` validates all three IDs, reads exactly
`tenants/{tenantId}/memberships/{membershipId}`, and serializes with
`expectedTenantId` and `expectedUid`. Its cardinality is exactly zero-or-one;
an existing permitted document returns one Membership. Missing protected
resources may surface as `FORBIDDEN` because Rules can mask existence.

Tenant-scoped self listing is retained because a user can have retained removed
history and a later non-terminal Membership for the same Tenant. The collection
path supplies Tenant scope; the query still requires `uid == expectedUid`.
The serializer validates embedded `tenantId` fail-closed. No `tenantId` where
constraint is added: it is redundant with the canonical collection path and
would create an unnecessary index dimension.

Collection-group self listing discovers the user's Membership contexts across
Tenants and always requires `uid == expectedUid`.

## 4. Closed options and filters

Both list methods accept the same exact plain-object shape:

```text
{
  status?: "approved" | "suspended" | "removed",
  role?: "student" | "teacher" | "tenant_admin",
  pageSize?: integer,
  cursor?: string | null
}
```

`options === undefined` means `{}`. `options === null`, arrays, non-plain
objects, unknown fields, `undefined` as an explicitly supplied field value,
empty/whitespace cursors, non-string cursors, invalid enums, and invalid sizes
produce `INVALID_ARGUMENT`.

Allowed filter combinations are exactly:

| status | role | Query equalities after mandatory uid |
|---|---|---|
| omitted | omitted | none |
| one canonical value | omitted | `status == value` |
| omitted | one canonical value | `role == value` |
| one canonical value | one canonical value | `status == value`, `role == value` |

No list, array, `in`, `array-contains`, `not-in`, `!=`, range, raw `where`, raw
constraint, arbitrary field, arbitrary UID, tenant option, order option,
direction option, offset, or DocumentSnapshot cursor is accepted. Status and
role are each zero-or-one exact equality filters. Filter order in code is
mandatory UID, then status when present, then role when present.

## 5. Ordering, page sizes, and result

Both list methods use exactly:

```text
orderBy("createdAt", "desc")
orderBy(documentId(), "desc")
```

The secondary value is the simple `membershipId` for the tenant collection
query and the full canonical document path for the collection-group query.
This gives a deterministic total order for equal timestamps.

Membership Standard v1 adopts the already proven conservative web/mobile
policy:

```text
MIN_PAGE_SIZE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
```

Absent `pageSize` uses 20. A non-integer, value below 1, or value above 50 is
`INVALID_ARGUMENT`; values are never clamped. The SDK query always requests
`limit(pageSize + 1)`. The extra document is lookahead only and is never
returned or used as the cursor position.

The stable result is:

```text
Object.freeze({
  items: Object.freeze([...serializedMemberships]),
  nextCursor: string | null,
  hasMore: boolean
})
```

`hasMore` is true exactly when the raw query returns more than `pageSize`.
When true, `nextCursor` encodes the last returned item, not the lookahead item.
When false, `nextCursor` is null. Empty pages return frozen `[]`, null, and
false. Any incompatible returned document aborts the whole operation; documents
are never silently skipped.

## 6. Cursor Standard v1

Constants:

```text
version = 1
policy = membership_standard_v1
max encoded length = 2048 characters
query kinds:
  membership_self_tenant
  membership_self_collection_group
```

Canonical pre-encoding schema:

```text
{
  version: 1,
  queryKind,
  binding: {
    tenantId: string | null,
    uid: string,
    status: MembershipStatus | null,
    role: MembershipRole | null,
    order: "createdAt_desc_documentId_desc",
    policy: "membership_standard_v1"
  },
  position: {
    createdAt: canonical UTC ISO-8601 string,
    documentPath: "tenants/{tenantId}/memberships/{membershipId}"
  }
}
```

For `membership_self_tenant`, binding `tenantId` is the exact requested Tenant.
For `membership_self_collection_group`, binding `tenantId` is null. `uid`,
status/role filters, order, policy, and query kind must match the current query
exactly. `pageSize` is intentionally not bound, so a valid cursor may continue
with another valid page size.

The fingerprint strategy is explicit binding plus deterministic field-by-field
comparison; no hash or crypto dependency is added. Encoding is canonical JSON
as UTF-8, then base64url without padding. Browser implementation must use
`TextEncoder`/`TextDecoder` plus byte-safe base64 conversion; Node tests may use
equivalent portable helpers but product code cannot depend exclusively on
`Buffer`. Base64 is transport opacity, not security. The cursor is unsigned
because Rules remain the authority and a client-side signature has no secret.

Validation is fail-closed: non-empty string, length <=2048, base64url alphabet,
valid bytes/UTF-8/JSON, plain objects, exact keys at every level, supported
version/query kind, exact binding, canonical IDs/enums/order/policy, canonical
ISO timestamp, and canonical full Membership path whose parent Tenant and
membershipId are valid. Unknown fields are rejected.

Malformed encoding/schema/value input produces `INVALID_ARGUMENT`. A
well-formed cursor with unsupported version or mismatched query kind, Tenant,
UID, status, role, order, or policy produces `CONTRACT_VIOLATION`. Cursor decode
errors use operation `decode_membership_cursor`; list operations use
`list_own_memberships_for_tenant` and
`list_own_memberships_across_tenants`.

`createdAt` becomes `new Date(iso)` for `startAfter`; the modular SDK accepts a
Date for a Firestore Timestamp field. The second bound value is:

```text
tenant query:          membershipId parsed from documentPath
collection-group:     full documentPath
```

No DocumentReference, DocumentSnapshot, or Timestamp constructor is required.

## 7. Definitive index contract

All material indexes use `collectionGroup: "memberships"`; tenant variants use
`queryScope: "COLLECTION"`, and cross-tenant variants use
`queryScope: "COLLECTION_GROUP"`. Equality fields are ASCENDING and
`createdAt` is DESCENDING. The descending `__name__` suffix is implicit in the
Firebase index format, matching explicit `documentId() DESC`.

Tenant-scoped self indexes introduced by R1:

| ID | Filters | Material fields |
|---|---|---|
| FI-MEM-005 | uid | uid ASC, createdAt DESC |
| FI-MEM-006 | uid + status | uid ASC, status ASC, createdAt DESC |
| FI-MEM-007 | uid + role | uid ASC, role ASC, createdAt DESC |
| FI-MEM-008 | uid + status + role | uid ASC, status ASC, role ASC, createdAt DESC |

Collection-group self indexes:

| ID | Filters | Material fields |
|---|---|---|
| FI-CG-001 | uid | uid ASC, createdAt DESC |
| FI-CG-002 | uid + status | uid ASC, status ASC, createdAt DESC |
| FI-CG-006 | uid + role | uid ASC, role ASC, createdAt DESC |
| FI-CG-007 | uid + status + role | uid ASC, status ASC, role ASC, createdAt DESC |

FI-MEM-001 through FI-MEM-004 remain conceptual administrative/history indexes
outside the client-self repository scope. They are not materialized by 03A.4B.
The eight self indexes above are all missing from `firestore.indexes.json` and
must be materialized in 03A.4I after repository review and before runtime.
There are no equivalent, duplicate, or conflicting Membership indexes today.

## 8. Repository dependencies and errors

03A.4B must inject exactly the functions used by the three methods:

```text
db, doc, getDoc, collection, collectionGroup, query, where,
orderBy, documentId, limit, startAfter, getDocs
```

No write SDK function, Firebase singleton, Auth global, Tenant/Identity lookup,
membershipKey access, raw query builder, or UI dependency is permitted.
Firebase errors use the shared normalized mapping. Serializer mismatches are
fail-closed contract violations; malformed caller inputs are invalid arguments.

## 9. Implementation and test readiness

03A.4B can implement exactly:

```text
createMembershipRepository(dependencies)
getOwnMembership
listOwnMembershipsForTenant
listOwnMembershipsAcrossTenants
```

Unit coverage must independently prove all four filter combinations for both
list scopes, exact constraints/order/limit, tenant versus collection-group
cursor bound values, lookahead/result behavior, cursor portability and binding,
foreign result rejection, strict serialization, dependency injection, error
mapping, immutable API, and absence of admin/write/key operations.

The subsequent order is implementation, human review, eight-index local
materialization, Firestore-only Emulator runtime, then CI/runtime closure.
No UI integration occurs in these phases.

## 10. Closure

Every implementation choice for the client-self MembershipRepository is now
closed. Deferred/admin/system contracts are explicitly excluded, not pending
programming decisions.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed_pending_human_contract_review
SaaS-03A.4B = ready_not_started
MembershipRepository = not_created
```

```text
SaaS-03A.4A-R1 Membership query, pagination, cursor and index contract resolution = COMPLETE
```

## 11. Implementation review trace

03A.4B and its C1 review implement this contract without changing its API,
filters, ordering, pagination, cursor, or index decisions. C1 added the missing
explicit comparison between the requested Tenant and the Tenant segment of a
tenant-list result path. This is a fail-closed enforcement correction, not a
contract change. The eight indexes remain pending local materialization.

```text
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed_pending_human_push
SaaS-03A.4I = ready_not_started
```

## 12. Local index materialization trace

03A.4I materializes exactly the eight index definitions from section 7. The
four COLLECTION and four COLLECTION_GROUP entries preserve equality-field
order and `createdAt DESC`; firebase-tools 15.24.0 supplies the matching
implicit descending `__name__` suffix. No administrative index is included.

```text
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
```
