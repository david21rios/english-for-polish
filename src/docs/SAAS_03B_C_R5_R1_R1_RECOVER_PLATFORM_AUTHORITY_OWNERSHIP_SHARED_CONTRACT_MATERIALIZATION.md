# SaaS-03B-C-R5-R1-R1 — Recover Platform Authority Ownership Shared Contract Materialization

## Result and authority

Result: **COMPLETE — pending human review and push**. This microphase materializes the R5-R1 normative decision without implementing `RecoverPlatformAdmin` or `RevokePlatformAdmin`. Domain and approved resolutions remain normative authority, the package is physical shared authority, and Functions contains the Store implementation.

## Authority schema v2

`PLATFORM_AUTHORITY_SCHEMA_VERSION` changes from 1 to 2. The exact 14 fields are unchanged. Readers are current-schema-only: missing, v1, unknown and future schemas fail closed; there is no inference or automatic migration.

| Status | `transitionCommandId` |
|---|---|
| `provisioning` | valid command ID required |
| `active` | null or valid command ID |
| `revoking` | valid command ID required |
| `revoked` | null required |
| `recovery_required` | valid command ID required |

The validator remains pure, non-throwing and result-based, validates exact shape, identifiers and timestamps, and returns frozen results/issues. An `active` Authority remains authoritative with a Recover owner; claims do not become authority.

## Store ownership primitives

- `claimActiveRecoveryOwnership` atomically changes `active/null` to `active/recoverCommandId`, prepares the new Recover command, advances Registry revision/history with server time and writes a Critical audit. `activeCount` delta is zero.
- `handoffRecoveryOwnership` only accepts `recovery_required/priorOwner` where the prior command is `RecoverPlatformAdmin` in `recovery_required/prepared`. It writes `provisioning/newRecoverCommandId`, prepares the new command, advances Registry and writes a Critical handoff audit. The prior command remains immutable and count delta is zero.

Both APIs read and validate all documents before writes, bind payload hash and correlation, use deterministic audit IDs and prohibit external effects in callbacks. Same-owner calls are read-only resume; foreign owners conflict. Bootstrap, Revoke, live, missing and malformed prior commands cannot hand off. There is no generic or lease-based takeover.

Existing finalization supports `active/owner -> active/null` with delta zero and recoverable non-active Authority to `active/null` with delta +1. Emulator concurrency proves +1 commits exactly once.

## Package and artifact cutover

The package changes from 0.10.0 to 0.11.0. Minor is appropriate for the new public schema version and widened v2 active-owner semantics; Command and Registry schemas do not change. Declarations were generated from JS/JSDoc with no `any`.

- file: `mipymetic-saas-contracts-0.11.0.tgz`
- size: 15,420 bytes; entries: 60
- SHA-256: `302c3a0960318eeab982618d9b720b3cf66c920cbc9688e91e6c9cc04a2b5c58`
- npm shasum: `7fe9f5b298658f12a8c738d17968a7ad0d3e0982`
- integrity: `sha512-kdtl+i7eRgsY/Sd+cv9mx52ypsTENv+ylnrahvvauh1JiXlms5sAqvkvcceq61mm74AUNWiggtDsPHl6K/Ni2w==`

The 60-entry inventory contains only package source, declarations, manifest and README. Clean local clones with `core.autocrlf=false` and `true` produced byte-exact artifacts. The 0.10.0 artifact had zero legitimate consumers and was removed after root and Functions cutover.

## Evidence

- Package declarations/checks PASS; package tests 40/40.
- Functions strict check/build/lint PASS; TS7016 0, TypeScript errors 0, lint 0/0; tests 47/47 (baseline 43/43).
- Firestore Emulator 1.21.0 on Temurin 21.0.12: 12/12 (Bootstrap 3, prior Store 5, ownership/concurrency 4), with clean shutdown.
- Claim and handoff each select one owner; Bootstrap/Revoke handoff rejects; concurrent Recovery finalization increments once and commits one audit.
- Clean isolated Functions install/check/build/tests PASS; runtime imports 8/8 and ESM smoke PASS. Local Node is 24.15.0; native Node 22 was unavailable, while engine 22, ES2022 and NodeNext remain declared.
- Shared 51/51; repository/precheck aggregate 360/360; Rules CI preflight 222/88/134; general 35/35; root build PASS.
- Global lint remains legacy 13 errors/8 warnings, attributable delta zero.
- Audits remain root 25 (3 low, 9 moderate, 13 high) and Functions 7 moderate. Package runtime dependencies remain zero.
- Protected Rules/index/Storage/Firebase hashes are unchanged.

The official Rules preflight passed. A separate broad Emulator Rules invocation encountered pre-existing Emulator runtime instability and is not the authoritative CI gate.

## Security, migration, risk and rollback

Audit metadata is bounded and excludes email, claims, payload, approval artifacts, credentials, SDK objects and secrets. Firebase Admin stays behind adapters; Store callbacks perform no Auth/network/approval effects.

No Firebase remote operation, deployment or migration occurred. Future discovery of Authority v1 requires STOP and a separate inventory/migration decision; v1 is never interpreted as v2. The principal risk is rollout against unexpected v1 data. Before deployment, rollback is the technical commit and artifact/lockfile cutover; no downgrade is safe after writing v2 without a data decision.

## Continuity

Bootstrap is regression-validated on Authority v2 and the Store is `recovery_ownership_ready`. After human review and push, the exact next microphase is `SaaS-03B-C-R5 — RecoverPlatformAdmin Implementation`. R5, Revoke, 03B-D and Phase 4 were not started here.
