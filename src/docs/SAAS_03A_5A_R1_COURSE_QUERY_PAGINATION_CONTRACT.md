# SaaS-03A.5A-R1 — Course query, pagination, cursor and index contract

## 1. Purpose, authority and readiness

This document specializes `FQ-CRS-001..007` into the complete read-only
contract required to implement CourseRepository. It resolves the API, actor
shapes, options, pagination, cursor, nested serialization and indexes without
changing Domain 1.2.0, Rules, Firebase configuration or any technical file.

Rules remain the authorization authority. Separate repository methods prevent
invalid query construction but never prove the caller's role. A caller invoking
the wrong method is still rejected by Rules.

```text
COURSE_QUERY_CONTRACT = RESOLVED
COURSE_PAGINATION_CONTRACT = RESOLVED
COURSE_CURSOR_CONTRACT = RESOLVED
COURSE_INDEX_CONTRACT = RESOLVED
COURSE_NESTED_SERIALIZATION_CONTRACT = RESOLVED
COURSE_API_CONTRACT = RESOLVED
```

## 2. Canonical path and public API

```text
tenants/{tenantId}/courses/{courseId}
tenants/{tenantId}/courses
```

The final public surface is exactly:

```text
createCourseRepository(dependencies)
getCourse(tenantId, courseId)
listActiveCoursesForTenant(tenantId, options?)
listTeacherCoursesForTenant(tenantId, options?)
listTenantAdminCoursesForTenant(tenantId, options?)
```

There is no generic list method, role/accessMode argument, collection-group
method, write method, Enrollment composition or lookup method. The three list
methods express different query proofs; future consumers must not choose a role
value inside options.

Deferred: archived Course/Enrollment history composition and legacy adapters.
Backend-only: create, update, activate, archive, restore, delete, ownership and
administrative commands.

## 3. Query Contract reconciliation

| ID | Operation | Actor | Scope | Filters | Order | Pagination | Classification |
|---|---|---|---|---|---|---|---|
| FQ-CRS-001 | getCourse | approved member | point tenant Course | path IDs | none | none | CLIENT_TENANT |
| FQ-CRS-002 | active/teacher catalogs | student, teacher | tenant collection | closed status proof | displayName ASC, documentId ASC | Standard | CLIENT_CATALOG |
| FQ-CRS-003 | admin list | tenant_admin | tenant collection | canonical status proof | updatedAt DESC, documentId DESC | Standard | CLIENT_TENANT_ADMIN |
| FQ-CRS-004 | active/teacher learning-language catalog | student, teacher | tenant collection | status proof + learningLanguage.languageCode equality | catalog order | Standard | CLIENT_CATALOG |
| FQ-CRS-005 | active/teacher support-language catalog | student, teacher | tenant collection | status proof + supportLanguageCode equality | catalog order | Standard | CLIENT_CATALOG |
| FQ-CRS-006 | active/teacher combined-language catalog | student, teacher | tenant collection | status proof + both language equalities | catalog order | Standard | CLIENT_CATALOG |
| FQ-CRS-007 | archived Course plus Enrollment history | tenant admin/backend | composition | archived | updatedAt DESC | deferred | BACKEND_ONLY/DEFERRED |

No Course collection-group contract is client-safe.

## 4. Point get

`getCourse(tenantId, courseId)` validates two non-empty canonical IDs, builds
exactly `doc(db, "tenants", tenantId, "courses", courseId)`, performs exactly
one `getDoc`, and serializes with expected tenantId/courseId and canonical path.
It performs no Tenant, Membership, Identity or Enrollment read.

An observable missing document maps to `NOT_FOUND`; Firestore
permission-denied maps to `FORBIDDEN`, including protected absence. The method
accepts no options, status, role, uid, Membership or constraints.

## 5. Actor-specific query shapes

### 5.1 Student/ordinary active catalog

`listActiveCoursesForTenant` always adds:

```text
where("status", "==", "active")
orderBy("displayName", "asc")
orderBy(documentId(), "asc")
```

It allows zero or one exact learning-language filter and zero or one exact
support-language filter, independently or together. Status is not an option.

### 5.2 Teacher catalog

`listTeacherCoursesForTenant` always adds:

```text
where("status", "in", ["draft", "active"])
orderBy("displayName", "asc")
orderBy(documentId(), "asc")
```

The fixed two-value set matches the current Rules proof and is not caller
configurable. The same zero/one exact language filters and their combination
are supported. Archived can never be requested through this method.

### 5.3 Tenant-admin list

`listTenantAdminCoursesForTenant` uses administrative order. If `status` is
omitted, it still proves canonicality with:

```text
where("status", "in", ["draft", "active", "archived"])
```

If present, `status` is one exact canonical value using `==`. Then:

```text
orderBy("updatedAt", "desc")
orderBy(documentId(), "desc")
```

Language filters are not part of the administrative API. No list is truly
unfiltered or broad; every shape contains a closed status predicate.

## 6. Closed options

