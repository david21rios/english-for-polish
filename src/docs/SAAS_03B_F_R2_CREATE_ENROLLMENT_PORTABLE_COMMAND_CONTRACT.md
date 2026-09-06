# SaaS-03B-F-R2 — CreateEnrollment Portable Command Contract + Atomic Composition

This document records the human-approved CreateEnrollment T1–T10 contract.

## Contract

- Classification: `ATOMIC_TENANT_COMMAND_TYPE`.
- Stages: `not_started` → `prepared` → `completed`.
- Envelope: `commandId`, `commandType`, `correlationId`, `tenantId`, `payload`.
- Behavioral payload: `{ tenantId, membershipId, courseId }`.
- Result: `{ enrollmentId }`.
- Enrollment IDs are opaque, server-generated with the existing `randomUUID` precedent after preparation and before the business transaction.
- Course eligibility (`status === "active"`) and Membership eligibility (`status === "approved"`) are read inside the authoritative business transaction using canonical package paths and `TransactionPort.get`.
- The business transaction coordinates command state, eligibility, claim validation, Enrollment creation, claim creation, and successful command result persistence.
- Completed matching commands replay the stored result without business writes.

Foundation uniqueness and error semantics remain unchanged. Terminal release, runtime orchestration, handlers, Rules, indexes, configuration, and provider operations remain deferred.

Status: `HUMAN_APPROVED_CONTRACT_AUTHORED_PENDING_INDEPENDENT_REVIEW`.
