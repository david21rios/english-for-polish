# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — ActivateCourse semantic contract resolution

## Status and evidence

This is a documentation-only architecture resolution. The Course sequence,
version/CAS architecture, compatibility policy, persisted version materialization,
CreateCourse and UpdateCourse contracts are published normative sources;
package contracts and tests are physical implementation evidence. Legacy writers
and historical UI behavior are not promoted to this contract. Runtime remains
unauthorized.

## Command identity and authority

- Operation/command type: `ActivateCourse`
- Resource type: `course`
- Resource ID: `courseId`
- Capability: package-owned `CAPABILITY_IDS.COURSE_ACTIVATE` (`course.activate`)
- Actor: authenticated `tenant_admin` with the authorized same-tenant binding
- Identity and authority: server-derived and persisted-authoritative
- Input never supplies actor, membership, role, authority, capability, claims or metadata

## Exact input and behavioral payload

The proposed portable input field order is exactly:

```text
commandId, correlationId, tenantId, courseId, expectedVersion
```

All fields are required and non-nullable. The four identifiers use the
package-owned canonical identifier validator. `expectedVersion` is an integer
`>= 1`, expresses caller concurrency intent, and is not a persisted Course
field. The behavioral payload is the detached frozen object:

```text
{ tenantId, courseId, expectedVersion }
```

`commandId` and `correlationId` remain envelope-only.

## Lifecycle and CAS semantics

The sole new transition is `draft → active`. The transaction rereads and
validates the Course, tenant binding, lifecycle and expected version. A stale
version is `CONFLICT`; a successful activation changes version `N → N+1`,
updates server-owned timestamps and commits one bounded audit. No portable
validator performs persisted-state inspection, mutation or version arithmetic.

`active → active` is not a new semantic no-op. The published persistence
wording that a repetition “conserves the result” is resolved as exact command
replay, not as permission for an unrelated new activation. An exact replay is
an existing completed/succeeded `ActivateCourse` command whose binding is
identical: same `commandId`, `correlationId`, command/operation, `tenantId`,
`courseId` resource binding and canonical behavioral payload (including
`expectedVersion`). It is read-only and returns the persisted result with
`replayed = true`.

A different or new command targeting an already-active Course is not an exact
replay and fails closed with `FAILED_PRECONDITION`. It performs no Course
mutation, version increment, timestamp update or mutation audit. `archived` is
terminal and cannot be activated or restored.

## Result contract

ActivateCourse preserves the canonical seven-field result exactly:

```text
commandId, correlationId, operation, resourceType, resourceId, status, replayed
```

The values are `ActivateCourse`, `course`, `courseId`, `succeeded`, and boolean
`replayed`. `status` is the command outcome, following the package-owned
command-result convention; the lifecycle value `active` remains represented
by persisted `Course.status` and the audit after-state. Version, timestamps,
snapshots and additional result fields are forbidden.

## Audit contract

- Operation: `ActivateCourse.activate`
- Level: existing privileged level
- Result: `succeeded`
- Before fields: `courseExists`, `courseStatus`
- After fields: `courseStatus`
- Metadata: `stage`, `expectedVersion`

No raw Course content, language values, descriptions, claims, credentials,
PII, snapshots or stack traces are allowed. A replay creates no new mutation
audit.

## Error and replay ordering

Existing taxonomy applies: malformed shape, identifiers or version are
`INVALID_ARGUMENT`; authentication failure is the existing
`UNAUTHENTICATED` mapping; missing capability is `FORBIDDEN`; tenant/binding
conflict is `CONFLICT`; missing Course is `NOT_FOUND`; malformed persistence is
`CONTRACT_VIOLATION`; stale version is `CONFLICT`; already-active or archived
new operations are `FAILED_PRECONDITION`. Exact completed same-binding replay
is resolved before new lifecycle rejection and is read-only.

Conceptual runtime order is authentication and authorization, exact command
binding/idempotency classification, completed replay, transactional Course
reread, tenant binding, persisted contract validation, lifecycle validation,
expected-version comparison, `draft → active` mutation, version increment,
audit and result persistence. This ordering ensures that a replay is not
rejected merely because the current Course state or version changed after its
original successful commit.

## Interaction boundaries

CreateCourse remains draft creation and unchanged. UpdateCourse changes Course
content only; after activation its language, support language, interface
language and CEFR fields remain immutable while display name and description
remain mutable under its published rules. ArchiveCourse remains
`draft/active → archived`; RestoreCourse remains prohibited.

Before any Course runtime is authorized, legacy writers must be inventoried,
non-CAS writers disabled or updated, new versionless writes prevented,
versionless documents migrated and zero pending versionless documents proven.

SaaS-03B-F-R2 remains exclusively the Enrollment uniqueness/re-enrollment
resolution. SaaS-03B-R remains after F and Phase 04 remains not started.

## Runtime boundary and next step

`ACTIVATECOURSE_RUNTIME=NOT_AUTHORIZED`. No package source, declarations,
tests, Functions, Firebase, Rules, indexes, Domain, Services, UI, Providers or
Enrollment files were changed. The next authorized microphase is independent
review of this semantic resolution, followed by ActivateCourse portable
contract materialization.
