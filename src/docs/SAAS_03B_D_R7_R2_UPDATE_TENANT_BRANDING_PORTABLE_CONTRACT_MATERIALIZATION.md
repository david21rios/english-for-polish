# SaaS-03B-D-R7-R2 — UpdateTenantBranding Portable Contract Materialization

## Status

**Completed pending controlled commit and human push.**

R7-R2 materializes the portable shared-contract surface for `UpdateTenantBranding` after the concurrency and mutation semantics were closed in R7-R1.

This checkpoint does **not** implement the privileged Functions business command, transaction store, Firebase handler, Firestore Rules changes, indexes, or client/UI behavior.

---

## 1. Authority and predecessor

Normative predecessor:

- `SAAS_03B_D_R7_R1_UPDATE_TENANT_BRANDING_MUTATION_CONCURRENCY_CONTRACT_RESOLUTION.md`

R7-R1 established the mutation/concurrency authority consumed here:

- command: `UpdateTenantBranding`
- concurrency field: `expectedVersion`
- persisted Branding concurrency field: `version`
- initial persisted Branding version: `1`
- complete caller-owned Branding replacement
- resource type: `tenantBranding`
- audit operation: `UpdateTenantBranding.update`
- raw Branding values excluded from audit allowlists
- portable shared-contract materialization required before backend execution work

R7-R2 does not reopen those decisions.

---

## 2. Materialized command identity

`COMMAND_TYPES` now contains:

- `UPDATE_TENANT_BRANDING: "UpdateTenantBranding"`

`UpdateTenantBranding` is included in the atomic Tenant command catalog.

The portable command is exported through:

- `packages/saas-contracts/src/commands/index.js`
- `packages/saas-contracts/src/index.js`
- generated command declarations
- generated root declarations

No Functions business implementation is created in this checkpoint.

---

## 3. Portable input contract

The exact command envelope is:

- `commandId`
- `correlationId`
- `tenantId`
- `expectedVersion`
- `branding`

`expectedVersion` must be:

- a number
- an integer
- greater than or equal to `1`

The caller-owned Branding replacement is exact and complete:

- `displayName`
- `logoUrl`
- `faviconUrl`
- `colors`

`displayName`, `logoUrl`, and `faviconUrl` retain the established nullable-text semantics.

`colors` is an exact complete object containing:

- `primary`
- `secondary`
- `accent`

Sparse Branding updates are not accepted.

Persistence-owned fields are not caller-owned command input:

- `tenantId`
- `version`
- `updatedAt`

Authority fields and unrelated command fields remain rejected.

---

## 4. Behavioral payload

The idempotency/hash behavioral payload contains exactly:

- `tenantId`
- `expectedVersion`
- `branding`

Envelope-only identifiers remain excluded:

- `commandId`
- `correlationId`

This keeps concurrency intent and the complete replacement value inside the behavioral binding without making envelope identifiers behavioral state.

---

## 5. Persisted Tenant Branding version contract

The persisted Tenant Branding contract now contains:

- `tenantId`
- `displayName`
- `logoUrl`
- `faviconUrl`
- `colors`
- `version`
- `updatedAt`

`version` must be an integer greater than or equal to `1`.

Legacy persisted Branding documents without `version` fail the exact shared validator.

This is an intentional schema-contract materialization required by the closed R7-R1 concurrency model.

---

## 6. Bootstrap ownership rule

Bootstrap caller input remains version-free.

The Bootstrap command still accepts Branding fields:

- `displayName`
- `logoUrl`
- `faviconUrl`
- `colors`

The caller does not provide:

- `version`
- `revision`

The privileged Bootstrap implementation owns initialization of persisted Branding concurrency state and materializes:

- `version: 1`

The existing Tenant Bootstrap transaction store was not changed.

Functions Bootstrap test fixtures were reconciled only where they represented persisted Branding state.

---

## 7. Result contract

The stable result remains exact:

- `commandId`
- `correlationId`
- `operation`
- `resourceType`
- `resourceId`
- `status`
- `replayed`

