# Firestore Rules: Membership and RegistrationRequest self reads

## 1. Purpose and scope

This document records the local SaaS-02C.2D implementation for least-privilege
self reads on canonical Membership and RegistrationRequest documents. It does
not authorize writes, administrative lists, lookup access, backend behavior,
deployment, or any other SaaS path.

```text
Domain Version: 1.2.0
Architecture Freeze: Approved
Implementation mode: local only
Firebase deployment: not performed
```

## 2. Normative sources

- `DOMAIN_VERSION.md`
- `DOMAIN_MODEL_ORGANIZATION.md`
- `DOMAIN_MODEL_IDENTITY.md`
- `DOMAIN_MODEL_AUTHORIZATION.md`
- `DOMAIN_WORKFLOW.md`
- `FIRESTORE_PHYSICAL_MODEL.md`
- `FIRESTORE_ACCESS_PATTERNS.md`
- `FIRESTORE_QUERY_AND_INDEX_MODEL.md`
- `FIREBASE_SECURITY_REVIEW_GATE.md`
- `FIRESTORE_RULES_DESIGN.md`
- `FIRESTORE_RULES_IDENTITY_SELF_IMPLEMENTATION.md`
- `FIRESTORE_RULES_TENANT_ACCESS_IMPLEMENTATION.md`
- the frozen domain sources and the local `firestore.rules`

## 3. Physical contracts verified

Canonical Membership path:

```text
tenants/{tenantId}/memberships/{membershipId}
```

The authorization-critical fields are mandatory and immutable:
`membershipId`, `tenantId`, and `uid`. The physical document also contains
`role`, `status`, `originRequestId`, `createdAt`, `approvedAt`, `approvedBy`,
`updatedAt`, `suspendedAt`, and `removedAt` according to lifecycle. Conditional
fields are not required by the read rule.

Canonical RegistrationRequest path:

```text
tenants/{tenantId}/registrationRequests/{requestId}
```

The authorization-critical fields are mandatory and immutable: `requestId`,
`tenantId`, and `uid`. The physical document also contains `requestedRole`,
`status`, `requestedAt`, `reviewedAt`, `reviewedBy`,
`approvedMembershipId`, `cancelledAt`, and `expiredAt` according to lifecycle.
The physical contract uses `requestedAt`; it does not require generic
`createdAt` or `updatedAt` fields for this root.

## 4. SaaS self helpers

The following local helpers were added independently of all legacy helpers:

- `saasResourceBelongsToAuthenticatedUser()`;
- `saasResourceBelongsToTenant(tenantId)`;
- `saasMembershipDocumentIsCanonical(tenantId, membershipId)`;
- `saasRegistrationRequestDocumentIsCanonical(tenantId, requestId)`;
- `saasCanReadOwnMembership(tenantId, membershipId)`;
- `saasCanReadOwnRegistrationRequest(tenantId, requestId)`;
- `saasCanListOwnResourceInTenant(tenantId)`;
- `saasCanListOwnMembershipCollectionGroup()`;
- `saasCanListOwnRegistrationRequestCollectionGroup()`.

They use only authentication, embedded immutable ownership fields, document
IDs, and the canonical document path. Missing or malformed ownership fields
make evaluation fail closed. They do not use `users/{uid}`, email,
`isAdmin()`, `DEFAULT_ADMINS`, Identity reads, platform claims, or lookup
documents.

## 5. Membership reads

### 5.1 Point get

An authenticated Identity may get a Membership only when all these facts hold:

- `resource.data.uid == request.auth.uid`;
- `resource.data.tenantId == tenantId` from the path;
- `resource.data.membershipId == membershipId` from the path;
- the full resource path equals the canonical Membership path.

The rule deliberately does not require `status == approved`. The owner may
read an own `approved`, `suspended`, or `removed` Membership for status and
history. This does not make a non-approved Membership valid operational
authorization; the existing Tenant helper continues to require `approved`.

### 5.2 Tenant-scoped list

Tenant-scoped lists use the same ownership and canonical-document condition.
Because Firestore Rules are not post-query filters, a future query must prove
both ownership predicates:

```text
where uid == currentUid
where tenantId == tenantIdFromContext
```

A list without the self `uid` constraint, a list for another UID, or an
administrative list cannot prove the rule and is denied.

### 5.3 Collection-group self list

Rules version 2 uses an explicit recursive wildcard match for collection ID
`memberships`. It grants only `list` and validates
`uid == request.auth.uid`. The collection ID is reserved exclusively for the
canonical Membership hierarchy: source inspection found no other functional
collection with this ID, and client writes through the recursive match remain
denied. Adding another collection named `memberships` outside the canonical
hierarchy is prohibited unless this security decision is reviewed.

Canonical future query:

```text
collectionGroup("memberships") where uid == currentUid
```

No other functional `memberships` collection exists in the current source or
approved topology. The recursive match grants no write operation.

## 6. RegistrationRequest reads

### 6.1 Point get

An authenticated Identity may get a Request only when its `uid`, `tenantId`,
`requestId`, and full resource path agree with the authenticated actor and the
canonical path. Own `pending`, `approved`, `rejected`, `cancelled`, and
`expired` Requests remain readable as history.

### 6.2 Tenant-scoped list

The future tenant-scoped query must constrain both:

```text
where uid == currentUid
where tenantId == tenantIdFromContext
```

Status-only, unfiltered, foreign-UID, and administrative lists are denied.

### 6.3 Collection-group self list

