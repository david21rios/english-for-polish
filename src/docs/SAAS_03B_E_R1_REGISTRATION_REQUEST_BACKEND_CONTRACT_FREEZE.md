# SaaS-03B-E-R1 RegistrationRequest Backend Contract Freeze

## 1. Status

- Parent subphase: `SaaS-03B-E`
- Checkpoint: `SaaS-03B-E-R1`
- Business domain: `RegistrationRequest`
- Workflow family: `INVITATION_REGISTRATION_REQUEST_LIFECYCLE`
- Checkpoint type: `documentation_only_contract_resolution`
- Implementation state: `not_started`
- Functions mutation authorized: `false`
- Firebase mutation authorized: `false`
- Package mutation authorized: `false`

This checkpoint freezes the privileged backend contract for
RegistrationRequest approval and rejection before any Functions business
implementation is authorized.

## 2. Scope

The first SaaS-03B-E implementation family is restricted to the
RegistrationRequest lifecycle.

Authoritative command order:

1. `ApproveRegistrationRequest`
2. `RejectRegistrationRequest`

Membership participates only as a dependency of approval.

Course and Enrollment are outside this checkpoint.

## 3. Canonical RegistrationRequest lifecycle

`RegistrationRequestStatus` is independent from `AccessState`.

Canonical statuses remain:

- `pending`
- `approved`
- `rejected`
- `cancelled`
- `expired`

The backend commands frozen by this checkpoint cover:

- `pending -> approved`
- `pending -> rejected`

Approval and rejection are terminal transitions for the reviewed request.

An approved RegistrationRequest cannot subsequently be rejected, cancelled,
or expired.

A rejected RegistrationRequest cannot subsequently be approved.

No new RegistrationRequest status is introduced by SaaS-03B-E-R1.

## 4. Authority

Both privileged review commands require:

- actor role: `tenant_admin`
- capability: `registration_request.review`
- execution authority: `trusted_backend`

Direct client execution is not authorized.

Firestore Rules do not become the authority for these lifecycle mutations.

The backend must validate actor authority before applying either transition.

## 5. ApproveRegistrationRequest

### 5.1 Intent

`ApproveRegistrationRequest` converts one valid pending
RegistrationRequest into an approved RegistrationRequest and must jointly
establish exactly one compatible approved Membership.

### 5.2 Required preconditions

The authoritative implementation must validate, at minimum:

- target Tenant exists;
- target Tenant is compatible with the operation;
- target RegistrationRequest exists;
- RegistrationRequest belongs to the target Tenant;
- RegistrationRequest is currently `pending`, unless an exact valid replay is
  being evaluated;
- target Identity exists and is compatible with approval;
- actor has the required tenant-scoped authority;
- actor has `registration_request.review`;
- no incompatible Membership already exists for the target tenant + uid;
- uniqueness projections are consistent before mutation.

### 5.3 Atomic write family

Approval is a critical cross-root transactional operation.

Its logical transaction boundary includes the authoritative state required to
keep consistent:

- RegistrationRequest;
- `registrationRequestKeys/{uidKey}`;
- Membership;
- `membershipKeys/{uidKey}`;
- required audit result/event according to the privileged backend contract.

The approval operation must not publish an approved RegistrationRequest
without the corresponding Membership state required by the frozen domain
contract.

The approval operation must not create duplicate Memberships for the same
tenant + uid.

### 5.4 Membership dependency

Successful approval must result in exactly one compatible Membership.

The Membership created by approval is born in the canonical approved state.

Membership lifecycle implementation beyond the creation dependency is not
part of this checkpoint.

### 5.5 Idempotency and replay

The implementation must distinguish:

- first successful execution;
- exact successful replay;
- conflicting replay;
- stale transition;
- incompatible pre-existing Membership;
- uniqueness conflict.

A retry must not duplicate Membership or key documents.

The eventual implementation must define deterministic result semantics for
successful replay before the command is exposed through an entrypoint.

## 6. RejectRegistrationRequest

### 6.1 Intent

`RejectRegistrationRequest` converts one valid pending
RegistrationRequest into `rejected`.

Rejection never creates Membership.

### 6.2 Required preconditions

The authoritative implementation must validate, at minimum:

