# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1 — UpdateCourse semantic contract resolution

## Status and genealogy

This is a documentary, portable-contract resolution. The local Course
version/CAS materialization commits (`0b7e9a0` and `e6adadd`) are
`LOCAL_COMPLETE_PENDING_PUBLICATION`; they are not represented as remotely
published. No UpdateCourse source, runtime, package, Rules or Firebase change
is authorized here.

The identifier is the next descendant of the published Course sequence/start
gate, version/CAS architecture, compatibility/migration/conflict resolution
and persisted-version materialization lineage. The next technical target is
UpdateCourse portable contract materialization, subject to independent review.

## Evidence classification

| Evidence | Classification |
| --- | --- |
| Course sequence/start-gate and version/CAS documents | PUBLISHED_NORMATIVE |
| local version/CAS commits and `validatePersistedCourse` | LOCAL_COMPLETE_PENDING_PUBLICATION / PHYSICAL_IMPLEMENTATION |
| CreateCourse package contract and tests | PHYSICAL_IMPLEMENTATION + TEST_ONLY |
| Course Domain lifecycle, capability and persistence documents | PUBLISHED_NORMATIVE |
| UpdateTenantProfile/Settings/Branding contracts | PHYSICAL_IMPLEMENTATION (precedent only) |
| legacy Course writers, repositories and forms | LEGACY_BEHAVIOR |
| Enrollment/provider/UI assumptions | PROPOSED or HISTORICAL unless explicitly normative |

Legacy behavior is not promoted to the portable command contract.

## Update model

UpdateCourse uses a **constrained partial patch**. The command carries a
non-empty patch containing only the mutable Course content fields. Omitted
fields are preserved; no replacement defaulting is performed. This follows the
existing `UpdateTenantProfile` sparse-patch precedent and the Course access
pattern (“patch”, preserving IDs), while avoiding replacement-time loss of
backend-owned fields. Each nested value is validated as a complete value; no
arbitrary merge or unknown-key escape hatch exists.

| Model | Precedent | Advantages | Risks | Decision |
| --- | --- | --- | --- | --- |
| Partial patch | UpdateTenantProfile and Course access pattern | Explicit sparse mutation, preserves fields | Requires non-empty/unknown-key validation | Rejected only if unconstrained |
| Complete replacement | Settings/Branding only | Simple snapshot | Caller could overwrite identity/backend fields; unsafe for Course | Rejected |
| Constrained partial patch | Course fields plus lifecycle restrictions | Preserves identity and CAS safety; explicit active stability | Slightly more validation | **Selected** |

## Field mutability matrix

`CREATE` means CreateCourse owns initial materialization. `CALLER DIRECT
WRITE` refers to UpdateCourse input, never persistence internals.

| Field | CREATE ownership | UPDATE draft | UPDATE active | Caller direct write | Persistence ownership / notes |
| --- | --- | --- | --- | --- | --- |
| courseId | command identity | immutable | immutable | envelope identity only | backend path identity |
| tenantId | command binding | immutable | immutable | envelope binding only | backend-authoritative |
| displayName | required | mutable | mutable | patch only | validated non-empty trimmed text |
| description | required | mutable | mutable | patch only | validated non-empty trimmed text |
| learningLanguage | required | mutable | immutable | patch only in draft | language identity/content contract |
| supportLanguageCode | required | mutable | immutable | patch only in draft | canonical BCP-47 |
| interfaceLanguages | required non-empty unique array | mutable | immutable | patch only in draft | canonical BCP-47, unique locales |
| cefrLevel | required enum | mutable | immutable | patch only in draft | package CEFR catalog |
| version | backend initializes `1` | not writable; CAS increments on actual change | same | forbidden | persisted integer >=1 |
| status | backend `draft` | forbidden | forbidden | forbidden | Activate/Archive only |
| createdAt | backend | forbidden | forbidden | forbidden | server-owned |
| updatedAt | backend | forbidden | forbidden | forbidden | server-owned |
| archivedAt | backend `null` until archive | forbidden | forbidden | forbidden | server-owned; archived timestamp |

Active Courses therefore permit only display name and description changes.
Language, interface and CEFR values are identity-like course configuration;
changing them after activation could invalidate content, multilingual queries,
CEFR progression and future Enrollment assumptions. No Enrollment behavior is
implemented or changed here.

## Exact input and behavioral payload

The proposed exact input field order is:

```text
UPDATE_COURSE_INPUT_FIELDS = [
  commandId,
  correlationId,
  tenantId,
  courseId,
  expectedVersion,
  patch,
]
```

