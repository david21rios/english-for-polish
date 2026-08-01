# Revalidación definitiva de autoridad de escritura — SaaS-02B.4D

## 1. Alcance y metodología

Auditoría independiente, read-only y basada en evidencia directa de Domain
1.2.0, los modelos de persistencia y el código declarativo. Se contaron IDs
únicos y se cruzaron operaciones, actores, capabilities, workflows, Access
Patterns, Query Contracts, topología, autoridad, atomicidad, concurrencia,
idempotencia, lookups, audit y frontera Rules/backend.

No se modificaron dominio, Firebase, Rules, índices, topología ni documentos de
cierre.

## 2. Fuentes

Se revisaron los doce documentos normativos exigidos y todos los archivos de
Organization, Academic, Identity, Authorization y Workflow.

Conteos reales:

| Artifact | Total | Breakdown |
|---|---:|---|
| Access Patterns | 70 | TEN 10, IDN 7, RRQ 11, MEM 11, CRS 13, ENR 13, CROSS 5 |
| Query Contracts | 45 | TEN 6, IDN 4, RRQ 8, MEM 7, CRS 7, ENR 8, CROSS 5 |
| Capabilities | 37 | 37 IDs únicos y 37 definiciones |
| Transitions | 19 | Tenant 4, Request 4, Membership 4, Course 3, Enrollment 4 |
| Logical operations | 29 | Tenant 8, Identity 3, Request 5, Membership 5, Course 4, Enrollment 4 |

## 3. FWR-001 — Closed

Las 18 transiciones humanas declaran `requiredCapability` o el mapa
`requiredCapabilities` correcto. SuspendTenant, approve/reject Request,
SuspendMembership, ambas rutas ArchiveCourse, activate/complete Enrollment y
cancel Enrollment self/admin coinciden con catálogo, asignación, actor, scope y
matriz de autoridad. Expiry es la única excepción técnica deliberada.

## 4. FWR-002 — Closed

`platform.tenant_restore` existe exactamente una vez, scope `platform`, resource
`tenant` y asignación exclusiva a platform_admin. `RestoreTenant` enlaza
`suspended -> active`, trusted backend, point read/reread, single-root
transaction, idempotencia tenantId+active, Critical audit, replay si active,
rechazo si archived y ausencia de cascadas. No existen nombres alternativos.

## 5. FWR-003 — Closed

`tenant.update` se vincula exclusivamente a `UpdateTenantProfile` y permite
displayName, shortName, country, locale y timezone para tenant_admin del mismo
Tenant. `platform.tenant_update` se vincula exclusivamente a
`PlatformUpdateTenantMetadata` y permite tenantType a platform_admin. Ambas son
trusted-backend, single-root y auditadas; no modifican status, Settings,
Branding, Policy ni contenido académico/privado.

Field ownership cubre los diez campos sin doble autoridad: tenantId/createdAt
inmutables; tenantType platform; cinco campos de perfil tenant; status por
operaciones dedicadas; updatedAt backend autoritativo.

## 6. FWR-004 — Closed

Domain vigente es 1.2.0. Las referencias 1.0.0/1.1.0 restantes describen
historia o fuente original. El modelo físico declara expresamente compatibilidad
con Domain 1.2.0.

## 7. Inventario de capabilities

Las 37 capabilities tienen ID único, definición, scope, resource, descripción,
asignación y uso conceptual. Las capabilities de lectura se trazan a Access
Patterns; las de create/update a operaciones; las de lifecycle a workflows;
las self a ownership; las platform a operaciones globales. No se identifican
capabilities huérfanas bloqueantes.

La heterogeneidad histórica `platform_tenant`/`tenant` como resource no produce
ambigüedad de ID, scope u operación y no contradice el contrato explícito de
`platform.tenant_restore`.

## 8. Inventario de operaciones

Las 29 operaciones tienen actor, root y autoridad. Veintiocho son operaciones
de negocio alineadas. `ExpireRegistrationRequest` es técnica y correctamente
diferida: platform_system, pending→expired, trusted backend, sin capability
humana ni acceso cliente.

