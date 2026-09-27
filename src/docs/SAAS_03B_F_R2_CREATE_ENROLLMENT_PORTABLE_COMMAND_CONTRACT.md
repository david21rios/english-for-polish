# SaaS-03B-F-R2 — CreateEnrollment Portable Command Contract + Atomic Composition

This document records the human-approved CreateEnrollment T1–T10 contract.

## Contract

- Classification: `ATOMIC_TENANT_COMMAND_TYPE`.
- Command type: `CreateEnrollment`.
- Public input: exactly `commandId`, `correlationId`, `tenantId`, `membershipId`, `courseId`.
- Stages: `not_started` → `prepared` → `completed`.
- Envelope: `commandId`, `commandType`, `correlationId`, `tenantId`, `payload`.
- Behavioral payload: `{ tenantId, membershipId, courseId }`.
- Public result: exactly `{ enrollmentId }`.
- Enrollment IDs are opaque, server-generated with the existing `randomUUID` precedent after preparation and before the business transaction.
- Course eligibility (`status === "active"`) and Membership eligibility (`status === "approved"`) are read inside the authoritative business transaction using canonical package paths and `TransactionPort.get`.
- The business transaction coordinates command state, eligibility, claim validation, Enrollment creation, claim creation, and successful command result persistence.
- Completed matching commands replay the stored result without business writes.
- Accepted runtime semantics include authenticated/coherent actor authority,
  active same-tenant Membership and Course eligibility, tenant isolation,
  deterministic command identity, canonical payload hashing, mismatch conflict,
  prepared recovery, authoritative Phase-B revalidation, and replay/recovery
  reuse of the same enrollment result.

Foundation uniqueness and error semantics remain unchanged. Terminal release,
runtime orchestration outside CreateEnrollment, handlers, Rules, indexes,
configuration, and provider operations remain deferred.

## Final technical closure

The accepted direct/unit evidence and real local Firestore Emulator evidence
close the current F-R2 command contract and runtime boundary:

- `SAAS_03B_F_R2_RUNTIME_VALIDATION = COMPLETE`
- `CREATE_ENROLLMENT_REAL_EMULATOR_PARITY = 13_OF_13_PASS`
- `CREATE_ENROLLMENT_REAL_EMULATOR_MATRIX = COMPLETE`
- `REAL_FIRESTORE_ROLLBACK_CLOSURE = COMPLETE`
- `SAAS_03B_F_TECHNICAL_STATUS = COMPLETE`
- `SAAS_03B_F_TECHNICAL_CLOSURE_REVIEW = PASS`
- `F_IMPLEMENTATION_BASELINE = 6dbcf546302c4a8b60c2cbed2b93fe2fb053e18d`
- `F_CODE_PUBLICATION_STATE = IMPLEMENTATION_PRESENT_AT_HEAD_AND_ORIGIN`
- `F_CLOSURE_RECORD_PUBLICATION_STATE = LOCAL_UPDATE_PENDING_HUMAN_REVIEW`

Accepted historical validation is `179/179 PASS` SaaS contracts, `265/265
PASS` Functions, and `13/13 PASS` direct CreateEnrollment tests. The vendored
`@mipymetic/saas-contracts` `0.28.0` artifact is aligned with SHA-256
`824a22cca58f41fd250c8718728ffe2eab77e2660af5825ef364b8470ece2826`.

Status: `TECHNICALLY_CLOSED_PENDING_CLOSURE_RECORD_PUBLICATION`.
