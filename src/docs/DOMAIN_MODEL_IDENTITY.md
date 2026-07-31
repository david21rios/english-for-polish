# Modelo de dominio de identidad y registro

## 1. Objetivo

Este documento separa la identidad global de MiPyMeTIC del acceso
institucional. Identity pertenece a la plataforma; Membership pertenece a un
Tenant. RegistrationRequest conecta conceptualmente ambos dominios sin
representar una Membership ni conceder acceso.

El alcance se limita a `Identity`, `RegistrationRequest`,
`RegistrationRequestStatus`, `AccessState` y `RegistrationPolicy`. No define Authentication, Firebase, persistencia,
validadores, UI, invitaciones ni autorización.

## 2. Convenciones

- Los identificadores son strings opacos y estables.
- Los timestamps son strings UTC ISO 8601.
- `null` representa ausencia intencional.
- Identity no contiene ninguna frontera o atribución institucional.
- Sólo los contratos institucionales utilizan `tenantId`.
- Los contratos describen estado; no lo resuelven ni ejecutan transiciones.

## 3. AccessState

| Valor | Significado |
|---|---|
| `pending_email_verification` | La Identity todavía no tiene correo verificado |
| `pending_tenant_approval` | El correo está verificado, pero el Tenant no ha aprobado el acceso |
| `active` | La solicitud institucional fue aprobada y el acceso dependiente puede quedar activo |
| `suspended` | El acceso institucional previamente disponible está suspendido |
| `rejected` | El Tenant rechazó la solicitud |

AccessState describe un resultado efectivo, derivado y contextual para la
combinación conceptual `uid + tenantId`. No sustituye
`RegistrationRequestStatus`, `MembershipStatus`, TenantStatus ni Identity, no
es una fuente independiente de verdad y no debe persistirse como autoridad sin
una justificación futura explícita.

Fuera de un contexto institucional, AccessState siempre es `null`, incluso
cuando `Identity.emailVerified = false`. `emailVerified` es un hecho global;
AccessState es exclusivamente una proyección institucional.

### 3.1 Precedencia canónica

La derivación declarativa usa este orden, de mayor a menor prioridad:

| Prioridad | Condición | Resultado |
|---:|---|---|
| 1 | Existe tenant concreto e `Identity.emailVerified = false` para una operación que exige correo verificado | `pending_email_verification` |
| 2 | Existe contexto tenant y TenantStatus o MembershipStatus es `suspended` | `suspended` |
| 3 | Email verificado, TenantStatus `active` y MembershipStatus `approved` | `active` |
| 4 | No existe Membership aplicable y RegistrationRequestStatus es `pending` | `pending_tenant_approval` |
| 5 | No existe Membership aplicable y la resolución vigente es `rejected` | `rejected` |

La tabla documenta precedencia; no implementa un evaluador runtime.

### 3.2 Ausencia de AccessState

Los siguientes casos producen conceptualmente `accessState = null` o ausencia
de acceso institucional:

- cualquier Identity sin `tenantId` concreto, verificada o no;
- Identity verificada sin RegistrationRequest;
- RegistrationRequest `cancelled`;
- RegistrationRequest `expired`;
- Membership `removed`;
- Tenant `archived`.

Ausencia de acceso institucional no equivale a `rejected`: este último exige
una resolución institucional rechazada vigente.

### 3.3 RegistrationRequestStatus

| Valor | Significado |
|---|---|
| `pending` | Espera resolución institucional |
| `approved` | Fue aprobada y puede originar exactamente una Membership |
| `rejected` | Fue revisada y rechazada |
| `cancelled` | Fue retirada por la Identity antes de resolución |
| `expired` | Perdió validez por una política futura de vencimiento |

## 4. Contratos

### 4.1 Identity

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `uid` | string | sí | Identificador global de plataforma |
| `email` | string | sí | Correo normalizado |
| `displayName` | string | sí | Nombre visible del usuario |
| `photoURL` | string o null | sí | Referencia opcional de imagen |
| `emailVerified` | boolean | sí | Estado de verificación del correo |
| `interfaceLocale` | string | sí | Preferencia personal de interfaz como etiqueta BCP 47 |
| `createdAt` | string | sí | Creación UTC ISO 8601 |
| `updatedAt` | string | sí | Última actualización UTC ISO 8601 |

Identity no contiene `tenantId`, role, Membership, Enrollment, progreso,
permisos ni estado académico.

`interfaceLocale` pertenece canónicamente a Identity, puede modificarlo la
propia Identity y es independiente de Tenant, Course,
`learningLanguage.languageCode` y `supportLanguageCode`. No autoriza ni cambia
el idioma pedagógico. InterfaceLanguage puede describir opciones de interfaz,
pero no es una fuente alternativa de la preferencia efectiva.

`emailVerified` pertenece a Identity. La autoridad técnica que lo verificará se
integrará posteriormente; este contrato no implementa Authentication.

### 4.2 RegistrationRequest