Omitted or `undefined` options mean a new empty object. `null`, arrays,
non-plain objects, unknown keys and any present key whose value is `undefined`
are invalid. Values are never clamped or normalized.

Active and teacher catalog options:

```text
{
  learningLanguageCode?: canonical BCP 47 string,
  supportLanguageCode?: canonical BCP 47 string,
  pageSize?: integer,
  cursor?: non-empty string
}
```

Tenant-admin options:

```text
{
  status?: "draft" | "active" | "archived",
  pageSize?: integer,
  cursor?: non-empty string
}
```

Forbidden everywhere: tenantId inside options, uid, role, accessMode, order,
direction, where, constraints, offset, collectionGroup, visibility, teacherId,
category and multi-status supplied by a consumer.

## 7. Ordering, pagination and result

```text
MIN_PAGE_SIZE = 1
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50
```

The existing Standard page category is specialized to the established 1/20/50
repository standard. pageSize must be a finite integer in range; strings,
booleans, null, NaN, Infinity and decimals are invalid.

Every list uses `limit(pageSize + 1)`. The lookahead is removed from items,
`hasMore` is true only when it exists, and `nextCursor` is generated from the
last included item, never the lookahead. Empty and terminal pages use
`nextCursor=null`. The result is:

```text
Object.freeze({
  items: Object.freeze([...serializedItems]),
  nextCursor,
  hasMore
})
```

## 8. Course cursor v1

```text
CURSOR_VERSION = 1
CURSOR_POLICY = course_standard_v1
MAX_CURSOR_SIZE = 2048 characters
```

Exact envelope keys are `version`, `queryKind`, `binding`, `position`.

Query kinds:

```text
course_active_catalog
course_teacher_catalog
course_tenant_admin
```

Catalog binding keys are exactly:

```text
tenantId
statusContract        // active | draft_active
learningLanguageCode  // string|null
supportLanguageCode   // string|null
order                 // displayName_asc_documentId_asc
policy                // course_standard_v1
```

Admin binding keys are exactly:

```text
tenantId
status                // canonical status|null; null means fixed all-canonical in-query proof
order                 // updatedAt_desc_documentId_desc
policy                // course_standard_v1
```

Catalog position is exactly `{displayName, documentPath}`. Admin position is
exactly `{updatedAt, documentPath}`, where updatedAt is canonical UTC ISO-8601.
Every documentPath is the canonical four-segment Course path bound to tenantId.

Encoding is canonical-key JSON serialized to UTF-8 using TextEncoder, then
unpadded Base64URL. Decoding uses `TextDecoder("utf-8", {fatal:true})`. Buffer
is prohibited. Tokens must be non-empty, whitespace-free, canonical, at most
2048 characters and have exact schemas with no extra keys.

Malformed encoding/JSON/schema/value/path/timestamp is `INVALID_ARGUMENT`.
Supported schema with wrong version, queryKind or binding is
`CONTRACT_VIOLATION`. Cross-Tenant, cross-status, cross-language, cross-order
and cross-method reuse fail before `getDocs`.

For tenant collection queries ordered by documentId, the second cursor value is
the simple courseId string:

```text
startAfter(displayName, courseId)
startAfter(new Date(updatedAt), courseId)
```

No DocumentReference or full path is supplied to `startAfter`.

## 9. Nested value and serialization contract

The exact twelve-field Course allowlist is:

```text
courseId, tenantId, displayName, description, learningLanguage,
supportLanguageCode, interfaceLanguages, cefrLevel, status,
createdAt, updatedAt, archivedAt
```

All twelve keys must physically exist. `archivedAt` alone is nullable.

`learningLanguage` is a non-null plain object with exactly required string keys
`languageCode` and `displayName`. `interfaceLanguages` is a non-empty array of
plain objects, each with exactly required string keys `locale` and
`displayName`. No nested field is nullable. Unknown keys, sparse arrays and
non-plain/SDK objects are rejected.

Language tags must be non-empty, trimmed, syntactically valid BCP 47 tags and
already in canonical casing. Validation uses the platform-standard
`Intl.getCanonicalLocales([value])`: rejection/empty output is invalid and the
single canonical result must equal the supplied value exactly. The serializer
validates and preserves tags rather than normalizing silently. Interface locale duplicates are rejected using
case-insensitive comparison. Array order is preserved. There is no separate
“primary” interface language, no contract-level maximum beyond Firestore's
document limit, and supportLanguageCode need not occur in interfaceLanguages.

Learning/display names and Course displayName/description must be strings;
identifier/language code fields cannot be whitespace-only. Deep copy creates a
new learningLanguage object, new interface item objects and a new array. The
Course, nested objects and array are recursively frozen. No snapshot,
DocumentReference or Timestamp escapes. createdAt/updatedAt and non-null
archivedAt become UTC ISO-8601 strings.

Lifecycle is fail-closed: draft/active require archivedAt null; archived
requires a valid timestamp. CEFR is exactly A1/A2/B1/B2/C1/C2 and status exactly
draft/active/archived. Snapshot ID, path courseId/data.courseId and expected
Tenant/data.tenantId must agree.

