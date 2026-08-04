# SaaS-03A.5R-A — CourseRepository runtime test suite

## Purpose and scope

This phase prepares, but does not execute, a Firestore-only runtime suite for
CourseRepository, the real modular SDK, current Rules, five local Course index
shapes and tenant-aware authorization. No workflow, precheck, Rule, index,
repository, package or remote resource changes.

## Harness

The suite lives under `tests/integration/saas/course/`: `runtimeHarness.mjs`,
`fixtures.mjs`, and `courseRepository.runtime.test.mjs`. It reuses the canonical
Rules environment, fixes project `demo-polish-learning`, loads only
`firestore.rules`, creates authenticated/anonymous contexts, clears Firestore
before each test, seeds only through `withSecurityRulesDisabled`, and calls
`cleanup()` after the suite. It configures neither Storage nor Auth Emulator,
contains no port, credential, absolute path, Firebase global or `src/firebase.js`.

The real factory receives only `doc`, `getDoc`, `collection`, `query`, `where`,
`orderBy`, `documentId`, `limit`, `startAfter`, and `getDocs`. Direct security
tests use modular `setDoc`, `updateDoc`, `deleteDoc`, `collectionGroup`, and read
query functions outside the repository.

## Fixtures

| Family | Count | Coverage |
|---|---:|---|
| Tenant | 5 | active A/B, suspended, archived, isolated incompatible Tenant |
| Membership | 16 | approved student/teacher/admin, role-specific suspended/removed actors, tenant-b empty-admin actor, inactive-Tenant actors, cross-Tenant and isolated incompatible user |
| Course | 13 | 12 canonical plus one isolated incompatible Course |

The fixture inventory contains 34 primary fixtures: 5 Tenants, 16 Memberships,
and 13 Courses. With one matching membershipKey per Membership, seeding writes
50 Firestore documents.

Course fixtures cover draft/active/archived, A1–C2, learning `en/pl/es`, support
`pl/es/en`, language combinations, equal displayName and updatedAt ties,
multiple pages and cross-Tenant isolation. Every canonical Course has all twelve
physical fields. The invalid BCP 47 Course is confined to
`tenant-incompatible`, `uid-course-incompatible`, and a dedicated point test.

Membership keys use the exact Rules key algorithm: `u1_` plus UTF-8 Base64 with
padding removed. Claims do not grant authorization; Rules resolve Tenant,
membershipKey and Membership.

## Assertions and coverage

Point tests independently cover the student 1/0/0, teacher 1/1/0 and
tenant-admin 1/1/1 state matrices, suspended/removed Membership, inactive
Tenant, foreign/anonymous/platform users, protected absence, frozen output and
isolated CONTRACT_VIOLATION.

Student and teacher catalogs cover all four language-filter combinations,
status exclusion, ordering and Tenant isolation. Admin covers omitted and each
exact status with updatedAt/documentId DESC. Pagination reconstructs student,
filtered teacher, all-state admin and exact-status admin pages at sizes 1/2/20,
checking terminal cursor, uniqueness and omission-free static reconstruction.

Cursor tests cover reusable active/teacher/admin tokens, cross-Tenant,
cross-query-kind, cross-language, cross-status, cross-order, policy/version
incompatibility and malformed empty, whitespace, padded/invalid Base64URL,
invalid JSON/UTF-8, extra/missing schema, noncanonical path, invalid timestamp
and oversized tokens. Existing Course unit tests separately inspect
the exact `startAfter(displayName, courseId)` and
`startAfter(Date(updatedAt), courseId)` values; runtime pagination proves those
value cursors produce valid Emulator queries.

Security cases directly exercise create/update/status/delete denial, Course
collection-group denial for four contexts, and unsafe tenant queries lacking or
exceeding their actor status proof. All DENY operations are valid SDK requests
intended to reach Rules.

## Index traceability

| Index | Methods and filters | Runtime IDs |
|---|---|---|
| FI-CRS-001 | active/teacher without languages | REP-020, REP-030, REP-050..052 |
| FI-CRS-002 | admin omitted/exact status | REP-040..043, REP-053..054 |
| FI-CRS-003 | learning language | REP-021, REP-031, REP-052 |
| FI-CRS-004 | support language | REP-022, REP-032 |
| FI-CRS-005 | both languages | REP-023, REP-033 |

Emulator success would validate query shapes locally, but would not prove these
indexes are deployed, built or available in Firebase production.

## IDs and outcomes