For this command:

- `operation = "UpdateTenantBranding"`
- `resourceType = "tenantBranding"`
- `status = "succeeded"`

No Membership identifiers or raw Branding values are added to the result.

---

## 8. Audit contract

Audit operation:

- `UpdateTenantBranding.update`

Audit level:

- `privileged`

Audit result:

- `succeeded`

Before allowlist:

- `brandingVersion`

After allowlist:

- `brandingVersion`

Metadata allowlist:

- `stage`
- `previousVersion`
- `nextVersion`

Raw Branding values are explicitly excluded from audit allowlists, including:

- `displayName`
- `logoUrl`
- `faviconUrl`
- `colors`
- `primary`
- `secondary`
- `accent`

Membership identifiers remain excluded.

---

## 9. Package and declaration materialization

The shared package version advances:

- `0.16.0` → `0.17.0`

Reason:

R7-R2 adds a new backward-compatible public command contract and export surface, therefore the package receives a MINOR version increment.

Generated declaration surfaces include the new `UpdateTenantBranding` command contract.

Declaration generation remains derived from:

- `tsc -p tsconfig.types.json`

Declaration validation remains:

- `tsc -p tsconfig.types.json --noEmit`

Generated declaration determinism was validated after materialization.

---

## 10. Functions vendor artifact

Functions now consume:

- `file:vendor/mipymetic-saas-contracts-0.17.0.tgz`

The previous `0.16.0` vendor artifact is removed from the active topology.

Final vendor artifact:

- filename: `mipymetic-saas-contracts-0.17.0.tgz`
- package version: `0.17.0`
- entry count: `70`
- SHA-256: `ff890debe29bb5965ff29d7a60fec7e6cf2209ccee1f6acaa95615fcdba18b98`
- npm shasum: `fcd436b85f7d2c660be11814e32f7d9f3e167873`
- npm integrity: `sha512-ouIDlWiiLtbdgDzGbiD/gR5kJpvwqZpoTSMuZSWqioXKdhMxfCyS1UJyHcE1zkoADabzLLRwcSyF6kD1jEjvAg==`

The Functions lockfile and artifact manifest are synchronized to this exact artifact.

A clean Functions installation resolved the package at version `0.17.0`.

Isolated command and persistence imports were validated against the installed vendor artifact.

---

## 11. Tests and validation

Final R7-R2 technical validation completed successfully.

### Shared package

Complete `@mipymetic/saas-contracts` suite:

- tests: `96`
- passed: `96`
- failed: `0`

Dedicated `UpdateTenantBranding` portable-contract suite:

- tests: `13`
- passed: `13`
- failed: `0`

Package topology:

- passed

Type declaration determinism:

- passed

Package type check:

- passed

Repository-canonical LF validation for changed package sources:

- passed

### Functions

Complete Functions suite:

- tests: `144`
- passed: `144`
- failed: `0`

Bootstrap Tenant focused suite after persisted Branding fixture reconciliation:

- tests: `11`
- passed: `11`
- failed: `0`

Functions build:

- passed

Clean vendor installation:

- passed

Installed shared package version:

- `0.17.0`

Installed Branding version contract:

- passed

Isolated command imports:

- passed

Isolated persistence imports:

- passed

### Repository

`git diff --check`:

- passed

Final technical worktree before documentation:

- exactly `22` R7-R2 paths

Baseline remained:

- branch: `main`
- HEAD: `041475869404fdbd3c5af77a261f264fc516ebee`
- origin/main: `041475869404fdbd3c5af77a261f264fc516ebee`
- divergence: `0 / 0`

No staging, commit, or push occurred during implementation and validation.

---

## 12. Failures encountered and classification

Several controlled validation failures occurred during materialization. None required rollback of the approved contract.

### Missing package `npm test` script

The package does not define an `npm test` script.

Resolution:

- discover `__tests__/*.test.mjs`
- execute the complete suite directly with `node --test`

Classification:

