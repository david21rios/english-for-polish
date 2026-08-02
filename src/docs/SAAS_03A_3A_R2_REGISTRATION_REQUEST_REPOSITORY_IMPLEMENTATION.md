# SaaS-03A.3A-R2 — RegistrationRequestRepository implementation

## Purpose and scope

R2 implements the client-safe, read-only RegistrationRequest repository in
expand/shadow mode. It implements FQ-RRQ-001, FQ-RRQ-002 and FQ-RRQ-003 without
creating a consumer, write operation, index, Rule change or remote operation.

## Public API and paths

`createRegistrationRequestRepository({ db, sdk })` returns an immutable API:

- `getOwnRegistrationRequest(tenantId, requestId, uid)` performs one canonical point read;
- `listOwnRegistrationRequestsForTenant(tenantId, uid, options)` queries one Tenant collection;
- `listOwnRegistrationRequestsAcrossTenants(uid, options)` queries collection group `registrationRequests`.

All operations receive UID explicitly, but Rules remain authoritative. No key,
Identity, Tenant or Membership lookup is performed.

## Physical contract and serializer

The allowlist is `requestId`, `tenantId`, `uid`, `requestedRole`, `status`,
`requestedAt`, `reviewedAt`, `reviewedBy`, `approvedMembershipId`,
`cancelledAt`, and `expiredAt`. The first six are required; lifecycle fields
may be absent/null or hold the state-specific value. The serializer validates
IDs, expected Tenant/UID, Domain roles/statuses and lifecycle. Timestamps become
canonical UTC ISO-8601 strings. Unknown fields and foreign or incoherent data
fail closed. Results are new and frozen.

## Queries, pagination and cursors

Lists always apply `uid == expectedUid`; status is omitted or one canonical
value. They order by `requestedAt DESC`, `documentId() DESC`, request
`pageSize + 1`, and return frozen `{ items, nextCursor, hasMore }`. Page sizes
are min/default/max `1/20/50`.

Cursor v1 binds query kind, Tenant scope, UID, status, order and policy
`registration_request_standard_v1`. It stores canonical requestedAt and full
document path, uses canonical JSON UTF-8 and unpadded base64url, and is limited
to 2048 characters. Malformed input is `INVALID_ARGUMENT`; incompatibility is
`CONTRACT_VIOLATION`. `startAfter` receives a `Date` and an injected `doc()`
reference. No SDK object crosses the public API.

## Dependencies, tests and exclusions

The factory injects `db`, `doc`, `getDoc`, `collection`, `collectionGroup`,
`query`, `where`, `orderBy`, `documentId`, `limit`, `startAfter`, and `getDocs`.
It imports no Firebase global. Shared error mapping sanitizes SDK failures.

Fifty-eight pure unit tests cover lifecycle, ownership, options, cursor,
point/list reads, lookahead, error mapping, dependencies and API boundaries.
No Emulator or remote resource is used. No write, key/admin operation,
Provider, UI, legacy replacement, Storage or AI integration is introduced.

## Readiness and risks

FI-RRQ-001/002 and FI-CG-003/004 remain required and unmaterialized. The
repository is shadow-only. Unsigned cursors are not secrets; concurrent writes
may cause pagination duplication/omission. Human review precedes 03A.3I local
index materialization and 03A.3R Firestore-only Emulator validation.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A-R2 = completed
SaaS-03A.3A-R2-C1 = completed_pending_human_push
SaaS-03A.3I = ready_not_started
SaaS-03A.3R = blocked_by_indexes
```

## C1 review corrections

The integral review found and corrected two objective fail-closed gaps: options
now reject whitespace-only cursor strings, and every list result explicitly
requires the requestId parsed from `snapshot.ref.path` to equal `snapshot.id`.
Coverage was expanded from 21 to 58 independently named tests for roles,
lifecycle inversions, page-size boundaries, closed options, deterministic
cursor encoding, unsupported versions, canonical paths, path/ID consistency
and empty/final/lookahead pagination. No contract or public API changed.
