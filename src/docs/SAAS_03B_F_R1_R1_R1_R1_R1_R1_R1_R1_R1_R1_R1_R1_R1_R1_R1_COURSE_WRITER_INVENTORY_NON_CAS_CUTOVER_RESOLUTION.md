# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course writer inventory and non-CAS cutover resolution

## Genealogy and purpose

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Child: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- The child is unique: no published document owns this identifier or this
  writer-inventory gate, and `SaaS-03B-F-R2` remains Enrollment-only.
- This is design/documentation only. No cutover, migration, runtime, Rules or
  Firebase operation is authorized.

## Authority and evidence

Published Course contracts and the published runtime/migration gate are
normative. The package Course validator and persistence paths are physical
implementation evidence. Current Course repositories/services are read-only
or legacy application evidence; tests and historical CRUD references are not
production authority. No remote state was inspected.

## Complete inventory

| Candidate | Evidence | Classification | Reachability | Write capability | Decision |
|---|---|---|---|---|---|
| `src/services/saas/course/courseRepository.js` | canonical `tenants/{tenantId}/courses` repository | ABSENT | AUTHENTICATED_REACHABLE reads only | no writes, no version/CAS mutation | KEEP_UNCHANGED |
| `src/services/courses/courseService.js` | legacy `levels/...` catalog reads | HISTORICAL | AUTHENTICATED_REACHABLE reads only | no canonical Course writes | KEEP_UNCHANGED |
| Course command Functions | package contracts only; no business handlers | PROPOSED | UNREACHABLE | none | REQUIRES_FURTHER_RESOLUTION |
| scripts, seeds, migrations targeting canonical Course | repository search found none | ABSENT | UNREACHABLE | none | KEEP_UNCHANGED |
| tests/fixtures/emulator helpers | test-only references and read harnesses | TEST_ONLY | TEST_ONLY | no production writes | KEEP_UNCHANGED |
| historical CRUD documentation | historical evidence | HISTORICAL | UNREACHABLE | unspecified | KEEP_UNCHANGED |
| proposed future runtime/migration writers | this resolution and published gate | PROPOSED | UNREACHABLE | not implemented | REQUIRES_FURTHER_RESOLUTION |

No production writer capable of creating or mutating canonical Course
documents was found. The current SaaS Course repository SDK deliberately
accepts only read dependencies (`doc`, `getDoc`, query/list functions).

## Reachability and write-shape matrix

No current writer can write `courseId`, `tenantId`, Course content, lifecycle,
version, or timestamps. Consequently all versionless-write, version overwrite,
stale-lifecycle, archivedAt-clearing, CAS-bypass, and capability-bypass risks
are `NO` for current production code and `UNKNOWN` for undeployed external or
historical systems. Deployed state remains uninspected.

The canonical future shape remains: integer `version >= 1`; Create initializes
version 1; Update/Activate/Archive require expectedVersion and increment once.

## Cutover and migration readiness

The safe design is to retain current read-only access, replace any future
writer with the privileged Course runtime, and require a complete operational
inventory before migration. No non-CAS writer may coexist silently. New
versionless writes must be prevented before migration; the enforcement
mechanism is not selected here because remote Rules/deployment state is outside
scope.

`MIGRATION_BLOCKED_BY_UNKNOWN_WRITER_REACHABILITY` remains the conservative
classification for deployed or external writers not observable in this
repository. No migration is authorized.

## Boundaries

- All Course runtimes remain unauthorized.
- F-R2 remains Enrollment uniqueness/re-enrollment policy only.
- SaaS-03B-R remains after full F closure.
- Phase 04 remains `NOT_STARTED`.
- No Rules, indexes, Firebase config, UI, Providers, Functions handlers,
  Enrollment or remote Firebase changes are authorized.

## Next gate

Next: independent review of this writer-inventory/cutover resolution. Any
operational writer discovery, freeze mechanism, migration, or runtime opening
requires a separately authorized descendant.

Publication status: candidate, uncommitted and unpublished.
