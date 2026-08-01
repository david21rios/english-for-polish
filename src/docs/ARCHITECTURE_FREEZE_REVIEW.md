# Revisión de Architecture Freeze del dominio

## 1. Alcance

Esta revisión cruza exclusivamente los modelos de organización, academia,
identidad, autorización, workflow y relaciones aprobados hasta SaaS-01B.6.
Evalúa si sus contratos pueden considerarse estables antes de diseñar
persistencia, repositorios y reglas de seguridad.

No modifica contratos, enums, workflows, capacidades, relaciones ni documentos
anteriores. Tampoco diseña Firestore, índices, consultas o reglas.

## 2. Metodología

Se aplicaron cuatro comprobaciones:

1. trazabilidad horizontal de cada entidad entre contrato, relación, workflow y
   autorización;
2. trazabilidad vertical de los flujos Identity → RegistrationRequest →
   Membership → Enrollment y Tenant → Course → Enrollment;
3. comparación de estados, actores y capacidades asociados a cada transición;
4. revisión de ownership, cardinalidad, aggregate roots y futuros límites de
   seguridad.

Cada hallazgo se clasifica como crítico, alto, medio, bajo u observación. Los
riesgos ya registrados se conservan como antecedentes y no se duplican en el
backlog nuevo.

## 3. Documentos revisados

- `DOMAIN_MODEL_ORGANIZATION.md`
- `DOMAIN_MODEL_ACADEMIC.md`
- `DOMAIN_MODEL_IDENTITY.md`
- `DOMAIN_MODEL_AUTHORIZATION.md`
- `DOMAIN_WORKFLOW.md`
- `DOMAIN_RELATIONSHIP_MODEL.md`

Los contratos JavaScript asociados se consultaron únicamente para comprobar
que los documentos describen los enums, campos y matrices existentes.

## 4. Matriz de consistencia

| Área | Contratos | Estados/workflow | Capacidades | Relaciones/ownership | Resultado |
|---|---|---|---|---|---|
| Tenant | Coherente en identidad, tipo y estado | Active, suspended y archived alineados | Suspensión y archivado globales explícitos | Root propietario de recursos institucionales | Consistente con pendientes |
| TenantSettings/Branding | Contratos separados y tenant-scoped | Sin workflow propio, coherente con composición | Settings y branding limitados a tenant_admin | RegistrationPolicy compuesto en Settings | Reconciliado, pendiente de reauditoría final |
| Identity | Global y sin tenantId | Email verification separada de AccessState | Capacidades self y lectura global diferenciadas | Aggregate Root y propietaria de interfaceLocale | Reconciliado, pendiente de reauditoría final |
| RegistrationRequest | Precede a Membership | Cinco estados y terminales coherentes | Review tenant-scoped; create/read self | Depende de Tenant e Identity | Consistente |
| Membership | Nace approved; tres estados | Retirada self y administrativa diferenciadas | Gestión tenant-scoped y leave self | Identificada por membershipId | Reconciliado, pendiente de reauditoría final |
| Course | Tenant-scoped y con estado | Draft, active y archived alineados | Activate y archive explícitas | Aggregate Root propiedad del Tenant | BCP 47 reconciliado, pendiente de reauditoría final |
| Enrollment | Une Membership y Course | Cuatro estados coherentes | Capacidades self y tenant | Aggregate Root de la relación N:M | Consistente |
| AuthorizationContext | Contexto global/tenant separado | AccessState nullable y tenant-scoped | No ejecuta decisiones | Respeta tenantId explícito | Reconciliado, pendiente de reauditoría final |
| PlatformRole | Separado de MembershipRole | No tiene workflow propio | Sólo capacidades platform-scoped | Sin acceso tenant implícito | Consistente |

## 5. Consistencias confirmadas

### 5.1 Terminología y límites

- `tenantId` es la frontera institucional única; no aparece
  `institutionId` como contrato alternativo.
- `platform_admin`, `tenant_admin`, `teacher` y `student` mantienen ámbitos
  inequívocos.
- Identity es global; Membership, RegistrationRequest, Course y Enrollment son
  tenant-scoped.
- El idioma de aprendizaje no determina el idioma de interfaz.

