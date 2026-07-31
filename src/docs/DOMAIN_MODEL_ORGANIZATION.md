# Modelo de dominio organizacional

## 1. Objetivo

Este documento define el contrato canónico y puro del dominio organizacional
de MiPyMeTIC. No define almacenamiento, rutas Firestore, autenticación,
autorización, React, migraciones ni adaptadores.

El alcance está limitado a `Tenant`, `Membership`, `TenantSettings`,
`TenantBranding` y sus enums. La frontera técnica se denomina exclusivamente
`tenantId`.

## 2. Convenciones compartidas

- Los identificadores son strings opacos y estables.
- Los timestamps del dominio son strings UTC ISO 8601. Una futura capa de
  persistencia será responsable de convertir tipos Firebase.
- Los códigos de país usan ISO 3166-1 alpha-2.
- Los locales usan BCP 47.
- Las zonas horarias usan identificadores IANA.
- `null` expresa ausencia intencional; no se sustituye por strings vacíos.
- Los contratos describen datos. No conceden acceso ni ejecutan transiciones.

## 3. Enums oficiales

### 3.1 TenantType

| Valor | Significado |
|---|---|
| `university` | Universidad u organización de educación superior |
| `academy` | Academia o centro privado de formación |
| `school` | Colegio o institución escolar |
| `company` | Empresa que ofrece formación a sus miembros |

El enum podrá ampliarse mediante una decisión de dominio versionada. Los
consumidores no deben asumir que estos valores cubren para siempre todas las
organizaciones.

### 3.2 TenantStatus

| Valor | Significado |
|---|---|
| `active` | Tenant operativo |
| `suspended` | Acceso operativo temporalmente bloqueado sin eliminar datos |
| `archived` | Tenant retirado de operación y conservado por historial |

`archived` es terminal en el contrato actual. La política de retención se
definirá posteriormente.

### 3.3 MembershipRole

| Valor | Significado |
|---|---|
| `student` | Miembro estudiante del tenant |
| `teacher` | Miembro docente del tenant |
| `tenant_admin` | Administrador institucional del tenant |

`platform_admin` no es una MembershipRole: pertenece al dominio global de
plataforma. No existe un rol ambiguo `admin`.

### 3.4 MembershipStatus

| Valor | Significado |
|---|---|
| `approved` | Membresía institucional aprobada |
| `suspended` | Aprobación temporalmente suspendida |
| `removed` | Membresía retirada; estado terminal |

`status` será la autoridad canónica. No se define un booleano independiente
`isActive`.

## 4. Contratos

### 4.1 Tenant

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `tenantId` | string | sí | Identificador técnico opaco |
| `tenantType` | TenantType | sí | Tipo de organización |
| `displayName` | string | sí | Nombre organizacional canónico |
| `shortName` | string | sí | Nombre abreviado |
| `country` | string | sí | País ISO 3166-1 alpha-2 |
| `locale` | string | sí | Locale administrativo BCP 47 |
| `timezone` | string | sí | Zona horaria IANA |
| `status` | TenantStatus | sí | Estado operativo |
| `createdAt` | string | sí | Timestamp UTC ISO 8601 |
| `updatedAt` | string | sí | Timestamp UTC ISO 8601 |

`locale` describe el contexto administrativo principal del tenant.
`TenantSettings.defaultLocale` es el fallback de idioma de interfaz y puede ser
distinto. Tenant no contiene cursos, usuarios, memberships, billing, feature
flags ni branding.

### 4.2 Membership

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `membershipId` | string | sí | Identificador canónico, estable e inmutable |
| `tenantId` | string | sí | Tenant al que pertenece |
| `uid` | string | sí | Identidad global |
| `role` | MembershipRole | sí | Rol dentro de ese tenant |
| `status` | MembershipStatus | sí | Estado canónico |
| `createdAt` | string | sí | Creación UTC ISO 8601 |
| `approvedAt` | string | sí | Momento de aprobación que originó Membership |
| `approvedBy` | string | sí | UID del actor aprobador |
| `updatedAt` | string | sí | Última actualización |

Membership no contiene enrollment, curso, progreso ni rol global de
plataforma. Como Membership nace aprobada, `approvedAt` y `approvedBy` están
presentes desde su creación y se conservan como trazabilidad.

`membershipId` no se deriva obligatoriamente de `tenantId + uid`, no cambia con
el estado y nunca se reutiliza para otra Membership. Su formato físico queda
aplazado.

