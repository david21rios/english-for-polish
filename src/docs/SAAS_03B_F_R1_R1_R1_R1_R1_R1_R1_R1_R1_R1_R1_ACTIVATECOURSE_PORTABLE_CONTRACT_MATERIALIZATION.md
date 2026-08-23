# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — ActivateCourse portable contract materialization

This documentation records the package-only materialization of the published
ActivateCourse semantic contract. Functions runtime, handlers, persistence,
CAS transactions, lifecycle enforcement, Firebase, Rules, UI and Enrollment
remain unauthorized.

## Contract

- Operation: `ActivateCourse`
- Resource: `course` / `courseId`
- Capability: package-owned `CAPABILITY_IDS.COURSE_ACTIVATE` (`course.activate`)
- Actor: authenticated `tenant_admin`
- Input: `commandId`, `correlationId`, `tenantId`, `courseId`, `expectedVersion`
- Behavioral payload: `{ tenantId, courseId, expectedVersion }`
- Result: seven-field command result with `status = succeeded`
- Audit: `ActivateCourse.activate`, privileged, bounded before/after/metadata fields
- CAS and lifecycle enforcement remain runtime responsibilities

The portable validators reject unknown fields, forbidden authority data,
malformed identifiers and invalid versions. Exact replay and the distinction
between a new already-active command and replay remain runtime semantics.

## Package and validation

Package version advanced additively from `0.26.0` to `0.27.0`. Generated
declarations and the canonical Functions vendor artifact were regenerated.
The dedicated ActivateCourse contract tests pass and package TypeScript
checking passes. No runtime implementation or public handler was added.

## Boundaries

CreateCourse and UpdateCourse semantics are unchanged. ArchiveCourse remains
future work, RestoreCourse remains prohibited, F-R2 remains reserved for
Enrollment, and Phase 04 remains not started. Legacy Course migration and
versionless-writer cleanup remain prerequisites for any future runtime.
