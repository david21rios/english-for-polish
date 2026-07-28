# ADR-007 — Máquina de estados de acceso

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Firebase Authentication, el perfil global, las membresías y las inscripciones
producen estados diferentes. Tratar todos los fallos como credenciales
incorrectas o exigir enrollment a todos los roles bloquearía usuarios válidos.

## Decisión

Adoptar una máquina de estados canónica con precedencia explícita:

```text
anonymous
authenticated_unverified
user_globally_inactive
tenant_selection_required
tenant_suspended
membership_suspended
membership_rejected
membership_pending
email_verified_without_membership
approved_without_enrollment
active
```

Firebase Authentication y el token son la autoridad de `emailVerified`.
Firestore puede conservar un snapshot informativo, nunca suficiente para
autorizar.

Requisitos por rol:

- `student`: membership aprobada, enrollment activo y curso activo;
- `teacher`: membership aprobada; curso seleccionable según la operación;
- `tenant_admin`: membership aprobada; no requiere enrollment;
- `platform_admin`: contexto global; no recibe acceso tenant implícito.

`status` es la autoridad de la membership:
`pending`, `approved`, `rejected`, `suspended` o `removed`. Un `isActive` legacy
sólo puede conservarse temporalmente con la invariante
`isActive === (status === "approved")` y se retira en la fase 12.

## Alternativas descartadas

- una única bandera `isActive`;
- requerir enrollment a todos los roles;
- confiar en `users/{uid}.emailVerified`;
- resolver errores de acceso únicamente en componentes individuales.

## Consecuencias

Las guardas y mensajes derivan del mismo resolver puro. La activación se hará
después de migrar memberships/enrollments y reconciliar, mediante feature flag.
Cada estado tendrá ruta, acción y pruebas.
