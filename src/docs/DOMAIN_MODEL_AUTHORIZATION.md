# Modelo de dominio de autorización

## 1. Objetivo

Este documento define el vocabulario declarativo de autorización de MiPyMeTIC.
La autorización futura se basará en capacidades explícitas, contexto y
denegación por defecto; un nombre de rol nunca será una decisión técnica
completa.

## 2. Alcance

El alcance se limita a:

- `PlatformRole`;
- `CapabilityScope`;
- `Capability`;
- `AuthorizationContext`;
- `ROLE_CAPABILITY_MATRIX`.

No se implementan decisiones de acceso, guards, servicios, reglas, workflows,
persistencia ni infraestructura.

## 3. Rol frente a capacidad

Un rol agrupa responsabilidades organizacionales o globales. Una capacidad
identifica una acción estable sobre un recurso conceptual.

La matriz expresa qué capacidades puede aportar inicialmente un rol, pero no
autoriza una operación por sí sola. Una implementación futura deberá comprobar
scope, identidad, tenant, ownership, estados y operación concreta.

No existe herencia implícita, wildcard, `manage_all` ni bypass global.

Las capacidades propias de Identity se declaran por separado y no se obtienen
de MembershipRole ni PlatformRole.

## 4. PlatformRole y MembershipRole

### PlatformRole

El único rol global inicial es:

```text
platform_admin
```

Es global, no pertenece a un Tenant, no forma parte de Membership y no debe
almacenarse como MembershipRole. Su futura fuente de autoridad no está definida
y no se asocia actualmente con `DEFAULT_ADMINS`.

### MembershipRole

La matriz reutiliza sin redeclarar:

```text
student
teacher
tenant_admin
```

Estos roles sólo tienen sentido dentro del Tenant de su Membership.
`tenant_admin` no es global y no existe un rol ambiguo `admin`.

## 5. CapabilityScope

| Scope | Significado |
|---|---|
| `self` | La acción sólo puede afectar recursos de la Identity actual |
| `tenant` | La acción está limitada al Tenant explícito del contexto institucional |
| `platform` | La acción opera globalmente y no se deriva de Membership |

`registration_request.create` es self-scoped porque una Identity todavía puede
no tener Membership en el Tenant solicitado. El Tenant objetivo sigue siendo
obligatorio en la solicitud, pero no concede acceso institucional.

Esta fase no evalúa scope.

### 5.1 Capacidades self de Identity

`IDENTITY_SELF_CAPABILITIES` contiene exclusivamente:

```text
identity.read_self
identity.update_self
membership.leave_self
registration_request.create
registration_request.read_self
registration_request.cancel_self
```

Estas capacidades corresponden conceptualmente a una Identity autenticada,
incluso antes de que exista Membership. No conceden acceso tenant-scoped
general, listado o revisión de solicitudes ajenas, acceso a Courses,
Memberships de terceros ni acceso cross-tenant. Continúan sujetas a ownership,
contexto y estado aplicable.

## 6. Catálogo inicial de capacidades

| Capacidad | Scope | Recurso |
|---|---|---|
| `identity.read_self` | self | identity |
| `identity.update_self` | self | identity |
| `tenant.read` | tenant | tenant |
| `tenant.update` | tenant | tenant |
| `tenant.manage_settings` | tenant | tenant |
| `tenant.manage_branding` | tenant | tenant |
| `membership.read_self` | self | membership |
| `membership.leave_self` | self | membership |
| `membership.list` | tenant | membership |
| `membership.suspend` | tenant | membership |
| `membership.restore` | tenant | membership |
| `membership.remove` | tenant | membership |
| `membership.change_role` | tenant | membership |
| `registration_request.create` | self | registration_request |
| `registration_request.read_self` | self | registration_request |
| `registration_request.cancel_self` | self | registration_request |
| `registration_request.list` | tenant | registration_request |
| `registration_request.review` | tenant | registration_request |
| `course.list` | tenant | course |
| `course.read` | tenant | course |
| `course.create` | tenant | course |
| `course.update` | tenant | course |
| `course.activate` | tenant | course |
| `course.archive` | tenant | course |
| `enrollment.read_self` | self | enrollment |
| `enrollment.list` | tenant | enrollment |
| `enrollment.create` | tenant | enrollment |
| `enrollment.update_status` | tenant | enrollment |
| `enrollment.cancel_self` | self | enrollment |
| `platform.tenant_list` | platform | platform_tenant |
| `platform.tenant_read` | platform | platform_tenant |
| `platform.tenant_create` | platform | platform_tenant |
| `platform.tenant_update` | platform | platform_tenant |
| `platform.tenant_suspend` | platform | platform_tenant |
| `platform.tenant_restore` | platform | tenant |
| `platform.tenant_archive` | platform | tenant |
| `platform.identity_read` | platform | platform_identity |

