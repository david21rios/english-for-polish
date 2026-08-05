# SaaS-03B-A-R1 — Resolución contractual del backend privilegiado y bootstrap

## 1. Propósito, antecedente y decisión

Esta resolución cierra los diez bloqueadores de `SaaS-03B-A` sin crear código,
infraestructura, Rules, índices, secretos ni despliegues. Sus fuentes normativas
son Domain 1.2.0 y Architecture Freeze; ADR-001–009, especialmente ADR-006; los
modelos de persistencia, acceso, queries, escritura y seguridad; Rules/config
vigentes; repositorios shadow y sus cierres; roadmap, Scope 03A y auditoría 03B-A.

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-A = completed
SaaS-03B-A-R1 = completed_pending_human_contract_review
SaaS-03B-B0 = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0
Privileged Backend = not_created
Bootstrap platform_admin = not_started
Tenant bootstrap = not_started
```

R1 está contractualmente completo. La siguiente microfase es B0, no B.

## 2. Resolución de bloqueadores originales

| Bloqueador | Estado | Resolución vinculante |
|---|---|---|
| BACKEND_TOPOLOGY_BLOCKER | RESOLVED | Firebase Cloud Functions 2nd gen, TypeScript sobre Node.js 22, transport callable para comandos humanos y handlers internos no exportados para system/bootstrap |
| COMMAND_CONTRACT_BLOCKER | RESOLVED | envelope cerrado, schemas por comando y root `privilegedCommands/{commandId}` |
| AUTHORIZATION_CONTRACT_BLOCKER | RESOLVED | `platformAuthorities/{uid}` es autoridad global; claims son caché no autoritativa; capabilities salen de Domain |
| BOOTSTRAP_CONTRACT_BLOCKER | RESOLVED | ceremonia out-of-band de dos cuentas y saga Firestore/Auth verificable; Tenant bootstrap Firestore-only atómico |
| IDEMPOTENCY_CONTRACT_BLOCKER | RESOLVED | SHA-256 de JSON canónico, command record, replay y mismatch definidos |
| AUDIT_CONTRACT_BLOCKER | RESOLVED | roots platform/tenant, schema, timing, visibilidad y retención mínima definidos |
| TRANSACTION_BOUNDARY_BLOCKER | RESOLVED | matriz de transacción/saga, límites y compensación cerrados |
| SECRET_MANAGEMENT_BLOCKER | RESOLVED | Google Secret Manager en remoto; ADC/emuladores locales; cero claves versionadas |
| ENVIRONMENT_STRATEGY_BLOCKER | RESOLVED | local/demo-emulator/dev/staging/prod separados; IDs remotos son gates de deploy, no de implementación local |
| DEPLOYMENT_STRATEGY_BLOCKER | RESOLVED | main protegida, artefacto inmutable, environment approval, deploy scoped, smoke/rollback |

## 3. Topología y frontera portable

```text
PRIVILEGED_BACKEND_MVP_TOPOLOGY = Firebase Cloud Functions 2nd gen
RUNTIME = Node.js 22
LANGUAGE = TypeScript, ESM
DEPLOYMENT_REGION = required_environment_configuration
TRANSPORT = callable functions for authenticated human commands
SYSTEM_TRANSPORT = non-exported job/administrative adapters only
PRIVILEGED_BACKEND_TARGET_TOPOLOGY = same command core; Cloud Run only after explicit scale/HTTP/operations gate
PRIVILEGED_BACKEND_PORTABILITY_BOUNDARY = transport and Admin adapters surround pure commands
```

Node 22 is the fixed MVP runtime contract, not merely a minimum. The region is
non-secret environment configuration required before any remote deployment; its
absence does not block B0/B local work. Deployments create only explicitly
reviewed Functions. No catch-all HTTP/Express API is approved.

Cloud Run is justified only by sustained concurrency, long-running work,
non-callable protocols or independent scaling/observability requirements.
Command schemas, authorization decisions, error taxonomy, audit/idempotency
ports and persistence interfaces must remain portable.

## 4. Modular structure

Future layout, frozen for B/B0 review:

```text
functions/
  package.json
  tsconfig.json
  src/
    bootstrap/       # adapters for out-of-band ceremonies; never exported callable
    commands/        # one application command per module
    contracts/       # extracted pure schemas, enums, allowlists
    authorization/   # actor/capability resolution
    persistence/     # Admin Firestore/Auth adapters and transactions
    audit/            # audit port and Firestore implementation
    idempotency/      # command records/canonical hashing
    errors/           # backend error and transport mapper
    config/           # validated non-secret config/secret handles
    transport/        # thin callable adapters
    index.ts          # explicit approved exports only
  test/
    unit/
    integration/
