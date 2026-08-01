# Mandatory Firebase Security Review Gate

## 1. Alcance y estado previo

Esta auditoría consolida la especificación de seguridad previa a SaaS-02C. No
contiene sintaxis de Rules ni modifica Firebase. Estado de entrada: Domain 1.2.0
Frozen, Architecture Freeze Approved, SaaS-02A/B completos y SaaS-02C no
iniciado. Se revisaron las 19 fuentes documentales, los cinco directorios de
dominio y, como evidencia legacy, `firestore.rules`, `storage.rules`,
`firestore.indexes.json`, `src/firebase.js` y `tests/rules/`.

El scaffold vigente niega toda lectura/escritura. No se considera una política
funcional aprobada.

## 2. Topología protegida

| Path canónico | Scope | Root/VO |
|---|---|---|
| `identities/{uid}` | global/self/platform | Identity |
| `tenants/{tenantId}` | tenant/platform | Tenant |
| `tenants/{tenantId}/configuration/settings` | tenant | Settings + RegistrationPolicy |
| `tenants/{tenantId}/configuration/branding` | tenant | Branding |
| `tenants/{tenantId}/registrationRequests/{requestId}` | self/tenant/system | RegistrationRequest |
| `tenants/{tenantId}/registrationRequestKeys/{uidKey}` | backend | Request constraint |
| `tenants/{tenantId}/memberships/{membershipId}` | self/tenant/backend | Membership |
| `tenants/{tenantId}/membershipKeys/{uidKey}` | backend | Membership constraint |
| `tenants/{tenantId}/courses/{courseId}` | tenant | Course |
| `tenants/{tenantId}/enrollments/{enrollmentId}` | self/tenant/backend | Enrollment |

No se aprueba ningún path adicional.

## 3. Principios

Denegación por defecto; tenant isolation por path y datos; cero confianza en
tenantId/role/status/capabilities/ownership/timestamps aportados por cliente;
backend para platform, system, privileged y cross-root; IDs, ownership y refs
inmutables; transiciones cerradas; queries compatibles con Rules; y
platform_admin sin acceso implícito al contenido privado Tenant.

## 4. Actores y autoridad futura

| Actor | Fuente futura | Scope/lecturas | Escrituras y prohibiciones | Riesgo/control |
|---|---|---|---|---|
| anonymous | ausencia de Auth | ninguna mientras public visibility esté deferred | deny all | evitar catálogo/branding accidental |
| identity_self | `request.auth.uid` + Identity | perfil, Requests/Memberships propias, Enrollment propio compuesto | sólo profile/locale candidatos directos | ownership estricto |
| tenant_member | Auth + Membership approved + Tenant active | shell, Courses permitidos, recursos propios | ninguna privilegiada | revalidar Tenant/Membership |
| student | Membership role student | capacidades canónicas tenant/self | sin writes académicos administrativos | least privilege |
| teacher | Membership role teacher | Courses tenant; Enrollment amplio deferred | Course create/update sólo por backend | no activate/archive/admin |
| tenant_admin | Membership approved role tenant_admin | administración del mismo Tenant | comandos privilegiados por backend | no cross-tenant/platform metadata |
| platform_admin | claim/registro futuro + backend auditado | metadata/lifecycle platform aprobados | backend; no contenido privado automático | evitar overreach/impersonation |
| platform_system | identidad de servicio futura | expiry/repair/maintenance mínimos | system backend only | sin sesión humana ni acceso indiscriminado |
| trusted_backend | infraestructura, no rol | sólo datos necesarios por comando autorizado | writer privilegiado/audit | nunca inventa actor/capability |

## 5. Matriz CRUD por path

Valores conceptuales, no Rules ejecutables.

