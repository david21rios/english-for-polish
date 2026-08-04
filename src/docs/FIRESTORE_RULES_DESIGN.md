# Diseño normativo de Firestore Security Rules — SaaS-02C.1

> Course FIX2 preserves the normative role/status matrix while resolving the
> approved Membership graph once before branching on role. Canonical Rules
> coverage becomes 222/88/134.

## 1. Alcance, fuentes y principios

Especificación conceptual previa a sintaxis ejecutable. Se auditaron los veinte
documentos normativos, cinco directorios de dominio y el scaffold deny-all con
sus pruebas como evidencia no autoritativa. Domain 1.2.0, topología, Access
Patterns, Query Contracts, capabilities y workflows permanecen intactos.

```text
Default read = deny
Default create = deny
Default update = deny
Default delete = deny
```

Fallan cerrado: actor no autenticado; Tenant ausente/archived; Membership
requerida ausente o no approved; role/scope/capability no comprobable;
tenantId/ref/lookup inconsistente; write cross-root cliente; overposting;
transición inválida; y query sin scope/filtro demostrable.

## 2. Helpers conceptuales

Los nombres no son funciones ejecutables.

| Helper | Purpose/input | Document reads | Paths | Missing behavior | Rules suitability | Backend |
|---|---|---|---|---|---|---|
| Authenticated | sesión válida | token | all | false | high | sensitive commands |
| Self identity | actor uid=target uid | none | Identity | false | high | no |
| Verified email | claim Auth verificado | token | onboarding/sensitive | false | high | revalidate commands |
| Tenant present/active | tenantId/status | Tenant | tenant tree | false | bounded | both |
| Membership present | exact membershipId | Membership | Enrollment | false | bounded | both |
| Own Membership | Membership.uid=actor | Membership | Membership/Enrollment | false | bounded | both |
| Approved Membership | actor membership approved | Membership | tenant reads | false | bounded single doc | writes backend |
| Tenant role/admin/teacher/student | exact approved role | Membership | tenant reads | false | bounded | privileged backend |
| Platform admin | future verified authority | token/registry future | platform operations | false | restricted | required |
| Same tenant | path tenant=document tenant | target | all tenant docs | false | high | both |
| Allowed field delta | changed keys subset | old/new target | Identity update | false | high | other docs backend |
| Immutable fields | protected keys preserved | old/new target | updates | false | high | both |
| Valid create shape | required/known keys | proposed target | creates | false | limited | authoritative |
| Valid transition | approved from/to | old/new target | lifecycle | false | partial | institutional backend |
| Self-scoped query | mandatory uid equality | query constraints | Membership/Request CG | deny broad | critical | no client filtering |

No helper recorre listas, ejecuta consultas internas ni calcula catálogos de
capabilities no acotados.

## 3. Rules read budget

| Operation/query | Tenant | Membership | Target | Related | Estimate | Risk | Strategy/backend alternative |
|---|---:|---:|---:|---:|---|---|---|
| Identity self update | 0 | 0 | implicit | 0 | Low | low | self path + field delta |
| Course read | 1 | 1 | implicit | 0 | Moderate | repeated list checks | shared predicates/backend fallback |
| Enrollment self | 0/1 | 1 referenced | implicit | 0 | Moderate | indirect ownership | one Membership lookup/backend fallback |
| Tenant admin list | 1 | 1 actor | implicit results | 0 | Moderate | repeated checks | same tenant predicates |
| Membership self CG | 0 | 0 | implicit results | 0 | Low | query mismatch | uid filter + immutable uid |
| Request self CG | 0 | 0 | implicit results | 0 | Low | query mismatch | uid filter + immutable uid |

Los límites numéricos se verificarán en implementación. N+1, múltiples
Memberships o lecturas no acotadas obligan a backend.

## 4. Matriz de paths

