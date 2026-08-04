# SaaS-03A.6B — EnrollmentRepository implementation

## Purpose and scope

This phase implements the read-only, tenant-aware Enrollment repository frozen
by 03A.6A-R1. It is shadow-only: no consumer, UI, provider, migration, dual
write, deployment, index materialization or runtime suite is introduced.

Normative sources are the 03A.6A audit and R1 contract, current Rules and
physical/query models, Shared infrastructure and Membership/Course repository
precedents. Rules, indexes, Shared, Domain and existing repositories are intact.

## Structure

```text
src/services/saas/enrollment/
  enrollmentRepository.js
  enrollmentSerializer.js
  enrollmentValidation.js
  enrollmentQueries.js
  enrollmentCursor.js
  index.js
  __tests__/
    testDoubles.mjs
    serializer.test.mjs
    repository.test.mjs
    cursorAndOptions.test.mjs
```

The barrel exports only `createEnrollmentRepository`.

## Factory, dependencies and API

`createEnrollmentRepository({ db, sdk })` requires exactly `doc`, `getDoc`,
`collection`, `query`, `where`, `orderBy`, `documentId`, `limit`, `startAfter`
and `getDocs`. Missing dependencies and every extra dependency, including write
or collection-group SDK functions, fail before use. There is no global Firebase
import, singleton or mutable state.

The frozen repository exposes exactly:

```text
getEnrollment
listOwnEnrollmentsForMembership
listTenantEnrollmentsForAdmin
```

## Physical serializer

The serializer requires the exact nine-field allowlist: enrollmentId, tenantId,
membershipId, courseId, status, enrolledAt, updatedAt, completedAt and
cancelledAt. It validates a canonical four-segment Enrollment path, snapshot ID,
physical IDs, expected Tenant/Enrollment and expected Membership for self lists.
Unknown or absent fields fail closed.

The four timestamps are converted through Shared to canonical ISO-8601;
terminal timestamps preserve null. The four-state lifecycle is enforced:
pending/active require both terminal timestamps null, completed requires only
completedAt, and cancelled requires only cancelledAt. The result is fresh and
frozen and exposes no SDK object. No Membership or Course read occurs.

## Point and list operations

`getEnrollment` constructs the canonical path, performs one `getDoc`, serializes
the result and maps Firebase errors under `get_enrollment`/`enrollment`.

The self list fixes Tenant, explicit Membership and canonical status (fixed all
states `in` or exact equality), orders by enrolledAt/documentId descending and
serializes with expected Membership. The admin list fixes Tenant and canonical
status, orders by updatedAt/documentId descending and has no Membership/Course
option. Both use one query and no auxiliary reads.

## Options, pagination and cursor

Only status, pageSize and cursor are accepted. Undefined options means empty;
null, arrays, non-plain values, explicit undefined, unknown/prohibited fields,
invalid status/page size and empty cursor fail with INVALID_ARGUMENT.

Page sizes are 1/20/50. Both queries use limit-plus-one, exclude lookahead and
return a frozen `{ items, nextCursor, hasMore }` result. Empty and terminal pages
have no cursor.

Portable cursor version 1 uses policy `enrollment_standard_v1`, unpadded
Base64URL over canonical JSON/UTF-8 and a 2048-character maximum. Separate self
and admin bindings/positions are validated fail-closed. Malformed tokens use
INVALID_ARGUMENT; valid but cross-query/Tenant/Membership/status tokens use
CONTRACT_VIOLATION. Resume uses a Date plus simple document ID.

## Errors and exclusions

Shared error mapping is used and sensitive input is not echoed. Internal
operations are get/list, `decode_enrollment_cursor` and `serialize_enrollment`.

No create, state transition, cancellation, delete, generic query, Course cohort,
global/collection-group list, uniqueness key, cross-root validation, Membership
read or Course read exists.

## Tests and validation

Four test modules contain 46 independent Node test cases covering all lifecycle
states, nine-field strictness, identity/path/context mismatches, timestamps,
freezing, point access/error mapping, exact self/admin query shapes, all status
variants, page boundaries/lookahead, cursor resume and incompatibilities,
options, exact dependencies and minimal public API.

Initial results:

```text
Enrollment tests = 46/46
ESLint Enrollment = PASS
node --check Enrollment = PASS
```

## Risks and deferred decisions

Runtime compatibility with Rules and future indexes is not demonstrated in this
phase. FI-ENR-002/FI-ENR-005 remain unmaterialized. Teacher cohort, admin filters
by Membership/Course, uniqueness/re-enrollment, cross-Tenant composition,
writes, post-archive operational policy and consumers remain deferred.

## State and next phase

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A = incomplete_superseded_by_resolution
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed_pending_human_code_review
EnrollmentRepository = implemented_shadow
SaaS-03A.6B-C1 = next_not_started
```

Decision: `SaaS-03A.6B COMPLETE`. No later phase is started.

## Controlled review outcome

SaaS-03A.6B-C1 found no technical defect or contract divergence. The 46 tests,
minimal API, read-only dependency surface, serializer, queries, pagination and
cursor were accepted. Technical and documentation changes are committed
separately; no push, Emulator or runtime is performed.

```text
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed_pending_human_push
EnrollmentRepository = implemented_shadow
SaaS-03A.6I = completed_pending_human_index_review
SaaS-03A.6I-C1 = next_not_started
SaaS-03A.6R-A = blocked_pending_6I_review_and_commit
```

03A.6I adds only the two R1-required local index definitions (FI-ENR-002 and
FI-ENR-005). The repository remains unchanged. Emulator validation and
production deployment are not performed.

6I-C1 finds no repository/index divergence and accepts both definitions without
technical correction. EnrollmentRepository remains `implemented_shadow`; 6I is
completed, 6I-C1 is `completed_pending_human_push`, and 6R-A is
`ready_not_started`.

6R-A adds only the isolated runtime suite and documentation. The repository is
unchanged. Static preparation contains 111 classified IDs; no Emulator or
workflow runs, and runtime PASS is not claimed.

6R-A-C1 reviews and corrects only runtime tests. The repository remains intact;
the final 111-ID suite awaits later CI integration and execution.
