# SaaS-03B-C-R1-R1 — Shared Revoke Platform Authority Capability Contract Resolution

## Decision

`SaaS-03B-C-R1` completed the normative `RecoverPlatformAdmin` and
`RevokePlatformAdmin` command contracts but found no package-owned capability
whose semantics exactly authorized ordinary platform-authority revocation.
No prior identifier existed, so this subordinate resolution is
`SaaS-03B-C-R1-R1`.

The existing catalogue contained 37 capabilities. None was reusable. The
approved addition is:

```text
constant: PLATFORM_AUTHORITY_REVOKE
id: platform.authority_revoke
scope: platform
resource: platform_authority
description: Revoke an active platform authority through the approved privileged command.
assignment: platform_admin only
```

The ID follows the catalogue's `<namespace>.<resource_action>` vocabulary. The
platform scope follows the cross-tenant authority root. The descriptor uses the
existing shape and resource vocabulary without adding a package surface.

## Semantic boundary

The capability authorizes attempting ordinary `RevokePlatformAdmin`. It does
not authorize bootstrap, break-glass recovery, arbitrary role assignment,
tenant/member/course/enrollment administration, generic Auth mutation, or
bypass of the `activeCount > 1` last-admin precondition. Recovery remains an
out-of-band two-person ceremony with no role capability.

## Catalogue and matrix delta

| Contract | Before | After |
|---|---:|---:|
| `CAPABILITY_IDS` | 37 | 38 |
| `CAPABILITIES` | 37 | 38 |
| `IDENTITY_SELF_CAPABILITIES` | 6 | 6 |
| student assignments | 5 | 5 |
| teacher assignments | 8 | 8 |
| tenant_admin assignments | 23 | 23 |
| platform_admin assignments | 8 | 9 |

The membership-role delta is zero and the platform-admin delta is one. The new
entry follows `platform.identity_read`, preserving platform grouping. IDs and
descriptors remain unique and deeply frozen; prior values, order, casing and
references remain unchanged.

## Authority, API, types and version

Domain 1.2.0 remains normative authority. Physical authority remains the
existing `@mipymetic/saas-contracts/domain` catalogue and matrix, with Domain
historical modules as explicit compatibility adapters. No second definition,
new export subpath, wildcard export or internal export was introduced.

This backward-compatible public catalogue addition advances SemVer from
`0.6.1` to `0.7.0`. Canonical declaration generation updated inferred literal
unions and the matrix tuple; declarations were not hand-edited. Strict
consumers resolve the constant without `any`, casts or ambient declarations.

## Artifact and Functions cutover

Functions consumes the sole canonical artifact
`mipymetic-saas-contracts-0.7.0.tgz`. The obsolete `0.6.1` artifact was removed
after confirming zero legitimate consumers.

```text
SHA-256: cc01ad1a89c3773500c0f56561da6b5100af75328ecfbd2e940fe6266494b7e1
npm shasum: ed673ddc78984e651c6556ecb15e00a5f5d54a2b
integrity: sha512-D1PSg+EoCB7QQuI6LIKsXmQDy4u5EjCUPJ21zzadwm7vGWo9dT0cV+mMOtvqan7/1y6HjFRsFjH6ad/ONGyiPg==
size: 13300 bytes
entries: 58
```

The inventory contains README, package metadata, runtime source and generated
declarations only. Tests, `node_modules`, build metadata, temporaries and
secrets are excluded. The LF repository policy is unchanged. Independent fresh
packing is byte-identical to the vendored artifact.

## Validation

- declaration build/check and byte-exact generated comparison: PASS;
- package tests/topology: 29/29 PASS;
- exact ID/descriptor, uniqueness, deep freeze and platform-only assignment: PASS;
- Domain/reference and five-workflow parity: PASS;
- package purity, zero runtime dependencies and zero cycles: PASS;
- isolated runtime and strict type consumption: PASS;
- Functions clean install, TypeScript build, 22/22 tests and ESM import: PASS;
- Shared 51/51; repositories 59/59, 23/23, 51/51 and 46/46: PASS;
- four prechecks and Rules preflight 222/88/134: PASS;
- general tests 35/35 and production build: PASS;
- package/Domain and Functions scoped lint: PASS;
- global lint remains the legacy baseline, 13 errors and 8 warnings;
- protected Rules, indexes, Storage and Firebase configuration: unchanged.

No Rules literal is required because the first consumer is backend-internal.
No command, workflow, UI, remote Firebase operation, Emulator or deploy was
introduced.

## Risk, rollback and next gate

The risk is accidental interpretation as recovery or last-admin bypass; the
descriptor, platform-only assignment and semantic boundary prevent that. A
rollback reverses the catalogue/matrix addition, declarations, version and
lockfiles, Functions artifact cutover and these documents.

```text
SaaS-03B-C-R1-R1 = completed_pending_human_review_and_push
SaaS-03B-C-R1 = completed
SaaS-03B-C = blocked_pending_shared_gap_push
SaaS-03B-D = blocked
SaaS-03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, `SaaS-03B-C` is `ready_to_implement`. This
microphase did not start its implementation.