| Path | Read | Create | Update | Delete | Backend-only |
|---|---|---|---|---|---|
| `identities/{uid}` | self iff auth uid=path uid; platform backend | bootstrap backend | self profile/locale only | deny | create/Auth sync/platform/anonymize |
| `tenants/{tenantId}` | approved member; non-archived status info; operations only active | backend | backend | deny | create/profile/metadata/lifecycle |
| `tenants/{tenantId}/configuration/settings` | approved same-tenant member; non-archived | backend with Tenant | backend | deny | create/update/reconcile |
| `tenants/{tenantId}/configuration/branding` | approved same-tenant member; non-archived | backend with Tenant | backend | deny | create/update/reconcile |
| `tenants/{tenantId}/registrationRequests/{requestId}` | self uid; tenant_admin same Tenant; suspended history only | backend | direct deny | deny | create/cancel/review/expire |
| `tenants/{tenantId}/registrationRequestKeys/{uidKey}` | client deny | backend | backend | backend | all access/repair |
| `tenants/{tenantId}/memberships/{membershipId}` | self incl. history; same-tenant admin | backend approval | direct deny | deny | create/role/status/leave/remove |
| `tenants/{tenantId}/membershipKeys/{uidKey}` | client deny | backend | backend | backend | all access/repair |
| `tenants/{tenantId}/courses/{courseId}` | approved active-Tenant member; state by role | backend | backend | deny | create/update/activate/archive |
| `tenants/{tenantId}/enrollments/{enrollmentId}` | self via Membership; admin same Tenant; broad teacher deny | backend | backend | deny | all writes |

Tenant suspended permite sólo información de estado e historia autorizada; no
operaciones. Pre-membership/anonymous Settings, Branding y Policy son deny.
Keys son constraints internos totalmente opacos al cliente y repair fail-closed.

## 5. Matriz de campos

| Document | Fields grouped by identical policy | Required | Client mutable | Backend mutable | Immutable | Validation |
|---|---|---:|---:|---:|---:|---|
| Identity | uid,createdAt | yes | no | technical only | yes | path/time |
| Identity | email,emailVerified | yes | no | Auth sync | client | token authority/types |
| Identity | displayName,photoURL | yes/null | yes | yes | no | known keys/types/bounds |
| Identity | interfaceLocale | yes | yes | yes | no | BCP47 future validator |
| Identity | updatedAt | yes | request-time only | yes | no | authoritative time |
| Tenant | tenantId,createdAt | yes | no | no | yes | path/time |
| Tenant | tenantType | yes | no | platform backend | no | enum |
| Tenant | displayName,shortName,country,locale,timezone | yes | no | tenant backend | no | types/standards |
| Tenant | status,suspendedAt,archivedAt,updatedAt | conditional | no | lifecycle backend | state-bound | transition/time |
| Settings | tenantId | yes | no | no | yes | parent equality |
| Settings | defaultLocale,registrationPolicy,featureFlags,supportEmail,supportUrl,updatedAt | yes/null | no | tenant backend | no | keys/types/bounds/policy/time |
| Branding | tenantId | yes | no | no | yes | parent equality |
| Branding | displayName,logoUrl,faviconUrl,colors,updatedAt | yes/null | no | tenant backend | no | URL/color/keys/types/bounds/time |
| Request | requestId,tenantId,uid,requestedRole,requestedAt | yes | no | create only | yes | path/refs/enum/time |
| Request | status,reviewedAt,reviewedBy,approvedMembershipId,cancelledAt,expiredAt | conditional | no | workflow backend/system | state-bound | coherence/transition |
| RequestKey | canonical uid/request/lifecycle fields | yes | no | yes | client | correlation/transaction |
| Membership | membershipId,tenantId,uid,originRequestId,createdAt,approvedAt,approvedBy | yes/null | no | create only | yes | path/refs/history |
| Membership | role,status,suspendedAt,removedAt,updatedAt | conditional | no | workflow backend | state-bound | enum/transition/time |
| MembershipKey | canonical uid/membership/lifecycle fields | yes | no | yes/delete | client | uniqueness/correlation |
| Course | courseId,tenantId,createdAt | yes | no | create only | yes | path/time |
| Course | displayName,description,learningLanguage,supportLanguageCode,interfaceLanguages,cefrLevel | yes | no | teacher/admin backend | no | shape/bounds/BCP47/enum |
| Course | status,archivedAt,updatedAt | conditional | no | workflow backend | state-bound | transition/time |
| Enrollment | enrollmentId,tenantId,membershipId,courseId,enrolledAt | yes | no | create only | yes | path/refs/time |
| Enrollment | status,completedAt,cancelledAt,updatedAt | conditional | no | workflow backend | state-bound | transition/time |

