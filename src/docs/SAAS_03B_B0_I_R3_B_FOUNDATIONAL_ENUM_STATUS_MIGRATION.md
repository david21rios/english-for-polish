# SaaS-03B-B0-I-R3-B — Foundational enums and status contracts migration

Date: 2026-08-05

Decision: COMPLETE

## Objective and scope

R3-B moves physical authority for exactly seven foundational contracts to
`@mipymetic/saas-contracts/domain` while Domain 1.2.0 remains normative and its
public import paths stay compatible. Included: `ACCESS_STATES`,
`REGISTRATION_REQUEST_STATUSES`, `TENANT_TYPES`, `TENANT_STATUSES`,
`MEMBERSHIP_STATUSES`, `COURSE_STATUSES` and `ENROLLMENT_STATUSES`.

No derived contract qualified: transition maps are lifecycle contracts and
repository arrays are compatibility views. Roles, scopes, actors, capabilities,
CEFR, languages, transitions, workflows, validators, errors, commands,
authority and audit contracts are excluded. Rules, indexes, Storage, Firebase,
runtimes, serializers, queries, cursors, UI and backend were not modified.

## Sources and Git

R3-A, R1/R2/R2-C1, B0/B0-I/03B-A-R1, Domain definitions/consumers, package,
repositories, Rules, fixtures, prechecks and legacy consumers were audited.
Entry: `main`; HEAD = origin/main =
`b68a6fc3ee38b621b278eae586a40b267eb87246`; clean worktree.

## Authority, structure and adapters

Before R3-B, the seven objects were physically defined in three Domain files.
After R3-B their sole definitions are package modules `access.js`,
`registrationRequest.js`, `tenant.js`, `membership.js`, `course.js` and
`enrollment.js`. `domain/index.js` and the package root expose explicit named
exports. The original Domain paths reexport the same instances. Organization
and academic adapters import only the status needed by their still-local
transition map. Direction remains Domain → package; package ↛ Domain/`src`.

## Exact compatibility

| Symbol | Values before/final in order | Frozen | Reference identity |
|---|---|---|---|
| ACCESS_STATES | pending_email_verification, pending_tenant_approval, active, suspended, rejected | true/true | strict equal |
| REGISTRATION_REQUEST_STATUSES | pending, approved, rejected, cancelled, expired | true/true | strict equal |
| TENANT_TYPES | university, academy, school, company | true/true | strict equal |
| TENANT_STATUSES | active, suspended, archived | true/true | strict equal |
| MEMBERSHIP_STATUSES | approved, suspended, removed | true/true | strict equal |
| COURSE_STATUSES | draft, active, archived | true/true | strict equal |
| ENROLLMENT_STATUSES | pending, active, completed, cancelled | true/true | strict equal |

Value, order, casing and freeze drift are zero. Domain/package identity is
preserved for all seven.

## Consumers and Rules parity

Direct consumers remain Domain adapters, six repository validation modules and
Domain workflows/descriptors. Indirect consumers remain serializers,
repositories, tests, prechecks, Rules semantics, Vite and future Functions.
Rules retain explicit persisted-state literals. A package test checks those
literals against the migrated status union; Rules do not import JavaScript.
Fixtures and legacy literals remain non-authoritative. Authoritative physical
duplication for the seven contracts is zero.

## Version and Functions artifact

Version changes `0.1.0` → `0.2.0`: the reserved `./domain` subpath gains seven
compatible public exports, a SemVer MINOR. Root and Functions manifests and
lockfiles were reconciled.

Previous tarball: `mipymetic-saas-contracts-0.1.0.tgz`. Final tarball:
`mipymetic-saas-contracts-0.2.0.tgz`.

```text
SHA-256 = 193c04805e9173d6d8d0d55257e4d4cfdb4a856b12bd5a8b07e959c013a1f3c1
npm shasum = 165bd438504112416433f4555073a22e1f3eeb5f
integrity = sha512-GUHNUrRa9PBHkIXzGUcdqO+URNm5c0IbjSwbvWZYf/8SnkZ7JN+IOn1ut85uSFSIntOgGi/QR5oAyMwJi69LdA==
entries = 25
packed/unpacked = 4852/17038 bytes
```

The manifest lists all entries. Temporary regeneration was byte-identical.
Functions clean install and isolated import passed without the root workspace.
Nothing was published.

## Validation

```text
node --check = PASS
ESLint = PASS
saas-contracts = 15/15 PASS
Identity = 48/48 PASS
Tenant = 31/31 PASS
RegistrationRequest = 59/59 PASS
Membership = 23/23 PASS
Course = 51/51 PASS
Enrollment = 46/46 PASS
Shared = 51/51 PASS
Enrollment precheck = 111/42/69; 42/41/28/0
Course precheck = 114/32/82; 32/56/26/0
Membership precheck = 81/44/37; 44/26/11/0
RegistrationRequest precheck = 52/34/18; 34/14/4/0
Rules preflight = 222/88/134 PASS
general tests = 35/35 PASS
Vite build = PASS
Functions npm ci/import = PASS
artifact reproducibility = PASS
dependency/cycle audit = PASS
git diff --check = PASS
```

No behavioral defect was found. The correction is the planned removal of seven
local definitions in favor of reference-identical reexports.

## Risks and rollback

Residual risks are future literal drift, stale vendor artifact and accidental
cycles; parity, artifact and dependency gates control them. Rollback: revert the
technical commit, restore the seven Domain definitions and empty package Domain
boundary, version `0.1.0`, old tarball, manifests/lockfiles and artifact
manifest, then rerun all validation. No data migration is required.

## State

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-A = completed
SaaS-03B-A-R1 = completed
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I-R1 = completed
SaaS-03B-B0-I-R2 = completed
SaaS-03B-B0-I-R2-C1 = completed
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-A = completed
SaaS-03B-B0-I-R3-B = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = foundational_statuses_migrated
Privileged Backend = not_created
```

Next: `SaaS-03B-B0-I-R3-C — Roles and authority contracts`,
`ready_not_started`. It is not initiated.