## 10. Errors and operation names

Shared error taxonomy remains unchanged. Operation names are frozen as:

```text
get_course
list_active_courses_for_tenant
list_teacher_courses_for_tenant
list_tenant_admin_courses_for_tenant
decode_course_cursor
serialize_course
```

Validation and malformed cursors use INVALID_ARGUMENT; binding incompatibility
and malformed stored documents use CONTRACT_VIOLATION; Firestore errors are
normalized by Shared. Error details/messages must not include IDs, cursor,
title, description, languages, payload, snapshot, email, token or credential.

## 11. Dependencies and read budget

Required injected modular SDK dependencies are exactly:

```text
db, doc, getDoc, collection, query, where, orderBy,
documentId, limit, startAfter, getDocs
```

There is no Firebase global, singleton, `src/firebase.js`, collectionGroup or
write dependency.

- get: one SDK document read, zero repository auxiliary reads;
- each list: one query plus N billed returned document reads, zero repository
  auxiliary reads;
- Rules may make bounded/cached Tenant, membershipKey and Membership access
  calls; the repository never makes those reads;
- no Enrollment check and no N+1 query is permitted.

## 12. Exact index contract

All Course indexes have `collectionGroup: courses` and
`queryScope: COLLECTION`. No COLLECTION_GROUP index exists.

| ID | Queries | Fields |
|---|---|---|
| FI-CRS-001 | active/teacher catalog without languages | status ASC, displayName ASC |
| FI-CRS-002 | admin all-canonical/exact-status | status ASC, updatedAt DESC |
| FI-CRS-003 | active/teacher learning filter | status ASC, learningLanguage.languageCode ASC, displayName ASC |
| FI-CRS-004 | active/teacher support filter | status ASC, supportLanguageCode ASC, displayName ASC |
| FI-CRS-005 | active/teacher both filters | status ASC, learningLanguage.languageCode ASC, supportLanguageCode ASC, displayName ASC |

Equality and `in` use the same field slots; no extra teacher/admin index is
needed. Firestore implicitly appends `__name__` in the direction of the last
ordered field: ASC for FI-CRS-001/003/004/005 and DESC for FI-CRS-002. Queries
still explicitly order by documentId. `__name__` is not materialized explicitly.

Exactly five Course indexes are required later. None is materialized now.

## 13. Legacy coexistence and responsibility boundary

```text
LEGACY_COEXISTENCE_STATUS = shadow_only_no_migration_no_dual_write
```

Course SaaS remains an institutional metadata shell. It does not contain or
replace global legacy levels, modules, lessons, progress, missions or tests.
This phase changes no service, `firestoreService.js`, adapter, UI, Provider,
migration, dual-write or source-of-truth behavior. Implementation 5B must remain
shadow-only and consumer-free.

## 14. Future test matrix

Serializer coverage: every state/CEFR value; all fields; missing/unknown fields;
ID/Tenant/path mismatches; invalid strings/tags/nested shapes; empty, duplicate,
sparse or invalid interfaceLanguages; lifecycle/Timestamps; deep copy/freeze;
no SDK leakage or source mutation.

Point coverage: each allowed/denied role-state pair, anonymous,
suspended/removed Membership, foreign Tenant, suspended/archived Tenant,
protected absence and Firebase normalization.

List coverage: each of the three exact shapes; four language combinations for
both catalog methods; admin omitted/exact status; order/ties; empty, lookahead,
second and terminal pages; cursor round-trip and every binding mismatch; invalid
options; query missing status proof; collection-group and broad-query denial.

Security/runtime coverage: all writes denied; platform client denied;
Firestore-only demo fixtures for actor/Tenant/status combinations; index
traceability; no Storage or remote resource.

## 15. Residual risks and deferred decisions

Residual non-blockers: indexes are not materialized/deployed, cursor is unsigned,
concurrent edits can move rows between pages, BCP 47 validation needs focused
tests, repository remains consumer-free, lifecycle is backend-only and legacy
mapping/migration is absent. Enrollment history composition, UI integration,
Providers, adapters, migration and production activation remain deferred.

No contract decision remains for 5B implementation.

## 16. Closure and states

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed_pending_human_contract_review
SaaS-03A.5B = ready_not_started
CourseRepository = not_created
```

`SaaS-03A.5A-R1 Course query, pagination, cursor and index contract resolution = COMPLETE`.
5B is not started.

## 17. Implementation trace

5B implements this contract without divergence. The exact factory/four methods,
deep twelve-field serializer, closed actor-specific options, 1/20/50
pagination, Course cursor v1 and five future index shapes are preserved.

```text
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = completed_pending_human_push
SaaS-03A.5I = ready_not_started
```

The C1 review confirmed that the implementation preserves every closed R1
query, pagination, cursor, nested serialization and index contract. No Rule or
index was changed, and 5I was not started.
