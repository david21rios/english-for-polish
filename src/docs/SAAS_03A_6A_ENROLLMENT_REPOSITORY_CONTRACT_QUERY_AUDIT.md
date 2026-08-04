# SaaS-03A.6A — EnrollmentRepository contract and query audit

## 1. Purpose and scope

This audit closes the pre-implementation analysis of `EnrollmentRepository`.
It reconciles Domain 1.2.0, Architecture Freeze, the physical Firestore model,
current Rules, query/index contracts and the repository patterns already used by
Identity, Tenant, RegistrationRequest, Membership and Course.

No repository, Rules, index, test, runtime, workflow or client integration is
created in this phase. `EnrollmentRepository` remains `not_created`.

## 2. Normative sources

The audit used the Domain 1.2.0 academic, organization, authorization and
workflow contracts; `ARCHITECTURE_FREEZE_REVIEW.md`; `PERSISTENCE_MODEL.md`;
`FIRESTORE_PHYSICAL_MODEL.md`; `FIRESTORE_ACCESS_PATTERNS.md`;
`FIRESTORE_QUERY_AND_INDEX_MODEL.md`;
`FIRESTORE_WRITE_AUTHORITY_AND_CONCURRENCY.md`; the security review and Rules
design/implementation records; `firestore.rules`; `firestore.indexes.json`; and
the existing SaaS repositories and their tests as architectural precedents.
The current implementation order and tenant-aware scope were also reconciled.

## 3. Architectural findings

- Enrollment is an independent Persistence Root representing the N:M relation
  between Membership and Course. It is not embedded in either root.
- Tenant is the definitive owner and `tenantId` is the only institutional
  boundary. Membership, Course and Enrollment must share it.
- The canonical document path is
  `tenants/{tenantId}/enrollments/{enrollmentId}`.
- Enrollment stores references only. It contains no UID, profile, Course
  snapshot, progress, grades, attendance or certification data.
- The relationship does not cascade: Membership removal and Course archival
  preserve Enrollment history.
- No `enrollmentKeys` root or uniqueness constraint is approved. Re-enrollment
  semantics remain unresolved; membership-plus-course lookup is not proof of
  uniqueness.

## 4. Physical model

The persisted contract is the nine-field shape defined by the physical model:

| Field | Type | Required | Nullable | Immutable | Authority |
| --- | --- | ---: | ---: | ---: | --- |
| `enrollmentId` | non-empty opaque string | yes | no | yes | backend/system |
| `tenantId` | non-empty opaque string | yes | no | yes | backend/system |
| `membershipId` | non-empty opaque string | yes | no | yes | backend/system |
| `courseId` | non-empty opaque string | yes | no | yes | backend/system |
| `status` | EnrollmentStatus | yes | no | lifecycle-controlled | backend/system |
| `enrolledAt` | timestamp | yes | no | yes | backend/system |
| `updatedAt` | timestamp | yes | no | lifecycle-controlled | backend/system |
| `completedAt` | timestamp or null | yes | yes | lifecycle-controlled | backend/system |
| `cancelledAt` | timestamp or null | yes | yes | lifecycle-controlled | backend/system |

The pure Domain typedef lists the seven core fields and omits the two physical
lifecycle timestamps. This is not permission to omit them from persisted
documents: serialization must follow the authoritative physical shape while
returning canonical UTC ISO-8601 strings and no SDK objects.

All unknown fields must fail closed. IDs must agree with the expected Tenant,
document ID and canonical path. Returned objects must be fresh and frozen.

## 5. Status and lifecycle

Canonical states are `pending`, `active`, `completed` and `cancelled`.

| State | `completedAt` | `cancelledAt` | Allowed transition |
| --- | --- | --- | --- |
| `pending` | null | null | active or cancelled |
| `active` | null | null | completed or cancelled |
| `completed` | timestamp | null | terminal |
| `cancelled` | null | timestamp | terminal |

CreateEnrollment requires an active Tenant, approved Membership and active
Course in the same Tenant, and creates `pending`. Administrative transitions
and self cancellation are business capabilities, but current client Rules deny
all Enrollment writes. They therefore remain trusted-backend operations.

Course archival does not rewrite Enrollment. The detailed operational effect on
an already active Enrollment remains a residual backend policy decision; it does
not block historical read contracts.

