# SaaS-03B-B0-I-R3-C1-R2 — Artifact Reproducibility Repair

## Purpose and scope

This microphase repairs the byte-reproducibility blocker found by the
independent R3-C1 review. It changes no Domain contract, package API, business
logic, dependency or package version. R4 and the privileged backend remain not
started.

## Baseline and root cause

Initial Git state was clean on `main`, with local HEAD and `origin/main` at
`37c3a21af0409a51972437995745a32527a0aa16`.

The historical vendored artifact was:

```text
filename = mipymetic-saas-contracts-0.6.0.tgz
SHA-256 = 6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2
npm shasum = a4a6580a36ce66d139aa3362354a18d8e1c2d4fc
size = 7682 bytes
entries = 30
```

Before repair, a clean checkout with `core.autocrlf=true` generated 7706 bytes,
SHA-256 `fb97a13f745b1d43c129ad5ede084af374330bd8a5564fa7a5258038f69cfe1d`
and npm shasum `e51a72334f27ae9b7237b2665467675a3246511d`.

The repository had no `.gitattributes`. System Git configuration set
`core.autocrlf=true`; `core.eol` and `core.safecrlf` were unset. All 30 textual
files in the package tarball were LF in Git blobs, the current worktree and the
vendored artifact. All 30 became CRLF in a clean `core.autocrlf=true` checkout,
while a `core.autocrlf=false` checkout remained LF and matched the artifact.

File-by-file blob, worktree, clean-checkout and extracted-artifact hashes showed
that EOL conversion was the only content difference. Packlist and order stayed
at 30 entries, file modes were unchanged, and repeated packs from identical
bytes were byte-exact. This eliminates packlist, tar/gzip timestamp, ordering,
mode and npm metadata as root causes.

## Solution

Selected decision: `SOLUTION_A — Repository EOL policy sufficient`.

The repository now declares:

```gitattributes
packages/saas-contracts/** text eol=lf
```

The package inventory contains only text files; the vendored `.tgz` is outside
this path. No binary is normalized. Git blobs already used canonical LF, so no
source renormalization or semantic source diff was necessary.

A package-topology regression test reads every file in the artifact inventory
from package source and rejects CRLF bytes. This is small, portable and requires
no new dependency or CI workflow.

## Package, artifact and SemVer

- Package version remains `0.6.0`; EOL/build determinism adds no API or semantic
  change.
- No packaging script was required.
- Regeneration after the policy produces the existing canonical artifact
  byte-for-byte, so the vendored tarball, artifact manifest and Functions
  lockfile require no content change.
- Canonical SHA-256:
  `6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`.
- Canonical npm shasum:
  `a4a6580a36ce66d139aa3362354a18d8e1c2d4fc`.
- Canonical integrity:
  `sha512-TRNmDHBGJhlBsDHAt7VI2BWlgU0hZelGAetdguk8S1zTZAWH0X1f/JfbytUtNtQLkYZVEq4tx6iH16nMDZSLvA==`.
- Canonical size: 7682 bytes; 30 entries; tests, `node_modules` and secrets
  excluded.

## Reproducibility evidence

Independent indexed checkouts with `core.autocrlf=false` and
`core.autocrlf=true` both produced the canonical SHA-256, shasum, size and
inventory. Extracted file hashes match for all 30 entries. The normalized
current worktree produces the same bytes.

Native Windows validation passed. WSL/native Linux was not available, recorded
as `NATIVE_LINUX_NOT_AVAILABLE`; the `eol=lf` policy and the independent LF
checkout provide the repository-controlled Linux-equivalent byte input, but no
native Ubuntu PASS is claimed.

A clean indexed checkout using `core.autocrlf=true` passed `npm ci
--ignore-scripts`, 26 package tests and the Vite build. Its Functions directory
passed isolated `npm ci --ignore-scripts`, reported zero vulnerabilities and
imported the root plus all seven public subpaths without the root workspace.

## Regression results

- Package tests: 26/26 PASS.
- Domain and workflow parity: PASS; value/order/casing/freezing/reference drift
  remain zero.
- Shared: 51/51 PASS.
- RegistrationRequest: 59/59 PASS.
- Membership: 23/23 PASS.
- Course: 51/51 PASS.
- Enrollment: 46/46 PASS.
- Prechecks: Enrollment 111/42/69; Course 114/32/82; Membership 81/44/37;
  RegistrationRequest 52/34/18 — all canonical outcomes preserved.
- Rules preflight: 222/88/134 PASS.
- General tests: 35/35 PASS.
- Build: PASS.
- Node checks: 111 files PASS.
- R3-scoped lint: PASS.
- Dependency/purity/cycle audits: PASS; zero runtime dependencies and cycles.
- `git diff --check`: PASS.

The root npm audit baseline remains 25 findings (3 low, 9 moderate, 13 high),
classified as pre-existing supply-chain debt. The package and isolated
Functions install introduce zero attributable vulnerabilities. No audit fix or
dependency update was performed.

## Risks and rollback

Native Linux validation remains a future CI/review confirmation because no WSL
distribution was available. The repository policy is nevertheless explicit
and independent of developer-global Git configuration.

Rollback: remove the package EOL rule and regression test. The artifact,
manifest, lockfiles, package source, version and contracts need no rollback
because their canonical content did not change.

## States and next action

```text
SaaS-03B-B0-I-R3-C1-R2 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C1 = blocked_pending_R2_push_and_revalidation
SaaS-03B-B0-I-R3 = not_closed
SaaS-03B-B0-I-R4 = blocked
SaaS-03B-B = blocked_pending_B0_I_R3_R4
```

Decision: `COMPLETE`. After human review and push, R3-C1 must be revalidated.
R4 is not started.
