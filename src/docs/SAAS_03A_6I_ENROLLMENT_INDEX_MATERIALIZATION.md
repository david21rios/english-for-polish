# SaaS-03A.6I — Enrollment index materialization

## Purpose and scope

This phase materializes locally, in `firestore.indexes.json`, only the two
composite indexes required by the implemented EnrollmentRepository query
families. It does not change Rules, repositories, tests, packages or Firebase
configuration, and it does not run Emulator, deploy, commit or push.

Commit base: `23fbb2073368e10323141940670e23fc05f92a53`.

## Sources and real queries

The implementation, unit tests, R1 contract, physical/query models, existing
index file, Firebase configuration and the RegistrationRequest, Membership and
Course precedents were reviewed. The real list queries are limited to:

- self: `tenantId == tenantId`, `membershipId == membershipId`, and either an
  exact canonical status or the fixed all-status `in`, ordered by
  `enrolledAt DESC` then `documentId() DESC`;
- tenant admin: `tenantId == tenantId` and either an exact canonical status or
  the fixed all-status `in`, ordered by `updatedAt DESC` then
  `documentId() DESC`.

There is no Course filter, Membership-only admin query, collection-group query,
global query or other materialized variant. Equality and `in` use the same
field signature for each query family.

## Inventory before materialization

```text
TOTAL_INDEXES_BEFORE = 17
REGISTRATION_REQUEST_INDEXES_BEFORE = 4
MEMBERSHIP_INDEXES_BEFORE = 8
COURSE_INDEXES_BEFORE = 5
ENROLLMENT_INDEXES_BEFORE = 0
FIELD_OVERRIDES_BEFORE = 0
DUPLICATES_BEFORE = 0
CONFLICTS_BEFORE = 0
```

The exact structural signatures of all 17 preceding entries are preserved.

## Materialized indexes

### FI-ENR-002 — own-Membership Enrollment list

```text
collectionGroup = enrollments
queryScope = COLLECTION
tenantId ASCENDING
membershipId ASCENDING
status ASCENDING
enrolledAt DESCENDING
```

This single signature covers exact status and the fixed canonical status `in`.

### FI-ENR-005 — tenant-admin Enrollment list

```text
collectionGroup = enrollments
queryScope = COLLECTION
tenantId ASCENDING
status ASCENDING
updatedAt DESCENDING
```

This single signature covers exact status and the fixed canonical status `in`.

No Enrollment `COLLECTION_GROUP` or speculative index is introduced.

FI-ENR-001, FI-ENR-003, FI-ENR-004, FI-ENR-006 and FI-ENR-007 remain
deliberately unmaterialized. They belong to deferred lookup, Course cohort,
historical or backend query families absent from the client-safe repository.

## `documentId()` and implicit `__name__`

The queries explicitly order by `documentId()` after their primary timestamp.
The installed Firebase Tools 15.24.0 implementation in
`node_modules/firebase-tools/lib/firestore/api.js` uses
`FirestoreApi.processIndex()` and `FirestoreApi.lastIndexFieldOrder()` to derive
the implicit `__name__` suffix from the last explicit ordered index field.
Therefore both Enrollment signatures receive implicit `__name__ DESCENDING`
from `enrolledAt DESCENDING` or `updatedAt DESCENDING`. Adding `__name__`
explicitly to this JSON is neither required nor appropriate.

## Resulting inventory and validation

```text
TOTAL_INDEXES_AFTER = 19
REGISTRATION_REQUEST_INDEXES_AFTER = 4
MEMBERSHIP_INDEXES_AFTER = 8
COURSE_INDEXES_AFTER = 5
ENROLLMENT_INDEXES_AFTER = 2
FIELD_OVERRIDES_AFTER = 0
DUPLICATES_AFTER = 0
CONFLICTS_AFTER = 0
```

The root shape, arrays, allowed keys, collection groups, scopes, non-empty
field paths, one valid order modality per field, directions and structural
signatures are validated locally. `firestore.indexes.json` is valid JSON.

Project validation results are: Enrollment unit tests 46/46, Enrollment ESLint
PASS, Enrollment `node --check` PASS, Course precheck 114/32/82, Membership
precheck 81/44/37, RegistrationRequest precheck 52/34/18, Rules preflight
222/88/134, general tests 35/35, build PASS and `git diff --check` PASS.

## Hashes and integrity

Before materialization, the index file SHA-256 was
`7a472c04892b73a9232bf3410d516ab34a15e77015523f8aa018d8f5051c1672`.
After materialization it is
`f9c35524d282076604dcc01945fa78fa9eccd6c9e559bfaa2b0ae5517c8f1d16`.
Rules, Storage, packages,
Firebase configuration, repositories, Domain, tests, workflows and scripts
remain byte-for-byte or manifest-identical.

## Rollback

Rollback removes only the two `enrollments` entries with the exact FI-ENR-002
and FI-ENR-005 signatures, preserves all preceding 17 indexes and the complete
`fieldOverrides` array, reparses JSON, reruns structural duplicate/conflict
validation and confirms restoration of the prior SHA-256. It does not touch
Rules or any repository. Rollback is documented only and is not executed.

## Productive limitation and risks

```text
local_materialization = completed
emulator_validation = not_performed
production_deployment = not_performed
```

Local JSON materialization does not prove that these indexes are deployed,
built or available in a production Firebase project. Runtime compatibility with
Rules remains unverified until the future Firestore-only suite. Deferred query
families remain deliberately unindexed.

## Closure criteria and state

The real queries and R1 contract agree, both exact signatures are materialized,
the prior inventory and `fieldOverrides` are preserved, JSON is valid, and no
duplicates or conflicts exist. Technical code remains unchanged.

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed_pending_human_push
SaaS-03A.6I = completed_pending_human_index_review
SaaS-03A.6I-C1 = next_not_started
SaaS-03A.6R-A = blocked_pending_6I_review_and_commit
EnrollmentRepository = implemented_shadow
```

6R-A traces FI-ENR-002 and FI-ENR-005 through self/admin exact, all-status and
paginated cases. The suite is statically prepared only; Emulator validation and
production deployment remain not performed.

6R-A-C1 confirms both index trace families remain complete after test review.
Neither the index JSON nor its deployment state changes.

Decision: `SaaS-03A.6I COMPLETE`.

The next microphase is `SaaS-03A.6I-C1 — Enrollment index review and
controlled commits`, with readiness `next_not_started`. It is not initiated.

## Controlled review outcome

6I-C1 accepted FI-ENR-002 and FI-ENR-005 without technical correction. Their
signatures, the preceding 17 indexes, empty `fieldOverrides` and implicit
`__name__ DESC` treatment pass final review. The index and documentary changes
are committed separately.

```text
SaaS-03A.6I = completed
SaaS-03A.6I-C1 = completed_pending_human_push
SaaS-03A.6R-A = ready_not_started
EnrollmentRepository = implemented_shadow
```

## Definitive runtime evidence

B2 records `emulator_query_validation = passed` for FI-ENR-002 and FI-ENR-005.
Both remain locally materialized and `production_deployment = not_performed`.
FI-ENR-001/003/004/006/007 remain deferred; no index is changed by B2.
