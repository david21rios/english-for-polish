# SaaS-03A.4A — MembershipRepository contract and query audit

## 1. Purpose and sources

This audit determines the Membership persistence, security, and query boundary
before any repository code exists. It is documentation-only: no repository,
test, Rule, index, workflow, Firebase configuration, package, or Domain file is
created or changed.

The requested source names `DOMAIN_MODEL.md`, `ARCHITECTURE_FREEZE.md`,
`FIRESTORE_WRITE_AUTHORITY_MODEL.md`, and `FIRESTORE_SECURITY_REVIEW_GATE.md`
do not exist under those literal names. Their authoritative current equivalents
were audited: the frozen domain model documents headed by
`DOMAIN_MODEL_ORGANIZATION.md`, `DOMAIN_MODEL_AUTHORIZATION.md`, and
`DOMAIN_WORKFLOW.md`; `ARCHITECTURE_FREEZE_REVIEW.md`;
`FIRESTORE_WRITE_AUTHORITY_AND_CONCURRENCY.md`; and
`FIREBASE_SECURITY_REVIEW_GATE.md`. All other requested persistence, query,
Rules, repository, roadmap, source, test, package, and Firebase files were
reviewed in their current local form.

## 2. Physical contract and paths

Canonical root:

```text
tenants/{tenantId}/memberships/{membershipId}
```

Related internal lookup:

```text
tenants/{tenantId}/membershipKeys/{uidKey}
uidKey = u1_<base64url(UTF-8(uid), no padding)>
```

`membershipKeys` is an internal uniqueness/lookup projection. It is not a
Membership root, is client deny-all, and must not be exposed by the repository.

| Field | Physical type | Required | Nullable | Conditional | Immutable | Authority |
|---|---|---:|---:|---:|---:|---|
| membershipId | string | yes | no | no | yes | approval backend; equals document ID |
| tenantId | string | yes | no | no | yes | approval backend; equals parent Tenant ID |
| uid | string | yes | no | no | yes | approval backend/Auth identity reference |
| role | MembershipRole | yes | no | state-independent | client-immutable | trusted workflow backend |
| status | MembershipStatus | yes | no | lifecycle | client-immutable | trusted workflow backend |
| originRequestId | string or null | yes physically | yes | value exists when request-origin correlation is available | yes | approval backend |
| createdAt | Firestore Timestamp | yes | no | no | yes | trusted backend/server time |
| approvedAt | Firestore Timestamp | yes | no | no | yes | approval backend/server time |
| approvedBy | string UID | yes | no | no | yes | approval backend |
| updatedAt | Firestore Timestamp | yes | no | no | no | trusted workflow backend/server time |
| suspendedAt | Firestore Timestamp or null | yes physically | yes | lifecycle | state-bound | trusted workflow backend |
| removedAt | Firestore Timestamp or null | yes physically | yes | lifecycle | state-bound | trusted workflow backend |

The frozen pure Domain Membership exposes nine business fields and does not
contain `originRequestId`, `suspendedAt`, or `removedAt`. The later physical
model explicitly materializes those three fields for correlation and lifecycle
history. This is a documented physical projection, not a silent Domain change.
No maps or arrays are present.

## 3. States, roles, and lifecycle

Canonical statuses are exactly `approved`, `suspended`, and `removed`.
Membership is born `approved`; `removed` is terminal. Canonical roles are
exactly `student`, `teacher`, and `tenant_admin`. `platform_admin`, legacy
`admin`, platform roles, request actors, and system actors are not Membership
roles and must be rejected by serialization.

| Status | Lifecycle requirements | Client read | Client write | Transitions and authority |
|---|---|---|---|---|
| approved | approvedAt/approvedBy present; removedAt null; suspendedAt null initially or retained as last suspension after restore | owner history read | deny | born from approved request; tenant backend may suspend or change role; restored from suspended by tenant backend |
| suspended | approvedAt/approvedBy present; suspendedAt non-null; removedAt null | owner history read | deny | from approved; tenant backend may restore or remove; owner leave remains backend command |
| removed | approvedAt/approvedBy present; removedAt non-null; suspendedAt may be null or retain the last suspension | owner history read | deny | from approved or suspended; terminal; key removed atomically by backend |

`createdAt`, `approvedAt`, and `approvedBy` remain historical. `updatedAt`
changes on trusted transitions. The physical phrase “last suspension” supports
retaining `suspendedAt` after restoration/removal; the repository serializer
must not invent a stricter clearing rule.

