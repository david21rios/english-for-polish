# SaaS-03B-A — Auditoría contractual del backend privilegiado y bootstrap

## 1. Propósito, alcance y decisión

Esta auditoría delimita el backend privilegiado que ejecutará las escrituras que
Domain 1.2.0 y el modelo Firestore prohíben al navegador. No crea backend,
Functions, endpoints, Admin SDK, scripts, Rules, índices, datos ni consumidores.

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-A = completed
SaaS-03B-A-R1 = required_not_started
Privileged Backend = not_created
Bootstrap platform_admin = not_started
Tenant bootstrap = not_started
IMPLEMENTATION_READINESS = READY_WITH_RESOLUTIONS
```

La auditoría es completa aunque la implementación no está lista. Domain y la
autoridad de escritura fijan actores, capabilities y lifecycles; faltan contratos
físicos y operativos que deben cerrarse en 03B-A-R1.

## 2. Fuentes y estado inicial

Se revisaron el roadmap y Scope 03A; ADR-001–009 (en especial ADR-006);
Architecture Freeze y Domain 1.2.0 completo; modelos Identity, Organization,
Authorization, Academic, Relationship y Workflow; Persistence Model,
Persistence Invariants and Operations, Physical Model, Access Patterns, Query
and Index Model, Write Authority and Concurrency y Security Review Gate;
`firestore.rules`, `firestore.indexes.json`, `storage.rules`, Firebase config,
packages, workflow y scripts; los repositorios Shared, Identity, Tenant,
RegistrationRequest, Membership, Course y Enrollment y sus contratos/cierres.

No existen `functions/`, Firebase Admin SDK, backend Node desplegable ni script
administrativo SaaS. Las dependencias `express` observadas en el lockfile son
transitivas de tooling, no infraestructura de aplicación. El único mecanismo
legacy es `DEFAULT_ADMINS`; ADR-006 lo conserva temporalmente y prohíbe usarlo
como autoridad SaaS.

Gate Git inicial: `main`, `HEAD == origin/main ==
399ec41e83d867e60b74c41c4e4560763166ec46`, worktree limpio.

## 3. Frontera de autoridad

- El actor humano solicita; Domain y el backend autorizan; una identidad de
  servicio ejecuta con Admin SDK. `trusted_backend` no es actor de negocio.
- Admin SDK omite Rules: toda operación revalida autenticación, autoridad
  persistida, capability, tenant, Membership, lifecycle, ownership y referencias.
- Un rol, UID, tenant, timestamps o constraints enviados por UI nunca conceden
  autoridad. `platform_admin` es global y nunca es Membership.
- Rules siguen bloqueando las escrituras directas en los roots SaaS; no son el
  mecanismo de autorización interno del backend.

## 4. Inventario y matriz de operaciones

`R` identifica lecturas autoritativas; `W` escrituras. Audit significa evento
obligatorio, cuyo path físico permanece bloqueado.

| Operación | Solicitante / capability | Precondición principal | R / W | Atomicidad e idempotencia | Clasificación |
|---|---|---|---|---|---|
| CreateTenantBootstrap | platform_admin / `platform.tenant_create` | autoridad global válida; IDs ausentes; Identity inicial válida | R platform authority, Identity, Tenant/config/key; W Tenant, settings, branding, Membership admin, membershipKey, audit, command | una transaction; command record | PLATFORM_ADMIN_REQUESTED, BACKEND_REQUIRED, CONTRACT_BLOCKED |
| UpdateTenantProfile | tenant_admin / `tenant.update` | Membership approved, Tenant active | R Tenant+actor Membership; W Tenant+audit | transaction/CAS; command key | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| PlatformUpdateTenantMetadata | platform_admin / `platform.tenant_update` | Tenant no archived | R authority+Tenant; W tenantType+audit | transaction/CAS | PLATFORM_ADMIN_REQUESTED, BACKEND_REQUIRED |
| UpdateTenantSettings | tenant_admin / `tenant.manage_settings` | Tenant active | R Tenant+Membership+settings; W settings+audit | transaction/CAS | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| UpdateTenantBranding | tenant_admin / `tenant.manage_branding` | Tenant active | R Tenant+Membership+branding; W branding+audit | transaction/CAS | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| SuspendTenant | platform_admin / `platform.tenant_suspend` | active | R authority+Tenant; W Tenant+audit | transaction; target-state replay | PLATFORM_ADMIN_REQUESTED, BACKEND_REQUIRED |
| RestoreTenant | platform_admin / `platform.tenant_restore` | suspended; archived prohibited | R authority+Tenant; W Tenant+audit | transaction; tenantId+active | PLATFORM_ADMIN_REQUESTED, BACKEND_REQUIRED |
| ArchiveTenant | platform_admin / `platform.tenant_archive` | active/suspended | R authority+Tenant; W Tenant+audit | transaction; terminal-state replay | PLATFORM_ADMIN_REQUESTED, BACKEND_REQUIRED |
| CreateIdentity / Auth sync | onboarding/system | Auth UID and verified provider facts | R Auth+Identity; W Identity+audit | natural key UID | SYSTEM_ONLY, BACKEND_REQUIRED |
| BootstrapPlatformAdmin | approved out-of-band humans | zero platform admins; explicit verified UIDs/emails | R Auth+global authority set; W claims+global records+audit | one-use ceremony; all requested principals verified | BOOTSTRAP_ONLY, CONTRACT_BLOCKED |
| Assign/RevokePlatformAuthority | existing platform authority/break-glass | recovery/quorum policy | R Auth+authority records; W claim+record+audit | command record; two-source reconciliation | PLATFORM_ADMIN_REQUESTED, CONTRACT_BLOCKED |
| CreateRegistrationRequest | identity_self / `registration_request.create` | Identity/Tenant/policy valid; no live key | R Identity,Tenant,settings,key; W Request+requestKey+audit | transaction; natural tenant+uid key | BACKEND_REQUIRED |
| CancelRegistrationRequest | identity_self / `registration_request.cancel_self` | own pending request | R Request+key; W cancelled Request+key+audit | transaction; terminal replay | BACKEND_REQUIRED |
| ExpireRegistrationRequest | platform_system | pending and expiry policy | R Request+key; W expired Request+key+audit | bounded job; request target state | SYSTEM_ONLY, CONTRACT_BLOCKED |
| RejectRegistrationRequest | tenant_admin / `registration_request.review` | approved actor; pending Request | R Tenant,Membership,Request,key; W rejected Request+key+audit | transaction; terminal replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| ApproveRegistrationRequest | tenant_admin / `registration_request.review` | Tenant active, verified Identity, pending/replay, no incompatible Membership | R Tenant,Identity,actor Membership,Request,both keys,possible Membership; W Request,Membership,both keys,audit | cross-root transaction; `requestId` | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| ChangeMembershipRole | tenant_admin / `membership.change_role` | same active Tenant; non-removed; canonical role; last-admin policy unresolved | R Tenant,actor/target Membership,key; W Membership+key+audit | transaction/CAS | TENANT_ADMIN_REQUESTED, CONTRACT_BLOCKED |
| SuspendMembership | tenant_admin / `membership.suspend` | approved target | R Tenant,actor/target,key; W suspended target+key+audit | transaction; target-state replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| RestoreMembership | tenant_admin / `membership.restore` | suspended target | R Tenant,actor/target,key; W approved target+key+audit | transaction; replay on approved | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| LeaveMembership | identity_self / `membership.leave_self` | own approved/suspended Membership | R Tenant,target,key; W removed target, delete key,audit | transaction; terminal replay | BACKEND_REQUIRED |
| RemoveMembership | tenant_admin / `membership.remove` | same Tenant; valid source; last-admin policy unresolved | R Tenant,actor/target,key; W removed target, delete key,audit | transaction; terminal replay | TENANT_ADMIN_REQUESTED, CONTRACT_BLOCKED |
| RepairRequest/MembershipKey | platform_system | deterministic single authoritative candidate | R root(s)+key; W key+audit | transaction; fail on ambiguity | SYSTEM_ONLY |
| CreateCourse | teacher/tenant_admin / `course.create` | actor approved; Tenant active; canonical metadata | R Tenant+actor Membership; W draft Course+audit | transaction; preassigned courseId | BACKEND_REQUIRED |
| UpdateCourse | teacher/tenant_admin / `course.update` | draft/active; same Tenant | R Tenant,actor,Course; W Course+audit | transaction/CAS | BACKEND_REQUIRED |
| ActivateCourse | tenant_admin / `course.activate` | draft | R Tenant,actor,Course; W active Course+audit | transaction; target-state replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| ArchiveCourse | tenant_admin / `course.archive` | draft/active | R Tenant,actor,Course; W archived Course+audit | transaction; terminal replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| RestoreCourse | none | archived is terminal in Domain 1.2.0 | none | none | PROHIBITED |
| CreateEnrollment | tenant_admin / `enrollment.create` | active Tenant, approved Membership, active Course, same tenant | R Tenant,actor,target Membership,Course,possible Enrollment; W pending Enrollment+audit | transaction; enrollmentId only | TENANT_ADMIN_REQUESTED, CONTRACT_BLOCKED |
| ActivateEnrollment | tenant_admin / `enrollment.update_status` | pending | R Tenant,actor,Enrollment,Membership,Course as required; W Enrollment+audit | transaction; target-state replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| CompleteEnrollment | tenant_admin / `enrollment.update_status` | active | same as above; W terminal Enrollment+audit | transaction; terminal replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| CancelEnrollment admin | tenant_admin / `enrollment.update_status` | pending/active | R Tenant,actor,Enrollment; W cancelled Enrollment+audit | transaction; terminal replay | TENANT_ADMIN_REQUESTED, BACKEND_REQUIRED |
| CancelEnrollment self | identity_self / `enrollment.cancel_self` | owner pending/active; policy permits | current model permits client+Rules | single doc; cancelled replay | DEFERRED from privileged API; not backend-required now |
| Re-enroll / uniqueness constraint | tenant_admin | product policy absent | unresolved | unresolved | CONTRACT_BLOCKED |
| Invitation issue/accept/revoke/expire | platform/tenant authority or system | policy, email binding, single-use token | physical roots not defined | token/hash/key/audit transaction contract missing | CONTRACT_BLOCKED |

No client or platform role may delete historical Tenant, Request, Membership,
Course or Enrollment roots as a substitute for lifecycle.

## 5. Bootstrap de platform_admin

ADR-006 is normative: an out-of-band, one-use local administrative script with
Admin SDK receives an explicit list of UID plus normalized verified email,
proves zero existing platform admins, assigns a custom claim and a restricted
persistent global record, emits platform audit, verifies both accounts and is
then disabled/removed. It never runs in the browser, never creates Memberships
and never derives authority from `DEFAULT_ADMINS`.

The ceremony requires two-person approval, dry-run inventory, explicit project
allowlist, recent strong credentials, immutable evidence, a recovery principal,
post-write Auth/Firestore reread, and a recorded revocation/rotation procedure.
Secrets, service-account JSON, tokens and real emails must never be committed.

The exact global authority path/schema, zero-authority proof, claim name/value,
quorum/recovery and atomic reconciliation between Auth claims, persistent record
and audit are not in the physical model. Therefore bootstrap is
`BOOTSTRAP_CONTRACT_BLOCKER`; no script is authorized before R1.

## 6. Tenant y primer tenant_admin

The approved operation must not expose a usable partial Tenant. It requires one
Firestore transaction where feasible:

1. authenticate and revalidate platform authority;
2. reread target Identity/Auth facts and prove the Tenant/config/key documents
   are absent;
3. reserve preassigned tenantId, membershipId and commandId;
4. create `tenants/{tenantId}`, fixed `configuration/settings` and `branding`;
5. create the first approved tenant_admin Membership and membershipKey;
6. write mandatory audit/command outcome;
7. return frozen identifiers and replay status.

Firestore transactions provide atomic document effects, not exactly-once
execution. A retry reads the command/natural keys and returns the identical
result. A batch is insufficient because authorization, absence and key
preconditions require reads. There is no compensation for a committed partial
state because the transaction must commit all authoritative documents or none.

The existing physical/write documents define CreateTenant as Tenant+Settings+
Branding but do not yet incorporate first admin, command or audit records. Their
exact paths and the maximum transaction/access budget require R1. Until then an
active Tenant without a first admin is forbidden by 03B policy.

## 7. Invariantes cross-root

| Invariante | Momento/control | Error |
|---|---|---|
| path ID equals embedded ID; exact allowlist | every read/write serializer | CONTRACT_VIOLATION |
| all tenant roots and references share tenantId | before transaction and reread in it | CONTRACT_VIOLATION/FORBIDDEN |
| Auth UID, Identity UID, Membership UID and actor coincide where required | authorization stage | FORBIDDEN |
| platform_admin is global and never a Membership role | bootstrap and every role command | CONTRACT_VIOLATION |
| actor Membership approved and Tenant active for tenant commands | transaction reread | FORBIDDEN/FAILED_PRECONDITION |
| Membership/Course exist, are compatible and same Tenant for Enrollment | Create/status transaction | FAILED_PRECONDITION |
| Course active for ordinary enrollment creation | transaction reread | FAILED_PRECONDITION |
| requestKey and membershipKey point to the exact canonical root/status | every key command | CONTRACT_VIOLATION; fail closed |
| canonical lifecycle transition only; terminal roots retained | command validation | FAILED_PRECONDITION |
| timestamps and audit execution time are server authoritative | write assembly | CONTRACT_VIOLATION |
| unknown fields, SDK objects and client authority metadata rejected | command boundary | INVALID_ARGUMENT |
| archived Tenant/Course and removed Membership never restored unless Domain says so | lifecycle validation | FAILED_PRECONDITION |

## 8. Idempotencia, concurrencia y transacciones

- Use a caller-supplied opaque `commandId` plus server-generated/propagated
  `correlationId`; never use payload hashes containing PII as identifiers.
- Approval is naturally keyed by requestId; identity by UID; root creation by
  preassigned ID. Other privileged commands need a persistent command outcome.
- A repeated identical command returns the original result; the same commandId
  with different canonical input returns CONFLICT.
- Transactions reread every authority/lifecycle/reference document. SDK retries
  contention internally within bounded policy; unknown timeouts trigger point
  reread/replay, never blind duplicate side effects.
- Audit and authoritative Firestore effects are required in the same transaction
  when the audit sink is Firestore. External logs/events are eventual and use the
  same correlation ID; they cannot define business success.
- "Exactly once" is only an observable API effect backed by deduplication;
  infrastructure execution remains at-least-once safe.
- No distributed locks unless a proven non-Firestore side effect cannot be made
  idempotent. CAS/version remains a physical blocker for editable configuration
  and Course metadata.

## 9. Closed command envelope and results

Every future command has a separate allowlisted schema:

```text
request = { commandId, correlationId?, tenantId? or explicit target IDs,
            operation-specific fields }
