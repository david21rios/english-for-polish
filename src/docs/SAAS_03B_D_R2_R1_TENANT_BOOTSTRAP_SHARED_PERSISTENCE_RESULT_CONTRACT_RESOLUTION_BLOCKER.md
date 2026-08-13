# SaaS-03B-D-R2-R1 — Tenant Bootstrap Shared Persistence and Result Contract Resolution Blocker

## Decision

R2-R1 stops with **RESULT D — shared/foundation contradiction discovered**.
No package or Functions materialization is authorized.

The Git Gate passed at published commit
`b48323cb6d3aa169252ee50f799cee3af8a9d1b7`. R1 and R2 remain historical
authority. This resolution distinguishes existing, derivable, unspecified and
conflicting contracts rather than choosing a convenient representation.

## Physical and normative inventory

| Aggregate | Existing/derivable contract | Unresolved/contradictory point |
|---|---|---|
| Tenant | unversioned legacy shape: `tenantId`, `tenantType`, `displayName`, `shortName`, `country`, `locale`, `timezone`, `status`, `createdAt`, `updatedAt`, `suspendedAt`, `archivedAt`; exact-shape, server timestamps | package has field catalogue but no validator; initial active implies null lifecycle timestamps |
| Settings | unversioned shape: `tenantId`, `defaultLocale`, four-boolean `registrationPolicy`, boolean-map `featureFlags`, nullable `supportEmail`, nullable HTTPS `supportUrl`, `updatedAt` | feature-flag bounds remain deferred; no package validator/catalogue |
| Branding | unversioned shape: `tenantId`, nullable `displayName`, `logoUrl`, `faviconUrl`, exact colors `{primary,secondary,accent}`, `updatedAt` | no URL/color runtime strengthening is authorized; no package validator/catalogue |
| Membership | unversioned physical shape: `membershipId`, `tenantId`, `uid`, `role`, `status`, `originRequestId`, `createdAt`, `approvedAt`, `approvedBy`, `updatedAt`, `suspendedAt`, `removedAt` | first-admin origin is not a RegistrationRequest; `originRequestId=null` is derivable from field nullability but must be stated in the bootstrap contract |
| MembershipKey | `uidKey = "u1_" + base64url(UTF-8(uid), no padding)`; fields `tenantId`, `uid`, `membershipId`, `status`, `originRequestId`, `updatedAt` | physical example requires request origin while first-admin has none; null/omission is not specified |
| Tenant-admin authority state | path and fields `tenantId`, `activeCount`, `revision`, `lastCommandId`, `updatedAt`; initial count 1 | schema is unversioned by current contract; initial revision and lastCommandId are not specified |
| Command | v2 exact record and generic seven-field result | Bootstrap payload omits correlationId while command binding requires it; result conflicts as described below |
| Audit | v1 exact generic event; tenant and platform roots required for Bootstrap | exact operation literals, resource types, summaries and metadata are absent |

No `createdBy` or `updatedBy` belongs to Tenant/config shapes: the physical
model explicitly rejects adding them transversally. Tenant starts `active`,
archived is terminal, and no hidden deleted state exists.

## BootstrapTenant input

The approved business payload remains:

```text
{
  commandId,
  tenantId,
  tenant: { tenantType, displayName, shortName, country, locale, timezone },
  settings: { defaultLocale, registrationPolicy, featureFlags, supportEmail, supportUrl },
  branding: { displayName, logoUrl, faviconUrl, colors },
  firstAdminUid,
  expectedAdminEmail,
  initialStatus: "active"
}
```

All fields are required, optional fields are zero, unknown fields and client
actor/role/capability/claims/timestamps/SDK objects are forbidden. Nullable
input values are supportEmail, supportUrl, branding displayName/logoUrl/faviconUrl.
Identifiers use package document-ID validation. Email is normalized evidence,
must match enabled verified Auth plus Identity, and is never persisted in
command/audit. No membershipId is accepted from input; it is generated as an
independent opaque ID before the transaction. No environment, project,
confirmation or approval field is approved.

