# SaaS-03A.2A — Tenant shell repository

## Purpose and scope

This phase implements only the client-safe point read for the Tenant root at
`tenants/{tenantId}`. The repository remains in expand/shadow mode, receives
all Firestore dependencies explicitly and has no UI, Auth-global, legacy,
Storage, backend or remote Firebase integration.

## Current Rules contract

The local Rules permit `get` only when the caller has a canonical `approved`
Membership for the same Tenant and the Tenant is `active` or `suspended`.
Archived Tenants are denied. Tenant `list`, create, update and delete are
unconditionally denied. Both `configuration/settings` and
`configuration/branding` deny all client reads and writes. There is no direct
client `platform_admin` bypass.

The repository does not pre-resolve Membership or authorization data. Rules
remain the final authority.

## Physical contract

The normative physical model contains twelve exact fields:

| Field | Type | Contract |
| --- | --- | --- |
| `tenantId` | string | required, equal to document ID, immutable |
| `tenantType` | enum string | required: university/academy/school/company |
| `displayName` | string | required, read-only here |
| `shortName` | string | required, read-only here |
| `country` | string | required, read-only here |
| `locale` | string | required, read-only here |
| `timezone` | string | required, read-only here |
| `status` | enum string | required: active/suspended/archived |
| `createdAt` | timestamp | required, immutable |
| `updatedAt` | timestamp | required, backend-authoritative |
| `suspendedAt` | timestamp or null | conditional; required and non-null when suspended |
| `archivedAt` | timestamp or null | conditional; required and non-null when archived |

The last two lifecycle fields are present in the physical model although the
pure Domain Tenant shape exposes only its ten canonical business fields. They
must remain in the strict persistence allowlist so valid stored documents are
not rejected. They are conditional rather than universally required: absence
and `null` both express that the transition has not occurred. Active Tenants
may retain historical `suspendedAt` but cannot have a non-null `archivedAt`.
Suspended Tenants require a non-null `suspendedAt` and cannot have a non-null
`archivedAt`. Archived Tenants require a non-null `archivedAt` and may preserve
historical `suspendedAt`.

The ten business fields are always required. `suspendedAt` and `archivedAt`
are the only optional and nullable physical fields. Strings are type-checked and preserved without
silent normalization; stricter ISO country, BCP 47 and IANA validation remains
a separately approved contract concern.

## Serialization and API

`serializeTenantSnapshot()` requires an existing plain-object snapshot, the
exact allowlist and every required field. It validates
`snapshot.id === data.tenantId`, TenantType, TenantStatus and lifecycle
coherence, converts all timestamps to UTC ISO-8601 strings, preserves approved
nulls and returns a new frozen object without SDK references.

`createTenantRepository({ db, sdk })` requires only injected `doc` and `getDoc`
functions and returns the frozen API `{ getTenant }`. `getTenant(tenantId)`
validates the explicit ID, performs exactly one point read, serializes the
result, maps Firebase errors and returns no raw SDK data. An absent snapshot is
`NOT_FOUND`.

There is no list, create, update, delete, lookup, lifecycle, Settings,
Branding, platform-admin or tenant-admin method. The repository does not query
Membership, membershipKeys, Identity or configuration documents.

## Tests

Thirty-one pure unit tests cover all three statuses, lifecycle timestamps,
nullability, exact fields, type and enum failures, ID consistency, immutability,
the one-read repository path, Firebase error mapping, dependency failures and
the single-export public API. They use explicit mocks and no Emulator or
remote service.

Future Firestore-only runtime coverage is designed but not implemented here:
approved Membership with active/suspended Tenant allowed; archived Tenant,
missing/suspended/removed Membership, cross-tenant, anonymous, list,
platform-admin direct access, writes, Settings and Branding denied. The current
Rules require Membership status exactly `approved`; a suspended Membership is
therefore denied.

## SaaS-03A.2B — Tenant Settings and Branding access

```text
SaaS-03A.2B = deferred_pending_rules_and_access_policy
```

Current client Rules deny direct access to both fixed configuration documents.
No dead serializer or repository code was created. Branding URLs remain
external URLs or null under `CURRENT_SAAS_STORAGE_POLICY = NO_STORAGE`.

## Risks, exclusions and next phase

Full country/locale/timezone syntax validation remains deferred to an exact
approved contract. Authorization runtime is deferred to a later isolated
Firestore Emulator phase. Settings/Branding require an explicit access-policy
and Rules phase before repository implementation.

This phase excludes writes, global lists, privileged commands, UI, Providers,
migration, dual-write, Cloud Functions, Storage, AI providers and deployment.

```text
SaaS-03A = in_progress
SaaS-03A.2 = in_progress
SaaS-03A.2A = completed
SaaS-03A.2A-C1 = completed_pending_human_push
SaaS-03A.2B = deferred_pending_rules_and_access_policy
SaaS-03A.3 — RegistrationRequestRepository = ready_not_started
```

SaaS-03A.3 was identified but not started.