All six fields are required and non-nullable. `commandId`, `correlationId`,
`tenantId` and `courseId` are package-owned document identifiers. Every
identifier rejects empty, whitespace-only, `.`, `..` and slash-containing
values. `expectedVersion` is an integer >= 1 and is not persisted directly.
`patch` is a plain object with at least one key and only these keys:

```text
displayName, description, learningLanguage,
supportLanguageCode, interfaceLanguages, cefrLevel
```

Patch values use the CreateCourse value contracts: trimmed non-empty text,
canonical BCP-47, the exact learning-language object, a non-empty unique
interface-language array, and a package-owned CEFR value. Undefined values,
unknown keys, duplicate locales and empty arrays are rejected. Null is not a
valid value for any mutable field. No caller-provided actor, authority, role,
capability, claims, status, version, timestamps, membership ID or metadata is
accepted.

The behavioral payload excludes command and correlation identifiers and is:

```text
{
  tenantId,
  courseId,
  expectedVersion,
  patch
}
```

The payload is a frozen, recursively value-copied representation consistent
with package command conventions.

## No-op and CAS semantics

A new command whose validated patch equals the current values is a semantic
no-op, not a replay. It is rejected with `FAILED_PRECONDITION`; it produces no
Course write, no version increment, no timestamp change and no mutation audit.
Replay remains reserved for the same command binding already completed.

For a real change, the transaction rereads the Course, verifies tenant and
lifecycle, compares `expectedVersion`, applies the patch and increments
`version` exactly once. A stale version is `CONFLICT`; rejected or aborted
attempts have zero committed version delta.

## Result and authority literals

The result remains exactly the seven-field contract:

```text
commandId, correlationId, operation, resourceType, resourceId, status, replayed
```

Values are `operation = UpdateCourse`, `resourceType = course`,
`resourceId = courseId`, `status = succeeded`, and boolean `replayed`.
`resultingVersion` is deliberately excluded.

The required capability is the existing package-owned `course.update`.
Actor and persisted Identity are server-derived; the caller must be an
authorized teacher or tenant_admin for the same tenant and Course.

## Audit contract

The portable audit operation is `UpdateCourse.update`, at the existing
privileged level, with result `succeeded`. The allowlists are deliberately
bounded:

```text
before:   courseExists, courseStatus
after:    courseStatus
metadata: stage, changedFieldCount, expectedVersion
```

`changedFieldCount` is the deterministic count of fields whose persisted value
actually differs after applying the validated patch; it is not the number of
requested patch keys. A no-op therefore has no mutation audit. No raw patch,
description, language display name, claims, email, credentials, snapshots or
stack traces are logged. Other reject paths do not create a mutation audit.

## Error matrix

| Condition | Error |
| --- | --- |
| malformed shape, unknown/forbidden field, invalid identifier/text/BCP-47/CEFR, duplicate locale, empty patch | `INVALID_ARGUMENT` |
| unauthenticated or missing/malformed persisted Identity | `UNAUTHENTICATED` or `CONTRACT_VIOLATION` per existing mapper |
| missing capability or wrong tenant authority | `FORBIDDEN` |
| Course missing | `NOT_FOUND` |
| tenant mismatch, binding mismatch or foreign command ownership | `CONFLICT` |
| archived Course, draft-only field patched while active, semantic no-op | `FAILED_PRECONDITION` |
| stale expectedVersion | `CONFLICT` |
| malformed persisted Course | `CONTRACT_VIOLATION` |
| completed same-binding command | replayed success with zero mutation |

## Lifecycle boundaries

CreateCourse remains draft creation and its portable contract is unchanged.
UpdateCourse never changes status. ActivateCourse alone performs draft → active;
ArchiveCourse performs draft/active → archived; archived is terminal and
RestoreCourse remains prohibited. Future commands must preserve the same
version/CAS and seven-field result rules.

Before runtime authorization, all legacy/non-CAS writers must be inventoried,
updated or disabled, new versionless writes prevented, all versionless Courses
migrated to `version: 1`, and zero pending versionless documents proven.

## Runtime and Enrollment boundary

`UPDATECOURSE_RUNTIME=NOT_AUTHORIZED`. This resolution creates no Functions
implementation, handler, transaction, stage authorization, migration,
backfill, Rules/Firebase change or deployment. SaaS-03B-F-R2 remains reserved
exclusively for Enrollment uniqueness and re-enrollment policy; Enrollment and
Providers remain blocked.

## Next authorized microphase

After independent review of this resolution, the next authorized target is
**UpdateCourse portable contract materialization**. Runtime remains closed.