| Path | Actor | Create | Read | Update | Delete | Capability | Context | Backend only | Reason |
|---|---|---|---|---|---|---|---|---|---|
| identities/{uid} | identity_self | Deny | Allow conceptually | Allow conceptually (profile/locale) | Deny | read_self/update_self | uid=self | No para update limitado | ownership directo |
| identities/{uid} | platform_admin | Backend only | Backend only | Deny | Deny | platform.identity_read | platform authority | Yes | lookup con propósito/audit |
| identities/{uid} | trusted_backend | Backend only | Backend only | Backend only | Deferred | bootstrap | Auth identity | Yes | sincronización/autoritativo |
| tenants/{tenantId} | tenant_member | Deny | Allow conceptually | Deny | Deny | tenant.read | active Tenant + approved Membership | No read | shell tenant |
| tenants/{tenantId} | tenant_admin | Deny | Allow conceptually | Backend only | Deny | tenant.update | same tenant | Yes update | field ownership/audit |
| tenants/{tenantId} | platform_admin | Backend only | Backend only | Backend only | Deny | platform tenant capabilities | platform | Yes | lifecycle/metadata |
| configuration/settings | tenant member/admin | Deny | Allow conceptually, policy-limited | Backend only admin | Deny | tenant.manage_settings | same active tenant | Yes write | shape/CAS |
| configuration/branding | tenant member/admin | Deny | Allow conceptually tenant-only | Backend only admin | Deny | tenant.manage_branding | same active tenant | Yes write | public deferred |
| registrationRequests/{requestId} | identity_self | Backend only | Allow conceptually self | Backend only cancel | Deny | create/read_self/cancel_self | path tenant + uid=self | Yes writes | requestKey/policy/time |
| registrationRequests/{requestId} | tenant_admin | Deny | Allow conceptually | Backend only | Deny | list/review | same active tenant | Yes writes | workflow/audit |
| registrationRequests/{requestId} | platform_system | Deny | System only | System only expiry | Deny | technical | system | Yes | expiry |
| registrationRequestKeys/{uidKey} | any client | Deny | Deny | Deny | Deny | none | none | Yes | enumeration/constraint |
| memberships/{membershipId} | identity_self | Deny | Allow conceptually self | Backend only leave | Deny | read_self/leave_self | uid=self, same tenant | Yes write | key/history |
| memberships/{membershipId} | tenant_admin | Deny | Allow conceptually | Backend only | Deny | list/change_role/suspend/restore/remove | same active tenant | Yes writes | role/status/audit |
| memberships/{membershipId} | student/teacher | Deny | self only | Deny | Deny | membership.read_self | uid=self | No read | no member directory grant |
| membershipKeys/{uidKey} | any client | Deny | Deny | Deny | Deny | none | none | Yes | enumeration/uniqueness |
| courses/{courseId} | approved tenant member | Deny | Allow conceptually | Deny | Deny | course.list/read | same active tenant | No read | no anonymous/platform implicit |
| courses/{courseId} | teacher/tenant_admin | Backend only by capability | Allow conceptually | Backend only | Deny | create/update; activate/archive admin only | same active tenant | Yes writes | state/audit |
| enrollments/{enrollmentId} | identity_self | Deny | Allow conceptually via own Membership | Backend only cancel | Deny | read_self/cancel_self | same tenant + Membership.uid=self | Yes write | indirect ownership/audit |
| enrollments/{enrollmentId} | tenant_admin | Backend only | Allow conceptually | Backend only | Deny | enrollment capabilities | same active tenant | Yes | refs/state/audit |
| enrollments/{enrollmentId} | teacher | Deny | Deferred/least privilege deny | Deny | Deny | no approved broad access | same tenant | n/a | FAP-005 |

## 6. Seguridad por documento y campos

### 6.1 Matriz de campos