Cada definición incluye `id`, `scope`, `resource` y `description`. No contiene
paths, colecciones, componentes, condiciones evaluables ni detalles Firebase.

## 7. Matriz inicial de roles y capacidades

### student

```text
membership.read_self
course.list
course.read
enrollment.read_self
enrollment.cancel_self
```

### teacher

```text
membership.read_self
course.list
course.read
course.create
course.update
enrollment.read_self
enrollment.list
enrollment.cancel_self
```

Teacher no recibe `course.archive`, administración del Tenant, gestión de
Memberships ni capacidades globales.

### tenant_admin

```text
tenant.read
tenant.update
tenant.manage_settings
tenant.manage_branding
membership.read_self
membership.list
membership.suspend
membership.restore
membership.remove
membership.change_role
registration_request.list
registration_request.review
course.list
course.read
course.create
course.update
course.activate
course.archive
enrollment.read_self
enrollment.list
enrollment.create
enrollment.update_status
enrollment.cancel_self
```

Todas sus capacidades institucionales están limitadas a su Tenant.

Las capacidades efectivas futuras podrán componerse conceptualmente como:

```text
Identity self capabilities
+
Membership role capabilities
+
Platform role capabilities
```

La composición preservará el scope y las condiciones de cada grupo. Esta fase
no implementa composición ni evaluación.

`membership.leave_self` sólo es aplicable cuando
`AuthorizationContext.uid` corresponde a la Identity propietaria de la
Membership objetivo. No permite actuar sobre Memberships ajenas.

`registration_request.cancel_self` sólo aplica a una Request propia en estado
`pending`: `AuthorizationContext.uid` debe coincidir con
`RegistrationRequest.uid`. No deriva de MembershipRole ni permite revisar
Requests ajenas.

`membership.restore` pertenece exclusivamente a `tenant_admin`, tiene scope
tenant y sólo autoriza `suspended -> approved` en el Tenant activo.

`tenant.update` autoriza exclusivamente `UpdateTenantProfile`: displayName,
shortName, country, locale y timezone del Tenant propio. No permite modificar
status, tenantType, Settings ni Branding.

`platform.tenant_update` autoriza exclusivamente
`PlatformUpdateTenantMetadata`, limitado inicialmente a tenantType.
`platform.tenant_restore` autoriza únicamente `suspended -> active`; ambas son
platform-scoped y no conceden acceso al contenido privado del Tenant.

### platform_admin

```text
platform.tenant_list
platform.tenant_read
platform.tenant_create
platform.tenant_update
platform.tenant_suspend
platform.tenant_restore
platform.tenant_archive
platform.identity_read
```

No hereda capacidades de tenant_admin ni acceso al contenido privado de los
Tenants. No existe bypass, impersonación o soporte cross-tenant implícito.

## 8. AuthorizationContext

| Campo | Tipo | Nulable | Significado |
|---|---|---:|---|
| `uid` | string | no | Identity global |
| `tenantId` | string | sí | Frontera institucional activa |
| `membershipRole` | MembershipRole | sí | Rol en ese Tenant |
| `membershipStatus` | MembershipStatus | sí | Estado de esa Membership |
| `tenantStatus` | TenantStatus | sí | Estado del Tenant |
| `accessState` | AccessState o null | sí | Resultado derivado tenant-scoped, o ausencia de estado representable |
| `platformRoles` | PlatformRole[] readonly | no | Roles globales independientes |

Las propiedades institucionales son nulas fuera de contexto tenant.
MembershipRole nunca puede reutilizarse fuera del `tenantId` correspondiente.
Los estados no conceden capacidades por sí mismos.
AccessState no es una fuente independiente de verdad y puede ser `null` fuera
de contexto tenant.

AuthorizationContext no es token, sesión React, Firebase User, custom claim,
snapshot ni documento. No ejecuta decisiones.

