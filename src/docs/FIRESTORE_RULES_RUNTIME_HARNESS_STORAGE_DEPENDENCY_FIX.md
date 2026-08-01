# Firestore-only runtime harness Storage dependency fix

## Background and authoritative evidence

The first real manual `workflow_dispatch` run of **Firestore Rules Runtime
Validation** used branch `main` and commit
`1e07ac1a43b3b3950360129fe52f9c342e8054b1`. Job
`validate-firestore-rules` failed after approximately 1m 9s with exit code 1.
The demo project and Firestore Emulator started successfully, and the seven
canonical files exposed 201 IDs, but all 201 cases failed before Rule
assertions with:

```text
The storage emulator is not running (according to Emulator hub).
```

This is `TEST_HARNESS_CONFIGURATION_FAILURE`. The run did not evaluate Rules
correctness.

## Root cause

All seven canonical files call `createRulesTestEnvironment()` from
`tests/rules/helpers/rulesTestEnvironment.mjs` in a suite-level `before`
hook. The previous block at lines 9–19 loaded both `firestore.rules` and
`storage.rules`, then passed both services to `initializeTestEnvironment()`:

```js
const [firestoreRules, storageRules] = await Promise.all([
  readProjectFile("firestore.rules"),
  readProjectFile("storage.rules"),
]);

return initializeTestEnvironment({
  projectId: RULES_TEST_PROJECT_ID,
  firestore: { rules: firestoreRules },
  storage: { rules: storageRules },
});
```

The `storage` property made `@firebase/rules-unit-testing` resolve Storage
through the Emulator Hub. The runtime intentionally starts only Firestore, so
the environment setup rejected before any test body. Node associated the
failed suite setup with every declared case, producing 201 infrastructure
failures instead of Rule assertion results. `firebase.json` declares the
repository's Storage Rules file, but it did not cause this request: the direct
`storage` property in the helper did.

## Minimal correction

Only the shared helper changed. It now loads only Firestore Rules:

```js
const firestoreRules = await readProjectFile("firestore.rules");

return initializeTestEnvironment({
  projectId: RULES_TEST_PROJECT_ID,
  firestore: { rules: firestoreRules },
});
```

No `storage` property, Storage Rules load, Storage context, Storage host/port
or fictitious connection remains. The Firestore host/port continues to be
resolved from the Firestore-only `emulators:exec` environment. No individual
test, fixture, expectation or ID changed.

## Preserved invariants and impact

- project remains `demo-polish-learning`;
- command remains `--only firestore` with the same seven explicit files;
- 201 IDs, 82 ALLOW and 119 DENY remain canonical;
- Storage and Auth emulators remain absent;
- `storage.rules` remains deny-all and byte-identical;
- `firestore.rules`, indexes, functional code and Domain 1.2.0 are unchanged;
- no Firebase remote access, login or deployment occurs.

The correction removes a test-infrastructure dependency only. It makes no
claim that Rule assertions pass until the corrected runtime is executed in a
separately authorized phase.

## Validation, risk and rollback

The modified helper passes `node --check`; the CI preflight confirms the
201/82/119 contract, and build, normal tests and `git diff --check` pass.
Local runtime may run only when existing local Java and Firebase CLI are
available; nothing may be installed.

Residual risk is limited to the unexecuted corrected runtime. Rollback, if
human review rejects the fix, restores only the prior helper block. It must not
start Storage or change Storage Rules.

## Status and next step

```text
First runtime execution = failed_before_rule_assertion_due_to_test_harness_storage_dependency
Rules correctness = not evaluated by first runtime execution
Storage scope = unchanged, deny-all, emulator not required
SaaS-02C.2G-B2.4C-B2F1 = completed
SaaS-02C.2G-B2.4C-B2F2 = completed_pending_human_push
```

The approved technical correction was committed locally as `ada8931`. The
next step is owner review and manual push followed by a separately authorized
corrected runtime execution. No push or workflow rerun was performed here.
