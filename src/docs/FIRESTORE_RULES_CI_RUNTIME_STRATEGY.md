# SaaS-02C.2G-B2.4A — CI runtime strategy for Firestore Rules

## Purpose and decision

This phase evaluates, without creating a workflow, whether the 201 statically
implemented Firestore Rules cases can run in an isolated CI runner. The owner
does not authorize local Java, Firebase login, credentials, remote Firebase
project access or deployment.

```text
CI_RUNTIME_STRATEGY = FEASIBLE
Recommended runtime environment = GitHub Actions isolated runner
CI_NO_CREDENTIALS = true
CI_DEPLOYMENT_CAPABILITY = absent
Runtime validation = pending
```

Feasibility is conditional on B2.4B implementing the Firestore-only command
boundary below. No workflow, script, configuration or technical file changed.

## Sources and current state

The complete B2 test design, implementation, expectation reconciliation,
consumer closure, Rules design, security gate, shadow baseline, B2 scope,
hardening plan and implementation order were reviewed with `firebase.json`,
`.firebaserc`, `package.json`, its lockfile, both Rules files, the complete
`tests/rules` tree, `.gitignore` and `README.md`. `.github/` is absent.

The canonical static suite contains 201 unique Firestore cases: 82 expected
ALLOW and 119 expected DENY. Runtime execution remains pending.

## Toolchain inventory

| Item | Evidence |
|---|---|
| local Node detected | 24.15.0 |
| local npm detected | 11.12.1 |
| firebase-tools | exact lockfile version 15.24.0; installed engine accepts Node 20, 22 or 24+ |
| Rules Unit Testing | exact 4.0.1; Node >=18; Firebase peer ^11 |
| Firebase Web SDK | exact lockfile version 11.10.0 |
| package manager | npm with lockfile; future CI uses `npm ci` |
| project ID | `demo-polish-learning` in script, `.firebaserc` and test helper |
| ports | Auth 9099; Firestore 8080; Storage 9199; UI 4000 |
| configured emulators | Auth, Firestore, Storage and UI; single-project mode |

No production project ID, project number, Hosting/Functions target, bucket,
token, service account or credential appears in `.firebaserc` or the harness.
The Rules tests do not import `src/firebase.js`.

## Current scripts and sufficiency

| Script | Current behavior | Assessment |
|---|---|---|
| `firebase:version` | invokes the lockfile Firebase CLI version command | informational only |
| `emulators:start` | starts Auth, Firestore and Storage for the demo project | broader than required |
| `test:rules` | executes Firestore + Storage emulators for the demo ID and all root Rules tests | lifecycle and failure propagation are suitable, but scope is not yet Firestore-only |

The current glob discovers `denyAllBaseline.test.mjs`, which imports
`firebase/storage` and exercises four Storage denials. The shared environment
loads both Rules files and initializes both services. Thus the current command
requires Firestore and Storage even though the 201 new cases use only
Firestore.

```text
SUFFICIENCY_CURRENT_TEST_RULES = REQUIRES_B2_4B_CHANGE
```

B2.4B must preserve one canonical `npm run test:rules` command while making it
run exactly the 201 Firestore cases through a Firestore-only environment and
explicit test selection. The Storage baseline remains unchanged and excluded,
not deleted. Storage execution needs separate authorization.

## Minimum emulator topology

- Firestore Emulator: required.
- Auth Emulator: unnecessary; `authenticatedContext()` supplies synthetic
  Rules tokens without calling Authentication APIs.
- Storage Emulator: unnecessary and outside this Firestore gate.
- Emulator UI: unnecessary in headless CI.

Firestore requires Java in the ephemeral runner only. No local Java is needed.

## Demo isolation and zero credentials

CLI `--project`, Rules Unit Testing and preflight validation must all use
`demo-polish-learning`. The future workflow needs no Firebase token, service
account, GitHub secret, Firebase login or real-project access. It must not
define `FIREBASE_TOKEN`, `GOOGLE_APPLICATION_CREDENTIALS` or workload identity.
Package and emulator-binary downloads are toolchain acquisition, not Firebase
project access, and must remain credential-free.

A future preflight must fail unless every project ID is the demo ID, and fail
if executable workflow/script content contains deploy, login, `use --add`,
`projects:list`, service-account, token, credential or `gcloud` capabilities.
It should use token-aware allowlists so documentation text is not mistaken for
an executable command.

## Recommended future workflow

