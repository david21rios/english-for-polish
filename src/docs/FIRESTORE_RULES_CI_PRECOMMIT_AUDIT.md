# Firestore Rules CI precommit audit

## Purpose and decision

SaaS-02C.2G-B2.4C-A audited the static GitHub Actions boundary, package
commands, preflight, canonical tests, demo-project isolation and complete
pending worktree before any commit or runtime execution. The technical CI
controls pass, but the phase is **INCOMPLETE** because ignored local files
`.env.local` and `firebase-debug.log` exist. Their contents were not read or
reported. The owner's explicit sensitive-file gate requires review and safe
handling before a repeat precommit audit.

No workflow, Rule, test, Firebase configuration, functional consumer or
lockfile was modified during this audit. No Firebase Emulator, Java runtime,
Firebase CLI runtime, GitHub Actions workflow, commit, push or deployment was
executed. The owner must resolve the local-file gate and authorize a repeat
audit before manually reviewing, committing, pushing or triggering
`workflow_dispatch`.

## Sources and method

The audit read the workflow, preflight, package and lock files, Firebase
configuration and Rules, all `tests/rules/`, `.gitignore`, `README.md`, the CI
strategy and implementation reports, test design/implementation/count
reconciliation, B2 scope, hardening plan and implementation order. It also
used `git status --short`, `git diff --stat`, `git diff --name-status`,
`git diff --check`, targeted diffs and the untracked-file inventory.

SHA-256 was calculated from bytes. Recursive manifests sort repository-relative
paths and hash `path|file-sha256` rows. Static validation used Node syntax
checking, the repository preflight and the already-installed `yaml` module.

## Workflow control matrix

| Control | Result | Evidence |
|---|---|---|
| Name | PASS | `Firestore Rules Runtime Validation` |
| Trigger | PASS | only `workflow_dispatch`; no push, PR or schedule |
| Permissions | PASS | top-level `contents: read`; no write or OIDC |
| Concurrency | PASS | explicit group; `cancel-in-progress: false` |
| Runtime bounds | PASS | `ubuntu-24.04`; timeout 20 minutes |
| Actions | PASS | `actions/checkout@v6`, `actions/setup-node@v6`, `actions/setup-java@v5` |
| Toolchains | PASS | Node `24.15.0`; Temurin Java `21` |
| Dependencies | PASS | `npm ci`; cache disabled |
| Security preflight | PASS | `npm run ci:validate:firestore-rules` |
| Runtime boundary | PASS | `npm run test:rules:firestore` |
| Credentials | PASS | no secrets, vars, environments, token, service account or OIDC |
| Remote actions | PASS | no login, deploy, gcloud or remote Firebase command |
| Emulators | PASS | Firestore only; no Auth, Storage or UI |
| Artifacts/logging | PASS | no upload; versions and non-sensitive status only |

YAML parsing produced one job, `validate-firestore-rules`, with the expected
runner, timeout and eight steps. No duplicate-key symptom was detected.

## Runtime script and preflight

`test:rules:firestore` invokes the local Firebase CLI through npm, uses
`emulators:exec --project demo-polish-learning --only firestore`, and names
exactly these seven files:

- `tests/rules/messagesCreate.test.mjs`
- `tests/rules/forumPostCreate.test.mjs`
- `tests/rules/forumReplyCreate.test.mjs`
- `tests/rules/forumReportCreate.test.mjs`
- `tests/rules/supportTicketCreate.test.mjs`
- `tests/rules/selectiveHardeningRegression.test.mjs`
- `tests/rules/saasRegression.test.mjs`

It contains no broad glob, Storage baseline, Auth/Storage emulator, login,
deploy or real project. The historical `test:rules` script remains present.
Only `test:rules:firestore` and `ci:validate:firestore-rules` were added to
`package.json`; dependencies, devDependencies and lockfile are unchanged.

The preflight is read-only and performs no process spawning, network access,
Firebase/Java execution or file mutation. It validates the demo alias,
Firestore-only command, exact test list, canonical 201/82/119 counts,
workflow trigger/permissions/toolchains, forbidden commands and credential
surfaces, Storage deny-all and non-empty Firestore Rules. It exits non-zero on
failure. `node --check` and the preflight both passed.

