# SaaS-03B-E-R2-R1-R1 RegistrationRequestKey Exact Persisted Contract Resolution

## 1. Status

- Parent subphase: `SaaS-03B-E`
- Parent implementation checkpoint: `SaaS-03B-E-R2`
- Parent resolution: `SaaS-03B-E-R2-R1`
- Checkpoint: `SaaS-03B-E-R2-R1-R1`
- Target: `RegistrationRequestKey`
- Resolution type: `normative_exact_persisted_contract_resolution`
- Documentation-only checkpoint: `true`
- Package mutation authorized by this checkpoint: `false`
- Functions mutation authorized by this checkpoint: `false`
- Firebase mutation authorized by this checkpoint: `false`

SaaS-03B-E-R2-R1 established that the historical architecture did not freeze an
exact persisted RegistrationRequestKey document allowlist.

The R2-R1-R1 evidence capture confirmed that further historical inspection does
not provide a pre-existing exact schema.

R2-R1-R1 therefore resolves the missing contract explicitly and normatively,
using the narrowest representation consistent with the already frozen physical,
lifecycle, security and lookup architecture.

## 2. Normative decision

The canonical persisted RegistrationRequestKey document shape is exactly:

- `uid`
- `requestId`
- `status`

The canonical ordered field allowlist is therefore:

`["uid", "requestId", "status"]`

The canonical required field set is identical:

`["uid", "requestId", "status"]`

No additional persisted fields are authorized.

In particular, the canonical RegistrationRequestKey document does not persist:

- `tenantId`
- `uidKey`
- `updatedAt`
- `createdAt`
- `schemaVersion`
- review timestamps
- lifecycle timestamps
- audit metadata
- command metadata

This is a normative architecture decision introduced by R2-R1-R1.

It must not be represented as historical evidence that those three fields had
previously been frozen as an exact allowlist.

## 3. Canonical physical identity

The canonical physical path remains:

`tenants/{tenantId}/registrationRequestKeys/{uidKey}`

`tenantId` is authoritative from the parent document path.

`uidKey` is authoritative from the key document ID.

Neither path-derived value is duplicated into the persisted
RegistrationRequestKey document.

The persisted `uid` remains required because it is the authoritative identity
binding from which `uidKey` can be deterministically validated.

## 4. Canonical uidKey derivation

RegistrationRequestKey must use the same canonical UID encoding family already
used by MembershipKey:

`u1_<base64url(UTF-8(uid), no-padding)>`

R2 implementation must materialize one package-owned canonical encoder for
RegistrationRequest UID keys.

A second encoding algorithm in Functions or application services is forbidden.

For every persisted key:

`documentId == encodeRegistrationRequestUidKey(uid)`

must hold.

A mismatch is a contract violation.

## 5. Persisted field semantics

### 5.1 uid

`uid` is required.

It must be a valid canonical document identifier according to the shared
validation rules.

It identifies the Identity for whom the RegistrationRequest constraint exists.

The persisted UID must satisfy:

`encodeRegistrationRequestUidKey(key.uid) == uidKey`

where `uidKey` is the key document ID.

### 5.2 requestId

`requestId` is required.

It must be a valid canonical document identifier.

It identifies the authoritative RegistrationRequest root document at:

`tenants/{tenantId}/registrationRequests/{requestId}`

A RegistrationRequestKey never becomes the authoritative source for request
content.

The key is only the lookup/constraint projection used to resolve the root.

### 5.3 status

`status` is required.

It must be one of the canonical RegistrationRequest statuses:

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `expired`

The key status must exactly match the authoritative RegistrationRequest status.

Unknown, missing or non-canonical status values are contract violations.

## 6. Root/key binding invariants

For a key document located at:

`tenants/{tenantId}/registrationRequestKeys/{uidKey}`

with persisted value:

`{ uid, requestId, status }`

the authoritative RegistrationRequest located at:

`tenants/{tenantId}/registrationRequests/{requestId}`

must satisfy all of the following:

1. `request.requestId == key.requestId`
2. `request.tenantId == tenantId`
3. `request.uid == key.uid`
4. `request.status == key.status`
5. `encodeRegistrationRequestUidKey(request.uid) == uidKey`

Any mismatch is a shared persistence contract violation.

The RegistrationRequest root remains authoritative.

The key must never be accepted as sufficient authority without reading and
validating the referenced RegistrationRequest root when business execution
depends on request state.

## 7. Lifecycle semantics

RegistrationRequestKey is retained across the RegistrationRequest lifecycle.

The key is not deleted merely because the request reaches a terminal state.

The key lifecycle mirrors the root request lifecycle:

- request `pending` -> key `pending`
- request `approved` -> key `approved`
- request `rejected` -> key `rejected`
- request `cancelled` -> key `cancelled`
- request `expired` -> key `expired`

