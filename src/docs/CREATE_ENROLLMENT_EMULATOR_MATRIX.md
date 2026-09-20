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
| E13 | Transaction rollback | `CreateEnrollment rolls back buffered Phase B writes` | Synthetic transaction failure discards buffered enrollment/claim writes and preserves command baseline. |

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