## 6. Ownership and relations

Definitive ownership is `Tenant`, expressed by the document parent and embedded
`tenantId`. Self ownership is derived, never copied: the referenced
`tenants/{tenantId}/memberships/{membershipId}` must be canonical and its `uid`
must equal `request.auth.uid`.

`membershipId` and `courseId` are immutable same-Tenant references. A read-only
repository must not fetch Membership or Course to reproduce authorization or to
join data. Rules remain the authorization authority; cross-root validation is a
backend CreateEnrollment responsibility.

## 7. Current Rules compatibility

The nested Enrollment match allows `get` and `list` and denies `create`,
`update` and `delete`.

| Actor/context | Point get | List | Notes |
| --- | --- | --- | --- |
| Self, Membership approved/suspended/removed | allow | allow when membership-scoped | historical ownership; all four Enrollment states |
| Self, Tenant active | allow | allow | normal and historical reads |
| Self, Tenant suspended | allow | allow | historical access only |
| Self, Tenant archived | deny | deny | fail closed |
| Approved tenant_admin, Tenant active | allow | allow | all canonical Enrollment states |
| teacher | self branch only | self branch only | broad Course cohort access is not granted |
| student | self branch only | self branch only | role does not replace ownership |
| platform_admin client | deny | deny | no platform bypass |
| anonymous/foreign Tenant | deny | deny | fail closed |

Collection-group Enrollment reads are not defined and therefore denied. Course
state is not consulted for historical Enrollment reads.

Rules access-call budgets are bounded: self reads use Tenant plus the referenced
Membership; tenant-admin reads use Tenant plus the administrator
membershipKey/Membership path. The target document is the queried resource.
The repository must perform zero auxiliary authorization reads and introduce no
N+1 behavior.

## 8. Operations

### Client-safe candidates

- point get by explicit `tenantId` and `enrollmentId`;
- list for one explicit own `membershipId` within one explicit Tenant;
- tenant-admin list within one explicit active Tenant, optionally by one exact
  canonical status, after its query shape is frozen in R1.

### Backend-only

- create Enrollment and cross-root validation;
- activate, complete and cancel transitions, including self cancellation under
  the present Rules;
- equivalent-enrollment lookup used as a workflow invariant;
- Course participant/cohort administration until authorization is explicitly
  approved;
- repair, migration, uniqueness enforcement and any cross-root transaction.

### Prohibited or deferred

- global or collection-group Enrollment query;
- arbitrary UID, role, raw SDK constraints, offset or implicit Tenant;
- teacher broad cohort access under the current Rules;
- public/anonymous reads;
- client writes of any kind;
- a generic `listEnrollments(options)` API that can manufacture unauthorized
  shapes;
- repository-side Membership/Course authorization reads;
- cross-Tenant self aggregation in the minimal repository API.

## 9. Query families and classification

| Contract | Purpose | Current classification | Audit result |
| --- | --- | --- | --- |
| FQ-ENR-001 | point get | CLIENT_SELF / CLIENT_TENANT_ADMIN | viable; built-in index |
| FQ-ENR-002 | by Membership, optional status | CLIENT_SELF / CLIENT_TENANT_ADMIN | R1 required for exact shape |
| FQ-ENR-003 | by Course, optional status | DEFERRED / BACKEND_ONLY | teacher broad authorization absent |
| FQ-ENR-004 | tenant-admin list, optional status | CLIENT_TENANT_ADMIN | R1 required for exact shape |
| FQ-ENR-005 | membership+course lookup | BACKEND_ONLY | not a uniqueness guarantee |
| FQ-ENR-006 | per-Membership self stream | CLIENT_SELF | use explicit membershipId; R1 required |
| FQ-ENR-007 | terminal owner/course history | PARTIAL / DEFERRED | ambiguous actor/filter/index variants |
| FQ-ENR-008 | CreateEnrollment validations | SYSTEM_ONLY | backend consistent read set |

Every client list must include `where("tenantId", "==", tenantId)`. Collection
path alone does not prove embedded tenant equality to Rules. A self list must
also include `where("membershipId", "==", membershipId)`; admin and self methods
must be distinct so consumers cannot choose a role or access mode.

