# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1 — UpdateCourse portable contract materialization

## Scope

This microphase materializes only the package-owned UpdateCourse portable
contract. It does not authorize or implement a Functions runtime, Firestore
transaction, migration, writer cutover, Rules change, UI/provider behavior or
Enrollment behavior.

## Materialized contract

`UpdateCourse` uses the constrained partial patch resolution. Exact input
fields, in order, are `commandId`, `correlationId`, `tenantId`, `courseId`,
`expectedVersion`, and `patch`. Patch keys are limited to the six Course
content fields and are validated with the existing identifier, text, BCP-47,
CEFR and exact object conventions. The behavioral payload contains only
`tenantId`, `courseId`, `expectedVersion`, and a detached frozen `patch`.

`expectedVersion` is required, integer >= 1, non-persisted and reserved for
runtime CAS. Runtime stale-version handling remains `CONFLICT`.

The result is the unchanged seven-field command result:
`commandId`, `correlationId`, `operation`, `resourceType`, `resourceId`,
`status`, `replayed`, bound to `UpdateCourse`, `course`, and `courseId`.

The audit contract is `UpdateCourse.update`, privileged, succeeded, with
bounded before/after fields and metadata `stage`, `changedFieldCount`, and
`expectedVersion`. `changedFieldCount` is the deterministic count of persisted
Course fields that actually changed, never a raw patch or content snapshot.

## Lifecycle and runtime boundary

The package exposes structural/value validation only. Draft runtime may update
all six fields; active runtime may update only `displayName` and `description`.
Status, version, timestamps and identity remain caller-forbidden. No-op,
archived lifecycle, CAS and authorization semantics remain runtime decisions
as published. UpdateCourse is not added to the privileged runtime stage map;
`UPDATECOURSE_RUNTIME=NOT_AUTHORIZED` remains true. CreateCourse remains
unchanged and runtime-unauthorized.

## Package and SemVer

Adding a new public command module and exports is an additive package API
change. The package advances from `0.25.0` to `0.26.0`. Generated TypeScript
declarations were rebuilt; no runtime dependency was introduced.

The Functions vendored artifact was cut over to
`mipymetic-saas-contracts-0.26.0.tgz`. Its manifest records the deterministic
inventory, SHA-256, npm shasum and integrity. The Functions lockfile integrity
matches the artifact manifest.

## Validation

- UpdateCourse dedicated tests: PASS
- Full SaaS contracts suite: 168/168 PASS
- Package topology and artifact checks: PASS
- TypeScript declaration build/check: PASS
- Public root and commands exports: PASS
- Runtime stage remains closed: PASS
- Protected Firebase, Rules, Domain, UI, Providers and Enrollment surfaces: unchanged

## Risks and rollback

Runtime remains blocked pending Course version migration and legacy writer
cutover proof. Rollback is the normal repository revert of the technical and
documentary commits, preserving the prior `0.25.0` vendor artifact if runtime
consumers require it.

## Next microphase

Independent review of this package materialization precedes any UpdateCourse
runtime work. No Firebase or public handler work is authorized by this record.