No hay operación autorizable sin capability ni actor.

## 9. Cliente, backend y cross-root

Direct client permanece limitado a perfil, interfaceLocale y cancelación self
de Enrollment. CancelRegistrationRequest es self pero backend-only. Todas las
operaciones platform, cross-root, lookup, role/status administrativo, review,
creación institucional, repair, system y audit autoritativo requieren backend.

ApproveRegistrationRequest está alineada: tenant_admin,
registration_request.review, read set completo, cross-root transaction,
requestId, fail-closed y Critical audit. CreateEnrollment está alineada:
enrollment.create, Tenant/Membership/Course operativos y same-tenant,
transaction, enrollmentId y audit.

## 10. Lookups

registrationRequestKeys y membershipKeys tienen lifecycle coherente con
topología, autoridad, queries y concurrencia. Ambos se escriben sólo en backend,
participan en la transaction correspondiente y fallan cerrado ante reparación
ambigua. requestKey conserva estados terminales; membershipKey permanece en
approved/suspended/restored y se libera atómicamente en removed.

## 11. Concurrencia

La revalidación SaaS-02B.4D encontró que la matriz canónica documentaba doce escenarios, pero el criterio de SaaS-02B.4D
exige catorce escenarios mínimos e incluye tres casos nuevos no materializados:

- RestoreTenant concurrente con ArchiveTenant.
- SuspendTenant concurrente con RestoreTenant.
- UpdateTenantProfile concurrente con PlatformUpdateTenantMetadata.

SaaS-02B.4E agregó los tres casos con documentos, invariantes, autoridad,
control, resultado, retry y auditoría. FWR-005 queda
`resolved_pending_revalidation`; sólo SaaS-02B.4F puede cerrarlo.

## 12. Idempotencia

La revalidación SaaS-02B.4D encontró que la matriz canónica documentaba approval, CreateTenant, CreateEnrollment,
ArchiveTenant, RestoreTenant, ArchiveCourse, SuspendMembership, LeaveMembership
y edits. Omite explícitamente:

- SuspendTenant → `tenantId + suspended`.
- RestoreMembership → `membershipId + approved`.
- CancelRegistrationRequest → `requestId + cancelled`.

SaaS-02B.4E incorporó las tres filas con clave conceptual, replay, efectos
prevenidos y storage. FWR-006 queda `resolved_pending_revalidation`; sólo
SaaS-02B.4F puede cerrarlo.

## 13. Auditoría y backlog FWC

El modelo híbrido de audit es coherente: campos contractuales, log append-only
futuro y observabilidad correlacionada. Backend/system es writer autoritativo.

| ID | Estado | Bloqueo |
|---|---|---|
| FWC-003 | Deferred to implementation | No bloquea SaaS-02C |
| FWC-004 | Deferred to SaaS-02C | No bloquea Rules base |
| FWC-005 | Deferred to product | No bloquea Rules base |

## 14. Rules/backend boundary

La clasificación cubre auth, ownership, tenant path, immutable fields y cambios
self en Rules; status/lookup en ambos; y privileged capability, cross-root,
uniqueness, idempotencia, platform/system y audit en backend. No se escribe
sintaxis de Rules. Los blockers actuales pertenecen al cierre documental previo,
por lo que deben resolverse antes de usar esta matriz como entrada normativa.

## 15. Trazabilidad de Access Patterns

Los 70 IDs existen y AP-TEN-007/009/010 se trazan a Tenant root, FQ-TEN-001 o
point read, trusted backend y misma topología sin índice nuevo. SaaS-02B.4E
corrigió la afirmación vigente residual de 8 TEN/68 a 10 TEN/70 sin modificar
referencias históricas. FWR-007 queda `resolved_pending_revalidation`; sólo
SaaS-02B.4F puede cerrarlo.

## 16. Matriz definitiva de revalidación