```

Pure modules may import Domain/pure extracted contracts and standard-library
crypto. Admin-dependent modules may import `firebase-admin`; transport alone may
import `firebase-functions`. No module may import React, Vite, client Firebase
SDK, `src/firebase.js`, Context/UI/hooks or shadow client repositories.

## 5. Pure contract reuse

`SaaS-03B-B0` is required. It extracts, without behavior changes, pure enums,
allowlists, identifier/path builders, command schemas and error-code constants
into a deployment-safe neutral module. Cursor contracts are shared only when a
backend query actually uses them. Firebase snapshots, SDK references, repository
factories and transport objects are never shared contracts.

Until B0, copying a validator into Functions is prohibited. B0 must prove the
browser build and existing repository tests remain unchanged and that the pure
module has no client-SDK or UI dependency.

## 6. Persistent platform authority

```text
PLATFORM_AUTHORITY_ROOT = platformAuthorities/{uid}
PLATFORM_AUTHORITY_SOURCE_OF_TRUTH = active persistent authority document
CUSTOM_CLAIMS_ROLE = non-authoritative cache/routing hint
LAST_PLATFORM_ADMIN_POLICY = activeCount may never fall below 1 after bootstrap
PLATFORM_AUTHORITY_REGISTRY = platformControl/authorityRegistry
```

Exact authority document:

| Field | Type | Required/nullable | Rule |
|---|---|---|---|
| uid | string | required | equals document ID; immutable |
| authority | literal `platform_admin` | required | immutable |
| status | `provisioning\|active\|revoking\|revoked\|recovery_required` | required | lifecycle below |
| createdAt | timestamp | required | server; immutable |
| createdBy | string | required | bootstrap operator or active platform UID |
| updatedAt | timestamp | required | server |
| updatedBy | string | required | verified operator UID/type identifier |
| activatedAt | timestamp/null | required nullable | non-null only after verification |
| revokedAt | timestamp/null | required nullable | non-null in revoked |
| revokedBy | string/null | required nullable | paired with revokedAt |
| bootstrapCommandId | string/null | required nullable | immutable when bootstrap-created |
| lastClaimSyncAt | timestamp/null | required nullable | evidence, not authority |

Unknown fields are forbidden. Lifecycle:
`provisioning -> active|recovery_required`; `active -> revoking`;
`revoking -> revoked|recovery_required`; `recovery_required -> provisioning|revoking`
only through recovery. `revoked` is terminal.

Registry shape at `platformControl/authorityRegistry`:
`schemaVersion:1`, `bootstrapState: uninitialized|in_progress|completed|recovery_required`,
`activeCount:number>=0`, `revision:number>=0`, `lastCommandId`, `updatedAt`.
Every activation/deactivation updates authority, registry, command and audit in
one Firestore transaction. The transaction rejects deactivation when
`activeCount <= 1`. Clients have no read/write access.

Authorization requires valid Firebase authentication, active Auth user,
Identity UID match and active persistent authority. A claim without the active
document grants nothing. An active document with stale/missing claim remains
authoritative for backend commands but forces claim reconciliation before a
transport may cache/advertise the role.

## 7. Initial platform_admin bootstrap and recovery

ADR-006 requires two verified accounts. Exact unversioned operator input is:

```text
{
  commandId,
  environment,
  confirmationId,
  targets: [
    { uid, expectedNormalizedEmail },
    { uid, expectedNormalizedEmail }
  ]
}
```

`targets` has exactly two distinct entries for initial bootstrap. `confirmationId`
references an out-of-band two-person approval; it is not a secret/token. Unknown
fields, real credentials, service-account material and client timestamps are
forbidden. The tool requires explicit project/environment allowlist, ADC with
bootstrap privilege, Auth users enabled/email-verified, matching Identity
documents (or explicit `createMissingIdentity=true` in a separately reviewed
recovery command; initial bootstrap does not create them), registry
`uninitialized`, zero active/provisioning authorities and unused commandId.

### Saga

1. **prepare:** transaction creates command `running`, registry `in_progress`,
   two `provisioning` authorities and platform audit events.
2. **apply claims:** Admin Auth sets only `platformRole: "platform_admin"` on
   each target, preserving unrelated approved claims.
3. **verify:** reread both Auth users and claims.
4. **finalize:** transaction activates both authorities, sets activeCount=2 and
   registry completed, succeeds command and appends verification audits.
5. **recover:** any external failure records `recovery_required`; already set
   claims are not treated as authority. Rerun with identical commandId resumes
   from observed state. Payload mismatch is CONFLICT.

Firestore and Auth are not atomic. No rollback claim can be assumed to succeed.
If claim write succeeds and finalization fails, persistent authorities remain
non-active and retry finalizes after verification. If one claim fails, the
command becomes recovery_required and the operator either resumes missing claim
application or clears applied claims, verifies, then transactionally resets the
two provisioning records. Success is returned only after both active documents,
registry count and claims reread agree.

Recovery of lost last access uses a distinct `RecoverPlatformAdmin` out-of-band
ceremony with two-person approval, explicit environment/project, verified Auth
and Identity, command record and Critical audit. It may move registry to
recovery_required but may not silently replace history. `RevokePlatformAdmin`
first transactionally moves active to revoking and decrements only when count>1,
then clears the claim and finalizes revoked; a stale claim cannot authorize.

## 8. Atomic Tenant bootstrap

Command `BootstrapTenant` exact payload:

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

Only `active` is accepted because Domain has no provisioning state. IDs are
opaque and preassigned; Membership ID is deterministically stored in the
command result but generated server-side before transaction. The expected email
is compared against enabled, verified Auth and existing Identity; it is never
persisted in audit/command payload. Missing Identity is FAILED_PRECONDITION;
Tenant bootstrap does not create Identity.

One Firestore transaction reads active platform authority/registry, Identity,
all target paths, membershipKey and tenant-admin authority state, then creates:

- `tenants/{tenantId}` with active lifecycle and server timestamps;
- `tenants/{tenantId}/configuration/settings`;
- `tenants/{tenantId}/configuration/branding`;
- `tenants/{tenantId}/memberships/{membershipId}` approved tenant_admin;
- `tenants/{tenantId}/membershipKeys/{uidKey}`;
- `tenants/{tenantId}/authorityState/tenantAdmins` with activeCount=1;
- `tenants/{tenantId}/auditEvents/{auditId}`;
- success outcome in `privilegedCommands/{commandId}` and platform audit event.

All become visible together; active Tenant without first admin cannot commit.
Any existing target causes ALREADY_EXISTS, except an identical succeeded command
returns replay. An inconsistent key is CONTRACT_VIOLATION and no repair occurs.
No reservation or compensation is needed because all business effects are
Firestore-only and transactional. Transaction size must be asserted in tests;
current set is bounded well below Firestore's 500-write limit.

## 9. Last tenant-admin protection

`tenants/{tenantId}/authorityState/tenantAdmins` is an auxiliary authoritative
constraint document with exact fields `tenantId`, `activeCount`, `revision`,
`lastCommandId`, `updatedAt`. "Active admin" means Membership role
tenant_admin and status approved, independent of Tenant suspension.

Bootstrap creates count 1. Role change, suspend, restore, remove and approval
that changes admin eligibility transactionally reread/update the same document.
An operation reducing the count rejects with FAILED_PRECONDITION when count<=1.
No query/count aggregation or eventually consistent cache is used. Tenant
archive does not rewrite Memberships; platform recovery remains possible.

## 10. Privileged command record and idempotency

```text
PRIVILEGED_COMMAND_ROOT = privilegedCommands/{commandId}
COMMAND_STATUS_ENUM = pending|running|succeeded|failed_retryable|failed_terminal|recovery_required
COMMAND_IDEMPOTENCY_POLICY = one immutable canonical payload per commandId
COMMAND_PAYLOAD_HASH_POLICY = SHA-256 over UTF-8 RFC-8785-style canonical JSON
COMMAND_REPLAY_POLICY = succeeded returns stored sanitized result; retryable/recovery resumes; mismatch conflicts
```

Exact schema: `commandId`, `commandType`, `payloadHash`, `actorUid`, `actorType`,
`authority`, nullable `tenantId`, `status`, `startedAt`, nullable `completedAt`,
nullable `failedAt`, nullable sanitized `result`, nullable `errorCode`,
`attemptCount`, `correlationId`, `expiresAt`, `schemaVersion:1`. Unknown fields
and nullable `leaseExpiresAt`. Unknown fields are forbidden. Raw payload, email,
secrets and tokens are never stored. `leaseExpiresAt` must be null outside
`running`.

Canonical hash includes commandType and every normalized business input that
affects behavior, excluding correlationId, confirmation evidence contents,
credentials and derived actor claims. Arrays preserve semantic order; object
keys sort lexicographically; timestamps are not accepted as client authority.

Firestore-only commands create/complete the command record in the same business
transaction. Sagas use running/recovery states and short, bounded leases stored
as `leaseExpiresAt` only while running; a new attempt after lease expiry rereads
external state before acting. Unknown timeout triggers record/target reread.
Client Rules deny the root. Retention: succeeded/terminal records minimum 400
days; recovery_required until resolved plus 400 days; policy may extend later.

## 11. Privileged audit contract

```text
PLATFORM_AUDIT_ROOT = platformAuditEvents/{auditId}
TENANT_AUDIT_ROOT = tenants/{tenantId}/auditEvents/{auditId}
AUDIT_ACCESS = backend write; client deny-all
AUDIT_RETENTION_MINIMUM = 400 days; legal/product extension deferred non-blocking
```

Exact allowlist: `auditId`, `commandId`, `correlationId`, `actorUid`, `actorType`,
`authority`, nullable `tenantId`, `level` (`basic|privileged|critical`),
`operation`, `resourceType`, `resourceId`, `result`
(`succeeded|rejected|failed|recovery_required`), nullable `errorCode`,
`requestedAt`, `executedAt`, nullable `beforeSummary`, nullable `afterSummary`,
`metadata`, `schemaVersion:1`.

Summaries are allowlisted state scalars only, max 8 KiB each; metadata is a
flat allowlisted map max 4 KiB. No payloads, emails, display names, tokens,
secrets, credentials, stacks, raw errors or document snapshots. IDs are opaque.

- Successful/rejected Firestore command audit is in the same transaction and
  mandatory before success response.
- Auth saga records each Firestore stage atomically with command status; external
  Auth action is audited immediately after verification, before final success.
- Transport/auth rejection before a valid command envelope goes only to
  sanitized platform operational logging best-effort; it cannot fabricate a
  privileged audit event.
- A validated command denied by authorization writes a rejected audit event in
  a separate bounded transaction; failure to audit yields INTERNAL and alert.

## 12. Authentication and authorization

Ordinary callable order:

1. verify callable transport and Firebase ID token;
2. validate App Check when enforcement is enabled for that environment;
3. parse exact command envelope and derive actorUid/email from token/Auth;
4. load Identity only when command requires it;
5. for platform operations load active platform authority and registry;
6. for tenant operations load Tenant, membershipKey and canonical Membership;
7. derive capabilities from the versioned pure Domain role-capability matrix;
8. validate capability, tenant/resource state and command schema;
9. claim/create command record and execute transaction/saga;
10. write mandatory audit and return sanitized result.

Payload role, capability, actorUid and authority are always forbidden. tenantId
is a target/binding, never authority. identity_self derives from Auth UID;
teacher/tenant_admin require approved Membership and active Tenant;
platform_admin requires active persistent authority; platform_system uses a
dedicated least-privilege service identity/job adapter; bootstrap operator uses
out-of-band ADC plus approval and cannot call ordinary transports.

App Check is abuse defense, not authorization. MVP human transports enforce it
in staging/production once configured; local Emulator bypass is explicit.

## 13. First implementation command catalogue

| Item | Phase | Contract status |
|---|---|---|
| actor authentication, authority/capability resolver, exact schema validation | FOUNDATION_REQUIRED / B | closed |
| idempotent executor, transaction helper, audit writer, error mapper, config loader | FOUNDATION_REQUIRED / B | closed |
| BootstrapPlatformAdmin, RecoverPlatformAdmin, RevokePlatformAdmin | BOOTSTRAP_PHASE / C | closed |
| BootstrapTenant | TENANT_BOOTSTRAP_PHASE / D | closed |
| UpdateTenantProfile/Settings/Branding; Suspend/Restore/ArchiveTenant | TENANT_BOOTSTRAP_PHASE / D | closed |
| Approve/RejectRegistrationRequest; role/suspend/restore/remove Membership | MEMBERSHIP_COMMAND_PHASE / E | closed except invitations/expiry scheduling |
| ExpireRegistrationRequest | DEFERRED | scheduler/provider deferred non-blocking |
| Create/Update/Activate/ArchiveCourse | COURSE_COMMAND_PHASE / F | closed |
| Create/Activate/Complete/CancelEnrollment admin | ENROLLMENT_COMMAND_PHASE / F | requires Enrollment R2 policy before implementation |
| Invitation issue/accept/revoke/expire | DEFERRED | separate R2 before E extension; does not block approval flow |
| RestoreCourse, platform_admin Membership, direct client privileged writes | PROHIBITED | terminal/authority boundaries |

## 14. Transaction boundaries

| Family | Reads/writes | External effect | Audit/command | Retry/compensation |
|---|---|---|---|---|
| Foundation authorization | only necessary Identity/authority/Tenant/Membership | none | rejected audit where envelope valid | no mutation |
| Firestore single-root lifecycle/profile | actor+root+constraint reread; root update | none | same transaction | SDK bounded retry; target-state replay |
| Request/key or Membership/key | actor, root, key; update both | none | same transaction | fail closed on drift |
| ApproveRequest | Tenant,Identity,actor,Request,both keys,Membership; write all | none | same transaction | requestId replay |
| Tenant bootstrap | bounded paths in §8 | Auth read occurs before transaction, no write | same transaction | whole commit or none |
| Course | actor,Tenant,Course; create/update | none | same transaction | reread/update-time conflict |
| Enrollment | actor,Tenant,Membership,Course,Enrollment/constraint | none | same transaction | policy R2 before create |
| Platform bootstrap/recovery/revoke | Firestore stage transactions | Auth claim writes | audit each stage | resumable saga; recovery_required |
| Scheduled expiry/repair | bounded roots/key | scheduler trigger | same mutation transaction | at-least-once safe |

Transactions must use server timestamps, all reads before writes, no network/Auth
call inside transaction callback, bounded automatic retries (maximum 5 at the
application boundary), 20-second application timeout below platform timeout,
and explicit contention/size telemetry. Current commands target under 20 reads
and under 20 writes; exceeding either contractual budget requires review even
though Firestore service limits are higher. Batches are allowed only for
write-only projections after all decisions, never for these authoritative flows.

## 15. Error taxonomy

```text
BACKEND_ERROR_CONTRACT = backend-owned normalized error with Shared-compatible codes
BACKEND_ERROR_EXTENSION_REQUIRED = no Shared change; backend adds ALREADY_EXISTS and INTERNAL
```

| Code | Retryable | Callable mapping | Exposure/audit |
|---|---:|---|---|
| INVALID_ARGUMENT | no | invalid-argument | sanitized field category only |
| UNAUTHENTICATED | no | unauthenticated | no identity detail |
| FORBIDDEN | no | permission-denied | neutral; rejected audit when command valid |
| NOT_FOUND | no | not-found | conceal when authorization requires |
| CONFLICT | no after reread | aborted | command/resource category |
| ALREADY_EXISTS | no | already-exists | opaque resource ID only |
| FAILED_PRECONDITION | no | failed-precondition | lifecycle/precondition category |
| CONTRACT_VIOLATION | no | failed-precondition | generic contract message |
| UNAVAILABLE | yes | unavailable | correlationId/retryable only |
| INTERNAL | normally no | internal | generic; full cause server log only |
| UNKNOWN | no until classified | unknown | generic; critical telemetry |

Internal causes and stacks are logged securely, never returned. Transaction
contention maps CONFLICT after bounded retries; infrastructure outage maps
UNAVAILABLE. Payload mismatch on commandId is CONFLICT and Critical audit.

## 16. Secret and configuration policy

MVP remote secrets use Google Secret Manager with per-function access and
separate secret versions per environment. Functions use managed runtime service
accounts; no downloaded JSON key is allowed. Local uses Emulator plus ADC only
for explicitly out-of-band bootstrap tests; CI uses workload identity/federated
credentials when remote deployment is later authorized, never stored secrets.

- Configuration: runtime, region, project alias, log level, feature gates.
- Sensitive configuration: retention/limits that affect security; protected env.
- Secret: HMAC/encryption/API material; Secret Manager only.
- Credential: service identity/Auth token; managed, never `.env` or examples.
- Identifier: synthetic project/opaque IDs; non-secret but environment-bound.

Rotation creates new version, dual-verifies only for a bounded window, then
revokes old access and audits. `.env.example` may later contain names and dummy
placeholders only—never real UID, email, project, key or token.

## 17. Environment strategy

| Environment | Project/credentials | Commands/deploy | Data/audit |
|---|---|---|---|
| local | Emulator, `demo-polish-learning`; no remote credential | all commands against synthetic fixtures; no deploy/bootstrap real | ephemeral synthetic |
| demo-emulator | same demo ID, CI Emulator-only | runtime/security gates | isolated fixtures |
| development | `development_project_id = required_before_remote_deploy`; managed dev identity/secrets | manual approved deploy; bootstrap only with dev ceremony | synthetic/non-production, retained audit |
| staging | `staging_project_id = required_before_staging_deploy` | protected deploy after dev; full smoke/saga rehearsal | synthetic/anonymized only |
| production | `production_project_id = required_before_production_deploy` | two-person approval, scoped deploy, explicit bootstrap | real audit/retention/backups |

Remote development is required before staging; staging is required before
production. Missing remote IDs is DEFERRED_NON_BLOCKING for B0/B local, blocking
only that environment's deploy. Firebase login/manual credentials are prohibited
in CI.

## 18. Deployment strategy

Source branch is protected `main`; CI produces a versioned immutable Functions
artifact after lint, unit, contract, Emulator integration and security gates.
Remote deployment uses a dedicated least-privilege service identity and GitHub
protected environment with human approval. It validates region, project allowlist,
secrets and planned resource names, then deploys explicit Functions only.

First deploy requires backend tests PASS, Emulator integration PASS, security
review PASS, secret/config validation, approved environment, human approval,
no unintended resources and documented rollback. Staging smoke precedes prod.
Database migrations/bootstrap are separate approved commands, never deploy hooks.
Rollback redeploys the last known artifact; schema changes remain backward
compatible and privileged transports can be disabled by safe config. Region is
immutable per deployed Function; changing it is a migration, not an edit.

## 19. Deferred but non-blocking decisions

- **Invitations:** `DEFERRED_NON_BLOCKING`, owner 03B-E-R2. They are not required
  for platform bootstrap, Tenant bootstrap or current RegistrationRequest
  approval/Membership creation. No invitation endpoint is allowed before R2.
- **Enrollment uniqueness/re-enrollment:** `REQUIRES_R2_BEFORE_ENROLLMENT_COMMANDS`,
  owner 03B-F-R2. `CreateEnrollment` is not implemented until then; no uniqueness
  is invented. Other foundation/Course commands are unblocked.
- Teacher cohort assignment, scheduled expiry provider, production project IDs,
  production deploy, Cloud Run migration and audit retention beyond 400 days are
  DEFERRED_NON_BLOCKING with owners E/R, environment deployment gate, future
  topology review and compliance review respectively.

## 20. CAS and concurrency

No physical `version` field is added. Tenant profile/settings/branding and Course
metadata use transaction reread plus optional Firestore last-update-time
precondition supplied from a backend-read token; stale token yields CONFLICT.
Membership role/status, Enrollment lifecycle and authority use transaction
reread and constraint documents; no client `updatedAt` authority. Timestamps are
server-generated. Identity self remains governed by its existing client contract.

## 21. Definitive 03B roadmap

| Phase | Purpose/dependency | Deliverables/tests | Emulator/remote/deploy/push |
|---|---|---|---|
| 03B-A-R1 | resolve A blockers | this document; docs validation | no/no/no; human review before later commit |
| 03B-B0 | pure contract extraction; after R1 approval | neutral modules, dependency guards, unit/regression docs | no remote; no deploy; commit/push after C1-style review |
| 03B-B | Functions foundation; after B0 | package/config, ports, auth/idempotency/audit/error core, callable shell disabled by default | Emulator required for close; no remote/deploy |
| 03B-B-C1 | foundation security/code review | isolated technical/docs commits | no remote/deploy; human push |
| 03B-C | platform bootstrap/recovery | non-exported tool, saga tests, two-account synthetic ceremony | Auth+Firestore Emulator; no real bootstrap/deploy until separate authorization |
| 03B-D | Tenant/first-admin bootstrap/lifecycle | commands, transaction tests, last-admin constraint | Firestore/Auth Emulator; no remote by default |
| 03B-E | Request/Membership commands | approval/key/lifecycle commands; invitations only after E-R2 | Emulator; no remote/deploy by default |
| 03B-F | Course commands; Enrollment after F-R2 | lifecycle/cross-root commands | Emulator; no remote/deploy by default |
| 03B-R | integrated security/runtime/CI/shadow closure | negative isolation, replay, failure recovery, five+existing gates | Emulator required; remote/deploy require separate human phase |

Each implementation phase has its own review/controlled commits even when not
encoded above as a separate ID. No phase begins from this document.

## 22. Residual risks and readiness

Residual risks are operational, not open foundation contracts: Auth/Firestore
saga recovery, contention on authority counters, unsigned client-visible
correlation IDs, secrets/region/project values absent until deploy gates,
invitations and Enrollment policy deferred, no remote evidence and no production
retention approval. Tests must inject failures at every saga boundary and prove
last-admin concurrency.

All mandatory closure contracts are `RESOLVED`:

```text
PRIVILEGED_BACKEND_MVP_TOPOLOGY = RESOLVED
PRIVILEGED_BACKEND_MODULE_BOUNDARIES = RESOLVED
PLATFORM_AUTHORITY_CONTRACT = RESOLVED
PLATFORM_ADMIN_BOOTSTRAP_CONTRACT = RESOLVED
PLATFORM_ADMIN_RECOVERY_CONTRACT = RESOLVED
TENANT_BOOTSTRAP_CONTRACT = RESOLVED
COMMAND_RECORD_CONTRACT = RESOLVED
IDEMPOTENCY_CONTRACT = RESOLVED
AUDIT_CONTRACT = RESOLVED
AUTHORIZATION_CONTRACT = RESOLVED
TRANSACTION_BOUNDARY_CONTRACT = RESOLVED
BACKEND_ERROR_CONTRACT = RESOLVED
SECRET_MANAGEMENT_CONTRACT = RESOLVED
ENVIRONMENT_STRATEGY_CONTRACT = RESOLVED
DEPLOYMENT_STRATEGY_CONTRACT = RESOLVED
LAST_ADMIN_PROTECTION_CONTRACT = RESOLVED
PURE_CONTRACT_REUSE_STRATEGY = RESOLVED
03B_ROADMAP = RESOLVED
```

Decision: `SaaS-03B-A-R1 = COMPLETE`, pending human contract review.
`SaaS-03B-B0 = ready_not_started`; `SaaS-03B-B` remains blocked only by B0.

## 23. B0 design outcome

Human approval advanced R1 to `completed`. B0 then completed the pure-contract
inventory and package/compatibility design without physical extraction, because
its authorized deliverables were documentation only.

```text
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0_I
```

The chosen future package is `packages/saas-contracts`, dependency-free ESM
JavaScript with JSDoc, neutral validation results and compatibility adapters at
existing import paths. No implementation artifact exists yet.

B0-I later proved that relative imports work for the frontend, but a Functions
artifact cannot consume a true single-source package without an approved package
topology and Domain compatibility reexports. B0-I is therefore
`incomplete_package_topology_blocker`; 03B-B remains blocked.

B0-I-R1 resuelve ese bloqueo contractualmente: frontend/tests usan un package
npm workspace privado y Functions consume la misma versión mediante un tarball
revisado contenido en su deploy source. Domain sigue normativo y se migra
físicamente mediante reexports en R3. No existe Functions code; 03B-B continúa
bloqueado hasta cerrar R2, R3 y R4.

R2 implementó esa frontera sin crear backend: Functions contiene sólo su
manifest/lockfile y el artifact contracts; no existen Admin SDK, handlers ni
exports ejecutables. R3/R4 siguen siendo dependencias obligatorias de 03B-B.

R2-C1 verificó clean installs y consumo Functions sin workspace raíz. La
topología queda cerrada pendiente de push; no se creó backend y R3/R4 siguen
bloqueando 03B-B.

R3-A inventoried Domain authority and preserved the backend boundary: commands,
authority and audit contracts already in the package are future-only and are
not confused with the 40 Domain migration contracts.

R3-B migrated only foundational statuses/types. Commands, authority, audit,
capabilities and executable backend remain untouched.
