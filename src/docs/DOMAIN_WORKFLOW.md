# Workflow y ciclo de vida del dominio

## 1. Objetivo y alcance

Este documento define, de forma conceptual y declarativa, creación,
transiciones, actores y estados terminales de RegistrationRequest, Membership,
Enrollment, Course y Tenant. No implementa máquinas de estado, autorización,
persistencia, side effects, notificaciones ni Firebase.

Los actores declarativos son `identity_self`, `tenant_admin`,
`platform_admin` y `platform_system`. Los roles canónicos se reutilizan; no se
redefinen.

## 2. RegistrationRequest

```text
pending
  +--> approved  (tenant_admin; terminal)
  +--> rejected  (tenant_admin; terminal)
  +--> cancelled (identity_self; terminal)
  +--> expired   (platform_system; terminal)
```

La crea `identity_self`. La revisión, aprobación y rechazo corresponden a
`tenant_admin`. `approved` representa la resolución de la solicitud; no
equivale por sí sola a acceso efectivo perpetuo.

| Origen | Destino | Actor | Observación |
|---|---|---|---|
| pending | approved | tenant_admin + `registration_request.review` | Debe originar conjuntamente exactamente una Membership approved |
| pending | rejected | tenant_admin + `registration_request.review` | Nunca origina Membership |
| pending | cancelled | identity_self + `registration_request.cancel_self` | Retirada voluntaria; exige ownership por uid |
| pending | expired | platform_system | Vencimiento conceptual no automatizado |

RegistrationRequestStatus es independiente de AccessState.

## 3. Membership

Una Membership derivada de una RegistrationRequest aprobada nace `approved`,
creada conceptualmente por `tenant_admin`. Mientras está `approved` puede
aportar acceso; `suspended` y `removed` no son suficientes. `removed` es
terminal y representa eliminación lógica o salida voluntaria.

| Origen | Destino | Actor |
|---|---|---|
| approved | suspended | tenant_admin (`membership.suspend`) |
| approved | removed | tenant_admin (`membership.remove`), identity_self (`membership.leave_self`) |
| suspended | approved | tenant_admin (`membership.restore`) |
| suspended | removed | tenant_admin (`membership.remove`), identity_self (`membership.leave_self`) |

Membership nace exclusivamente en `approved` tras aprobar RegistrationRequest.

## 4. Enrollment

La crea `tenant_admin` en `pending`. `completed` y `cancelled` son terminales.
No se modelan progreso, notas, asistencia ni certificaciones.

| Origen | Destino | Actor | Efecto conceptual |
|---|---|---|---|
| pending | active | tenant_admin (`enrollment.update_status`) | Habilita participación |
| pending | cancelled | tenant_admin (`enrollment.update_status`), identity_self (`enrollment.cancel_self`) | Cancela antes de activación |
| active | completed | tenant_admin (`enrollment.update_status`) | Finaliza participación |
| active | cancelled | tenant_admin (`enrollment.update_status`), identity_self (`enrollment.cancel_self`) | Cancela participación |

Un archivado futuro requeriría revisar EnrollmentStatus; no se inventa ahora.

## 5. Course

Teacher o tenant_admin crean Course en `draft`. Tenant_admin activa o archiva.
`archived` es terminal y conserva historia; ningún cambio crea Enrollments
automáticamente.

| Origen | Destino | Actor | Efecto conceptual |
|---|---|---|---|
| draft | active | tenant_admin + `course.activate` | Publica el curso |
| draft | archived | tenant_admin + `course.archive` | Retira un borrador |
| active | archived | tenant_admin + `course.archive` | Retira operación ordinaria |

Teacher no recibe `course.activate` por defecto.

## 6. Tenant

Platform_admin crea Tenant en `active`. Suspender suprime conceptualmente el
acceso efectivo de Memberships, Courses y Enrollments sin cambiar sus estados.
Reactivar vuelve a evaluar cada hijo según su propio estado. `archived` es
terminal y conserva historia.

| Origen | Destino | Actor | Efecto conceptual |
|---|---|---|---|
| active | suspended | platform_admin + `platform.tenant_suspend` | Suprime operación del tenant |
| suspended | active | platform_admin + `platform.tenant_restore` | Restaura operación condicionada |
| active | archived | platform_admin + `platform.tenant_archive` | Retira el tenant |
| suspended | archived | platform_admin + `platform.tenant_archive` | Retira el tenant suspendido |


## 7. Invariantes

