# SaaS-03B-D-R1 — Tenant Bootstrap and Lifecycle Command Contract Reconciliation

## Decision and lineage

No published `SaaS-03B-D-R*` identifier existed. This is therefore
`NEW_RESOLUTION_IDENTIFIER_REQUIRED`; the minimum genealogically consistent
identifier is `SaaS-03B-D-R1`.

The result is **RESULT C + D**: normative gaps remain and 03B-D must be an
ordered sequence rather than one undifferentiated implementation. This phase is
documentation-only and implements no Tenant command.

Commit `9d09725345917760c57cb76b5069b7fc18d9b0dd` published the aggregate
03B-C closure. Its former pending state was correct before push; this resolution
advances the derived state only to `SaaS-03B-C = completed`.

The source hierarchy is current Git/code, Implementation Order, SaaS-03B-A-R1,
Architecture Freeze/ADRs, Firestore write/persistence contracts, then earlier
audits. It fixes the phase name as `Tenant/first-admin bootstrap/lifecycle` and
assigns exactly seven workflows:

1. `BootstrapTenant`;
2. `UpdateTenantProfile`;
3. `UpdateTenantSettings`;
4. `UpdateTenantBranding`;
5. `SuspendTenant`;
6. `RestoreTenant`;
7. `ArchiveTenant`.

RegistrationRequest/Membership commands remain in 03B-E. Course commands and
Enrollment-after-policy remain in 03B-F. Invitations, UI, public handlers,
remote Firebase and deployment remain out of scope.

## Structural resolution

| Family | Authority | Atomic shape | Decision |
|---|---|---|---|
| Tenant/first-admin bootstrap | platform admin | Tenant, two config docs, Membership, key, authority state, command and two audits | dedicated implementation and review after shared materialization |
| Profile/settings/branding | same-tenant approved tenant admin | three distinct field-owned Tenant/config mutations | separate update sequence after exact payload closure |
| Suspend/restore/archive | platform admin | terminal-aware Tenant lifecycle transitions | separate lifecycle sequence and contention review |

The families differ in actors, capabilities, payloads, roots, replay and
concurrency. No implementation identifiers are assigned prematurely. R2 must
first close/materialize shared contracts; later implementation identifiers are
assigned only after R2 review/push.

## Common contract boundary

- Inputs are exact allowlisted objects. Unknown fields, SDK objects and client
  actor/authority/role/capability/claims/timestamps/metadata are forbidden.
- All IDs use package document-identifier validation; empty, whitespace, `.`,
  `..` and slash-containing values fail before path construction.
- Actors derive from authenticated server context; claims are not authority.
- Persisted snapshots require normalization plus package runtime validation.
- Server-owned timestamps never come from input.
- Commands bind immutable commandId, correlationId and canonical payload hash
  under command schema v2; audit is atomic with authoritative Firestore writes.
- Transaction callbacks perform reads before writes and contain no Auth,
  network, randomness or authoritative process-clock values.
- Exact succeeded binding replays; payload/correlation mismatch conflicts.
- The stable result baseline has exactly `commandId`, `correlationId`,
  `operation`, `resourceType`, `resourceId`, `status`, `replayed`.

`NOT_SPECIFIED` below is a blocking finding, never permission to infer from UI.

## BootstrapTenant contract