`interfaceLocale` no se incluye como fuente autoritativa en este contexto:
pertenece canónicamente a Identity. Una capa futura puede transportarlo como
dato contextual sin cambiar ese ownership.

## 9. Invariantes

1. Toda autorización parte de denegación por defecto.
2. Una capacidad tenant-scoped requiere un Tenant explícito.
3. Membership sólo puede aportar capacidades dentro de su `tenantId`.
4. Varias Memberships se evalúan separadamente por Tenant.
5. Teacher de un Tenant no obtiene acceso en otro.
6. Tenant_admin no es global.
7. Platform_admin no es MembershipRole.
8. Platform_admin no implica acceso total al contenido tenant.
9. MembershipStatus distinto de `approved` no basta para acceso institucional.
10. Tenant suspendido no se considera operativamente activo.
11. AccessState y MembershipStatus son conceptos distintos.
12. La matriz no sustituye la validación contextual.
13. Ninguna capacidad autoriza acceso cross-tenant.
14. Un nombre de rol nunca sustituye una regla de seguridad.
15. La implementación futura debe mantener equivalencia semántica entre
    dominio, aplicación, rutas, servicios y reglas.
16. PlatformRoles no proviene de Membership.
17. Los scopes self no permiten actuar sobre recursos de otra Identity.
18. IDENTITY_SELF_CAPABILITIES no depende de MembershipRole ni PlatformRole.
19. La composición futura conserva scopes y no convierte capacidades self en
    capacidades tenant o platform.
20. `membership.leave_self` exige ownership por `uid` de la Membership objetivo.
21. La revisión institucional corresponde a RegistrationRequest mediante
    `registration_request.review`; Membership no tiene capacidad de revisión.

## 10. Límites de tenant

Una evaluación futura deberá vincular simultáneamente:

- Tenant del recurso;
- `tenantId` del AuthorizationContext;
- Membership de la Identity;
- rol y estado de esa Membership;
- estado operativo del Tenant.

La coincidencia de nombres de rol entre contextos no permite cruzar la
frontera. Una capacidad platform-scoped tampoco se transforma automáticamente
en una capacidad tenant-scoped.

## 11. Denegación por defecto

La ausencia de una capacidad en la matriz produce conceptualmente denegación.
La presencia sólo habilita una evaluación posterior; nunca una concesión
automática. Contextos incompletos, scopes incompatibles o estados no válidos
deberán fallar de forma cerrada cuando exista implementación.

## 12. Decisiones tomadas

- Un único PlatformRole inicial: `platform_admin`.
- Tres scopes explícitos: self, tenant y platform.
- Catálogo estable basado en acciones.
- Matrices separadas para MembershipRole y PlatformRole.
- Capacidades declaradas explícitamente por rol, sin herencia.
- Platform_admin recibe sólo capacidades globales.
- AuthorizationContext es neutral respecto de infraestructura.
- Estados y roles son entradas, no decisiones.
- Las capacidades self de Identity tienen una fuente declarativa independiente.
- AccessState es contextual, derivado y nullable.
- Membership voluntaria usa `membership.leave_self`; la revisión previa usa
  `registration_request.review`.

## 13. Decisiones aplazadas

- fuente de autoridad de PlatformRole;
- migración de `DEFAULT_ADMINS`;
- algoritmo de evaluación y precedencia de estados;
- ownership detallado de recursos self;
- actores y condiciones de transiciones;
- alcance académico exacto de `enrollment.list` para Teacher;
- decisión sobre `course.activate` para Teacher;
- soporte, impersonación y acceso operativo excepcional;
- auditoría, break-glass y revocación;
- capacidades de dominios todavía no modelados;
- equivalencia concreta con servicios, rutas y reglas.

RegistrationRequest puede preceder a Membership porque sus capacidades self
proceden de `IDENTITY_SELF_CAPABILITIES`, sin inventar un rol adicional.

## 14. Relación futura con reglas Firebase

No se modificaron reglas Firebase. Las capacidades no son reglas ejecutables.
Las reglas deberán revisarse conjuntamente cuando se implemente la capa de
acceso a datos.

La matriz no puede copiarse mecánicamente a Firestore Rules: antes deben
revisarse paths, ownership, estados, operaciones, aislamiento tenant y límites
del lenguaje de reglas. Tampoco se modificaron `firestore.rules`,
`storage.rules` ni índices.
