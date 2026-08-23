# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course deployed state and version inventory resolution

## Identity and purpose

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Identifier: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Purpose: define the future read-only evidence model for deployed canonical
  Course state. No Firebase access, migration, runtime, or stage opening is
  authorized.

## Authority and blocker

Published Course contracts and gates are normative; package/Rules/repository
code is physical evidence; tests are test-only; legacy and historical material
is lower authority. Current blocker: `DEPLOYED_COURSE_STATE_UNKNOWN`.

## Public state model

The only top-level classifications are:

- `NO_COURSE_DATA`: identified environment and completed canonical query return
  zero documents.
- `ALL_COURSES_VERSIONED`: one or more documents exist, every document has an
  integer `version >= 1`, and every document passes canonical persistence
  validation.
- `VERSIONLESS_COURSES_PRESENT`: at least one canonical document lacks a valid
  version or requires version remediation.
- `DEPLOYED_STATE_UNKNOWN`: identity, access, query, or validation evidence is
  incomplete or ambiguous.

## Canonical population and diagnostics

The population is `tenants/{tenantId}/courses/{courseId}`. Legacy `levels/...`
catalog data is excluded. Every document physically present at a canonical
Course path counts toward `TOTAL_COURSE_DOCUMENTS`, including malformed data.

Diagnostic categories are non-overlapping primary counts:

- `VALID_VERSIONED_COURSES`: full persisted validation passes and version is
  integer `>= 1`.
- `VERSIONLESS_COURSES`: version absent or null, otherwise eligible for a
  future version-only migration candidate.
- `INVALID_VERSION_COURSES`: version present but non-integer or `< 1`.
- `MALFORMED_COURSES`: any other persisted-shape failure, including identity,
  lifecycle, timestamp, language, unknown-field, or path mismatch.

The detailed categories reconcile deterministically to the total. A malformed
document is not silently repaired by assigning `version = 1`.

## Future algorithm and evidence

1. Positively identify project, environment, and Firestore database.
2. Query the canonical Course population read-only.
3. Count total documents.
4. Validate version and persisted shape, producing required counts.
5. Return `NO_COURSE_DATA`, `ALL_COURSES_VERSIONED`,
   `VERSIONLESS_COURSES_PRESENT`, or fail-closed as `DEPLOYED_STATE_UNKNOWN`.

Required future counts: total, valid versioned, versionless, invalid-version,
and malformed. Required fields for classification are path/ID, tenantId,
courseId, version, status, and validation-relevant timestamps. Content fields
are read only when full validation requires them and are never reported raw.
Output is aggregate counts plus minimal remediation identifiers and failure
category; no full snapshots or content fields.

Environment requirements: project ID, environment, and database are required;
region is conditional; credential class is required before remote access;
Hosting and Functions targets are not required for state classification unless
needed to disambiguate the environment.

## Boundaries and readiness

Writer reachability and state inventory are logically separate and may share a
future authorized read-only session. The order is:
writer reachability → state inventory → versionless-write prevention/cutover →
backup → migration dry-run → migration write → post-migration verification.

`NO_COURSE_DATA` or `ALL_COURSES_VERSIONED` may eliminate version backfill but
do not authorize runtime. `VERSIONLESS_COURSES_PRESENT` requires later
prevention, backup, dry-run, remediation, and zero-versionless proof.
`DEPLOYED_STATE_UNKNOWN` remains fully fail-closed.

Read-only state inventory itself requires no backup; backup/export is required
before migration write and may be required before mutation-capable dry-run
tooling. No Rules or Admin SDK change is part of this resolution.

CreateCourse, UpdateCourse, ActivateCourse, and ArchiveCourse remain
`NOT_AUTHORIZED`. F-R2 remains Enrollment-only and not started; SaaS-03B-R
remains after full F closure; Phase 04 remains `NOT_STARTED`.

Publication status: `PENDING_INDEPENDENT_REVIEW`.