| Document type | Field(s) | Required create | Mutable | Mutable by | Immutable | Backend authoritative | Security relevance |
|---|---|---:|---:|---|---:|---:|---|
| Tenant | tenantId, createdAt | Yes | No | none | Yes | Yes | identity/path |
| Tenant | tenantType | Yes | Yes | platform_admin backend | No | Yes | platform ownership |
| Tenant | displayName, shortName, country, locale, timezone | Yes | Yes | tenant_admin backend | No | Yes | field overposting |
| Tenant | status, suspendedAt, archivedAt, updatedAt | Yes/conditional | workflow only | platform backend | state-managed | Yes | tenant access gate |
| Identity | uid, createdAt | Yes | No | none | Yes | Yes | self ownership |
| Identity | displayName, photoURL, interfaceLocale | Yes | Yes | identity_self limited | No | updatedAt yes | only direct client patch |
| Identity | email, emailVerified | Yes | sync only | Auth/backend | client-immutable | Yes | verification/spoofing |
| Settings | tenantId | Yes | No | none | Yes | Yes | parent equality |
| Settings | defaultLocale, registrationPolicy, featureFlags, supportEmail, supportUrl | Yes | Yes | tenant_admin backend | No | updatedAt yes | policy/map bounds |
| Branding | tenantId | Yes | No | none | Yes | Yes | parent equality |
| Branding | displayName, logoUrl, faviconUrl, colors | Yes | Yes | tenant_admin backend | No | updatedAt yes | URLs/map bounds/public deferred |
| RegistrationRequest | requestId, tenantId, uid, requestedRole, requestedAt | Yes | No | none | Yes | Yes | ownership/tenant/history |
| RegistrationRequest | status, reviewedAt/by, approvedMembershipId, cancelledAt, expiredAt | conditional | workflow only | backend/system | once set/state-bound | Yes | privileged transition |
| RegistrationRequestKey | uidKey, uid, requestId, status/metadata approved by topology | Yes | lifecycle | backend | client-immutable | Yes | constraint/enumeration |
| Membership | membershipId, tenantId, uid, originRequestId, createdAt, approvedAt, approvedBy | Yes | No | none | Yes | Yes | ownership/refs/history |
| Membership | role, status, suspendedAt, removedAt, updatedAt | Yes/conditional | workflow only | backend | state-bound | Yes | escalation/access |
| MembershipKey | uidKey, uid, membershipId, lifecycle metadata | Yes | lifecycle | backend | client-immutable | Yes | uniqueness/access lookup |
| Course | courseId, tenantId, createdAt | Yes | No | none | Yes | Yes | ownership/path |
| Course | displayName, description, learningLanguage, supportLanguageCode, interfaceLanguages, cefrLevel | Yes | Yes | teacher/admin backend by capability | No | updatedAt yes | BCP47/map-array bounds |
| Course | status, archivedAt | Yes/conditional | workflow only | tenant_admin backend | state-bound | Yes | visibility/enrollment |
| Enrollment | enrollmentId, tenantId, membershipId, courseId, enrolledAt | Yes | No | none | Yes | Yes | indirect ownership/refs |
| Enrollment | status, completedAt, cancelledAt, updatedAt | Yes/conditional | workflow only | backend | state-bound | Yes | lifecycle/audit |

Identity self puede cambiar exclusivamente displayName, photoURL e
interfaceLocale; uid/email/emailVerified/createdAt y timestamps autoritativos no
son input confiable. No se autoriza borrado físico. Anonimización sigue deferred.

Settings/Branding se crean con Tenant por backend. Su lectura exige contexto
Tenant; anonymous/pre-membership branding permanece denegado. Maps/arrays,
URLs y BCP 47 requieren validación futura; CAS/version sigue deferred.

Request y Membership keys son totalmente opacos al cliente. Backend valida
uidKey contra uid autoritativo, escribe lifecycle atómicamente y repara
fail-closed. `removed` libera el membershipKey conforme al modelo aprobado; el
Membership histórico permanece.

## 7. Matriz de transiciones