| Concern | Recommendation |
|---|---|
| name | Firestore Rules runtime validation |
| initial trigger | manual `workflow_dispatch` only |
| permissions | `contents: read`; no write or OIDC permission |
| concurrency | one run per ref; cancel superseded validation |
| runner | pinned Ubuntu 24.04 hosted runner |
| timeout | 20 minutes |
| Node | pin 24.15.0, matching the audited environment and CLI engine |
| Java | Eclipse Temurin 21 LTS candidate; exact current emulator support must be verified in B2.4B |
| dependencies | `npm ci`; no update, audit-fix or global CLI install |
| cache | disabled for the first controlled execution |
| checks | demo-ID/dangerous-command preflight and optional 201/82/119 static check |
| runtime | corrected canonical `npm run test:rules` only |
| artifacts | concise non-sensitive result only if needed |

The current major versions of official Node/Java setup actions and the exact
supported Java level are temporally variable and are marked
`REQUIRES_CURRENT_DOCUMENTATION_VERIFICATION` before YAML is authored. This
does not block the architecture. After a successful manual run and human
review, a separate decision may add pull-request execution. Push automation is
not approved. This workflow must never deploy.

## Threat matrix

| Risk | Vector | Impact | Control | State |
|---|---|---|---|---|
| remote Firebase access | accidental credential | Critical | no secrets/accounts; demo assertion | Controlled by design; implementation pending |
| accidental deployment | forbidden command | Critical | command allowlist and preflight | Controlled by design; implementation pending |
| wrong project | remote alias/override | Critical | fixed demo ID at every layer | Current evidence controlled; preflight pending |
| secret exposure | logs/environment | Critical | no secrets; sanitized evidence | Controlled by design |
| Storage expansion | current broad glob | High | Firestore-only helper and explicit files | Pending B2.4B |
| dependency compromise | mutable install | High | `npm ci`, lockfile, pinned runtime | Controlled by design |
| incompatible Java | changing requirement | High | explicit LTS plus current-doc gate | Pending verification |
| emulator hang | orphan process | High | `emulators:exec` and timeout | Controlled by design |
| unstable tests | shared state | High | clear Firestore, synthetic fixtures, one job | Runtime evidence pending |
| CI/local drift | changing runtime | Medium | pin Node, Java, Ubuntu, lockfile | Controlled by design |
| weak diagnostics | incomplete logs | Medium | classified exit evidence | Pending B2.4C |
| download outage | registry/binary unavailable | Medium | toolchain failure classification | Residual |

## Alternative matrix

| Alternative | Status | Assessment |
|---|---|---|
| local Java | REJECTED_BY_OWNER | violates the explicit local boundary |
| remote Firebase | REJECTED_BY_OWNER | unnecessary credential/project risk |
| GitHub Actions demo emulators | RECOMMENDED | ephemeral, reproducible, zero credentials after B2.4B correction |
| another team manual run | NOT_SELECTED | coordination and evidence-chain risk; fallback only |
| indefinite postponement | NOT_RECOMMENDED | leaves runtime Rules behavior unverified |

## Evidence, failures and correction policy

B2.4C should record Node, npm, Java and CLI versions; demo ID; emulator/port;
201 executed IDs; 82 expected ALLOW; 119 expected DENY; pass/fail counts;
duration and exit code. It must exclude tokens, credentials, private URLs,
user data, database dumps and sensitive environment values.

Failures are `TOOLCHAIN_FAILURE`, `EMULATOR_START_FAILURE`,
`RULES_COMPILE_FAILURE`, `TEST_IMPORT_FAILURE`, `TEST_RUNTIME_FAILURE`,
`EXPECTATION_MISMATCH`, `TIMEOUT` or `CLEANUP_FAILURE`. Each blocks the runtime
gate pending human review. No failure authorizes automatic changes to Rules,
expectations, fixtures or contexts. A separate approved microphase must locate
the fault, apply one scoped correction and repeat runtime validation.

## Storage and Auth

Storage is outside the current SaaS scope and `storage.rules` remains deny-all.
The 201 Firestore tests do not use Storage. `uploadAudio` remains unrelated and
deferred under FLH-007. `STORAGE_EMULATOR_IN_CI = unnecessary`. Auth Emulator
is also unnecessary because authenticated Rules contexts are synthetic.

## Closure

```text
Canonical tests = 201
Canonical ALLOW = 82
Canonical DENY = 119
Static implementation = completed
Runtime validation = pending
CI_RUNTIME_STRATEGY = FEASIBLE
Next phase = SaaS-02C.2G-B2.4B workflow implementation
```

This phase evaluated a CI-based runtime validation strategy without installing
Java on the owner's computer.

No Firebase login, credential, secret, remote project access or deployment is
required for the proposed demo-project Emulator Suite execution.

