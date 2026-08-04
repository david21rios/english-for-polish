# SaaS-03A.6R-F1 — Enrollment runtime failure analysis

## Purpose and evidence

The first real `Firestore Rules Runtime Validation` execution reached the
Enrollment gate and exposed four failing IDs: `RT-ENR-REP-090`,
`RT-ENR-REP-091`, `RT-ENR-REP-113` and `RT-ENR-SEC-137`. This microphase
reproduced all four against the Firestore Emulator on `demo-polish-learning`,
classified their causes and applied only test/metadata corrections. Domain,
architecture, EnrollmentRepository, Rules, indexes and protected repositories
remain unchanged.

## Findings and minimal corrections

| Test ID | Root cause | Responsible location | Minimal correction | Contractual justification |
| --- | --- | --- | --- | --- |
| RT-ENR-REP-090 | Empty cursor is rejected before decoding; the test expected the decoder operation/resource. | `enrollmentRepository.runtime.test.mjs`, former malformed-cursor table/assertion around lines 218–234; actual branch `enrollmentQueries.js:29–31`. | Give the empty cursor its own assertion for `INVALID_ARGUMENT`, `validate_enrollment_options`, `enrollment_collection`. | R1 rejects empty cursor input as invalid options; reaching the decoder is not required. |
| RT-ENR-REP-091 | Whitespace-only cursor follows the same options-validation branch; expected operation/resource were wrong. | Same runtime table/assertion and `enrollmentQueries.js:29–31`. | Use the same explicit options-validation assertion independently. | Whitespace is not a non-empty cursor and remains `CONTRACT_ERROR`. |
| RT-ENR-REP-113 | Shared allowlist correctly reports an unknown physical field from `serializeSnapshot`; the test expected the upper serializer operation. | Runtime assertion around former lines 256–264; `shared/serialization/snapshots.js:63–73`. | Expect `CONTRACT_VIOLATION`, `serialize_snapshot`, `enrollment`. | Shared is the approved fail-closed allowlist authority; no product behavior is defective. |
| RT-ENR-SEC-137 | A tenant-admin Course-filtered query is a narrower subset of documents the actor may already read. R1 defers this query from the repository API but Rules do not and need not deny direct bounded reads. | Runtime unsafe-query table around former lines 283–295; `firestore.rules` Enrollment list helpers around lines 959–984. | Reclassify as ALLOW/SUCCESS and assert non-empty results remain tenant/course/status bounded. | “API-deferred” is not equivalent to “Rules-denied”; tenant isolation and read authority are preserved. |

The first three failures were assertion taxonomy defects. The fourth was an
incorrect access expectation. There is no repository, Rules or contract-shape
defect and no fixture corruption.

## Reconciled inventory

The executable registry remains 111 Enrollment IDs plus one metadata
self-control test. Reclassification of only `RT-ENR-SEC-137` changes metadata
from 41/70 and 41/42/28/0 to:

```text
Enrollment Test IDs = 111
ALLOW = 42
DENY = 69
SUCCESS = 42
RULES_DENY = 41
CONTRACT_ERROR = 28
NOT_FOUND = 0
Node tests including metadata = 112
```

The precheck and workflow expected labels were updated to the same truthful
inventory. No Test ID was added or removed.

## Validation and runtime result

Syntax, ESLint, Enrollment precheck and all 46 Enrollment unit tests pass. The
corrected local command was executed with Java 21 and firebase-tools 15.24.0:

```text
firebase emulators:exec --only firestore --project demo-polish-learning
  "node --test tests/integration/saas/enrollment/enrollmentRepository.runtime.test.mjs"
```

Result: 112 tests, 112 passed, 0 failed; metadata self-control PASS; Emulator
closed normally. Build and `git diff --check` also pass. The CLI performs its
standard public version check, but no Firebase project data or remote Firebase
service was accessed; all test data remained in the local demo Emulator.

## State, risk and next step

Residual risk is the required external workflow confirmation on the committed
SHA. This local success is not B2 closure.

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6R = in_progress
SaaS-03A.6R-B1 = completed_with_runtime_failure
SaaS-03A.6R-F1 = completed_pending_human_push_and_external_runtime
SaaS-03A.6R-B2 = blocked_pending_corrected_runtime_evidence
EnrollmentRepository = implemented_shadow
```

Decision: `SaaS-03A.6R-F1 COMPLETE` for diagnosis, minimal correction and local
runtime validation. Owner push and a new workflow execution are required; B2 is
not initiated.
