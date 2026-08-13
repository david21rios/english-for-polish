# SaaS-03B-D-R3-C1-R2-R1 — Persisted Membership Validator Shared Materialization

## Decision

COMPLETE. `SHARED_PERSISTED_MEMBERSHIP_VALIDATION_GAP` is resolved. This
microphase does not repair `TenantBootstrapTransactionStore` and does not alter
BootstrapTenant business semantics.

## Reconciled contract

Membership is legacy-unversioned. Its exact ordered, required field set is:

```text
membershipId, tenantId, uid, role, status, originRequestId, createdAt,
approvedAt, approvedBy, updatedAt, suspendedAt, removedAt
```

All keys are required. `originRequestId`, `suspendedAt`, and `removedAt` are
nullable; the remaining fields are non-null. Identifiers use the package-owned
document identifier validator. Roles are exactly `student`, `teacher`, and
`tenant_admin`; statuses are exactly `approved`, `suspended`, and `removed`.
Logical timestamps are canonical UTC ISO strings with milliseconds.

Universal local lifecycle invariants remain: approved cannot have `removedAt`;
suspended requires `suspendedAt` and cannot have `removedAt`; removed requires
`removedAt` and may retain suspension history. First-admin composition
(`tenant_admin`, `approved`, `originRequestId=null`) and all cross-document
equalities remain outside this general validator.

## Materialization and evidence

`validatePersistedMembership` is pure, non-throwing, exact-shape, exported from
the persistence subpath and root, and returns a frozen `ValidationResult`. It
has no Firebase or `ServerOwnedTimestamp` dependency and introduces no `any`.

The package moves 0.12.0 → 0.13.0 because this is a backward-compatible public
API addition. Functions consumes `mipymetic-saas-contracts-0.13.0.tgz`.

- package tests 52/52; strict types/declarations, purity and cycles PASS;
- runtime imports 8/8; runtime dependencies 0;
- artifact 19,137 bytes/64 entries; SHA-256
  `01c6602ee6e94a2bab90bb1a8dc84efe6d17dccaa6213218774e0a4de5e41bbd`;
- npm shasum `788e80214304c34c4a26b8a1a2b0f95397a77031`; integrity
  `sha512-ZS929cK8ipZXTFBOCidOFcI+/S1Bcw0/fUYlRqAGc7WUi9My9S3h62niqkAIHNEjE6sEIckvo80GEa+ZvhUNEQ==`;
- two fresh packs and vendor are byte-exact;
- isolated Functions npm ci/check/build, 73/73, lint 0/0, ESM PASS;
- Shared 51/51; repositories 59/23/51/46;
- prechecks 111/42/69, 114/32/82, 81/44/37, 52/34/18;
- Rules 222/88/134; general 35/35; root build PASS;
- global lint 13 errors/8 warnings legacy, attributable delta 0;
- audits unchanged: root 25 (3/9/13), Functions 7 moderate.

No persisted schema migration, Emulator claim, Rules/index/config, Domain,
Shared/client, UI, Firebase remote, deployment, Store repair, or business
command change occurred.

## Next step

R3-C1-R2-R1 is `completed_pending_human_review_and_push`. After publication,
resume exactly `SaaS-03B-D-R3-C1-R2 — BootstrapTenant Store Aggregate
Validation Repair`; only after it closes may R3-C1 be rerun.
