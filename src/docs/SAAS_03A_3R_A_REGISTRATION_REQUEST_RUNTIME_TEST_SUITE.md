# SaaS-03A.3R-A — RegistrationRequest runtime test suite

## Purpose and audited foundation

This phase adds a Firestore-only integration suite for the real
`RegistrationRequestRepository`, the modular Web SDK, `firestore.rules`, and the
four locally materialized RegistrationRequest query shapes. It does not execute
the Emulator, deploy indexes, contact Firebase remotely, or connect a consumer.

The existing Rules harness was audited in full. It loads only `firestore.rules`,
uses `initializeTestEnvironment`, fixes the project ID to
`demo-polish-learning`, exposes authenticated and unauthenticated Firestore
contexts, and supports privileged fixture seeding, clearing, and cleanup. The
repository can receive the authenticated Firestore instance and modular SDK
functions directly, so no product Firebase singleton or production config is
required.

The suite lives in `tests/integration/saas/registrationRequest/`. This location
keeps Emulator-backed repository integration separate from pure repository unit
tests and the canonical 201 Rules test IDs.

## Structure and dependencies

- `runtimeHarness.mjs`: test environment, users, Tenants, authenticated database
  contexts, real repository factory, and direct SDK operations for negative
  security cases.
- `fixtures.mjs`: twelve canonical documents seeded only through
  `withSecurityRulesDisabled`.
- `registrationRequestRepository.runtime.test.mjs`: 52 independently identified
  runtime cases.

The repository factory receives `db` plus `doc`, `getDoc`, `collection`,
`collectionGroup`, `query`, `where`, `orderBy`, `documentId`, `limit`,
`startAfter`, and `getDocs` from the installed modular Web SDK. Direct denial
tests additionally use `setDoc`, `updateDoc`, and `deleteDoc`; those functions
are not added to the repository API.

## Identities, Tenants, and fixtures

The isolated identities are `uid-student-a`, `uid-student-b`,
`uid-teacher-a`, and `uid-admin-a`, plus an anonymous context. No custom claim
grants a bypass. The Tenants are `tenant-a`, `tenant-b`, and `tenant-c`.

Fixtures cover `pending`, `approved`, `rejected`, `cancelled`, and `expired`,
including their exact conditional lifecycle fields. They span three Tenants and
two owners, include multiple pages, and include equal `requestedAt` values with
controlled document IDs to exercise the descending document-path tie-break.

Before every case the suite calls `clearFirestore()` and reloads fixtures with
Rules disabled. After the suite it calls `cleanup()`. Tests therefore do not
depend on execution order or retain an environment/process after completion.

## Runtime matrix

| Area | Test IDs | Count | Contract exercised |
| --- | --- | ---: | --- |
| Point get | RT-RRQ-REP-001..006 | 6 | owner history, foreign/anonymous denial, protected nonexistence denial |
| Tenant list, no status | RT-RRQ-REP-010..015 | 6 | UID/Tenant isolation, order, tie-break, empty result |
| Tenant list, status | RT-RRQ-REP-020..024 | 5 | every canonical status |
| Collection group, no status | RT-RRQ-REP-030..035 | 6 | cross-Tenant self list, isolation, global order, anonymous denial |
| Collection group, status | RT-RRQ-REP-040..044 | 5 | status and UID isolation |
| Pagination | RT-RRQ-REP-050..057 | 8 | limit + 1, cursor, no duplicates, terminal page |
| Cursor binding | RT-RRQ-REP-060..065 | 6 | valid reuse and query/Tenant/status/UID incompatibility |
| Writes and keys | RT-RRQ-SEC-001..005 | 5 | create/update/delete and key read/create denied |
| Unsafe query shapes | RT-RRQ-SEC-010..014 | 5 | missing/foreign UID and anonymous queries denied |

The suite defines 52 unique IDs: 34 `ALLOW` and 18 `DENY`. `[ALLOW]` marks an
expected successful repository/Rules contract. `[DENY]` marks an expected
rejection outcome. FIX1 confirmed that RT-RRQ-REP-006 is a Rules permission
denial because the protected missing resource cannot satisfy `resource.data`
conditions. Repository errors are asserted by normalized code, while direct
Rules denials use `assertFails`.

## Index traceability and limitation

| Local index | Runtime query |
| --- | --- |
| FI-RRQ-001 | Tenant-scoped self list without status |
| FI-RRQ-002 | Tenant-scoped self list with status |
| FI-CG-003 | collection-group self list without status |
| FI-CG-004 | collection-group self list with status |