## 4. Ownership and Rules result

Self ownership is `resource.data.uid == request.auth.uid`. Tenant-scoped reads
also require `resource.data.tenantId == tenantId` from the path. Point reads
add exact `resource.data.membershipId == membershipId` and canonical full-path
equality. IDs remain explicit, opaque, validated, and unnormalized.

Current Rules authorize:

| Shape | Result |
|---|---|
| authenticated owner point get, any canonical status, any Tenant status | ALLOW |
| foreign or anonymous point get | DENY |
| tenant list constrained to self uid and embedded tenantId | ALLOW |
| tenant broad/foreign-uid/admin list | DENY |
| collection-group list constrained to self uid | ALLOW |
| broad/foreign/anonymous collection-group list | DENY |
| create/update/delete, including leave self | DENY |
| membershipKeys read/write | DENY |
| direct platform_admin bypass | DENY |

Self Membership reads deliberately do not require Tenant active/suspended, an
approved Membership, or a particular role. Thus owners can read their own
approved, suspended, or removed history even under an active, suspended, or
archived Tenant. This does not grant tenant-resource authorization: the separate
tenant access helper still requires approved Membership and non-archived Tenant.
The repository must not read Identity, Tenant, or membershipKeys to reproduce
Rules and must not accept UI state as authority.

## 5. Operation classification

| Candidate | Classification | Decision |
|---|---|---|
| getOwnMembership(tenantId, membershipId, uid) | CLIENT_SELF | Rules-compatible point read; proposed public operation |
| listOwnMembershipsForTenant(tenantId, uid, options) | DEFERRED | Rules permit the closed self shape, but no dedicated complete Query Contract/index/options contract exists; historical multiplicity makes it nontrivial |
| listOwnMembershipsAcrossTenants(uid, options) | CLIENT_SELF after R1 | FQ-MEM-003 and Rules support the mandatory self collection-group shape; pagination/cursor/index details remain blocked |
| tenant-admin reads of foreign Memberships | DEFERRED/RULES_POLICY_BLOCKER | FQ-MEM-004 describes them, but current Rules deny them |
| platform-admin client reads | DENY | no direct bypass or client contract |
| create/approve/changeRole/suspend/restore/remove/leave/delete/key repair | BACKEND_ONLY | multi-root integrity, lifecycle, audit, timestamps, and lookup atomicity |

There is no autonomous `createMembership`: approval creates Membership and its
key atomically. Client leave remains backend-only despite its self capability.

## 6. Query Contract inventory

| ID | Purpose | Actor/scope | Filters/order | Classification | Implementation status |
|---|---|---|---|---|---|
| FQ-MEM-001 | Membership point read | self/tenant/system | membershipId point read | CLIENT_SELF only for owner; other actors backend/deferred | point client-ready |
| FQ-MEM-002 | key then Membership lookup | self/system | uidKey point reads | BACKEND_ONLY because key is client deny-all | excluded |
| FQ-MEM-003 | own contexts across Tenants | identity_self collection-group | uid==self mandatory; optional status/role; createdAt DESC, full path DESC; Standard | CLIENT_SELF, but options/index/cursor unresolved | blocked pending R1 |
| FQ-MEM-004 | Tenant member administration | tenant_admin tenant collection | optional status/role; createdAt DESC, full path DESC; Administrative | DEFERRED/RULES_POLICY_BLOCKER | not client-safe now |
| FQ-MEM-005 | suspended/removed history | self/admin scoped | status `in`; updatedAt DESC, full path DESC | DEFERRED; self binding and current Rules-compatible shapes are not closed | blocked pending R1/Rules policy |
| FQ-MEM-006 | authorization after key | system | point reads, status/role in memory | SYSTEM_ONLY | excluded |
| FQ-MEM-007 | lifecycle and uniqueness point set | admin/self/system | Membership/key points | BACKEND_ONLY | excluded |

The Rules-compatible tenant-scoped self list has no dedicated FQ-MEM entry with
closed order, options, cursor, and index. It must be resolved explicitly rather
than inferred from FQ-MEM-003.

## 7. Filters, order, pagination, and cursor

Every self list must enforce `uid == expected authenticated UID`. Tenant-scoped
self additionally uses the explicit Tenant collection path; Rules evaluate the
embedded `tenantId` against that path, and the serializer must enforce the same
comparison fail-closed. A redundant `tenantId` query equality is not required.
Broad queries, raw constraints, arbitrary order,
arbitrary UID, offset, `!=`, `not-in`, and client-supplied where/order clauses
are prohibited.