### 5.2 Estados y workflows

- RegistrationRequest usa `pending`, `approved`, `rejected`, `cancelled` y
  `expired`; los cuatro resultados son terminales.
- Membership nace únicamente después de aprobación y usa `approved`,
  `suspended` y `removed`.
- Course y Tenant tienen transiciones alineadas con `course.activate` y
  `platform.tenant_archive`.
- No se detectaron ciclos de transición ni saltos hacia estados prohibidos.

### 5.3 Ownership, cardinalidades y aggregates

- Tenant es propietario lógico del contenido institucional, sin convertirse en
  un aggregate ilimitado.
- TenantSettings y TenantBranding son composición 1:1 de Tenant.
- Membership representa Tenant N:M Identity.
- Enrollment representa Membership N:M Course.
- Identity, Tenant, RegistrationRequest, Membership, Course y Enrollment
  conservan ciclos de vida separados como Aggregate Roots.
- No existe ciclo estructural: las referencias convergen en Membership y
  Enrollment, pero no regresan como dependencia de existencia hacia sus roots.

### 5.4 Autorización

- La matriz parte de denegación por defecto y no contiene wildcards.
- MembershipRole sólo aporta capacidades dentro del tenant activo.
- PlatformRole no hereda capacidades institucionales.
- La matriz declarativa se distingue correctamente de una decisión runtime o
  de una regla Firebase.

## 6. Hallazgos críticos

No se detectaron contradicciones críticas que hagan imposible continuar el
diseño. Sí existen hallazgos altos que bloquean declarar Architecture Freeze y
que deben resolverse antes de definir persistencia definitiva.

## 7. Hallazgos altos

### H-01 — Referencia de Membership no resoluble

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`.

**Origen:** `DOMAIN_MODEL_ACADEMIC.md` y `DOMAIN_RELATIONSHIP_MODEL.md`.

Enrollment exige `membershipId`, mientras Membership se identifica
conceptualmente mediante `tenantId + uid` y no declara `membershipId`. No puede
definirse una referencia, ownership check o regla de integridad inequívoca.

**Impacto:** bloquea paths, claves, consultas, idempotencia y reglas de
Enrollment. Corresponde al riesgo existente `ARB-REL-001`.

**Decisión adoptada:** Membership incorpora `membershipId` estable e inmutable;
Enrollment referencia el mismo identificador y debe compartir `tenantId`.
`tenantId + uid` queda como unicidad lógica futura.

**Archivos:** `organization/membership.js`,
`DOMAIN_MODEL_ORGANIZATION.md`, `DOMAIN_MODEL_ACADEMIC.md` y
`DOMAIN_RELATIONSHIP_MODEL.md`.

### H-02 — AccessState carece de resolución canónica

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`.

AccessState reúne estados derivados de email, solicitudes, Membership y Tenant,
pero no existe precedencia ni mapeo completo. `cancelled` y `expired` no tienen
equivalente directo; `suspended` puede proceder de más de una entidad.

**Impacto:** dos capas podrían calcular distinto acceso efectivo. Bloquea
guards y reglas equivalentes. Corresponde al riesgo existente `ARB-002`.

**Decisión adoptada:** AccessState es derivado por `uid + tenantId`, nullable y
no autoritativo. Se definieron cinco prioridades y los casos sin estado
institucional representable.

**Archivos:** `identity/accessStatePrecedence.js`,
`authorization/authorizationContext.js`, `DOMAIN_MODEL_IDENTITY.md`,
`DOMAIN_MODEL_AUTHORIZATION.md` y `DOMAIN_WORKFLOW.md`.

**Decisión SaaS-01B.7C:** AccessState exige tenantId. Sin tenant es `null`,
incluso con email no verificado; dentro del tenant conserva la precedencia
declarada.