Every query variant is executed by at least one future runtime case. The local
Firestore Emulator can exercise these shapes with the checked-in configuration,
but Emulator success must not be represented as proof that production composite
indexes exist or are deployed. Remote materialization remains a separately
authorized operational concern.

## Proposed execution and CI separation

Run later, only after human authorization:

```text
firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/registrationRequest/registrationRequestRepository.runtime.test.mjs"
```

The explicit file path avoids shell-dependent glob expansion on Windows and in
GitHub Actions. `--only firestore` excludes Storage and Auth emulators; Rules
Unit Testing supplies simulated auth contexts. The existing workflow must later
add a separate step for this command after the canonical Rules runtime step.
Its output must report `RegistrationRequest runtime tests = 52` independently
and must not alter `201 / 82 / 119`. No workflow change belongs to this phase.

## Risks, exclusions, and next state

The suite is statically valid but deliberately unexecuted until 03A.3R-B.
Runtime may reveal Emulator/index behavior, SDK query restrictions, or Rules
evaluation differences that static analysis cannot prove. Concurrent pagination
can still duplicate or omit records, as already documented by the cursor
contract. No Storage, UI, Provider, legacy migration, write API, production
credential, remote project, deploy, or MembershipRepository is included.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed_pending_human_test_review
SaaS-03A.3R-B = blocked_pending_3R_A_review
```

The next microphase is `SaaS-03A.3R-A-C1 — RegistrationRequest runtime suite
review and controlled commits`. It must review and commit this suite before
03A.3R-B may execute it with the Firestore Emulator.

## C1 fixture audit

| Document | Tenant | UID | Status | requestedAt | Purpose |
| --- | --- | --- | --- | --- | --- |
| request-a05 | tenant-a | uid-student-a | pending | 12:15 | latest self item |
| request-a04 | tenant-a | uid-student-b | pending | 12:14 | foreign UID |
| request-a03 | tenant-a | uid-student-a | approved | 12:13 | approved lifecycle |
| request-a02 | tenant-a | uid-student-a | cancelled | 12:12 | cancelled lifecycle |
| request-a01 | tenant-a | uid-student-a | rejected | 12:11 | rejected lifecycle |
| request-a00 | tenant-a | uid-student-a | expired | 12:10 | expired lifecycle |
| request-tie-z | tenant-a | uid-student-a | pending | 12:09 | document ID tie-break |
| request-tie-a | tenant-a | uid-student-a | pending | 12:09 | document ID tie-break |
| request-b03 | tenant-b | uid-student-a | pending | 12:09 | cross-Tenant full-path tie-break |
| request-b02 | tenant-b | uid-student-a | approved | 12:07 | cross-Tenant approved |
| request-b01 | tenant-b | uid-student-b | rejected | 12:06 | cross-Tenant foreign UID |
| request-c01 | tenant-c | uid-student-a | cancelled | 12:05 | third Tenant |

All documents use canonical paths and valid serializer lifecycle fields.

## C1 assertion matrix

`[DENY]` remains the approved broad metadata for an expected rejection outcome.
After FIX1, the executable `outcome` classification matches real Rules behavior:
34 `SUCCESS`, 14 `RULES_DENY`, 4 `CONTRACT_ERROR`, and 0 `NOT_FOUND`.

| Test ID | Description | Outcome | Assertion | Contract |
| --- | --- | --- | --- | --- |
| REP-001 | owner pending get | SUCCESS | field/deep assertions | repository + Rules |
| REP-002 | approved history | SUCCESS | lifecycle assertions | serializer |
| REP-003 | cancelled history | SUCCESS | lifecycle assertions | serializer |
| REP-004 | foreign get | RULES_DENY | normalized FORBIDDEN | Rules |
| REP-005 | anonymous get | RULES_DENY | normalized auth denial | Rules |
| REP-006 | missing protected get | RULES_DENY | normalized FORBIDDEN | Rules existence masking |
| REP-010 | owner-only Tenant list | SUCCESS | every UID | query |
| REP-011 | exclude foreign UID | SUCCESS | ID absence | query |
| REP-012 | exclude other Tenant | SUCCESS | every tenantId | query |
| REP-013 | requestedAt order | SUCCESS | ordered equality | query |
| REP-014 | document ID tie | SUCCESS | relative positions | query |
| REP-015 | empty list | SUCCESS | empty equality | query |
| REP-020 | pending Tenant filter | SUCCESS | nonempty/UID/Tenant/status/order | query |
| REP-021 | approved Tenant filter | SUCCESS | nonempty/UID/Tenant/status/order | query |
| REP-022 | rejected Tenant filter | SUCCESS | nonempty/UID/Tenant/status/order | query |
| REP-023 | cancelled Tenant filter | SUCCESS | nonempty/UID/Tenant/status/order | query |
| REP-024 | expired Tenant filter | SUCCESS | nonempty/UID/Tenant/status/order | query |
| REP-030 | owner collection group | SUCCESS | every UID | query |
| REP-031 | exclude foreign UID | SUCCESS | ID absence | query |
| REP-032 | multiple Tenants | SUCCESS | Tenant set | query |
| REP-033 | global order | SUCCESS | ordered equality | query |
| REP-034 | full-path tie | SUCCESS | cross-Tenant relative positions | query |
| REP-035 | anonymous group list | RULES_DENY | rejection | Rules |
| REP-040 | pending group filter | SUCCESS | nonempty/UID/status/order | query |
| REP-041 | approved group filter | SUCCESS | nonempty/UID/status/order | query |
| REP-042 | cancelled group filter | SUCCESS | nonempty/UID/status/order | query |
| REP-043 | exclude other states | SUCCESS | every status | query |
| REP-044 | exclude foreign UID | SUCCESS | every UID | query |
| REP-050 | first page has more | SUCCESS | boolean equality | pagination |
| REP-051 | first cursor | SUCCESS | string type | pagination |
| REP-052 | second page | SUCCESS | item count | pagination |
| REP-053 | reconstruct all pages | SUCCESS | uniqueness + total equality | pagination |
| REP-054 | terminal hasMore | SUCCESS | false equality | pagination |
| REP-055 | terminal cursor | SUCCESS | null equality | pagination |
| REP-056 | status pagination | SUCCESS | second-page count | pagination |
| REP-057 | group pagination | SUCCESS | second-page count | pagination |
| REP-060 | Tenant cursor reuse | SUCCESS | successful query | cursor |
| REP-061 | group cursor reuse | SUCCESS | successful query | cursor |
| REP-062 | cross-Tenant cursor | CONTRACT_ERROR | CONTRACT_VIOLATION | cursor binding |
| REP-063 | status mismatch cursor | CONTRACT_ERROR | CONTRACT_VIOLATION | cursor binding |
| REP-064 | cross-query cursor | CONTRACT_ERROR | CONTRACT_VIOLATION | cursor binding |
| REP-065 | cross-UID cursor | CONTRACT_ERROR | CONTRACT_VIOLATION | cursor binding |
| SEC-001 | client create | RULES_DENY | assertFails | Rules |
| SEC-002 | owner update | RULES_DENY | assertFails | Rules |
| SEC-003 | owner delete | RULES_DENY | assertFails | Rules |
| SEC-004 | key point get | RULES_DENY | assertFails | Rules |
| SEC-005 | key create | RULES_DENY | assertFails | Rules |
| SEC-010 | Tenant query without UID | RULES_DENY | assertFails | Rules |
| SEC-011 | Tenant query foreign UID | RULES_DENY | assertFails | Rules |
| SEC-012 | group query without UID | RULES_DENY | assertFails | Rules |
| SEC-013 | group query foreign UID | RULES_DENY | assertFails | Rules |
| SEC-014 | anonymous group query | RULES_DENY | assertFails | Rules |

C1 corrected empty-result false positives, strengthened point/lifecycle and
pagination assertions, made the collection-group tie cross Tenant paths, changed
the key read to a canonical point get, and added executable outcome counts. The
total remains 52 because no independent contract was aggregated or removed.

Cursor binding is decoded before `getDocs` in the audited repository code. The
runtime cases assert `CONTRACT_VIOLATION`; no product instrumentation was added.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed
SaaS-03A.3R-A-C1 = completed_pending_human_push
SaaS-03A.3R-B = ready_not_started
```

03A.3R-B1 subsequently added a read-only static precheck and a separate,
sequential Firestore-only workflow gate. The suite itself remains byte-identical
and unexecuted pending human push and manual workflow dispatch.

FIX1 subsequently executed the suite locally and corrected nine failures:
existence masking for REP-006, the authenticated UID for REP-015, Web SDK
field-value cursor projection for six pagination cases, and the direct `getDoc`
SDK map for SEC-004. The resulting local runtime is `52 / 52`; a new hosted
workflow run remains mandatory.