actorContext = derived from verified authentication, never request role
result = { commandId, correlationId, operation, resourceType, resourceId,
           status, replayed }
```

Representative contracts are `BootstrapPlatformAdmins`,
`CreateTenantWithFirstAdmin`, `ApproveRegistrationRequest`,
`RejectRegistrationRequest`, `ChangeMembershipRole`, `SuspendMembership`,
`CreateCourse`, `ArchiveCourse`, `CreateEnrollment` and
`TransitionEnrollmentStatus`. Each must freeze required/nullable/forbidden
fields, capability, reads, writes, transaction boundary, replay result and audit
event in R1. Raw SDK objects, arbitrary fields/constraints, implicit tenant,
client timestamps, client-selected actor/role/capability and open payloads are
prohibited.

## 10. Error contract

Reuse Shared meanings: `INVALID_ARGUMENT`, `UNAUTHENTICATED`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `FAILED_PRECONDITION`, `CONTRACT_VIOLATION`,
`UNAVAILABLE`, `UNKNOWN`. Backend additionally needs a normalized
`ALREADY_EXISTS` and `INTERNAL`; their mapping to transport status is an R1
decision, not a Shared modification here.

Responses may include operation, resource category, stable sanitized message,
command/correlation IDs and retryable flag. They must not expose secrets,
tokens, credentials, emails, raw payloads, document snapshots, stack traces or
internal causes. Validation/auth/lifecycle errors are definitive; transaction
contention and unavailable may be retryable; reused commandId with different
input is a definitive conflict.

## 11. Privileged audit model

Candidate tenant path is `tenants/{tenantId}/auditEvents/{eventId}` and a
separate restricted platform log is needed for bootstrap/platform operations.
Neither is approved in the physical model. Minimum event fields are actorUid,
actorType, verified authority, tenantId nullable only for platform scope,
operation, resourceType/resourceId, commandId, correlationId, idempotencyKey
reference, requestedAt, executedAt, result, sanitized errorCode, source and
minimized before/after state.

Audit is required-before-success and in the same transaction for all privileged
Firestore mutations. Bootstrap, platform lifecycle, role/status, approval,
repair and break-glass are Critical. External observability is best effort after
commit. Tokens, secrets, passwords, full sensitive payloads and unsanitized
errors are prohibited. Paths, retention, client access (deny), legal hold and
PII minimization are `AUDIT_CONTRACT_BLOCKER` items for R1.

## 12. Backend topology

| Alternative | Fit | Benefits | Costs/risks | Decision |
|---|---|---|---|---|
| Firebase Cloud Functions 2nd gen, Node | High for Firebase-centric MVP | callable auth context, Admin SDK, transactions, local Emulator path, small ops surface | cold starts, Firebase/GCP lock-in, secrets/deploy setup | provisional MVP recommendation after R1 |
| Cloud Run Node service | High target for broader command/API workload | explicit HTTP service, concurrency/observability/portability | larger auth, routing, CORS/CSRF and operations surface | target/migration option when workload justifies it |
| Independent Node backend | Medium | provider portability | highest deployment, identity and secret burden today | deferred |
| Temporary Function for bootstrap | Low | familiar deploy | expands attack surface and circular authority | rejected; bootstrap remains out-of-band |

There is no current backend foundation, so topology remains formally blocked
until R1 freezes transport (callable versus authenticated HTTP), region,
runtime, Admin initialization, service account, secret store, App Check/rate
limits, deployment and rollback. Recommendation is not implementation approval.

Backend command modules must depend on pure contracts/validators/paths, not
React, UI state, `src/firebase.js` or client repositories. Extracting pure
contracts into a neutral package is preferred; temporary controlled duplication
is acceptable only with contract tests and an owner. Client serializers can
inform shapes but are not server authorization.

## 13. Security and environments

- Least-privilege service identities per environment/job; no key JSON in repo;
  managed secrets and environment allowlists; separate demo/dev/staging/prod.
- Verify Firebase ID token and persistent authority on every human command.
  Claims accelerate routing but never stand alone. App Check may reduce abuse,
  not authorize actors. Callable handles CSRF differently; HTTP needs explicit
  CORS/CSRF contract. Both require rate limits and replay protection.
- Safe structured logs, dependency pinning/scanning, reviewed CI/CD, protected
  deploy approvals, rollback and break-glass evidence are required.

| Environment | Project/data | Credentials/deploy | Required policy |
|---|---|---|---|
| local | Emulator-only `demo-polish-learning`, synthetic | ADC/emulator only; no remote deploy | Firestore/Auth emulators as needed; no real secrets |
| demo | identifier not approved; synthetic | isolated managed identity | no production data/authority |
| development | not defined | separate identity and secret set | human-approved creation before use |
| staging | not defined; synthetic/anonymized only | CI protected deployment | production-like policy, no prod credentials |
| production | not documented | least privilege, protected environment | two-person bootstrap/deploy, audit, backups/rollback |

`demo-polish-learning` remains an Emulator project ID, not a remote project.
Undefined project IDs must not be invented.

## 14. Risks, blockers and deferred decisions

| Category | Open decision | Effect |
|---|---|---|
| BACKEND_TOPOLOGY_BLOCKER | transport/runtime/region/deploy foundation | blocks backend foundation |
| COMMAND_CONTRACT_BLOCKER | exact schemas/results and command record path | blocks endpoints/handlers |
| AUTHORIZATION_CONTRACT_BLOCKER | persistent platform authority path and claim reconciliation | blocks platform commands |
| BOOTSTRAP_CONTRACT_BLOCKER | zero-admin proof, quorum/recovery and Tenant+first-admin transaction | blocks both bootstraps |
| IDEMPOTENCY_CONTRACT_BLOCKER | command record schema/retention and payload mismatch proof | blocks safe retries |
| AUDIT_CONTRACT_BLOCKER | tenant/platform paths, retention, before/after policy | blocks privileged success semantics |
| TRANSACTION_BOUNDARY_BLOCKER | transaction size/access budgets; first-admin/config/audit composition | blocks CreateTenant implementation |
| SECRET_MANAGEMENT_BLOCKER | managed secret provider and service identity | blocks deploy/bootstrap execution |
| ENVIRONMENT_STRATEGY_BLOCKER | approved dev/staging/prod projects and separation | blocks remote validation |
| DEPLOYMENT_STRATEGY_BLOCKER | CI/CD approvals, rollback, observability | blocks release |

Additional deferred product policies: invitation model and retention;
Membership last-tenant-admin protection; Enrollment Membership–Course uniqueness
and reenrollment; version/CAS fields; Identity anonymization; course content
legacy coordination; expiry scheduling. They are not permission to weaken Rules.

## 15. Microphases

1. `SaaS-03B-A-R1` — resolve topology, platform authority, audit, command,
   idempotency, invitation, transaction and environment contracts.
2. `SaaS-03B-B` — privileged backend foundation and pure command boundary.
3. `SaaS-03B-B-C1` — security review and controlled commits.
4. `SaaS-03B-C` — out-of-band platform_admin bootstrap and recovery evidence.
5. `SaaS-03B-D` — atomic Tenant/first-tenant_admin bootstrap.
6. `SaaS-03B-E` — RegistrationRequest/Membership/invitation commands.
7. `SaaS-03B-F` — Course/Enrollment commands, after product blockers close.
8. `SaaS-03B-R` — Emulator/runtime/security/CI and shadow closure.

No microphase after A is started. R1 may split implementation phases further;
it must not collapse security review or bootstrap ceremonies.

## 16. Readiness and closure criteria

| Criterion | Result |
|---|---|
| Sources and infrastructure audited | Meets |
| Privileged operations and actors inventoried | Meets |
| Rules/backend/Domain authority separated | Meets |
| Cross-root invariants and transaction needs identified | Meets |
| Bootstrap intent identified | Meets |
| Implementable bootstrap physical contract | Does not meet; R1 |
| Implementable command/idempotency/audit contract | Does not meet; R1 |
| Backend/environment/deployment topology frozen | Does not meet; R1 |
| Risks and microphases classified | Meets |
| Technical files untouched | Meets |

Decision: `SaaS-03B-A = COMPLETE` as an audit. Implementation readiness is
`READY_WITH_RESOLUTIONS`, not ready to build. `SaaS-03B-A-R1` is required and
not started.

## 17. R1 resolution status

`SAAS_03B_A_R1_PRIVILEGED_BACKEND_BOOTSTRAP_CONTRACT_RESOLUTION.md` supersedes
only the open-blocker/readiness conclusions of this audit while preserving its
evidence. R1 resolved all ten blocker categories, froze Functions 2nd gen/Node
22, authority/command/audit roots, bootstrap sagas, transaction and environment
contracts, and requires pure-contract extraction first.

```text
SaaS-03B-A-R1 = completed_pending_human_contract_review
SaaS-03B-B0 = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0
Privileged Backend = not_created
```
