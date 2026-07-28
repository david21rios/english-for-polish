# ADR-009 — Modelo de tenant activo por sesión

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Una identidad puede tener varias memberships. Guardar un tenant “activo” como
autoridad global en el perfil genera conflictos entre pestañas, dispositivos y
cambios de membresía.

## Decisión

Separar:

- `activeTenantId`: estado de la sesión o pestaña, preferentemente en
  `sessionStorage`;
- `lastActiveTenantId`: preferencia opcional en `users/{uid}`;
- autorización efectiva: membership revalidada para el tenant de cada ruta y
  operación.

Con una membership aprobada y activa se selecciona directamente. Con varias se
produce `tenant_selection_required`. Cambiar tenant limpia caches y estado
derivado, revalida membership y resuelve rol, curso e inscripción según el rol.
Logout elimina el contexto de sesión.

## Alternativas descartadas

- `activeTenantId` autoritativo en Firestore;
- una cuenta Auth por tenant;
- conservar caches del tenant anterior;
- conceder acceso según una selección no revalidada.

## Consecuencias

Dos pestañas pueden trabajar en tenants diferentes sin alterar la autorización
de la otra. La preferencia global sólo mejora UX. Suspender una membership
invalida el acceso aunque el tenant permanezca en sessionStorage.