| Root | From | To | Actor | Capability | Client candidate | Backend required | Rules validation possible |
|---|---|---|---|---|---:|---:|---:|
| Tenant | active | suspended | platform_admin | platform.tenant_suspend | No | Yes | partial |
| Tenant | suspended | active | platform_admin | platform.tenant_restore | No | Yes | partial |
| Tenant | active | archived | platform_admin | platform.tenant_archive | No | Yes | partial |
| Tenant | suspended | archived | platform_admin | platform.tenant_archive | No | Yes | partial |
| RegistrationRequest | pending | approved | tenant_admin | registration_request.review | No | Yes | partial |
| RegistrationRequest | pending | rejected | tenant_admin | registration_request.review | No | Yes | partial |
| RegistrationRequest | pending | cancelled | identity_self | registration_request.cancel_self | No | Yes | partial |
| RegistrationRequest | pending | expired | platform_system | technical | No | System only | No client |
| Membership | approved | suspended | tenant_admin | membership.suspend | No | Yes | partial |
| Membership | approved | removed | tenant_admin/identity_self | membership.remove/leave_self | No | Yes | partial |
| Membership | suspended | approved | tenant_admin | membership.restore | No | Yes | partial |
| Membership | suspended | removed | tenant_admin/identity_self | membership.remove/leave_self | No | Yes | partial |
| Course | draft | active | tenant_admin | course.activate | No | Yes | partial |
| Course | draft | archived | tenant_admin | course.archive | No | Yes | partial |
| Course | active | archived | tenant_admin | course.archive | No | Yes | partial |
| Enrollment | pending | active | tenant_admin | enrollment.update_status | No | Yes | partial |
| Enrollment | pending | cancelled | tenant_admin/identity_self | update_status/cancel_self | No | Yes | partial |
| Enrollment | active | completed | tenant_admin | enrollment.update_status | No | Yes | partial |
| Enrollment | active | cancelled | tenant_admin/identity_self | update_status/cancel_self | No | Yes | partial |

## 8. Matriz de lecturas

| Path | Actor/scope | Ownership | Tenant/status | Query compatibility | Decision |
|---|---|---|---|---|---|
| Identity point | self | uid=self | none | point | Allow conceptually |
| Identity point | platform_admin | backend purpose | platform | point | Backend only |
| Tenant/config point | approved member/admin | Membership actor | same active Tenant | point bundle | Allow conceptually; config least privilege |
| Tenant lists | platform_admin | n/a | platform | FQ-TEN | Backend only |
| Request point/list | self | uid=self | path Tenant | point/FQ-RRQ | Allow conceptually |
| Request tenant inbox/history | tenant_admin | approved admin | same active Tenant | FQ-RRQ | Allow conceptually |
| Request expiry | platform_system | n/a | system | FQ-RRQ-007 | System only |
| Membership point/CG | self | uid=self immutable | path derived/each result | FQ-MEM-003 requires uid filter | Allow conceptually |
| Membership directory/history | tenant_admin | approved admin | same active Tenant | FQ-MEM | Allow conceptually |
| Course point/list/history | tenant member/admin | capability | same Tenant; active for ordinary use | FQ-CRS | Allow conceptually |
| Course anonymous/platform content | anonymous/platform | none | none | technically possible | Deny/deferred |
| Enrollment self | identity_self | Membership.uid=self | same Tenant | FQ-ENR per Membership | Allow conceptually |
| Enrollment admin | tenant_admin | approved admin | same active Tenant | FQ-ENR | Allow conceptually |
| Enrollment teacher | teacher | unresolved | same tenant | FQ possible | Deferred; deny |
| keys | clients | none | none | point technically possible | Deny |

## 9. Matriz de escrituras — 29 operaciones