FQ-MEM-003 currently permits omitted status or one/more unspecified status
shape and mentions optional role, but the exact options allowlist is not closed.
FI-CG-002 covers a status variant while explicitly deferring the role variant.
Therefore neither status-list semantics nor role filtering is approved for
implementation in this phase.

The documented primary order for FQ-MEM-003 is `createdAt DESC`, then full
document path/`documentId()` DESC. FQ-MEM-005 uses `updatedAt DESC`, then full
path DESC. No tenant-scoped self order is explicitly approved.

The general query model labels Membership self listing “Standard” but states
that page categories have no numeric quantities. RegistrationRequest's later
`MIN=1`, `DEFAULT=20`, `MAX=50`, limit-plus-one, cursor policy, and base64url
envelope were resolved specifically for RegistrationRequest and cannot be
silently reused. Membership has no final numeric page size, limit-plus-one
decision, query-kind schema, binding, policy version, encoding limit, or
malformed/incompatible cursor classification. These are mandatory R1 outputs.

## 8. Index audit

| ID | Scope/group | Fields | Contract | Materialized | Required/status |
|---|---|---|---|---:|---|
| FI-CG-001 | COLLECTION_GROUP memberships | uid ASC, createdAt DESC, implicit name direction | FQ-MEM-003 without status | no | required conceptually |
| FI-CG-002 | COLLECTION_GROUP memberships | uid ASC, status ASC, createdAt DESC; role variant deferred | FQ-MEM-003 with status | no | required conceptually; role unresolved |
| FI-MEM-001 | COLLECTION memberships | status ASC, createdAt DESC | FQ-MEM-004 | no | admin only; current Rules blocker |
| FI-MEM-002 | COLLECTION memberships | role ASC, createdAt DESC | FQ-MEM-004 | no | admin only; current Rules blocker |
| FI-MEM-003 | COLLECTION memberships | status ASC, role ASC, createdAt DESC | FQ-MEM-004 | no | admin only; current Rules blocker |
| FI-MEM-004 | COLLECTION memberships | status ASC, updatedAt DESC | FQ-MEM-005 | no | history contract unresolved |

`firestore.indexes.json` contains only four RegistrationRequest indexes. No
Membership index is materialized, equivalent, duplicate, or conflicting. Point
reads use built-in document lookup. Any new tenant-scoped self query may require
new conceptual/material indexes after its exact shape is approved.

## 9. Read budget

| Operation | SDK reads | Rules access calls | N+1/dependencies |
|---|---|---|---|
| owner point get | one document read if allowed/existing | zero `get/exists`; target resource only | no Tenant, key, Identity, or extra Membership read |
| tenant self list | one bounded query; billed returned document reads | zero related-document access calls | no N+1; explicit Tenant path only |
| collection-group self list | one bounded query; billed returned document reads | zero related-document access calls | no N+1, fan-out, key, Tenant, or Identity dependency |

Pagination must cap result reads; the exact maximum remains blocked. There is
no repository cache contract. Rules helper calls used to authorize other Tenant
resources are not part of these self Membership read rules.

## 10. Planned serialization, dependencies, API, and tests

The future serializer must use the exact 12-field physical allowlist, require
all physical keys with only `originRequestId`, `suspendedAt`, and `removedAt`
nullable, validate enums and lifecycle, convert Firestore timestamps to
canonical ISO-8601, validate snapshot/path/data IDs and expected UID/Tenant,
reject unknown/missing fields and nested objects/arrays, preserve null, return
a new frozen object, and expose no snapshot, reference, Timestamp, or SDK data.
It is fail-closed validation, not authorization.

Point-read dependencies would be `db`, `doc`, and `getDoc`. Approved lists would
add only the functions demanded by R1: likely `collection`, `collectionGroup`,
`query`, `where`, `orderBy`, `documentId`, `limit`, `startAfter`, and `getDocs`.
No write function is permitted.

Provisional API after R1:

```text
createMembershipRepository(dependencies)
getOwnMembership(tenantId, membershipId, uid)
listOwnMembershipsAcrossTenants(uid, options)
```

`listOwnMembershipsForTenant` remains deferred until R1 proves its need and
complete query shape. No administrative method is proposed.