Unknown fields, document replacement and map smuggling are denied by exact
field/shape allowlists.

## 6. Query Compatibility — 45 Query Contracts

`M` es Membership del actor; `T` es Tenant; `self` es uid autenticado.

| Contract | AP | Path/CG and mandatory filter | Ownership/Tenant/status | Reads | Decision |
|---|---|---|---|---|---|
| FQ-TEN-001 | TEN-001/002/008 | Tenant PR tenantId | M same tenant; non-archived/status info | T+M | member/system |
| FQ-TEN-002 | TEN-003/005 | settings PR | approved M; non-archived T | T+M | read client/write backend |
| FQ-TEN-003 | TEN-003/006 | branding PR | approved M; non-archived T | T+M | read client/public deny |
| FQ-TEN-004 | TEN-003 | three PR tenantId | approved M | T+M | bounded composition |
| FQ-TEN-005 | TEN-004 | tenants ordered | platform purpose | future authority | backend |
| FQ-TEN-006 | TEN-004/007 | tenants status filter | platform purpose | future authority | backend |
| FQ-IDN-001 | IDN-001/002/003/006 | Identity PR uid=self | self | none | client self |
| FQ-IDN-002 | IDN-004 | Identity PR | platform purpose | authority | backend |
| FQ-IDN-003 | IDN-005 | Identity PR minimal | existence only | none | backend |
| FQ-IDN-004 | IDN-007 | bounded Identity PRs | auditor purpose | authority | backend |
| FQ-RRQ-001 | RRQ-001/002/007-011 | Request PR | self uid or same-tenant admin/system | M admin | self read/backend others |
| FQ-RRQ-002 | RRQ-003 | tenant Requests uid=self | self + path tenant | none | client self |
| FQ-RRQ-003 | RRQ-003 | Request CG uid=self mandatory | every result self | none | client self; broad deny |
| FQ-RRQ-004 | RRQ-004/011 | key+Request | internal constraint | n/a | backend |
| FQ-RRQ-005 | RRQ-005 | tenant Requests status=pending | active T+admin M | T+M | admin read |
| FQ-RRQ-006 | RRQ-006 | terminal status set | admin/history policy | T+M | admin read |
| FQ-RRQ-007 | RRQ-010 | Request CG pending+cutoff | system | n/a | system only |
| FQ-RRQ-008 | RRQ-007/011,CROSS-001 | canonical point set | cross-root | n/a | backend |
| FQ-MEM-001 | MEM-001/006-009 | Membership PR | self or admin | target/M | self/admin read |
| FQ-MEM-002 | MEM-002/005/011 | key+Membership | internal lookup | n/a | backend |
| FQ-MEM-003 | MEM-003 | Membership CG uid=self mandatory | immutable self uid | none | client self; broad deny |
| FQ-MEM-004 | MEM-004 | tenant Memberships status/role | active T+admin M | T+M | admin read |
| FQ-MEM-005 | MEM-010 | terminal scoped Memberships | self/admin | M/target | history read |
| FQ-MEM-006 | MEM-005 | Membership PR after key | backend auth | n/a | backend |
| FQ-MEM-007 | MEM-007-009/011 | Membership+key PR | lifecycle | n/a | backend |
| FQ-CRS-001 | CRS-001/008-012 | Course PR | active T+approved M; role status | T+M | member read |
| FQ-CRS-002 | CRS-002/003 | tenant Courses; active for student | same tenant | T+M | member read |
| FQ-CRS-003 | CRS-004/013 | Courses status filter | tenant_admin | T+M | admin read |
| FQ-CRS-004 | CRS-005 | active+learning language | same tenant member | T+M | client read |
| FQ-CRS-005 | CRS-006 | active+support language | same tenant member | T+M | client read |
| FQ-CRS-006 | CRS-007 | status+both languages | status allowed by role | T+M | scoped read |
| FQ-CRS-007 | CRS-013/CROSS-005 | archived Courses+Enrollment | admin/history | T+M | composition |
| FQ-ENR-001 | ENR-001/009-011 | Enrollment PR | own Membership/admin | Membership | self/admin read |
| FQ-ENR-002 | ENR-002 | membershipId; optional status | own Membership/admin | Membership | self/admin read |
| FQ-ENR-003 | ENR-003/007 | courseId; optional status | admin; teacher deferred | T+M | admin only |
| FQ-ENR-004 | ENR-004/006 | optional status | tenant_admin | T+M | admin read |
| FQ-ENR-005 | ENR-013 | membershipId+courseId | backend invariant/admin | n/a | backend/admin |
| FQ-ENR-006 | ENR-005 | membershipId mandatory | own Membership | Membership | self per stream |
| FQ-ENR-007 | ENR-012/CROSS-005 | terminal+owner/course | exact self/admin scope | Membership/T+M | scoped read |
| FQ-ENR-008 | ENR-008/CROSS-003 | validation point set | cross-root | n/a | backend |
| FQ-CROSS-001 | CROSS-001 | approval point set | approval invariants | n/a | backend |
| FQ-CROSS-002 | CROSS-002 | Identity/Tenant/Membership/Request | derived access | bounded | backend/app; never persisted |
| FQ-CROSS-003 | CROSS-003 | enrollment validation roots | cross-root | n/a | backend |
| FQ-CROSS-004 | CROSS-004 | Tenant then institutional query | T active | T | gate query |
| FQ-CROSS-005 | CROSS-005 | Course+Enrollments | active writes/history | Course/T/M | backend/admin history |