| Operation | Path/root | Actor/capability | Allowed/immutable | State | Rules possible | Backend | Decision |
|---|---|---|---|---|---:|---:|---|
| CreateTenant | Tenant+config | platform_admin/create | canonical shape/IDs | create active | No | Yes | Backend only |
| UpdateTenantProfile | Tenant | tenant_admin/tenant.update | owned fields/IDs+status | n/a | partial | Yes | Backend only |
| PlatformUpdateTenantMetadata | Tenant | platform_admin/platform.update | tenantType/others | n/a | partial | Yes | Backend only |
| UpdateTenantSettings | settings | tenant_admin/manage_settings | VO/tenantId | n/a | partial | Yes | Backend only |
| UpdateTenantBranding | branding | tenant_admin/manage_branding | VO/tenantId | n/a | partial | Yes | Backend only |
| SuspendTenant | Tenant | platform_admin/suspend | status timestamps/identity | active→suspended | partial | Yes | Backend only |
| RestoreTenant | Tenant | platform_admin/restore | status updatedAt/identity | suspended→active | partial | Yes | Backend only |
| ArchiveTenant | Tenant | platform_admin/archive | status archivedAt/identity | active/suspended→archived | partial | Yes | Backend only |
| CreateIdentity | Identity | bootstrap/technical | canonical/uid | create | partial | Yes | Backend only |
| UpdateIdentityProfile | Identity | self/update_self | displayName/photoURL/immutable set | n/a | Yes | No | Direct candidate |
| UpdateInterfaceLocale | Identity | self/update_self | interfaceLocale/immutable set | n/a | Yes | No | Direct candidate |
| CreateRegistrationRequest | Request+key | self/create | canonical/IDs+refs | create pending | No | Yes | Backend only |
| CancelRegistrationRequest | Request+key | self/cancel_self | status/time/IDs+refs | pending→cancelled | partial | Yes | Backend only |
| ExpireRegistrationRequest | Request+key | system/technical | status/time/IDs+refs | pending→expired | No | System | System only |
| RejectRegistrationRequest | Request+key | admin/review | review fields/IDs+refs | pending→rejected | partial | Yes | Backend only |
| ApproveRegistrationRequest | Request+Membership+keys | admin/review | cross-root canonical | pending→approved | No | Yes | Backend only |
| ChangeMembershipRole | Membership | admin/change_role | role/IDs+refs | approved/suspended | partial | Yes | Backend only |
| SuspendMembership | Membership+key | admin/suspend | status/time/IDs+refs | approved→suspended | partial | Yes | Backend only |
| RestoreMembership | Membership+key | admin/restore | status/time/IDs+refs | suspended→approved | partial | Yes | Backend only |
| LeaveMembership | Membership+key | self/leave_self | status/time/IDs+refs | approved/suspended→removed | partial | Yes | Backend only |
| RemoveMembership | Membership+key | admin/remove | status/time/IDs+refs | approved/suspended→removed | partial | Yes | Backend only |
| CreateCourse | Course | teacher/admin/create | canonical/IDs+tenant | create draft | partial | Yes | Backend only |
| UpdateCourse | Course | teacher/admin/update | content/IDs+status | draft/active | partial | Yes | Backend only |
| ActivateCourse | Course | admin/activate | status/identity | draft→active | partial | Yes | Backend only |
| ArchiveCourse | Course | admin/archive | status/time/identity | draft/active→archived | partial | Yes | Backend only |
| CreateEnrollment | Enrollment+validation roots | admin/create | canonical/IDs+refs | create pending | No | Yes | Backend only |
| ActivateEnrollment | Enrollment | admin/update_status | status/time/refs | pending→active | partial | Yes | Backend only |
| CompleteEnrollment | Enrollment | admin/update_status | status/time/refs | active→completed | partial | Yes | Backend only |
| CancelEnrollment | Enrollment | self/admin cancel capability | status/time/refs | pending/active→cancelled | partial | Yes | Backend required |

Backend-only también incluye CreateMembership dentro de approval, todos los
writes de keys/audit, bootstrap platform_admin y repair/reconciliation.

## 10. Client candidates

| Operation | Path | Ownership/capability | Allowed fields | Time | Residual risk | Recommendation |
|---|---|---|---|---|---|---|
| UpdateIdentityProfile | identities/{uid} | auth.uid=uid; identity.update_self | displayName, photoURL | authoritative updatedAt/request.time policy | overposting | Direct client write candidate |
| UpdateInterfaceLocale | identities/{uid} | auth.uid=uid; identity.update_self | interfaceLocale only | authoritative updatedAt/request.time policy | malformed BCP47 | Direct client write candidate |
| CancelEnrollment self | tenant Enrollment | Membership.uid=auth.uid; cancel_self | status + cancelledAt/updatedAt only | authoritative | indirect ownership, cross-doc read, audit | Trusted backend required |