```text
TOTAL = 114
ALLOW = 32
DENY = 82
SUCCESS = 32
RULES_DENY = 56
CONTRACT_ERROR = 26
NOT_FOUND = 0
```

Every runtime ID uses `RT-CRS-REP-*` or `RT-CRS-SEC-*`, includes ALLOW/DENY
metadata and an explicit outcome. The suite self-checks uniqueness, prefixes,
metadata/outcome domains and ALLOW/SUCCESS consistency.

## C1 assertion review

The controlled review found objective gaps in the prepared suite: language
filters in teacher results were not asserted directly; empty pages were not
independent cases for all three APIs; pagination reconstruction did not compare
each continuation position with the last included item; update-status and
archive shared one security case; collection-group lacked unfiltered variants;
three nested cursor schemas were not isolated; and the metadata self-control did
not freeze the resulting counts.

Those gaps were corrected without changing production code. The executable
assertion matrix is the `cases` registry in the runtime file. Its trace is:

| IDs | Actor/Tenant | Operation | Main assertion | Outcome/index |
|---|---|---|---|---|
| REP-001..018 | role/state matrix | point get | identity, status, timestamps or exact RepositoryError | SUCCESS/RULES_DENY/CONTRACT_ERROR |
| REP-020..023,124 | student/tenant-a | active catalog | exact filters, nonempty/empty, order and exclusion | SUCCESS; FI-CRS-001/003/004/005 |
| REP-030..034,125 | teacher/student | teacher catalog | draft+active, exact filters, archived exclusion or Rules denial | SUCCESS/RULES_DENY; FI-CRS-001/003/004/005 |
| REP-040..046,126 | admin/non-admin | admin catalog | all states/exact status/empty or Rules denial | SUCCESS/RULES_DENY; FI-CRS-002 |
| SEC-094..109 | all actors/Tenant states | repository lists | exact authorization denial | RULES_DENY; corresponding Course index |
| REP-050..054,127 | three actors | pagination | page bound, lookahead, last-item cursor, terminal reconstruction | SUCCESS; FI-CRS-001..005 |
| REP-060..070,110..123,128..130 | three query kinds | cursor | reuse or exact binding/schema/path/error classification | SUCCESS/CONTRACT_ERROR |
| REP-071..072 | student/admin | serialization | deep freeze, ISO/null lifecycle and SDK-free output | SUCCESS |
| SEC-078,080..083 | tenant_admin | direct writes | valid SDK request reaches Rules | RULES_DENY |
| SEC-084..087,110..111 | auth/admin/platform/anonymous | collection-group | filtered and unfiltered query reaches Rules | RULES_DENY |
| SEC-088..093,112..118 | unsafe actors/Tenants | tenant list | valid unsafe query reaches Rules | RULES_DENY |

Canonical cursor tokens are intentionally unsigned. Altering a displayName,
courseId or updatedAt into another structurally valid position cannot be
distinguished from a legitimately issued position; this remains a documented
contract risk rather than a false CONTRACT_VIOLATION assertion.

## Future execution and portability

Local command:

```text
firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/course/courseRepository.runtime.test.mjs"
```

Future CI command:

```text
./node_modules/.bin/firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/course/courseRepository.runtime.test.mjs"
```

All repository paths use URL-relative imports and modular SDK APIs compatible
with Windows Node and the Ubuntu GitHub Actions runner. Neither command was run
in this phase. A later B phase must add a static precheck and explicit workflow
gate after C1 review.

## Risks, limitations and state

Runtime behavior remains unverified until a later authorized Emulator run.
Rules query proof, local indexes, cursor movement under concurrent writes,
unsigned canonical cursor-position alteration and SDK error concealment remain
runtime risks, not claims of success. There is no
remote validation, deploy, Storage, migration, dual-write or consumer.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-A = completed
SaaS-03A.5R-A-C1 = completed_pending_human_push
SaaS-03A.5R-B1 = ready_not_started
CourseRepository = implemented_shadow
```

Next is `SaaS-03A.5R-B1 — Course runtime CI integration`; it is ready but not
started. Static preparation and C1 review meet their closure criteria, but no
runtime PASS or Emulator index validation is asserted.

## B1 CI integration

B1 adds a read-only 114/32/82 static precheck and a fourth independent Course
Firestore runtime gate. The suite itself is unchanged; neither gate was run in
this phase. B1 is completed pending human push and B2 remains blocked pending a
new manual workflow execution.