No workflow was created during this design phase.

No Firestore Rule, test, consumer, index or Firebase configuration was
modified. Human approval is required before B2.4B.

## B2.4B implementation status

The approved workflow, Firestore-only package command and read-only security
preflight are documented in `FIRESTORE_RULES_CI_WORKFLOW_IMPLEMENTATION.md`.

```text
B2.4B implementation status = completed_pending_human_workflow_review
B2.4C = next, not started
```

The workflow was not executed.

## B2.4C-A precommit status

Static workflow implementation was audited and remains technically aligned
with this zero-credential, Firestore-only strategy. Runtime execution remains
pending. The next intervention is human review and safe handling of the
ignored local artifacts identified in
`FIRESTORE_RULES_CI_PRECOMMIT_AUDIT.md`, followed by a repeat precommit audit.
Codex did not commit, push or execute the workflow.

## B2.4C-B2 evidence review

The owner reported a manual push and workflow dispatch, but supplied no
completed runtime log or summary values. `Runtime strategy validation =
pending_runtime_evidence`; GitHub Actions runtime is not verified. See
`FIRESTORE_RULES_RUNTIME_EXECUTION_RESULT.md`.

## B2.4C-B2F1 harness correction

The first real run proved runner and Firestore startup but failed before Rule
assertions because the shared environment also declared Storage. The helper is
now Firestore-only; Storage remains deny-all and is not started. Corrected
runtime execution remains pending human review.

The Firestore-only harness correction is committed locally as `ada8931`.
Corrected workflow execution remains pending owner push and manual
`workflow_dispatch`.

## B2.4C-B2F4 fixture-path correction

The second Firestore-only run passed 200 of 201 cases. RT-SEC-003 alone failed
before assertion because its fixture path had three segments. The path is now
a valid four-segment legacy document path; 201 / 82 / 119 and the
Firestore-only, zero-credential strategy are unchanged. Final manual runtime
execution remains required and B2.5 remains blocked.

The B2F4 correction is committed locally as `3c34e9e`; final corrected runtime
remains pending owner push and a new manual workflow run. Do not rerun the
failed job against the old commit.

## RegistrationRequest repository runtime gate

SaaS-03A.3R-B1 preserves the canonical 201/82/119 Firestore Rules session and
adds a second sequential `emulators:exec --only firestore` session for the 52
RegistrationRequest repository cases. A read-only source precheck validates
34/18 metadata and the 34/13/4/1 outcome breakdown first. Both runtimes use the
demo project, remain credential-free, and are mandatory gates. No workflow run
or deployment occurred during integration.

## Membership repository runtime gate

SaaS-03A.4R-B1 preserves the Rules 201/82/119 gate and RegistrationRequest
52/34/18 gate, then adds a third sequential and independent
`emulators:exec --only firestore` session for the explicit 81-case Membership
runtime file. Its read-only precheck validates 44 ALLOW, 37 DENY and outcomes
44/26/11/0. All sessions use `demo-polish-learning`, separate logs and cleanup,
and natural fail-fast behavior. No runtime, deployment or remote access occurs
during integration.

## Course repository runtime gate

SaaS-03A.5R-B1 preserves the first three gates and adds a fourth independent
Firestore-only session for the explicit 114-case Course runtime file. Its
read-only precheck validates 32 ALLOW, 82 DENY and outcomes 32/56/26/0. All four
sessions remain sequential, fail-fast, demo-only and credential-free. No
runtime, deployment or remote access occurs during integration.

The first Enrollment execution later reconciled three assertion taxonomies and
one bounded admin-query classification. The gate remains 111 IDs, now 42 ALLOW,
69 DENY and outcomes 42/41/28/0; Rules and the other four gates are unchanged.

## Enrollment repository runtime gate

SaaS-03A.6R-B1 preserves the first four gates and adds a fifth sequential,
independent Firestore-only session for the explicit 111-case Enrollment runtime
file. Its read-only precheck validates 41 ALLOW, 70 DENY and outcomes
41/42/28/0. All sessions remain fail-fast, demo-only and credential-free. No
runtime, deployment or remote access occurs during integration.

## Definitive Enrollment gate result

The preceding block records the original B1 contract. After the first failed
Enrollment execution and F1 correction, a new manual run on published `main`
succeeded. The final Enrollment contract is 111 IDs, 42 ALLOW, 69 DENY and
outcomes 42/41/28/0; all 111 IDs and metadata passed. Rules 222/222 and the
RegistrationRequest, Membership and Course gates also passed. Five isolated
Firestore sessions remain the approved strategy.