Future tests cover: all three statuses and roles; every lifecycle combination;
physical allowlist, required/null fields and timestamps; ID/Tenant/UID mismatch;
immutability and SDK isolation; point self/foreign/anonymous/nonexistent; all
Tenant and Membership statuses; closed query filters; empty/multi-page ordering;
cursor binding; cross-Tenant/cross-UID denial; collection-group self/broad
denial; client create/update/delete/role/status/leave denial; key deny-all; and
tenant/platform-admin broad-read denial. Runtime remains Firestore-only and
uses a demo project after implementation and index materialization.

## 11. Risks, blockers, sequence, and decision

Risks include collection-group leakage if UID binding is omitted, same-named
future collections under the recursive Rule, physical-versus-domain projection
confusion, stale/unsigned cursors, concurrent movement between pages, missing
indexes, historical documents with inconsistent lifecycle, and assuming an
admin capability that current Rules do not grant.

Blocking classifications:

- `QUERY_CONTRACT_BLOCKER`: tenant-scoped self list and FQ-MEM-005 shapes are
  not operationally closed; FQ-MEM-003 status/role options are ambiguous;
- `PAGINATION_CONTRACT_BLOCKER`: Standard has no Membership numeric sizes or
  limit-plus-one decision;
- `CURSOR_CONTRACT_BLOCKER`: no Membership-specific versioned contract;
- `INDEX_CONTRACT_BLOCKER`: role variant and tenant-self indexes are unresolved,
  and no Membership index is materialized;
- `RULES_POLICY_BLOCKER`: tenant-admin client reads in FQ-MEM-004 are denied by
  current Rules.

The physical contract, lifecycle, roles, ownership, self point read, and self
collection-group security boundary are otherwise sufficiently defined.

Required sequence:

```text
SaaS-03A.4A-R1 — Membership query, pagination, cursor, admin-policy and index contract resolution
SaaS-03A.4B — MembershipRepository client-safe implementation
SaaS-03A.4B-C1 — review and controlled commits
SaaS-03A.4I — Membership index materialization, if approved
SaaS-03A.4R-A — Firestore-only runtime suite
SaaS-03A.4R-B — CI/runtime closure
```

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_pending_contract_resolution
SaaS-03A.4A-R1 = required_not_started
SaaS-03A.4B = blocked
MembershipRepository = not_created
```

```text
SaaS-03A.4A MembershipRepository contract and query audit = INCOMPLETE
```

## 12. R1 contractual resolution

R1 resolves the audit blockers without changing Rules or expanding the client
boundary. FQ-MEM-004 and administrative slices remain explicitly deferred;
system/key/lifecycle contracts remain backend/system-only. The three self APIs
now have exact filters, four status/role combinations, deterministic
`createdAt DESC` plus document-ID ordering, 1/20/50 page sizes, limit-plus-one,
immutable results, a Membership-specific portable cursor, and eight future
self indexes.

The prior `INCOMPLETE` decision above is retained as historical audit evidence
and is superseded by `SAAS_03A_4A_R1_MEMBERSHIP_QUERY_PAGINATION_CONTRACT.md`.

```text
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed_pending_human_contract_review
SaaS-03A.4B = ready_not_started
MembershipRepository = not_created
```

## 13. Implementation and review outcome

R1 was approved and 03A.4B implemented the three client-self operations. The
C1 review confirmed the physical projection, lifecycle, roles, ownership,
Rules compatibility, query shapes, and cursor contract. It corrected one
tenant-scoped result-path consistency gap and expanded focused unit coverage to
23 tests. Administrative, platform, key, lifecycle-write, and broad-read
surfaces remain excluded. Membership indexes remain local-materialization work
for 03A.4I.

```text
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed_pending_human_push
MembershipRepository = implemented_shadow
SaaS-03A.4I = ready_not_started
```

## 14. Index materialization outcome

The eight self-query indexes resolved by R1 are now present locally in
`firestore.indexes.json`: FI-MEM-005–008 and FI-CG-001/002/006/007. The four
pre-existing RegistrationRequest indexes and `fieldOverrides` are preserved.
No administrative Membership index was added and no deploy or runtime occurred.

```text
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
```

## 15. Runtime suite preparation outcome

The 03A.4R-A suite statically covers the approved CLIENT_SELF surface and
directly exercises DENY-only Membership writes, key access, and unsafe query
shapes. It adds no administrative API and changes no Rules or indexes.

```text
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
```