**Conflict:** command schema v2 requires correlationId, while the exact R1
BootstrapTenant payload omits it. Sources do not decide whether it is a required
top-level input or server-generated envelope field.

## First-admin Membership and MembershipKey

Membership identity is **B: generated independently** before the transaction;
it is not UID-derived, not the key, and not client-provided. Initial values are
role `tenant_admin`, status `approved`, originRequestId `null`, timestamps
server-owned, approvedBy the authenticated platform actor, and lifecycle
timestamps null.

The canonical uidKey algorithm is already closed by FPM-001:

```text
u1_<base64url(UTF-8(uid), no-padding)>
```

It is versioned, deterministic, reversible, path-safe and collision-free for
distinct UTF-8 UID byte sequences. It is tenant-local by path: the same UID in
different Tenants yields the same document ID under different parents.

Key collision semantics derivable from existing contracts:

| Condition | Meaning |
|---|---|
| same Tenant/UID and exact same Membership under exact succeeded command | replay |
| same Tenant/UID key pointing to a foreign Membership | `CONTRACT_VIOLATION`; never choose silently |
| different UID producing same canonical key | impossible for canonical encoding; observed mismatch is `CONTRACT_VIOLATION` |
| new command against an existing valid key/Membership | `ALREADY_EXISTS`, not replay |
| malformed key document | `CONTRACT_VIOLATION` |

**Conflict:** MembershipKey's normative physical shape requires
`originRequestId`, but first-admin bootstrap has no request. Neither null nor
field omission is approved for the key document.

## Tenant-admin authority state

The local fields are exactly `tenantId`, `activeCount`, `revision`,
`lastCommandId`, `updatedAt`, with unknown fields rejected and a server-owned
timestamp. No schemaVersion is present in the published contract, so it is an
explicit legacy-unversioned shape, not an accidental version invention.

Bootstrap requires `activeCount=1`. Count non-negativity and exact shape belong
to the validator; count coherence with approved tenant_admin Memberships and
last-admin rejection belong to cross-document transaction policy.

**Gap:** initial `revision` and `lastCommandId` have no normative tuple. R2-R1
cannot choose `0/null`, `1/commandId`, or another combination.

## Aggregate and atomicity

One Firestore transaction must read Platform Authority/Registry, target
Identity, command and every target/collision path, then write:

1. `tenants/{tenantId}`;
2. `configuration/settings`;
3. `configuration/branding`;
4. `memberships/{membershipId}`;
5. `membershipKeys/{uidKey}`;
6. `authorityState/tenantAdmins`;
7. `privilegedCommands/{commandId}`;
8. `tenants/{tenantId}/auditEvents/{auditId}`;
9. `platformAuditEvents/{auditId}`.

All reads precede writes; Tenant root absence is the primary same-tenant
contention point. IDs are precomputed, callback retry is deterministic, and no
Auth/network/randomness/process-clock authority occurs inside it. Auth is read
evidence only; Auth writes are zero. One winner commits the complete aggregate;
every loser writes zero documents.

The zero-write failures map as follows:

| Condition | Code |
|---|---|
| invalid shape/identifier | `INVALID_ARGUMENT` |
| unauthenticated actor | `UNAUTHENTICATED` |
| missing/inactive Platform Authority or missing capability | `FORBIDDEN` |
| missing actor/first-admin evidence | `FAILED_PRECONDITION` |
| malformed Identity/Authority/Registry/Tenant/key/state/command | `CONTRACT_VIOLATION` |
| existing Tenant or independently existing Membership | `ALREADY_EXISTS` |
| foreign MembershipKey or malformed collision | `CONTRACT_VIOLATION` |
| same command with payload/correlation mismatch | `CONFLICT` |
| committed-state contention after bounded retry | `CONFLICT` |
| infrastructure | `UNAVAILABLE`; unexpected internal boundary `INTERNAL/UNKNOWN` |

