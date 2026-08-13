# SaaS-03B-C-R5-C1-R1 — Recover Transition Owner Scope Validation Repair

## Result

The independently reported `RECOVER_TRANSITION_OWNER_FLAG_UNSCOPED` defect is
repaired. Before this repair, generic Store mutation exposed
`retainTransitionOwner`; because Authority schema v2 accepts `active` with a
valid owner, any package-owned command could request an active owner through a
lookalike transition.

## API closure

`retainTransitionOwner` was removed from `PlatformAuthorityTransition` and
from generic owner calculation. `mutate()` now derives ownership solely from
the canonical transitional statuses and rejects unknown transition keys at
runtime, including cast/lookalike inputs. Its active transition therefore
always clears ownership.

`claimActiveRecoveryOwnership` remains the sole route for
`active/null -> active/RecoverCommandId`. It validates exact command schema and
type, pending/not_started claim state, Authority v2 active/null, Registry,
payload hash and correlation; same-owner running/recovery-required prepared is
read-only and foreign owner conflicts.

The active failure checkpoint now uses the narrow
`markActiveRecoveryRequired` primitive. It accepts only a bound Recover command
in running/prepared with the target Authority active and owned by that command,
then atomically persists command/Registry recovery-required plus Critical
audit. Same-owner repetition is read-only. No Authority rewrite or count delta
occurs.

## Negative matrix and evidence

- Generic Bootstrap, Revoke and every current package command type with the
  retired flag are rejected before writes.
- Wrong Recover status/stage, non-active target, foreign owner, missing or
  malformed persistence fail closed.
- Store unit tests are 12/12 within the 56/56 Functions suite. Recover is 7/7.
- Firestore Emulator: Store 10/10, Bootstrap 3/3 and Recover 3/3. Evidence
  covers one-winner active claims and handoffs, same-owner no-op, generic
  Bootstrap/Revoke bypass rejection, last-two-admin, real callback retry,
  exactly-once count/revision/audit and server timestamps.
- Functions clean install/check/build/tests/lint and ESM smoke pass; TS7016 and
  TypeScript errors are zero; strict/noImplicitAny remain enabled.
- Package 0.11.0 remains unchanged and passes 40/40, runtime imports 8/8,
  strict declarations, purity and cycle checks. Shared and repository unit
  suites pass 51/51 and 59/23/51/46. The four prechecks and Rules 222/88/134
  remain exact. General 35/35 and root production build pass.
- Root audit remains 25 (3 low, 9 moderate, 13 high); Functions remains 7
  moderate. No dependency update was made.

## Lint reconciliation

The apparent R5 shift from 13 to 16 errors was generated-output contamination:
after a Functions build, root ESLint also scanned `functions/lib/config/config.js`
and reported three `process is not defined` errors. `functions/lib` is derived,
unversioned output; once removed, the authoritative source baseline is again
13 errors and 8 warnings. None is in an R5/R1 file. Attributable delta is zero.

## Safety, rollback and roadmap

Protected Rules/index/Firebase files retain their published hashes. Only local
demo Firestore Emulator was used; all sessions shut down and no Java process
remained. No Firebase remote operation, deploy, package, Domain, Shared/client,
UI or Revoke change occurred.

Rollback is technical commit `312e68c`; no persisted remote state exists.
`SaaS-03B-C-R5-C1-R1 = completed_pending_human_review_and_push`. Recover is
`repaired_pending_independent_revalidation`; R5-C1 remains blocked until human
push and full independent revalidation. Revoke, 03B-D and Phase 4 remain
blocked/not started.