No query usa filtrado posterior. Si path, filtros y lecturas acotadas no prueban
el predicado, queda backend-only.

## 7. Transiciones — 19

| Root | From | To | Actor | Capability | Direct client | Backend | Rules responsibility |
|---|---|---|---|---|---:|---:|---|
| Tenant | active | suspended | platform_admin | platform.tenant_suspend | No | Yes | deny client |
| Tenant | suspended | active | platform_admin | platform.tenant_restore | No | Yes | deny client |
| Tenant | active | archived | platform_admin | platform.tenant_archive | No | Yes | deny client |
| Tenant | suspended | archived | platform_admin | platform.tenant_archive | No | Yes | deny client |
| Request | pending | approved | tenant_admin | registration_request.review | No | Yes | deny client |
| Request | pending | rejected | tenant_admin | registration_request.review | No | Yes | deny client |
| Request | pending | cancelled | identity_self | registration_request.cancel_self | No | Yes | deny client |
| Request | pending | expired | platform_system | technical | No | System | deny client |
| Membership | approved | suspended | tenant_admin | membership.suspend | No | Yes | deny client |
| Membership | approved | removed | admin/self | membership.remove/leave_self | No | Yes | deny client |
| Membership | suspended | approved | tenant_admin | membership.restore | No | Yes | deny client |
| Membership | suspended | removed | admin/self | membership.remove/leave_self | No | Yes | deny client |
| Course | draft | active | tenant_admin | course.activate | No | Yes | deny client |
| Course | draft | archived | tenant_admin | course.archive | No | Yes | deny client |
| Course | active | archived | tenant_admin | course.archive | No | Yes | deny client |
| Enrollment | pending | active | tenant_admin | enrollment.update_status | No | Yes | deny client |
| Enrollment | pending | cancelled | admin/self | update_status/cancel_self | No | Yes | deny client |
| Enrollment | active | completed | tenant_admin | enrollment.update_status | No | Yes | deny client |
| Enrollment | active | cancelled | admin/self | update_status/cancel_self | No | Yes | deny client |

