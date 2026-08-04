# SaaS-03A.4R-A — Membership repository runtime test suite

## Purpose, scope, and sources

This phase prepares a Firestore-only integration suite for the real
MembershipRepository, modular Firebase SDK, deployed-in-Emulator Rules,
canonical physical paths, self ownership, pagination, cursors, denials, and
all eight local Membership query indexes. It creates no production code and
does not execute the Emulator, change CI, access Firebase remotely, or deploy.

The audit covered the complete Membership implementation and unit tests, 4A,
R1, 4B and 4I documents, the RegistrationRequest runtime precedent, Rules and
index configuration, Firebase configuration, Shared and adjacent repositories,
Domain 1.2.0, canonical Rules tests, integration tests, workflow, scripts, and
package manifests.

## Location and harness

The suite is isolated under `tests/integration/saas/membership/`:

- `runtimeHarness.mjs` owns the Firestore-only test environment and explicit
  modular SDK dependency map;
- `fixtures.mjs` owns canonical documents and disabled-Rules seeding;
- `membershipRepository.runtime.test.mjs` owns all runtime cases and static
  metadata reconciliation.

It reuses `tests/rules/helpers/rulesTestEnvironment.mjs`, which reads only
`firestore.rules`, invokes `initializeTestEnvironment`, and fixes project ID
`demo-polish-learning`. No port is hardcoded. No Storage or Auth Emulator is
configured. No global Firebase instance, `src/firebase.js`, credentials,
secrets, real project ID, or remote endpoint is used.

The harness provides `createMembershipRuntimeEnvironment`,
`authenticatedFirestore`, `unauthenticatedFirestore`,
`withSecurityRulesDisabled`, `clearFirestore`, `cleanup`, and
`createMembershipRepositoryForContext`. The repository receives only `db`,
`doc`, `getDoc`, `collection`, `collectionGroup`, `query`, `where`, `orderBy`,
`documentId`, `limit`, `startAfter`, and `getDocs`. Direct DENY tests alone use
`setDoc`, `updateDoc`, and `deleteDoc`.

Each test performs `clearFirestore()` followed by
`seedMembershipFixtures()`. Seeding occurs exclusively within
`withSecurityRulesDisabled`; `after` calls environment cleanup.

## Users, Tenants, roles, states, and fixtures

Users are `uid-student-a`, `uid-student-b`, `uid-teacher-a`, `uid-admin-a`,
and `uid-foreign`. Tenants are `tenant-a`, `tenant-b`, and `tenant-c`. All
roles (`student`, `teacher`, `tenant_admin`) and states (`approved`,
`suspended`, `removed`) are represented.

Every Membership fixture physically contains all twelve contract fields.
Timestamps use SDK `Timestamp`; serializers must return canonical ISO UTC
strings. The dataset includes null and string `originRequestId`, restored
approval with suspension history, removal with suspension history, repeated
`createdAt`, foreign UIDs, several pages, and all three Tenants.

| Tenant/path ID | UID | Role | Status | Special coverage |
|---|---|---|---|---|
| tenant-a/membership-a09 | student-a | student | approved | canonical point get |
| tenant-a/membership-a08 | student-a | student | suspended | null origin request |
| tenant-a/membership-a07 | student-a | teacher | removed | retained suspension |
| tenant-a/membership-a06 | student-a | tenant_admin | approved | restored history |
| tenant-a/membership-tie-z | student-a | teacher | approved | timestamp tie |
| tenant-a/membership-tie-a | student-a | student | approved | timestamp tie |
| tenant-a/membership-a05 | student-b | student | approved | foreign UID |
| tenant-a/membership-a04 | teacher-a | teacher | approved | foreign UID/role |
| tenant-a/membership-a03 | admin-a | tenant_admin | approved | no admin bypass |
| tenant-b/membership-b05 | student-a | student | approved | global path tie |
| tenant-b/membership-b04 | student-a | teacher | suspended | cross-Tenant filter |
| tenant-b/membership-b03 | student-a | tenant_admin | removed | retained suspension |
| tenant-b/membership-b02 | student-b | student | suspended | foreign UID |
| tenant-c/membership-c03 | student-a | teacher | approved | third Tenant |
| tenant-c/membership-c02 | student-a | tenant_admin | suspended | third Tenant |
| tenant-c/membership-c01 | student-a | student | removed | retained suspension |
| tenant-c/membership-c00 | foreign | student | approved | empty self filter |
| tenant-a/membership-invalid | student-a | platform_admin | approved | deliberate contract error |
| tenant-a/membershipKeys/uid-student-a | student-a | n/a | approved | key deny-all |

