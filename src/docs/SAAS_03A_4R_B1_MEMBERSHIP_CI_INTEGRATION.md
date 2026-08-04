# SaaS-03A.4R-B1 — Membership runtime CI integration

## Purpose and scope

This microphase integrates the prepared MembershipRepository runtime suite into the existing manual `Firestore Rules Runtime Validation` workflow. It adds a deterministic static precheck and a third, independent Firestore-only runtime gate. It does not execute the workflow, Emulator, deployment, or any remote Firebase operation.

## Sources and audited workflow

The workflow, existing validation scripts, Rules and RegistrationRequest runtime suites, Membership runtime suite, Firebase configuration, repository contracts, index materialization record, and CI strategy documents were reviewed. The workflow remains manual (`workflow_dispatch`) on `ubuntu-24.04`, with Node `24.15.0`, Temurin Java 21, and project-local `firebase-tools` `15.24.0`.

Security controls remain unchanged: `permissions: contents: read`, checkout `persist-credentials: false`, demo project only, no secrets, credentials, OIDC, artifacts, login, deploy, Storage Emulator, Auth Emulator, or production project access. The job retains its 20-minute timeout.

## Preserved gates and separated contracts

The pre-existing gates are semantically unchanged:

- Firestore Rules static contract: 201 total, 82 ALLOW, 119 DENY.
- Firestore Rules runtime: the existing `npm run test:rules:firestore` gate.
- RegistrationRequest static contract: 52 total, 34 ALLOW, 18 DENY; outcomes 34 SUCCESS, 14 RULES_DENY, 4 CONTRACT_ERROR, 0 NOT_FOUND.
- RegistrationRequest runtime: the explicit `registrationRequestRepository.runtime.test.mjs` file.

Membership is reported independently:

- 81 total Test IDs;
- 44 ALLOW and 37 DENY;
- 44 SUCCESS, 26 RULES_DENY, 11 CONTRACT_ERROR, and 0 NOT_FOUND.

## Membership static precheck

`scripts/validate-membership-runtime-tests.mjs` is a read-only ESM validator with no network or Firebase dependency. It checks the three explicit runtime files, unique `RT-MEM-REP-*` and `RT-MEM-SEC-*` IDs, metadata/outcome consistency, expected counts, self-controls, demo project use, Firestore-only configuration, and absence of Storage, global Firebase, absolute paths, Buffer, credentials, deploy commands, and globs. Any divergence exits non-zero.

Expected output:

```text
Membership runtime tests: 81
ALLOW: 44
DENY: 37
SUCCESS: 44
RULES_DENY: 26
CONTRACT_ERROR: 11
NOT_FOUND: 0
```

## Final workflow order

1. Checkout.
2. Setup Node.
3. Setup Java.
4. Print tool versions.
5. `npm ci`.
6. Print Firebase CLI version.
7. Rules static preflight.
8. Expected Rules and repository contracts.
9. RegistrationRequest static precheck.
10. Membership static precheck.
11. Rules runtime.
12. RegistrationRequest runtime.
13. Membership runtime.

The Membership command is explicit and contains no glob:

```bash
./node_modules/.bin/firebase emulators:exec --only firestore --project demo-polish-learning "node --test tests/integration/saas/membership/membershipRepository.runtime.test.mjs"
```

Three independent sequential `emulators:exec` sessions preserve isolated logs, counts and cleanup. Normal step failure stops the job, so Membership only starts after the preceding gates pass. Twenty minutes remains proportionate because the workflow performs no application build and the added work is one static Node check plus one additional local Firestore startup and bounded 81-case suite.

## Local indexes and limitations

`firebase.json` continues to reference `firestore.indexes.json`. The Membership suite traces FI-MEM-005 through FI-MEM-008 and FI-CG-001, FI-CG-002, FI-CG-006 and FI-CG-007. Emulator success will validate the local query forms only; it will not demonstrate production deployment or remote availability of those indexes. No index or Rule was changed or deployed here.

## Rollback

Rollback removes only the Membership static-precheck step, Membership runtime step, and `validate-membership-runtime-tests.mjs`, then restores the prior workflow hash and revalidates YAML. The Rules and RegistrationRequest gates, tests, scripts and counts must remain intact. This rollback is documented but not executed.

## Validation, risks, and closure

Static validation covers script syntax/execution, ESLint, runtime-file syntax, Membership unit tests, general tests, build, Rules preflight, RegistrationRequest precheck, YAML structure, diff whitespace, and repository status. The runtime and workflow are deliberately not executed in this microphase.

Residual risks are limited to evidence not yet produced: the third Emulator session has not run in GitHub Actions, local Emulator query success will not prove productive index deployment, and the 20-minute timeout must be observed on the first three-gate run.

Current state:

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed
SaaS-03A.4R-B = in_progress
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-C1 = completed_pending_human_push
SaaS-03A.4R-B2 = blocked_pending_manual_push_and_workflow
MembershipRepository = implemented_shadow
```

The next phase is SaaS-03A.4R-B2, Membership runtime execution and closure. It was not started. The owner must first push the two B1 commits, create a new manual workflow run on `main`, and return the complete Rules, RegistrationRequest and Membership evidence.
