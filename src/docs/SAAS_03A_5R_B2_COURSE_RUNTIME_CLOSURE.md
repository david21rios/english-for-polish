# SaaS-03A.5R-B2 - CourseRepository runtime closure

## Purpose, Git and workflow evidence

This document closes CourseRepository runtime validation from owner-authorized
evidence for a fresh `Firestore Rules Runtime Validation` run; no earlier job
was rerun. Before this documentation commit, local `main`, `origin/main` and
the executed main branch reconcile at
`281d4127a4a301adfbcfe50fd3806f752c68e908`.

FIX3 commits `521e12adde8271dd5844dbe84c5d6879b2b68c66` and
`074fb1177bd53a80ee6f791122e9156689ff08b2`, and FIX4 commits
`06dd9d1f3648f8e2f85c9ae409d07ed85d2273d8` and
`281d4127a4a301adfbcfe50fd3806f752c68e908` are present on main.

The manual workflow uses ubuntu-24.04, Node 24.15.0, Temurin 21 and locked
firebase-tools 15.24.0. npm version and duration were not provided and are
non-blocking. Global SUCCESS establishes completion of prerequisite `npm ci`.
Permissions remain `contents: read` and checkout uses
`persist-credentials: false`.

The only project is `demo-polish-learning`. Four independent sequential
fail-fast `emulators:exec --only firestore` sessions execute Rules,
RegistrationRequest, Membership and Course. No real project, credential,
secret, Firebase remote access, deploy, Storage Emulator or Auth Emulator is
used.

## Definitive results

| Gate | Static | Runtime |
|---|---|---|
| Rules | 222 / 88 ALLOW / 134 DENY | 222 passed / 0 failed |
| RegistrationRequest | 52/34/18; outcomes 34/14/4/0 | 52 passed / 0 failed |
| Membership | 81/44/37; outcomes 44/26/11/0 | 81 passed / 0 failed |
| Course | 114/32/82; outcomes 32/56/26/0 | 114 passed / 0 failed |

Course's Node runner executed 115 tests including one metadata self-control.
Self-control passed and failed Course IDs are `NONE`.

`RT-CRS-REP-063` passes as DENY/CONTRACT_ERROR/CONTRACT_VIOLATION: its cursor
is structurally valid and canonical but its path Tenant is incompatible with
its binding. `RT-CRS-REP-120` passes as DENY/CONTRACT_ERROR/INVALID_ARGUMENT:
its five-segment documentPath is structurally noncanonical.

## Correction history

- First Course runtime: 47 failures; FIX1 isolated authorization and query
  divergences requiring separate authorization.
- FIX2 reconciled Rules access calls, tenant-aware queries and Course indexes.
- Second runtime: only RT-CRS-REP-063 failed; FIX3 corrected cursor taxonomy.
- Third runtime: only RT-CRS-REP-120 failed; FIX4 corrected its fixture.
- Definitive runtime: Course 114/114, no failed IDs, workflow SUCCESS.

Historical evidence remains in FIX1-FIX4 and is not rewritten.

## Indexes and productive limitation

FI-CRS-001 through FI-CRS-005 have:

```text
local_materialization = completed
emulator_query_validation = passed
production_deployment = not_performed
```

Emulator success demonstrates local compatibility of configured Rules, query
shapes and indexes. It does not prove indexes were deployed, built or are
available in Firebase production.

## Technical integrity and local validation

```text
firestore.rules = 32cc7937a5f6dacf1ba59a3c7465930262aad9ffb9a3f26e24a65a43b0b36178
firestore.indexes.json = 7a472c04892b73a9232bf3410d516ab34a15e77015523f8aa018d8f5051c1672
storage.rules = 2bb6e20646b7b8df9d4f3e318b4f9d51c0294aa10b0f899a7d96a4be0c7dee8c
workflow = 0a4d25d8031f72973a625a998ef16698e06b969e07273078c28fff1ef52c0866
Course precheck = 387ac902771be2284660d984f49e3472d163e900cc6cc0102b2c5db850e39ca5
Course runtime = 741d8ead7326ba67a76fbf795d495cc5958bf6cb1d9469081c33d3c082f21611
CourseRepository = 93d6144cb6768f65d3c81a31b347bfb931a57fa729d645b0f0d351466d1b8c25
MembershipRepository = 9af275754f4f594956d756d623e9e712b3730bd72a971f697a3ea7076ea9ea7d
RegistrationRequestRepository = ae290d77b0255087e54c63faffb37741afd3b1e79fd0e7212afdcf6b816e585a
Shared = 5b618929890e30a4a911d94ddf32a3eddd0a4b870ef481bef7729cafff2ab7cf
IdentityRepository = d435129d94e3d902e71c59ea869b20aac6b88ad8ea9890cd55c087ee4607b8a1
TenantRepository = 32cce5d254f6740489d425d2745d4106b445904dd24056cd5b6dee9e249c1584
Domain = a392938c72dabfa1eb688f344f523c26134c5454062ec24b1d1c630e37495337
package.json = 94b828fe8de5b6d5042ebaef5cd0c3a260a9a30aaf0895cfef14a2e2c04365bb
package-lock.json = e905f89559d1248f00ea682cd8afdce90740ed4efc750f836eb8872cdc5c5e0a
```

Only documentation changes in B2. Local prechecks, Rules preflight, 51 Course
unit tests, 35 general tests, build and diff checks pass. No Emulator or
workflow is repeated.

## Shadow mode, risks, decision and next phase

CourseRepository is `completed_in_shadow_mode`: repository, serializer,
queries, cursor, Rules, local indexes, unit/runtime tests and CI gate are
complete. It still has no functional consumers, Provider, Context, hook,
guard, UI, migration, dual-write, legacy replacement, deployment or
productively deployed indexes.

Residual risks are unsigned cursors, concurrent page movement, undeployed
production indexes, no remote Firebase validation, no migration and no
consumer integration. They do not block runtime closure.

```text
SaaS-03A.5R-B2 CourseRepository corrected runtime execution and closure = COMPLETE
SaaS-03A = in_progress
SaaS-03A.5 = completed
SaaS-03A.5R = completed
SaaS-03A.5R-B1 = completed
SaaS-03A.5R-B1-FIX1 = incomplete_superseded_by_FIX2
SaaS-03A.5R-B1-FIX2 = completed
SaaS-03A.5R-B1-FIX3 = completed
SaaS-03A.5R-B1-FIX4 = completed
SaaS-03A.5R-B2 = completed
CourseRepository = completed_in_shadow_mode
```

Next is `SaaS-03A.6A - EnrollmentRepository contract and query audit`,
`ready_not_started`. It will audit Enrollment physical model, client-safe
operations, ownership, Rules compatibility, query contracts, pagination,
cursors, conceptual indexes and Course-Enrollment relationships. It is not
started.
