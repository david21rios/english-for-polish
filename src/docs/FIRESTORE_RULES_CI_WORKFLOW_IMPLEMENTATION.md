# SaaS-02C.2G-B2.4B — Static CI workflow implementation

## Purpose and prior state

B2.4A proved that runtime validation can be isolated in CI without local Java,
Firebase credentials, login, real-project access or deployment. B2.4B
implements that design statically. Runtime execution remains reserved for
B2.4C after owner review, manual commit and manual push.

## Sources and official verification

The approved strategy and B2 test/security documents, repository Firebase
configuration, lockfile, Rules and complete test tree were reviewed. Current
official sources verified:

- GitHub `actions/checkout@v6` and `actions/setup-node@v6` documentation;
- GitHub `actions/setup-java@v5`, including Temurin and explicit Java versions;
- GitHub-hosted `ubuntu-24.04` runner availability;
- Firebase Emulator Suite guidance that `emulators:exec` is appropriate for CI,
  the Firestore Emulator is Java-based, JDK 11+ is supported and Java 21 is the
  forward-compatible choice.

No third-party action is used.

## Files and workflow

Created:

- `.github/workflows/firestore-rules-runtime.yml`;
- `scripts/ci/validate-firestore-rules-ci.mjs`;
- this implementation report.

`package.json` adds only `test:rules:firestore` and
`ci:validate:firestore-rules`. The lockfile is unchanged.

The workflow is named **Firestore Rules Runtime Validation**. It has only
`workflow_dispatch`, one job, `contents: read`, no write/OIDC permission,
`ubuntu-24.04`, a 20-minute timeout and concurrency that does not cancel an
active run. It uses only official `checkout@v6`, `setup-node@v6` and
`setup-java@v5`. Checkout credential persistence and setup-node package cache
are disabled. Node is pinned to 24.15.0 and Eclipse Temurin Java to 21.

Steps are checkout, Node setup, Java setup, non-sensitive version display,
`npm ci`, local firebase-tools version display, security preflight, then the
canonical Firestore runtime command. No artifact upload is configured; initial
job logs are sufficient.

## Firestore-only command

`npm run test:rules:firestore` uses the lockfile-installed Firebase CLI with
`emulators:exec --only firestore --project demo-polish-learning`. It explicitly
lists exactly:

1. `messagesCreate.test.mjs`;
2. `forumPostCreate.test.mjs`;
3. `forumReplyCreate.test.mjs`;
4. `forumReportCreate.test.mjs`;
5. `supportTicketCreate.test.mjs`;
6. `selectiveHardeningRegression.test.mjs`;
7. `saasRegression.test.mjs`.

The command contains 201 unique Test IDs, 82 expected ALLOW and 119 expected
DENY. It excludes the broad glob and `denyAllBaseline.test.mjs`; therefore it
does not start Auth or Storage Emulator and does not execute the Emulator UI.
The historical `test:rules` command and Storage baseline remain unchanged.

## Security preflight

The read-only ESM preflight validates:

- `.firebaserc` contains only the fixed demo project;
- the canonical script uses `emulators:exec`, Firestore only and the demo ID;
- all seven files exist and are explicitly selected;
- 201 unique IDs and metadata totals 82/119;
- no broad glob or Storage baseline appears;
- only manual trigger, `contents: read`, explicit runner/timeout/Node/Java;
- `npm ci`, preflight and canonical runtime step exist;
- no secrets, variables, environment deployment target, OIDC/write permission,
  login, deployment, remote-project or cloud command appears;
- Storage Rules remain deny-all and Firestore Rules exist.

It does not execute Firebase, Java, emulators or tests, access a network or
modify files. `node --check` and local preflight execution both pass.

## Static validation and limitations

The workflow parses using the already installed `yaml` module. Structural
review confirms one workflow, one job, one manual trigger, explicit versions,
minimum permission, timeout, no cache, no secret, no artifact and no forbidden
command. GitHub Actions itself was not executed, so runner provisioning,
emulator download, Rules compilation and runtime expectations remain unproven
until B2.4C.

Standard output will show Node, npm, Java and local firebase-tools versions,
the demo project label, preflight result and Node Test Runner result. It does
not intentionally print Rules, fixtures, documents, emails, credentials,
tokens or environment dumps.

## Rollback

If review rejects the implementation, remove only the workflow and preflight,
remove the two package scripts and revert these documentary status additions.
Do not alter Rules, tests, lockfile or application code. If runtime later
fails, classify it and authorize a separate correction; never change Rules or
expectations automatically.

## Result and next phase

```text
Canonical tests = 201
Canonical ALLOW = 82
Canonical DENY = 119
B2.4B = completed_pending_human_workflow_review
B2.4C = next, not started
```

The GitHub Actions workflow was implemented statically.

It is manually triggered through workflow_dispatch.

It uses an isolated GitHub-hosted runner, the fixed demo project
demo-polish-learning, Firestore Emulator only, no Firebase login, no Firebase
credentials, no GitHub secrets and no deployment command.

The workflow was not executed during SaaS-02C.2G-B2.4B.

Runtime execution remains reserved for SaaS-02C.2G-B2.4C after owner review,
manual commit and manual push. Deployment remains prohibited.

## B2.4C-A precommit audit

The precommit audit is recorded in
`FIRESTORE_RULES_CI_PRECOMMIT_AUDIT.md`. The workflow, npm boundary and
preflight passed their static review, but ignored local files `.env.local` and
`firebase-debug.log` trigger the explicit sensitive-file gate. Their contents
were not inspected. `Precommit audit =
incomplete_requires_sensitive_file_owner_review`; no technical file changed,
and commit, push and workflow execution remain prohibited pending owner action
and a repeat audit.

## B2.4C-A1 reconciliation

The metadata-only follow-up proved both local files are ignored, untracked,
unstaged, diff-absent and unused by CI. Their contents were not inspected.
`Local ignored file reconciliation =
completed_pending_human_precommit_closure`. The technical workflow remains
unchanged; commit, push and execution remain manual and pending.

## B2.4C-B1 local commit status

The authorized thematic local commits were created and recorded in
`FIRESTORE_RULES_CI_COMMIT_EXECUTION.md`. `Local commits = completed`; push and
workflow execution remain pending owner action. No runtime or deployment was
performed.

## B2.4C-B2 execution evidence

```text
Manual workflow execution = reported_by_owner_evidence_missing
Executed SHA = UNKNOWN
Runtime result = NOT VERIFIED
Canonical contract = 201 / 82 / 119
```

The result and missing fields are documented in
`FIRESTORE_RULES_RUNTIME_EXECUTION_RESULT.md`. No URL or runtime result was
invented.

## First runtime failure and harness fix

The manual run at commit
`1e07ac1a43b3b3950360129fe52f9c342e8054b1` failed 201/201 before Rule
assertions because the shared test environment requested Storage while the
workflow correctly started Firestore only. The workflow itself remains
unchanged. B2.4C-B2F1 removes only the Storage configuration from the shared
harness; corrected runtime execution is pending.

The isolated helper correction is recorded by local commit `ada8931`. The
workflow and preflight remain byte-identical. Push and corrected manual
execution remain owner actions.
