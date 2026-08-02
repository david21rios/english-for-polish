# SaaS-03A.3A — RegistrationRequestRepository client-safe reads

## 1. Resultado de la auditoría previa

Estado: `INCOMPLETE_QUERY_PAGINATION_CONTRACT_BLOCKER`.

La fase se detuvo antes de crear código. Las Rules y los Query Contracts son
compatibles en autorización, pero el contrato de paginación requerido por los
dos listados self todavía no es implementable sin adoptar decisiones
arquitectónicas que las fuentes vigentes mantienen aplazadas.

## 2. Rules vigentes

- El point get de
  `tenants/{tenantId}/registrationRequests/{requestId}` exige autenticación,
  ownership por `resource.data.uid`, coincidencia del `tenantId`, coincidencia
  del `requestId` y path canónico.
- El list tenant-scoped exige que cada recurso pertenezca al UID autenticado y
  al Tenant del path. Una query amplia no puede demostrar esas condiciones y
  falla cerrada.
- El collection-group list sólo autoriza recursos cuyo `uid` coincide con el
  UID autenticado. La query canónica debe incluir `uid == self`.
- Create, update y delete están denegados.
- `registrationRequestKeys` permanece client deny-all.

Las Rules distinguen `get` y `list`. No usan `request.query` directamente; la
evaluación query-safe se deriva de las condiciones sobre `resource.data` que
Firestore debe poder demostrar para todos los resultados posibles.

## 3. Query Contracts clasificados

| Contract | Clasificación | Decisión en 03A.3A |
|---|---|---|
| FQ-RRQ-001 | CLIENT_SELF para point read; otros actores fuera de este repositorio | Implementable |
| FQ-RRQ-002 | CLIENT_SELF tenant-scoped | Bloqueado por paginación incompleta |
| FQ-RRQ-003 | CLIENT_SELF cross-tenant collection group | Bloqueado por paginación incompleta e índice pendiente |
| FQ-RRQ-004 | SYSTEM / backend lookup composition | No aplicable; keys client deny-all |
| FQ-RRQ-005 | TENANT_ADMIN_BACKEND | No aplicable |
| FQ-RRQ-006 | TENANT_ADMIN_BACKEND | No aplicable |
| FQ-RRQ-007 | SYSTEM | Diferido |
| FQ-RRQ-008 | SYSTEM / backend consistent read set | No aplicable |

FQ-RRQ-002 y FQ-RRQ-003 fijan `uid == self`, status opcional,
`requestedAt DESC` y full document path DESC. Ambos exigen página `Standard` y
cursor opaco.

## 4. Bloqueo contractual

`FIRESTORE_QUERY_AND_INDEX_MODEL.md` declara expresamente:

- que las categorías de página todavía no tienen cantidades numéricas;
- que el máximo configurable debe existir antes de implementar repositories;
- `FQI-001`, valores numéricos de página pendientes;
- `FQI-004`, integridad, fingerprint, versionado y encoding del cursor opaco
  pendientes;
- encoding/firma del cursor y valores numéricos entre las decisiones aplazadas.

Por ello, 03A.3A no puede definir de forma normativa:

- el máximo de `options.limit`;
- el valor default de página Standard;
- el envelope/version exactos del cursor;
- el fingerprint canónico de filtros;
- la codificación y validación de integridad;
- la conversión segura de los valores serializables del cursor a constraints
  `startAfter`.

Aceptar un límite sin máximo incumpliría el requisito de listado bounded.
Elegir números o un formato local inventaría un contrato público de repositorio.
Exponer `DocumentSnapshot` violaría el desacoplamiento obligatorio. Implementar
sólo el point get dejaría incompleto el API aprobado y no satisface los
criterios de cierre de esta fase.

## 5. Contrato físico auditado

El shape físico aprobado contiene:

- obligatorios e inmutables: `requestId`, `tenantId`, `uid`, `requestedRole`,
  `requestedAt`;
- obligatorio de lifecycle: `status`;
- condicionales/nullables: `reviewedAt`, `reviewedBy`,
  `approvedMembershipId`, `cancelledAt`, `expiredAt`.

Estados: `pending`, `approved`, `rejected`, `cancelled`, `expired`.

Matriz normativa mínima:

| Estado | reviewedAt/reviewedBy | approvedMembershipId | cancelledAt | expiredAt |
|---|---|---|---|---|
| pending | null | null | null | null |
| approved | ambos con valor | con valor | null | null |
| rejected | ambos con valor | null | null | null |
| cancelled | null | null | con valor | null |
| expired | null | null | null | con valor |

No existen `approvedAt`, `rejectedAt`, `rejectionReason`,
`createdMembershipId` ni `updatedAt` en el contrato físico aprobado.

## 6. Índices

Índices conceptuales relevantes:

