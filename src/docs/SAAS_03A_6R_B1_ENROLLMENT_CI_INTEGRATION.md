# SaaS-03A.6R-B1 — Enrollment runtime CI integration

## Purpose and scope

This microphase integrates the prepared EnrollmentRepository runtime suite into
the existing manual `Firestore Rules Runtime Validation` workflow. It adds one
read-only static precheck and one independent Firestore-only runtime gate. It
does not execute the Emulator or workflow, change Rules, indexes, repositories,
runtime suites or packages, access Firebase remotely, or deploy.

## Sources and prior state

The workflow, all four existing prechecks/gates, the Enrollment runtime harness,
fixtures and registry, EnrollmentRepository and its unit tests, Rules tests,
Firebase configuration, 6A–6R-A-C1 contracts and the institutional CI strategy
were audited. The requested runtime strategy/result/closure names reconcile to
the vigente `FIRESTORE_RULES_CI_RUNTIME_STRATEGY.md`,
`FIRESTORE_RULES_RUNTIME_EXECUTION_RESULT.md` and
`FIRESTORE_RULES_PROJECT_FINAL_CLOSURE.md`; no duplicate documents were created.

The base state is EnrollmentRepository `implemented_shadow`, 111 prepared Test
IDs and no Enrollment runtime execution. Static metadata is 41 ALLOW, 70 DENY,
41 SUCCESS, 42 RULES_DENY, 28 CONTRACT_ERROR and 0 NOT_FOUND.

## Workflow and security

The workflow remains manual (`workflow_dispatch`) on `ubuntu-24.04`, with
`permissions: contents: read`, checkout `persist-credentials: false`, Node
24.15.0, Temurin 21, local locked firebase-tools 15.24.0 and a 20-minute job
timeout. It contains no push/pull-request/schedule trigger, secret, credential,
OIDC, write permission, login, deploy, artifact upload, remote Firebase access,
Storage Emulator, Auth Emulator or `continue-on-error`.

The only project is `demo-polish-learning`. Every runtime invokes the local CLI
with `--only firestore` and an explicit test file. Natural sequential failure
propagation is retained.

## Static precheck

`scripts/validate-enrollment-runtime-tests.mjs` is deterministic, ESM,
read-only and dependency-free. It audits the three canonical runtime files,
relative ESM imports, demo project and Firestore-only harness, exact SDK
injection, unique IDs and titles, executable assertions, self-control metadata,
security/portability prohibitions and these invariants:

```text
Enrollment runtime tests: 111
ALLOW: 41
DENY: 70
SUCCESS: 41
RULES_DENY: 42
CONTRACT_ERROR: 28
NOT_FOUND: 0
```

It exits non-zero on divergence. The workflow step is:

```text
Run Enrollment runtime static precheck
node scripts/validate-enrollment-runtime-tests.mjs
```

## Five independent runtime gates

The final order is checkout, Node, Java, tool versions, `npm ci`, Firebase CLI
version, Rules preflight, expected contracts, RegistrationRequest precheck,
Membership precheck, Course precheck, Enrollment precheck, Rules runtime,
RegistrationRequest runtime, Membership runtime, Course runtime and Enrollment
runtime. The fifth gate is:

```text
Run Enrollment repository runtime tests
./node_modules/.bin/firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/enrollment/enrollmentRepository.runtime.test.mjs"
```

The five Emulator lifecycles are isolated and sequential. A failure prevents
later gates. Existing contracts remain Rules 222/88/134,
RegistrationRequest 52/34/18 with 34/14/4/0, Membership 81/44/37 with
44/26/11/0, and Course 114/32/82 with 32/56/26/0.

## Timeout, indexes and limitations

Twenty minutes remains appropriate: the workflow has lightweight prechecks,
five bounded Firestore sessions and no build, general tests or artifact upload;
there is no measured evidence requiring expansion. FI-ENR-002 and FI-ENR-005
remain locally materialized. A future Emulator PASS can validate local query
shapes but cannot prove that indexes are deployed, built or available in a
production Firebase project.

## Validation and rollback

The new script passes `node --check`, ESLint and its executable count audit.
Course, Membership and RegistrationRequest prechecks, Rules preflight,
Enrollment unit tests, general tests, build and diff checks are required both
before and after the isolated commits.

Rollback is limited to removing the Enrollment precheck and runtime steps,
deleting `scripts/validate-enrollment-runtime-tests.mjs`, and restoring the
previous workflow hash. Rules, indexes, suites, repositories and the four
earlier gates must remain intact.

## Future evidence and risk

No Enrollment runtime PASS is claimed. After owner push, a new manual run on
`main`—not “Re-run failed jobs”—must record the workflow/branch/SHA, toolchain,
`npm ci`, demo project, five Emulator lifecycle exit codes and cleanup, absence
of Storage/Auth/credentials/remote/deploy, and results 222/222, 52/52, 81/81,
114/114 and 111/111 with Enrollment metadata PASS and no failed IDs.

Residual risk is external runtime behavior and the productive index limitation;
both remain explicit blockers for B2.

## State and closure criteria

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6R = in_progress
SaaS-03A.6R-B = in_progress
SaaS-03A.6R-B1 = completed
SaaS-03A.6R-B1-C1 = completed_pending_human_push
SaaS-03A.6R-B2 = blocked_pending_manual_push_and_workflow
EnrollmentRepository = implemented_shadow
```

All B1 closure criteria are met when the precheck, workflow integration,
security audit, protected-file integrity, validations, isolated commits and
clean worktree are confirmed. B2 is not initiated.

## SaaS-03A.6R-F1 runtime correction

The first external Enrollment runtime exposed four expectation defects. F1
preserves all 111 IDs, corrects operation/resource assertions for 090, 091 and
113, and correctly reclassifies the Rules-compatible bounded admin query 137.
Metadata is now 42 ALLOW, 69 DENY and outcomes 42/41/28/0. Local runtime is
112/112 including metadata; a new external workflow remains required.