The explicit version-2 recursive wildcard rule grants only `list` and requires
the self UID. The collection ID is reserved for
`tenants/{tenantId}/registrationRequests/{requestId}`. No other functional
`registrationRequests` collection exists in current source or the approved
topology, and introducing one requires a Rules review.

Canonical future query:

```text
collectionGroup("registrationRequests") where uid == currentUid
```

## 7. Get versus list and overlapping matches

`get` and `list` are declared separately in each tenant-scoped block. The two
recursive collection-group matches authorize only `list`; the nested canonical
matches authorize self `get` and constrained self `list`. Where both list
matches overlap, both impose authentication and UID ownership; the nested
tenant-scoped match additionally imposes embedded tenant consistency. Point
gets additionally enforce embedded document-ID and canonical-path consistency.
Neither match grants writes. The final catch-all remains deny-all; Rules allow
conditions are additive, so the explicit positive rules must remain equally
narrow wherever they overlap.

No legacy match uses the `memberships` or `registrationRequests` collection
IDs.

## 8. Writes and lookup documents

Membership `create`, `update`, and `delete` remain denied. This includes role
and lifecycle commands, including self LeaveMembership, because key lifecycle,
idempotency, audit, and history require trusted backend authority.

RegistrationRequest `create`, `update`, and `delete` remain denied. Self create
and cancel remain backend commands because RegistrationPolicy,
`registrationRequestKeys`, uniqueness, timestamps, idempotency, and audit must
be enforced atomically.

Both lookup collections remain completely inaccessible to clients:

```text
tenants/{tenantId}/membershipKeys/{uidKey}
tenants/{tenantId}/registrationRequestKeys/{uidKey}
```

## 9. Tenant status, roles, and platform access

Self document reads do not require an active Tenant or a particular Membership
role. That separation preserves access to status and history without granting
institutional operation. No role permits reading another Identity's document.
No direct `platform_admin` or legacy-admin bypass was added.

## 10. Query Contracts and indexes

- Membership point/self reads: `FQ-MEM-001`; cross-tenant self list:
  `FQ-MEM-003`.
- RegistrationRequest point/self reads: `FQ-RRQ-001`; tenant self list:
  `FQ-RRQ-002`; cross-tenant self list: `FQ-RRQ-003`.
- Membership collection-group indexes: `FI-CG-001` and optional-status
  `FI-CG-002`.
- RegistrationRequest collection-group indexes: `FI-CG-003` and
  optional-status `FI-CG-004`.
- Tenant-scoped Request indexes are `FI-RRQ-001` and `FI-RRQ-002` when the
  documented ordering/status combinations are used.

The collection-group ordered queries require the documented composite indexes;
their JSON materialization remains pending. This phase does not modify
`firestore.indexes.json`.

## 11. Rules read budget

Self Membership and RegistrationRequest authorization uses the target
`resource` only. It performs zero related-document `get()` or `exists()` reads.
Collection-group authorization likewise avoids Tenant, Identity, and lookup
reads. This keeps the rule-access budget bounded and compatible with queries.

## 12. Preserved areas

```text
Membership self reads enabled locally.
RegistrationRequest self reads enabled locally.
Collection-group self queries enabled only with UID ownership constraints.
All Membership and RegistrationRequest writes remain backend-only.
Lookup documents remain inaccessible to clients.
Identity and Tenant Rules remain semantically unchanged.
Legacy Rules remain semantically unchanged.
No Firebase deployment was performed.
```

Settings, Branding, Courses, Enrollments, and platform access retain their
previous deny posture. Tenant read semantics and Identity self semantics are
unchanged. Storage remains deny-all.

## 13. Risks and limitations

- Rules are not filters. Consumers must use the canonical UID constraints;
  incompatible queries fail rather than return a filtered subset.
- Collection-group matches cover every collection with the same ID. The two
  IDs are reserved to their canonical SaaS hierarchies; introducing a
  same-named collection elsewhere would require a security redesign.
- Composite indexes are documented but not materialized in this phase.
- No local Firebase Rules parser or emulator validation is assumed; structural
  validation and mandatory human review remain required.

No `FRD-005` finding is required: source and topology audits establish the two
collection IDs as exclusive canonical SaaS names. Their recursive matches are
self-only and cannot write; that reservation is now an explicit security
invariant.

## 14. Future Rules test cases

Membership:

- anonymous cannot get Membership;
- owner can get own approved, suspended, and removed Membership;
- owner cannot get another user's Membership;
- user cannot list all Tenant Memberships;
- self UID tenant query succeeds and another-UID query fails;
- collection-group own-UID query succeeds and an unfiltered query fails;
- client cannot create, update, or delete Membership.

RegistrationRequest:

- anonymous cannot get RegistrationRequest;
- owner can get own pending and terminal Requests;
- owner cannot get another user's Request;
- user cannot list all Tenant Requests;
- self UID tenant query succeeds and another-UID query fails;
- collection-group own-UID query succeeds and an unfiltered query fails;
- client cannot create, update, or delete Request.

Lookups:

- client cannot read `membershipKeys`;
- client cannot read `registrationRequestKeys`.

These cases are documentation only. `tests/rules/` was not changed.

## 15. Closure criteria and next phase

The local implementation satisfies the SaaS-02C.2D criteria when static review
confirms canonical ownership, get/list separation, no writes, safe recursive
matches, inaccessible lookups, preserved Identity/Tenant/legacy semantics, and
an unchanged final catch-all.

SaaS-02C.2E is not started. Mandatory human review of these local Membership
and RegistrationRequest self Rules is required before it may begin. Deployment
is prohibited.
