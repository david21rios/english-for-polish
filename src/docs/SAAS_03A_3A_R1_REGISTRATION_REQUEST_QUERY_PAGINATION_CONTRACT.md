# SaaS-03A.3A-R1 — RegistrationRequest query, pagination, cursor and index contract

## 1. Purpose and resolution

This document resolves the RegistrationRequest-specific portions of FQI-001
and FQI-004 that blocked the client-safe repository. It does not create the
repository, materialize an index, change Rules or authorize functional UI use.

```text
REGISTRATION_REQUEST_QUERY_CONTRACT = RESOLVED
REGISTRATION_REQUEST_CURSOR_CONTRACT = RESOLVED
REGISTRATION_REQUEST_INDEX_CONTRACT = RESOLVED
```

## 2. Client-safe Query Contracts

| Contract | Actor | Scope | Filters | Order | Pagination | Technical authority | Implementation status |
|---|---|---|---|---|---|---|---|
| FQ-RRQ-001 | identity_self | one canonical Tenant Request | point IDs; serialized uid must equal expected uid | none | none | client + Rules | READY_FOR_R2 |
| FQ-RRQ-002 | identity_self | one Tenant collection | mandatory uid self; optional one exact status | requestedAt DESC, documentId DESC | Standard v1 | client + Rules | READY_FOR_SHADOW_R2; indexes pending |
| FQ-RRQ-003 | identity_self | registrationRequests collection group | mandatory uid self; optional one exact status | requestedAt DESC, documentId DESC | Standard v1 | client + Rules | READY_FOR_SHADOW_R2; indexes pending |
| FQ-RRQ-004 | self/admin/system lookup composition | registrationRequestKeys + point Request | uidKey | none | none | trusted backend for key access | NOT_CLIENT_SAFE |
| FQ-RRQ-005 | tenant_admin | Tenant pending inbox | status pending | requestedAt ASC, documentId ASC | Administrative | trusted backend | NOT_CLIENT_SAFE |
| FQ-RRQ-006 | tenant_admin | Tenant terminal history | bounded terminal statuses | requestedAt DESC, documentId DESC | Administrative | trusted backend | NOT_CLIENT_SAFE |
| FQ-RRQ-007 | platform_system | expiration collection group | pending + external cutoff | requestedAt ASC, documentId ASC | Background | trusted backend/system | DEFERRED |
| FQ-RRQ-008 | tenant/system | consistent cross-root point-read set | canonical IDs | none | none | trusted backend | NOT_CLIENT_SAFE |

The repository receives uid explicitly to construct and validate a self query.
It is not proof of authorization; Firestore Rules remain authoritative.

## 3. Filters and options

Both list methods accept only this closed options shape:

```text
{
  status?: pending | approved | rejected | cancelled | expired,
  pageSize?: integer,
  cursor?: base64url JSON string | null
}
```

The tenant-scoped method receives `tenantId` and `uid` as primary arguments.
The collection-group method receives `uid`. The query always includes one
`where("uid", "==", uid)`. Status is omitted or one exact canonical value and,
when present, adds one `where("status", "==", status)`. Lists, `in`, `not-in`,
`!=`, arbitrary fields, raw constraints, offsets, directions and raw
DocumentSnapshot cursors are prohibited.

Omitted or `undefined` options means the empty options object. `null`, arrays,
non-plain objects, unknown keys and invalid values are `INVALID_ARGUMENT`.
`cursor: null` means first page. An empty or malformed cursor is
`INVALID_ARGUMENT`; a valid cursor envelope incompatible with the current
query is `CONTRACT_VIOLATION`.

## 4. Canonical order and page size

Both list queries use:

```text
orderBy("requestedAt", "desc")
orderBy(documentId(), "desc")
```

`documentId()` is valid for collection and collection-group queries. The
secondary cursor value is reconstructed internally as a DocumentReference to
the canonical full document path, avoiding the different string semantics of
a collection document ID and a collection-group full path.

```text
MIN_PAGE_SIZE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
```

Twenty balances a compact web/mobile history page with read cost. Fifty is a
hard defensive ceiling for this low-frequency historical root. Values below
one, above fifty, non-integers, non-numbers and non-finite values fail with
`INVALID_ARGUMENT`; values are never clamped.

The SDK query uses `limit(pageSize + 1)`, therefore at most 51 documents. The
extra document is never serialized into `items`; it only establishes
`hasMore`. The continuation cursor is built from the last returned item, never
the lookahead document.

## 5. Result contract

Both lists return a new frozen object:

```text
Object.freeze({
  items: Object.freeze([...serializedRegistrationRequests]),
  nextCursor: string | null,
  hasMore: boolean
})
```

`hasMore` is true only when the lookahead document exists. `nextCursor` is
non-null exactly when `hasMore` is true and at least one item was returned.
Empty and final pages return frozen `items: []`/items, `nextCursor: null` and
`hasMore: false`. Serialization is fail-closed: any incompatible result rejects
the whole operation and does not advance the cursor.

## 6. Cursor v1

The pre-encoding schema has an exact allowlist:

```text
{
  version: 1,
  queryKind: "registration_requests_self_tenant" |
             "registration_requests_self_collection_group",
  binding: {
    tenantId: string | null,
    uid: string,
    status: RegistrationRequestStatus | null,
    order: "requestedAt_desc_documentId_desc",
    policy: "registration_request_standard_v1"
  },
  position: {
    requestedAt: UTC ISO-8601 string,
    documentPath: "tenants/{tenantId}/registrationRequests/{requestId}"
  }
}
```