## Runtime matrix

Point get covers approved, suspended, removed, all canonical roles, retained
history, nullable origin, ISO timestamps, frozen detached results, foreign and
anonymous access, wrong Tenant/ID, protected absence, and incompatible physical
data. Protected absence is expected as Rules denial; NOT_FOUND is not assumed.

Tenant-scoped cases cover UID-only plus status, role, and status+role variants;
owner/Tenant isolation; ordering and ID tie-break; empty result; foreign
context; anonymous context; page sizes 1, 2, and 20; lookahead; terminal pages;
full reconstruction; and cursor binding. Collection-group cases repeat the
four variants globally across all Tenants, verify full-path tie-breaking, and
exercise the same pagination and cursor properties.

Cursor cases prove valid reuse and fail-closed rejection for cross-Tenant,
cross-UID, cross-status, cross-role, cross-query-kind, malformed, whitespace,
unsupported version, noncanonical path, and invalid timestamp tokens. The real
repository consequently exercises `startAfter(Date, membershipId)` for a
collection and `startAfter(Date, fullDocumentPath)` for a collection group.

Direct SDK denial cases cover Membership create/update/delete, role/status
changes, membershipKey read/create/update/delete, UID-less and foreign-UID
queries in both scopes, anonymous queries, broad tenant-admin reads, and the
absence of a platform-style bypass. All direct references and queries are SDK
valid so denial reaches Rules.

## Index traceability

| Index | Scope | Filters | Representative IDs |
|---|---|---|---|
| FI-MEM-005 | COLLECTION | uid | RT-MEM-REP-020–025, 060–063 |
| FI-MEM-006 | COLLECTION | uid+status | RT-MEM-REP-030–032 |
| FI-MEM-007 | COLLECTION | uid+role | RT-MEM-REP-033–035 |
| FI-MEM-008 | COLLECTION | uid+status+role | RT-MEM-REP-036, 064 |
| FI-CG-001 | COLLECTION_GROUP | uid | RT-MEM-REP-040–045, 065–068 |
| FI-CG-002 | COLLECTION_GROUP | uid+status | RT-MEM-REP-050–052 |
| FI-CG-006 | COLLECTION_GROUP | uid+role | RT-MEM-REP-053–055 |
| FI-CG-007 | COLLECTION_GROUP | uid+status+role | RT-MEM-REP-056 |

The Firestore Emulator executes these query shapes, but success will not prove
that indexes are deployed in Firebase production. No deploy occurs here.

## Metadata, assertions, and counts

The runtime file registers every case through one metadata helper and asserts
the final counts and unique IDs at module load. Titles carry `[ALLOW]` or
`[DENY]`. Assertions use exact values, nonempty checks before universal
predicates, ordering comparisons, full pagination reconstruction, specific
repository error codes, and `assertFails` for Rules denials.

```text
TOTAL_TEST_IDS = 81
ALLOW = 44
DENY = 37
SUCCESS = 44
RULES_DENY = 26
CONTRACT_ERROR = 11
NOT_FOUND = 0
```

C1 separated malformed from whitespace-only cursor validation and canonical
path from timestamp validation, so each contract now has an independent Test
ID. It also verifies directly that the encoded cursor position equals the last
included item rather than the lookahead. These objective assertion corrections
changed the derived total from 79 to 81 without changing production code.

### Complete assertion matrix

