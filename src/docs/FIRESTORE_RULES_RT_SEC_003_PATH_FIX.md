# RT-SEC-003 fixture path correction

## Purpose and runtime antecedent

This document records SaaS-02C.2G-B2.4C-B2F4. The second manually triggered
Firestore Rules runtime run used `demo-polish-learning`, started only the
Firestore Emulator and reached the canonical suite: 200 of 201 tests passed.
The sole failure was `RT-SEC-003 [DENY]` before a Rule assertion could run.

```text
Second runtime = 200 passed, 1 failed
Exit code = 1
Failure classification = TEST_FIXTURE_PATH_FAILURE
Rules failures confirmed = 0
Rules correctness = not yet fully approved because one assertion did not execute
```

The `PERMISSION_DENIED` messages associated with successful DENY cases are
expected results, not additional failures.

## Root cause

At `tests/rules/selectiveHardeningRegression.test.mjs`, the `RT-SEC-003` case
supplied `legacy/memberships/sec-003`. The shared runner calls
`doc(database, ...item.path.split("/"))`. The former path split into three
segments: `legacy | memberships | sec-003`.

A Firestore document reference requires an even number of alternating
collection/document segments. The SDK therefore raised `Invalid document
reference` before `setDoc`, `assertFails`, or Firestore Rules evaluation.
The case uses the common authenticated forum-user context and needs no special
seed beyond the existing shared legacy-user seed.

## Minimal correction

Only the path literal was changed:

```text
Before: legacy/memberships/sec-003
After:  legacy/root/memberships/sec-003
```

The corrected path has four segments:
`legacy | root | memberships | sec-003`. It is a valid document reference,
contains a `memberships` collection and remains outside the canonical SaaS
path `tenants/{tenantId}/memberships/{membershipId}`. No legacy match grants a
create at this path. The recursive match
`/{path=**}/memberships/{membershipId}` explicitly denies create, update and
delete, and the final catch-all denies otherwise unmatched writes. The create
therefore remains expected DENY and continues to test recursive-match
permission-union isolation.

## Preserved invariants

- Test ID `RT-SEC-003`, title, authenticated actor and payload are unchanged.
- Expected metadata is `DENY`; the assertion remains `assertFails`.
- Operation remains `setDoc` create.
- Canonical files/IDs/expectations remain 7 / 201 / 82 ALLOW / 119 DENY.
- Other tests, helpers, fixtures, Rules, indexes and functional code are unchanged.
- `storage.rules` remains deny-all; Storage and Auth emulators were not introduced.

A static enumeration of every literal `path` consumed by `doc()` in the file
found only the former RT-SEC-003 value with an odd segment count. After the
change, all twelve document paths have even segment counts.

## Validation, risk and rollback

The authorized validation set is `node --check`, CI preflight, application
build, normal tests and `git diff --check`. Local Rules runtime is unavailable
because Java is not installed; nothing was installed and no emulator started.

The corrected assertion still requires an owner-triggered GitHub Actions run.
If it does not exercise the intended isolation, restore only this path literal
in a separately authorized phase; do not change Rules or expectations.

## Result and next step

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_final_corrected_runtime
SaaS-02C.2G-B2.4C-B2 = incomplete_pending_final_runtime
SaaS-02C.2G-B2.4C-B2F3 = incomplete_200_passed_1_fixture_failed
SaaS-02C.2G-B2.4C-B2F4 = completed
SaaS-02C.2G-B2.4C-B2F5 = completed_pending_human_push
SaaS-02C.2G-B2.5 = blocked
```

`FIRESTORE_RULES_CORRECTED_RUNTIME_EXECUTION_RESULT.md` was not present in the
worktree and was not created because this phase authorizes creation only of
this corrective document. The second-run evidence is preserved here and in
the existing historical runtime document.

No commit, push, workflow rerun, Firebase remote access or deployment was
performed during B2F4. The correction was subsequently committed locally as
`3c34e9e7960108bf6f9275e009a202b56171e095`; push and final runtime remain
owner actions. B2.5 was not started.