### H-03 — Capacidades self anteriores a Membership sin fuente definida

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`.

RegistrationRequest debe crearse antes de Membership, pero la matriz se organiza
por MembershipRole. Aunque `registration_request.create` y
`registration_request.read_self` tienen scope self, una Identity sin Membership
no dispone de un origen declarado para esas capacidades.

**Impacto:** el onboarding público no puede derivarse de la matriz actual sin
un bypass o regla paralela. Es un hallazgo nuevo (`ARB-FR-001`).

**Decisión adoptada:** `IDENTITY_SELF_CAPABILITIES` declara cuatro capacidades
self independientes de MembershipRole y PlatformRole. La matriz institucional
ya no las duplica.

**Archivos:** `authorization/identitySelfCapabilities.js`,
`authorization/roleCapabilityMatrix.js` y
`DOMAIN_MODEL_AUTHORIZATION.md`.

### H-04 — Contrato lingüístico de Course incompleto

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`.

Course modela `learningLanguage`, `interfaceLanguages` y CEFR, pero
`supportLanguageCode` continúa aplazado. La documentación afirma que el idioma
de interfaz es independiente, por lo que `interfaceLanguages` no sustituye el
idioma pedagógico de soporte.

**Impacto:** persistir Course ahora fijaría un contrato incapaz de expresar de
forma canónica el idioma de explicación aprobado. Hallazgo nuevo
`ARB-FR-002`.

**Decisión adoptada:** Course incorpora `supportLanguageCode` obligatorio y lo
distingue de `learningLanguage.languageCode` e `interfaceLocale`.

**Archivos:** `academic/course.js` y `DOMAIN_MODEL_ACADEMIC.md`.

**Decisión SaaS-01B.7C:** todas las etiquetas lingüísticas del dominio,
incluido `supportLanguageCode`, usan BCP 47 como norma contractual.

### H-05 — Aprobación de Request y creación de Membership cruzan aggregates

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`.

RegistrationRequest approved puede originar exactamente una Membership
approved e idempotente, pero no está definida la frontera de consistencia que
garantiza unicidad y evita aprobación sin Membership o duplicados.

**Impacto:** riesgo alto de estados parciales en persistencia y de divergencia
entre autorización y datos. No requiere implementar infraestructura ahora,
pero sí aprobar el comando y sus invariantes antes de elegir la persistencia.
Hallazgo nuevo `ARB-FR-003`.

**Decisión adoptada:** `ApproveRegistrationRequest` es una frontera conceptual
cross-aggregate. Usa `requestId` para idempotencia y exige conjuntamente Request
approved y exactamente una Membership approved.

**Archivos:** `workflow/registrationApproval.js`,
`workflow/registrationRequestWorkflow.js`, `DOMAIN_MODEL_IDENTITY.md`,
`DOMAIN_WORKFLOW.md` y `DOMAIN_RELATIONSHIP_MODEL.md`.

## 8. Hallazgos medios

### M-01 — RegistrationPolicy tiene dos representaciones

Existe un contrato standalone y un placeholder dentro de TenantSettings sin
relación canónica entre ambos. Corresponde a `ARB-REL-002`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`. RegistrationPolicy es
un único Value Object compuesto de TenantSettings.

### M-02 — Salida voluntaria sin capacidad equivalente

El workflow permite que `identity_self` retire Membership, pero el catálogo sólo
incluye `membership.remove` tenant-scoped. Corresponde a `ARB-001`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`. Se añadió
`membership.leave_self` con ownership por uid.

### M-03 — Capacidad de revisión de Membership sin transición propia

Tras reconciliar Membership para que nazca approved, una capacidad legacy de
revisión permanecía en el catálogo y en tenant_admin, aunque la revisión ocurre
sobre RegistrationRequest.

**Impacto:** puede producir una autorización sin operación canónica o duplicar
`registration_request.review`. Hallazgo nuevo `ARB-FR-004`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`.
La capacidad legacy fue eliminada; RegistrationRequest conserva list y review.

### M-04 — `platform_system` no está representado en autorización

El workflow asigna la expiración a `platform_system`, pero AuthorizationContext
sólo representa una Identity y PlatformRoles. No existe un contrato de actor
de sistema ni autoridad futura delimitada.

**Impacto:** una implementación podría usar privilegios globales informales
para expirar solicitudes. Hallazgo nuevo `ARB-FR-005`.

### M-05 — Preferencia `interfaceLocale` sin propietario canónico

Los documentos distinguen correctamente InterfaceLanguage de LearningLanguage,
pero Identity no contiene `interfaceLocale` y el modelo no determina dónde vive
la preferencia seleccionada por el usuario.

