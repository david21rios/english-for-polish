# Firestore Rules runtime execution result

## Purpose and prior state

SaaS-02C.2G-B2.4C-B2 must audit evidence from the owner's manually triggered
GitHub Actions run of `Firestore Rules Runtime Validation`. The canonical
contract is seven Firestore-only files, 201 tests, 82 expected ALLOW cases and
119 expected DENY cases against `demo-polish-learning`.

## Evidence received

No runtime log or completed execution summary was supplied. The request
contains `[PEGAR AQUÍ ...]` and `[COMPLETAR]` placeholders for workflow status,
executed SHA, Node, npm, Java, firebase-tools, preflight, emulator startup,
Rules compilation, test totals, duration, exit code and failed IDs.

The owner's statements that push and workflow dispatch occurred are recorded,
but they do not establish the runtime result. No GitHub API, CLI, fetch, pull,
workflow rerun or Firebase access was used to fill the missing evidence.

## Locally verifiable state

```text
Local branch = main
Local HEAD = 1e07ac1a43b3b3950360129fe52f9c342e8054b1
Locally cached origin/main = fb1915c0604b8e48c1aefb009b56f285a3b47bf8
```

The cached remote-tracking reference was not refreshed and therefore cannot
prove or disprove the owner's stated push. Local technical hashes and
manifests match the approved baseline. Local preflight, build, normal tests and
`git diff --check` pass.

## Runtime fields not established

The supplied evidence does not establish:

- exact executed commit SHA or its equality with local HEAD;
- workflow/job status, trigger metadata, runner or timeout outcome;
- Node, npm, Java or firebase-tools versions;
- `npm ci` or CI preflight result in the actual run;
- demo project selection at runtime;
- Firestore Emulator startup, port, Rules compilation or clean shutdown;
- absence of Storage/Auth/UI emulators in the actual run;
- exact seven test files or exclusion of the Storage baseline;
- 201 executed/passed tests, 82 ALLOW, 119 DENY, zero failures or exit code 0;
- absence of credentials, login, remote access or deployment in run logs.

No individual test failure can be classified because no test output was
provided. The overall blocker is `INSUFFICIENT_RUNTIME_EVIDENCE`, not a Rules,
fixture or harness failure.

## Required owner evidence

Provide the complete non-sensitive GitHub Actions log or a complete summary
showing workflow status, branch, executed SHA, trigger, runner, tool versions,
`npm ci`, preflight, demo project, emulator startup/port/compilation/shutdown,
the seven invoked files, totals and exit code. Redact secrets if any; do not
provide tokens or personal data. The workflow must not be repeated
automatically by Codex.

## Security and no-Storage

Local configuration remains zero-credential, zero-deployment and
Firestore-only. `storage.rules` remains deny-all. Those static facts cannot be
promoted to claims about the actual run without its evidence.

## Decision

```text
Runtime evidence = missing
Failure classification = INSUFFICIENT_RUNTIME_EVIDENCE
SaaS-02C.2G-B2.4 = incomplete_runtime_evidence_missing
SaaS-02C.2G-B2.4C-B2 = incomplete_requires_runtime_evidence
SaaS-02C.2G-B2.5 = blocked
```

Firestore Rules runtime validation is not approved. No Rule, test, technical
configuration or functional code was modified, and no commit, push, workflow,
emulator, Firebase runtime or deployment was performed by Codex.

## First runtime evidence received after the initial review

The owner subsequently supplied sufficient root-failure evidence for the
first run: manual `workflow_dispatch`, `main`, commit
`1e07ac1a43b3b3950360129fe52f9c342e8054b1`, Firestore Emulator started,
seven canonical files and 201 IDs selected, 0 passed / 201 failed, exit code 1.
Every failure arose before Rule assertions because the shared harness required
an unavailable Storage Emulator.

```text
First runtime execution = failed_before_rule_assertion_due_to_test_harness_storage_dependency
Failure classification = TEST_HARNESS_CONFIGURATION_FAILURE
Rules correctness = not evaluated by first runtime execution
Storage scope = unchanged, deny-all, emulator not required
```

The minimal helper correction is documented in
`FIRESTORE_RULES_RUNTIME_HARNESS_STORAGE_DEPENDENCY_FIX.md`. Runtime validation
remains incomplete until the corrected harness is reviewed and executed.

## Corrective commit status

```text
Corrective technical commit = ada8931
Corrected workflow execution = pending human push and workflow_dispatch
Rules correctness = not yet evaluated
```

The failed first run remains authoritative history. No claim of passing Rules
is made by the harness commit.

## Second runtime and RT-SEC-003 fixture-path result

After the Firestore-only harness correction, the second owner-triggered run
selected all seven canonical files and 201 IDs: 200 passed and one failed with
exit code 1. Only `RT-SEC-003 [DENY]` failed. Its
`legacy/memberships/sec-003` reference had three segments, so the client SDK
rejected it before Rules evaluation.

```text
Second runtime = 200 passed, 1 test fixture path failure
Failure classification = TEST_FIXTURE_PATH_FAILURE
Rules failures confirmed = 0
Rules correctness = not yet fully approved because one assertion did not execute
```

B2F4 corrects the path to `legacy/root/memberships/sec-003`. See
`FIRESTORE_RULES_RT_SEC_003_PATH_FIX.md`. A final owner-triggered runtime run
remains required.

## B2F5 local commit status

The RT-SEC-003 fixture correction is committed locally as
`3c34e9e7960108bf6f9275e009a202b56171e095`. The first runtime remains a
Storage harness failure; the second remains 200 passed / 1 fixture-path
failure with zero confirmed Rules failures. Final corrected runtime is pending
owner push and a new manual `workflow_dispatch` run.
