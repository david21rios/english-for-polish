# SaaS-03B-B0-I-R3-C1 — Independent Domain Migration Review

## Decision

`SaaS-03B-B0-I-R3-C1 = completed_pending_human_review_and_push`.

The final independent, fail-closed review of R3 is **COMPLETE**. R3 has one
physical authority for every migrated runtime contract, preserves the Domain
1.2.0 normative surface through explicit adapters, and is reproducible from the
published Git commit. R4 is `ready_not_started`; it was not started here.

## Scope and Git gate

The review was read-and-validate only. Its prerequisites were the published
lint-gate reconciliation (`37c3a21af0409a51972437995745a32527a0aa16`) and the
published deterministic-EOL repair (`a4009fb...`, `702d011...`). At the gate:

- branch: `main`;
- HEAD: `702d011102af531df0ad442e6f31045a88a0a866`;
- `origin/main`: `702d011102af531df0ad442e6f31045a88a0a866`;
- worktree: clean.

No technical file was changed during this review.

## Sources and history reconciled

The review reconciled the implementation order, the R3-A authority inventory,
the final R3-B through R3-H reports, the R3-D-R1 scope resolution, the R3-C1-R1
lint reconciliation, the R3-C1-R2 reproducibility repair, the relevant
Architecture Freeze and ADR/Domain material, the package and Functions
manifests, the vendored artifact, Domain adapters, Shared, SaaS repositories,
Rules preflight inputs, tests, and Git history. Repository state and current
normative documents prevailed over historical checkpoints.

## Final authority matrix

R3 closes with these verified counts:

- 21 runtime contracts physically owned by `@mipymetic/saas-contracts`;
- 12 structural/JSDoc shapes remaining normatively and physically in Domain;
- 6 Domain runtime residuals;
- 9 explicit Domain compatibility adapter modules;
- 0 defective authoritative duplications.

The six runtime residuals are the five complete workflow descriptors, classified
`WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY`, and `APPROVE_REGISTRATION_REQUEST`,
classified `BACKEND_DEFERRED`. The workflows are `TENANT_WORKFLOW`,
`REGISTRATION_REQUEST_WORKFLOW`, `MEMBERSHIP_WORKFLOW`, `COURSE_WORKFLOW`, and
`ENROLLMENT_WORKFLOW`. R3-D did not invent lifecycle contracts or migrate those
descriptors.

The migration-family review passed:

- R3-B: seven foundational status/type contracts, without value, order, casing,
  freezing, or reference-identity drift;
- R3-C: Membership roles, platform roles, capability scopes, and workflow actors,
  preserving the Membership/platform separation;
- R3-D: three access-state contracts and the Membership/Enrollment transition
  maps, within the R3-D-R1 boundary;
- R3-E: 37 unique capability IDs, 37 descriptors, six identity-self
  capabilities, and the role-capability matrix;
- R3-F: `CEFR_LEVELS` remains `A1, A2, B1, B2, C1, C2`; language value objects
  remain structural Domain shapes and BCP 47 has one package authority;
- R3-G: `REPOSITORY_ERROR_CODES` and `RepositoryError` remain Shared/client
  infrastructure, while `COMMON_ERROR_CODES` and `BACKEND_ERROR_CODES` remain
  distinct package-owned declarative contracts;
- R3-H: all residual shapes, workflows, and the backend-deferred descriptor are
  explicitly classified.

All adapters reexport explicitly: they do not clone, refreeze, reconstruct, or
create cycles. The dependency direction remains `Domain -> saas-contracts`; the
package has no import into `src/`.

## Package API and purity

Package version remains `0.6.0`. The explicit public subpaths are `.`,
`./domain`, `./persistence`, `./validation`, `./commands`, `./authority`,
`./audit`, and `./errors`. `src/internal/json.js` is not public. Public barrels
do not use indiscriminate wildcard exports.

The dependency/purity audit passed: zero runtime dependencies, zero Firebase,
React, DOM, filesystem, networking, secret, or repository imports, and zero
cycles.