| Test ID | Meta | Outcome | Operation/contract | Principal assertion | Index |
|---|---|---|---|---|---|
| RT-MEM-REP-001 | ALLOW | SUCCESS | point approved | IDs, owner, state, ISO | n/a |
| RT-MEM-REP-002 | ALLOW | SUCCESS | point suspended | lifecycle, null origin | n/a |
| RT-MEM-REP-003 | ALLOW | SUCCESS | point removed | removal and retained suspension | n/a |
| RT-MEM-REP-004 | ALLOW | SUCCESS | point teacher | exact role | n/a |
| RT-MEM-REP-005 | ALLOW | SUCCESS | point tenant_admin | role and historical suspension | n/a |
| RT-MEM-REP-006 | ALLOW | SUCCESS | point immutability | frozen, no SDK objects | n/a |
| RT-MEM-REP-007 | DENY | RULES_DENY | foreign point | FORBIDDEN | n/a |
| RT-MEM-REP-008 | DENY | RULES_DENY | anonymous point | auth denial | n/a |
| RT-MEM-REP-009 | DENY | RULES_DENY | wrong Tenant | FORBIDDEN | n/a |
| RT-MEM-REP-010 | DENY | RULES_DENY | wrong ID | FORBIDDEN | n/a |
| RT-MEM-REP-011 | DENY | RULES_DENY | protected absence | FORBIDDEN, not NOT_FOUND | n/a |
| RT-MEM-REP-012 | DENY | CONTRACT_ERROR | incompatible document | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-020 | ALLOW | SUCCESS | tenant UID | nonempty owner-only result | FI-MEM-005 |
| RT-MEM-REP-021 | ALLOW | SUCCESS | tenant UID | foreign IDs absent | FI-MEM-005 |
| RT-MEM-REP-022 | ALLOW | SUCCESS | tenant scope | every result in tenant-a | FI-MEM-005 |
| RT-MEM-REP-023 | ALLOW | SUCCESS | tenant order | createdAt DESC | FI-MEM-005 |
| RT-MEM-REP-024 | ALLOW | SUCCESS | tenant tie | documentId DESC | FI-MEM-005 |
| RT-MEM-REP-025 | ALLOW | SUCCESS | tenant empty | empty/final/null cursor | FI-MEM-005 |
| RT-MEM-REP-026 | DENY | RULES_DENY | tenant foreign UID | FORBIDDEN | FI-MEM-005 |
| RT-MEM-REP-027 | DENY | RULES_DENY | tenant anonymous | auth denial | FI-MEM-005 |
| RT-MEM-REP-030 | ALLOW | SUCCESS | tenant approved | nonempty exact status | FI-MEM-006 |
| RT-MEM-REP-031 | ALLOW | SUCCESS | tenant suspended | nonempty exact status | FI-MEM-006 |
| RT-MEM-REP-032 | ALLOW | SUCCESS | tenant removed | nonempty exact status | FI-MEM-006 |
| RT-MEM-REP-033 | ALLOW | SUCCESS | tenant student | nonempty exact role | FI-MEM-007 |
| RT-MEM-REP-034 | ALLOW | SUCCESS | tenant teacher | nonempty exact role | FI-MEM-007 |
| RT-MEM-REP-035 | ALLOW | SUCCESS | tenant tenant_admin | nonempty exact role | FI-MEM-007 |
| RT-MEM-REP-036 | ALLOW | SUCCESS | tenant status+role | both exact and ordered | FI-MEM-008 |
| RT-MEM-REP-040 | ALLOW | SUCCESS | group UID | all three Tenants | FI-CG-001 |
| RT-MEM-REP-041 | ALLOW | SUCCESS | group UID | owner-only result | FI-CG-001 |
| RT-MEM-REP-042 | ALLOW | SUCCESS | group exclusion | foreign IDs absent | FI-CG-001 |
| RT-MEM-REP-043 | ALLOW | SUCCESS | group order | global createdAt DESC | FI-CG-001 |
| RT-MEM-REP-044 | ALLOW | SUCCESS | group tie | full path DESC | FI-CG-001 |
| RT-MEM-REP-045 | ALLOW | SUCCESS | group empty | empty/final/null cursor | FI-CG-002 |
| RT-MEM-REP-046 | DENY | RULES_DENY | group anonymous | auth denial | FI-CG-001 |
| RT-MEM-REP-047 | DENY | RULES_DENY | group foreign UID | FORBIDDEN | FI-CG-001 |
| RT-MEM-REP-050 | ALLOW | SUCCESS | group approved | nonempty exact status | FI-CG-002 |
| RT-MEM-REP-051 | ALLOW | SUCCESS | group suspended | nonempty exact status | FI-CG-002 |
| RT-MEM-REP-052 | ALLOW | SUCCESS | group removed | nonempty exact status | FI-CG-002 |
| RT-MEM-REP-053 | ALLOW | SUCCESS | group student | nonempty exact role | FI-CG-006 |
| RT-MEM-REP-054 | ALLOW | SUCCESS | group teacher | nonempty exact role | FI-CG-006 |
| RT-MEM-REP-055 | ALLOW | SUCCESS | group tenant_admin | nonempty exact role | FI-CG-006 |
| RT-MEM-REP-056 | ALLOW | SUCCESS | group status+role | both exact and ordered | FI-CG-007 |
| RT-MEM-REP-060 | ALLOW | SUCCESS | tenant page 1 | exact length/lookahead/cursor | FI-MEM-005 |
| RT-MEM-REP-061 | ALLOW | SUCCESS | tenant page 2 | exact length/new ID | FI-MEM-005 |
| RT-MEM-REP-062 | ALLOW | SUCCESS | tenant reconstruction | complete, no duplicates/omissions | FI-MEM-005 |
| RT-MEM-REP-063 | ALLOW | SUCCESS | tenant terminal | hasMore false/cursor null | FI-MEM-005 |
| RT-MEM-REP-064 | ALLOW | SUCCESS | tenant filtered paging | status+role binding | FI-MEM-008 |
| RT-MEM-REP-065 | ALLOW | SUCCESS | group page 1 | exact length/lookahead/cursor | FI-CG-001 |
| RT-MEM-REP-066 | ALLOW | SUCCESS | group page 2 | exact length/no overlap | FI-CG-001 |
| RT-MEM-REP-067 | ALLOW | SUCCESS | group reconstruction | complete, no duplicates/omissions | FI-CG-001 |
| RT-MEM-REP-068 | ALLOW | SUCCESS | group terminal | hasMore false/cursor null | FI-CG-001 |
| RT-MEM-REP-069 | ALLOW | SUCCESS | cursor origin | last included item, not lookahead | FI-MEM-005 |
| RT-MEM-REP-070 | ALLOW | SUCCESS | tenant cursor reuse | second page succeeds | FI-MEM-005 |
| RT-MEM-REP-071 | ALLOW | SUCCESS | group cursor reuse | second page succeeds | FI-CG-001 |
| RT-MEM-REP-072 | DENY | CONTRACT_ERROR | cross-Tenant cursor | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-073 | DENY | CONTRACT_ERROR | cross-UID cursor | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-074 | DENY | CONTRACT_ERROR | cross-status cursor | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-075 | DENY | CONTRACT_ERROR | cross-role cursor | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-076 | DENY | CONTRACT_ERROR | cross-kind cursor | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-077 | DENY | CONTRACT_ERROR | malformed cursor | INVALID_ARGUMENT | n/a |
| RT-MEM-REP-078 | DENY | CONTRACT_ERROR | unsupported version | CONTRACT_VIOLATION | n/a |
| RT-MEM-REP-079 | DENY | CONTRACT_ERROR | noncanonical path | INVALID_ARGUMENT | n/a |
| RT-MEM-REP-080 | DENY | CONTRACT_ERROR | whitespace cursor | INVALID_ARGUMENT | n/a |
| RT-MEM-REP-081 | DENY | CONTRACT_ERROR | invalid timestamp | INVALID_ARGUMENT | n/a |
| RT-MEM-SEC-001 | DENY | RULES_DENY | Membership create | assertFails | n/a |
| RT-MEM-SEC-002 | DENY | RULES_DENY | Membership update | assertFails | n/a |
| RT-MEM-SEC-003 | DENY | RULES_DENY | Membership delete | assertFails | n/a |
| RT-MEM-SEC-004 | DENY | RULES_DENY | role change | assertFails | n/a |
| RT-MEM-SEC-005 | DENY | RULES_DENY | status change | assertFails | n/a |
| RT-MEM-SEC-010 | DENY | RULES_DENY | key read | canonical point assertFails | n/a |
| RT-MEM-SEC-011 | DENY | RULES_DENY | key create | canonical point assertFails | n/a |
| RT-MEM-SEC-012 | DENY | RULES_DENY | key update | existing point assertFails | n/a |
| RT-MEM-SEC-013 | DENY | RULES_DENY | key delete | existing point assertFails | n/a |
| RT-MEM-SEC-020 | DENY | RULES_DENY | tenant missing UID | valid SDK query assertFails | n/a |
| RT-MEM-SEC-021 | DENY | RULES_DENY | tenant foreign UID | valid SDK query assertFails | n/a |
| RT-MEM-SEC-022 | DENY | RULES_DENY | tenant anonymous | valid SDK query assertFails | n/a |
| RT-MEM-SEC-023 | DENY | RULES_DENY | group missing UID | valid SDK query assertFails | n/a |
| RT-MEM-SEC-024 | DENY | RULES_DENY | group foreign UID | valid SDK query assertFails | n/a |
| RT-MEM-SEC-025 | DENY | RULES_DENY | group anonymous | valid SDK query assertFails | n/a |
| RT-MEM-SEC-026 | DENY | RULES_DENY | broad tenant-admin | no role bypass | n/a |
| RT-MEM-SEC-027 | DENY | RULES_DENY | platform-style broad | no claims/bypass | n/a |