| Item | Contract |
|---|---|
| Name/type/objective | `BootstrapTenant`; atomically create one active Tenant and its first approved tenant_admin |
| Actor/Identity/Authority | authenticated platform admin; active persisted Platform Authority/Registry; enabled verified target Auth user plus coherent existing Identity |
| Capability/binding | `platform.tenant_create`; explicit preassigned tenantId is target, never authority |
| Exact payload | `{ commandId, tenantId, tenant: { tenantType, displayName, shortName, country, locale, timezone }, settings: { defaultLocale, registrationPolicy, featureFlags, supportEmail, supportUrl }, branding: { displayName, logoUrl, faviconUrl, colors }, firstAdminUid, expectedAdminEmail, initialStatus: "active" }` |
| Required/optional/nullable | all listed fields required; optional 0; nested nullable semantics `NOT_SPECIFIED` |
| Forbidden | unknown/client-authority/server-owned fields; expected email must not be persisted |
| Validation | package IDs and Domain values; executable nested Tenant/settings/branding input validators are missing |
| Lifecycle/preconditions | Tenant/config/key/state absent; initialStatus exactly active; target Auth/Identity coherent |
| Postconditions | active Tenant; complete settings/branding; approved tenant_admin Membership and key; authority state activeCount 1; succeeded command; tenant/platform Critical audits |
| Reads | Platform Authority/Registry, Identity, every target/key/state/command/audit collision path |
| Writes | Tenant, settings, branding, Membership, membershipKey, authority state, command, tenant audit, platform audit |
| Transaction/external effects | one Firestore transaction; Auth evidence read outside callback; Auth writes 0 |
| Stage/status | Firestore-only direct `succeeded/completed`; executable D command-stage allowlisting missing |
| Idempotency/replay | identical succeeded command returns stored result; other existing target `ALREADY_EXISTS`; key drift `CONTRACT_VIOLATION` |
| Resume/recovery | no committed partial state; unknown transaction outcome resolved by command/aggregate reread; no recovery_required checkpoint needed |
| Conflict/concurrency | competing bootstrap has one winner; loser zero writes; binding mismatch `CONFLICT` |
| Audit | Critical; exact operation strings, resource literals, summaries and metadata `NOT_SPECIFIED` |
| Result | operation `BootstrapTenant`, resourceId tenantId, status succeeded; resourceType and generated membershipId representation `NOT_SPECIFIED` |
| Errors | invalid input `INVALID_ARGUMENT`; auth `UNAUTHENTICATED`; authority `FORBIDDEN`; missing Identity `FAILED_PRECONDITION`; existing `ALREADY_EXISTS`; drift `CONTRACT_VIOLATION`; mismatch/contention `CONFLICT`; infrastructure `UNAVAILABLE/INTERNAL` |
| Completion proof | reread complete aggregate and succeeded command; exact read budget `NOT_SPECIFIED` |
| Rules/indexes | no prerequisite change for bounded Admin SDK point transaction |

BootstrapTenant remains blocked until shared validators, membershipKey encoding,
audit literals and the result ambiguity are closed.

## Update command contracts

| Item | UpdateTenantProfile | UpdateTenantSettings | UpdateTenantBranding |
|---|---|---|---|
| Command type | missing | missing | missing |
| Objective | patch only displayName, shortName, country, locale, timezone | update fixed settings document | update fixed branding document |
| Actor/authority | authenticated Identity; approved same-tenant tenant_admin; active Tenant | same | same |
| Capability | `tenant.update` | `tenant.manage_settings` | `tenant.manage_branding` |
| Exact payload | `NOT_SPECIFIED` | `NOT_SPECIFIED` | `NOT_SPECIFIED` |
| Required/optional/nullable | `NOT_SPECIFIED` | `NOT_SPECIFIED` | `NOT_SPECIFIED` |
| Mutable semantics | field-scoped patch; never stale whole Tenant replacement | merge vs replace `NOT_SPECIFIED` | composed replacement indicated, exact semantics `NOT_SPECIFIED` |
| Immutable/forbidden | tenantId/type/status/timestamps and unknown authority fields | tenantId/server fields and unknown fields | tenantId/server fields and unknown fields |
| Reads | Identity, Tenant, Membership/key, target root, Command | same | same |
| Writes | Tenant patch, Command, tenant audit | settings, Command, tenant audit | branding, Command, tenant audit |
| Boundary | one Firestore transaction | one Firestore transaction | one Firestore transaction |
| Lifecycle | active only; other exact errors `NOT_SPECIFIED` | active only | active only |
| Status/stage | direct succeeded/completed intended; exact construction missing | same | same |
| Idempotency/replay/resume | command binding and target reread; exact update-token and repeat contract `NOT_SPECIFIED` | same | same |
| Recovery | no external effect; no recovery_required expected | same | same |
| Concurrency | field patch plus optional update token; token payload `NOT_SPECIFIED` | transaction reread; CAS token `NOT_SPECIFIED` | transaction reread; CAS token `NOT_SPECIFIED` |
| Audit | Privileged; exact operation/resource/summaries/metadata `NOT_SPECIFIED` | same | same |
| Result | generic seven fields; exact resourceType `NOT_SPECIFIED` | same | same |
| Error mapping | generic taxonomy only; exhaustive mapping `NOT_SPECIFIED` | same | same |
| Completion proof | committed validated target+command+audit | same | same |
| Rules/indexes | no backend prerequisite change | no backend prerequisite change | no backend prerequisite change |

## Lifecycle command contracts