Tenant queries require a non-null tenantId matching the method argument.
Collection-group cursors require tenantId null; the actual Tenant remains
encoded canonically in `position.documentPath`. UID is a technical identifier,
not an email or profile value.

The `binding` object is the deterministic query fingerprint. R1 selects
explicit comparison instead of a hash: it is smaller in conceptual complexity,
auditable and avoids a crypto dependency. Every binding field must equal the
current query. The page size itself is not bound so a caller may change it
within the same `registration_request_standard_v1` policy.

The token is canonical JSON with the exact schema order shown above and no
insignificant whitespace, encoded as UTF-8 and transported as unpadded
base64url. Base64 provides transport opacity only, not secrecy or authority.
R2 must implement byte-safe conversion through `TextEncoder`/`TextDecoder` and
a locally tested base64url adapter that works in both the supported browser and
Node test runtime. Encoding first converts UTF-8 bytes to a binary-byte string
and only then applies the available base64 primitive; decoding performs the
inverse byte conversion and uses fatal UTF-8 decoding. It must never pass a
Unicode JSON string directly to `btoa`, must not rely on Node-only `Buffer` in
browser code and must not add a package dependency.
Encoded tokens longer than 2048 characters are rejected before decoding.

The cursor is unsigned. A client-side signature would require a backend secret
and would not strengthen Firestore authorization. Strict schema, exact keys,
types, version, binding, ISO timestamp, canonical path and size checks provide
contract integrity; Rules still constrain readable resources. Residual
tampering can only select a different valid position within authorized data.

Unknown fields, invalid UTF-8/JSON/base64url, invalid identifiers, invalid
timestamp, non-canonical path or fields with wrong types are malformed input
(`INVALID_ARGUMENT`). A structurally valid token with an unsupported integer
version, or for a different query kind, tenant, uid, status, order or policy,
is incompatible (`CONTRACT_VIOLATION`). Errors must not echo the token or UID.

## 7. Conversion to Firestore cursor values

R2 validates `position.requestedAt` as canonical UTC ISO-8601, creates a new
valid `Date`, and passes it as the first `startAfter` value. Firestore accepts a
JavaScript Date for a timestamp field without importing a global Timestamp.

R2 validates the full canonical document path and reconstructs the second
value with the injected `doc(db, documentPath)`. The query then applies:

```text
startAfter(requestedAtDate, documentReference)
```

No Date, DocumentReference or snapshot leaves the repository. Future injected
SDK requirements are: `doc`, `getDoc`, `collection`, `collectionGroup`,
`query`, `where`, `orderBy`, `documentId`, `limit`, `startAfter` and `getDocs`.

## 8. Errors and operation names

Canonical operations:

- `get_own_registration_request` (`registration_request`);
- `list_own_registration_requests_for_tenant`
  (`registration_request_collection`);
- `list_own_registration_requests_across_tenants`
  (`registration_request_collection`);
- `decode_registration_request_cursor`
  (`registration_request_collection`).

Malformed caller input is `INVALID_ARGUMENT`. A well-formed cursor bound to a
different query is `CONTRACT_VIOLATION`. Firebase errors retain the shared
normalized mapping and sanitized cause.

## 9. Index contract

| Index | Scope | Fields/directions | Query | Required | Materialized |
|---|---|---|---|---|---|
| FI-RRQ-001 | collection `registrationRequests` | configured: uid ASC, requestedAt DESC; implicit: __name__ DESC | FQ-RRQ-002 without status | yes | no |
| FI-RRQ-002 | collection `registrationRequests` | configured: uid ASC, status ASC, requestedAt DESC; implicit: __name__ DESC | FQ-RRQ-002 with status | yes | no |
| FI-CG-003 | collection group `registrationRequests` | configured: uid ASC, requestedAt DESC; implicit: __name__ DESC | FQ-RRQ-003 without status | yes | no |
| FI-CG-004 | collection group `registrationRequests` | configured: uid ASC, status ASC, requestedAt DESC; implicit: __name__ DESC | FQ-RRQ-003 with status | yes | no |

The equality plus ordered-field combinations require these composites; normal
single-field indexes do not cover them. A future Firebase index JSON definition
lists the configured business fields only. Firestore appends `__name__` using
the final configured direction, so `__name__ DESC` is an implicit query/index
property rather than a separately configured field. FQ-RRQ-001 is a point read
and needs no composite.

SaaS-03A.3I will materialize the four definitions. The approved order is:

```text
R2 repository shadow implementation and R2-C1 review
→ SaaS-03A.3I index materialization and review
→ SaaS-03A.3R Firestore-only Emulator query validation
→ later Provider/UI functional integration
```

Pending indexes do not block R2 code or pure tests. They do block Emulator
approval and every functional consumer.

## 10. Future tests and residual risks

R2 unit tests must cover options allowlisting, 1/20/50 boundaries, lookahead,
result freezing, cursor round-trip and every malformed/incompatible case.
Later Emulator coverage must prove self tenant/collection-group ALLOW and
broad/foreign/anonymous DENY with both status variants and materialized
indexes.

Residual risks are expected pagination movement during concurrent status
changes, client cursor tampering within already authorized data, token exposure
of opaque technical IDs after decoding and index deployment drift. No global
snapshot consistency is promised; consumers must deduplicate by canonical path
and explicitly refresh.

## 11. State

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R1-C1 = completed_pending_human_push
SaaS-03A.3A-R2 = ready_not_started
```

R2 was not started.
