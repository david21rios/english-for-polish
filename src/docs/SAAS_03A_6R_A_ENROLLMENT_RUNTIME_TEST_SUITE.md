# SaaS-03A.6R-A — Enrollment repository runtime test suite

## Purpose, scope and sources

This phase prepares a Firestore-only runtime integration suite for the real
EnrollmentRepository, modular Firebase SDK, deployed source Rules and the two
local Enrollment index definitions. It covers indirect self ownership through
Membership, tenant-admin access, Tenant/Membership/Enrollment lifecycle,
pagination, cursors, serialization, isolation and denied operations.

The implementation, unit tests, 6A/R1/6B/6I contracts and reviews, physical and
query models, Rules, indexes, Firebase configuration, preceding runtime suites,
protected repositories, Domain, workflow and scripts were audited read-only.

## Harness and portability

The suite lives exclusively in `tests/integration/saas/enrollment/`:

- `runtimeHarness.mjs` creates the Rules test environment, authenticated and
  anonymous Firestore contexts, disabled-Rules seeding access, clearing and
  cleanup helpers, the real repository factory and a separate direct SDK;
- `fixtures.mjs` defines immutable, isolated physical fixtures and seeds them
  only through `withSecurityRulesDisabled`;
- `enrollmentRepository.runtime.test.mjs` registers 111 classified cases plus
  one executable metadata self-control.

Project ID is exactly `demo-polish-learning`. Only `firestore.rules` is loaded.
Storage and Auth emulators, credentials, secrets, remote Firebase, fixed ports,
absolute paths, shell globs and `src/firebase.js` are absent. The repository SDK
is exactly `doc`, `getDoc`, `collection`, `query`, `where`, `orderBy`,
`documentId`, `limit`, `startAfter`, `getDocs`; direct `setDoc`, `updateDoc` and
`deleteDoc` exist only for Rules-denied cases.

Each case clears Firestore and reseeds a new canonical graph. Final cleanup
always calls the test environment cleanup method.

## Fixture inventory

| Family | Count | Purpose |
|---|---:|---|
| Tenant | 5 | active A/B, suspended, archived, incompatible-isolation |
| Membership | 14 | student/teacher/admin, approved/suspended/removed, Tenant B admin and isolated incompatible actor |
| membershipKey | 14 | one canonical UID key for every Membership |
| Course | 7 | minimal referenced Courses across states/Tenants |
| Enrollment | 12 | 11 canonical plus one isolated lifecycle-incompatible document |
| Total seeded documents | 52 | complete independent graph |

Canonical Enrollments cover pending, active, completed and cancelled; distinct
Memberships and Tenants; equal `enrolledAt` and `updatedAt` values; multiple
pages; suspended/removed Membership history; suspended/archived Tenant behavior
and foreign isolation. Every canonical Enrollment has exactly the nine frozen
physical fields. The incompatible Enrollment uses its own Tenant, Membership,
UID, Course and ID; its sole defect is non-null `completedAt` while status is
active, so it cannot contaminate canonical lists.

## Authorization and operation coverage

Point gets cover self approved across all states, suspended/removed historical
self, approved tenant admin across representative states, suspended-Tenant self,
foreign Membership/Tenant, suspended/removed admin, suspended/archived Tenant,
anonymous, platform client, concealed missing document and isolated serializer
failure.

Self lists cover all-status and each exact status, empty result, approved,
suspended and removed Membership ownership, suspended-Tenant history, foreign
Membership/Tenant, anonymous/platform denial, ordering and isolation.

Admin lists cover all-status and every exact status, empty result, ordering,
approved admin and denial for student, teacher, platform, anonymous,
suspended/removed admin, suspended/archived Tenant and foreign Tenant.

Both list families cover page sizes 1, 2 and 20, lookahead, continuation,
terminal pages, exact-status pagination, reconstruction, tie-breaks and zero
duplicates/omissions. Cursor cases independently cover reusable self/admin
tokens, cross-Tenant/Membership/status/query/order/policy/version bindings,
malformed Base64URL/UTF-8/JSON/schema/timestamp/path/size/canonical JSON.
Malformed tokens map to `INVALID_ARGUMENT`; structurally compatible but
query-incompatible tokens map to `CONTRACT_VIOLATION`.

Serialization verifies exact nine-field shape, new frozen SDK-free objects,
ISO timestamps, nullability, completed/cancelled terminal timestamps and the
isolated lifecycle contract violation.

Direct SDK cases deny create, status update, complete, cancel, Membership/Course
changes and delete. Separate cases deny authenticated/anonymous
collection-group access, missing tenant/Membership filters, Course cohorts,
broad/global/foreign queries and platform bypass.

## Index traceability

