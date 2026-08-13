# SaaS-03B-C-R5-C1-R2 — Active Recovery Same-Owner Lifecycle Validation Repair

## Result

`ACTIVE_RECOVERY_SAME_OWNER_STATUS_UNVALIDATED` is repaired. The shared
same-owner early return previously ran before the active-claim lifecycle check,
so a running/prepared Recover command could receive a successful no-op for a
same-owned non-active Authority.

The Store now validates primitive-specific Authority lifecycle before owner
classification. `claimActiveRecoveryOwnership` requires `active` for new claim,
same-owner resume and foreign-owner conflict. Only then does it distinguish
null, same and foreign owner. `provisioning`, `revoking`, `revoked` and
`recovery_required` cannot resume through this primitive.

Handoff remains separate: its valid same-owner retry is
`provisioning/newRecoverOwner`; its new transition remains limited to an
eligible prior Recover in `recovery_required/prepared`. The narrow
`markActiveRecoveryRequired` primitive was independently checked and continues
to require active/current owner plus running/prepared, with count delta zero and
idempotent recovery-required retry.

## Evidence

- Functions: 58/58, TypeScript check/build PASS, TS7016/errors 0,
  strict/noImplicitAny, lint 0/0, clean install and ESM smoke PASS.
- Added negatives cover every non-active same-owner status, malformed revoked
  owner shape, wrong command type/status/stage, payload/correlation mismatch and
  zero writes. Existing generic-bypass, foreign-owner and handoff matrices pass.
- Firestore Emulator: Store 11/11, Bootstrap 3/3, Recover 3/3. Active contention
  has one winner; same-owner is read-only; non-active same-owner persists no
  writes/audit; handoff and finalization remain exactly once. Temurin 21.0.12,
  Emulator 1.21.0 and Firebase CLI 15.24.0 shut down cleanly.
- Package 0.11.0 unchanged, 40/40, runtime imports 8/8, strict declarations,
  purity and cycles PASS. Shared/repository units are 51 and 59/23/51/46.
  Prechecks remain 111/42/69, 114/32/82, 81/44/37 and 52/34/18. Rules remain
  222/88/134; general tests 35/35 and root build PASS.
- Global source lint remains 13 errors/8 warnings after removing derived
  `functions/lib`; attributable delta is zero. Root audit remains 25
  (3 low/9 moderate/13 high), Functions audit 7 moderate.
- Protected Rules/index/Firebase hashes match. No package, Domain, Shared/client,
  UI, Bootstrap semantics, Revoke, remote Firebase or deploy change occurred.

Rollback is technical commit `2ef3c60`. State is
`SaaS-03B-C-R5-C1-R2 = completed_pending_human_review_and_push`;
`RecoverPlatformAdmin = repaired_pending_independent_revalidation`; R5-C1 is
blocked pending R2 push and revalidation. Revoke, 03B-D and Phase 4 remain
blocked/not started.
