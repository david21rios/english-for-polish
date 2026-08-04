# SaaS-03A.4R-B2 — Membership corrected runtime closure

## Purpose, scope, and sources

This document closes the corrected MembershipRepository runtime sequence from
the owner-authorized evidence of a new successful manual workflow run. The
workflow, validation scripts, three runtime suites, repositories, contracts,
Rules, indexes, Firebase configuration, package manifests, and prior
RegistrationRequest closure were audited. B2 changes documentation only and
does not execute an Emulator, workflow, deployment, or remote Firebase action.

## Corrected commits and Git reconciliation

```text
949ed5659e9e70af6661c426b088c82afcb0b1ee
fix(saas-tests): isolate incompatible Membership runtime fixture

1e3c322aab518ff317de8e2b0d41043e24fe16cf
docs(saas): record Membership runtime fixture isolation
```

Local `HEAD` and `origin/main` both resolve to
`1e3c322aab518ff317de8e2b0d41043e24fe16cf`. The owner confirms that a new
`workflow_dispatch` execution was created from `main` after publishing these
commits, so this reconciled HEAD is the recorded executed SHA.

## Workflow, toolchain, and security

```text
workflow = Firestore Rules Runtime Validation
workflow_file = .github/workflows/firestore-rules-runtime.yml
trigger = workflow_dispatch
branch = main
global_status = SUCCESS
executed_sha = 1e3c322aab518ff317de8e2b0d41043e24fe16cf
runner_configuration = ubuntu-24.04
node_configuration = 24.15.0
npm_version = not_provided_but_non_blocking
java_configuration = Temurin 21
firebase_tools_locked = 15.24.0
npm_ci = passed_by_successful_workflow
global_duration = not_provided_but_non_blocking
explicit_step_exit_codes = not_provided_but_non_blocking
individual_test_log_inspected = false
runtime_execution_confirmed_by_owner = true
```

The workflow uses `permissions: contents: read`, checkout
`persist-credentials: false`, and project `demo-polish-learning`. It uses three
sequential Firestore-only Emulator sessions. It contains no secret, token,
service account, OIDC, gcloud, Firebase login/use/deploy, production project,
Storage/Auth Emulator, or artifact upload. No remote Firebase data or deployment
is used.

## Static and runtime reconciliation

```text
RULES_STATIC = 201 / 82 ALLOW / 119 DENY
RULES_RUNTIME = 201 passed / 0 failed

REGISTRATION_REQUEST_STATIC = 52 / 34 ALLOW / 18 DENY
REGISTRATION_REQUEST_OUTCOMES = 34 SUCCESS / 14 RULES_DENY / 4 CONTRACT_ERROR / 0 NOT_FOUND
REGISTRATION_REQUEST_RUNTIME = 52 passed / 0 failed

MEMBERSHIP_STATIC = 81 / 44 ALLOW / 37 DENY
MEMBERSHIP_OUTCOMES = 44 SUCCESS / 26 RULES_DENY / 11 CONTRACT_ERROR / 0 NOT_FOUND
MEMBERSHIP_RUNTIME = 81 passed / 0 failed

RULES_RUNTIME_STATUS = PASS
REGISTRATION_REQUEST_RUNTIME_STATUS = PASS
MEMBERSHIP_RUNTIME_STATUS = PASS
FAILED_MEMBERSHIP_IDS = none
```

These runtime totals are authorized owner evidence. The supplied visual
evidence confirms the successful job globally but does not expose every
individual test log; no claim of inspecting unavailable logs is made.

## Historical failure and corrected result

The first Membership run reported 65 passed and 16 failed. The deliberately
invalid `platform_admin` fixture shared `uid-student-a`, contaminating broad,
approved, and full-pagination self queries. FIX1 changed only its UID to
`uid-incompatible` and made RT-MEM-REP-012 read it under the matching self
context. RT-MEM-REP-012 remains DENY / CONTRACT_ERROR / CONTRACT_VIOLATION.

All sixteen historical IDs now pass: RT-MEM-REP-020 through 024, 030,
RT-MEM-REP-040 through 044, 050, 062, 063, 067, and 068. Current failed IDs are
none.

## Index and shadow-mode closure

FI-MEM-005, FI-MEM-006, FI-MEM-007, FI-MEM-008, FI-CG-001, FI-CG-002,
FI-CG-006, and FI-CG-007 have `local_materialization = completed`,
`emulator_query_validation = passed`, and
`production_deployment = not_performed`. Emulator success validates local query
forms; it does not prove productive deployment, construction, or availability.

`MembershipRepository = completed_in_shadow_mode`: repository, serializer,
queries, cursor, unit tests, local indexes, and runtime validation are complete,
but there are no functional consumers, Providers, Context, hooks, UI,
migration, dual-write, legacy replacement, or deployment.

## Residual risks and exclusions

- indexes are not deployed productively;
- cursors are unsigned;
- concurrent mutations can move results between pages;
- lifecycle remains backend-only and membershipKeys client deny-all;
- there is no migration, dual-write, UI/provider integration, remote production
  validation, or client administrative activation.

These do not block local runtime closure. Storage remains deny-all and outside
the current release.

## Closure decision and next phase

```text
SaaS-03A = in_progress
SaaS-03A.4 = completed
SaaS-03A.4A = completed
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed
SaaS-03A.4R = completed
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed
SaaS-03A.4R-B = completed
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-FIX1 = completed
SaaS-03A.4R-B1-FIX1-C1 = completed
SaaS-03A.4R-B2 = completed
MembershipRepository = completed_in_shadow_mode
```

The repository order makes CourseRepository next. The exact next microphase is
`SaaS-03A.5A — CourseRepository contract and query audit`, whose purpose is to
audit its physical model, client-safe operations, Rules-compatible query
contracts, pagination/cursor requirements, and conceptual indexes before any
implementation. It is `ready_not_started` and is not initiated here.

```text
SaaS-03A.4R-B2 Membership corrected runtime execution and closure = COMPLETE
```