**Impacto:** riesgo de duplicarla entre perfil, sesión y TenantSettings.
Hallazgo nuevo `ARB-FR-006`.

**Estado SaaS-01B.7C:** `resolved_pending_final_reaudit`. Identity es la fuente
canónica de `interfaceLocale` BCP 47.

### M-06 — Enrollment activo ante Course archivado

Se conserva Enrollment, pero no se ha definido su operatividad al archivar el
Course. Corresponde a `ARB-REL-003`.

## 9. Hallazgos bajos

### L-01 — Texto residual de Membership

`DOMAIN_WORKFLOW.md` todavía menciona `pending` y `rejected` como si fueran
MembershipStatus, aunque fueron eliminados en SaaS-01B.5A.

**Impacto:** no contradice los enums ni matrices ejecutables, pero puede inducir
implementaciones erróneas. Hallazgo nuevo `ARB-FR-007`.

**Estado SaaS-01B.7A:** `resolved_pending_reaudit`. Se corrigió exclusivamente
la referencia residual autorizada, sin rediseñar el workflow.

### L-02 — Creación de composiciones 1:1 no definida

TenantSettings y TenantBranding son composición 1:1, pero no se aclara si deben
crearse atómicamente con Tenant o materializarse bajo demanda con defaults.

**Impacto:** ambigüedad menor para bootstrap e invariantes de existencia.
Hallazgo nuevo `ARB-FR-008`.

## 10. Observaciones

- No hay duplicación de enums entre dominios; cada estado conserva contexto.
- Reutilizar palabras como `active` es aceptable porque los tipos permanecen
  separados.
- Los Aggregate Roots elegidos evitan un Tenant aggregate de tamaño ilimitado.
- La conservación histórica ante suspensión, retirada o archivado es coherente.
- La falta de propagaciones automáticas es deliberada y evita acoplamiento.
- La arquitectura puede crecer a nuevos tipos de tenant sin cambiar sus
  relaciones fundamentales.
- Firestore Rules necesitará comprobar referencias y estado, no sólo copiar la
  matriz de capacidades.
- La escalabilidad lógica es adecuada, pero dependerá de elegir claves
  tenant-scoped, consultas acotadas y operaciones idempotentes.

## 11. Architecture Review Backlog

### 11.1 Entradas existentes, no duplicadas

| ID | Prioridad | Estado en esta revisión |
|---|---|---|
| `ARB-001` | Medio | `resolved_pending_final_reaudit` |
| `ARB-002` | Alto | `resolved_pending_final_reaudit` |
| `ARB-REL-001` | Alto | Resuelto contractualmente, pendiente de reauditoría |
| `ARB-REL-002` | Medio | `resolved_pending_final_reaudit` |
| `ARB-REL-003` | Medio | Sigue abierto |

### 11.2 Nuevos hallazgos

| ID | Prioridad | Área afectada | Descripción | Impacto | Fase sugerida |
|---|---|---|---|---|---|
| `ARB-FR-001` | Alto | Authorization/Identity | Fuente declarativa `IDENTITY_SELF_CAPABILITIES` | `resolved_pending_reaudit` | SaaS-01B.7B |
| `ARB-FR-002` | Alto | Academic | BCP 47 canónico para `supportLanguageCode` | `resolved_pending_final_reaudit` | SaaS-01B.7D |
| `ARB-FR-003` | Alto | Identity/Organization | `ApproveRegistrationRequest` y `requestId` delimitan consistencia | `resolved_pending_reaudit` | SaaS-01B.7B |
| `ARB-FR-004` | Medio | Authorization/Workflow | Capacidad legacy eliminada; revisión permanece en RegistrationRequest | `resolved_pending_final_reaudit` | SaaS-01B.7D |
| `ARB-FR-005` | Medio | Authorization/Workflow | Autoridad `platform_system` no representada | Riesgo de privilegio técnico informal | Modelo de actores privilegiados |
| `ARB-FR-006` | Medio | Identity/Academic | Identity posee `interfaceLocale` BCP 47 | `resolved_pending_final_reaudit` | SaaS-01B.7D |
| `ARB-FR-007` | Bajo | Workflow docs | Referencias residuales a pending/rejected en Membership | `resolved_pending_reaudit` por excepción autorizada | SaaS-01B.7B |
| `ARB-FR-008` | Bajo | Organization/Relationships | Materialización de Settings/Branding 1:1 no definida | Bootstrap ambiguo | Diseño de persistencia |