Canonical order remains `enrolledAt DESC, documentId() DESC` for Membership and
Course streams and `updatedAt DESC, documentId() DESC` for administrative or
terminal history. Exact optional-status combinations, constraint order and
whether tenant-admin unfiltered listing is Rules-provable must be executed and
frozen in R1.

## 10. Pagination and cursor

Pagination is required for every list. Limit-plus-one, page-size bounds, result
shape and strict options validation must be frozen in R1 rather than copied by
assumption.

A tenant-scoped cursor should use a versioned opaque envelope with query kind,
binding and position. Binding must cover `tenantId`, actor-specific query kind,
`membershipId` where applicable, exact status/null, ordering and policy.
Positions use `enrolledAt` or `updatedAt` plus canonical Enrollment document
path/document ID.

The previously documented multi-membership cursor is a composition cursor with
per-stream positions and k-way merge semantics. It is not suitable for the
minimal EnrollmentRepository until membership-set stability, partial failure,
deduplication, page limits and best-effort consistency are frozen. Cross-Tenant
aggregation stays deferred to a higher composition layer.

Status: `PAGINATION_CONTRACT_BLOCKER` and `CURSOR_CONTRACT_BLOCKER` for
implementation; both are resolvable in 03A.6A-R1.

## 11. Conceptual indexes

No Enrollment composite index is materialized in `firestore.indexes.json`.
Existing conceptual entries must be reopened because they omit the mandatory
embedded `tenantId` equality used by client query shapes.

| ID | Tenant-aware candidate fields | Status |
| --- | --- | --- |
| FI-ENR-001 | tenantId ASC, membershipId ASC, enrolledAt DESC | R1 required |
| FI-ENR-002 | tenantId ASC, membershipId ASC, status ASC, enrolledAt DESC | R1 required |
| FI-ENR-003 | tenantId ASC, courseId ASC, enrolledAt DESC | deferred with Course cohort query |
| FI-ENR-004 | tenantId ASC, courseId ASC, status ASC, enrolledAt DESC | deferred with Course cohort query |
| FI-ENR-005 | tenantId ASC, status ASC, updatedAt DESC | R1 required for admin status list |
| FI-ENR-006 | tenantId ASC, membershipId ASC, courseId ASC, enrolledAt DESC | backend/query contract only |
| FI-ENR-007 | owner-or-course + status + updatedAt | ambiguous; split or defer in R1 |

All are collection-scope candidates; no Enrollment `COLLECTION_GROUP` index is
approved. `__name__` remains the implicit suffix in the direction of the final
explicit order field. No index may be materialized until implemented query
families are frozen.

## 12. Compatibility with existing repositories

The CourseRepository pattern is reusable for explicit Tenant arguments, closed
actor-specific methods, strict serializer allowlists, injected modular SDK,
limit-plus-one pagination, versioned cursors, deterministic tie-breakers,
fail-closed errors and a shadow-only rollout.

Enrollment differs materially: ownership is indirect through Membership;
suspended/removed Membership may retain historical self reads; suspended Tenant
permits self history; Course cohort access is not client-safe; and self
multi-membership aggregation is composition rather than a single query. These
differences prohibit copying Course query families mechanically.

Membership compatibility is by immutable `membershipId` within the same Tenant,
not by arbitrary UID or role. Course compatibility is by immutable `courseId`;
Course archival preserves history and no Course data is embedded or joined.

## 13. Risks and blockers

| Classification | Finding | Effect |
| --- | --- | --- |
| QUERY_CONTRACT_BLOCKER | exact self/admin filters and Rules-provable shapes not frozen | blocks implementation |
| PAGINATION_CONTRACT_BLOCKER | page bounds, options and result contract not frozen | blocks implementation |
| CURSOR_CONTRACT_BLOCKER | per-family bindings and multi-stream boundary unresolved | blocks implementation |
| INDEX_CONTRACT_BLOCKER | FI-ENR-001..007 omit tenantId; FI-ENR-007 ambiguous | blocks implementation/materialization |
| AUTHORIZATION_BLOCKER | FQ-ENR-003 teacher cohort conflicts with current Rules | method must remain deferred |
| PHYSICAL_MODEL_DIVERGENCE | Domain typedef omits physical terminal timestamps | serializer must follow nine-field physical model |
| UNIQUENESS_DEFERRED | re-enrollment policy and key topology unresolved | no uniqueness claim or key |
| OPERATIONAL_RISK | active Enrollment after Course archive | backend workflow policy remains deferred |
| COMPOSITION_RISK | global self merge is best-effort and fan-out prone | exclude from minimal repository |

