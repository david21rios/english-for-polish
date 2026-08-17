# SaaS-03B-E-R2-R1 RegistrationRequest Shared Persistence Contract Resolution

## 1. Status

- Parent subphase: `SaaS-03B-E`
- Parent implementation checkpoint: `SaaS-03B-E-R2`
- Checkpoint: `SaaS-03B-E-R2-R1`
- Target command: `ApproveRegistrationRequest`
- Resolution type: `documentation_only_shared_persistence_contract_resolution`
- Implementation state: `blocked_pending_exact_registration_request_key_contract`
- Package mutation authorized: `false`
- Functions mutation authorized: `false`
- Firebase mutation authorized: `false`

SaaS-03B-E-R1 is completed and published.

R2 investigation proved that direct implementation of
`ApproveRegistrationRequest` is not yet authorized because shared package-owned
RegistrationRequest persistence primitives are incomplete.

This checkpoint does not select a convenient representation for an unresolved
shared persistence contract.

## 2. Decision

R2-R1 stops with a shared persistence contract gap.

`RegistrationRequest` itself has sufficient existing physical authority to
support future package-owned persisted validation.

`RegistrationRequestKey` does not yet have an exact persisted document shape
that can safely be materialized as a public shared validator.

Therefore:

`R2_DIRECT_MATERIALIZATION = NOT_AUTHORIZED`

No package or Functions implementation may begin until the exact
RegistrationRequestKey persisted contract is resolved.

## 3. RegistrationRequest root contract

The canonical RegistrationRequest root remains:

- `requestId`
- `tenantId`
- `uid`
- `requestedRole`
- `status`
- `requestedAt`
- `reviewedAt`
- `reviewedBy`
- `approvedMembershipId`
- `cancelledAt`
- `expiredAt`

The canonical statuses remain:

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `expired`

The existing RegistrationRequest repository already enforces root shape,
identifier binding and lifecycle validation.

R2 may later materialize a package-owned persisted RegistrationRequest
validator without changing the domain lifecycle.

## 4. RegistrationRequestKey facts already closed

The canonical path is:

`tenants/{tenantId}/registrationRequestKeys/{uidKey}`

The canonical uidKey algorithm is:

`u1_<base64url(UTF-8(uid), no-padding)>`

The key is:

- tenant-scoped by physical path;
- backend-controlled;
- client deny-all for direct key access;
- a lookup/constraint projection, not the RegistrationRequest authority itself;
- used to resolve the current RegistrationRequest for tenant + uid;
- required to retain the authoritative `uid`;
- required to reference the canonical `requestId`;
- required to reflect RegistrationRequest lifecycle status sufficiently for
  consistency and reconciliation;
- retained across cancel, reject, expire and approve lifecycle transitions,
  with lifecycle/request binding updated coherently.

The authoritative RegistrationRequest root remains the source read after key
resolution.

## 5. Exact RegistrationRequestKey shape remains unresolved

Existing evidence does not freeze an exact ordered field allowlist for the
persisted key.

The following facts are supported:

- `uid`
- `requestId`
- `status`

`uidKey` is authoritative in the document path.

`tenantId` is authoritative in the parent path.

However, existing sources do not establish whether either path-derived value
must also be persisted as a document field.

Existing sources also do not establish an `updatedAt` field for
RegistrationRequestKey.

No RegistrationRequestKey-specific `updatedAt` evidence was found in the
reviewed physical, security, query, repository or executable-test surfaces.

Therefore R2-R1 must not invent:

- `REGISTRATION_REQUEST_KEY_FIELDS`;
- `REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS`;
- persisted `uidKey`;
- persisted `tenantId`;
- `updatedAt`;
- new timestamps;
- schemaVersion;
- audit metadata;
- lifecycle metadata beyond what an exact follow-up contract explicitly
  freezes.

## 6. Executable evidence classification

The existing executable/test surface proves:

- the canonical key collection path exists;
- client key point reads are denied;
- client key creation is denied;
- shared path helpers can construct the canonical key path.

The existing executable/test surface does not prove an exact backend persisted
RegistrationRequestKey document schema.

A denied client write containing only `{ uid }` is security-negative evidence;
it is not a canonical persisted-key fixture.

## 7. ApproveRegistrationRequest impact

R1 requires approval to atomically keep consistent:

- RegistrationRequest;
- RegistrationRequestKey;
- Membership;
- MembershipKey;
- privileged command result/idempotency state;
- required audit event.

RegistrationRequestKey is therefore inside the critical approval transaction
boundary.

Implementing approval before its exact shared persisted contract exists would
allow Functions to become an accidental second schema authority.

That is not authorized.

## 8. Shared contract materialization required after resolution

Once the exact RegistrationRequestKey document shape is frozen, the intended
R2 shared surface may include, subject to a separate implementation gate:

- `validatePersistedRegistrationRequest`
- `REGISTRATION_REQUEST_KEY_FIELDS`
- `validateRegistrationRequestKey`
- `encodeRegistrationRequestUidKey`

The existing canonical uidKey algorithm should be reused rather than defining
a second encoding authority.

ApproveRegistrationRequest-specific command input/result/audit contracts also
remain required before Functions business implementation.

This checkpoint does not materialize any of those symbols.

## 9. Explicit exclusions

SaaS-03B-E-R2-R1 does not authorize:

- package source changes;
- package type declaration changes;
- package version changes;
- vendored tarball regeneration;
- Functions command implementation;
- Functions authority implementation;
- Functions transaction-store implementation;
- Functions entrypoint exposure;
- Firestore Rules changes;
- Firestore index changes;
- Firebase configuration changes;
- UI or React changes;
- deployment;
- npm publication;
- data migration;
- repair of existing remote data.

## 10. Required subordinate decision

The next minimum checkpoint is:

`SaaS-03B-E-R2-R1-R1 — RegistrationRequestKey Exact Persisted Contract Resolution`

It must decide, using existing architecture rather than implementation
convenience:

1. the exact ordered persisted field allowlist;
2. the exact required field set;
3. whether `uidKey` is path-only or also persisted;
4. whether `tenantId` is path-only or also persisted;
5. whether any authoritative timestamp belongs to the key;
6. exact status semantics for pending and terminal keys;
7. exact root/key equality requirements;
8. exact creation and lifecycle update semantics;
9. exact validator behavior and failure classification;
10. compatibility with existing Rules and physical topology.

That subordinate checkpoint remains documentation-only until reviewed.

## 11. Checkpoint result

`SaaS-03B-E-R1 = completed_and_published`

`SaaS-03B-E-R2 = blocked_pending_R2_R1_resolution`

`SaaS-03B-E-R2-R1 = blocked_pending_R2_R1_R1`

`ApproveRegistrationRequest implementation = not_authorized`

`Package mutation = not_authorized`

`Functions mutation = not_authorized`

`Firebase mutation = not_authorized`

The next gate is human architecture review of this R2-R1 resolution before
authoring the exact RegistrationRequestKey contract.