FI-ENR-002 is exercised by self all-status, exact-status and both paginated
forms (`RT-ENR-REP-030..038`, `070..073`, `080`, related cursor cases).

FI-ENR-005 is exercised by admin all-status, exact-status and both paginated
forms (`RT-ENR-REP-050..055`, `074..077`, `081`, related cursor cases).

An Emulator pass will validate these query shapes only in the controlled local
environment. It will not prove production deployment, construction or
availability of either index.

## Complete Test ID and assertion matrix

| IDs | Access/outcome | Direct guarantee |
|---|---|---|
| REP-001..022 | mixed SUCCESS/RULES_DENY/CONTRACT_ERROR | point get, ownership, lifecycle, concealment and isolated serializer |
| REP-030..043 | mixed SUCCESS/RULES_DENY | self lists, exact statuses, history, isolation and denials |
| REP-050..064 | mixed SUCCESS/RULES_DENY | admin lists, exact statuses, ordering and actor/Tenant denials |
| REP-070..079 | ALLOW/SUCCESS | self/admin pagination reconstruction, default and empty terminal page |
| REP-080..081 | ALLOW/SUCCESS | reusable self/admin cursors |
| REP-082..089 | DENY/CONTRACT_ERROR | compatible-shape binding incompatibilities |
| REP-090..107 | DENY/CONTRACT_ERROR | malformed token, schema, timestamp, path and canonical JSON |
| REP-110..113 | mixed SUCCESS/CONTRACT_ERROR | runtime serialization, terminal lifecycle and unknown-field rejection |
| SEC-120..126 | DENY/RULES_DENY | seven client writes |
| SEC-130..132 | DENY/RULES_DENY | collection-group authenticated/admin/anonymous denial |
| SEC-133..140 | DENY/RULES_DENY | unsafe query shapes, Course cohort, broad/foreign/platform denial |

Every list assertion that expects content first proves non-empty or exact
length, then directly checks Tenant, Membership/status, order, tie-break,
isolation or page state. The suite does not use vacuous `every()` assertions.

## Metadata and counts

```text
Enrollment Test IDs = 111
ALLOW = 41
DENY = 70
SUCCESS = 41
RULES_DENY = 42
CONTRACT_ERROR = 28
NOT_FOUND = 0
metadata self-control = 1 additional Node test
```

The executable self-control verifies exact total, unique IDs, unique titles,
allowed prefixes/classifications, `ALLOW == SUCCESS`, and
`DENY == RULES_DENY + CONTRACT_ERROR + NOT_FOUND`. There are no dead registered
cases or duplicate IDs.

## Future execution and CI

The portable explicit command, documented but not executed, is:

```text
firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/enrollment/enrollmentRepository.runtime.test.mjs"
```

Windows and GitHub Actions use the same explicit test file without glob or
absolute path. A later B1 phase must add an Enrollment static precheck and a
separate sequential Firestore-only runtime gate; this phase does not modify the
workflow or scripts.

## Validation, risks and limitations

The three runtime files pass `node --check` and ESLint. Enrollment unit tests,
repository prechecks, Rules preflight, general tests, build and diff checks are
recorded by the phase validation. The Enrollment runtime itself and Emulator
index behavior are deliberately not executed, so expectation/Rules divergence
and fixture interaction remain residual risks for human review and later CI.

## State and next phase

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6R = in_progress
SaaS-03A.6R-A = completed_pending_human_test_review
SaaS-03A.6R-A-C1 = next_not_started
SaaS-03A.6R-B = blocked_pending_6R_A_review
EnrollmentRepository = implemented_shadow
```

Decision: `SaaS-03A.6R-A COMPLETE` for static suite preparation only. The next
microphase is `SaaS-03A.6R-A-C1 — Enrollment runtime suite review and controlled
commits`; it is not initiated.

## Controlled review outcome

6R-A-C1 corrects the admin empty operation, adds explicit default/empty
pagination guarantees and strengthens ALLOW point assertions. Final metadata is
111 IDs: 41 ALLOW/SUCCESS and 70 DENY, split into 42 RULES_DENY and 28
CONTRACT_ERROR. No product, Rules or index defect was found. Runtime is still
not executed.

```text
SaaS-03A.6R-A = completed
SaaS-03A.6R-A-C1 = completed_pending_human_push
SaaS-03A.6R-B1 = ready_not_started
EnrollmentRepository = implemented_shadow
```

## SaaS-03A.6R-B1 CI integration

The reviewed 111-ID suite is now guarded by the deterministic Enrollment static
precheck and wired as the fifth independent Firestore-only runtime session in
the manual workflow. Counts remain 111/41/70 with outcomes 41/42/28/0.
Integration did not execute the Emulator or workflow and does not claim runtime
PASS. B1 is completed; B1-C1 awaits human push and B2 awaits a new manual run.