## 8. Client writes definitivos

| Operation | Path/actor | Allowed | Immutable | Ownership | Timestamp | Rule reads | Decision |
|---|---|---|---|---|---|---|---|
| UpdateIdentityProfile | Identity self | displayName,photoURL,updatedAt | uid,email,emailVerified,interfaceLocale,createdAt,unknowns | path uid=self | updatedAt=request time | target implicit | direct candidate |
| UpdateInterfaceLocale | Identity self | interfaceLocale,updatedAt | uid,email,emailVerified,profile,createdAt,unknowns | path uid=self | updatedAt=request time | target implicit | direct candidate |

Se adopta **timestamp Alternative A**: el cliente aporta el valor equivalente al
tiempo de request y Rules lo valida. Si la semántica exacta falla en
implementación, se deniega el write y se usa backend; nunca se relaja el tiempo.

CancelEnrollment self es backend-only: ownership por Membership (Alternative A,
sin duplicar uid), timestamp, audit y coste de lectura. Membership debe existir
en el mismo Tenant y pertenecer al actor; inconsistencia falla cerrado.

## 9. Backend-only definitivo — 27 operaciones

| Operations | Actor/capability | Documents | Client-denial reason | Backend validation | Audit |
|---|---|---|---|---|---|
| CreateTenant+config | platform_admin/create | Tenant+config | atomic bootstrap | authority/shapes/IDs | Critical |
| Tenant profile/metadata/lifecycle | tenant/platform admins; dedicated caps | Tenant | ownership/status/audit | actor/tenant/transition | Privileged/Critical |
| CreateIdentity/Auth sync/platform lookup | bootstrap/platform | Identity | Auth authority/purpose | token/reconciliation | Security |
| Request create/cancel/reject/approve/expire | self/admin/system caps | Request+keys+Membership approval | policy/key/cross-root/time | workflow/idempotency | Workflow/Critical |
| Membership create/role/suspend/restore/leave/remove | admin/self caps | Membership+key | uniqueness/key/history | actor/state/key | Critical |
| Course create/update/activate/archive | teacher/admin caps | Course | capability/state/audit | tenant/status/shape | Privileged |
| Enrollment create/activate/complete/cancel | admin/self caps | Enrollment+roots | refs/ownership/state | Tenant/Membership/Course | Critical/Workflow |
| key writes/repair and authoritative audit/bootstrap | backend/system/platform | roots/keys | constraint/evidence/escalation | transaction/fail-closed/correlation | Critical |

Rules niegan estas escrituras directas; Admin SDK/backend aplica validación y
auditoría. CreateMembership existe exclusivamente dentro de approval.

## 10. emailVerified y actores

Firebase Authentication token es autoritativo; Identity.emailVerified es
informativo. Onboarding sensible, Request create/approval y comandos que lo
requieran revalidan token/backend. Discrepancia falla cerrado y se reconcilia.

- platform_admin: backend-mediated para metadata/lifecycle/Identity; sin bypass
  tenant privado ni tenant_admin implícito.
- tenant_admin: Auth + active Tenant + approved same-tenant Membership + exact
  role/capability; reads admin y writes backend.
- teacher: Course reads; create/update backend; sin activate/archive ni broad
  Enrollment mientras FAP-005 siga deferred.
- student: Identity/Membership/Requests/Enrollments propios y active Courses.
- anonymous: read/write deny; Welcome usa contenido estático.

## 11. Collection groups