1. Ninguna transición salta estados no documentados.
2. Toda transición requiere uno de los actores declarados.
3. Estados terminales no tienen salidas.
4. RegistrationRequest aprobada nunca vuelve a pending.
5. Tenant suspendido suprime acceso efectivo sin mutar estados hijos.
6. Membership deja de aportar acceso al abandonar `approved`.
7. Suspensión y archivado no eliminan historia.
8. Salida voluntaria de Membership termina en `removed`.
9. Cancelación de Enrollment no elimina Membership ni Course.
10. Las tablas no ejecutan lógica ni sustituyen autorización contextual.
11. Aprobar una RegistrationRequest requiere conjuntamente exactamente una
    Membership approved.
12. `requestId` es la clave conceptual de idempotencia de esa aprobación.
13. Repetir la aprobación no crea otra Membership ni cambia el `membershipId`
    existente.
14. Una retirada voluntaria sólo usa `membership.leave_self` cuando
    `AuthorizationContext.uid` pertenece a la Membership objetivo.

## 8. Decisiones tomadas

- Matrices inmutables separadas por entidad.
- Estados y roles existentes se referencian sin duplicarlos.
- Estados terminales: RegistrationRequest approved/rejected/cancelled/expired; Membership removed;
  Enrollment completed/cancelled; Course archived; Tenant archived.
- Suspensión de Tenant es efectiva, no una propagación de escrituras.
- No existen automatismos ni side effects en los contratos.

## 9. Decisiones aplazadas y contradicciones

- fuente y autoridad de `platform_system`;
- expiraciones, motivos, auditoría y timestamps de transición;
- policy de cancelación self de Enrollment;
- archivado futuro de Enrollment;
- tecnología de atomicidad e idempotencia para crear Membership;
- equivalencia futura con capacidades, servicios y reglas.

Los puntos restantes requieren fases futuras y no introducen lógica en esta
reconciliación.

## 10. Reconciliación SaaS-01B.5A

| Contradicción | Decisión | Archivos e impacto |
|---|---|---|
| Request usaba AccessState | Crear RegistrationRequestStatus independiente | Identity y workflow; cinco estados canónicos |
| Membership tenía pending/rejected | Membership nace approved | Organization y workflow; tres estados |
| Faltaba course.activate | Añadirla sólo a tenant_admin | Authorization y transición draft -> active |
| Faltaba platform.tenant_archive | Añadirla sólo a platform_admin | Authorization y transiciones a archived |

Permanece pendiente la autoridad técnica de `platform_system`, la idempotencia
tecnológica de creación de Membership y toda implementación de transacciones o
reglas.

## 10A. Enmienda SaaS-02B.4A

Domain 1.1.0 incorpora de forma aditiva `registration_request.cancel_self` y
`membership.restore`. La primera explicita ownership self y estado `pending`
para `pending -> cancelled`; la segunda explicita la autoridad tenant_admin
para `suspended -> approved`. No cambian actores, estados ni transiciones.

## 10B. Enmienda SaaS-02B.4C

Domain 1.2.0 enlaza todas las transiciones institucionales existentes con sus
capabilities canónicas. Añade únicamente `platform.tenant_restore` para
`Tenant suspended -> active`; no añade estados ni transiciones.

## 11. Reconciliación SaaS-01B.7A

`ApproveRegistrationRequest` es la frontera conceptual de consistencia entre
RegistrationRequest y Membership. Valida conceptualmente Identity y Tenant,
pero no los modifica.

### Precondiciones

- RegistrationRequest existe y está `pending`;
- Identity existe;
- Tenant existe y no está `archived`;
- el actor tiene autoridad conceptual para revisar;
- no existe otra Membership no terminal para el mismo `tenantId + uid`;
- no existe una aprobación previa incompatible.

### Resultado conjunto

```text
RegistrationRequest.status = approved
+
exactamente una Membership.status = approved
```

La operación no se considera completada si sólo ocurre uno de los efectos.
`requestId` es su clave conceptual de idempotencia: un replay devuelve el
resultado existente, no duplica efectos y conserva `membershipId`.

La implementación futura necesitará atomicidad o una estrategia equivalente de
consistencia verificable. La elección entre transaction, batch, backend o
workflow distribuido queda aplazada a SaaS-02.

## 12. Architecture Review Backlog

| ID | Archivo | Descripción | Justificación e impacto | Fase sugerida |
|---|---|---|---|---|
| ARB-001 | `membershipWorkflow.js`, `capabilities.js` | Retirada voluntaria mediante `membership.leave_self` | Resuelto declarativamente, pendiente de reauditoría final | SaaS-01B.7D |
| ARB-002 | `identity/accessStatePrecedence.js` | Derivación estrictamente tenant-scoped | Resuelto declarativamente, pendiente de reauditoría final | SaaS-01B.7D |