## Command, CI follow-up, limitations, and risks

Future local command, not executed in this phase:

```text
firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/membership/membershipRepository.runtime.test.mjs"
```

Future CI must add a separate static precheck and a separate mandatory
Firestore-only runtime step using the explicit test file and local binary. It
must preserve the existing 201 Rules and 52 RegistrationRequest counts. No
workflow or script is changed here.

Until the next phases, the suite has only static validation: real Rules
compilation, Emulator query/index behavior, and runtime outcomes remain
unconfirmed. Indexes remain local and undeployed; cursor tokens are unsigned;
concurrent mutations can move page boundaries; the repository remains shadow
only with no functional consumer; membership lifecycle writes and key access
remain backend-only/deny-all.

## Closure and next phase

Static closure requires syntax, lint, 23 Membership unit tests, 35 general
tests, build, Rules preflight 201/82/119, metadata reconciliation, clean diff
checks, protected-file immutability, and no Emulator execution.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
MembershipRepository = implemented_shadow
```

The review found two assertion-granularity defects and corrected them without
changing production code. Next is `SaaS-03A.4R-B1 — Membership runtime CI
integration`; it is not started here.

## SaaS-03A.4R-B1 CI trace

The reviewed 81-case suite remains byte-identical and is now represented by a
read-only CI precheck: 44 ALLOW, 37 DENY, with outcomes 44 SUCCESS,
26 RULES_DENY, 11 CONTRACT_ERROR and 0 NOT_FOUND. A third explicit,
Firestore-only runtime gate was prepared after the preserved Rules and
RegistrationRequest gates. Neither the Emulator nor the workflow was executed.

`SaaS-03A.4R-B1 = completed`; `SaaS-03A.4R-B1-C1 =
completed_pending_human_push`; `SaaS-03A.4R-B2 =
blocked_pending_manual_push_and_workflow`.

## FIX1 fixture isolation

The first hosted execution exposed a shared-fixture defect: the intentionally
invalid role document belonged to the canonical student and contaminated 16
self-list cases. It now uses `uid-incompatible`; only RT-MEM-REP-012 queries
that identity. The 81 IDs and 44/37, 44/26/11/0 classifications are unchanged.
The corrected runtime remains pending a new GitHub Actions execution; no
81/81 claim is made during C1.
