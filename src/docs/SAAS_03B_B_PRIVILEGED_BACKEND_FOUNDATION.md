# SaaS-03B-B — Privileged Backend Foundation

## Purpose and inherited state

This phase resumes and closes the existing partial 03B-B Functions foundation;
it does not reconstruct it. Its prerequisite is the reviewed
`@mipymetic/saas-contracts@0.6.1` package and canonical vendored artifact. No
privileged business command, remote Firebase operation or deployment is part of
this phase.

The inherited dirty worktree contained the Functions manifests, configuration,
17 source modules and three test modules. R1 preserved that work and corrected
only the obsolete fail-closed expectation in
`packages/saas-contracts/__tests__/packageTopology.test.mjs`: the dependency is
checked explicitly against `file:vendor/mipymetic-saas-contracts-0.6.1.tgz`.
Package runtime, declarations, exports and version were not changed.

## Package and artifact transition

- package: `@mipymetic/saas-contracts@0.6.1`;
- Functions dependency: `file:vendor/mipymetic-saas-contracts-0.6.1.tgz`;
- canonical artifact: `functions/vendor/mipymetic-saas-contracts-0.6.1.tgz`;
- artifact SHA-256:
  `92a0a26c6394c02e5c72959456f7ca050fae3849c8db0199cc1f20edd1ff4df0`;
- the obsolete 0.6.0 artifact has zero technical consumers and is removed;
- isolated installation resolves 0.6.1 without root `node_modules`;
- root plus seven package subpaths import successfully at runtime and through
  strict TypeScript declarations.

Package topology passes 28/28. Pack dry-run reports 58 authorized entries, no
bundled dependencies and no tests or `node_modules`.

## Module topology and boundaries

The foundation is ESM TypeScript for Node 22. `strict` and `noImplicitAny` remain
enabled. Modules cover authenticated actor and authority resolution, shared
capabilities, command envelope/record, canonical payload hashing, idempotency,
persistence ports and transaction boundary, Firebase Admin adapters, bounded
audit writing, backend errors, closed configuration and callable-context typing.

Portable modules depend on shared contracts and local ports. Firebase Admin
imports occur only under `persistence/adapters`; Firebase Functions imports occur
only under `transport`. React, Vite, Firebase Client, client repositories and
package-to-application imports are absent. The module graph has zero cycles.

## Security and command foundation

Actor UID is derived only from authenticated context. Payload actor, roles,
capabilities, platform role and authority are rejected. Platform authority
requires coherent Identity and active persisted authority. Tenant authority
requires the same actor, active Tenant, approved Membership and tenant
consistency. Membership and platform roles remain separate; capability
resolution reuses only shared 0.6.1 catalogs and matrices.

The command record follows shared status/schema contracts. Canonical JSON is
hashed as UTF-8 SHA-256. Idempotency distinguishes new, replay, resumable,
terminal and conflict decisions. Transactions enforce rereads, command/audit
participation, conservative read/write budgets below 20 and no external side
effects. No business command or business transaction exists.

## Audit, errors and configuration

Audit roots are platform or Tenant scoped; actor and authority are server
derived. Metadata and summaries are bounded/allowlisted, and sensitive or nested
data is rejected. Backend errors use the approved declarative catalog, sanitize
unknown failures and do not migrate client `RepositoryError`.

Configuration accepts `local`, `demo-emulator`, `development`, `staging` and
`production`. Remote project IDs are not invented; region is required only for
staging/production. Versioned config accepts no secrets. Retry attempts are 5
and command timeout is 20 seconds. App Check enforcement, rate limiting and
last-administrator enforcement remain deferred.

## Validation evidence

- package 28/28; Functions 18/18; Shared 51/51;
- RegistrationRequest 59/59, Membership 23/23, Course 51/51, Enrollment 46/46;
- prechecks: Enrollment 111/42/69 (42/41/28/0), Course 114/32/82
  (32/56/26/0), Membership 81/44/37 (44/26/11/0), RegistrationRequest
  52/34/18 (34/14/4/0);
- Rules 222/88/134; general tests 35/35; production build PASS;
- strict TypeScript build/check PASS, TS7016 and all other TS errors 0;
- ESM smoke PASS (20 exports), clean isolated install/test PASS, isolated
  package runtime imports 8/8 PASS;
- scoped lint 0/0; global lint remains the recorded legacy 13 errors/8 warnings,
  with 03B-B delta 0;
- package purity, dependency direction, cycles, Node checks and diff check PASS.

The informative Functions audit reports seven moderate findings in the
Firebase/Google SDK transitive runtime tree. No `npm audit fix` or opportunistic
upgrade is authorized. The contracts package retains zero runtime dependencies.

## Protected state, deferred work and rollback

Rules, indexes, Storage Rules, Firebase config and client Firebase code retain
their hashes. Emulator, Firebase remote services and deploy were not used. No
versioned secret was found. Platform-admin bootstrap, Tenant bootstrap and all
RegistrationRequest, Membership, Course and Enrollment commands remain not
started.

Rollback restores the prior Functions manifests/lock, removes the foundation
source/config/tests, restores tracked artifact 0.6.0 and restores the topology
expectation, then reruns every gate. No data rollback is needed because no
handler is exported and no mutation occurs.

## Closure

```text
SaaS-03B-B-R1 = completed
SaaS-03B-B = completed_pending_human_review_and_push
SaaS-03B-B-C1 = ready_not_started
SaaS-03B-C = blocked_pending_03B_B_C1
Privileged Backend Foundation = implemented
Privileged business commands = not_started
```

Next after human review and push is independent 03B-B-C1. Neither 03B-C nor any
business-command phase starts here.

## C1-R1 repair trace

The first independent C1 review later proved that the original implementation
did not enforce persisted Identity UID coherence and that its configuration
allowlist was not effective. `SaaS-03B-B-C1-R1` repairs those statements in
code, adds automatic transaction-port budget enforcement and expands negative
characterization. This historical foundation record is therefore superseded for
those guarantees by the R1 repair report; independent C1-R2 revalidation remains
required before 03B-C.
