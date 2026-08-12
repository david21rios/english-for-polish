# SaaS-03B-B-C1-R2-R3 — Status-Specific Persisted Command Record Invariants Repair

## Trigger and root cause

The independent `SaaS-03B-B-C1-R2` revalidation found that the runtime persisted-command validator accepted a non-null `leaseExpiresAt` for every `COMMAND_STATUSES` value. R2-R2 validated the field independently as a nullable ISO timestamp but did not enforce its approved relationship with command status.

## Normative rule and repair

`SAAS_03B_A_R1_PRIVILEGED_BACKEND_BOOTSTRAP_CONTRACT_RESOLUTION.md` defines `leaseExpiresAt` as nullable and requires it to be null outside `running`; bounded saga leases exist only while running. The validator now preserves its existing exact-shape and field checks and additionally requires:

```text
running -> leaseExpiresAt = null or canonical ISO timestamp
pending -> leaseExpiresAt = null
succeeded -> leaseExpiresAt = null
failed_retryable -> leaseExpiresAt = null
failed_terminal -> leaseExpiresAt = null
recovery_required -> leaseExpiresAt = null
```

No additional relationships among completedAt, failedAt, result or errorCode were introduced because the current shared contracts and approved lifecycle sources do not specify further executable status-specific invariants.

## Scope

Only `functions/src/commands/commandRecord.ts` and its foundation test changed. Package 0.6.1, Domain, Shared, repositories, Rules, Firebase configuration, bootstrap and business commands remain unchanged. The validator still uses package-owned `COMMAND_STATUSES`; no parallel lifecycle enum was introduced.

## Tests and regression

The new matrix checks all six statuses with a null lease, accepts a canonical non-null lease only for running, and rejects it for the other five statuses with `CONTRACT_VIOLATION`.

```text
Functions tests = 22/22 PASS
Functions TypeScript build/check = PASS; TS7016 = 0; TS errors = 0
Functions lint = 0 errors / 0 warnings
Package tests = 28/28 PASS
Shared tests = 51/51 PASS
RegistrationRequest = 59/59 PASS
Membership = 23/23 PASS
Course = 51/51 PASS
Enrollment = 46/46 PASS
Enrollment precheck = 111; 42 ALLOW; 69 DENY; 42/41/28/0
Course precheck = 114; 32 ALLOW; 82 DENY; 32/56/26/0
Membership precheck = 81; 44 ALLOW; 37 DENY; 44/26/11/0
RegistrationRequest precheck = 52; 34 ALLOW; 18 DENY; 34/14/4/0
Rules preflight = 222; 88 ALLOW; 134 DENY; PASS
General tests = 35/35 PASS
Root build = PASS
Node checks = 32 PASS
Global lint = 13 errors / 8 warnings; unchanged legacy baseline; delta 0
git diff --check = PASS
```

Functions `npm audit` remains the recorded seven moderate findings in the Firebase/Google dependency chain. No dependency changed and no audit fix was run.

## Protected files

The protected SHA-256 values remain:

```text
firestore.rules = 32cc7937a5f6dacf1ba59a3c7465930262aad9ffb9a3f26e24a65a43b0b36178
firestore.indexes.json = f9c35524d282076604dcc01945fa78fa9eccd6c9e559bfaa2b0ae5517c8f1d16
storage.rules = 2bb6e20646b7b8df9d4f3e318b4f9d51c0294aa10b0f899a7d96a4be0c7dee8c
firebase.json = c1b42f78876dcd15862c81b8f3960b394d06bbdedcd9b9909f2580ff38e54c27
.firebaserc = 0c29fa16256836a65b869678bf92cc8cdbf440c0f2c601f655e73bc4133ce0aa
src/firebase.js = 917f615299596d67ae645d7c4f76d07c2a058064b8b58e6872a08f0b2c30f6c0
```

No Emulator, Firebase remote operation or deploy was executed.

## Risk and rollback

The repair is fail-closed and affects only malformed persisted records whose lease contradicts their status. Rollback restores the prior validator predicate and removes the status/lease matrix, then repeats all validations. No Firestore data migration is authorized or required by this microphase.

## State and next action

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R2-R3 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R3_human_review_push_and_revalidation
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
```

After human review and push, reexecute the independent complete `SaaS-03B-B-C1-R2` review. Do not start 03B-C.
