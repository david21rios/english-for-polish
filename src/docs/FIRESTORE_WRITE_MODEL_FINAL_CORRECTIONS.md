# Correcciones finales del modelo de escritura — SaaS-02B.4E

## Alcance y fuentes

Esta fase es una corrección de documentación y trazabilidad. Conserva Domain
1.2.0, capabilities, workflows, Access Patterns, Query Contracts y topología.
Se contrastaron las doce fuentes normativas indicadas por SaaS-02B.4E.

## FWR-005 — concurrencia

La matriz canónica incorpora tres escenarios adicionales:

1. **RestoreTenant vs ArchiveTenant.** Ambos comandos de `platform_admin` se
   ejecutan mediante trusted backend, releen `tenants/{tenantId}` y verifican el
   estado origen. `archived` es terminal: si ArchiveTenant confirma primero,
   RestoreTenant falla con `invalid_state_transition` o
   `concurrent_modification`. Si RestoreTenant confirma primero, ArchiveTenant
   debe releer y sólo puede continuar mediante una transición vigente. Ante
   timeout se hace point read antes de reintentar. La auditoría conserva ganador,
   comando rechazado, estados observado/final, correlation ID y conflicto.
2. **SuspendTenant vs RestoreTenant.** Un transactional reread, source-state
   precondition y single authoritative write permiten exclusivamente
   `active → suspended` o `suspended → active` según el estado releído. No
   existe alternancia silenciosa last-write-wins. El retry distingue replay de
   una transición incompatible y audita ambas solicitudes.
3. **UpdateTenantProfile vs PlatformUpdateTenantMetadata.** La estrategia
   canónica es field-scoped patch: tenant_admin sólo puede modificar
   `displayName`, `shortName`, `country`, `locale` y `timezone`; platform_admin
   sólo `tenantType`. Ningún comando reemplaza el documento completo ni
   reconstruye desde una copia obsoleta. Patches disjuntos pueden confirmar sin
   pérdida; campos ajenos fallan con `validation_failed` o
   `insufficient_capability`. FWC-003 permanece aplazado.

Estado: `FWR-005 = resolved_pending_revalidation`.

## FWR-006 — idempotencia

| Operation | Idempotency Key | Replay Result | Duplicate Effects Prevented | Storage Requirement |
|---|---|---|---|---|
| SuspendTenant | tenantId + targetState(suspended) | idempotent_replay para el mismo comando; archived es invalid_state_transition | auditoría/timestamps duplicados, cambios hijos y reescrituras ajenas | Tenant state + correlation/command identity |
| RestoreMembership | membershipId + targetState(approved) | idempotent_replay para el mismo comando; removed es invalid_state_transition | nueva Membership, cambio de ID/role y segundo membershipKey | Membership/key + correlation/command identity |
| CancelRegistrationRequest | requestId + targetState(cancelled) | idempotent_replay para el mismo comando; otra resolución es conflict/invalid_state_transition | nueva Request, efectos cross-root y mutación de Request resuelta | Request/requestKey + correlation/command identity |

Un replay conserva IDs y el resultado previo. Una nueva orden posterior requiere
nueva identidad de comando cuando una restauración o transición intermedia haya
cambiado el contexto. No se agregan campos ni almacenamiento ejecutable.

Estado: `FWR-006 = resolved_pending_revalidation`.

## FWR-007 — trazabilidad

La afirmación vigente residual de 8 Tenant/68 Access Patterns se corrigió a:

```text
10 TEN + 7 IDN + 11 RRQ + 11 MEM + 13 CRS + 13 ENR + 5 CROSS = 70
```

No se encontraron referencias históricas legítimas que requirieran cambios.
AP-TEN-009 y AP-TEN-010 conservan actor, scope, operación, capability, Tenant
point read, path Tenant, trusted backend, single-root atomicity, idempotencia y
auditoría. Ambos reutilizan FQ-TEN-001 y no requieren nuevas colecciones,
subcolecciones, Query Contracts ni índices compuestos.

Estado: `FWR-007 = resolved_pending_revalidation`.

## Matrices afectadas

- Matriz de concurrencia: conserva sus doce filas y agrega exactamente tres.
- Matriz de idempotencia: conserva sus filas y agrega exactamente tres.
- Trazabilidad Query/AP: cubre los 70 patrones canónicos, incluidos
  AP-TEN-001–010.

## Validaciones y conclusión

Las validaciones de build, tests, búsquedas de consistencia, `git diff --check`
y `git status --short` se ejecutan al finalizar la fase. No se modifica Domain
1.2.0, Firebase, Rules, índices ni tests de Rules.

SaaS-02B.4E queda `completed_pending_revalidation`. SaaS-02B.4 y SaaS-02B
permanecen INCOMPLETE hasta SaaS-02B.4F. SaaS-02C no se inició y el Mandatory
Firebase Security Review Gate permanece PENDING.

## Verificación y cierre SaaS-02B.4F

La revalidación independiente confirmó las 15 filas de concurrencia, 12 filas
de idempotencia y 70 Access Patterns/10 Tenant patterns. FWR-005, FWR-006 y
FWR-007 quedan Closed. El informe normativo es
`FIRESTORE_WRITE_MODEL_CLOSURE_REVALIDATION.md`.

```text
SaaS-02B.4E = completed
SaaS-02B.4F = completed
SaaS-02B.4 = completed
SaaS-02B = completed
Mandatory Firebase Security Review Gate = REQUIRED
SaaS-02C = NOT STARTED
```
