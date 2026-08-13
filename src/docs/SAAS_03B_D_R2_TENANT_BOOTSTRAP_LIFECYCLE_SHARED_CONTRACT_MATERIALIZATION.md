# SaaS-03B-D-R2 — Tenant Bootstrap and Lifecycle Shared Contract Materialization

## Decision

**RESULT B**. The closed BootstrapTenant shared-contract subset is fully
materialized in `@mipymetic/saas-contracts@0.12.0`. The other six phase-D
workflows retain the normative gaps recorded by R1. No business command,
handler or transaction store was implemented.

## Materialized contract

The package now owns the exact BootstrapTenant input, behavioral-payload
projection, seven-field Tenant result, Critical `BootstrapTenant.create` audit
literals/allowlists, and completed-only command-stage authorization. It owns
exact fail-closed validators for the unversioned persisted Tenant, Settings,
Branding, MembershipKey and tenant-admin Authority State shapes.

Membership keys use `u1_<base64url(UTF-8(uid), no-padding)>` and first-admin
keys require `originRequestId: null`. Tenant-admin Authority State validates
the initial tuple count 1, revision 1 and current command lastCommandId; count
coherence remains a cross-document transaction invariant. The result is the
exact seven-field Tenant result and contains neither membershipId nor PII.
Non-null support URLs are HTTPS; no stronger branding URL/color rule was
invented.

## Package and artifact

The additive public surface is a minor release, 0.11.0 → 0.12.0. Declarations
are generated. Root and Functions consume the canonical vendored artifact.

- file: `mipymetic-saas-contracts-0.12.0.tgz`
- entries: 64; size: 18,978 bytes
- SHA-256: `b1cf45cc5e36f1b4d09929dc47ac79b3b7d7e86eb01b633c46cdf13f9636dcdb`
- shasum: `ccbeb9ab5890ec599768e9f45ccc2d59e185800c`
- integrity: `sha512-UXpWtL25ums3Z+OP+pSuscOINzOZAvk7OW5OALxWWVGcu86D4pi6U954/GDhuR8fY4/0I6QScSuxri7vOj/ykw==`

Two independent packs have the same SHA-256. Runtime dependencies and cycles
remain zero; all eight public runtime/type subpaths and strict NodeNext types
remain valid.

## Deferred work and transaction recommendation

UpdateTenantProfile, UpdateTenantSettings, UpdateTenantBranding, SuspendTenant,
RestoreTenant and ArchiveTenant are not added. Their payload/repeat/audit gaps
require later ordered normative resolution. BootstrapTenant is ready for its
first implementation microphase after R2 publication.

That implementation should reuse TransactionRunnerPort/TransactionPort through
a narrow Tenant-specific atomic primitive for Tenant, Settings, Branding,
Membership, MembershipKey, tenant-admin Authority State, Command and two
audits. PlatformCommandTransactionStore must not gain Tenant flags. Rejections
and losers write zero documents; Auth never runs inside the transaction.

## Validation

- package 45/45; generated/check types, purity, cycles, artifact and strict
  consumer pass;
- clean Functions install/check/build/tests/lint/ESM: 67/67, TS/TS7016 zero,
  strict/noImplicitAny, lint 0/0, 25 exports;
- Shared 51/51; repositories 59/23/51/46;
- prechecks 111/42/69, 114/32/82, 81/44/37 and 52/34/18;
- Rules 222/88/134; general 35/35; build and 283 Node checks pass;
- global lint actual baseline 16 errors/8 warnings, attributable delta zero;
- audits: root 25 (3 low, 9 moderate, 13 high), Functions 7 moderate; delta zero.

Emulator was not required because only pure shared contracts changed. No
Firebase remote operation/deploy occurred. Protected Rules/config hashes are
unchanged. Rules are `NO_CHANGE_REQUIRED_NOW`, pending later business-command
regression evidence.

## State

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1-R1 = completed
SaaS-03B-D-R2 = completed_pending_human_review_and_push
SaaS-03B-D = contracts_materialized_ready_for_first_implementation_microphase_after_R2_push
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```