## Result contradiction

The command's principal resource is the Tenant aggregate, so operation is
`BootstrapTenant`, resourceId would be tenantId, status `succeeded`, and no PII
or aggregate snapshots are permitted.

However, two authoritative requirements conflict:

1. SaaS-03B-A-R1 says the independently generated membershipId is stored in the
   command result for idempotent replay.
2. The current generic result is exact and has only seven fields, leaving no
   membershipId field.

Choosing `resourceId=membershipId` would misidentify the command's principal
Tenant target; choosing `resourceId=tenantId` loses the explicitly required
membershipId outcome. Extending the result violates the exact seven-field
contract. Therefore `BOOTSTRAP_TENANT_RESULT_ENVELOPE_CONTRADICTION` blocks
resolution.

## Audit and stage gaps

Both tenant and platform audit roots are required: the first establishes Tenant
history; the second records the platform-authority creation action. Both are
Critical and target the Tenant aggregate. Email, raw payload/config, Identity,
claims, credentials, approval artifacts, secrets and stacks are prohibited.

Exact operation literals, resourceType, bounded before/after summaries and
metadata allowlists remain unspecified. They cannot be invented locally.

BootstrapTenant is Firestore-only and can atomically reach
`succeeded/completed`; no persisted prepared checkpoint or recovery_required is
needed. Command schema v2 can represent the final record, but BootstrapTenant is
not in the current privileged stage allowlist. Exact command-stage authorization
must follow resolution of its envelope/result contract; no new stage or schema
version is justified.

## Idempotency and concurrency

Behavioral hash includes commandType and every normalized business input that
affects behavior, excluding correlationId. Whether expectedAdminEmail is hashed
as normalized verification input or excluded as confirmation evidence is not
stated for BootstrapTenant and remains part of the envelope resolution.
Correlation binds independently once its source is resolved. Exact succeeded binding replays;
payload/correlation mismatch conflicts. A new command against an existing
Tenant/Membership/key is `ALREADY_EXISTS`, never automatic replay.

Concurrent same tenant/different commands: one winner, loser zero-write and
`ALREADY_EXISTS` or bounded-contention `CONFLICT` according to the committed
reread. Same command/exact binding replays. Different Tenants may bootstrap the
same first-admin UID independently because Membership authority is tenant-local.

## Validator ownership and Rules

Future package-owned validators: Tenant, Settings, Branding, MembershipKey and
tenant-admin authority state. Bootstrap input composition may live in Functions
only after the shared shapes are package-owned. Domain enums must be reused.

| Surface | Classification |
|---|---|
| Tenant lifecycle Rules | `CURRENT_RULES_COMPATIBLE` |
| first tenant_admin Membership lookup | `CURRENT_RULES_COMPATIBLE` |
| MembershipKey | `CURRENT_RULES_COMPATIBLE` for reads; backend writes remain denied |
| authorityState | `UNKNOWN_PENDING_IMPLEMENTATION_EVIDENCE`; backend-only |
| Settings/Branding | `CURRENT_RULES_COMPATIBLE` for existing read gates; client writes denied |
| indexes | no impact |
| Storage | no impact |
| Firebase config | no impact |

No Rules change is part of this resolution.

## Blocking resolution and state

The contradictions are inside R2-R1 but require an explicit subordinate
decision before it can close. The minimum next phase is:

`SaaS-03B-D-R2-R1-R1 — BootstrapTenant Command Envelope, MembershipKey Origin and Result Contract Resolution`.

It must decide correlationId ownership, first-admin MembershipKey
originRequestId, authority-state initial revision/lastCommandId, exact result and
audit literals. It remains documentation-only.

```text
SaaS-03B-C = completed
SaaS-03B-D-R2-R1 = blocked_pending_R2_R1_R1
SaaS-03B-D-R2 = blocked_pending_R2_R1_resolution
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_contract_completion
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

No technical materialization, business command, handler, UI, Rules, remote
Firebase operation or deployment occurred.