### 4.3 TenantSettings

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `tenantId` | string | sí | Tenant propietario |
| `defaultLocale` | string | sí | Fallback BCP 47 de interfaz |
| `registrationPolicy` | RegistrationPolicy | sí | Value Object compuesto de política institucional |
| `featureFlags` | mapa booleano readonly | sí | Placeholder de flags institucionales |
| `supportEmail` | string o null | sí | Contacto institucional |
| `supportUrl` | string o null | sí | URL HTTPS de soporte |

RegistrationPolicy tiene un único contrato canónico, no tiene identificador ni
ciclo de vida propio y no existe fuera de TenantSettings. Su archivo permanece
en el dominio de identidad por afinidad funcional con registro; esa ubicación
no determina ownership. El contrato interno de `featureFlags` queda aplazado.
Un valor presente no habilita funcionalidad por sí mismo.

### 4.4 TenantBranding

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `tenantId` | string | sí | Tenant propietario |
| `displayName` | string o null | sí | Presentación de marca opcional |
| `logoUrl` | string o null | sí | Referencia futura al logo |
| `faviconUrl` | string o null | sí | Referencia futura al favicon |
| `colors.primary` | string | sí | Color institucional primario |
| `colors.secondary` | string | sí | Color institucional secundario |
| `colors.accent` | string | sí | Color institucional de acento |

`Tenant.displayName` sigue siendo el nombre organizacional canónico.
`TenantBranding.displayName` sólo permite una presentación visual alternativa.
No se define almacenamiento, upload ni validación de URLs o colores.

## 5. Transiciones de MembershipStatus

| Desde | Hacia |
|---|---|
| `approved` | `suspended`, `removed` |
| `suspended` | `approved`, `removed` |
| `removed` | ninguna |

Una Membership nace en `approved` después de aprobar RegistrationRequest.
`removed` es terminal. La tabla es declarativa:
las capacidades, actores autorizados, auditoría y persistencia se definirán en
fases posteriores.

## 6. Relaciones e invariantes

1. Toda Membership referencia exactamente un Tenant mediante `tenantId`.
2. Un Tenant puede tener cero o muchas Memberships.
3. Un `uid` puede tener Memberships independientes en múltiples Tenants.
4. `membershipId` identifica canónicamente una Membership.
5. `tenantId + uid` es una restricción lógica futura de unicidad, no el
   identificador primario canónico.
6. No debe existir más de una Membership no terminal para el mismo
   `tenantId + uid`, salvo que una política futura autorice historial
   versionado.
7. Cambiar una Membership no modifica las Memberships del mismo `uid` en otros
   Tenants.
8. Membership nunca pertenece a otra Membership.
9. Tenant nunca pertenece a otro Tenant.
10. TenantSettings y TenantBranding pertenecen exactamente a un Tenant.
11. RegistrationPolicy pertenece por composición a TenantSettings y no existe
    de forma independiente.
12. El creador de contenido o de una Membership no se convierte en propietario
   del Tenant.
13. `platform_admin` no se deriva de una Membership.
14. Ningún estado o rol concede permisos por sí solo.
15. `suspended` conserva datos e historial; no equivale a borrado.
16. `removed` no elimina la identidad global.

## 7. Decisiones tomadas

- `tenantId` es la única frontera e identificación organizacional.
- Identidad global y Membership son conceptos independientes.
- Membership dispone de un `membershipId` canónico independiente de su estado.
- `status` es la autoridad de lifecycle de Membership.
- Los roles son `student`, `teacher` y `tenant_admin`.
- Los timestamps del dominio no dependen de Firebase.
- Settings y Branding se separan de la identidad organizacional.
- RegistrationPolicy es un Value Object compuesto de TenantSettings.
- Los enums son cerrados para esta versión y evolucionables mediante cambios
  versionados.

## 8. Decisiones aplazadas

- paths y documentos Firestore;
- validadores y normalizadores runtime;
- repositorios, adapters, factories y servicios;
- capacidades y autorización por rol;
- actores autorizados para cada transición;
- catálogo y gobernanza de `featureFlags`;
- almacenamiento y transformación de branding;
- retención, anonimización y eliminación;
- auditoría administrativa y billing;
- modelo global de `platform_admin`;
- cursos, enrollments, progreso e invitaciones.

Estas decisiones no deben inferirse a partir de los tipos definidos en esta
fase.
