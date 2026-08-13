# SaaS-03B-D-R3 — BootstrapTenant Implementation

## Decision and genealogy

PASS. `BootstrapTenant` is implemented and validated, but not independently
closed. No implementation identifier existed in the published roadmap; R1 is
contract reconciliation and R2 shared materialization, so the minimum
non-parallel descendant is `SaaS-03B-D-R3`.

## Git and scope gate

- Initial branch: `main`.
- Initial HEAD and `origin/main`: `933e613280d00b60e17896fe6da710598bfbd5eb`.
- Initial worktree: clean.
- Published prerequisites `53b48c4` and `933e613` are ancestors of HEAD.
- Package stays `@mipymetic/saas-contracts@0.12.0`; package, Domain,
  Shared/client, Rules, indexes, Firebase config, UI and public handlers are
  unchanged.
- No other phase-D workflow, 03B-E/F or Phase 4 work was started.

## Implemented contract

The command consumes the exact package input and explicitly checks every
`ValidationResult.ok`. Correlation is persisted as binding while the behavioral
hash uses the package projection. Actor identity comes only from authenticated
server context. Exact Auth/Identity evidence, active Platform Authority v2,
`platform.tenant_create`, first-admin Auth/Identity coherence, and completed
Platform Registry are required. Claims never act as authority.

The transaction reads Command first for replay/conflict classification and then
validates all aggregate prerequisites before writes. A successful new command
atomically creates nine documents: Tenant, settings, branding, first approved
tenant-admin Membership, canonical MembershipKey, tenant-admin Authority State
(`activeCount=1`, `revision=1`, current `lastCommandId`), succeeded/completed
Command v2, tenant Critical audit, and platform Critical audit. There is no
pending committed intermediate and no Auth write.

Existing exact succeeded/completed binding replays stably. Payload/correlation
conflicts, malformed persistence, aggregate collisions and competing bootstrap
fail closed without partial writes. IDs are generated before transaction retry;
timestamps are server-owned adapter values. MembershipKey collisions are
validated before distinguishing canonical existing mapping from foreign
mapping.

The result has exactly seven fields: `commandId`, `correlationId`, `operation`,
`resourceType`, `resourceId`, `status`, `replayed`; operation is
`BootstrapTenant`, resource type `tenant`, resource ID `tenantId`, with no PII.
Audits use `BootstrapTenant.create`, bounded summaries and allowlisted metadata,
excluding email, claims, raw payload/config, credentials, secrets, snapshots,
SDK objects and stacks.

## Validation evidence

- Functions 71/71 (baseline 67), TypeScript check, build and lint pass; strict
  and noImplicitAny remain enabled; TS7016 is zero.
- BootstrapTenant Emulator 4/4: atomic aggregate, replay/correlation conflict,
  collision zero-write, contention and transaction retry.
- Store/BootstrapPlatform/Recover/Revoke Emulator regression 22/22. The new
  suite and established suite were isolated to avoid cross-suite emulator lock
  contention; both end with zero Java processes.
- Package 45/45 and artifact unchanged, SHA-256
  `b1cf45cc5e36f1b4d09929dc47ac79b3b7d7e86eb01b633c46cdf13f9636dcdb`.
- Shared 51/51; RegistrationRequest 59/59; Membership 23/23; Course 51/51;
  Enrollment 46/46.
- Prechecks: Enrollment 111/42/69, Course 114/32/82, Membership 81/44/37,
  RegistrationRequest 52/34/18. Rules preflight 222/88/134; general tests 35/35;
  root production build and Node checks pass.
- Global lint is the current legacy 16 errors/8 warnings, attributable delta 0.
  Supply chain remains root 25 findings (3 low, 9 moderate, 13 high) and
  Functions 7 moderate, attributable delta 0.
- Firebase CLI 15.24.0, Firestore Emulator 1.21.0, Eclipse Temurin 21.0.12.
  Firebase remote writes and deployment are zero.

## Resulting roadmap

`SaaS-03B-D-R3 = completed_pending_human_review_and_push` and
`BootstrapTenant = implemented_and_validated`. `SaaS-03B-D` remains in progress
pending the separate independent review. The six other Tenant workflows remain
blocked on their contract resolutions. The exact next microphase after push is
`SaaS-03B-D-R3-C1 — Independent BootstrapTenant Review`. No push is performed.
