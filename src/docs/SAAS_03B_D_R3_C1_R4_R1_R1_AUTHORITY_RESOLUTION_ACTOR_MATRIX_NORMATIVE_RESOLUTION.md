# SaaS-03B-D-R3-C1-R4-R1-R1 — Authority Resolution Actor Matrix Normative Resolution

## Decision and scope

This documentation-only resolution closes
`NORMATIVE_AUTHORITY_RESOLUTION_MATRIX_GAP` with **RESULT A**. It does not add
a validator, change the contracts package, modify Functions, repair the Tenant
Bootstrap Store, implement another command, use Firebase remotely or deploy.

The authoritative sources are current Git and code, package 0.13.0, the
Implementation Order, Architecture Freeze and ADR lineage, the privileged
backend contract/foundation, the published Platform command lineage and the
BootstrapTenant lineage. Tests are evidence of current composition, not an
independent source of authority.

## Fundamental model

The normative model is a closed discriminated union with a common six-field
wire shape:

```text
ResolvedAuthority = HumanAuthorityResolution | SystemOperatorResolution

exact fields, all required:
actorUid, actorType, authority, tenantId, roles, capabilities

optional fields: 0
unknown fields: rejected
```

`actorType` is the discriminator. Keeping the six-field shape avoids needless
persisted Command/Audit churn while preventing human roles and technical
operators from sharing an open authority namespace. A TypeScript type is never
runtime evidence.

## Actor and authority matrix

| Variant | actorType | authority | tenantId | roles | capability source | Allowed |
|---|---|---|---|---|---|---|
| human platform | `platform_admin` | package `PLATFORM_ROLES.PLATFORM_ADMIN` | exactly `null` | exactly `[authority]` | exact package `ROLE_CAPABILITY_MATRIX.platformRoles[authority]` | yes |
| human tenant | `identity` | one package `MEMBERSHIP_ROLES` value | valid Tenant document identifier | exactly `[authority]` | exact package `ROLE_CAPABILITY_MATRIX.membershipRoles[authority]` | yes |
| technical bootstrap/system | `system` | `platform_system` | exactly `null` | exactly `[]` | exactly `[]` | yes, only from an approved server-side operator adapter |
| technical recovery | `system` | `platform_recovery` | exactly `null` | exactly `[]` | exactly `[]` | yes, only for the approved Recover operator boundary |

Every other combination is forbidden. `system` is not a human role,
`platform_system` is not a business capability, and `platform_recovery` does
not grant Platform Admin authority.

### Actor type catalogue

The future portable catalogue has exactly, in this order:

```text
IDENTITY = "identity"
PLATFORM_ADMIN = "platform_admin"
SYSTEM = "system"
```

`identity` means an authenticated human whose authority is derived from an
approved Membership in one Tenant. `platform_admin` means an authenticated
human backed by an active persisted Platform Authority. `system` means a
trusted backend operator constructed by an explicitly approved non-public
adapter. Unknown values fail closed.

### Human authority and scope

`HumanAuthorityResolution` has the exact common six fields. `actorUid` is a
valid package document identifier and is derived from authenticated server-side
context. A platform human has `actorType=platform_admin`, authority
`platform_admin`, null Tenant scope, singleton role and the complete Platform
Admin capability matrix. A tenant human has `actorType=identity`, authority
equal to the validated Membership role, a valid non-null Tenant ID, singleton
role and the complete matrix for that Membership role.

The currently authorized tenant roles are exactly `student`, `teacher` and
`tenant_admin`. `roles` is effective derived evidence, not caller-controlled
role aggregation. It is always the singleton `[authority]` for a human
resolution. Multiple, missing, duplicate, reordered or foreign roles are
invalid.

Capabilities use **EXACT_CANONICAL_ARRAY**, not subset or authorized superset.
The array must match the package matrix for the resolved role by length, value
and order. The package matrix order is canonical. Missing, extra, reordered,
duplicate or unknown capabilities are invalid. Validation compares without
sorting or mutating input.

Tenant scope is authorization scope, not merely the command target. A platform
human remains globally scoped with `tenantId=null` even when a command targets
a Tenant. A tenant human must carry the exact valid Tenant ID from persisted
Tenant/Membership evidence.

### System operators

`SystemOperatorResolution` retains the exact common six fields for compatibility,
with `actorType=system`, null Tenant scope, and exact empty `roles` and
`capabilities`. Empty arrays are valid only for these two closed technical
authorities. Technical execution is authorized by the approved adapter,
ceremony and command boundary—not by injecting a business capability.

`actorUid` remains required and must satisfy the package document-identifier
grammar. It is a stable, server-owned operator identifier configured or
constructed by the approved adapter; it is never accepted from command input.
This resolution does not invent a persisted service-principal document.

The technical authority catalogue is exactly, in this order:

