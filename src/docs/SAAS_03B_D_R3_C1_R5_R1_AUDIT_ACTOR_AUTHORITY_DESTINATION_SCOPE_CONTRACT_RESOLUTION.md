# SaaS-03B-D-R3-C1-R5-R1 — Audit Actor Authority and Destination Scope Contract Resolution

## Decision

**RESULT A — the contract is closed and the next change is Foundation-only materialization.**
No package, persisted-schema, business-command, Rules, index, Storage or Firebase
configuration change is authorized by this resolution.

This resolution closes `SHARED_FOUNDATION_AUDIT_AUTHORITY_DESTINATION_SCOPE_GAP`
and preserves the originating blocker
`BOOTSTRAP_TENANT_TENANT_AUDIT_AUTHORITY_SCOPE_INVALID`.

## Evidence and reproduced contradiction

The authoritative source order is current Git/code, Implementation Order, the
R4-R1-R1 AuthorityResolution decision, its R4-R1 runtime materialization, the
R2/R3 BootstrapTenant contracts, package audit contracts, Foundation writer,
physical paths and finally Rules as access/routing evidence.

The canonical BootstrapTenant actor is the exact validated human Platform Admin
resolution:

```text
actorType = platform_admin
authority = platform_admin
tenantId = null
roles = [platform_admin]
capabilities = canonical package-owned platform_admin matrix
```

`validateAuthorityResolution` accepts that tuple. Copying it and replacing
`tenantId` with the target Tenant ID is rejected because it is not a canonical
Platform Admin resolution. Nevertheless, current `writeAuditEvent` derives both
persisted `AuditEvent.tenantId` and the physical path from
`authority.tenantId`; the canonical actor therefore selects
`platformAuditEvents`, and only a non-null authority Tenant ID selects a Tenant
audit path. BootstrapTenant currently fabricates precisely the invalid
resolution. The contradiction is confirmed.

## Current persisted audit contract

Audit schema v1 has exactly these 20 required fields:

```text
auditId, commandId, correlationId, actorUid, actorType, authority, tenantId,
level, operation, resourceType, resourceId, result, errorCode, requestedAt,
executedAt, beforeSummary, afterSummary, metadata, schemaVersion
```

Nullable catalog members remain present and unknown fields remain forbidden.
The physical destinations are:

```text
platformAuditEvents/{auditId}
tenants/{tenantId}/auditEvents/{auditId}
```

Published BootstrapTenant contracts require two projections of one business
event: Tenant history at the Tenant root and platform oversight at the platform
root. Other Tenant-root audits may concern Membership, Course, Enrollment or
configuration resources. Therefore `resourceId` is not a routing key and need
not equal the destination Tenant ID.

## Authoritative tenantId semantics

- `AuthorityResolution.tenantId` is solely the actor's authority Tenant scope.
- `AuditEvent.tenantId` is solely the audited Tenant/destination scope: null for
  a platform destination and the validated destination Tenant ID for a Tenant
  destination.
- `resourceType` and `resourceId` identify the audited resource and neither
  grants authority nor determines routing.

The old writer mixed strategies A, B and C. This resolution selects the
compatible intersection of strategies B and C: a Tenant destination denotes the
Tenant scope containing the audited resource. Strategy A cannot represent
platform actors auditing Tenant resources. Strategy D would duplicate actor
scope already preserved in `authority`. Strategy E is unnecessary because the
existing field can carry one unambiguous meaning without a shape change.

This is semantic clarification only. Existing coherent platform records already
use null and coherent Tenant-root records already use the destination Tenant ID.
Audit schema remains v1; no reader cutover or data migration is required.

## Destination and path contract

Future Foundation materialization must introduce the exact closed union:

```text
AuditDestination =
  | { kind: "platform" }
  | { kind: "tenant", tenantId: TenantId }
```

Both variants are exact shape and reject unknown fields. Tenant IDs use the
existing package-owned identifier validator and its `ValidationResult.ok` is
consumed before path construction. Destination is not a nullable flag, boolean,
resource-derived value or second authority system.

| Destination | Physical path | AuditEvent.tenantId |
| --- | --- | --- |
| `{ kind: "platform" }` | `platformAuditEvents/{auditId}` | `null` |
| `{ kind: "tenant", tenantId }` | `tenants/{tenantId}/auditEvents/{auditId}` | `tenantId` |

## Authority/destination coherence

| Actor resolution | Allowed destination | Rule |
| --- | --- | --- |
| human `platform_admin`, actor tenant null | platform | allowed |
| human `platform_admin`, actor tenant null | Tenant T | allowed after command authorization; actor remains platform-scoped |
| human `tenant_admin` | its Tenant T | destination equals actor `tenantId` |
| human `student`/`teacher`, where privileged audit applies | its Tenant T | destination equals actor `tenantId` |
| `system/platform_system`, actor tenant null | platform | allowed |
| `system/platform_recovery`, actor tenant null | platform | allowed for approved operations |
| either current system operator | Tenant | forbidden until explicitly approved later |

