# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1 — Course persisted version and CAS shared materialization

## Scope

This technical checkpoint materializes only the package-owned persisted Course
version contract. It does not implement CreateCourse, UpdateCourse,
ActivateCourse, ArchiveCourse or any Functions runtime.

## Materialized contract

`COURSE_FIELDS` now includes required non-nullable `version` immediately before
the lifecycle `status` field. `validatePersistedCourse` is package-owned,
strict, non-throwing and rejects missing/unknown fields, malformed identifiers,
invalid timestamps, invalid lifecycle shapes and every version value except an
integer `>= 1`. Versionless legacy documents are rejected; no coercion to one
is performed.

The validator reuses package-owned Course status/CEFR catalogs, BCP47,
identifier and timestamp validators. CreateCourse input, behavioral payload,
result fields and runtime stage authorization are unchanged.

## Package and vendor cutover

The additive persistence contract increments `@mipymetic/saas-contracts` from
0.24.0 to 0.25.0. Generated declarations were rebuilt. The Functions vendored
artifact and lock/package references were cut over to
`mipymetic-saas-contracts-0.25.0.tgz`; its manifest records deterministic
inventory, SHA-256, shasum and npm integrity. Runtime dependencies remain zero.

## Legacy boundary

No migration or Firebase write was executed. Before privileged Course runtime,
legacy writers must be inventoried and disabled/updated, new versionless writes
prevented, existing documents migrated to `version: 1`, and zero pending
versionless documents proven.

## Validation

Package typecheck, generated declaration determinism, package topology, full
SaaS contracts (162/162) and package dry-run pass. Protected Firebase, Rules,
Domain, UI and Functions source surfaces are unchanged. Course runtime remains
`NOT_AUTHORIZED`; UpdateCourse semantic contract remains
`NOT_YET_MATERIALIZED`.

## Next microphase

UpdateCourse semantic contract resolution, retaining ownership of patch versus
replacement, mutable fields, lifecycle-specific language/CEFR rules, no-op
semantics and audit before/after allowlists.