CancelEnrollment self se reserva al backend: la decisión reduce complejidad de
Rules, evita N+1/limits y asegura timestamps/audit sin cambiar la capability.

## 11. Matriz Rules vs backend

| Validation | Rules | Backend | Both | Application only | Reason | Risk if omitted |
|---|---:|---:|---:|---:|---|---|
| authentication/self ownership/path tenant | Yes | Yes | Yes | UX | primera barrera | impersonation/leakage |
| email verification | Auth token check possible | Yes | Yes | UX | freshness/workflow | unverified access |
| Tenant/Membership existence/status | limited reads | Yes | Yes | UX | authoritative roots | suspended access |
| role/capability | membership data/claims limited | Yes | Yes | UX | business authorization | escalation |
| allowed/immutable fields | Yes | Yes | Yes | UX | diff/command allowlist | overposting |
| state transition | simple subset | Yes | Yes | UX | cross-root/lifecycle | arbitrary state |
| references/cross-root consistency | limited | Yes | Yes | No | transaction | dangling/cross-tenant |
| uniqueness/lookups/idempotency | Deny client writes | Yes | No | No | transaction/commands | duplicates |
| authoritative timestamps/audit | request.time candidate | Yes | Yes for direct candidate | No | trust/evidence | tampering |
| platform_admin/platform_system | deny direct tenant content | Yes | No | No | privileged infrastructure | global escalation |
| collection-group self | query-compatible ownership | n/a read | Rules | UX | uid filter | global leakage |
| query limits/pagination | partial | enforce operationally | Both | UX | resource control | broad reads |
| BCP47/map-array sizes | basic shape/bounds | full validation | Both | UX | Rules limits | malformed/oversized data |

## 12. Collection-group security

| Query | Actor/filter | Ownership/Tenant | Risk | Index future | Decision |
|---|---|---|---|---|---|
| memberships CG | identity_self; mandatory uid==auth.uid | every result uid immutable=self; tenant derived from path | same-named subcollection/cross-tenant leakage | FI-CG-001/002 | allow only query compatible with ownership; deny without uid filter |
| registrationRequests CG | identity_self; mandatory uid==auth.uid | every result uid immutable=self; tenant path retained | broad request leakage | FI-CG-003/004 | allow only compatible self query; deny without uid filter |
| registrationRequests expiry CG | platform_system | system backend validates tenant/request | broad scan | FI-CG-005 | client deny; System only |

## 13. Role-specific policy

- **platform_admin:** lifecycle/metadata/lookups aprobados por backend; no Courses,
  Enrollments o Memberships privadas automáticas, impersonation o tenant_admin.
  Claim/registro/backend/audit deben permanecer separados.
- **tenant_admin:** Membership approved, same tenant, Tenant active y capability;
  comandos privilegiados backend; sin platform metadata, keys o audit directos.
- **teacher:** same active Tenant y approved Membership; read/list/create/update
  Course por capabilities y backend para writes; sin activate/archive; Enrollment
  amplio deny mientras FAP-005 siga deferred.
- **student:** Identity/Membership/Requests/Enrollments propios y Courses tenant
  accesibles; sin recursos ajenos, Course writes o cross-tenant.
- **anonymous:** read/write deny. Auth bootstrap futuro no concede acceso a datos;
  no se aprueba Branding ni catálogo público.

## 14. Timestamps, CAS y auditoría

createdAt/enrolledAt/requestedAt y timestamps de estado son backend/server
authoritative. Direct Identity candidates pueden exigir updatedAt equivalente a
request time, nunca un valor arbitrario. IDs y timestamps ya establecidos no se
reescriben; timestamps condicionales sólo aparecen con la transición asociada.

