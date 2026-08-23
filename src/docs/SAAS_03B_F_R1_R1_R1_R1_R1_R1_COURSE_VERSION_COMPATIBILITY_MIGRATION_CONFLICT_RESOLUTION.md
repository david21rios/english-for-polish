# SaaS-03B-F-R1-R1-R1-R1-R1-R1 — Course Version Compatibility, Migration and Conflict Resolution

## Status

This design-only resolution closes the documentary blockers identified while
reviewing the Course version/CAS proposal. It does not modify package source,
runtime, Rules, Firebase or data.

## Evidence classification and writer inventory

The package Course shape and Firestore physical model are published normative
contracts without `version`. The Course command/runtime writer is not yet
implemented. Course paths and legacy audit material document historical/client
Course writes and therefore do not prove an empty deployed database.

Writer classification:

| Writer/evidence | Classification |
| --- | --- |
| Current privileged Course Functions writer | UNKNOWN/not present; runtime not authorized |
| Package CreateCourse contract | SAFE_READ_ONLY contract; no persistence effect |
| Legacy/frontend Course writes documented in audit material | MUST_BE_DISABLED_BEFORE_CUTOVER or MUST_BE_UPDATED |
| Course physical model/fixtures/tests | TEST_ONLY or historical evidence; no deployed-state proof |
| Current Course repository/serializer | NOT_PRESENT as authoritative writer |

Deployed data classification: `VERSIONLESS_COURSE_DATA_MAY_EXIST`. This is
stronger than merely saying state is unprovable because legacy write evidence
exists, while still not asserting remote data contents.

## Compatibility architecture

Select hard cutover with explicit migration before privileged Course runtime:

1. `version` is mandatory in the canonical Course shape.
2. Existing versionless documents are migration targets, not valid mutation
   targets.
3. A controlled migration assigns `version: 1` and preserves all other fields
   and timestamps.
4. Migration is idempotent and must complete before Course runtime stage
   authorization.
5. Legacy non-CAS writers must be disabled or updated before cutover.
6. Reads may report a versionless document as legacy/malformed, but may not
   silently treat it as version 1 for mutation.

Read-compatibility and lazy migration are rejected because two old writers
could race without CAS and because a first mutation would combine migration and
business semantics ambiguously. A nullable canonical field is rejected.

## Migration contract

The future migration owner is an explicit operational/repository migration
microphase, not a command handler. It targets every Course document lacking a
valid integer version, writes `version: 1` transactionally per document, keeps
lifecycle and timestamps unchanged, is safe to rerun, and emits only the
approved bounded migration audit if a later audit contract requires it.
No Course runtime is authorized until migration completion and legacy-writer
cutover are evidenced.

## Stale-version error taxonomy

The canonical existing code is `CONFLICT` (`BACKEND_ERROR_CODES.CONFLICT` and
repository `CONFLICT`). It is used by Tenant transaction stores for
`expectedVersion` mismatch and is distinct from `FAILED_PRECONDITION` for an
invalid lifecycle, `NOT_FOUND` for missing Course, `FORBIDDEN` for authority,
and `CONTRACT_VIOLATION` for malformed persistence. Command binding or replay
binding conflicts also remain `CONFLICT`, with their causes kept distinct in
internal messages. No new error code is required.

## Resulting version and replay

`SEVEN_FIELD_RESULT_FINAL` is selected. Course command results retain the
published seven fields and do not add `resultingVersion`. A caller rereads the
authoritative Course for its next expectedVersion. This preserves result
stability and deterministic replay: a replay returns the historical stored
seven-field result regardless of the Course's later version.

## No-op ownership

`ONLY_ACTUAL_STATE_CHANGE_INCREMENTS_VERSION` is the generic persistence rule.
Whether UpdateCourse rejects, accepts, or defines a particular request as a
no-op belongs to the later UpdateCourse semantic resolution. A retry/replay
never increments; only a committed actual state change increments once.

## Boundary after this resolution

The later persistence materialization may implement only the version field,
validator, serializer/catalog and migration prerequisites. UpdateCourse
semantic work still owns patch versus replacement, mutable fields, draft/active
rules, language/CEFR mutability, no-op acceptance and audit before/after lists.

CreateCourse portable contract remains unchanged: version is persistence-owned,
initialized to 1 only by future runtime persistence. ActivateCourse and
ArchiveCourse use the same version/CAS semantics (`draft → active`,
`draft/active → archived`, archived terminal); RestoreCourse remains
prohibited.

## Rules and client writers

Rules currently do not enforce a complete Course field allowlist. No Rules or
index change is made here. Client/legacy Course writers must be removed or
updated before cutover; the future owner is the dedicated migration/cutover
microphase.

## Materialization preconditions

Before `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1` starts, this resolution must be published,
the migration/cutover owner accepted, stale conflict mapped to `CONFLICT`, the
seven-field result retained, and the no-op boundary recorded.

## Genealogy

`SaaS-03B-F-R1-R1-R1-R1-R1-R1` is the compatibility resolution. The subsequent
technical persistence materialization is
`SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1`; the unpublished identifier is deliberately
placed after this prerequisite resolution.