| Operation | Actor | Capability | Scope | Workflow/AP/FQ | Documents | Authority | Atomicity | Idempotency | Concurrency/Audit | Rules/Backend | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CreateTenant | platform_admin | platform.tenant_create | platform | TEN/FQ-TEN | Tenant+config | backend | transaction | tenantId | Critical | backend | Aligned |
| UpdateTenantProfile | tenant_admin | tenant.update | tenant | AP-TEN-009/FQ-TEN-001 | Tenant | backend | single/field patch | command/version | disjoint-field scenario added; audit defined | backend | Corrected pending revalidation |
| PlatformUpdateTenantMetadata | platform_admin | platform.tenant_update | platform | AP-TEN-010/FQ-TEN-001 | Tenant | backend | single/field patch | command/version | disjoint-field scenario added; Critical | backend | Corrected pending revalidation |
| UpdateTenantSettings | tenant_admin | tenant.manage_settings | tenant | AP-TEN-005 | config | backend | transaction/CAS | command/version | defined | backend | Aligned |
| UpdateTenantBranding | tenant_admin | tenant.manage_branding | tenant | AP-TEN-006 | config | backend | transaction/CAS | command/version | defined | backend | Aligned |
| SuspendTenant | platform_admin | platform.tenant_suspend | platform | AP-TEN-007 | Tenant | backend | transaction | tenantId+suspended added | suspend/restore scenario added; Critical | backend | Corrected pending revalidation |
| RestoreTenant | platform_admin | platform.tenant_restore | platform | AP-TEN-007/FQ-TEN-001 | Tenant | backend | transaction | tenantId+active | restore/archive and suspend/restore scenarios added; Critical | backend | Corrected pending revalidation |
| ArchiveTenant | platform_admin | platform.tenant_archive | platform | AP-TEN-007 | Tenant | backend | transaction | tenantId+archived | defined | backend | Aligned |
| CreateIdentity | onboarding | technical N/A | self/global | IDN | Identity | backend/Auth | create | uid | Security | backend | Technical deferred |
| UpdateIdentityProfile | identity_self | identity.update_self | self | IDN | Identity | client+Rules | point | none | LWW/basic | Rules | Aligned |
| UpdateInterfaceLocale | identity_self | identity.update_self | self | IDN | Identity | client+Rules | point | none | LWW/basic | Rules | Aligned |
| CreateRegistrationRequest | identity_self | registration_request.create | self+tenant | RRQ | Request+key | backend | transaction | requestId | defined | backend | Aligned |
| CancelRegistrationRequest | identity_self | registration_request.cancel_self | self | RRQ | Request+key | backend | transaction | requestId+cancelled added | audit defined | backend | Corrected pending revalidation |
| ExpireRegistrationRequest | platform_system | technical N/A | system | workflow/RRQ | Request+key | backend | transaction | requestId+target | audit; implementation deferred | backend | Technical deferred |
| RejectRegistrationRequest | tenant_admin | registration_request.review | tenant | workflow/RRQ | Request+key | backend | transaction | requestId+target | defined | backend | Aligned |
| ApproveRegistrationRequest | tenant_admin | registration_request.review | tenant | CROSS-001 | Request+Membership+keys | backend | cross-root transaction | requestId | defined/Critical | backend | Aligned |
| ChangeMembershipRole | tenant_admin | membership.change_role | tenant | MEM | Membership | backend | transaction/CAS | command/version | defined | backend | Aligned |
| SuspendMembership | tenant_admin | membership.suspend | tenant | workflow/MEM | Membership+key | backend | transaction | membershipId+suspended | defined | backend | Aligned |
| RestoreMembership | tenant_admin | membership.restore | tenant | workflow/MEM | Membership+key | backend | transaction | membershipId+approved added | defined | backend | Corrected pending revalidation |
| LeaveMembership | identity_self | membership.leave_self | self | workflow/MEM | Membership+key | backend | transaction | membershipId+removed | defined | backend | Aligned |
| RemoveMembership | tenant_admin | membership.remove | tenant | workflow/MEM | Membership+key | backend | transaction | membershipId+removed | defined | backend | Aligned |
| CreateCourse | teacher/admin | course.create | tenant | CRS | Course | backend | create | courseId | Privileged | backend | Aligned |
| UpdateCourse | teacher/admin | course.update | tenant | CRS | Course | backend | transaction/CAS | command/version | defined | backend | Aligned |
| ActivateCourse | tenant_admin | course.activate | tenant | workflow/CRS | Course | backend | transaction | courseId+active | defined | backend | Aligned |
| ArchiveCourse | tenant_admin | course.archive | tenant | workflow/CRS | Course | backend | transaction | courseId+archived | defined | backend | Aligned |
| CreateEnrollment | tenant_admin | enrollment.create | tenant | CROSS-003 | validation roots+Enrollment | backend | transaction | enrollmentId | defined/Critical | backend | Aligned |
| ActivateEnrollment | tenant_admin | enrollment.update_status | tenant | workflow/ENR | Enrollment | backend | transaction | enrollmentId+active | defined | backend | Aligned |
| CompleteEnrollment | tenant_admin | enrollment.update_status | tenant | workflow/ENR | Enrollment | backend | transaction | enrollmentId+completed | defined | backend | Aligned |
| CancelEnrollment | self/admin | cancel_self/update_status | self/tenant | workflow/ENR | Enrollment | client/backend | point/transaction | enrollmentId+cancelled | defined | both | Aligned |

