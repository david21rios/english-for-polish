# Revalidación final de autoridad, atomicidad y concurrencia

## 1. Alcance y decisión

SaaS-02B.4B reaudita Domain 1.1.0 y los modelos lógico, físico, de consulta y
de escritura sin modificar contratos, topología ni Firebase. La revisión cruza
las declaraciones ejecutables del dominio con la documentación normativa; no
presume correctas las conclusiones de SaaS-02B.4A.

Resultado:

```text
FWC-001 = Closed
FWC-002 = Closed
SaaS-02B.4 write authority and concurrency model = INCOMPLETE
SaaS-02B = INCOMPLETE
SaaS-02C = NOT STARTED
```

## 2. Fuentes auditadas

- `DOMAIN_VERSION.md`, `DOMAIN_MODEL_AUTHORIZATION.md`, `DOMAIN_WORKFLOW.md`.
- `PERSISTENCE_MODEL.md`, `PERSISTENCE_INVARIANTS_AND_OPERATIONS.md`.
- `FIRESTORE_ACCESS_PATTERNS.md`, `FIRESTORE_PHYSICAL_MODEL.md`.
- `FIRESTORE_QUERY_AND_INDEX_MODEL.md`.
- `FIRESTORE_WRITE_AUTHORITY_AND_CONCURRENCY.md`.
- `ARCHITECTURE_FREEZE_REVIEW.md` e
  `IMPLEMENTATION_ORDER_SAAS_MULTI_TENANT.md`.
- Código vigente de Organization, Academic, Identity, Authorization y Workflow.

## 3. FWC-001 — Closed

`registration_request.cancel_self` existe una sola vez en el catálogo, con
scope `self` y resource `registration_request`. Está una sola vez en
`IDENTITY_SELF_CAPABILITIES` y ausente de MembershipRole y PlatformRole.

La transición exclusiva `pending -> cancelled` declara `identity_self` y
`requiredCapability`. La arquitectura exige ownership por uid, trusted backend,
transaction Request+registrationRequestKey, timestamps autoritativos,
idempotencia por `requestId + cancelled` y auditoría. El estado es terminal.

## 4. FWC-002 — Closed

`membership.restore` existe una sola vez, con scope `tenant` y resource
`membership`. Está asignada exclusivamente a `tenant_admin`; no aparece en
student, teacher, platform_admin ni Identity Self Capabilities.

La transición exclusiva `suspended -> approved` declara actor y
`requiredCapability`. La arquitectura exige igualdad de Tenant, trusted
backend, transaction Membership+membershipKey, replay estable y auditoría.

## 5. Auditoría completa de operaciones y capabilities

Se auditaron 26 operaciones lógicas. La matriz de autoridad tiene 27 filas
porque `CancelEnrollment` separa los actores self y admin.

- 17 operaciones están completamente alineadas.
- `ExpireRegistrationRequest` es una operación técnica correctamente diferida:
  `platform_system` no es una capability de negocio.
- 8 operaciones tienen capability canónica y autoridad documentada, pero su
  transición de workflow no declara esa capability.
- `CreateIdentity` es bootstrap/sincronización técnica y justifica `N/A`.

### Operaciones sin capability o sin enlace canónico

Las 26 operaciones catalogadas tienen capability o una excepción técnica
justificada. Sin embargo, el workflow adicional `Tenant suspended -> active`
no tiene operación `RestoreTenant` en el catálogo lógico ni capability enlazada
inequívocamente. `platform.tenant_update` existe, pero ningún contrato vigente
declara que autorice esa transición.

### Capabilities huérfanas

- `tenant.update`, asignada a tenant_admin, no tiene operación lógica ni Access
  Pattern de escritura vigente; Settings y Branding usan capabilities propias.
- `platform.tenant_update`, asignada a platform_admin, tampoco tiene operación
  lógica ni Access Pattern de escritura vigente.

No se eliminan ni reinterpretan. Deben reconciliarse antes de traducir la matriz
a Security Rules.

## 6. Cliente, backend y sistema

La separación es coherente:

- direct client: `UpdateIdentityProfile`, `UpdateInterfaceLocale` y
  `CancelEnrollment` self;
- `CancelRegistrationRequest` permanece como capability self ejecutada por
  trusted backend debido al lookup, timestamp y auditoría;
- operaciones tenant/platform privilegiadas, constraints, lookups y cross-root
  requieren trusted backend;
- `platform_system` sólo representa ejecución técnica auditada, sin sesión
  humana ni autorización funcional implícita.

## 7. Operaciones cross-root

### ApproveRegistrationRequest — Aligned

Trusted backend, actor tenant_admin y `registration_request.review`. La
transaction valida Tenant active, Identity existente/verificada, Request
pending, ausencia de Membership vigente y coherencia de keys. Actualiza Request
y requestKey, crea Membership y membershipKey, conserva `requestId` como clave
de idempotencia, falla cerrado ante lookup inconsistente y exige auditoría
crítica.

### CreateEnrollment — Aligned

Trusted backend y `enrollment.create`. La transaction valida Tenant active,
Membership approved, Course active, igualdad de tenantId y referencias
inmutables; crea Enrollment pending. `enrollmentId` cubre retry técnico. La
equivalencia semántica/reinscripción sigue diferida y no invalida el modelo base.

## 8. Lifecycle de lookups

`registrationRequestKeys` se crea con la Request, refleja estados pending y
terminales, se conserva para historial/idempotencia y sólo se reemplaza
atómicamente cuando la política permite otra Request. Repair falla cerrado.

`membershipKeys` se crea con Membership, permanece durante approved,
suspended y restored, y se elimina atómicamente al llegar a removed. La
Membership histórica permanece. Una nueva Membership sólo puede reclamar una
key libre; repair no elige arbitrariamente entre duplicados.

No se detectaron contradicciones con topología o Query Contracts.

## 9. Concurrencia e idempotencia

Los 12 conflictos catalogados tienen invariante, autoridad, control, resultado,
retry y audit: approvals simultáneas, Requests vigentes duplicadas, Memberships
duplicadas, leave/suspend, restore/remove, role/remove, archive Course/enroll,
Enrollments equivalentes, suspend Tenant/create, Settings concurrentes, timeout
y lookup inconsistente.

La equivalencia semántica de Enrollment continúa expresamente diferida.

| Operation | Idempotency key | Replay |
|---|---|---|
| ApproveRegistrationRequest | requestId | mismo approvedMembershipId |
| CreateTenant | tenantId | mismo bundle |
| CreateEnrollment | enrollmentId | mismo Enrollment |
| ArchiveTenant | tenantId + target | archived |
| ArchiveCourse | courseId + target | archived |
| SuspendMembership | membershipId + target | suspended |
| RestoreMembership | membershipId + target | approved |
| LeaveMembership | membershipId + target | removed |
| CancelRegistrationRequest | requestId + cancelled | cancelled |

Los reintentos no cambian IDs ni duplican keys, effects o audit; el resultado
`idempotent_replay` está definido.

## 10. Auditoría y Rules/backend boundary

La auditoría privilegiada exige actor uid/role, tenantId, capability, operation,
target type/ID, before/after, timestamp, correlationId, commandId cuando aplique,
result, failure reason y source. Sólo backend/system escribe evidencia
autoritativa. El path y retención del log siguen diferidos sin bloquear el
diseño base de Rules.

La frontera clasifica ownership/path/immutable fields/simple self changes como
Rules+backend, y cross-root/uniqueness/lookups/idempotencia/platform/system/audit
como backend obligatorio. Application sólo aporta UX. Los gaps declarativos de
workflow y capabilities huérfanas sí impiden afirmar equivalencia completa para
SaaS-02C.

## 11. Matriz de revalidación

