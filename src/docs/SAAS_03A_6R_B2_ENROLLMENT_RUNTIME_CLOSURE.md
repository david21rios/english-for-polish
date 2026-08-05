# SaaS-03A.6R-B2 — Enrollment corrected runtime execution and closure

## Purpose and scope

This exclusively documentary microphase audits the corrected external runtime,
reconciles the EnrollmentRepository traceability and closes SaaS-03A.6. It does
not change code, Rules, indexes, tests, workflow, scripts, packages, Firebase
configuration, consumers or production state.

## Sources and Git evidence

The Enrollment 6A/R1/6B/C1/6I/C1/6R-A/C1/B1/F1 record, query/index and CI
documents, workflow, all prechecks, Enrollment runtime and repository, Rules and
Rules tests, Firebase configuration and protected repositories were audited.
The requested result/closure sources reconcile to the vigente singular
`FIRESTORE_RULES_RUNTIME_EXECUTION_RESULT.md` and
`FIRESTORE_RULES_PROJECT_FINAL_CLOSURE.md`.

Before documentation changes, branch `main` was clean and:

```text
HEAD = origin/main = workflow SHA
195bf80bffe8d47a500a94951c87382f07ae54da
```

F1 commits are present as
`41a3f942f808da2b706c0bcf8cd0dda3154b789f` and
`195bf80bffe8d47a500a94951c87382f07ae54da`.

The owner confirms a completely new `workflow_dispatch` run on `main`, after
publishing F1, completed globally `SUCCESS`. This authorized evidence binds the
run to the reconciled published HEAD. Duration, exact npm version, individual
session exit codes and individual shutdown logs were not supplied and are
`not_provided_but_non_blocking`; successful sequential gates establish their
required completion without inventing values.

## Workflow, environment and security

`Firestore Rules Runtime Validation` uses `ubuntu-24.04`, Node 24.15.0,
Temurin 21 and locked local firebase-tools 15.24.0. `npm ci` succeeded as a
required predecessor to all five successful runtime gates. The project is
`demo-polish-learning`, never a real Firebase project.

The workflow has `contents: read`, checkout credentials disabled and no secret,
Firebase credential, login, OIDC, write permission, deploy, artifact upload,
Storage Emulator, Auth Emulator or Firebase project data access. Five separate,
sequential Firestore Emulator sessions ran for Rules, RegistrationRequest,
Membership, Course and Enrollment. Global success and each approved gate confirm
Rules compilation, execution and successful process completion; individual log
details not supplied remain non-blocking.

## Definitive results

| Gate | Static contract | Runtime |
| --- | --- | --- |
| Rules | 222; 88 ALLOW; 134 DENY | 222 passed; 0 failed |
| RegistrationRequest | 52/34/18; outcomes 34/14/4/0 | 52 passed; 0 failed |
| Membership | 81/44/37; outcomes 44/26/11/0 | 81 passed; 0 failed |
| Course | 114/32/82; outcomes 32/56/26/0 | 114 passed; 0 failed; metadata PASS |
| Enrollment | 111/42/69; outcomes 42/41/28/0 | 111 IDs passed; 0 failed; metadata PASS |

Enrollment's Node runner includes one additional metadata self-control, for 112
Node tests total. The four historical failures are closed:

- RT-ENR-REP-090: PASS; DENY / CONTRACT_ERROR / INVALID_ARGUMENT;
  `validate_enrollment_options`, `enrollment_collection`.
- RT-ENR-REP-091: PASS; DENY / CONTRACT_ERROR / INVALID_ARGUMENT;
  `validate_enrollment_options`, `enrollment_collection`.
- RT-ENR-REP-113: PASS; DENY / CONTRACT_ERROR / CONTRACT_VIOLATION;
  `serialize_snapshot`, `enrollment`.
- RT-ENR-SEC-137: PASS; ALLOW / SUCCESS. It is a tenant-admin query narrowed by
  `courseId`. Rules permit the safe subset, while EnrollmentRepository's public
  API intentionally continues to defer that query family.

History remains explicit: the first external Enrollment run failed these four
expectations; F1 diagnosed and corrected them; corrected local runtime passed;
the owner pushed; a new workflow run then succeeded.

## Indexes and productive limitation

FI-ENR-002 and FI-ENR-005 are `local_materialization = completed`,
`emulator_query_validation = passed` and
`production_deployment = not_performed`. FI-ENR-001, FI-ENR-003, FI-ENR-004,
FI-ENR-006 and FI-ENR-007 remain deferred and unmaterialized.

Firestore Emulator success validates local query shapes, Rules and SDK behavior;
it does not demonstrate that indexes are deployed, built or available in a
production Firebase project.

## Completed shadow mode

`EnrollmentRepository = completed_in_shadow_mode`: factory, read-only API,
serializer, validation, queries, cursor, pagination, FI-ENR-002/FI-ENR-005,
unit tests, runtime tests, CI gate and compatible Rules are complete. There are
still no consumers, UI, Providers, migration, dual-write, client writes,
teacher cohort API, cross-Tenant aggregation, deployment, remote Firebase use or
functional activation.

## Residual risks

The two indexes are not productively deployed; Base64URL cursors are unsigned;
concurrent writes can move page boundaries; migration, dual-write, consumers,
UI and Providers are absent; writes remain backend-only and unimplemented;
teacher cohorts and self cross-Tenant aggregation are deferred; Membership–Course
uniqueness and re-enrollment policy remain unresolved; additional operational
behavior for archived Courses is deferred; no remote Firebase validation exists.
These are bounded future concerns, not defects in the completed read repository.

## Local validation and technical integrity

Enrollment, Course, Membership and RegistrationRequest prechecks pass with their
canonical counts; Rules preflight is 222/88/134; Enrollment unit tests are
46/46; general tests are 35/35; build and `git diff --check` pass. Hashes and
manifests recorded before and after B2 are identical for every protected
technical area.

## Final state and next ordered phase

```text
SaaS-03A = in_progress
SaaS-03A.6 = completed
SaaS-03A.6R = completed
SaaS-03A.6A = incomplete_superseded_by_resolution
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed
SaaS-03A.6I = completed
SaaS-03A.6I-C1 = completed
SaaS-03A.6R-A = completed
SaaS-03A.6R-A-C1 = completed
SaaS-03A.6R-B1 = completed
SaaS-03A.6R-F1 = completed
SaaS-03A.6R-B2 = completed
EnrollmentRepository = completed_in_shadow_mode
```

The implementation order places `SaaS-03B — Backend privilegiado y bootstrap`
next. Its purpose is server-only invitations, lifecycle/role operations, Tenant
bootstrap, out-of-band platform-admin bootstrap and auditing. Its documented
dependency is Phase 02 and it may coordinate schemas with completed 03A.
Readiness is `ready_not_started`; it is not initiated.

## Closure criteria and rollback

Git/SHA reconciliation, global SUCCESS, five successful runtimes, canonical
prechecks, 111/111 Enrollment IDs, metadata PASS, four historical IDs resolved,
index traceability, protected technical integrity, documentation and isolated
documentary staging all comply. Decision: `SaaS-03A.6R-B2 COMPLETE`.

Rollback is documentary only: revert this closure commit and restore prior
documentation states. It must not change any technical artifact or erase the
historical execution record.