## 17. Nuevos hallazgos FWR

| ID | Evidencia | Impacto sobre Rules | Por qué no se aplaza |
|---|---|---|---|
| FWR-005 | `resolved_pending_revalidation`: SaaS-02B.4E agregó RestoreTenant/ArchiveTenant, SuspendTenant/RestoreTenant y las dos actualizaciones Tenant | Resultado/retry normativo documentado | SaaS-02B.4F debe revalidar |
| FWR-006 | `resolved_pending_revalidation`: SaaS-02B.4E agregó SuspendTenant, RestoreMembership y CancelRegistrationRequest | Replay backend documentado | SaaS-02B.4F debe revalidar |
| FWR-007 | `resolved_pending_revalidation`: SaaS-02B.4E corrigió el conteo vigente a 10 TEN/70 | Trazabilidad corregida sin cambiar patrones | SaaS-02B.4F debe revalidar |

## 18. Criterios de cierre

| Criterio | Resultado |
|---|---|
| FWR-001 cerrado | Cumple |
| FWR-002 cerrado | Cumple |
| FWR-003 cerrado | Cumple |
| FWR-004 cerrado | Cumple |
| Todas las operaciones tienen actor | Cumple |
| Todas las operaciones autorizables tienen capability | Cumple |
| No hay capabilities huérfanas bloqueantes | Cumple |
| Workflows y capabilities coinciden | Cumple |
| Field ownership inequívoco | Cumple |
| Cliente vs backend definido | Cumple |
| Cross-root definido | Cumple |
| Lookups coherentes | Cumple |
| Concurrencia definida | No cumple |
| Idempotencia definida | No cumple |
| Auditoría definida | Cumple |
| Rules/backend boundary definido | Cumple |
| 70 Access Patterns trazados | No cumple |
| Domain 1.2.0 preservado | Cumple |
| Topología preservada | Cumple |
| Firebase no modificado | Cumple |

## 19. Decisión

```text
SaaS-02B.4 write authority and concurrency model = INCOMPLETE
SaaS-02B = INCOMPLETE
SaaS-02C = NOT STARTED
Mandatory Firebase Security Review Gate = PENDING
```

Al resultar INCOMPLETE, no se actualizan los tres documentos de cierre.

## 20. Cierre posterior SaaS-02B.4F

Este resultado INCOMPLETE permanece como registro histórico de SaaS-02B.4D.
SaaS-02B.4E corrigió FWR-005/006/007 y la revalidación independiente
`FIRESTORE_WRITE_MODEL_CLOSURE_REVALIDATION.md` los verificó como Closed.

```text
SaaS-02B.4 write authority and concurrency model = COMPLETE
SaaS-02B = COMPLETE
Mandatory Firebase Security Review Gate = REQUIRED
SaaS-02C = NOT STARTED
```
