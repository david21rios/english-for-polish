# SaaS-03B-D-R3-C1-R4 — BootstrapTenant Store Actor Authority Validation Repair

## Decision

PASS. `BOOTSTRAP_TENANT_STORE_ACTOR_AUTHORITY_UNVALIDATED` is repaired at the
Tenant Bootstrap transaction boundary without changing package 0.14.0 or any
other business command.

## Repair

Before its first read/write decision, `TenantBootstrapTransactionStore`
consumes package-owned `validateAuthorityResolution` and explicitly branches on
`ValidationResult.ok`. Malformed authority maps to `CONTRACT_VIOLATION`.

A generically valid resolution is then restricted to the only BootstrapTenant
variant: human `platform_admin`, authority `platform_admin`, null authority
scope, canonical package roles/capabilities and the package-owned
`platform.tenant_create` capability. Tenant Membership actors and both system
operators are rejected. Input is never normalized, sorted, deduplicated or
healed.

The Store additionally proves `Membership.approvedBy == actorUid`. NEW Command,
tenant audit and platform audit actor scalars derive from the validated actor.
Replay now requires the persisted Command actor UID/type/authority to match the
validated actor before returning read-only success.

## Zero-write and atomicity evidence

Unit and local Firestore Emulator regressions reject forged authority, wrong
actor type/scope, student/teacher/tenant_admin, platform_system,
platform_recovery, malformed actor UID, missing/extra fields, wrong/duplicate
roles and missing/extra/reordered/duplicate capabilities before any aggregate,
Command or audit write. Auth writes remain zero because the Store has no Auth
port.

The canonical Platform Admin still creates the complete nine-document
checkpoint. Contention retains one winner and an absent loser Command; retry,
collision and replay remain stable and replay leaves its original persisted
result with `replayed=false` while returning `replayed=true`.

## Regression evidence

- Functions clean install/check/build/tests/lint/ESM: PASS, 79/79 tests;
- BootstrapTenant Emulator: PASS including physical actor zero-write cases;
- Platform Store, BootstrapPlatformAdmins, Recover and Revoke Emulator: PASS;
- package 0.14.0: 57/57, strict types, purity, dependency direction and cycles
  PASS; artifact SHA-256 remains
  `90347051e17e9ddf2adc22b793c61078f36b1620e2a76a0c11b210a211cb64ad`;
- Shared 51/51 and all four isolated repository Emulator suites PASS;
- prechecks: RegistrationRequest 52/34/18, Membership 81/44/37, Course
  114/32/82 and Enrollment 111/42/69;
- Rules preflight 222/88/134; general 35/35; production build PASS; Node syntax
  checks 289/289;
- global lint remains 13 errors/8 warnings legacy, attributable delta zero;
- audits remain root 25 (3 low/9 moderate/13 high) and Functions 7 moderate.

Java/Firestore Emulator sessions shut down cleanly with zero Java processes.
Protected hashes match. Package, Domain, Shared/client, UI, Rules, indexes and
Firebase configuration are unchanged. Firebase remote and deploy were not used.

## Preserved defect lineage

- `BOOTSTRAP_TENANT_REPLAY_RESULT_BINDING_UNVALIDATED`
- `BOOTSTRAP_TENANT_STORE_NEW_AGGREGATE_VALIDATION_BYPASS`
- `SHARED_PERSISTED_MEMBERSHIP_VALIDATION_GAP`
- `BOOTSTRAP_TENANT_AUDIT_CONTRACT_LOCALLY_DUPLICATED`
- `BOOTSTRAP_TENANT_STORE_ACTOR_AUTHORITY_UNVALIDATED`
- `SHARED_AUTHORITY_RESOLUTION_VALIDATION_GAP`
- `NORMATIVE_AUTHORITY_RESOLUTION_MATRIX_GAP`

## Roadmap

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed
SaaS-03B-D-R3-C1-R4 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1 = blocked_pending_R4_push_and_revalidation
BootstrapTenant = repaired_pending_independent_revalidation
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, rerun only `SaaS-03B-D-R3-C1 — Independent
BootstrapTenant Review`.
