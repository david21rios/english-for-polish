# SaaS-03A.3R-B2 — RegistrationRequest corrected runtime closure

## Purpose and background

This document closes the RegistrationRequest repository runtime sequence and
SaaS-03A.3 after the owner published the FIX1 commits and confirmed a new,
successful **Firestore Rules Runtime Validation** workflow run on `main`.

The first repository runtime had reported 43 passed and 9 failed. FIX1 resolved
four root causes: protected nonexistence is `FORBIDDEN`, one empty-list test
used a mismatched authenticated UID, six cursor tests supplied the wrong
`documentId()` field-value type, and one direct key-read test omitted `getDoc`
from its SDK map.

## Executed commits and identity

```text
92a759ebe10827191e60e4cc05510301f3ee104e
fix(saas-repositories): correct RegistrationRequest runtime pagination

851d51b42a642478f9bd5ffc6628ce25f3c90c4e
docs(saas): record RegistrationRequest runtime failure resolution
```

Local `HEAD` and `origin/main` both resolve to
`851d51b42a642478f9bd5ffc6628ce25f3c90c4e`. The owner confirms the corrected
workflow was newly dispatched on `main` after those commits were published;
that corrected HEAD is therefore the recorded executed SHA.

## Workflow and toolchain evidence

```text
workflow = Firestore Rules Runtime Validation
branch = main
status = SUCCESS
executed_sha = 851d51b42a642478f9bd5ffc6628ce25f3c90c4e
runner_configuration = ubuntu-24.04
node_configuration = 24.15.0
java_configuration = Temurin 21
firebase_tools_locked = 15.24.0
npm_version = not_provided_but_non_blocking
global_duration = not_provided_but_non_blocking
explicit_step_exit_codes = not_provided_but_non_blocking
emulator_shutdown_log = not_provided_but_non_blocking
```

Workflow success confirms checkout, `npm ci`, Rules preflight,
RegistrationRequest precheck, both sequential Firestore-only Emulator gates,
and their required assertions completed successfully. It uses only
`demo-polish-learning`, no Firebase login, credential, secret, real project,
Storage/Auth Emulator, remote deployment, or artifact upload.

## Static and runtime results

```text
RULES_STATIC_TOTAL = 201
RULES_STATIC_ALLOW = 82
RULES_STATIC_DENY = 119

RRQ_STATIC_TOTAL = 52
RRQ_STATIC_ALLOW = 34
RRQ_STATIC_DENY = 18
RRQ_STATIC_SUCCESS = 34
RRQ_STATIC_RULES_DENY = 14
RRQ_STATIC_CONTRACT_ERROR = 4
RRQ_STATIC_NOT_FOUND = 0

RULES_RUNTIME_TOTAL = 201
RULES_RUNTIME_PASSED = 201
RULES_RUNTIME_FAILED = 0

RRQ_RUNTIME_TOTAL = 52
RRQ_RUNTIME_PASSED = 52
RRQ_RUNTIME_FAILED = 0
WORKFLOW_STATUS = SUCCESS
```

The executed repository file was
`tests/integration/saas/registrationRequest/registrationRequestRepository.runtime.test.mjs`.
All nine previously failing IDs now pass:

- `RT-RRQ-REP-006`;
- `RT-RRQ-REP-015`;
- `RT-RRQ-REP-052`;
- `RT-RRQ-REP-053`;
- `RT-RRQ-REP-056`;
- `RT-RRQ-REP-057`;
- `RT-RRQ-REP-060`;
- `RT-RRQ-REP-061`;
- `RT-RRQ-SEC-004`.

```text
PREVIOUSLY_FAILED_CASES_NOW_PASS = true
CURRENT_FAILED_IDS = none
```

## Index and security closure

FI-RRQ-001, FI-RRQ-002, FI-CG-003, and FI-CG-004 remain locally materialized.
The runtime exercises Tenant/collection-group variants with and without status.
Emulator query success validates the checked-in local shapes but does not prove
production index deployment. No index, Rule, Storage policy, package,
workflow, test, repository, Shared, Identity, Tenant, or Domain file changes in
B2. No Firebase remote resource or deployment was used.

`registrationRequestKeys` remains client deny-all. RegistrationRequest writes
and lifecycle operations remain backend-only. `storage.rules` remains deny-all
under `CURRENT_SAAS_STORAGE_POLICY = NO_STORAGE`.

## Residual risks

- composite indexes are materialized only in local configuration and are not
  deployed to a production project;
- client cursors are validated but unsigned;
- concurrent changes can cause pagination duplication or omission;
- the repository remains shadow-only with no consumer or Provider integration;
- there is no data migration, cutover, dual-write, or remote production check;
- lifecycle operations remain trusted-backend-only;
- `registrationRequestKeys` remains client deny-all;
- Storage remains outside the current SaaS release.

## Closure decision and next phase

All local static validations and the owner-confirmed hosted runtimes pass. The
repository is complete in shadow mode but is not functionally activated.

```text
SaaS-03A = in_progress
SaaS-03A.3 = completed
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R2 = completed
SaaS-03A.3I = completed
SaaS-03A.3R = completed
SaaS-03A.3R-A = completed
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
RegistrationRequestRepository = completed_in_shadow_mode
SaaS-03A.4 = ready_not_started
```

The next phase is `SaaS-03A.4 — MembershipRepository`: strict self point,
Tenant-scoped and collection-group reads for canonical membership roles and
states, followed by query/index and Firestore-only runtime validation. It is
not started here.

```text
SaaS-03A.3R-B2 RegistrationRequest corrected runtime closure = COMPLETE
```
