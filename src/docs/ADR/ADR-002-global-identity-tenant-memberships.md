# ADR-002 — Identidad global y membresías por tenant

- **Estado:** Aceptado
- **Fecha:** 2026-07-28

## Contexto

Una persona puede pertenecer a varios tenants con roles y estados diferentes.
Un rol global en `users/{uid}` no representa esa realidad.

## Decisión

Mantener una identidad Firebase y perfil global `users/{uid}`. Conceder acceso
mediante `tenants/{tenantId}/memberships/{uid}` con roles `student`, `teacher` o
`tenant_admin`. Reservar `platform_admin` como rol global independiente.

## Alternativas descartadas

- una cuenta Auth por tenant;
- array de tenants y roles dentro del perfil;
- rol global `admin`.

## Consecuencias

La aprobación y suspensión son independientes. Varias membresías requieren
selector de workspace. Toda autorización revalida la membresía del tenant de la
ruta.
