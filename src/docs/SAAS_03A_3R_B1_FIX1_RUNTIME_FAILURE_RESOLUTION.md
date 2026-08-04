# SaaS-03A.3R-B1-FIX1 — RegistrationRequest runtime failure resolution

## Purpose and evidence

The first GitHub Actions execution reached the RegistrationRequest runtime gate
after installation, Rules preflight, the canonical Rules runtime, and the
RegistrationRequest static precheck. The repository runtime then reported 52
tests, 43 passed and 9 failed. This corrective phase changes no domain model,
public repository API, Rules, index, Storage policy, or architecture.

The failed IDs were `RT-RRQ-REP-006`, `RT-RRQ-REP-015`,
`RT-RRQ-REP-052`, `RT-RRQ-REP-053`, `RT-RRQ-REP-056`,
`RT-RRQ-REP-057`, `RT-RRQ-REP-060`, `RT-RRQ-REP-061`, and
`RT-RRQ-SEC-004`.

## Root causes and corrections

| IDs | Root cause | Correction |
| --- | --- | --- |
| REP-006 | A missing protected document cannot satisfy the Rules expression over `resource.data`; Firestore returns `permission-denied`, which the repository correctly maps to `FORBIDDEN`. The former `NOT_FOUND` expectation was wrong. | Assert `FORBIDDEN` and classify the case as `RULES_DENY`. No Rule or repository error mapping changed. |
| REP-015 | The test authenticated `uid-student-a` but constructed the self query with `uid-teacher-a`, so Rules correctly rejected the foreign-UID shape. | Authenticate `uid-teacher-a` and query with the same UID, preserving the authorized empty-result purpose. |
| REP-052/053/056/057/060/061 | Cursor projection passed a `DocumentReference` as the second field-value argument to `startAfter()`. The installed modular SDK field-value cursor implementation requires a string for an explicit `documentId()` order. | Preserve the cursor's full canonical `documentPath`; project it to the simple request ID for a collection query and to the full document path for a collection-group query. |
| SEC-004 | `getDoc` was imported but omitted from the direct SDK map used by security tests, so JavaScript failed before Rules evaluation. | Add the existing `getDoc` import to that map. The canonical key read now reaches Rules and is denied. |

## Cursor contract and local SDK evidence

The public R1 cursor contract is unchanged: version 1, exact query binding,
canonical ISO `requestedAt`, canonical full `documentPath`, portable base64url
encoding, closed validation, deterministic descending order, and `limit + 1`.
Only the internal conversion from the stored position to Web SDK query values
changed.

Firebase 11.10.0 is installed. Its local
`@firebase/firestore/dist/index.node.mjs` field-value query-bound implementation
requires a string for a key-field value. It rejects non-strings; collection
queries additionally reject strings containing `/`, while collection-group
queries require a string resolving to a complete document path. Therefore:

```text
tenant collection: startAfter(new Date(requestedAt), requestId)
collection group:  startAfter(new Date(requestedAt), documentPath)
```

This corrects the historical R1 implementation prescription that proposed a
`DocumentReference`; it does not alter the cursor envelope or consumer contract.

## Reconciled runtime contract

```text
TOTAL = 52
ALLOW = 34
DENY = 18
SUCCESS = 34
RULES_DENY = 14
CONTRACT_ERROR = 4
NOT_FOUND = 0
```

The static precheck and workflow labels use the same breakdown. The workflow
change is declarative only: triggers, toolchain, commands, project, permissions,
timeouts, Emulator boundaries, and security posture are unchanged.

## Validation and preserved invariants

Local validation passed 59 RegistrationRequest unit tests, 35 normal tests,
the production build, the Rules preflight (`201 / 82 / 119`), and the
Firestore-only runtime (`52 / 52`) against `demo-polish-learning`. The runtime
started no Storage or Auth Emulator and performed no deployment.

`firestore.rules`, `firestore.indexes.json`, `storage.rules`, Shared,
IdentityRepository, TenantRepository, Domain 1.2.0, Rules tests, fixtures,
Firebase configuration, and package files remain unchanged. Ownership,
Tenant isolation, cursor binding, status binding, query-kind binding, page
sizes, serialization, and `{ items, nextCursor, hasMore }` remain intact.

## Risks and rollback

The corrected cursor behavior is pinned by unit tests and the real Emulator
suite. Residual pagination risks under concurrent writes remain those already
documented by R1. A protected missing document remains deliberately
indistinguishable from an unauthorized document at the client boundary.

Rollback must revert only the six FIX1 technical files and this documentary
traceability. It must not change Rules, indexes, fixtures, or the domain.

## Required next evidence and state

Local success does not close the hosted runtime gate. After owner push, a new
manual **Firestore Rules Runtime Validation** run on `main` must demonstrate
Rules runtime `201 / 201`, RegistrationRequest runtime `52 / 52`, and overall
workflow success. An old failed job must not be re-run.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_corrected_runtime_evidence
```

## B2 hosted closure evidence

The owner published the two FIX1 commits and confirmed a new successful
workflow run on corrected `main`: Rules `201 / 201` and RegistrationRequest
`52 / 52`, including all nine formerly failing IDs. Local `HEAD` and
`origin/main` both resolve to `851d51b42a642478f9bd5ffc6628ce25f3c90c4e`.
See `SAAS_03A_3R_B2_REGISTRATION_REQUEST_RUNTIME_CLOSURE.md`.

```text
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
```