## 12. Riesgos para persistencia, reglas y escalabilidad

### Persistencia

- El formato físico de `membershipId` continúa aplazado.
- La aprobación institucional requiere una operación idempotente con
  reconciliación explícita.
- RegistrationPolicy ya tiene una única fuente contractual; su materialización
  física junto a TenantSettings continúa aplazada.

### Reglas de seguridad

- AccessState no debe persistirse como autoridad; su derivación tenant-scoped
  ya está definida declarativamente.
- Las capacidades self previas a Membership requieren reglas independientes de
  MembershipRole, pero siempre ligadas al `uid`.
- `platform_system` y platform_admin no deben convertirse en bypass de tenant.
- Las referencias Enrollment → Membership → Tenant y Enrollment → Course →
  Tenant deben demostrar pertenencia al mismo tenant.

### Escalabilidad

- Los aggregates separados son adecuados para crecimiento.
- La idempotencia y consistencia entre aggregates serán más importantes que
  una transacción amplia sobre Tenant.
- Ninguna consulta futura debe depender de recorrer todas las Memberships o
  Courses del sistema para resolver contexto.

## 13. Contradicciones

No se detectaron contradicciones circulares. Las contradicciones enumeradas en
SaaS-01B.7 fueron reconciliadas contractualmente en SaaS-01B.7A y SaaS-01B.7C,
pero su cierre definitivo requiere reauditoría independiente.

## 14. Reconciliación SaaS-01B.7A

Los cinco hallazgos altos fueron tratados exclusivamente a nivel contractual y
declarativo. Todos quedan `resolved_pending_reaudit`; no se eliminó su historia
ni se declaró Architecture Freeze.

La implementación de persistencia, evaluación de AccessState, composición de
capacidades y atomicidad continúa aplazada. Los hallazgos medios y bajos siguen
abiertos, excepto la referencia documental residual expresamente autorizada.

No se detectaron nuevas contradicciones derivadas de la reconciliación.

## 15. Conclusión histórica SaaS-01B.7A

**¿Puede declararse el dominio Architecture Freeze? No.**

La estructura central es sólida: tenantId, ownership institucional, separación
de Identity y Membership, aggregates, estados reconciliados y autorización por
capacidades forman una base coherente y sin dependencias circulares.

SaaS-01B.7A resolvió contractualmente los cinco hallazgos altos, pero esta fase
no está autorizada para sustituir el gate independiente de reauditoría. Debe
verificarse en SaaS-01B.7B que contratos, documentos y matrices permanezcan
coherentes antes de cambiar la respuesta o iniciar SaaS-02.

## 16. Reconciliación SaaS-01B.7C

Los seis bloqueadores identificados por SaaS-01B.7B quedan
`resolved_pending_final_reaudit`:

1. AccessState estrictamente tenant-scoped y null fuera de tenant.
2. BCP 47 como norma canónica de códigos lingüísticos.
3. RegistrationPolicy como Value Object compuesto en TenantSettings.
4. `membership.leave_self` para retirada voluntaria propia.
5. Eliminación de la capacidad legacy de revisión de Membership.
6. Identity como propietaria de `interfaceLocale`.

Se modificaron los contratos y documentos de identidad, organización,
academia, autorización, workflow y relaciones correspondientes. No se
detectaron contradicciones nuevas.

Permanecen para SaaS-02 la autoridad técnica de `platform_system`, el
comportamiento físico de Enrollment ante Course archivado, la materialización
de TenantSettings/TenantBranding, la atomicidad tecnológica, las claves
físicas, índices, consultas y reglas.

Architecture Freeze no se declara en esta fase. El único gate autorizado para
esa decisión es SaaS-01B.7D.

## 17. Reauditoría definitiva SaaS-01B.7D

La reauditoría contrastó directamente todos los contratos JavaScript y la
documentación vigente, sin asumir como válidos los cierres anteriores.

