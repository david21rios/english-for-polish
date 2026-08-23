# SaaS-03B-F-R1-R1-R1-R1 — Course Persistence Versioning and CAS Resolution

## Status and genealogy

This document resolves the blocker
`UPDATECOURSE_VERSIONING_BLOCKED_PENDING_PERSISTENCE_RESOLUTION`.
It is a design-only descendant of `SaaS-03B-F-R1-R1-R1 — UpdateCourse
Contract Semantics Resolution`. No package, Domain, Functions or persistence
code is changed here.

## Authoritative evidence

The package-owned Course shape currently contains exactly `courseId`,
`tenantId`, `displayName`, `description`, `learningLanguage`,
`supportLanguageCode`, `interfaceLanguages`, `cefrLevel`, `status`, `createdAt`,
`updatedAt` and `archivedAt`. There is no `version` or revision field, no
Course repository serializer with a concurrency token, and no authoritative
Course runtime data set in this repository. Existing documents describe
UpdateCourse transaction/CAS and a version field as proposed future
architecture, not as a closed physical contract. Tenant Settings and Branding
versioning is analogous precedent, but does not itself define Course shape.

## Selected architecture

Select architecture A: an explicit persisted integer `version` field.

Using `updatedAt`, status, document existence or a Firestore timestamp as the
token is rejected: none is a stable caller-owned optimistic-concurrency
contract, and timestamps are server-owned. A hidden repository token is also
rejected because it would create a second physical authority. A transaction
without an explicit persisted token cannot express the documented
`expectedVersion` intent or deterministic stale-write conflict.

## Version field contract

| Property | Resolution |
| --- | --- |
| Field | `version` |
| Type | integer number |
| Range | integer `>= 1` |
| Initial value | `1` on successful CreateCourse persistence |
| Ownership | server/backend persistence-owned |
| Caller write | never accepted as persisted state |
| Package shape | add to `COURSE_FIELDS` and declarations in a later materialization microphase |
| Serializer/validator | exact required field; missing or malformed values fail closed |
| Schema nullability | non-nullable |

`version` is immutable except through an authorized backend command mutation.
It is not part of CreateCourse input or its behavioral payload. CreateCourse
runtime must write it atomically with the initial Course document and its
initial result need not expose it under the existing seven-field result.

## Increment semantics

Every successful state-changing Course command increments `version` exactly
once in the same transaction as its mutation:

- UpdateCourse: `N -> N+1`;
- ActivateCourse: `N -> N+1`;
- ArchiveCourse: `N -> N+1`.

Rejected transactions, aborted retries and read-only replays produce no delta.
No-op terminal replays return the persisted prior result and do not increment.

## expectedVersion and CAS

Future mutating Course commands require an input field `expectedVersion`, an
integer `>= 1`. It is caller-owned concurrency intent, included in the exact
command input and detached behavioral payload, but never copied into
persistence or trusted as authority. Package validation checks shape/range;
runtime compares it to the transactionally reread persisted `version`.

A mismatch is a stale-write/concurrency conflict using the existing conflict
taxonomy; no new public error code is introduced by this resolution. The
transaction reads Course, verifies tenant and lifecycle preconditions and
expectedVersion, then applies the mutation and increments version atomically.

Replay/idempotency is classified before a new mutation: an exact completed
command returns its stored result with zero version delta. A different binding
or stale expectedVersion cannot mutate the Course. Firestore retries may rerun
the callback, but only one committed transaction produces one increment.

## Result version semantics

The portable result remains the established seven-field shape:

`commandId`, `correlationId`, `operation`, `resourceType`, `resourceId`,
`status`, `replayed`.

No `version` or `resultingVersion` field is added. Callers that need the next
concurrency token reread the authoritative Course after the command result;
adding a result field would be a separate public-contract decision.

## Command matrix

| Command | Reads Course | expectedVersion | Lifecycle check | Version write | Delta | Replay | Result version |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CreateCourse | existence/tenant precondition | no | initial draft | writes `version=1` | initial value | exact replay, no duplicate create | no |
| UpdateCourse | yes | required | draft/active; archived rejected | `N+1` | +1 | stored result, 0 | no |
| ActivateCourse | yes | required | draft → active | `N+1` | +1 | target-state replay, 0 | no |
| ArchiveCourse | yes | required | draft/active → archived | `N+1` | +1 | terminal replay, 0 | no |

## Migration and persistence impact

The repository does not prove an empty deployed Course database: legacy Course
write evidence exists even though no current privileged Course runtime,
repository or deployed writer is present. The child resolution
`SaaS-03B-F-R1-R1-R1-R1-R1-R1` therefore supersedes the earlier no-backfill
assumption and requires an explicit idempotent migration/cutover before Course
runtime authorization. The later persistence-materialization microphase must
add the field to package persistence catalogs/declarations, exact Course
validator and serializer/fixtures, and update package artifact topology if
required. It must not make `version` temporarily optional.

That materialization is separate from UpdateCourse portable contract work and
must precede any Course runtime implementation.

## Lifecycle interaction

UpdateCourse remains allowed only for draft and active Courses. Archived is
terminal and rejects UpdateCourse. ActivateCourse and ArchiveCourse retain
their existing transitions; each consumes the same version/CAS contract and
cannot bypass expectedVersion or increment twice.

## Rules and runtime authorization

No Rules, indexes, Firebase configuration or runtime stage changes are made or
authorized here. Rules do not currently constitute the package-owned Course
physical validator; any later client-rule awareness is a separate audit.
Portable version materialization does not open Functions command stages.

## Decision matrix

| Decision | Evidence | Chosen rule | Rejected alternative | Impact |
| --- | --- | --- | --- | --- |
| Token | no existing Course token | explicit `version` | timestamps/status/hidden token | new persistence field |
| Type | Tenant version precedent | integer >= 1 | string/nullable | strict validator |
| Initialization | Create writes initial aggregate | 1 | caller supplied | atomic create |
| Increment | proposed Course CAS docs | +1 per committed state change | per retry/no-op | transaction-owned |
| expectedVersion | CAS command precedent | required for mutations | optional/omitted | portable input field |
| Result | seven-field command standard | no version field | ad hoc result extension | reread after command |
| Replay | command idempotency foundation | stored result, delta 0 | reapply mutation | retry-safe |
| Stale write | existing conflict taxonomy | conflict, no write | new error code | runtime mapping |
| Migration | no Course runtime data | no backfill now | nullable legacy mode | materialization gate |

## Next microphase

`SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1` — Course persisted version and CAS shared
materialization. It must remain design/contract infrastructure only and must
complete before UpdateCourse portable contract materialization can resume.

## Risks and rollback

The physical field is additive but requires coordinated package, validator,
serializer and artifact changes. Rollback before runtime adoption is a
controlled package/document rollback; after persisted writes begin, removal
would require an explicit migration decision and is not authorized here.
