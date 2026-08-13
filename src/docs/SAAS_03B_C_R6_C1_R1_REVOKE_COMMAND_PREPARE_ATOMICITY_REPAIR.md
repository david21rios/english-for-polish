# SaaS-03B-C-R6-C1-R1 — Revoke Command Prepare Atomicity Repair

## Result

The confirmed `REVOKE_COMMAND_PREPARE_ATOMICITY_BROKEN` implementation defect is repaired. A new Revoke command can no longer be committed as an orphan `pending/not_started` record before target lifecycle, Registry, last-admin and ownership checks succeed.

## Root cause and correction

R6 used `commandClaim()` to create a pending command in a transaction separate from Store prepare. A later lifecycle, contention or last-admin rejection therefore left a command without the matching Authority, Registry and prepare audit checkpoint.

Revoke now performs only read-only inspection for existing commands. New commands use the narrow `prepareRevokePlatformAdmin` Store primitive. One transaction reads and validates Command absence, schema-v2 Authority, Registry, exact Revoke command binding, active/null lifecycle and `activeCount > 1`; only then does it atomically create the command directly as `running/prepared`, transition Authority to `revoking/currentCommandId`, decrement and revise Registry, and write the deterministic Critical prepare audit. Auth remains outside the callback. There is no compensating delete, generic flag or takeover path.

Existing succeeded commands still replay before revoked-target rejection. Running/recovery-required same-owner commands resume through the existing narrow paths without command creation or second decrement.

## Zero-write and concurrency evidence

Unit characterization proves command, Authority, Registry, audit and Auth remain unchanged for activeCount 0/1 and new targets in provisioning, revoking, revoked or incompatible recovery-required lifecycle. Malformed/missing persistence and foreign ownership remain fail-closed through the same validated transaction boundary.

Real Firestore Emulator assertions prove:

- last-admin rejection leaves no command or audit and preserves Authority/Registry;
- same-target contenders produce exactly one command owner and no loser command;
- last-two-admin contenders produce exactly one command, leave the loser Authority active/null and finish with `activeCount = 1`;
- committed retries preserve one decrement, revision and prepare audit.

## Regression evidence

- Functions: 65/65, strict TypeScript/check/build, TS7016 0, lint 0/0 and ESM smoke PASS.
- Clean isolated Functions `npm ci`, check, build, 65 tests, lint and ESM PASS.
- Firestore Emulator: Store 11/11, Bootstrap 3/3, Recover 3/3 and Revoke 4/4; combined 21/21 PASS on Temurin 21.0.12 and Emulator 1.21.0.
- Package 0.11.0 remains unchanged and passes 40/40 with declarations, runtime imports, purity and cycles intact.
- Shared 51/51; repository suites 360/360; four prechecks retain 111/42/69, 114/32/82, 81/44/37 and 52/34/18; Rules preflight 222/88/134; general tests 35/35; production build PASS.
- Global lint remains the legacy 13 errors/8 warnings with attributable delta zero. Root audit remains 25 findings (3 low, 9 moderate, 13 high); Functions remains 7 moderate.
- Protected hashes are unchanged; emulator cleanup leaves zero Java processes. No Firebase remote operation or deploy occurred.

## Risk, rollback and next step

Residual risk is the required independent revalidation. Rollback is the local technical commit; no remote or migrated state exists. After human review and push, rerun only `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`.

State: `SaaS-03B-C-R6-C1-R1 = completed_pending_human_review_and_push`, `SaaS-03B-C-R6-C1 = blocked_pending_R1_human_review_push_and_revalidation`, and `RevokePlatformAdmin = repaired_pending_independent_revalidation`.
