# SaaS-03A.5B — CourseRepository shadow implementation

> FIX2 correction: every Course list now emits
> `where("tenantId", "==", tenantId)` as its first constraint. API, point get,
> pagination, serializer and cursor envelope remain unchanged.

## 1. Purpose and scope

This phase implements the read-only CourseRepository frozen by 5A-R1 under
`src/services/saas/course/`. It remains shadow-only: no consumer, Provider,
Context, hook, UI, route, migration, dual-write, legacy adapter, index, Rule or
remote resource is changed.

## 2. Sources and structure

Normative sources are the 5A audit and R1 contract, Domain 1.2.0, persistence
and physical models, FQ-CRS-001..007, current Rules, Shared repository
infrastructure and preceding repositories.

```text
courseRepository.js
courseSerializer.js
courseValidation.js
courseQueries.js
courseCursor.js
index.js
__tests__/testDoubles.mjs
__tests__/serializer.test.mjs
__tests__/repository.test.mjs
__tests__/cursorAndOptions.test.mjs
```

## 3. Factory, dependencies and API

`createCourseRepository({db,sdk})` uses the existing immutable Shared dependency
container and requires exactly `doc`, `getDoc`, `collection`, `query`, `where`,
`orderBy`, `documentId`, `limit`, `startAfter`, and `getDocs`. There is no
Firebase/Auth global, singleton or mutable state.

The barrel exports only `createCourseRepository`. The frozen instance exposes
exactly `getCourse`, `listActiveCoursesForTenant`,
`listTeacherCoursesForTenant`, and `listTenantAdminCoursesForTenant`.

## 4. Physical serializer

The serializer requires the exact twelve Course fields and rejects unknown or
missing fields. It validates snapshot/path/data courseId and tenantId, exact
status/CEFR enums, lifecycle and Firestore Timestamps. Timestamps become UTC ISO
strings and archivedAt preserves null.

`learningLanguage` is copied from exact `{languageCode,displayName}`.
`interfaceLanguages` is a non-empty dense array of exact
`{locale,displayName}` objects with canonical, case-insensitively unique BCP 47
locales. BCP 47 uses `Intl.getCanonicalLocales` and preserves already canonical
input. Nested objects and arrays are newly allocated and recursively frozen.

Draft/active require null archivedAt; archived requires a valid timestamp. No
snapshot, reference, metadata or SDK Timestamp escapes.

## 5. Reads and queries

`getCourse` performs one canonical point read and no auxiliary read. Rules
decide authorization and Shared maps Firebase failures.

Active catalog fixes `status == active`; teacher fixes
`status in [draft,active]`. Both allow zero/one exact learning and support
language equality and order by displayName/documentId ASC. Tenant-admin uses an
exact status or the fixed `in [draft,active,archived]` proof and orders by
updatedAt/documentId DESC. Every list is tenant-scoped; collection-group and
all writes are absent.

## 6. Options, pagination and cursor

Catalog options are only language filters, pageSize and cursor. Admin options
are only status, pageSize and cursor. Undefined means defaults; null,
non-plain/array options, unknown/undefined keys and invalid values fail closed.

Page sizes are 1/20/50. Queries request pageSize+1, hide lookahead, derive the
cursor from the last included item and return a frozen
`{items,nextCursor,hasMore}`.

Course cursor v1 uses policy `course_standard_v1`, exact active/teacher/admin
query kinds, exact bindings and catalog displayName/path or admin updatedAt/path
positions. Encoding is canonical insertion-order JSON, UTF-8 and unpadded
Base64URL via TextEncoder/TextDecoder, maximum 2048, without Buffer. Tenant
collection startAfter uses a simple courseId. Malformed tokens are
INVALID_ARGUMENT; supported but mismatched version/query/binding is
CONTRACT_VIOLATION before getDocs.

## 7. Errors and prohibited operations

Shared normalization and taxonomy are preserved. Public errors use the frozen
operation/resource names and contain no IDs, cursor, payload or Course content.
There is no create/update/activate/archive/restore/delete, generic CRUD,
collection-group, Membership/Tenant/Enrollment read or authorization replica.

## 8. Unit tests and results

Four test support/suite files contain 47 tests: 21 positive and 26 negative.
They cover the exact serializer/lifecycle, nested BCP 47 values, deep copy and
freeze, point get, all filter shapes, administrative status variants,
lookahead/terminal pages, all cursor families and binding failures, result-path
consistency, error mapping, dependency completeness and minimal API.

The implementation review preserved the productive contract and added focused
coverage for canonical regional BCP 47 tags, rejection of non-plain nested
objects, source-mutation isolation, the default `limit(21)`, student
`startAfter(displayName, courseId)`, and sanitized UNKNOWN point-get errors.
The first focused run had also exposed one test-boundary classification: a malformed
Firestore result path passed through a cursor helper as INVALID_ARGUMENT. The
repository now translates any invalid returned path into CONTRACT_VIOLATION;
no contract or productive query changed. Final focused tests and lint pass.

## 9. Risks and deferred decisions

Five Course indexes remain unmaterialized and undeployed. Cursors remain
unsigned and concurrent writes can move results between pages. The repository
has no functional consumer. Lifecycle commands, Enrollment composition,
legacy adapters, migration, dual-write, UI and production activation remain
deferred.

## 10. Closure and next phase

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = completed_pending_human_push
SaaS-03A.5I = ready_not_started
```

`SaaS-03A.5B-C1 CourseRepository implementation review and controlled commits = COMPLETE`.
The next phase is index materialization; it is not started here.

## 11. 5I trace

FI-CRS-001..005 are locally materialized without changing this repository.
Deployment and Emulator validation were not performed. CourseRepository remains
`implemented_shadow`; 5I awaits human index review and 5I-C1 is not started.

C1 accepted the index materialization without modifying CourseRepository.
`SaaS-03A.5I = completed`, `SaaS-03A.5I-C1 =
completed_pending_human_push`, and `SaaS-03A.5R-A = ready_not_started`.

## 12. Runtime-suite preparation

The consumer-free repository is now targeted by a reviewed 114-ID Firestore-only
suite. The suite has not run; the repository remains `implemented_shadow` and
intact. C1 is complete pending human push.

B1 integrates its unchanged 114-case runtime suite as a fourth manual CI gate.
CourseRepository remains `implemented_shadow`; runtime PASS is not yet claimed.