| Campo | Tipo | Obligatorio | Semántica |
|---|---|---:|---|
| `requestId` | string | sí | Identificador opaco de solicitud |
| `tenantId` | string | sí | Tenant solicitado |
| `uid` | string | sí | Identity solicitante |
| `requestedRole` | MembershipRole | sí | Rol institucional solicitado |
| `requestedAt` | string | sí | Solicitud UTC ISO 8601 |
| `reviewedAt` | string o null | sí | Revisión UTC ISO 8601 |
| `reviewedBy` | string o null | sí | UID del actor revisor |
| `status` | RegistrationRequestStatus | sí | Estado canónico de la solicitud |

RegistrationRequest no es Membership. `reviewedAt` y `reviewedBy` permanecen
en `null` mientras no exista una decisión institucional.

`approved` puede originar exactamente una Membership nueva con estado
`approved`. Esa aprobación constituye la frontera conceptual
`ApproveRegistrationRequest`: ambos efectos deben completarse conjuntamente y
su implementación tecnológica queda aplazada.

### 4.3 RegistrationPolicy

RegistrationPolicy es un Value Object compuesto dentro de TenantSettings. Su
ubicación física en el dominio de identidad refleja su uso por el flujo de
registro, no ownership independiente.

| Campo | Tipo | Obligatorio | Política conceptual |
|---|---|---:|---|
| `openRegistration` | boolean | sí | `open_registration` |
| `invitationOnly` | boolean | sí | `invitation_only` |
| `institutionalEmailOnly` | boolean | sí | `institutional_email_only` |
| `manualApprovalRequired` | boolean | sí | `manual_approval_required` |

`openRegistration` e `invitationOnly` son modos excluyentes.
`institutionalEmailOnly` y `manualApprovalRequired` son restricciones
adicionales que pueden combinarse con el modo seleccionado.

Los flags no validan dominios, generan invitaciones, aprueban solicitudes ni
crean Memberships.

RegistrationPolicy no posee identificador, ciclo de vida independiente ni
existencia fuera de TenantSettings. El Tenant es propietario lógico a través
de TenantSettings.

## 5. Relaciones

```text
Identity
   |
   v
RegistrationRequest
   |
   v
Membership
   |
   v
Enrollment
```

- Identity inicia una solicitud dirigida a un Tenant.
- Una RegistrationRequest aprobada puede originar una Membership.
- Membership representa pertenencia institucional.
- Enrollment representa inscripción académica de esa Membership.

El diagrama es conceptual. No define rutas, claves, operaciones ni
persistencia.

## 6. Invariantes

1. Una Identity pertenece únicamente a la plataforma.
2. Identity nunca contiene `tenantId`, role, Membership o Enrollment.
3. Una Identity puede tener múltiples Memberships independientes.
4. Una Identity puede generar múltiples RegistrationRequests.
5. Cada RegistrationRequest pertenece exactamente a un Tenant.
6. Cada RegistrationRequest referencia exactamente una Identity mediante
   `uid`.
7. Una RegistrationRequest aprobada puede originar exactamente una Membership
   para la combinación correspondiente de Tenant e Identity.
8. Una RegistrationRequest rechazada nunca genera Membership.
9. La verificación del correo pertenece a Identity.
10. La aprobación institucional pertenece al Tenant.
11. Authentication nunca decide la aprobación institucional.
12. RegistrationRequest no concede acceso por sí sola.
13. `openRegistration` e `invitationOnly` no pueden ser verdaderos al mismo
    tiempo.
14. RegistrationPolicy pertenece por composición a TenantSettings y no existe
    independientemente.
15. AccessState se deriva para `uid + tenantId`; no es un estado global de
    Identity.
16. AccessState puede ser `null` cuando no existe un estado institucional
    representable.
17. `requestId` es la clave conceptual de idempotencia de la aprobación.
18. Repetir la aprobación del mismo `requestId` no crea otra Membership ni
    cambia su `membershipId`.
19. `interfaceLocale` es la preferencia personal canónica de Identity y usa
    BCP 47.

## 7. Decisiones tomadas

- Identity es global y no tenant-aware.
- El acceso institucional se solicita mediante RegistrationRequest.
- `requestedRole` reutiliza MembershipRole sin duplicar su enum.
- AccessState y MembershipStatus permanecen separados.
- AccessState es derivado, tenant-scoped y nullable.
- La aprobación se representa en RegistrationRequest como `approved`;
  AccessState sólo será `active` cuando además se cumplan sus condiciones.
- `requestId` identifica conceptualmente la idempotencia de aprobación.
- Identity es propietaria canónica de `interfaceLocale`.
- RegistrationPolicy es un Value Object compuesto de TenantSettings.
- RegistrationPolicy usa flags declarativos sin validación runtime.
- Los timestamps permanecen independientes de proveedores técnicos.

## 8. Decisiones pendientes

- autoridad técnica y sincronización de `emailVerified`;
- normalización, unicidad y cambio de email;
- transiciones formales de RegistrationRequest;
- actores autorizados para revisar;
- tecnología para garantizar atomicidad e idempotencia entre solicitud
  aprobada y Membership;
- solicitudes duplicadas, expiración y retirada;
- contrato de invitaciones;
- dominios institucionales permitidos;
- comportamiento cuando ambos modos de registro son falsos;
- validación y normalización automática de `interfaceLocale` BCP 47;
- auditoría y retención;
- persistencia, servicios, repositorios y reglas.

Estas decisiones no deben inferirse ni implementarse desde los contratos de
esta fase.
