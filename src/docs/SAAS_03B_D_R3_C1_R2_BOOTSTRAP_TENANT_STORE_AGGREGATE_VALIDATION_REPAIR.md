# SaaS-03B-D-R3-C1-R2 — BootstrapTenant Store Aggregate Validation Repair

## Decision

COMPLETE. `BOOTSTRAP_TENANT_STORE_NEW_AGGREGATE_UNVALIDATED` is repaired.
`TenantBootstrapTransactionStore` now validates the complete logical NEW
aggregate before its first write. This microphase changes neither the shared
package nor BootstrapTenant's published business contract.

## Root cause and repair

The Store accepted Tenant, settings, branding, Membership, MembershipKey and
tenant-admin authority-state candidates as records and sent them directly to
`transaction.create`. Collision reads were validated, but NEW candidates were
not. Consequently a malformed direct Store caller could persist an incoherent
aggregate.

The repaired Store performs every read first and then, still before any write:

- requires the exact nominal `ServerOwnedTimestamp` token at server-owned
  timestamp positions and rejects misplaced tokens;
- creates logical validation views using an already validated canonical
  timestamp without persisting that value;
- consumes package-owned exact validators for Tenant, settings, branding,
  Membership, MembershipKey and tenant-admin authority state;
- proves tenant, Membership, canonical MembershipKey, first-admin,
  authority-state and persisted result cross-document composition;
- only then creates Command, Tenant, configuration, Membership, key,
  authority-state and both Critical audits in the original transaction.

Physical Firestore writes still receive server timestamp transforms. No
Firebase value is treated as a package contract and no external effect occurs
inside the transaction callback.

## Evidence

- Functions unit tests: 75/75 (published baseline 73); malformed candidates
  report `CONTRACT_VIOLATION` and zero creates; a valid direct Store aggregate
  creates exactly nine documents.
- BootstrapTenant Emulator: 6/6, including physical zero-write rejection,
  native Firestore timestamps, replay and real contention/retry.
- Platform Store, BootstrapPlatformAdmins, RecoverPlatformAdmin and
  RevokePlatformAdmin Emulator regressions: PASS; final Java process count: 0.
- Functions check/build/tests/lint and ESM smoke: PASS; TypeScript and TS7016
  errors are zero; strict and `noImplicitAny` remain enabled.
- Clean isolated `npm ci`: 75/75, lint 0/0 and ESM PASS.
- `@mipymetic/saas-contracts@0.13.0` is unchanged: 52/52, strict declarations,
  purity and cycles PASS; artifact SHA-256 remains
  `01c6602ee6e94a2bab90bb1a8dc84efe6d17dccaa6213218774e0a4de5e41bbd`.
- Shared 51/51 and repositories 59/23/51/46 PASS. Prechecks remain
  111/42/69, 114/32/82, 81/44/37 and 52/34/18; Rules remain 222/88/134;
  general tests 35/35, production build and 278 Node checks PASS.
- Global lint remains 13 errors/8 warnings legacy, attributable delta zero.
  Audits remain root 25 (3 low/9 moderate/13 high) and Functions 7 moderate.

Protected Rules, indexes, storage/Firebase configuration and `src/firebase.js`
retain their published hashes. Package, Domain, Shared/client, UI, public
handlers, Firebase remote state and deployment are unchanged.

## State and next step

R3-C1-R2 is `completed_pending_human_review_and_push`; R3-C1 remains blocked
until publication and independent revalidation. BootstrapTenant is
`repaired_pending_independent_revalidation`. After human review and push,
resume only `SaaS-03B-D-R3-C1 — Independent BootstrapTenant Review`.