```text
PLATFORM_SYSTEM = "platform_system"
PLATFORM_RECOVERY = "platform_recovery"
```

`platform_system` is both the existing conceptual
`WORKFLOW_ACTORS.PLATFORM_SYSTEM` value and the authority of the approved
BootstrapPlatformAdmins operator. Its presence alone authorizes nothing.

`platform_recovery` is a command-specific system-operator authority for the
out-of-band RecoverPlatformAdmin execution boundary. It is **not** a workflow
actor, Platform role or alias for `platform_system`. It belongs in the new
technical authority catalogue rather than `WORKFLOW_ACTORS`. No other `system`
authority is authorized.

## Current command classification

- `BootstrapPlatformAdmins`: `SystemOperatorResolution/platform_system`; the
  created Platform Admin targets are not the operator.
- `RecoverPlatformAdmin`: `SystemOperatorResolution/platform_recovery`; approval
  evidence and the recovered target are separate.
- `RevokePlatformAdmin`: human platform resolution reconstructed from
  authenticated Identity and active persisted Platform Authority.
- `BootstrapTenant`: the same human platform variant plus a separate command
  authorization check for package capability `platform.tenant_create`.
- future UpdateTenant commands can use the human tenant variant with
  `tenant_admin`; future Suspend/Restore/Archive commands reuse the human
  platform variant. Their payload contracts remain outside this resolution.

Current `resolvePlatformAuthority` and `resolveTenantAuthority` outputs already
match the human variants. Current Bootstrap and Recover operator fixtures match
the technical variants, but later materialization must replace fixture-shaped
trust with approved Foundation construction and runtime validation. No existing
persisted Command/Audit field needs migration: their actor scalars remain
compatible, while roles/capabilities are not persisted in those schemas.

## Validation and trust policy

Future validators are pure, non-throwing, exact-shape,
`ValidationResult`-based and fail closed. They do not normalize, lowercase,
sort, deduplicate, default, heal or accept metadata. Successful results and
issues follow the package frozen-result convention.

The package validator reports the existing invalid-value/argument issue form.
Functions maps malformed composed or persisted evidence to
`CONTRACT_VIOLATION`; an authenticated caller lacking required authoritative
evidence/capability maps to `FORBIDDEN` or the approved command-specific
precondition. No error code is added.

A valid resolution is never created from client fields. Foundation first
derives it from Auth, Identity, Platform Authority or Tenant/Membership
evidence, or from an approved technical operator adapter, then invokes runtime
validation. Claims and payload roles/capabilities/authority remain
non-authoritative.

### Required executable matrix

Later tests must reject non-object values; every missing field; unknown fields;
malformed actor/tenant identifiers; unknown actor type or authority;
human/system cross-family authorities; platform human with Tenant scope; tenant
human with null/foreign/malformed scope; missing, extra, duplicate, unknown or
reordered roles/capabilities; system operators with non-empty arrays or Tenant
scope; `platform_recovery` impersonating Platform Admin; and a valid capability
injected into an incoherent resolution.

Positive cases cover Platform Admin, student, teacher, tenant_admin,
platform_system and platform_recovery using synthetic identifiers only.

## Materialization plan

The package is physical authority for portable catalogues and validation:

- `AUTHORITY_ACTOR_TYPES` with the three ordered values above;
- `SYSTEM_OPERATOR_AUTHORITIES` with the two ordered values above;
- public discriminated declarations for human, system and union forms;
- exact validators consuming existing identifier, role and capability matrices;
- complete positive/negative package tests.

Names follow existing uppercase-catalogue and `validateX` conventions. The union
validator is `validateAuthorityResolution`; reusable variant validators may be
exported if required by implementation. An existing suitable authority/root
surface is preferred over an unnecessary new subpath.

Functions Foundation remains responsible for reconstructing evidence and
mapping ValidationResult failures. It consumes package catalogues and validators
without redeclaring matrices. Store-specific and BootstrapTenant-specific
authority validators are forbidden.

These are additive public APIs, so expected SemVer is MINOR from 0.13.0; the
exact version is selected during materialization. Existing workflow actors are
not reinterpreted. No persisted schema version, Rules, indexes, Storage or
Firebase configuration change is required.

## Roadmap and next gate

The published R3-C1-R3 documentation commit is an ancestor of `main`; its prior
`completed_pending_human_review_and_push` state was correct before push and is
now reconciled to `completed` without rewriting history.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R4-R1 = blocked_pending_R1_R1_push_then_materialization
SaaS-03B-D-R3-C1-R4 = blocked_pending_R4_R1_materialization
SaaS-03B-D-R3-C1 = blocked_pending_R4_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume only `SaaS-03B-D-R3-C1-R4-R1 — Authority
Resolution Runtime Contract Resolution and Materialization`. R4 Store repair,
independent review and later Tenant workflows remain blocked.