A Tenant-scoped actor cannot route to another Tenant or the platform root. A
Platform Admin can route to either root without acquiring Tenant authority. The
writer enforces structural coherence only; command policy owns operation,
capability, target and cross-Tenant authorization. Destination never grants
authorization.

| Case | Actor tenant | Destination | Resource | Event tenant |
| --- | --- | --- | --- | --- |
| Platform Admin → platform resource | null | platform | platform resource/id | null |
| Platform Admin → Tenant T | null | Tenant T | tenant/T | T |
| Platform Admin → subordinate R in T | null | Tenant T | subordinate/R | T |
| tenant_admin → same-Tenant resource | T | Tenant T | resource/id | T |
| student/teacher → same-Tenant resource, if applicable | T | Tenant T | resource/id | T |
| platform_system → platform resource | null | platform | platform resource/id | null |
| platform_recovery → platform resource | null | platform | platform resource/id | null |
| current system operator → Tenant | null | Tenant | forbidden |

## Future writer responsibility and ownership

`writeAuditEvent` must receive an unmodified canonical
`AuthorityResolution` and explicit `AuditDestination`. Before any path or write
it must:

1. call package-owned `validateAuthorityResolution` and consume `.ok`;
2. validate the exact destination union and Tenant identifier;
3. enforce the coherence matrix;
4. derive path and `AuditEvent.tenantId` only from destination;
5. enforce the existing exact audit allowlists and bounds before persistence.

It cannot mutate, normalize or repair authority; inject/remove its Tenant ID;
derive roles/capabilities; infer destination from authority/resource ID; or
duplicate business authorization.

No new package primitive is required. The package already owns authority and
identifier validation, audit fields/literals and persistence paths.
`AuditDestination` is a narrow Foundation orchestration input selecting a
Firestore path, not a persisted domain object. Foundation owns its runtime
validation, error mapping, timestamp and transaction-port write. A future need
by non-Functions consumers would be a separate shared-materialization decision.

Error mapping at this trusted internal boundary is:

- invalid authority: `CONTRACT_VIOLATION`;
- malformed destination or invalid destination Tenant ID: `CONTRACT_VIOLATION`;
- authority/destination incoherence: `CONTRACT_VIOLATION`;
- infrastructure failure: existing approved infrastructure mapping.

No invalid input reaches path construction or persistence.

## BootstrapTenant application and future compatibility

After Foundation materialization, R5 must use:

```text
tenant event:
  authority = canonical Platform Admin (tenantId = null)
  destination = { kind: "tenant", tenantId: targetTenantId }
  resourceType = tenant
  resourceId = targetTenantId

platform event:
  authority = the same canonical Platform Admin
  destination = { kind: "platform" }
  resourceType = tenant
  resourceId = targetTenantId
```

Both retain distinct deterministic IDs, shared command/correlation linkage,
Critical contracts and the atomic aggregate transaction. The model also serves
future Tenant updates/lifecycle and later Membership, RegistrationRequest,
Course and Enrollment audits because destination Tenant is independent of a
subordinate resource ID. It does not authorize or design those commands.

## Security and infrastructure impact

- actor scope, resource scope and routing scope are independent;
- AuthorityResolution is never mutated for routing;
- Tenant actors cannot cross Tenant destinations;
- platform actors may target a Tenant without becoming Tenant-scoped;
- destination, resource ID, claims and audit records never grant authority;
- destination is explicit and validated before path construction.

`firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json`,
`.firebaserc` and `src/firebase.js` require no change. Roots remain backend-only.
There is no package SemVer, persisted-data, Domain or client impact.

## Roadmap and next gate

The published R4 checkpoint is reconciled from
`completed_pending_human_review_and_push` to `completed`; its historical state
remains correct in its original report.

After publication of this resolution, the next minimum phase is unequivocally:

`SaaS-03B-D-R3-C1-R5-R2 — Audit Destination Scope Foundation Materialization`.

Only after R5-R2 publication may R5 repair BootstrapTenant, followed by a new
R3-C1 independent review. No other Tenant command or later phase is authorized.

```text
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1-R1 = completed
SaaS-03B-D-R3-C1-R2-R1 = completed
SaaS-03B-D-R3-C1-R2 = completed
SaaS-03B-D-R3-C1-R3 = completed
SaaS-03B-D-R3-C1-R4-R1-R1 = completed
SaaS-03B-D-R3-C1-R4-R1 = completed
SaaS-03B-D-R3-C1-R4 = completed
SaaS-03B-D-R3-C1-R5-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R1_push_then_foundation_materialization
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```