- target Tenant exists;
- target RegistrationRequest exists;
- RegistrationRequest belongs to the target Tenant;
- RegistrationRequest is `pending`, unless an exact valid replay is being
  evaluated;
- actor has the required tenant-scoped authority;
- actor has `registration_request.review`.

### 6.3 Transaction boundary

Rejection must preserve consistency between:

- RegistrationRequest;
- `registrationRequestKeys/{uidKey}`;
- required audit result/event according to the privileged backend contract.

No Membership or `membershipKeys` creation is authorized by rejection.

### 6.4 Idempotency and replay

The implementation must distinguish:

- first successful rejection;
- exact successful replay;
- conflicting replay;
- stale transition;
- already-approved request;
- cancelled or expired request.

Rejection must never reverse an approved RegistrationRequest.

## 7. registrationRequestKeys

`registrationRequestKeys/{uidKey}` remains an internal backend-controlled
projection.

It is not a client write surface.

The implementation must preserve its lifecycle coherently with the
RegistrationRequest state and the existing physical model.

No new client permission is authorized by this checkpoint.

## 8. membershipKeys

`membershipKeys/{uidKey}` remains an internal backend-controlled uniqueness
and lookup projection.

Approval may create or reconcile the key only as part of the atomic Membership
creation contract.

Rejection must not create a membership key.

No direct client access is authorized.

## 9. Atomicity requirements

`ApproveRegistrationRequest` requires cross-root transactional consistency.

The operation must not allow any observable committed state equivalent to:

- approved Request without required Membership;
- Membership without the corresponding approved Request;
- duplicate Membership for tenant + uid;
- Membership key without compatible Membership;
- incompatible request key state;
- partial success caused by retry.

`RejectRegistrationRequest` must atomically preserve Request and request-key
consistency.

## 10. Failure classes to preserve

The future implementation must use the existing privileged backend error and
result architecture.

At minimum, implementation planning must account for:

- invalid input;
- not found;
- unauthorized actor;
- missing capability;
- invalid lifecycle transition;
- stale state;
- uniqueness conflict;
- incompatible Membership;
- idempotent replay;
- conflicting replay;
- transaction conflict;
- persistence failure.

This document does not introduce a new public error taxonomy.

## 11. Security boundary

The following remain unchanged:

- client writes to privileged RegistrationRequest lifecycle state are not
  authorized;
- `registrationRequestKeys` remains backend-controlled;
- `membershipKeys` remains backend-controlled;
- Membership creation caused by approval is trusted-backend authority;
- Firebase configuration and Rules are not modified by this checkpoint.

## 12. Implementation boundary

After this documentation checkpoint is reviewed and closed, implementation
must proceed incrementally.

The first implementation candidate is:

`ApproveRegistrationRequest`

`RejectRegistrationRequest` remains second.

Implementation must not begin merely because this document exists. A separate
human-reviewed implementation gate is required.

## 13. Explicit exclusions

SaaS-03B-E-R1 does not authorize:

- Course implementation;
- Enrollment implementation;
- general Membership lifecycle implementation;
- UI changes;
- React changes;
- Provider changes;
- Firebase Rules changes;
- Firebase index changes;
- Storage Rules changes;
- package contract mutation;
- Functions entrypoint exposure;
- deployment;
- npm publication.

## 14. Required validation before implementation authorization

Before `ApproveRegistrationRequest` implementation is authorized, the next
gate must verify:

- canonical status parity;
- transition parity;
- actor parity;
- `registration_request.review` capability parity;
- approval cross-root dependency;
- rejection no-Membership invariant;
- registrationRequestKeys lifecycle;
- membershipKeys uniqueness dependency;
- atomicity requirements;
- idempotency/replay requirements;
- existing repository compatibility;
- absence of conflicting backend implementation;
- clean Git baseline.

## 15. Checkpoint result

`SaaS-03B-E-R1 = contract_authored_pending_validation`

`ApproveRegistrationRequest = contract_frozen_pending_validation`

`RejectRegistrationRequest = contract_frozen_pending_validation`

`Membership = dependency_only`

`Course = out_of_scope`

`Enrollment = out_of_scope`

`Implementation = not_authorized`

The next gate is a documentation and architecture validation of this contract
freeze. No runtime implementation is authorized until that gate passes.