None justifies weakening Rules or changing Domain 1.2.0 in this audit.

## 14. Proposed minimal API for R1 review

The only names suitable for contract resolution are:

- `createEnrollmentRepository(dependencies)`;
- `getEnrollment(tenantId, enrollmentId)`;
- `listOwnEnrollmentsForMembership(tenantId, membershipId, options)`;
- `listTenantAdminEnrollmentsForTenant(tenantId, options)`.

These are proposals, not an implementation authorization. Course cohort,
cross-Tenant self aggregation, writes and equivalent-enrollment lookup remain
deferred/backend-only.

Expected read dependencies are `db`, `doc`, `getDoc`, `collection`, `query`,
`where`, `orderBy`, `documentId`, `limit`, `startAfter` and `getDocs`. No write
SDK dependency, `collectionGroup`, global Firebase import or raw constraint
input is approved.

## 15. Implementation and test risks

Future tests must independently cover all lifecycle states, physical nullability,
unknown fields, ID/path/Tenant mismatch, timestamp conversion, immutability,
self ownership for approved/suspended/removed Membership, active/suspended/
archived Tenant behavior, tenant-admin scope, teacher broad denial, anonymous,
platform and foreign Tenant denial, required tenantId/membershipId predicates,
pagination/cursor compatibility, collection-group denial and all client writes.

Runtime must use the demo project, Firestore-only Emulator and isolated fixtures.
Index Emulator success will not prove production deployment.

## 16. Recommendations and next phase

Start `SaaS-03A.6A-R1 — Enrollment query, pagination, cursor and index contract
resolution`. It must:

1. freeze separate self and tenant-admin APIs and exact Rules-compatible shapes;
2. add mandatory tenantId equality to every client list contract;
3. decide status variants, constraint order and page-size policy;
4. define versioned cursors per implemented query family;
5. reconcile FI-ENR-001..007, splitting or deferring FI-ENR-007;
6. keep teacher Course cohorts, writes, uniqueness and global self composition
   outside the minimal client repository unless separately authorized.

## 17. Closure

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A = completed_with_contract_blockers_identified
SaaS-03A.6A-R1 = required_ready_not_started
SaaS-03A.6B = blocked_pending_03A_6A_R1
EnrollmentRepository = not_created
```

Audit decision: `COMPLETE`.

Implementation decision: `NOT_READY_PENDING_03A_6A_R1`.

Decision to start 03A.6A-R1: `READY`. The blockers are bounded contractual work
owned by R1; no unresolved higher-authority contradiction requires changing
Domain 1.2.0, Architecture Freeze or current Rules during this audit.

## 18. Resolution by SaaS-03A.6A-R1

R1 resolves the bounded blockers without changing Domain or Rules. The final
read-only API has neutral point get, explicit own-Membership listing and a
separate tenant-admin listing. Every list proves embedded `tenantId` and uses
status equality or a fixed `in` over all canonical states; self also proves
`membershipId`. Pagination is 1/20/50 with limit-plus-one and separate version-1
self/admin cursors. Only tenant-aware FI-ENR-002 and FI-ENR-005 are required by
03A.6B. Cohort, uniqueness, global composition and write variants are deferred.

```text
SaaS-03A.6A = incomplete_superseded_by_resolution
SaaS-03A.6A-R1 = completed_pending_human_contract_review
SaaS-03A.6B = ready_not_started
EnrollmentRepository = not_created
```

## 19. Implementation outcome

SaaS-03A.6B implements the frozen read-only contract under
`src/services/saas/enrollment/` with 46 passing unit tests. The serializer,
point read, two actor-separated list families, pagination and cursor are present;
there are no writes or auxiliary Membership/Course reads.

```text
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed_pending_human_code_review
EnrollmentRepository = implemented_shadow
SaaS-03A.6B-C1 = next_not_started
```

The controlled C1 review accepted the implementation without technical changes.
03A.6B is completed, 03A.6B-C1 is `completed_pending_human_push`, and 03A.6R-A
is `ready_not_started`.
