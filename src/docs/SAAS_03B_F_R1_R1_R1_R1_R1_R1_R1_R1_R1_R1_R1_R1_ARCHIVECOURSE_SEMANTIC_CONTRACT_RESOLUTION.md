# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — ArchiveCourse semantic contract resolution

## Genealogy and evidence

This is a design-only, unpublished semantic resolution following the published
ActivateCourse portable materialization. Normative evidence is the Course
sequence/start gate, Course lifecycle and version/CAS resolutions, the package
Course persistence validator, command contracts, capability catalog and
published CreateCourse/UpdateCourse/ActivateCourse contracts. Runtime remains
unauthorized; legacy behavior is not normative.

## Command identity and authority

- Operation/command type: `ArchiveCourse`
- Resource type: `course`
- Resource ID: `courseId`
- Capability: package-owned `CAPABILITY_IDS.COURSE_ARCHIVE` (`course.archive`)
- Actor: authenticated same-tenant `tenant_admin`
- Actor, role, authority, capability and claims are server-derived and never
  accepted from input.

## Input and behavioral payload

Exact ordered input:

```text
commandId, correlationId, tenantId, courseId, expectedVersion
```

All fields are required and non-nullable. Identifiers use the canonical package
validator; `expectedVersion` is an integer `>= 1`. The detached behavioral
payload is exactly:

```text
{ tenantId, courseId, expectedVersion }
```

No status, version, timestamps, `archivedAt`, actor, membership, authority,
role, capability, claims or arbitrary metadata are caller-owned.

## Lifecycle and replay

The only successful new transitions are `draft → archived` and
`active → archived`. `archived` is terminal and RestoreCourse remains
prohibited. A distinct/new ArchiveCourse command against an archived Course
fails with `FAILED_PRECONDITION` and performs no Course mutation.

An exact completed same-binding command is replayed read-only before current
lifecycle rejection. Replay requires the existing command binding and the
identical canonical behavioral payload; it returns `replayed = true` with zero
Course/version/timestamp/audit mutation.

## Persistence and CAS semantics

`archivedAt` is server-owned, must be `null` before archive, and is set to a
server-owned timestamp exactly once by a successful archive. `updatedAt` is
server-owned and changes on the committed transition. The persisted Course
status becomes `archived`; its version changes `N → N+1` exactly once. Replays,
rejects, stale versions and aborted retries have zero version delta. A stale
`expectedVersion` is `CONFLICT`; archived timestamps are never cleared.

## Result and audit

The result remains the canonical seven-field command result:

```text
commandId, correlationId, operation, resourceType, resourceId, status, replayed
```

Values are `ArchiveCourse`, `course`, `courseId`, `succeeded`, and the boolean
replay flag. Lifecycle state is persisted separately.

Audit is bounded and privileged:

- operation: `ArchiveCourse.archive`
- result: `succeeded`
- before: `courseExists`, `courseStatus`
- after: `courseStatus`
- metadata: `stage`, `expectedVersion`

No raw Course content, payload, timestamps, PII, claims, credentials, secrets
or stack traces are included.

## Errors and ordering

Malformed input maps to `INVALID_ARGUMENT`; authentication to the existing
`UNAUTHENTICATED` mapping; authorization to `FORBIDDEN`; missing Course to
`NOT_FOUND`; tenant/binding or stale CAS conflicts to `CONFLICT`; malformed
persistence to `CONTRACT_VIOLATION`; invalid lifecycle and a new archived
target to `FAILED_PRECONDITION`. Runtime ordering is authentication,
authorization, binding/idempotency, exact replay, transactional reread,
tenant binding, persisted validation, lifecycle, expected-version validation,
archive mutation, version increment, audit and result persistence.

## Boundaries

CreateCourse remains draft creation, UpdateCourse remains content-only, and
ActivateCourse remains draft → active. ArchiveCourse runtime, handlers,
command-stage authorization, persistence transactions and Admin SDK effects
are not authorized here. Legacy writer inventory, CAS migration and proof of
zero versionless Courses remain prerequisites. F-R2 remains reserved for
Enrollment; SaaS-03B-R remains after F; Phase 04 remains not started.

Next technical identifier, subject to independent review, is the next
genealogical descendant for ArchiveCourse portable contract materialization.