- Membership self: filtro obligatorio uid=self, uid inmutable y predicate de
  ownership compatible; sin filtro se deniega. Riesgo de subcolecciones homónimas
  se controla limitando la topología canónica.
- RegistrationRequest self: mismo filtro/predicate uid=self; sin filtro se
  deniega. Expiry es query system-only.

## 12. Riesgos y backlog FRD

### 12.1 Clarificación normativa SaaS-02C.2E-A

Con Tenant activo, Membership aprobada del mismo Tenant y documento canónico:

| Role | Readable Course statuses |
|---|---|
| student | active |
| teacher | draft, active |
| tenant_admin | draft, active, archived |

Tenant suspended o archived deniega Course a todos los clientes. PlatformAdmin
no recibe bypass directo. Enrollment self se prueba mediante su Membership
referenciada, sin uid duplicado; Membership approved/suspended/removed sirve
sólo para ownership histórico. Tenant active permite self y tenant_admin
same-Tenant; suspended permite únicamente self historical; archived deniega a
todo cliente. Teacher broad Enrollment continúa denegado por FAP-005.

Consultas: student Course `status==active`; teacher Course
`status in [draft,active]`; tenant_admin puede listar los tres estados dentro
del Tenant activo; Enrollment self exige `membershipId` propio. Enrollment
collection-group permanece denegado. Recuperación archived es backend auditado.

| Severity | Risks | Treatment |
|---|---|---|
| Critical | recursive auth, CG leakage, platform escalation, backend bypass | helpers bounded, uid filters, no platform bypass, deny privileged client writes |
| High | repeated reads/limits, query mismatch, stale token/Membership/Tenant, overposting, timestamp/reference spoofing, replacement/map smuggling | bounded shared reads, path+filters, authoritative checks, exact allowlists/time/refs |
| Medium | null/missing refs, BCP47/map bounds, indirect Enrollment ownership | fail-closed, backend full validation, one Membership lookup |
| Low | CAS/version and audit path pending | affected writes backend-only; FWC-003/004 deferred |
| Observation | emulator coverage, public content, teacher Enrollment, Storage | future phases; deny meanwhile |

| ID | Decision | Path/actor | Severity/impact | Treatment | Phase | Blocks C.2 |
|---|---|---|---|---|---|---:|
| FRD-001 | verify exact Rules read budget/reuse | Course/admin/Enrollment self | High if exceeded | emulator tests/backend fallback | C.2/tests | No |
| FRD-002 | concrete string/map/array and viable BCP47 bounds | Identity/config/Course | Medium | conservative Rules + backend validation | C.2 | No |
| FRD-003 | exact request-time semantics for Identity | Identity self | Medium | fail closed/backend fallback | C.2 | No |
| FRD-006 | Course readable statuses by role | Course | High | resolved: student active; teacher draft/active; admin all canonical states | C.2E-A | Pending reimplementation |
| FRD-007 | Enrollment under non-active Tenant | Enrollment | High | resolved: self active/suspended; archived deny; admin active only | C.2E-A | Pending reimplementation |

Todo Critical/High tiene tratamiento. Las entradas no duplican backlogs previos.

## 13. Storage y cierre

```text
Storage Rules Design Gate = Not ready
Storage posture = deny-all
```

| Criterion | Result |
|---|---|
| 10 paths, deny-by-default, helpers and budget | Cumple |
| Identity, Tenant, configuration, Request, lookups, Membership, Course, Enrollment | Cumple |
| 45 Query Contracts and 19 transitions | Cumple |
| Client writes and backend-only delimited | Cumple |
| Immutable fields and emailVerified | Cumple |
| Critical/High treated | Cumple |
| Storage blocked and Firebase unchanged | Cumple |

```text
SaaS-02C.1 Firestore Rules design = COMPLETE
SaaS-02C.2 = next, not started
```

No se implementan Rules, índices, tests, backend ni Storage.
