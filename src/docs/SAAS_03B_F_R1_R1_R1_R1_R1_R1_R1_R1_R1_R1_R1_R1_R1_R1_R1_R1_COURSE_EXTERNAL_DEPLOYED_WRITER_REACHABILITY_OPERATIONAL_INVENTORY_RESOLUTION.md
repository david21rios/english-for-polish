# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course external/deployed writer reachability and operational inventory resolution

## Identity and purpose

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Identifier: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Purpose: define evidence and environment identification needed to determine
  whether an external or deployed canonical Course writer exists.
- Design/documentation only; no remote inspection or operational action is authorized.

## Authority and blocker

Published Course contracts and the runtime/migration and writer-inventory gates
are normative. Repository-local code is physical evidence; tests are test-only;
legacy and historical material do not override published contracts.

`REPOSITORY_LOCAL_CANONICAL_WRITER = ABSENT`.
`DEPLOYED_EXTERNAL_CANONICAL_WRITER_REACHABILITY = UNKNOWN`.
The blocker is `UNKNOWN_EXTERNAL_OR_DEPLOYED_CANONICAL_COURSE_WRITER_REACHABILITY`.

## Environment and writer scope

Before any future remote read-only inventory, identify Firebase project,
environment, Hosting target, Functions target, and Firestore database. Region,
deployment history, client context, and service-account class are conditional.
Credentials are not retrieved here.

Future proof must consider deployed frontend bundles (including stale versions),
deployed Functions, external Admin SDK services, scheduled/manual scripts,
CI/CD jobs, Extensions, third-party integrations, and other Firebase projects.
Existence is not asserted without evidence. Repository inspection cannot prove
absence of stale deployments or external workloads.

## Future evidence and clearance

Required evidence categories are project/environment identity, deployed
Functions inventory, Hosting/version inventory, and external service inventory.
Rules retrieval, deployment history, and Cloud logs are conditional. No remote
read occurs here.

Writer classifications are `REACHABLE_WRITER_CONFIRMED`, `NO_WRITER_PRESENT`,
`DEPLOYED_SURFACE_READ_ONLY`, `WRITER_REACHABILITY_UNKNOWN`, and
`REQUIRES_FURTHER_RESOLUTION`.

The blocker may clear only after all environments and writer categories are
enumerated, each is classified, no unknown production writer remains, every
reachable non-CAS writer has an action, and repository-local absence remains
confirmed. Clearing it does not authorize migration, Rules mutation, runtime,
or stage opening.

Deployed Course state is a separate next gate with exact outcomes:
`NO_COURSE_DATA`, `ALL_COURSES_VERSIONED`, `VERSIONLESS_COURSES_PRESENT`, or
`DEPLOYED_STATE_UNKNOWN`. Writer and state inventory may share one future
read-only session while remaining logically separate.

## Boundaries and sequence

Current Rules do not establish a canonical client Course-write path, but Rules
alone cannot prove deployed absence. Future Admin SDK runtime bypasses Rules.
Versionless-write prevention is not selected here.

The conceptual order is writer reachability → deployed state inventory →
prevention/cutover → backup/export → migration dry-run → migration write →
post-migration verify → zero-versionless proof → Course runtime
implementation/review/publication → stage opening → family closure.

The remote ladder is `READ_ONLY_ENVIRONMENT_IDENTIFICATION`,
`READ_ONLY_WRITER_REACHABILITY_INVENTORY`, `READ_ONLY_COURSE_STATE_INVENTORY`,
`EXPORT_BACKUP`, `MIGRATION_DRY_RUN`, `MIGRATION_WRITE`, and
`POST_MIGRATION_READ_ONLY_VERIFY`; none is authorized here.

CreateCourse, UpdateCourse, ActivateCourse, and ArchiveCourse remain
`NOT_AUTHORIZED`, in that order. F-R2 remains Enrollment-only and not started;
SaaS-03B-R remains after full F closure; Phase 04 remains `NOT_STARTED`.

Publication status: `PENDING_INDEPENDENT_REVIEW`.