| Operation | Actor | Capability | Scope | Workflow | Technical Authority | Atomicity | Idempotency | Audit | Status |
|---|---|---|---|---|---|---|---|---|---|
| CreateTenant | platform_admin | platform.tenant_create | platform | creation actor | backend | transaction bundle | tenantId | Critical | Aligned |
| UpdateTenantSettings | tenant_admin | tenant.manage_settings | tenant | n/a VO update | backend | root/config transaction | commandId/version | Privileged | Aligned |
| UpdateTenantBranding | tenant_admin | tenant.manage_branding | tenant | n/a VO update | backend | root/config transaction | commandId/version | Privileged | Aligned |
| SuspendTenant | platform_admin | platform.tenant_suspend | platform | capability absent in transition | backend | root transaction | tenantId+target | Critical | Workflow mismatch |
| ArchiveTenant | platform_admin | platform.tenant_archive | platform | aligned | backend | root transaction | tenantId+target | Critical | Aligned |
| CreateIdentity | onboarding | N/A technical bootstrap | global/self | n/a | backend/Auth sync | root create | uid | Security | Deferred technical operation |
| UpdateIdentityProfile | identity_self | identity.update_self | self | n/a field update | client+Rules | point update | no extra key | Basic | Aligned |
| UpdateInterfaceLocale | identity_self | identity.update_self | self | n/a field update | client+Rules | point update | no extra key | Basic | Aligned |
| CreateRegistrationRequest | identity_self | registration_request.create | self+tenant | creation actor | backend | Request+key transaction | requestId | Workflow | Aligned |
| CancelRegistrationRequest | identity_self | registration_request.cancel_self | self | aligned | backend | Request+key transaction | requestId+target | Workflow | Aligned |
| ExpireRegistrationRequest | platform_system | N/A technical actor | system | actor aligned | backend/system | Request+key transaction | requestId+target | Critical | Deferred technical operation |
| RejectRegistrationRequest | tenant_admin | registration_request.review | tenant | capability absent in transition | backend | Request+key transaction | requestId+target | Privileged | Workflow mismatch |
| ApproveRegistrationRequest | tenant_admin | registration_request.review | tenant | capability absent in transition | backend | cross-root transaction | requestId | Critical | Workflow mismatch |
| ChangeMembershipRole | tenant_admin | membership.change_role | tenant | n/a role update | backend | Membership transaction | commandId/version | Critical | Aligned |
| SuspendMembership | tenant_admin | membership.suspend | tenant | capability absent in transition | backend | Membership+key transaction | membershipId+target | Critical | Workflow mismatch |
| RestoreMembership | tenant_admin | membership.restore | tenant | aligned | backend | Membership+key transaction | membershipId+target | Critical | Aligned |
| LeaveMembership | identity_self | membership.leave_self | self | aligned per actor | backend | Membership+key transaction | membershipId+target | Privileged | Aligned |
| RemoveMembership | tenant_admin | membership.remove | tenant | aligned per actor | backend | Membership+key transaction | membershipId+target | Critical | Aligned |
| CreateCourse | teacher/tenant_admin | course.create | tenant | creation actor | backend | root create | courseId | Privileged | Aligned |
| UpdateCourse | teacher/tenant_admin | course.update | tenant | n/a field update | backend | root CAS/transaction | commandId/version | Privileged | Aligned |
| ActivateCourse | tenant_admin | course.activate | tenant | aligned | backend | root transaction | courseId+target | Privileged | Aligned |
| ArchiveCourse | tenant_admin | course.archive | tenant | capability absent in transitions | backend | root transaction | courseId+target | Privileged | Workflow mismatch |
| CreateEnrollment | tenant_admin | enrollment.create | tenant | creation actor | backend | validation transaction | enrollmentId | Critical | Aligned |
| ActivateEnrollment | tenant_admin | enrollment.update_status | tenant | capability absent in transition | backend | root transaction | enrollmentId+target | Privileged | Workflow mismatch |
| CompleteEnrollment | tenant_admin | enrollment.update_status | tenant | capability absent in transition | backend | root transaction | enrollmentId+target | Privileged | Workflow mismatch |
| CancelEnrollment | identity_self/tenant_admin | enrollment.cancel_self / enrollment.update_status | self/tenant | actor-specific capabilities absent | client+Rules / backend | point/transaction | enrollmentId+target | Basic/Privileged | Workflow mismatch |

