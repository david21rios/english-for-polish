# SaaS-03A.6R-A-C1 — Enrollment runtime suite review

## Purpose and sources

This phase performs the fail-closed technical review of the prepared Enrollment
runtime suite before controlled commits. It audits the three runtime files,
EnrollmentRepository and unit tests, Rules, indexes, configuration, 6A–6R-A
contracts and documentation, preceding runtime suites, protected repositories,
Domain, workflow and scripts. Emulator, workflow, remote Firebase, deploy and
push remain excluded.

```text
branch = main
commit_base = 13d42817692ccdb2637efccc1621c2ee60f83c8c
```

## Harness review

The harness fixes `demo-polish-learning`, delegates to the canonical
`initializeTestEnvironment` helper, loads only `firestore.rules`, provides real
UID-authenticated and anonymous contexts, clears Firestore per case and cleans
up at suite completion. `withSecurityRulesDisabled` is limited to fixture setup
and the dedicated unknown-field serializer setup. No port, global Firebase,
`src/firebase.js`, credential, secret, Storage/Auth emulator or remote access is
present.

The repository receives exactly the closed read-only SDK dependency set. Direct
write SDK functions remain separate and occur only in `assertFails` DENY cases.

## Fixture review

The final graph contains 5 Tenants, 14 Memberships, 14 matching membershipKeys,
7 supporting Courses and 12 Enrollments, for 52 seeded documents. Paths, IDs,
UIDs, Tenant bindings, roles, states, lifecycle timestamps and membershipKey
pointers are coherent. Tenant B now has an approved tenant admin dedicated to
the empty-admin-list guarantee. The archived Course is referenced by cancelled
historical Enrollment.

Eleven Enrollments are canonical. The incompatible Enrollment has an exclusive
Tenant, Membership, membershipKey, UID, Course and Enrollment ID. Its seeded
defect is active lifecycle with non-null `completedAt`; the independent
unknown-field case rewrites only that isolated document under disabled Rules.
It cannot enter canonical Tenant A/B queries.

## Rules, authorization and operations

The review maps self approved/suspended/removed and suspended-Tenant historical
reads to the existing Rules. Archived Tenant, foreign ownership, anonymous and
platform access remain denied. Tenant-admin requires active Tenant and approved
admin Membership; suspended/removed admins and suspended/archived Tenants are
denied. Required Tenant, Membership and membershipKey documents exist within
the bounded Rules access graph.

Point gets now directly assert Tenant, Enrollment, Membership, Course, status,
lifecycle nullability and freeze for every ALLOW row. Missing protected data is
classified RULES_DENY, while the readable isolated incompatible document is a
serializer CONTRACT_ERROR.

Self/admin list constraints exactly match R1 and FI-ENR-002/FI-ENR-005. Every
content assertion first proves exact or non-zero cardinality. The corrected
admin empty case uses the actual admin method and dedicated Tenant B admin.

Pagination includes page sizes 1/2/20, default page behavior, empty terminal
page, exact status, lookahead, cursor source, total reconstruction, ordering and
zero duplicate/omission checks. Cursor cases keep malformed
`INVALID_ARGUMENT` separate from binding-compatible `CONTRACT_VIOLATION`.

Serialization independently covers exact shape, pending/active through point
rows, completed, cancelled, nullability, ISO timestamps, SDK-free freeze,
unknown fields and incompatible lifecycle. Seven valid direct writes and all
unsafe query families reach Rules through `assertFails`; no write dependency is
injected into EnrollmentRepository.

## Objective defects and corrections

The initial prepared inventory was 109 IDs (39 ALLOW, 70 DENY; 39 SUCCESS,
42 RULES_DENY, 28 CONTRACT_ERROR, 0 NOT_FOUND). Review found three test-suite
defects only:

1. the admin empty-result title invoked a Tenant B self list;
2. default-page and paginated-empty guarantees were documented but lacked
   independent Test IDs;
3. ALLOW point gets did not directly assert status, Membership, Course and
   lifecycle nullability.

Corrections add a canonical Tenant B admin fixture/key, correct the admin empty
operation, add REP-078/079, strengthen point assertions and reference the
archived Course historically. No product, Rules, index or contract defect was
found.

## Final metadata and assertion matrix

```text
Enrollment Test IDs = 111
ALLOW = 41
DENY = 70
SUCCESS = 41
RULES_DENY = 42
CONTRACT_ERROR = 28
NOT_FOUND = 0
metadata self-control = one additional Node test
```

IDs and ID-qualified titles are unique. Every registered row has an executable
test and a direct principal assertion. `ALLOW == SUCCESS` and
`DENY == RULES_DENY + CONTRACT_ERROR + NOT_FOUND` are executable invariants.
The complete range-to-actor/operation/fixture/assertion/Rule/index matrix remains
in the 6R-A document and executable registry.

## Index traceability and portability

FI-ENR-002 is exercised by self all/exact status, pagination, default/empty page
and self cursor. FI-ENR-005 is exercised by admin all/exact status, pagination
and admin cursor. No production deployment is claimed.

All files use explicit relative paths, modular SDK and an explicit future test
file. They are portable to Windows and GitHub Actions without glob or fixed
port. CI precheck/gate work belongs to later B1.

## Validation, commits and integrity

The three runtime files pass syntax and lint checks; Enrollment unit tests,
Course/Membership/RegistrationRequest prechecks, Rules preflight, general tests,
build and diff checks pass. Protected hashes/manifests remain unchanged.

The technical commit contains exactly the three runtime files with message
`test(saas-repositories): add Enrollment runtime integration suite`. The
documentary commit contains only the authorized documents with message
`docs(saas): record Enrollment runtime suite review`.

## Risks and final state

Runtime is still not executed. Emulator behavior, Rules/query interaction and
local index execution require the later reviewed CI flow. This is not evidence
of runtime PASS or productive index availability.

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6R = in_progress
SaaS-03A.6R-A = completed
SaaS-03A.6R-A-C1 = completed_pending_human_push
SaaS-03A.6R-B1 = ready_not_started
EnrollmentRepository = implemented_shadow
```

Decision: `SaaS-03A.6R-A-C1 COMPLETE`. The next phase is
`SaaS-03A.6R-B1 — Enrollment runtime CI integration`; it is not initiated.
