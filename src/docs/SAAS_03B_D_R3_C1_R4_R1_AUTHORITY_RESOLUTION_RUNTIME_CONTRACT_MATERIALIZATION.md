# SaaS-03B-D-R3-C1-R4-R1 — Authority Resolution Runtime Contract Resolution and Materialization

## Decision

PASS. The actor matrix closed by R4-R1-R1 is materialized as an additive,
portable runtime contract in `@mipymetic/saas-contracts@0.14.0`. This work does
not repair `TenantBootstrapTransactionStore`, implement another Tenant command,
add a handler, change Rules, contact Firebase remotely or deploy.

## Contract and trust boundary

`AuthorityResolution` is the exact six-field discriminated union
`HumanAuthorityResolution | SystemOperatorResolution`:

```text
actorUid, actorType, authority, tenantId, roles, capabilities
```

All fields are required and unknown fields are rejected. The package exports
`AUTHORITY_ACTOR_TYPES`, `SYSTEM_OPERATOR_AUTHORITIES`,
`AUTHORITY_RESOLUTION_FIELDS` and `validateAuthorityResolution` from the
authority subpath and root. Validation is pure, non-throwing, Firebase-free,
exact-shape and `ValidationResult` based.

| actorType | authority | tenantId | roles | capabilities |
|---|---|---|---|---|
| `platform_admin` | `platform_admin` | `null` | exact singleton | exact canonical Platform matrix |
| `identity` | `student`, `teacher` or `tenant_admin` | valid Tenant ID | exact singleton | exact canonical Membership matrix |
| `system` | `platform_system` or `platform_recovery` | `null` | `[]` | `[]` |

Input arrays are not sorted, healed or deduplicated. Missing, extra, duplicate,
reordered and cross-role values fail closed. A structurally valid value is not
authentication evidence: human authority remains server-derived and system
operators remain trusted command dependencies.

`resolvePlatformAuthority` and `resolveTenantAuthority` validate their composed
output. BootstrapPlatformAdmins accepts only a validated
`system/platform_system` operator; RecoverPlatformAdmin accepts only
`system/platform_recovery`. Revoke remains a human Platform resolution.
Malformed composed evidence maps to existing `CONTRACT_VIOLATION`. No public
backend constructor was added.

## Package and artifact

The additive public surface is a MINOR change from `0.13.0` to `0.14.0`.
Runtime dependencies remain zero and declarations are generated canonically.

```text
filename: mipymetic-saas-contracts-0.14.0.tgz
size: 20249 bytes
entries: 64
SHA-256: 90347051e17e9ddf2adc22b793c61078f36b1620e2a76a0c11b210a211cb64ad
npm shasum: 9e0a3026030c68e244fd39733d09f8540def7b67
integrity: sha512-4myASOu4oo1tPpCzu7KLhyrjXLZWW/7HRuGIdIJv1yYox+JW2d0zrCmynh4ckKYH2n581GMrRRZkxh7fHfJa4A==
```

Two fresh packs and the vendored artifact are byte-identical. Inventory,
declarations and strict NodeNext consumption pass; tests, temporary files,
`node_modules`, build metadata and secrets are absent.

## Validation evidence

- package 57/57 PASS (published baseline 54), purity PASS, cycles 0;
- Functions clean install/check/build/tests/lint/ESM PASS, 76/76 tests
  (published baseline 75), TypeScript and TS7016 errors 0, lint 0/0;
- Shared 51/51 PASS;
- all four repository runtime suites PASS in isolated local Firestore Emulator
  sessions;
- prechecks: RegistrationRequest 52/34/18, Membership 81/44/37, Course
  114/32/82, Enrollment 111/42/69;
- Rules preflight 222/88/134, general tests 35/35, root build PASS;
- 288 Node syntax checks PASS;
- global lint remains legacy 13 errors/8 warnings, attributable delta 0;
- audits remain root 25 (3 low, 9 moderate, 13 high) and Functions 7 moderate.

Emulator use was regression-only; no transaction path changed and no new
concurrency claim is made. Sessions used the local demo project and shut down
with zero Java processes. Protected hashes match. Rules, indexes, Storage,
Firebase config, Domain, Shared/client, UI and Tenant Bootstrap Store are
unchanged.

## Roadmap

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R4 = blocked_pending_R4_R1_push_then_repair
SaaS-03B-D-R3-C1 = blocked_pending_R4_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, the next microphase is
`SaaS-03B-D-R3-C1-R4 — BootstrapTenant Store Actor Authority Validation Repair`.
