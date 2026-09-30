# CreateEnrollment Emulator Matrix E1–E13

Authoritative governance record for COURSE_PLATFORM_SAAS_03B_F_R2. The rows
map directly to the semantic tests in `functions/src/__tests__/createEnrollment.test.ts`.

| ID | Scenario | Repository test | Expected outcome / invariant |
|---|---|---|---|
| E1 | First create | `CreateEnrollment performs one complete first-create orchestration` | One enrollment, claim, and completed command; bindings coherent; Course and Membership unchanged. Closed prior PASS. |
| E2 | Completed replay | `CreateEnrollment completed replay reuses the persisted result without business writes` | One scenario-local initial create setup, then one replay (2 invocations total); original result returned; no additional business writes. Setup does not reopen E1. |
| E3 | Unauthenticated rejection | `CreateEnrollment rejects unauthenticated requests` | `UNAUTHENTICATED`; no business transaction. |
| E4 | Unknown-field rejection | `CreateEnrollment rejects unknown fields` | `INVALID_ARGUMENT`; input contract rejects extra fields. |
| E5 | Payload mismatch conflict | `CreateEnrollment payload mismatch conflicts before business transaction` | `CONFLICT`; same command identity with different canonical payload performs no business writes. |
| E6 | Missing/inactive Course | `CreateEnrollment rejects missing and inactive courses` | Missing => `NOT_FOUND`; inactive => `FAILED_PRECONDITION`; no partial business state. |
| E7 | Non-approved Membership | `CreateEnrollment rejects non-approved membership and preserves writes` | `FORBIDDEN`; no enrollment or claim writes. |
| E8 | Tenant isolation failure | `CreateEnrollment tenant isolation fails before business transaction` | `FAILED_PRECONDITION`; transaction invocation remains zero. |
| E9 | Existing pending/active/inconsistent holder | `CreateEnrollment rejects pending, active, and inconsistent holders` | Existing coherent holder => `CONFLICT`; inconsistent holder => `FAILED_PRECONDITION`; no new business writes. |
| E10 | Recovery-required prepared retry | `CreateEnrollment resumes a canonical recovery-required command` | Prepared recovery command resumes and completes with coherent result. |
| E11 | Phase-B Membership revalidation | `CreateEnrollment revalidates the same Membership inside Phase B` | Missing => `NOT_FOUND`; suspended => `FAILED_PRECONDITION`; buffered writes roll back. |
| E12 | Existing-claim read-before-write | `CreateEnrollment existing claim reads holder before any write` | Claim and linked enrollment are read before writes; operation rejects without business writes. |
| E13 | Transaction rollback | `CreateEnrollment rolls back buffered Phase B writes` | Synthetic failure after Phase-B write 3 discards Enrollment/claim writes and preserves the command baseline; accepted real Firestore Emulator rollback PASS. |

## E2 setup contract

E2 is completed replay. It requires canonical scenario-local fixtures and one
initial CreateEnrollment invocation to establish the completed command/result,
followed by one replay invocation using the same command identity, correlation,
and canonical payload. The setup invocation is not an E1 rerun.

* Setup invocations: 1
* Replay invocations: 1
* Total invocations: 2
* Invariant: replay is idempotent and adds no Enrollment or claim writes.

All thirteen rows are traceable to existing repository tests. No additional
scenario is introduced by this document.

## Accepted final runtime evidence

The direct CreateEnrollment matrix and the real local Firestore Emulator matrix
both cover exactly these thirteen scenarios. The accepted Emulator result is
**13 / 13 PASS**:

| ID | Accepted Emulator result |
|---|---|
| E1 | PASS — first create |
| E2 | PASS — completed replay |
| E3 | PASS — unauthenticated (`UNAUTHENTICATED`) |
| E4 | PASS — unknown field (`INVALID_ARGUMENT`) |
| E5 | PASS — payload mismatch (`CONFLICT`) |
| E6 | PASS — missing/inactive Course |
| E7 | PASS — non-approved Membership (`FORBIDDEN`) |
| E8 | PASS — tenant isolation (`FAILED_PRECONDITION`) |
| E9 | PASS — holder states |
| E10 | PASS — recovery retry |
| E11 | PASS — Phase-B Membership revalidation |
| E12 | PASS — existing claim |
| E13 | PASS — real Firestore transaction rollback |

E13 used the real `FirestoreAdminTransactionRunner` and real local Firestore
transaction boundary with an external harness-only decorator. The decorator
injected `Error("synthetic phase-B failure")` immediately after the third
staged Phase-B write. The Enrollment and deterministic claim did not survive;
the separately prepared command remained `pending` / `not_started`; Course and
Membership remained unchanged. Therefore:

- `E13_REAL_FIRESTORE_TRANSACTION = PROVEN`
- `E13_REAL_FIRESTORE_ROLLBACK = PROVEN`
- `REAL_FIRESTORE_ROLLBACK_CLOSURE = COMPLETE`
- `CREATE_ENROLLMENT_REAL_EMULATOR_MATRIX = COMPLETE`
- `CREATE_ENROLLMENT_REAL_EMULATOR_PARITY = 13_OF_13_PASS`

## Final SaaS-03B-F technical closure state

Accepted historical evidence records `179/179 PASS` SaaS contracts,
`265/265 PASS` Functions, and `13/13 PASS` direct CreateEnrollment tests.
The vendored `@mipymetic/saas-contracts` `0.28.0` artifact remains aligned
with SHA-256
`824a22cca58f41fd250c8718728ffe2eab77e2660af5825ef364b8470ece2826`.

Runtime validation is complete at implementation baseline
`6dbcf546302c4a8b60c2cbed2b93fe2fb053e18d`:

- `SAAS_03B_F_R2_RUNTIME_VALIDATION = COMPLETE`
- `SAAS_03B_F_TECHNICAL_STATUS = COMPLETE`
- `SAAS_03B_F_TECHNICAL_CLOSURE_REVIEW = PASS`
- `F_CODE_PUBLICATION_STATE = IMPLEMENTATION_PRESENT_AT_HEAD_AND_ORIGIN`
- `F_CLOSURE_RECORD_PUBLICATION_STATE = PUBLISHED`

Validation was local-only (`demo-polish-learning` and loopback Firestore
Emulator) with synthetic credentials. No ADC, real credentials, provider,
Governance, Rules, indexes, deployment, or frontend work is implied. Those
boundaries remain deferred/out of scope for SaaS-03B-F.