### 17.1 Hallazgos altos originales

| Hallazgo | Estado definitivo | Evidencia |
|---|---|---|
| H-01 Membership ID | Closed | Membership declara `membershipId`; Enrollment lo referencia y comparte `tenantId` |
| H-02 AccessState | Closed | Requiere `uid + tenantId`, es derivado y produce null sin tenant |
| H-03 Identity Self Capabilities | Closed | Fuente independiente, scopes preservados y sin duplicación en MembershipRole |
| H-04 Contrato lingüístico | Closed | Learning, support e interface usan BCP 47 con ownership distinto |
| H-05 Aprobación cross-aggregate | Closed | `ApproveRegistrationRequest` define efectos conjuntos e idempotencia por `requestId` |

### 17.2 Bloqueadores de SaaS-01B.7B

| Bloqueador | Estado definitivo |
|---|---|
| B-01 AccessState fuera de Tenant | Closed |
| B-02 Norma de supportLanguageCode | Closed |
| B-03 RegistrationPolicy | Closed |
| B-04 Salida voluntaria | Closed |
| B-05 Capacidad legacy de revisión de Membership | Closed |
| B-06 interfaceLocale | Closed |

### 17.3 Clasificación final del backlog

#### A. Cerrado por SaaS-01B.7C

- `ARB-001`
- `ARB-002`
- `ARB-REL-001`
- `ARB-REL-002`
- `ARB-FR-001`
- `ARB-FR-002`
- `ARB-FR-003`
- `ARB-FR-004`
- `ARB-FR-006`
- `ARB-FR-007`

#### B. No bloqueante y transferido a SaaS-02

- `ARB-REL-003`: tratamiento técnico de Enrollment ante Course archivado.
- `ARB-FR-005`: autoridad técnica de `platform_system`.
- `ARB-FR-008`: materialización física de Settings y Branding.
- Formatos físicos de IDs, colecciones, índices, consultas, atomicidad,
  transacciones y reglas.

#### C. Bloqueantes reales todavía abiertos

Ninguno.

### 17.4 Matriz definitiva

| Criterio | Resultado |
|---|---|
| Consistencia conceptual | Cumple |
| Consistencia contractual | Cumple |
| Consistencia de ownership | Cumple |
| Consistencia de cardinalidades | Cumple |
| Consistencia de estados | Cumple |
| Consistencia de autorización | Cumple |
| Consistencia de workflows | Cumple |
| Independencia tecnológica | Cumple |
| Preparación conceptual para persistencia | Cumple |

## 18. Decisión definitiva

```text
Architecture Freeze = APPROVED
Domain Version = 1.2.0
Freeze Phase = SaaS-01B.7D
```

### Enmienda controlada SaaS-02B.4A

Domain 1.1.0 conserva `Architecture Freeze = APPROVED`. La evolución es un
cambio aditivo no disruptivo: añade `registration_request.cancel_self` y
`membership.restore` para operaciones ya presentes en los workflows. No cambia
entidades, estados, IDs, ownership, cardinalidades, aggregates ni topología de
persistencia.

La cancelación self queda vinculada al ownership por uid y al estado `pending`;
la restauración queda limitada a tenant_admin, al mismo Tenant y a
`suspended -> approved`. SaaS-02B.4 requiere una revalidación breve antes de
SaaS-02C; no se reabren los hallazgos cerrados del Freeze.

### Enmienda controlada SaaS-02B.4C

Domain 1.2.0 añade únicamente `platform.tenant_restore`, formaliza
RestoreTenant, UpdateTenantProfile y PlatformUpdateTenantMetadata, y enlaza los
workflows existentes con capabilities ya canónicas. Es un cambio aditivo y
declarativo: no modifica entidades, estados, IDs, ownership, cardinalidades,
Persistence Roots ni topología Firestore. Las capabilities anteriormente
huérfanas quedan vinculadas; el Freeze permanece aprobado y SaaS-02B.4 espera la
revalidación independiente SaaS-02B.4D.

SaaS-01B queda cerrada. Las decisiones transferidas a SaaS-02 no requieren
modificar el significado contractual congelado. SaaS-02 es la siguiente fase,
pero no fue iniciada por esta reauditoría.
