# SaaS-03A.5R-B1 - Course runtime CI integration

> FIX1 evidence: the first Course execution produced 68 passed / 47 failed
> across 115 Node tests (114 Course IDs plus metadata self-control). Diagnosis
> found a tenant-admin Rules-evaluation divergence and a missing tenant-equality
> proof in every list contract. B2 is blocked; no Course PASS is claimed.

> FIX2 reconciliation updates the canonical Rules gate to 222/88/134 and
> corrects Course tenant query proofs and indexes. Runtime remains pending.

## Purpose, scope and sources

This phase integrates the reviewed CourseRepository runtime suite into the
existing manual Firestore workflow. Sources include the workflow, all four
static validators/runtime suites, Course contracts and implementation, Rules,
indexes, Firebase configuration and the prior RegistrationRequest/Membership CI
records. No runtime, Emulator, deployment, remote access or package change is
performed here.

## Previous state and workflow audit

The base is `d88cac796536456120c7378322d224f55653b0ea`, reconciled with
`origin/main`. `Firestore Rules Runtime Validation` remains manual
`workflow_dispatch`, `ubuntu-24.04`, Node 24.15.0, Temurin 21 and local
firebase-tools 15.24.0. Checkout keeps `persist-credentials: false`; job
permissions remain `contents: read`; timeout remains 20 minutes.

There are no push/pull-request/schedule triggers, secrets, credentials, OIDC,
write permissions, artifacts, continue-on-error, Firebase login/use/deploy,
Storage/Auth Emulator or productive project. The only project is
`demo-polish-learning`.

## Gates, counts and execution order

Static contracts remain independent:

| Gate | Total | ALLOW | DENY | SUCCESS | RULES_DENY | CONTRACT_ERROR | NOT_FOUND |
|---|---:|---:|---:|---:|---:|---:|---:|
| Rules | 201 | 82 | 119 | n/a | n/a | n/a | n/a |
| RegistrationRequest | 52 | 34 | 18 | 34 | 14 | 4 | 0 |
| Membership | 81 | 44 | 37 | 44 | 26 | 11 | 0 |
| Course | 114 | 32 | 82 | 32 | 56 | 26 | 0 |

`scripts/validate-course-runtime-tests.mjs` is read-only, ESM, network-free and
portable. It validates the three explicit Course files, loop/direct Test ID
registrations, unique metadata, outcomes, invariants, suite autocontrols, demo
project, Rules-only harness and exact read-only repository injection. It rejects
Storage/Auth, global Firebase, Buffer, absolute paths, ports, credentials,
network references, globs and deployment commands.

The final workflow order is checkout, Node, Java, versions, `npm ci`, local CLI
version, Rules preflight, expected contracts, the three repository prechecks,
then four sequential runtimes: Rules, RegistrationRequest, Membership and
Course. Course uses exactly:

```text
./node_modules/.bin/firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/course/courseRepository.runtime.test.mjs"
```

Sessions remain independent for separate logs, cleanup and failure attribution.
Default step semantics provide fail-fast: no later runtime runs after an earlier
failure. Twenty minutes remains proportionate because the workflow has no build,
general tests, artifacts or deploy.

## Indexes and production limitation

`firebase.json` continues to reference `firestore.indexes.json`, containing
FI-CRS-001 through FI-CRS-005. The future Emulator PASS validates local query
forms, but does not prove indexes are deployed, built or available in Firebase
production.

## Rollback

Rollback removes only the Course static-precheck step, Course runtime step and
`scripts/validate-course-runtime-tests.mjs`; it preserves all prior gates,
restores the previous workflow hash, rechecks YAML ordering/security, and reruns
the three preceding prechecks plus Rules preflight. Rollback is not executed.

## Validation, risks and evidence

Local syntax, lint, Course unit tests, all prechecks, Rules preflight, general
tests, build and whitespace checks pass. YAML was structurally checked without
installing packages. Runtime remains unexecuted. Residual risks are actual
Emulator compatibility, four startup durations and query/index behavior; these
are deferred to B2 evidence rather than represented as PASS.

After human `git push origin main`, create a new `workflow_dispatch` execution
on `main`; do not re-run an old job. Evidence must include workflow/branch/SHA,
duration/runner/toolchain/npm-ci, demo project, four Firestore starts/stops,
Storage/Auth absence, exit codes, failed IDs/stacks, and 201/201, 52/52, 81/81,
114/114 with global SUCCESS.

## State and closure

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-A = completed
SaaS-03A.5R-A-C1 = completed
SaaS-03A.5R-B = in_progress
SaaS-03A.5R-B1 = completed
SaaS-03A.5R-B1-C1 = completed_pending_human_push
SaaS-03A.5R-B2 = blocked_pending_manual_push_and_workflow
CourseRepository = implemented_shadow
```

The B1 closure criteria are met locally. B2 is not started and Course runtime
PASS or production index availability is not claimed.

## FIX3 status

The post-FIX2 workflow passed 113/114 Course IDs and metadata self-control.
`RT-CRS-REP-063` alone failed because a canonical cross-Tenant position path
was classified as `INVALID_ARGUMENT` instead of R1's `CONTRACT_VIOLATION`.
FIX3 applies the minimal cursor taxonomy correction. CI gates and counts remain
unchanged, and a new manual run is required before B2 can close.