## Artifact and clean environments

The verified artifact is
`functions/vendor/mipymetic-saas-contracts-0.6.0.tgz`:

- SHA-256: `6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`;
- npm shasum: `a4a6580a36ce66d139aa3362354a18d8e1c2d4fc`;
- integrity: `sha512-TRNmDHBGJhlBsDHAt7VI2BWlgU0hZelGAetdguk8S1zTZAWH0X1f/JfbytUtNtQLkYZVEq4tx6iH16nMDZSLvA==`;
- size: 7,682 bytes;
- inventory: 30 entries, with no tests, `node_modules`, or secrets.

Fresh packs from independent Windows clones using `core.autocrlf=false` and
`core.autocrlf=true` were byte-identical to the vendored artifact. Both produced
the same SHA-256 and size. Native Linux/WSL validation was not available because
WSL is not installed; no Linux PASS is claimed. The repository-controlled LF
policy and opposite Git-setting clones establish the supported checkout result.

A clean checkout passed `npm ci --ignore-scripts`, all 26 package tests, and the
Vite production build (816 modules). Functions passed isolated
`npm ci --ignore-scripts` and all eight root/subpath imports without relying on
the root workspace.

## Validation results

- package tests: 26/26 PASS;
- global Domain and reference-identity parity: PASS;
- five-workflow parity: PASS;
- Shared: 51/51 PASS;
- RegistrationRequest: 59/59 PASS;
- Membership: 23/23 PASS;
- Course: 51/51 PASS;
- Enrollment: 46/46 PASS;
- Enrollment precheck: 111 total, 42 ALLOW, 69 DENY; outcomes 42/41/28/0;
- Course precheck: 114 total, 32 ALLOW, 82 DENY; outcomes 32/56/26/0;
- Membership precheck: 81 total, 44 ALLOW, 37 DENY; outcomes 44/26/11/0;
- RegistrationRequest precheck: 52 total, 34 ALLOW, 18 DENY; outcomes 34/14/4/0;
- Rules preflight: 222 total, 88 ALLOW, 134 DENY, PASS;
- general tests: 35/35 PASS;
- build: PASS;
- Node syntax checks: 111 files, PASS;
- R3-scoped lint: 111 files, 0 errors, 0 warnings;
- `git diff --check`: PASS.

Repository-global lint remains the recorded pre-R3 baseline: 13 errors and 8
warnings in 11 legacy files. The current result, pre-R3 result, and R3 delta are
respectively 13/8, 13/8, and zero. It is reported, not hidden, and is
non-blocking under the published R3-C1-R1 contract.

The clean root installation reported 25 known root-tree vulnerabilities (3 low,
9 moderate, 13 high). The shared package has zero runtime dependencies and the
Functions installation adds only that package. These findings remain
`PREEXISTING_SUPPLY_CHAIN_DEBT`; the R3-attributable vulnerability delta is zero.
The remote npm audit endpoint was unavailable during the isolated Functions
check, so no new remote-audit claim is made; lockfile topology and the one-package
install preserve the already established zero-attributable result.

## Protected state, risks, and rollback

Rules, indexes, Storage Rules, Firebase configuration, UI, Domain, Shared,
repositories, package sources, Functions sources, and the vendored artifact were
not modified. No Firebase remote access, Emulator, deployment, backend work, or
R4 work occurred.

Residual risks are explicitly carried forward: legacy global lint debt, root
supply-chain debt, lack of native Linux validation in this Windows environment,
and the Domain-owned residual contracts classified by R3-H. None represents an
R3-introduced defect.

Rollback for this documentation-only closure is to revert only its documentary
commit. No technical rollback or data migration is involved.

## Final states and next phase

```text
SaaS-03B-B0-I-R3-C1-R1 = completed
SaaS-03B-B0-I-R3-C1-R2 = completed
SaaS-03B-B0-I-R3-C1 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = completed
SaaS-03B-B0-I-R4 = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R4
Privileged Backend = not_created
```

The next action is human review and push of the documentation commit. R4 and
03B-B remain not started.