| Item | SuspendTenant | RestoreTenant | ArchiveTenant |
|---|---|---|---|
| Command type | missing | missing | missing |
| Objective/transition | active → suspended | suspended → active | active or suspended → archived |
| Actor/capability | active platform admin; `platform.tenant_suspend` | active platform admin; `platform.tenant_restore` | active platform admin; `platform.tenant_archive` |
| Exact payload | `NOT_SPECIFIED`; tenantId+target documented; reason forbidden absent contract | same | same |
| Lifecycle/repeat | same-command replay; new command against suspended `NOT_SPECIFIED` | archived forbidden/terminal; new command against active `NOT_SPECIFIED` | archived terminal; new command against archived `NOT_SPECIFIED` |
| Child effects | no direct Membership/Course/Enrollment writes; status changes authorization consequences | none | no deletion or child rewrite |
| Reads | Platform Authority/Registry, Tenant, Command | same | same |
| Writes | Tenant status/timestamps, Command, audits | same | same |
| Boundary/stage | one transaction; direct succeeded/completed intended; exact construction missing | same | same |
| Recovery | no external effect; unknown outcome reread | same | same |
| Concurrency | suspend/restore serialize on Tenant reread | restore/archive and suspend/restore serialize | archive/restore serialize; archived winner terminal |
| Loser | zero business writes | zero business writes | zero business writes |
| Audit | Critical; exact operation/resource/summaries/metadata `NOT_SPECIFIED` | same | same |
| Result | generic seven fields; resourceType `NOT_SPECIFIED` | same | same |
| Errors | missing `NOT_FOUND`; invalid lifecycle `FAILED_PRECONDITION`; binding/contention `CONFLICT`; malformed `CONTRACT_VIOLATION` | same | same |
| Rules/indexes | no backend prerequisite change; lifecycle Rules regression required | same | same |

## Shared package gap analysis

Starting package: `@mipymetic/saas-contracts@0.11.0`.

| Primitive | Current state | Classification |
|---|---|---|
| BootstrapTenant type | present | approved but incomplete executable input/result/audit contract |
| six update/lifecycle types | absent | authorized but normatively incomplete (classification B) |
| seven capabilities | all present with package matrices | sufficient at capability-ID level |
| Tenant/Membership fields | present | catalogues only; persisted runtime validators absent |
| Settings/Branding fields and validators | absent | shared gap |
| Tenant-admin authority-state fields | present | schemaVersion and runtime validator absent |
| paths | all required roots present | sufficient after identifier validation |
| membershipKey value schema/encoder | absent | shared gap; raw UID must not be inferred |
| command stages | not_started/prepared/completed | sufficient in principle; D type allowlisting/construction absent |
| generic audit/error contracts | present | operation-specific allowlists/mappings incomplete |

No missing command is unauthorized (classification C). All six are documented
phase-D workflows but cannot be materialized before their `NOT_SPECIFIED` items
are normatively resolved.

## First-admin, key and store decisions

`tenants/{tenantId}/authorityState/tenantAdmins` has documented fields
`tenantId`, `activeCount`, `revision`, `lastCommandId`, `updatedAt`. Bootstrap
creates count 1. A later eligibility-reducing operation rejects when count <= 1.
Revision/lastCommandId change only with committed authority changes; updatedAt
is server-owned. No runtime validator or schema version exists.

Membership lives at `tenants/{tenantId}/memberships/{membershipId}` and its key
at `tenants/{tenantId}/membershipKeys/{uidKey}`. Paths exist, but the key value
schema and canonical UID-key encoder do not. Local duplicate literals are
forbidden.

The Platform Command Transaction Store is authority-specific and must not gain
Tenant flags. Phase D reuses TransactionRunnerPort, TransactionPort, command
hash/validation, audit and errors. R2 must decide a narrow Tenant store versus
command-local primitives after closing exact documents; no second foundation or
ownership system is authorized.

## Result, errors, stages and configuration

The seven-field result is sufficient in shape only after R2 fixes each
resourceType and resolves BootstrapTenant membershipId output. Existing error
codes are sufficient, but R2 must publish exhaustive mappings. No new stage is
approved; current stages can represent atomic Firestore completion in principle.

| Protected surface | Decision |
|---|---|
| firestore.rules | `NO_CHANGE_REQUIRED` as implementation prerequisite; mandatory regression. A later separately authorized Rules phase is required only if executable review proves new client semantics are necessary. |
| firestore.indexes.json | `NO_CHANGE_REQUIRED`; bounded point reads |
| storage.rules | `NO_CHANGE_REQUIRED`; no Storage operation |
| firebase.json | `NO_CHANGE_REQUIRED`; no handler/deploy |
| .firebaserc | `NO_CHANGE_REQUIRED`; no remote project operation |
| src/firebase.js | `NO_CHANGE_REQUIRED`; client boundary unchanged |

## Next exact microphase and state

`SaaS-03B-D-R2 — Tenant Bootstrap and Lifecycle Shared Contract
Materialization` is the minimum next phase. It must close exact payloads,
results, audit allowlists, repeat semantics and persisted validators, then cut
the package/Functions artifact without implementing business commands.

```text
SaaS-03B-C = completed
SaaS-03B-D-R1 = completed_pending_human_review_and_push
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_R2
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

No package, Functions, Domain, Shared/client, Rules, index, Firebase
configuration or business-command change is part of R1.