## 12. Backlog revalidado

| ID | Estado | Razón | ¿Bloquea SaaS-02C? |
|---|---|---|---:|
| FWC-001 | Closed | capability self y workflow verificados | No |
| FWC-002 | Closed | capability tenant y workflow verificados | No |
| FWC-003 | Deferred to implementation | `version` físico antes de CAS/repositories | No para diseño Rules |
| FWC-004 | Deferred to SaaS-02C/implementation | path/retención audit antes del backend autoritativo | No para Rules base |
| FWC-005 | Deferred to product/implementation | equivalencia Enrollment | No para Rules base |

### Nuevas entradas FWR

| ID | Evidencia | Impacto | Severidad | Bloquea revalidación/SaaS-02C |
|---|---|---|---|---:|
| FWR-001 | Ocho operaciones tienen capability en autoridad pero no en su transición declarativa | Workflow y futura Rules pueden divergir | Alta | Sí |
| FWR-002 | `Tenant suspended -> active` carece de operación y capability inequívoca | No existe contrato autorizable para restaurar Tenant | Alta | Sí |
| FWR-003 | `tenant.update` y `platform.tenant_update` no tienen operación/patrón de escritura vigente | Privilegios asignados sin uso canónico | Alta | Sí |
| FWR-004 | `FIRESTORE_PHYSICAL_MODEL.md` conserva una referencia textual a Domain 1.0.0 | Trazabilidad de versión; topología no cambia | Baja | No |

## 13. Criterios de cierre

| Criterio | Resultado |
|---|---|
| FWC-001 cerrado | Cumple |
| FWC-002 cerrado | Cumple |
| Todas las operaciones tienen actor | Cumple |
| Todas las operaciones autorizables tienen capability | No cumple |
| No existen capabilities huérfanas bloqueantes | No cumple |
| Workflows y capabilities coinciden | No cumple |
| Cliente vs backend definido | Cumple |
| Operaciones cross-root definidas | Cumple |
| Lifecycle de lookups coherente | Cumple |
| Concurrencia definida | Cumple |
| Idempotencia definida | Cumple |
| Auditoría definida | Cumple |
| Rules/backend boundary definido | Cumple |
| Domain 1.1.0 preservado | Cumple |
| Topología física preservada | Cumple |
| Firebase no modificado | Cumple |

## 14. Conclusión

FWC-001 y FWC-002 están cerrados, pero FWR-001, FWR-002 y FWR-003 son
bloqueadores contractuales/declarativos nuevos con evidencia concreta. Por la
regla binaria de esta fase:

```text
SaaS-02B.4 write authority and concurrency model = INCOMPLETE
SaaS-02B = INCOMPLETE
SaaS-02C = NOT STARTED
```

Al ser INCOMPLETE, no se modifican
`FIRESTORE_WRITE_AUTHORITY_AND_CONCURRENCY.md` ni
`IMPLEMENTATION_ORDER_SAAS_MULTI_TENANT.md` durante SaaS-02B.4B.

## 15. Reconciliación posterior SaaS-02B.4C

Domain 1.2.0 aplica, sin cerrar todavía SaaS-02B.4:

| ID | Estado | Decisión |
|---|---|---|
| FWR-001 | `resolved_pending_revalidation` | Diez filas físicas correspondientes a las ocho operaciones enlazan sus capabilities canónicas |
| FWR-002 | `resolved_pending_revalidation` | `RestoreTenant` usa `platform.tenant_restore` |
| FWR-003 | `resolved_pending_revalidation` | `tenant.update` vincula UpdateTenantProfile y `platform.tenant_update` vincula PlatformUpdateTenantMetadata |
| FWR-004 | Closed | La referencia física vigente declara compatibilidad con Domain 1.2.0 |

La conclusión histórica de SaaS-02B.4B permanece. Sólo SaaS-02B.4D puede marcar
los tres hallazgos como Closed y declarar SaaS-02B.4/SaaS-02B completos.
