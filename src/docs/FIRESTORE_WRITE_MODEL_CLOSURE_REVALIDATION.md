# Revalidación final y cierre del modelo de escritura — SaaS-02B.4F

## Alcance, fuentes y método

La revalidación contrastó directamente los catorce documentos normativos y los
cinco directorios de dominio exigidos. No introduce decisiones ni modifica
Domain 1.2.0, topología, capabilities, workflows, Firebase, Rules o índices.

Los conteos se obtuvieron de IDs y filas reales, no de resúmenes:

| Elemento | Conteo |
|---|---:|
| Access Patterns | 70 |
| Tenant / Identity / RegistrationRequest | 10 / 7 / 11 |
| Membership / Course / Enrollment / Cross-root | 11 / 13 / 13 / 5 |
| Query Contracts | 45 |
| Capabilities canónicas | 37 |
| Transiciones declarativas | 19 |
| Operaciones canónicas | 29 |
| Escenarios de concurrencia | 15 |
| Filas explícitas de idempotencia | 12 |

## FWR-005 — Closed

- RestoreTenant y ArchiveTenant comparten Tenant, releen transaccionalmente el
  estado y aplican source-state preconditions. `archived` es terminal; no existe
  last-write-wins silencioso. Retry, timeout, conflicto y audit están definidos.
- SuspendTenant y RestoreTenant sólo aplican la transición compatible con el
  estado autoritativo. Replay e incompatibilidad concurrente se distinguen.
- UpdateTenantProfile y PlatformUpdateTenantMetadata utilizan field-scoped
  patches disjuntos. TenantAdmin controla displayName, shortName, country,
  locale y timezone; PlatformAdmin controla tenantType. No se reemplaza Tenant
  ni se pierde una actualización; updatedAt y auditorías son autoritativos.

## FWR-006 — Closed

La matriz contiene SuspendTenant (`tenantId + targetState(suspended)`),
RestoreMembership (`membershipId + targetState(approved)`) y
CancelRegistrationRequest (`requestId + targetState(cancelled)`). Para cada una
define primera ejecución, `idempotent_replay`, conflicto terminal, IDs/lookups
preservados, efectos prevenidos y storage conceptual. Diferencia expresamente
replay del mismo comando de una nueva orden posterior.

## FWR-007 — Closed

El inventario vigente es 10 TEN + 7 IDN + 11 RRQ + 11 MEM + 13 CRS + 13 ENR +
5 CROSS = 70. No quedan afirmaciones vigentes de 8/68. AP-TEN-009 y AP-TEN-010
están en las matrices, reutilizan FQ-TEN-001 y el Tenant point read, y no exigen
colección, subcolección, índice compuesto o Query Contract nuevo.

## Operaciones, capabilities y workflows

Las 29 operaciones tienen actor, scope, autoridad, acceso, documentos,
atomicidad, idempotencia, concurrencia, audit, errores y frontera Rules/backend.
CreateIdentity se conserva como bootstrap técnico alineado y
ExpireRegistrationRequest como operación técnica correctamente diferida a
platform_system/trusted backend. No hay operaciones funcionales sin capability.

Las 37 capabilities tienen ID, resource, scope y asignación válidos; no hay
wildcards, herencia implícita ni capabilities huérfanas bloqueantes. Las 19
transiciones usan estados y actores existentes, capabilities canónicas y
terminalidad coherente.

## Operaciones críticas y lookups

ApproveRegistrationRequest está alineada: tenant_admin,
`registration_request.review`, trusted backend, transaction cross-root,
requestId, validación de Tenant/Identity/Request/keys/Membership, replay estable,
repair fail-closed y audit Critical.

CreateEnrollment está alineada: `enrollment.create`, trusted backend,
transaction, enrollmentId, Tenant active, Membership approved, Course active,
igualdad tenant, referencias inmutables y audit. La equivalencia semántica
permanece correctamente aplazada.

registrationRequestKeys y membershipKeys cubren creación, estados vigentes y
terminales, reemplazo/liberación, futuras entidades, replay, prevención de
duplicados, repair fail-closed y prohibición de escritura directa del cliente.

## Concurrencia, idempotencia y auditoría

Las 15 filas contienen conflicto, documentos, invariante, control, resultado,
retry y audit. No hay duplicados, estados críticos last-write-wins, cross-root
sin transaction, timeout indefinido o lookup sin fail-closed.

Las 12 filas de idempotencia contienen operación, clave, replay, efectos
prevenidos y storage conceptual. El commandId físico no se exige en esta fase.

El modelo de auditoría híbrido —campos contractuales, futuro log append-only y
observabilidad externa— conserva backend como writer autoritativo y todos los
datos de actor, capability, tenant, target, before/after, timestamp,
correlation/command ID, resultado, fallo y source. Su path sigue aplazado.

## Backlog no bloqueante y Rules/backend readiness

| ID | Estado | Motivo no bloqueante |
|---|---|---|
| FWC-003 | Deferred to implementation | CAS/version físico no cambia la arquitectura aprobada |
| FWC-004 | Deferred to SaaS-02C/implementation | path/Rules de audit se decide en el gate, no impide revisar Rules base |
| FWC-005 | Deferred to product/implementation | equivalencia/reinscripción no contradice dominio ni atomicidad base |

La frontera cubre authentication, self ownership, tenant path, campos
inmutables, cambios self, estados Tenant/Membership, role/capability, cross-root,
unicidad, lookups, idempotencia, platform_admin, platform_system, audit,
timestamps y collection-group self queries.

**Rules/backend boundary = Ready for Mandatory Firebase Security Review Gate**

## Trazabilidad

Los 70 Access Patterns se trazan a actor, scope, operación, Query Contract o
point read, path, autoridad, atomicidad y futura clasificación Rules/backend.

## Criterios de cierre

| Criterio | Resultado |
|---|---|
| FWR-005 cerrado | Cumple |
| FWR-006 cerrado | Cumple |
| FWR-007 cerrado | Cumple |
| Conteos canónicos correctos | Cumple |
| 29 operaciones alineadas o correctamente diferidas | Cumple |
| 37 capabilities consistentes | Cumple |
| 19 transiciones consistentes | Cumple |
| 15 escenarios de concurrencia completos | Cumple |
| 12 filas de idempotencia completas | Cumple |
| Lookups coherentes | Cumple |
| ApproveRegistrationRequest alineada | Cumple |
| CreateEnrollment alineada | Cumple |
| Auditoría definida | Cumple |
| Backlog restante no bloqueante | Cumple |
| Rules/backend boundary listo para revisión | Cumple |
| 70 Access Patterns trazados | Cumple |
| Domain 1.2.0 preservado | Cumple |
| Topología física preservada | Cumple |
| Firebase no modificado | Cumple |

## Conclusión

```text
FWR-005 = Closed
FWR-006 = Closed
FWR-007 = Closed
SaaS-02B.4 write authority and concurrency model = COMPLETE
SaaS-02B = COMPLETE
Mandatory Firebase Security Review Gate = REQUIRED
SaaS-02C = NOT STARTED
```

No se ejecutó el gate ni se inició SaaS-02C.