For lifecycle transitions, root and key must be updated coherently inside the
same authoritative transaction whenever the command owns both writes.

A key that references one request while reflecting another request's status is
invalid.

A key whose UID does not match the referenced root UID is invalid.

A key whose document ID does not match the canonical encoded UID is invalid.

## 8. Creation semantics

When a backend command creates a RegistrationRequest that requires the canonical
tenant-plus-UID constraint, the corresponding RegistrationRequestKey must be
created or reconciled in the same authoritative transaction.

The canonical new-key value is exactly:

`{ uid, requestId, status }`

No timestamp or version field is added.

Collision handling must fail closed.

An existing key must not be overwritten blindly if it is bound to an
incompatible RegistrationRequest.

Exact collision/reconciliation behavior belongs to the business command
contract that owns the attempted write and must preserve the root/key
invariants frozen here.

## 9. Terminal-state semantics

Terminal key retention is intentional.

The canonical terminal RegistrationRequest states are:

- `approved`
- `rejected`
- `cancelled`
- `expired`

A terminal key continues to bind:

- tenant path
- canonical UID-derived document ID
- authoritative UID
- authoritative request ID
- authoritative terminal status

This permits deterministic reconciliation and prevents a terminal lifecycle
transition from silently destroying the tenant-plus-UID constraint history.

Whether a later CreateRegistrationRequest command may supersede a terminal key
with a new request ID is a command-specific lifecycle policy and is not defined
by this checkpoint.

Such supersession must never occur implicitly inside ApproveRegistrationRequest.

## 10. Shared package materialization authorized after review

After this documentation checkpoint passes architecture review and is
published, R2 may materialize shared package-owned persistence primitives for:

- `REGISTRATION_REQUEST_KEY_FIELDS`
- `REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS`
- `validateRegistrationRequestKey`
- `encodeRegistrationRequestUidKey`
- `validatePersistedRegistrationRequest`

The expected RegistrationRequestKey constants are:

`REGISTRATION_REQUEST_KEY_FIELDS = ["uid", "requestId", "status"]`

`REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS = ["uid", "requestId", "status"]`

The validator must:

1. require an exact object shape;
2. reject extra fields;
3. validate `uid`;
4. validate `requestId`;
5. validate canonical RegistrationRequest `status`;
6. return the package-standard validation result form;
7. remain pure;
8. perform no Firestore access;
9. perform no path lookup;
10. perform no business authorization.

Path/root equality validation may be performed by Functions transaction code
using the shared pure primitives, because the standalone persisted document
validator does not receive physical path context.

## 11. Security compatibility

Firestore Rules remain unchanged.

`registrationRequestKeys/{uidKey}` remains backend-only and direct client access
remains denied.

R2-R1-R1 does not authorize exposing key documents to clients.

The exact persisted schema defined here does not alter existing query or index
contracts because RegistrationRequestKey remains a point-lookup backend
projection.

## 12. ApproveRegistrationRequest impact

ApproveRegistrationRequest may not yet be implemented by this documentation
checkpoint.

However, after this checkpoint is reviewed and published, the previous shared
persistence blocker is resolved.

Before ApproveRegistrationRequest Functions business implementation, R2 must
materialize and validate the required shared package contracts.

Approval must atomically maintain coherent state across:

- RegistrationRequest
- RegistrationRequestKey
- Membership
- MembershipKey
- privileged command state/result
- required audit event

For approval:

`RegistrationRequest.status == "approved"`

and:

`RegistrationRequestKey.status == "approved"`

must become true in the same authoritative transaction.

The key must retain the same canonical `uid` and `requestId`.

## 13. Explicit exclusions

SaaS-03B-E-R2-R1-R1 does not itself modify:

- `packages/saas-contracts`
- package declarations
- package version
- package tarball
- Functions source
- Functions handlers
- Functions transaction stores
- Functions authority resolvers
- Firestore Rules
- Firestore indexes
- Storage Rules
- Firebase configuration
- UI
- React
- repositories
- deployed data

No migration or repair of existing remote data is authorized.

## 14. Resolution

`RegistrationRequestKey exact persisted contract = RESOLVED`

`RegistrationRequestKey fields = uid, requestId, status`

`tenantId = path_only`

`uidKey = path_only`

`updatedAt = absent`

`createdAt = absent`

`schemaVersion = absent`

`terminal key retention = required`

`root remains authoritative = true`

`client access = denied`

`package materialization = pending_separate_gate`

`Functions implementation = not_authorized_yet`

The historical schema gap identified by R2-R1 is closed by this explicit
normative architecture decision.

The next gate is ChatGPT architecture review of this R2-R1-R1 resolution before
documentation staging and publication.
