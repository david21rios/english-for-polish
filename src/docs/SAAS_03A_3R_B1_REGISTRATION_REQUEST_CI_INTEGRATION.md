# SaaS-03A.3R-B1 — RegistrationRequest runtime CI integration

## Purpose and audited sources

This phase integrates the prepared RegistrationRequest repository runtime suite
into the existing **Firestore Rules Runtime Validation** workflow. The complete
workflow, package boundary, lockfile, Firebase configuration, Rules and runtime
tests, repository implementation, prior CI/runtime records, and current roadmap
were audited before modification.

The integration is static only. No Emulator, workflow, Firebase CLI runtime,
remote Firebase service, deployment, login, push, or MembershipRepository was
started.

## Existing workflow and security

The workflow remains manual `workflow_dispatch`, `contents: read`, one
`ubuntu-24.04` job, a 20-minute timeout, Node 24.15.0, Temurin Java 21,
`npm ci`, and lockfile-local firebase-tools 15.24.0. Checkout still disables
credential persistence and package caching remains disabled.

It contains no GitHub secrets or variables, environment target, write/OIDC
permission, Firebase token, service account, login, gcloud, deploy, artifact
upload, sensitive-file read, or real Firebase project ID. Storage and Auth
Emulators are not started. `storage.rules` remains deny-all.

## Selected runtime strategy

Alternative A was selected: two independent, sequential `emulators:exec`
sessions.

1. The unchanged canonical Rules runtime runs first through
   `npm run test:rules:firestore` and preserves 201 IDs, 82 ALLOW and 119 DENY.
2. Only after it passes, the RegistrationRequest repository runtime starts a
   fresh Firestore-only Emulator lifecycle and runs its explicit test file.

This keeps logs, exit codes, cleanup, and failure classification separate. No
`continue-on-error` is present, so precheck or either runtime failure fails the
job and prevents later gates from running.

## Static precheck

`scripts/validate-registration-request-runtime-tests.mjs` is a read-only ESM
precheck with no dependencies beyond Node. It verifies file presence, 52 unique
IDs, 34/18 metadata, the original 34/13/4/1 outcome breakdown, executable suite
self-checks, the demo project, and absence of Storage, `src/firebase.js`, and
absolute workstation paths.

It reads local source only, does not import or run the suite, and performs no
Firebase or network operation. No npm script was added: the workflow invokes
Node directly, avoiding unnecessary `package.json` and lockfile changes.

## Workflow order and commands

The final relevant order is:

1. `npm run ci:validate:firestore-rules`;
2. emit separated expected-count labels;
3. `node scripts/validate-registration-request-runtime-tests.mjs`;
4. `npm run test:rules:firestore`;
5. `./node_modules/.bin/firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/registrationRequest/registrationRequestRepository.runtime.test.mjs"`.

The explicit test path has no glob and is portable on the Ubuntu runner. The
local binary avoids global installation and `npx` network fallback.

## Counts and evidence boundaries

The workflow emits distinct labels for Rules `201 / 82 / 119` and
RegistrationRequest `52 / 34 / 18`, plus the four outcome totals. The precheck
validates only source structure. Neither these labels nor this implementation
claim that GitHub Actions or Emulator runtime has passed.

The next manual run must record workflow name, branch, HEAD SHA, runner,
Node/npm/Java/firebase-tools versions, `npm ci`, both prechecks, demo project,
Emulator startup/compilation/shutdown, absence of Storage/Auth, separate
passed/failed totals and IDs, duration, exit code, and final workflow status.

## Local indexes and production limitation

`firebase.json` continues to reference `firestore.indexes.json`; no configuration
or index definition changed. The suite exercises FI-RRQ-001, FI-RRQ-002,
FI-CG-003, and FI-CG-004 locally. Emulator success does not prove that composite
indexes are deployed or available in any production project.

## Validation, risk, rollback, and state

The YAML parses through the installed `yaml` package and retains one manual
workflow/job. Residual risks are runner/tool download failure, timeout,
Emulator/index behavior differences, and genuine runtime assertion failure.
Any failure blocks the gate; it does not authorize automatic Rules, index,
repository, or test changes.

Rollback is a separately reviewed revert of the CI and documentary commits.
Do not modify Rules, indexes, tests, or product code as rollback.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed
SaaS-03A.3R-B = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_manual_push_and_workflow
```

The owner must push the new HEAD, start a new manual workflow instance on
`main`, and provide its non-sensitive evidence. Re-running an older job is not
valid.

## FIX1 runtime correction

The first hosted RegistrationRequest runtime reached the gate but finished
`43 / 52`. FIX1 resolved four root causes covering nine IDs without changing
Rules or indexes. The reconciled breakdown is now `34 SUCCESS`,
`14 RULES_DENY`, `4 CONTRACT_ERROR`, and `0 NOT_FOUND`; total metadata remains
`34 ALLOW / 18 DENY`. The workflow change is limited to those two declarative
outcome labels. A new owner-triggered workflow run is required; local `52 / 52`
success is not hosted CI evidence.

```text
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_corrected_runtime_evidence
```

## Corrected hosted workflow result

The owner confirmed the newly dispatched corrected `main` workflow completed
successfully: canonical Rules `201 / 201`, RegistrationRequest `52 / 52`, and
zero failures. B1 and FIX1 are closed; B2 records the final evidence without
changing the workflow.

```text
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
SaaS-03A.4 = ready_not_started
```
