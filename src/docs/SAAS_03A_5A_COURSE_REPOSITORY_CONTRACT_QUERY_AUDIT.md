# SaaS-03A.5A — CourseRepository contract and query audit

> Runtime reconciliation: FIX2 makes embedded tenant ownership explicit in all
> Course list queries and refactors Rules role evaluation without widening the
> approved actor/status matrix.

## 1. Purpose and decision

This document audits the frozen Course domain, its physical Firestore shape,
current Rules, approved access/query contracts, indexes and legacy coexistence
before any repository code exists. It is an audit, not an implementation.

The audit is complete, but implementation is blocked. The physical model,
lifecycle and client read policy are sufficiently authoritative; the exact
repository list surface, numeric pagination policy, portable cursor envelope
and material index variants require `SaaS-03A.5A-R1`.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_pending_contract_resolution
SaaS-03A.5A-R1 = required_not_started
SaaS-03A.5B = blocked
CourseRepository = not_created
```

## 2. Sources and scope

The audit reviewed the current roadmap/scope; Domain 1.2.0 academic,
organization, authorization and workflow contracts; architecture freeze;
persistence, physical, access-pattern, query/index, write-authority and Rules
documents; `firestore.rules`, `firestore.indexes.json`, Firebase configuration
and Storage Rules; existing SaaS repositories and tests; and legacy course,
level, module and lesson consumers. `FIRESTORE_RULES_COURSE_ENROLLMENT_READ_IMPLEMENTATION.md`
was treated as historical and reconciled with the later normative
`FIRESTORE_RULES_COURSE_ENROLLMENT_REIMPLEMENTATION.md` and current Rules.

No Course code, test, index, Rule, runtime, consumer or migration was created.

## 3. Canonical paths

```text
COURSE_DOCUMENT_PATH = tenants/{tenantId}/courses/{courseId}
COURSE_COLLECTION_PATH = tenants/{tenantId}/courses
```

No `courseKeys`, `courseSettings`, `courseMetadata`, `courseVersions`, public
catalog or Course collection-group path is approved. Course modules and lessons
are not subcollections of the SaaS Course contract. Related canonical path
`tenants/{tenantId}/enrollments/{enrollmentId}` is an independent root that
references Course by scalar `courseId`; it is not loaded by CourseRepository.

| Related path | Classification |
|---|---|
| tenant Course document/collection | CLIENT_SAFE, subject to Rules |
| tenant Enrollments referencing Course | DEFERRED to EnrollmentRepository |
| Course collection-group | DENY_ALL / not approved |
| Course write/audit command resources | BACKEND_ONLY, physical audit path deferred |
| legacy `levels`, modules and lessons | separate legacy topology |

## 4. Exact physical contract

All fields below are physically required to be present. `archivedAt` is the
only nullable field; “conditional” describes its value, not its presence.

| Field | Physical type | Required | Nullable | Immutable | Authority / notes |
|---|---|---:|---:|---:|---|
| courseId | string | yes | no | yes | equals snapshot ID |
| tenantId | string | yes | no | yes | equals parent Tenant ID |
| displayName | string | yes | no | no | trusted backend command |
| description | string | yes | no | no | trusted backend command |
| learningLanguage | plain map `{languageCode, displayName}` | yes | no | no | embedded value object |
| supportLanguageCode | BCP 47 string | yes | no | no | trusted backend command |
| interfaceLanguages | array of plain `{locale, displayName}` maps | yes | no | no | embedded value objects |
| cefrLevel | enum string | yes | no | no | A1/A2/B1/B2/C1/C2 |
| status | enum string | yes | no | lifecycle-managed | draft/active/archived |
| createdAt | Firestore Timestamp | yes | no | yes | trusted timestamp |
| updatedAt | Firestore Timestamp | yes | no | no | trusted timestamp |
| archivedAt | Firestore Timestamp/null | yes | yes | once set | null before archive; required timestamp when archived |

There are no optional fields in the physical serializer contract. There are no
client-mutable fields because all Course writes are denied to clients.
`courseId`, `tenantId` and `createdAt` are invariant; `archivedAt` becomes
immutable when set. All other mutations remain trusted-backend commands with
capability, validation, audit and concurrency controls.

Fields suggested elsewhere but not in the contract—`title`, `language`,
`level`, `visibility`, `publishedAt`, `createdBy`, `updatedBy`, `teacherId` and
`category`—must be rejected as unknown.

## 5. Enums and lifecycle

CourseStatus is exactly `draft | active | archived`; CEFRLevel is exactly
`A1 | A2 | B1 | B2 | C1 | C2`. Learning/support/interface language values are
BCP 47 contracts, not additional Course status/type enums.

| State | Required lifecycle value | Null lifecycle value | Client read policy | Transitions |
|---|---|---|---|---|
| draft | status=draft | archivedAt=null | teacher, tenant_admin | active or archived |
| active | status=active | archivedAt=null | student, teacher, tenant_admin | archived |
| archived | status=archived; archivedAt valid | none | tenant_admin only | terminal |

Creation produces draft. Teacher and tenant_admin are conceptual creation/edit
actors, but every write is trusted-backend only. Activation and archival require
tenant_admin plus their explicit capabilities. There is no restore transition.
`COURSE_LIFECYCLE_AUTHORITY = trusted_backend/system`.

## 6. Current Rules audit

Every Course read requires authentication, an active Tenant, an approved
same-Tenant Membership resolved through membershipKey/Membership, canonical
embedded tenantId, a canonical status, and—for point get—courseId/path equality.

| Actor/context | Point get | Tenant list |
|---|---|---|
| anonymous | DENY | DENY |
| approved student | active only | query must prove `status == active` |
| suspended/removed student | DENY | DENY |
| approved teacher | draft or active | query must prove exact draft/active set |
| approved tenant_admin | all canonical states | canonical broad or status-scoped list |
| platform_admin client / legacy admin | DENY; no bypass | DENY |
| foreign Tenant/UID | DENY | DENY |
| active Tenant | role/status policy applies | role/status policy applies |
| suspended or archived Tenant | DENY | DENY |

The direct match grants `get` and `list` separately and denies create, update
and delete. There is no recursive Course match; collection-group Course reads
fall through to deny-all. Publish, archive, restore, visibility or teacher
ownership changes have no client write surface.

Rules are not filters. Therefore a future list API must build a query whose
status predicate proves the caller-visible set. It must not fetch broadly and
filter locally or attempt to reproduce authorization by reading Membership.

## 7. Query Contracts and classification

| ID | Purpose | Actor/scope | Filters | Canonical order | Classification |
|---|---|---|---|---|---|
| FQ-CRS-001 | point Course | approved tenant member, role/status constrained | courseId path | none | CLIENT_TENANT |
| FQ-CRS-002 | tenant catalog | student/teacher/admin | allowed status proof | displayName ASC, documentId ASC | CLIENT_CATALOG; exact API variants require R1 |
| FQ-CRS-003 | status/admin list | tenant_admin | status==X | updatedAt DESC, documentId DESC | CLIENT_TENANT_ADMIN; R1 API decision |
| FQ-CRS-004 | learning-language catalog | approved member | status==active + learningLanguage.languageCode==X | displayName ASC, documentId ASC | CLIENT_CATALOG |
| FQ-CRS-005 | support-language catalog | approved member | status==active + supportLanguageCode==X | displayName ASC, documentId ASC | CLIENT_CATALOG |
| FQ-CRS-006 | combined-language catalog | approved member | allowed status + both language equalities | displayName ASC, documentId ASC | CLIENT_CATALOG; combinations require R1 |
| FQ-CRS-007 | archived Course + Enrollment history composition | tenant_admin/backend | status==archived | updatedAt DESC, documentId DESC | BACKEND/DEFERRED composition |

No Course collection-group Query Contract exists. Queries without explicit
Tenant, anonymous/public catalog queries, arbitrary orders, offsets, raw SDK
constraints, UID filters, broad global scans, visibility/teacher/category
filters and multi-value filters outside the role-status proof are prohibited.

The frozen model identifies status and the two language codes as Course query
dimensions. Exact client options and the actor-sensitive status combinations
must be frozen in R1; they cannot be inferred from UI or capabilities.

## 8. Pagination and cursor blockers

The conceptual standards are deterministic order, documentId tie-break,
cursor-based pagination and result `{items, nextCursor, hasMore}` with
lookahead. The numeric `MIN_PAGE_SIZE`, `DEFAULT_PAGE_SIZE` and
`MAX_PAGE_SIZE`, plus limit+1 application per Course contract, remain explicitly
open for roots other than RegistrationRequest.

`PAGINATION_CONTRACT_BLOCKER` therefore remains. R1 must freeze numeric sizes,
closed options, lookahead behavior and terminal-page semantics.

The conceptual cursor positions are:

- catalog lists: `displayName` plus canonical document path;
- administrative/history lists: `updatedAt` plus canonical document path.

No Course-specific version, policy, queryKind set, binding schema, canonical
encoding, maximum size or error mapping exists. R1 must define the v1 envelope,
UTF-8/base64url policy if selected, Tenant/filter/order binding, position shape,
malformed=`INVALID_ARGUMENT` and incompatible=`CONTRACT_VIOLATION` behavior.
`CURSOR_CONTRACT_BLOCKER` remains; no Membership or RegistrationRequest cursor
may be reused automatically.

## 9. Index inventory

| ID | Scope | Fields | Contract | Materialized | Required |
|---|---|---|---|---:|---:|
| FI-CRS-001 | COLLECTION courses | status ASC, displayName ASC | FQ-CRS-002 | no | yes for filtered catalog |
| FI-CRS-002 | COLLECTION courses | status ASC, updatedAt DESC | FQ-CRS-003/007 | no | yes |
| FI-CRS-003 | COLLECTION courses | status ASC, learningLanguage.languageCode ASC, displayName ASC | FQ-CRS-004 | no | yes |
| FI-CRS-004 | COLLECTION courses | status ASC, supportLanguageCode ASC, displayName ASC | FQ-CRS-005 | no | yes |
| FI-CRS-005 | COLLECTION courses | status ASC, learningLanguage.languageCode ASC, supportLanguageCode ASC, displayName ASC | FQ-CRS-006 | no | yes |

`firestore.indexes.json` contains twelve RegistrationRequest/Membership indexes,
zero Course indexes and zero fieldOverrides. There are no Course duplicates or
conflicts. Point get uses built-in access. No Course COLLECTION_GROUP index is
approved. Materialization waits for R1 to freeze the exact implemented variants,
so `INDEX_CONTRACT_BLOCKER` is coupled to the query/options resolution.

## 10. Serialization contract

The future serializer must use the exact twelve-field allowlist, require every
physical field, reject unknown/missing fields, validate IDs against snapshot
and canonical path, validate enums/lifecycle, and convert Firestore Timestamps
to UTC ISO-8601 strings without exposing SDK objects.

`learningLanguage` and every `interfaceLanguages` element require strict nested
plain-object allowlists, BCP 47 validation, deep copies and recursive freezing;
a shallow spread/freeze is insufficient. Arrays must be new and frozen. Null
`archivedAt` is preserved. Output is a new deeply immutable object and input is
not mutated.

## 11. Proposed minimal API and SDK dependencies

The only method safe to name conclusively now is a factory plus point read:

```text
createCourseRepository(dependencies)
getCourse(tenantId, courseId)
```

R1 must name and freeze the minimum tenant catalog/list methods corresponding
to the approved FQ subsets; it must decide whether admin/history is exposed or
deferred. No across-Tenant method is permitted. Create, update, activate,
archive, restore, delete, teacher assignment and Enrollment composition remain
excluded/backend-only.

Expected read-only SDK dependencies are `db`, `doc`, `getDoc`, and—only for
approved lists—`collection`, `query`, `where`, `orderBy`, `documentId`, `limit`,
`startAfter`, `getDocs`. `collectionGroup` and all write SDK functions are
excluded.

## 12. Read budget

- Point get: one target SDK document read; Rules may access Tenant,
  membershipKey and actor Membership (bounded/cached access calls).
- Tenant list: one SDK query and returned document reads; the same bounded Rules
  authorization documents, no per-result repository lookup and no N+1.
- Collection-group: zero, because the operation is denied/not approved.

CourseRepository must not read Identity, Membership, Enrollment or Tenant to
reimplement authorization. Rules remain authoritative.

## 13. Legacy coexistence

The SaaS Course is a tenant-owned institutional catalog metadata root. It does
not contain or replace legacy `levels`, nested modules, lessons, progress,
missions or tests. Current consumers (`courseService`, module/lesson/navigation
services and React pages/components) continue to use legacy global topologies.

```text
LEGACY_COEXISTENCE_STATUS = shadow_only_no_migration_no_dual_write
```

There is no adapter, migration, dual-write, replacement or UI consumer. A
future integration needs an explicit mapping/adaptor policy and source-of-truth
decision; it must not silently attach legacy content to Course.

## 14. Risks and blockers

Residual risks include actor-sensitive Rules query proof, accidental draft or
archived exposure, unmaterialized indexes, concurrent movement between pages,
unsigned cursors, deep nested-value validation, legacy/SaaS dual-source drift,
no migration, no remote/productive validation, and backend-only lifecycle.

| Classification | Finding | Blocks 5B |
|---|---|---:|
| QUERY_CONTRACT_BLOCKER | exact public list methods/options and role/status combinations not specialized | yes |
| PAGINATION_CONTRACT_BLOCKER | Course numeric limits/lookahead policy not frozen | yes |
| CURSOR_CONTRACT_BLOCKER | Course-specific envelope/binding/encoding/errors absent | yes |
| INDEX_CONTRACT_BLOCKER | conceptual FI-CRS-001..005 exist but exact implemented variants await R1 | yes |
| RULES_POLICY_BLOCKER | none; current role/status/Tenant policy is explicit | no |
| PHYSICAL_MODEL_BLOCKER | none; twelve-field shape is reconcilable | no |
| LIFECYCLE_BLOCKER | none; transitions and archivedAt rule are explicit | no |
| AUTHORIZATION_BLOCKER | none for reads; writes remain backend-only | no |

## 15. Future test matrix

Future serializer tests cover exact fields, unknown/missing fields, IDs and
Tenant mismatch, all statuses/CEFR values, lifecycle/nullability, Timestamp
conversion, invalid/nested values, deep copies/freezing and absence of SDK
objects. Point tests cover each role/status, foreign/anonymous/non-approved
actors, Tenant states, missing/malformed documents and Firebase errors.

List tests cover explicit Tenant, every R1-approved status/language combination,
Rules-compatible query constraints, empty/non-empty results, order and ties,
page boundaries/lookahead/cursors, foreign/anonymous/broad queries, and no
collection-group. Security runtime tests cover denied create/update/delete,
activate/archive and administrative bypass. Runtime remains Firestore-only on
`demo-polish-learning`, with isolated fixtures and index traceability.

## 16. Future microphases

1. `SaaS-03A.5A-R1 — Course query, pagination, cursor and index contract resolution`.
2. `SaaS-03A.5B — CourseRepository implementation` (blocked until R1 approval).
3. `SaaS-03A.5B-C1 — CourseRepository review and controlled commits`.
4. `SaaS-03A.5I — Course index materialization`, if approved variants require it.
5. `SaaS-03A.5R-A — Course runtime suite`.
6. `SaaS-03A.5R-B — Course CI/runtime closure`.

None is started by this audit.

## 17. Closure criteria

The path, physical model, enums/lifecycle, Rules, actors, existing FQ contracts,
filters/orders, conceptual indexes, serialization boundary, read budget, legacy
coexistence, risks and future tests are audited. Pagination, cursor, list API
and exact index variants are explicitly blocked rather than invented.

```text
SaaS-03A.5A CourseRepository contract and query audit = COMPLETE
Implementation readiness = BLOCKED_PENDING_03A_5A_R1
```

## 18. R1 resolution

`SAAS_03A_5A_R1_COURSE_QUERY_PAGINATION_CONTRACT.md` resolves every blocker
identified here. It freezes separate active, teacher and tenant-admin list
methods; Rules-compatible status proofs; closed language/admin options;
1/20/50 lookahead pagination; Course cursor v1; deep nested serialization; and
the five exact COLLECTION indexes. The audit remains historical evidence; its
implementation blocker is superseded by the approved resolution contract.

```text
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed_pending_human_contract_review
SaaS-03A.5B = ready_not_started
CourseRepository = not_created
```

## 19. Shadow implementation result

5B implements the approved R1 read surface under `src/services/saas/course/`:
strict deep serialization, point get, three actor-shaped tenant lists,
lookahead pagination and Course cursor v1. Forty-two focused unit tests pass in the
implementation phase. No Rule, index, consumer, migration or legacy service is
changed.

```text
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = completed_pending_human_push
SaaS-03A.5I = ready_not_started
```

C1 reconciled the implementation against this audit and R1 without changing
the physical model, Rules policy, client-safe surface, legacy coexistence or
future five-index contract.

## 20. Local index materialization trace

FI-CRS-001 through FI-CRS-005 are now materialized locally exactly as audited.
Production deployment and Emulator validation were not performed. 5I is
`completed_pending_human_index_review`; 5I-C1 is `next_not_started`.

C1 subsequently accepted the five exact definitions without correction:
`SaaS-03A.5I = completed`, `SaaS-03A.5I-C1 =
completed_pending_human_push`, and `SaaS-03A.5R-A = ready_not_started`.

## 21. Runtime-suite preparation trace

5R-A-C1 reviewed and strengthened 114 Firestore-only cases (32 ALLOW, 82 DENY;
outcomes 32/56/26/0) without executing Emulator. CourseRepository and this
contract stay unchanged; B1 CI integration is ready but not started.

B1 preserves that audit and integrates an explicit Course precheck/runtime gate
without changing CourseRepository, Rules, indexes or the runtime suite.

B2 closure preserves this historical audit while recording the final outcome:
resolved contracts, implementation, local indexes and runtime are complete;
CourseRepository is `completed_in_shadow_mode` and Course passes 114/114.