## Tests, project and no-Storage

Static extraction confirms 201 unique IDs, 82 ALLOW and 119 DENY, with no
missing expectation metadata. Metadata and assertion direction are compatible.
The seven files have no Storage operation, `src/firebase.js`, credential,
real-project or remote-access dependency. The only Firebase project identifier
in the audited CI/test boundary is `demo-polish-learning`.

`storage.rules` remains deny-all. Neither workflow nor runtime command starts
Storage or Auth, and the Storage baseline is excluded. `uploadAudio` remains a
deferred legacy dependency unrelated to these tests. No new Storage dependency
was added.

## Rules and Welcome review

`firestore.rules` retains the legacy zone, SaaS Identity self, Tenant read,
Membership and RegistrationRequest self reads, Course and Enrollment reads,
the five selective legacy create hardenings, and one final deny-all catch-all.
Its hash matches the approved value.

The only accumulated functional worktree change is `src/pages/Welcome.jsx`:
the existing trimmed name is checked at 2–100 characters, the corresponding
message and native input bounds are present, and the normalized value is used.
The messages collection, seven-field payload, anonymous constants,
authentication behavior, submission flow and styles were not otherwise
changed.

## Hash baseline

| Item | SHA-256 |
|---|---|
| Workflow | `7E69F56679FC87B98698CD7AD7268D2F06FEBFA3EF3DC1BB5E3E51263B78474D` |
| Preflight | `C66CB357F36AC3FA10C32A319397E03AE85519AC3E21FFCFD4D09F143D61278B` |
| package.json | `94B828FE8DE5B6D5042EBAEF5CD0C3A260A9A30AAF0895CFEF14A2E2C04365BB` |
| package-lock.json | `E905F89559D1248F00EA682CD8AFDCE90740ED4EFC750F836EB8872CDC5C5E0A` |
| firestore.rules | `DFDAB7A238CC274A66CF37C85ED15E88464551B948EBD9AF9832EF3FD83B1C45` |
| storage.rules | `2BB6E20646B7B8DF9D4F3E318B4F9D51C0294AA10B0F899A7D96A4BE0C7DEE8C` |
| tests/rules manifest | `0DECF1E1C0A8A245122B79A86656B261B28CC327E41BEB85EC90A33C4B232AFD` |
| .github manifest | `AE95F11F193640CC68CE07D61ACBFEB2D10033C31CC4F4051D7C77A9F9407822` |
| scripts/ci manifest | `40FD8EF0C46A75B922E9A4355F925A067F5DBDFD44922C69FE28587C1433C841` |
| src/domain manifest | `F15999554A7AD23D2E99A33F054381F7EAD3BA1C287DDCB0BF0A7BA6A07635C7` |

## Complete pending-worktree inventory

There are 16 tracked modifications and 57 untracked files (73 total). Commit
`2b9b4c0` is already committed after the requested historical reference
`33ae607`; its files are not part of this pending commit.

| Group | Pending files | Classification | Reason |
|---|---:|---|---|
| Firebase baseline/Rules | 1 | INCLUDE | `firestore.rules`; approved local composite Rules |
| Domain and authorization | 12 | INCLUDE | version/freeze, authorization/workflow docs and domain code |
| Persistence/access model | 9 | INCLUDE | physical, access, query, write and persistence documents |
| Rules/security/hardening docs | 32 | INCLUDE | traceable SaaS and legacy security phases |
| Rules tests | 14 | INCLUDE | fixtures, helpers and seven canonical suites |
| CI | 2 | INCLUDE | manual workflow and read-only preflight |
| npm configuration | 1 | INCLUDE | two approved scripts only |
| Welcome functional correction | 1 | INCLUDE | scoped 2–100 trimmed-name reconciliation |
| Implementation order | 1 | INCLUDE | accumulated phase state |
| Sensitive ignored artifacts | 2 | EXCLUDE / OWNER REVIEW | `.env.local`, `firebase-debug.log`; contents not inspected |