- FI-RRQ-001: uid ASC, requestedAt DESC;
- FI-RRQ-002: uid ASC, status ASC, requestedAt DESC;
- FI-CG-003: collection-group uid ASC, requestedAt DESC;
- FI-CG-004: collection-group uid ASC, status ASC, requestedAt DESC.

`firestore.indexes.json` contiene cero índices compuestos. La materialización de
los cuatro índices anteriores está pendiente. Esto permite diseño shadow, pero
impide declarar los listados listos para integración funcional.

## 7. Acción humana requerida

Antes de reanudar 03A.3A debe aprobarse una microfase contractual que defina:

1. default y máximo numérico de una página Standard;
2. envelope versionado de cursor para FQ-RRQ-002/003;
3. fingerprint canónico de `uid`, status opcional, scope y dirección;
4. encoding e integridad del cursor;
5. representación serializable de `requestedAt` y full document path para
   `startAfter`;
6. política de error para cursor incompatible o manipulado;
7. estado de materialización de FI-RRQ-001/002 y FI-CG-003/004.

No se modificaron Rules, índices, dominio, infraestructura compartida,
IdentityRepository, TenantRepository, servicios legacy ni UI. No se inició
SaaS-03A.4.

## 8. Resolución posterior SaaS-03A.3A-R1

El bloqueo histórico anterior queda preservado, pero sus decisiones pendientes
fueron resueltas para RegistrationRequest en
`SAAS_03A_3A_R1_REGISTRATION_REQUEST_QUERY_PAGINATION_CONTRACT.md`.

```text
FQI-001 RegistrationRequest scope = resolved
FQI-004 RegistrationRequest scope = resolved
Query/index contract = resolved
R2 shadow implementation = ready_not_started
Index materialization = pending SaaS-03A.3I
```

La resolución no retroactivamente convierte 03A.3A en completa: su intento
inicial permanece `incomplete_superseded_by_resolution`. La implementación se
reanuda únicamente mediante R2 después de revisión humana.

La revisión C1 confirmó el contrato y registró:

```text
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R1-C1 = completed_pending_human_push
SaaS-03A.3A-R2 = ready_not_started
```

## 9. Implementación shadow SaaS-03A.3A-R2

R2 implementó el repositorio self read-only con point get, listado por Tenant y
listado collection-group. Ambos listados aplican UID obligatorio, status
canónico opcional, orden determinista, limit-plus-one y cursor v1 validado. El
serializer conserva la allowlist y lifecycle físicos exactos.

Los cuatro índices compuestos continúan sin materializar; la API permanece
shadow y no está lista para integración funcional. Véase
`SAAS_03A_3A_R2_REGISTRATION_REQUEST_REPOSITORY_IMPLEMENTATION.md`.

```text
SaaS-03A.3A-R2 = completed_pending_human_code_review
SaaS-03A.3I = blocked_pending_R2_review
SaaS-03A.3R = blocked_by_indexes
```

## 10. Materialización local SaaS-03A.3I

FI-RRQ-001/002 y FI-CG-003/004 fueron materializados localmente con los scopes
y campos aprobados. `__name__ DESC` permanece implícito en la definición del
índice y explícito en la query. No hubo deploy ni ejecución de Emulator.

```text
SaaS-03A.3I = completed_pending_human_index_review
SaaS-03A.3R = blocked_pending_3I_review_and_commit
```

La revisión 03A.3I-C1 confirmó el formato y el suffix `__name__ DESC` implícito.
Los índices quedan completados localmente y 03A.3R queda `ready_not_started`.

C1 reviewed the complete implementation, corrected whitespace-only cursor
validation and explicit path/requestId consistency, and expanded coverage to
58 passing unit tests.

```text
SaaS-03A.3A-R2 = completed
SaaS-03A.3A-R2-C1 = completed_pending_human_push
SaaS-03A.3I = ready_not_started
SaaS-03A.3R = blocked_by_indexes
```

## 11. Suite runtime SaaS-03A.3R-A

The Firestore-only integration suite is implemented outside product code with
52 unique cases (34 ALLOW, 18 DENY). It covers the real repository, modular SDK,
Rules, four indexed query variants, pagination/cursors, and explicit denial
shapes. It has not been executed; human test review precedes Emulator runtime.

```text
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed_pending_human_test_review
SaaS-03A.3R-B = blocked_pending_3R_A_review
```

The C1 review strengthened assertions without changing the repository. Final
static suite counts are 52 titles, 34 ALLOW and 18 DENY, with outcomes separated
as 34 SUCCESS, 13 Rules denials, 4 contract errors and 1 NOT_FOUND.

03A.3R-B1 preserves the repository and suite while adding distinct CI precheck,
Rules runtime, and RegistrationRequest runtime gates. No gate was executed here.
