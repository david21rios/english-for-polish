# SaaS-03B-C-R6-C1-R2 — Revoke Existing Resume Lifecycle Validation Repair

## Result

The confirmed `REVOKE_EXISTING_RESUME_AUTHORITY_LIFECYCLE_UNVALIDATED` implementation defect is repaired. An existing Revoke command cannot execute an Auth effect until a read-only transaction proves that Command, Authority and Registry form the same valid persisted Revoke checkpoint.

## Reproduction and root cause

Before the repair, `inspectCommand()` correctly validated and classified a persisted `running/prepared` or `recovery_required/prepared` command, but orchestration treated that Command-only classification as sufficient to continue. A `running/prepared` Revoke paired with `active/null` Authority could therefore reach claim removal and fail only during finalization.

The defect was not in generic command classification and no shared contract change was needed. The missing boundary was Revoke-specific checkpoint proof before external effects.

## Repair architecture

The Store now exposes `validateRevokeResumeCheckpoint`, a narrow read-only Revoke primitive. In one deterministic transaction it reads Registry, Command and target Authority before any write and validates their package-owned schemas, exact command type, payload hash, correlation and owner.

- `running/prepared` accepts only Authority `revoking/currentCommandId` with Registry `completed`.
- `recovery_required/prepared` accepts only Authority `recovery_required/currentCommandId` with Registry `recovery_required`.
- A foreign owner returns `CONFLICT`; missing or malformed persistence and incompatible lifecycle fail closed using existing error codes.
- The proof performs no writes, audit, count/revision delta, Auth, network, randomness or process-clock timestamp.

Revoke orchestration invokes this proof for every existing non-replay command before claim reads or writes. Valid recovery then uses the existing recovery-resume mutation. Succeeded replay remains ordered before new-operation lifecycle rejection. No generic flag, takeover or second ownership primitive was introduced.

## Matrix and regression evidence

Unit tests reject before Auth and Store mutation: `running/prepared` with `active/null`, active/same owner, provisioning/same owner, revoked/null, recovery-required/same owner or revoking/foreign owner; recovery-required Command with the wrong Authority lifecycle or foreign owner; and malformed/missing persisted state through existing Store validation. Positive running and recovery-required checkpoints resume with zero second decrement.

The Firestore Emulator physically proves the historical `running/prepared + active/null` tuple leaves Command, Authority, Registry and audit unchanged with zero Auth writes, while `running/prepared + revoking/same owner` resumes and finalizes. Revoke passes 5/5; Bootstrap 3/3, Recover 3/3 and Store 11/11 remain valid. Contention, last-two-admin, transaction retry, atomic new prepare, replay, recovery and concurrent finalization retain their published invariants.

## Quality and boundary evidence

- Functions: 67/67, strict TypeScript/check/build, TS7016 0, lint 0/0 and ESM smoke PASS.
- Clean isolated Functions: `npm ci`, check, build, 67 tests, lint and ESM PASS; local Node is 24.15.0 while the manifest remains Node 22.
- Package `@mipymetic/saas-contracts@0.11.0`: unchanged, 40/40; purity, dependency direction, cycles, runtime imports and strict declarations remain covered.
- Shared 51/51; repositories 360/360; prechecks remain 111/42/69, 114/32/82, 81/44/37 and 52/34/18; Rules preflight 222/88/134; general tests 35/35; production build PASS.
- Global lint remains the legacy 13 errors/8 warnings with attributable delta zero. Root audit remains 25 findings (3 low, 9 moderate, 13 high); Functions remains 7 moderate.
- Protected hashes are unchanged. Emulator cleanup leaves zero Java processes. No Firebase remote operation, deploy, package, Domain, Shared/client, UI, Rules or configuration change occurred.

## Risk, rollback and next step

The remaining blocker is independent R6-C1 revalidation after human review and push. Registry `lastCommandId` is deliberately not treated as target ownership or required to equal the resumed command because it is global history/coordination metadata that may advance through an independent operation; target-local proof remains `transitionCommandId` plus exact lifecycle and Command binding.

Rollback is the local technical commit; there is no remote or migrated state. Next, after push, rerun only `SaaS-03B-C-R6-C1 — Independent RevokePlatformAdmin Review`.

State: `SaaS-03B-C-R6-C1-R2 = completed_pending_human_review_and_push`, `SaaS-03B-C-R6-C1 = blocked_pending_R2_push_and_revalidation`, and `RevokePlatformAdmin = repaired_pending_independent_revalidation`.