All 73 Git-visible pending files are attributable to the accumulated SaaS-02
work and no unexpected Git-visible file was found. The exact filename list is
the contemporaneous `git status --short` inventory and must be rechecked after
the sensitive-file gate is resolved. No pending file is approved for staging
by this incomplete audit.

`.gitignore` covers `.env`, `.env.*`, `*.local`, Firebase/firestore/UI debug
logs, `.firebase/`, `.firebase-emulator-data/`, `node_modules/` and `dist/`.
It does not explicitly cover `coverage/`; no coverage artifact is currently
present. No credential or service-account filename was Git-visible.

## Blocking finding

| Blocker | Location | Impact | Required action | Corrective phase |
|---|---|---|---|---|
| Sensitive/local artifacts exist | `.env.local`, `firebase-debug.log` | Explicit phase gate prevents precommit approval even though both are ignored | Owner reviews and safely removes or retains outside the commit according to local policy; do not disclose contents | repeat B2.4C-A after owner action |

## Commit strategy after a successful repeat audit

Several thematic commits are safer for 73 accumulated files: (1) domain and
persistence; (2) Rules and hardening; (3) tests and CI; (4) Welcome contract.
This improves review and rollback while preserving dependency order. If the
owner deliberately selects one consolidated commit, the proposed message is:

`feat(saas): add multi-tenant domain, Firestore security model and CI rules validation`

Before staging anything, the owner should run:

```text
git status --short
git diff --check
npm run ci:validate:firestore-rules
npm run build
npm test
```

Do not run the runtime command locally. After a successful repeat audit, use
explicit reviewed paths for `git add -- <paths>`, then:

```text
git diff --cached --check
git diff --cached --stat
git diff --cached
git commit -m "feat(saas): add multi-tenant domain, Firestore security model and CI rules validation"
git branch --show-current
git remote -v
git push <reviewed-remote> <reviewed-branch>
```

No destructive reset or clean is part of rollback. An optional backup branch
may be created before staging. After push, open GitHub Actions, select
**Firestore Rules Runtime Validation**, choose **Run workflow**, select the
reviewed branch, run it manually and inspect the logs.

Return only non-sensitive evidence: workflow status, commit SHA, branch,
Node/npm/Java/firebase-tools versions, preflight result, emulator startup,
Rules compilation, total/passed/failed tests, duration, exit code and failed
test IDs/names if any. Never return tokens, secrets or personal data.

## Result and next phase

Technical controls pass, but the explicit sensitive-file condition prevents
closure:

```text
SaaS-02C.2G-B2.4C-A = incomplete_requires_sensitive_file_owner_review
SaaS-02C.2G-B2.4C-B = blocked
SaaS-02C.2G-B2.5 = not started
```

No commit, push, workflow, emulator, Java, Firebase CLI runtime, login, remote
access or deployment was performed. B2.4C-B was not started.

## B2.4C-A1 local ignored-file reconciliation

The original finding above is preserved as historical evidence. The approved
metadata-only follow-up in
`FIRESTORE_RULES_LOCAL_IGNORED_FILES_RECONCILIATION.md` established that both
files are ignored, untracked, unstaged, absent from working/cached diffs and
untracked non-ignored inventory, and neither is referenced, read or uploaded
by CI.

```text
Sensitive local file review = resolved
Files sensitive in Git-visible scope = none
Local ignored files = .env.local, firebase-debug.log
Commit blocker = none
B2.4C-A = completed
```

Their contents were not inspected. `.env.local` remains local and ignored;
cleanup of `firebase-debug.log` is optional and owner-controlled.

## B2.4C-B1 controlled local commits

The owner-authorized thematic commit execution is recorded in
`FIRESTORE_RULES_CI_COMMIT_EXECUTION.md`.

```text
Local commits = completed
Push = pending owner action
Workflow execution = pending owner action
```

Only explicit reviewed paths were staged. No ignored local file was staged,
no push occurred and runtime remains pending.