- tooling assumption
- not a contract defect

### CRLF source regression

`packages/saas-contracts/src/commands/contracts.js` temporarily contained CRLF bytes after Windows-side mutation.

Resolution:

- normalize changed shared-package sources to repository-canonical LF

Classification:

- byte-formatting issue
- not a semantic defect

### Declaration determinism before generation

The declaration suite initially observed the new source export before committed declarations had been regenerated.

Resolution:

- regenerate declarations
- rerun deterministic declaration suite

Classification:

- validation ordering issue
- not a contract defect

### Root dependency did not automatically follow workspace version bump

`npm version` advanced the workspace package to `0.17.0` but left the root dependency at `0.16.0`.

Resolution:

- explicitly reconcile root dependency
- regenerate root lock topology

Classification:

- package-manager assumption
- not a contract defect

### Stale package-topology version expectations

The topology test still asserted package/vendor version `0.16.0`.

Resolution:

- update only the two version-sensitive topology expectations to `0.17.0`

Classification:

- stale test expectation caused by intentional MINOR version bump

### Stale persisted Branding Functions fixture

A Functions Bootstrap store fixture represented persisted Branding without the newly authoritative `version`.

Resolution:

- add `version: 1` only to the persisted Branding fixture
- preserve caller-owned Bootstrap Branding input as version-free

Classification:

- stale persisted-state test fixture
- no production store defect

### Package subpath `./package.json` not exported

An initial installed-version check attempted to import `@mipymetic/saas-contracts/package.json`.

The package intentionally does not export that subpath.

Resolution:

- read the installed physical `package.json` directly
- confirmed installed version `0.17.0`

Classification:

- validation-method assumption
- not an export-contract defect

---

## 13. Explicit exclusions

R7-R2 does not create:

- `functions/src/commands/updateTenantBranding.ts`
- `functions/src/persistence/updateTenantBrandingTransactionStore.ts`

R7-R2 does not modify:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `firebase.json`
- `.firebaserc`
- `src/firebase.js`
- privileged callable handlers
- Admin SDK execution paths
- React/UI code
- Providers
- hooks
- client Firestore mutation behavior

The existing Tenant Bootstrap transaction store remains unchanged.

These exclusions are intentional.

---

## 14. Authority after R7-R2

Physical portable authority for the materialized command contract resides in:

- `@mipymetic/saas-contracts`

Persisted Tenant Branding version authority resides in:

- `packages/saas-contracts/src/persistence/tenantContracts.js`

Command identity authority resides in:

- `packages/saas-contracts/src/commands/contracts.js`

Portable `UpdateTenantBranding` command authority resides in:

- `packages/saas-contracts/src/commands/updateTenantBranding.js`

Functions consume the exact vendored `0.17.0` artifact.

No duplicate Functions-side command contract authority was introduced.

---

## 15. R7-R2 closure state

R7-R2 is technically complete.

Final state:

- concurrency authority from R7-R1 preserved
- persisted Branding `version` materialized
- initial Bootstrap Branding version `1` materialized
- caller-owned Bootstrap Branding remains version-free
- `UpdateTenantBranding` command identity materialized
- atomic Tenant command membership materialized
- portable exact input contract materialized
- behavioral payload materialized
- stable exact result contract materialized
- non-PII audit allowlists materialized
- exports materialized
- generated declarations materialized
- package version `0.17.0` synchronized
- root workspace dependency synchronized
- Functions vendor artifact synchronized
- lockfiles synchronized
- artifact manifest synchronized
- old `0.16.0` vendor artifact removed
- package suite PASS
- Functions suite PASS
- build/type/declaration/topology checks PASS
- no Firebase mutation
- no `UpdateTenantBranding` Functions business implementation
- no staging
- no commit
- no push

Status:

**completed_pending_controlled_commit_and_human_push**

The next R7-R2 action is controlled Git staging and commit preparation.

Backend execution of `UpdateTenantBranding` remains a later checkpoint and must not be inferred from this portable-contract materialization.
