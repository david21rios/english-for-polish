# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — ArchiveCourse portable contract materialization

This record covers only the package-owned portable ArchiveCourse contract.
ArchiveCourse runtime, persistence transactions, Admin SDK effects, handlers,
Firebase, Rules, UI, Providers and Enrollment remain unauthorized.

## Contract

- Operation: `ArchiveCourse`
- Resource: `course` / `courseId`
- Capability: canonical `CAPABILITY_IDS.COURSE_ARCHIVE` (`course.archive`)
- Actor boundary: same-tenant authenticated `tenant_admin`
- Input: `commandId`, `correlationId`, `tenantId`, `courseId`, `expectedVersion`
- Behavioral payload: `{ tenantId, courseId, expectedVersion }`
- Result: canonical seven-field command result with `status = succeeded`
- Audit: `ArchiveCourse.archive`, privileged, bounded course status fields

The portable validators reject unknown and caller-owned lifecycle/authority
fields, malformed identifiers and invalid expected versions. Lifecycle,
archivedAt, updatedAt, CAS comparison, replay execution and persistence remain
runtime responsibilities.

## Package cutover

The additive public command API advances the package from `0.27.0` to `0.28.0`.
Generated declarations, package topology metadata, lockfiles and the Functions
vendor artifact were regenerated. The artifact excludes tests and node_modules
and has a sorted explicit inventory.

## Validation and boundaries

Package tests pass (`176/176`), package typecheck passes, Functions check/lint
pass, and the Functions suite passes (`246/246`). No Functions business runtime
was added; `functions/lib` was removed after validation. CreateCourse,
UpdateCourse and ActivateCourse remain unchanged and runtime-closed.

Runtime remains blocked pending legacy writer inventory, non-CAS cutover,
versionless Course migration and separate runtime authorization. RestoreCourse
remains prohibited, F-R2 remains Enrollment-only, and Phase 04 remains not
started.