FWC-003 queda **Deferred to implementation**: un futuro `version` protege
Settings, Branding, Course, Membership/Request/Enrollment críticos; Rules base
pueden diseñarse sin él porque esos writes son backend-only. El cliente nunca lo
establecerá libremente.

FWC-004 queda **Deferred to SaaS-02C/implementation**: futuro log append-only,
backend-only, sin update/delete cliente y con actor, Tenant, capability,
operation, target, before/after, commandId, correlationId, timestamp, result y
error. Rules base pueden comenzar sin decidir su path.

## 15. Compatibilidad con consultas e índices

Las decisiones cubren 45 Query Contracts y 27 índices FI conceptuales. Los
filtros self y tenant deben formar parte de la query; no existe filtrado cliente
posterior. Paginación/cursor usan campos existentes. Son inseguras y se deniegan:
CG self sin uid, Course/Enrollment/Membership global sin contexto, tenant lists
de cliente, Course anonymous y teacher Enrollment amplio mientras esté deferred.

## 16. Riesgos

| Severidad | Riesgo | Tratamiento arquitectónico |
|---|---|---|
| Critical | cross-tenant leakage, privilege/role/tenantId spoofing, lookup manipulation, privileged direct writes | path+Membership+status, backend commands, client deny keys/audit, fail-closed |
| Critical | platform_admin overreach, audit tampering | backend purpose limitation, no implicit tenant content, authoritative append-only audit future |
| High | field/status/timestamp overposting, stale Membership, suspended/archived Tenant access | immutable allowlists, transactional reread, active/approved checks, server time |
| High | collection-group leakage/query-rule mismatch | mandatory uid filter, immutable uid, compatible Rules, deny broad query |
| Medium | N+1 authorization, recursive/read-call limits | tenant path, backend for indirect/cross-root writes, per-Membership Enrollment composition |
| Medium | emailVerified freshness, BCP47/maps/arrays | Auth authority + backend validation; bounded shape future |
| Low | CAS/version ausente, audit path pendiente | backend-only writes; deferred FWC-003/004 before implementation |
| Observation | public Branding/Course, teacher Enrollment, Storage resources | least-privilege deny until normative decision |

No queda riesgo Critical sin tratamiento arquitectónico; la implementación y
pruebas de esos controles pertenecen a fases posteriores.

## 17. Design gates

| Gate | Estado | Justificación |
|---|---|---|
| Firestore Rules Design Gate | Ready | paths, reads, direct candidates, deny backend writes y boundary definidos |
| Storage Rules Design Gate | Not ready | Media/Storage resources y ownership no están modelados; deny-all se conserva |
| Index Materialization Gate | Ready with non-blocking backlog | 27 FI definidos; materialización y pruebas posteriores |
| Rules Test Design Gate | Ready | decisiones positivas/negativas, tenant isolation y CG enumeradas |
| Backend Command Security Gate | Ready with non-blocking backlog | autoridad/atomicidad definidas; audit path y CAS físicos pendientes |

Storage Not ready no bloquea el diseño Firestore: Storage debe permanecer
deny-all y abordarse cuando exista modelo de recursos.

## 18. Criterios y conclusión

| Criterio | Resultado |
|---|---|
| Sin contradicciones contractuales | Cumple |
| Paths y actores definidos | Cumple |
| Lecturas/escrituras clasificadas | Cumple |
| Backend-only identificado | Cumple |
| Client candidates delimitados | Cumple |
| Inmutables y transiciones trazados | Cumple |
| Collection groups con estrategia | Cumple |
| Tenant isolation expresable | Cumple |
| Riesgos Critical tratados arquitectónicamente | Cumple |
| Rules/backend boundary suficiente | Cumple |

No se encontraron bloqueadores para iniciar el diseño documental de Firestore
Rules. Storage permanece bloqueado y deny-all, sin bloquear ese alcance.

```text
Mandatory Firebase Security Review Gate = APPROVED
SaaS-02C = next, not started
```

El gate aprueba preparación, no Rules, índices, backend ni despliegue.
