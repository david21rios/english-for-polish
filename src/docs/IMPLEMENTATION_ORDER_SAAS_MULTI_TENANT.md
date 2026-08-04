# Orden de implementación SaaS multi-tenant

**Estado:** plan corregido y listo para aprobación de implementación
**Estrategia:** expand → migrate → contract
**Regla:** ninguna fase activa enforcement ni elimina compatibilidad antes de
cumplir su gate.

## Convenciones transversales

- `tenantId` es la frontera técnica.
- Los datos académicos pertenecen al tenant.
- Firebase Authentication/token es autoridad de `emailVerified`.
- `status` es autoridad de lifecycle de membership.
- Toda migración es idempotente, reanudable, auditable y ensayada.
- El cutover usa mantenimiento corto por dominio según ADR-008.
- Las reglas usan deny-by-default y se prueban negativamente entre dos tenants.
- Los feature flags tienen owner, valor seguro y fecha de retirada.

## 00 — Documentación y baseline

### Objetivo

Aprobar ADR, contrato de datos, estados, ownership y alcance del tenant legacy.

### Archivos

- actualizar `src/docs/*`;
- no modificar código.

### Dependencias

Auditoría SaaS, ADR-001 a ADR-009 y auditoría histórica.

### Datos, reglas y migraciones

Ninguna mutación.

### Pruebas

- revisión de términos;
- verificación de diagramas;
- `git diff --check`.

### Aceptación y gate

- tenant receptor de datos legacy designado;
- decisiones sin alternativas abiertas;
- responsables de seguridad y migración asignados.

### Riesgo y rollback

Contradicción documental. Rollback limitado a documentación.

## 01A — Inventario remoto y Emulator scaffolding

### Objetivo

Capturar el estado remoto real y preparar una infraestructura local sin escribir
todavía reglas funcionales definitivas.

### Crear

```text
firebase.json
.firebaserc
firestore.indexes.json
tests/rules/fixtures/
tests/rules/helpers/
```

Los archivos de reglas pueden crearse como copias verificadas del estado remoto
o scaffolding deny-by-default para paths todavía inexistentes, no como contrato
tenant definitivo.

### Modificar

- `package.json`: scripts de emulador y pruebas;
- documentación de entornos;
- `src/firebase.js` sólo si se necesita conexión explícita al emulador.

### Dependencias

Fase 00. Puede avanzar en paralelo con 01B.

### Datos, reglas y migraciones

- inventario read-only de Auth, colecciones, subcolecciones, Storage, reglas e
  índices;
- ninguna migración.

### Pruebas

- Emulator arranca sin servicios remotos;
- fixtures no contienen datos reales;
- ruleset remoto queda archivado y comparado.

### Aceptación y gate

Baseline reproducible y diferencias remotas conocidas. Las reglas definitivas
esperan 01B.

### Riesgo y rollback

Riesgo de asumir que reglas locales son remotas. No desplegar. Rollback:
retirar scaffolding.

## 01B — Contratos, estados y matriz de capacidades

### Objetivo

Cerrar modelos puros antes de escribir reglas o repositorios funcionales.

01B se entrega mediante subfases aprobadas de forma independiente. `01B.1`
define exclusivamente el modelo organizacional (`Tenant`, `Membership`,
`TenantSettings`, `TenantBranding` y sus enums) en
`src/domain/organization/`. Completar 01B.1 no satisface por sí solo el gate de
01B ni habilita SaaS-02.

`01B.2` depende del vocabulario organizacional de 01B.1 y define exclusivamente
el modelo académico puro (`Course`, `Enrollment`, `LearningLanguage`,
`InterfaceLanguage` y sus enums) en `src/domain/academic/`. Completar 01B.2
tampoco satisface por sí solo el gate de 01B ni habilita SaaS-02.

`01B.3` depende de MembershipRole definido en 01B.1 y modela exclusivamente la
identidad global y la solicitud de acceso institucional (`Identity`,
`RegistrationRequest`, `RegistrationPolicy` y `AccessState`) en
`src/domain/identity/`. Completar 01B.3 tampoco satisface por sí solo el gate de
01B ni habilita SaaS-02.

`01B.4` depende de los roles y estados definidos en 01B.1 y 01B.3. Define
exclusivamente el catálogo declarativo de capacidades, PlatformRole, scopes,
matriz por rol y AuthorizationContext en `src/domain/authorization/`. No
implementa evaluación y tampoco satisface por sí solo el gate de 01B ni
habilita SaaS-02.

`01B.5` referencia los estados y roles ya aprobados para documentar creación,
actores y transiciones de RegistrationRequest, Membership, Enrollment, Course
y Tenant en `src/domain/workflow/`. No implementa máquinas de estado y tampoco
satisface por sí solo el gate de 01B ni habilita SaaS-02.

`01B.5A` reconcilia de forma controlada RegistrationRequestStatus,
MembershipStatus y las capacidades `course.activate` y
`platform.tenant_archive`, sin implementar lógica ni habilitar SaaS-02.

`01B.6` documenta el modelo relacional lógico, ownership, cardinalidades,
dependencias y Aggregate Roots sin diseñar persistencia. Tampoco satisface por
sí solo el gate de 01B ni habilita SaaS-02.

`01B.7` realiza la revisión cruzada de Architecture Freeze. `01B.7A` reconcilia
exclusivamente sus cinco hallazgos altos: identidad canónica de Membership,
precedencia de AccessState, capacidades self de Identity, idioma de soporte de
Course y frontera idempotente de aprobación. Los resultados quedan
`resolved_pending_reaudit`; sólo una reauditoría posterior puede declarar el
freeze y habilitar el gate hacia SaaS-02.

`01B.7B` reaudita el gate y `01B.7C` reconcilia exclusivamente sus seis
bloqueadores: AccessState tenant-scoped, BCP 47, RegistrationPolicy compuesto,
retirada self de Membership, eliminación de `membership.review` y ownership de
`interfaceLocale`. Los cierres permanecen
`resolved_pending_final_reaudit`; SaaS-02 continúa bloqueada hasta la decisión
independiente de 01B.7D.

`01B.7D` reaudita directamente contratos y documentos, cierra todos los
bloqueadores contractuales y aprueba `Architecture Freeze` para Domain 1.0.0;
la enmienda aditiva SaaS-02B.4A lo evoluciona posteriormente a Domain 1.1.0 sin
revocar el Freeze.
SaaS-01B queda finalizada.

`02A.1` define los Persistence Roots, referencias y fronteras lógicas sin diseño
físico. `02A.2` completa invariantes, operaciones, integridad referencial,
retención, idempotencia y concurrencia conceptual. Con 02A.2, el modelo lógico
de persistencia queda completo. `02B.1` inicia la fase tecnológica mediante el
catálogo de patrones de acceso Firestore, todavía sin decidir topología física,
paths, índices ni reglas. `02B.2` selecciona y documenta la topología híbrida,
document shapes, referencias, lookups y fronteras atómicas sin implementar
queries, reglas o índices. `02B.3` define 45 Query Contracts, índices
documentales, ordenamientos, cursores y límites conceptuales para los 70 Access
Patterns sin modificar Firebase. `02B.4` define autoridad de escritura,
transactions, concurrencia, idempotencia, lookups, audit y errores, pero queda
incompleta hasta revalidar los dos gaps de capability. `02B.4A` aplica una
enmienda aditiva controlada: incorpora `registration_request.cancel_self` y
`membership.restore`, evoluciona el dominio congelado a 1.1.0 y queda
`completed_pending_revalidation`. SaaS-02B.4 sigue incompleta hasta esa
revalidación. `02B.4B` cierra FWC-001/002 pero detecta FWR-001/002/003.
`02B.4C` enlaza las transiciones, añade `platform.tenant_restore`, formaliza
RestoreTenant/UpdateTenantProfile/PlatformUpdateTenantMetadata y evoluciona a
Domain 1.2.0 con estado `completed_pending_revalidation`. SaaS-02B.4 y SaaS-02B
siguen incompletas. `02B.4D` revalida esas correcciones y detecta exclusivamente
FWR-005/006/007. `02B.4E` completa los tres escenarios de concurrencia, las tres
filas de idempotencia y corrige el conteo vigente a 70 Access Patterns/10 Tenant
patterns; su estado es `completed_pending_revalidation`. SaaS-02B.4 permanece
INCOMPLETE hasta SaaS-02B.4F, SaaS-02B permanece INCOMPLETE, SaaS-02C no ha
comenzado y el Mandatory Firebase Security Review Gate sigue PENDING.

La revalidación independiente `02B.4F` verifica y cierra FWR-005/006/007 sin
alterar arquitectura. El estado definitivo es:

```text
SaaS-02B.4A = completed
SaaS-02B.4B = completed
SaaS-02B.4C = completed
SaaS-02B.4D = completed
SaaS-02B.4E = completed
SaaS-02B.4F = completed

SaaS-02B.4 = completed
SaaS-02B = completed

Mandatory Firebase Security Review Gate = REQUIRED
SaaS-02C = next, not started
```

El gate no ha sido ejecutado y SaaS-02C no ha comenzado.

El Mandatory Firebase Security Review Gate audita paths, actores, CRUD, campos,
transiciones, collection groups, backend-only, client candidates y riesgos. El
informe `FIREBASE_SECURITY_REVIEW_GATE.md` aprueba la preparación para el diseño
documental de Firestore Rules:

```text
Mandatory Firebase Security Review Gate = APPROVED
SaaS-02C = next, not started
```

SaaS-02C deberá comenzar por diseño documental de Firestore Rules, no por
implementación directa. Storage continúa deny-all hasta que exista un modelo de
recursos y ownership aprobado.

### Crear

```text
src/config/productConfig.js
src/config/localeConfig.js
src/config/cefrConfig.js
src/config/routeConfig.js
src/config/featureFlags.js
src/domain/organization/tenant.js
src/domain/organization/membership.js
src/domain/organization/tenantSettings.js
src/domain/organization/tenantBranding.js
src/domain/organization/enums.js
src/domain/academic/course.js
src/domain/academic/enrollment.js
src/domain/academic/learningLanguage.js
src/domain/academic/interfaceLanguage.js
src/domain/academic/enums.js
src/domain/identity/identity.js
src/domain/identity/registrationRequest.js
src/domain/identity/registrationPolicy.js
src/domain/identity/accessStatePrecedence.js
src/domain/identity/enums.js
src/domain/authorization/enums.js
src/domain/authorization/capabilities.js
src/domain/authorization/identitySelfCapabilities.js
src/domain/authorization/roleCapabilityMatrix.js
src/domain/authorization/authorizationContext.js
src/domain/workflow/actors.js
src/domain/workflow/registrationApproval.js
src/domain/workflow/registrationRequestWorkflow.js
src/domain/workflow/membershipWorkflow.js
src/domain/workflow/enrollmentWorkflow.js
src/domain/workflow/courseWorkflow.js
src/domain/workflow/tenantWorkflow.js
```

### Modificar

Ningún consumidor funcional.

### Dependencias

Fase 00. Puede avanzar en paralelo con 01A.

### Modelo afectado

- tenant;
- membership;
- roles/capabilities;
- course/enrollment;
- access state;
- invitation;
- audit event;
- códigos lingüísticos.

### Reglas

Especificar pseudoreglas y matriz; no desplegar rules definitivas.

### Pruebas

- normalizadores e invariantes;
- precedencia de estados;
- requisitos por rol;
- `status` canónico;
- `tenant_selection_required`;
- valores inválidos fail-closed.

### Aceptación y gate

- contratos aprobados;
- no hay `institutionId` nuevo ni rol `admin`;
- `student` requiere enrollment; roles administrativos no;
- `isActive` legacy tiene invariante y fecha de retirada.

### Riesgo y rollback

Bajo: módulos puros no conectados. Rollback: retirar artefactos nuevos.

## 02 — Reglas, índices y pruebas de aislamiento

### Objetivo

Implementar reglas definitivas basadas en contratos aprobados.

### Crear/modificar

```text
firestore.rules
firestore.indexes.json
tests/rules/firestore.*
```

Las referencias históricas de esta fase a `storage.rules` y
`tests/rules/storage.*` quedan
`superseded_for_current_no_storage_release`. La versión SaaS actual es
Firestore-only; `storage.rules` permanece deny-all y fuera del gate.

### Dependencias

01A y 01B completas.

### Modelo/reglas

- identidad propia;
- membership por tenant;
- capacidades;
- course/enrollment;
- Storage tenant-aware: `superseded_for_current_no_storage_release`;
- platform role global;
- invitaciones no legibles por clientes;
- auditoría append-only mediante backend.

### Migraciones

Ninguna.

### Pruebas

- tenant A no lee/escribe B;
- cada rol y estado;
- course/enrollment cruzado;
- usuario anónimo;
- platform admin sin acceso tenant implícito;
- Storage: excluido del gate vigente no-Storage;
- campos protegidos;
- consultas previstas e índices.

### Aceptación y gate

Suite de reglas verde en emulador y revisión de seguridad. No conectar UI antes.
Para la versión vigente, esta aceptación se limita a Firestore. Storage requiere
una fase arquitectónica futura independiente y no bloquea 03A.

### Riesgo y rollback

Divergencia con producción. Despliegue sólo tras plan de compatibilidad; rollback
al ruleset baseline versionado.

## 03A — Repositorios tenant-aware

### Objetivo

Añadir persistencia en modo expand sin retirar servicios legacy.

### Crear en una fase de implementación posterior

```text
src/services/saas/identity/identityRepository.js
src/services/saas/tenants/tenantRepository.js
src/services/saas/registrationRequests/registrationRequestRepository.js
src/services/saas/memberships/membershipRepository.js
src/services/saas/courses/courseRepository.js
src/services/saas/enrollments/enrollmentRepository.js
```

### Modificar

- extraer por dominio desde `firestoreService.js`;
- conservar adaptadores legacy con nombre explícito.

### Dependencias

Fase 02 cerrada bajo la política vigente Firestore-only y aprobación humana de
SaaS-02C.2H.

### Modelo/reglas

Paths aprobados y `tenantId` obligatorio.

### Migraciones

Sólo fixtures/staging.

### Pruebas

- repositorios con Emulator;
- tenant obligatorio;
- path/document coinciden;
- errores y timestamps;
- consultas acotadas.

### Aceptación y gate

Ningún repositorio institucional permite consulta global u omitir tenant.
Identity es la única raíz global explícita. 03A no contiene Storage/Media,
AuditLog físico, invitaciones backend, foros, progreso, tests legacy,
presentations ni soporte.

### Riesgo y rollback

Coexistencia temporal de capas. Mitigar con flags y fecha de retiro.

## 03B — Backend privilegiado y bootstrap

### Objetivo

Crear operaciones que nunca deben ejecutarse desde el navegador.

### Crear

- backend/Functions equivalente;
- invitación/aceptación/revocación;
- roles y suspensión;
- creación de tenant y primer `tenant_admin`;
- bootstrap out-of-band de `platform_admin`;
- auditoría de plataforma/tenant.

### Modificar

- configuración de despliegue;
- reglas para bloquear mutaciones cliente.

### Dependencias

Fase 02. Puede avanzar en paralelo con 03A, coordinando schemas.

### Bootstrap

Script Admin SDK de un solo uso:

1. lista explícita UID + correo verificado;
2. precondición de cero `platform_admin`;
3. asignación claim + registro restringido;
4. evento auditable;
5. verificación de ambas cuentas;
6. inutilización/retirada del script.

`DEFAULT_ADMINS` mantiene sólo acceso legacy temporal.

### Invitaciones

- token aleatorio de un solo uso y hash persistido;
- HMAC del correo normalizado con secreto servidor;
- email cifrado/restringido sólo si es necesario;
- colección no legible por clientes;
- aceptación backend;
- expiración, revocación y replay protection;
- mensajes neutrales;
- retención y purga de vencidas.

### Pruebas

Bootstrap único, recuperación, no escalada, invitaciones concurrentes,
expiración, revocación, email incorrecto, replay y auditoría.

### Aceptación y gate

Dos `platform_admin` verificados sin memberships automáticas. Operaciones
privilegiadas no son ejecutables directamente por cliente.

### Riesgo y rollback

Pérdida de acceso. Mantener puente legacy detrás de flag hasta verificar
recuperación; no eliminar constante.

## 04 — Providers en shadow mode

### Objetivo

Construir resolución de sesión sin bloquear todavía el flujo legacy.

### Crear

```text
src/context/SessionContext.jsx
src/context/TenantContext.jsx
src/context/CourseContext.jsx
src/hooks/useSession.js
src/hooks/useActiveTenant.js
src/domain/access/resolveAccessState.js
```

### Modificar

- `main.jsx` para providers en shadow mode;
- telemetría segura de divergencias;
- no reemplazar aún `PrivateRoute`/`AdminRoute`.

### Dependencias

03A; integración privilegiada depende de 03B.

### Comportamiento

- resuelve memberships sin enforcement;
- `activeTenantId` vive en sesión/pestaña, preferentemente `sessionStorage`;
- `lastActiveTenantId` es preferencia opcional;
- revalida membership;
- Firebase Auth/token manda sobre `emailVerified`;
- un snapshot Firestore es informativo;
- curso/enrollment se resuelve según rol.

### Migraciones

Ninguna.

### Pruebas

Comparar resolución legacy/nueva, varias pestañas, logout, tenant suspendido,
roles, refresh y caché.

### Aceptación y gate

Shadow mode no cambia rutas ni acceso y produce resultados reconciliables.

### Riesgo y rollback

Lecturas adicionales/loaders. Desactivar provider/flag sin alterar datos.

## 05 — Bootstrap de datos de acceso legacy

### Objetivo

Crear el contexto mínimo que necesitan los usuarios actuales antes del
enforcement.

### Crear/migrar

1. tenant legacy explícitamente aprobado;
2. curso legacy con `learningLanguageCode` y `supportLanguageCode`;
3. memberships mínimas para usuarios legacy;
4. roles mapeados y revisados;
5. enrollments legacy activos para estudiantes;
6. `lastActiveTenantId` opcional;
7. mappings de IDs para migraciones posteriores.

### Dependencias

03A, 03B y 04.

### Reglas

Compatibles con legacy y paths nuevos durante expand.

### Cutover

Ventana de mantenimiento para cambios de perfil/membership si son mutables.

### Pruebas

- todos los usuarios esperados tienen membership;
- estudiantes tienen enrollment;
- teacher/tenant_admin no requieren enrollment;
- admins legacy no obtienen privilegios globales/tenant indebidos;
- conteos y roles reconciliados.

### Aceptación y gate

100 % de usuarios activos resolubles o lista explícita de excepciones aprobada.

### Riesgo y rollback

Mapeo de roles incorrecto. Conservar documentos legacy y desactivar consumers
nuevos.

## 06 — Activación progresiva de guardas

### Objetivo

Sustituir validación legacy por máquina de estados y capacidades.

### Crear

```text
src/components/routes/AccessRoute.jsx
src/pages/WorkspaceSelector.jsx
src/pages/AccessStatusPage.jsx
```

### Modificar

- `App.jsx`;
- `PrivateRoute.jsx`;
- `AdminRoute.jsx`;
- `RootRedirect.jsx`;
- Header/login/logout.

### Dependencias

Fase 05 reconciliada y 03B operativo.

### Estados y acceso por rol

- `student`: membership aprobada + enrollment/curso activos;
- `teacher`: membership aprobada; curso por operación;
- `tenant_admin`: membership aprobada; sin enrollment;
- `platform_admin`: contexto global sin acceso tenant implícito.

`tenant_selection_required`:

- condición: varias memberships aprobadas/activas y ninguna selección válida;
- ruta: `/select-workspace`;
- redirección: desde rutas tenant privadas;
- mensaje: seleccionar espacio de trabajo;
- acciones: seleccionar, logout, consultar estados;
- pruebas: selección, suspensión, back/refresh y pestañas.

### Activación

Feature flag por cohorte, métricas y rollback inmediato.

### Pruebas

Todos los estados, URL directa, cambio tenant, cambio rol, logout, múltiples
memberships y ausencia de enrollment por rol.

### Aceptación y gate

Ningún usuario legacy válido queda bloqueado; tenant A no abre B.

### Riesgo y rollback

Loops/bloqueo. Apagar flag y volver a guardas legacy.

## 07 — i18n shell y Auth

### Objetivo

Localizar interfaz pública y shell sin depender de una sesión autenticada.

### Crear

```text
src/i18n/I18nProvider.jsx
src/i18n/locales/{locale}/
src/hooks/useInterfaceLocale.js
src/components/locale/LocaleSelector.jsx
```

### Modificar

Welcome, Login, Register, VerificationPending, Header, Footer, errores globales,
perfil e `html lang`.

### Dependencias

01B para locale contract. Puede comenzar antes de 04; la sincronización
autenticada depende de Session.

### Resolución

Selección Welcome → temporal pre-registro → perfil → tenant default → plataforma.
Session sincroniza `interfaceLocale` tras autenticar. Nunca modifica idiomas del
curso.

### Migraciones

Fallback `pl-PL`; evitar escritura masiva si el resolver maneja ausencia.

### Pruebas

Anónimo, autenticado, precedencia, persistencia, fallback, fechas/números,
`html lang` y separación de idiomas académicos.

### Aceptación y gate

Welcome/Auth funcionan sin Session y el shell no mezcla locales iniciales.

### Riesgo y rollback

Catálogo incompleto. Fallback al locale de plataforma.

## 08A — Repositorios académicos por dominio

### Objetivo

Crear paths tenant/course sin migrar todavía producción.

### Entregas separadas

1. cursos, niveles y módulos;
2. lecciones conservando estructura íntegra;
3. definiciones de tests;
4. temas y misiones.

### Modificar

`services/courses/*`, `services/test/*`, `services/missions/*`,
`firestoreService.js` y repositorios administrativos por dominio.

### Dependencias

03A, 05 y reglas de 02.

### Pruebas

Dos tenants, mismo idioma, mismo A1, drafts, ownership, estructura de lección y
denegación cruzada.

### Aceptación y gate

Todos los repositorios académicos exigen tenant/curso y tienen mappings legacy.

### Riesgo y rollback

Adapters inconsistentes. No conectar consumidores hasta validación.

## 08B — Migración y cutover de contenido

### Objetivo

Migrar cursos, niveles, módulos, lecciones, tests, temas y misiones por dominio.

### Dependencias

08A y mappings aprobados. Providers existen y reglas están probadas.

### Estrategia por dominio

1. snapshot;
2. bloqueo temporal de escrituras;
3. delta final;
4. reconciliación IDs/referencias/conteos/hashes;
5. reglas + consumers;
6. smoke tests;
7. reapertura.

Dual-read es fallback de lectura, no captura de cambios. Dual-write/CDC queda
como alternativa futura.

### Modificar

Paneles académicos y páginas de curso/tema/misión, dominio por dominio.

### Pruebas

Integridad pedagógica, publicaciones, rutas lazy, referencias, restauración y
aislamiento.

### Aceptación y gate

Reconciliación 100 % o excepciones aprobadas; lectura nueva activa y legacy
intacto.

### Riesgo y rollback

Pérdida/duplicación. Revertir consumidores/rules y reabrir legacy; no borrar
origen.

## 09 — Progreso, tests e inscripciones

### Objetivo

Migrar estado académico a enrollment después de mappings de contenido.

### Modificar

`progressService.js`, `topicProgressService.js`,
`topicMissionAttemptService.js`, Test, Home, Profile y MissionChatPage.

### Dependencias

08B reconciliada y enrollments de 05.

### Migración

Por dominio con mantenimiento:

- progreso de lecciones;
- `userTests`, testHistory y niveles;
- topicProgress;
- mission attempts;
- XP/timestamps/completed flags.

Definir fuente canónica y reconciliar duplicados antes de copiar.

### Pruebas

Nivel por idioma, XP idempotente, reintentos, históricos, múltiples tenants,
enrollment suspendido y concurrencia.

### Aceptación y gate

Conteos, XP, tests e historiales reconciliados; dashboard usa enrollment.

### Riesgo y rollback

Mayor riesgo de regresión. Mantener legacy read-only y revertir consumers.

## 10A — Onboarding de estudiantes

### Objetivo

País → tenant → oferta → locale → identidad → verificación → solicitud →
aprobación → enrollment.

### Dependencias

03B, 06, 07 y 09.

### Modificar

Welcome, Register, Login, rutas y servicios de onboarding.

### Pruebas/aceptación

Políticas de acceso, email existente sin enumeración, estados y tenant aislado.
Ningún rol privilegiado es seleccionable.

### Rollback

Pausar nuevas solicitudes mediante feature flag.

## 10B — Invitaciones y aprobaciones

### Objetivo

Activar teacher/tenant_admin por invitación y cola de estudiantes.

### Dependencias

03B, 06 y 07. Puede avanzar en paralelo con 10A tras contratos compartidos.

### Modificar

Auth UI, acceptance pages y administración de memberships.

### Pruebas/aceptación

Identidad existente/nueva, TTL, revocación, replay, cambio email, concurrencia y
auditoría.

### Rollback

Revocar invitaciones pendientes y desactivar emisión; memberships existentes
permanecen.

## 10C — Panel docente

### Objetivo

Permitir operaciones pedagógicas por capacidad y curso seleccionado.

### Dependencias

08B, 09, 10B y i18n.

### Modificar

Navegación, paneles académicos, revisiones y reportes.

### Pruebas/aceptación

Teacher sin enrollment, cursos asignados, ownership tenant y ausencia de
privilegios administrativos.

### Rollback

Desactivar feature; contenido permanece tenant-owned.

## 10D — Panel tenant_admin

### Objetivo

Gestionar memberships, políticas, cursos y branding del tenant activo.

### Dependencias

10B y repositorios académicos. Puede avanzar en paralelo con 10C.

### Pruebas/aceptación

Sin enrollment, sin acceso a otro tenant, sin `platform_admin`, auditoría y
límites de configuración.

### Rollback

Desactivar panel; backend y datos permanecen.

## 11A — Foro y soporte

### Objetivo

Separar foro institucional/curso de soporte global de plataforma.

### Clasificación

- tenant: foro, reportes institucionales y soporte académico contextual;
- global: contacto comercial, mensajes públicos pre-registro y soporte general
  MiPyMeTIC.

### Dependencias

06, 08B y clasificación de datos.

### Pruebas/cutover

Mantenimiento por dominio, aislamiento, moderación, retención y datos públicos.

### Aceptación

Ningún foro tenant es global; datos de plataforma no se asignan artificialmente
a un tenant.

## 11B — Storage y presentaciones

### Objetivo

Migrar documentos y blobs sin redirects transparentes.

### Estrategia

- conservar blobs legacy;
- persistir `legacyStoragePath`;
- leer ruta nueva y fallback legacy controlado;
- verificar referencias/documentos/blobs;
- eliminar legacy sólo en fase 12 tras aprobación.

### Dependencias

02, 08B y membership estable.

### Pruebas/cutover

Rules Storage, cargas/descargas, referencias rotas, hashes y mantenimiento.

### Aceptación

100 % de referencias resueltas y tenant aislado.

## 11C — Gateway IA, cuotas y observabilidad

### Objetivo

Proteger claves y atribuir consumo por tenant/curso/operación.

### Dependencias

03B, 08B y contrato lingüístico.

### Modificar

`services/ai/*`, consumidores y configuración backend, preservando GeminiAudit.

### Pruebas/aceptación

Cuotas, errores, privacidad, idioma del curso, aislamiento y ausencia de clave
en cliente productivo.

### Rollback

Feature flag/fallback controlado; no mezclar con rollback Storage.

## 12 — Contract, limpieza y retirada legacy

### Objetivo

Retirar compatibilidad sólo después de observación y aprobación.

### Modificar/eliminar

- `organizationId`, statuses legacy y rol `admin/user`;
- `isActive` de membership si se conservó temporalmente;
- `DEFAULT_ADMINS`;
- rutas/consumers legacy;
- métodos equivalentes de `firestoreService.js`;
- blobs legacy aprobados;
- CSS confirmado no cargado;
- documentación y README.

### Dependencias

Todas las reconciliaciones completas. Bootstrap verificado antes de retirar
`DEFAULT_ADMINS`.

### Pruebas

Búsqueda legacy, rules, build, lint, integración, restauración, visual CSS y
auditoría de datos.

### Aceptación y gate

Cero autorización/rutas legacy, cero referencias rotas, documentación igual a
producción.

### Riesgo y rollback

Consumidor oculto. Release anterior y backups; no destruir datos nuevos.

## SaaS-02C — Security Rules

`02C.1` completa el diseño normativo de Firestore Security Rules sin modificar
Firebase: deny-by-default, helpers, presupuesto, 10 paths, 45 Query Contracts,
19 transiciones, dos client writes Identity y backend-only completo.

```text
Mandatory Firebase Security Review Gate = APPROVED
SaaS-02C.1 = completed
SaaS-02C.2 = next, not started
Storage Rules Design Gate = Not ready
```

SaaS-02C.2 no ha comenzado. Storage conserva postura deny-all.

### SaaS-02C.1A / SaaS-02C.1B — Legacy Rules reconciliation

```text
SaaS-02C.1 = completed
SaaS-02C.1A = completed
SaaS-02C.1B = completed

SaaS-02C.2A = next, not started (status at SaaS-02C.1B closure)

Storage architecture = not used in current SaaS target
Storage posture = deny-all
```

SaaS-02C.2 must begin in shadow deny-by-default mode. Legacy Rules must not be
removed until their consumers are migrated. The owner-provided legacy Rules are
a compatibility reference, not the SaaS authorization source.

### SaaS-02C.2A — Composite baseline and SaaS shadow deny-by-default

```text
SaaS-02C.2A = completed
SaaS-02C.2B = completed
SaaS-02C.2C = completed
SaaS-02C.2D = completed
SaaS-02C.2E = completed
SaaS-02C.2E-A = completed
SaaS-02C.2E-B = completed
SaaS-02C.2F = completed
SaaS-02C.2G = completed
SaaS-02C.2G-A = completed
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B1.1 = completed
SaaS-02C.2G-B1.2 = completed
SaaS-02C.2G-B1.2A = completed
SaaS-02C.2G-B1.3 = completed
SaaS-02C.2G-B1.4 = completed
SaaS-02C.2G-B1.5 = completed
SaaS-02C.2G-B1.6 = completed
SaaS-02C.2G-B1.7 = completed
SaaS-02C.2G-B2 = completed
SaaS-02C.2G-B2.1 = completed
SaaS-02C.2G-B2.1A = completed
SaaS-02C.2G-B2.1B = completed
SaaS-02C.2G-B2.2 = completed
SaaS-02C.2G-B2.3 = completed
SaaS-02C.2G-B2.3A = completed
SaaS-02C.2G-B2.3B = not required
SaaS-02C.2G-B2.4 = completed
SaaS-02C.2G-B2.4A = completed
SaaS-02C.2G-B2.4B = completed
SaaS-02C.2G-B2.4C = completed
SaaS-02C.2G-B2.5 = completed
SaaS-02C.2G-B3 = superseded_by_final_B2_scope
SaaS-02C.2G-C = superseded_by_final_B2_scope

SaaS-02C.2E-A resolved FRD-006 and FRD-007; SaaS-02C.2E-B implemented and
closed both findings locally. Mandatory human review of implemented Course and
Enrollment Rules is required before SaaS-02C.2F. No deployment was performed.
```

SaaS-02C.2F confirmed exact legacy semantic preservation, isolation between
legacy and SaaS helpers, safe match overlap, and that no legacy block is ready
for removal. Mandatory human review of legacy/SaaS compatibility is required
before any selective legacy hardening in SaaS-02C.2G.

SaaS-02C.2G-B1 is closed documentally and locally after the human joint review
of B1.6 and the B1.7 baseline comparison. B2.1 reconstructed the current
consumer contracts but found that Welcome accepts a one-character name while
the messages Rule requires at least two characters. B2.1 therefore requires a
separately authorized contract-reconciliation phase and B2.2 is blocked. No
Rule, consumer or test was changed.

SaaS-02C.2G-B2.1A applied the approved minimal consumer correction: Welcome
now validates its trimmed name at 2–100 characters before writing the unchanged
messages payload. Rules and the orphaned public-message service writer remain
unchanged. Mandatory human review of the Welcome component change is required
before SaaS-02C.2G-B2.1B. B2.2 remains blocked pending B2.1 closure.

SaaS-02C.2G will address selective hardening of legacy public and
client-writable blocks without breaking current consumers. No legacy
permission may be changed before human approval of the exact
`SAFE_TO_HARDEN_NOW` proposals documented by SaaS-02C.2G-A.

SaaS-02C.2G-B1.1 implemented only the approved `messages` create hardening.
Mandatory human review of messages create hardening is required before
SaaS-02C.2G-B1.2. No other hardening proposal is authorized by this status.

SaaS-02C.2G-B1.2 implemented only the approved forum post create hardening.
SaaS-02C.2G-B1.2A forensically confirmed that only posts create changed and
that the previously divergent final-response hash was a transcription error.
Mandatory human forensic review of B1.2A is required before SaaS-02C.2G-B1.3.
Replies, reports, support, social counters, updates and deletes remain outside
this authorization.

SaaS-02C.2G-B1.3 implemented only the approved forum reply create hardening.
Mandatory human review of forum reply create hardening is required before
SaaS-02C.2G-B1.4. Reports, support, social counters, updates, deletes and forum
migration remain outside this authorization.

SaaS-02C.2G-B1.4 implemented only the approved `forumReports` create
hardening. Mandatory human review of forumReports create hardening is required
before SaaS-02C.2G-B1.5. Support, administrative permissions, social counters,
updates, deletes and forum migration remain outside this authorization.

At B1.5 closure, SaaS-02C.2G-B1.5 had implemented only the approved
`supportTickets` create hardening, and B1.6 had not started. B1.6 was designated
to jointly revalidate messages, forum posts, forum replies, forumReports and
supportTickets.

SaaS-02C.2G-B1.6 jointly revalidated all five hardenings, consumer payloads,
userTests restoration, legacy/SaaS isolation, matches, helpers, catch-all and
Storage posture. Mandatory human joint review is required before
SaaS-02C.2G-B2. B2 has not started.

SaaS-02C.2G-B2.1B revalidated the Welcome/messages contract, the compatible
orphaned writer, the absence of new messages writers and the other four B1
consumer contracts. B2.1 is completed and B2.2 is ready for test design but
was not started. Mandatory human approval of the B2.1 closure is required
before SaaS-02C.2G-B2.2.

SaaS-02C.2G-B2.2 designed the 201-case executable Firestore Rules suite for
the five B1 hardenings without creating or running test files. Mandatory human
review of the executable test design is required before SaaS-02C.2G-B2.3.
Runtime execution in SaaS-02C.2G-B2.4 requires a separate owner decision
because Java installation and Emulator Suite execution are not authorized.

SaaS-02C.2G-B2.3 statically materialized all 201 unique IDs, but validation
found that the explicit B2.2 expectations total 82 ALLOW / 119 DENY because
RT-SAS contains 7/3 while its summary states 6/4. B2.4 remains blocked. A
separately authorized design correction must reconcile the expected-result
contract; no case expectation was changed silently.

SaaS-02C.2G-B2.3A forensically confirmed Alternative A: the detailed matrix
and static suite consistently contain 201 cases, 82 ALLOW and 119 DENY. The
previous 81/120 aggregate was an arithmetic documentation error. No test file
or expectation changed; B2.3B is not required and B2.4 remains blocked pending
a separate owner runtime decision.

SaaS-02C.2G-B2.4A determined that demo-only Firestore runtime validation is
feasible on an isolated hosted runner without local Java, Firebase login,
credentials, secrets, real-project access or deployment. The current command
also discovers the separate Storage baseline; B2.4B must create a
Firestore-only canonical execution boundary before creating the workflow.
Human approval is required before creating a GitHub Actions workflow. The
future workflow must use only the demo Firebase project, must not use secrets,
must not log in to Firebase and must not deploy any resource.

SaaS-02C.2G-B2.4B statically implemented the manual GitHub Actions workflow,
the exact seven-file Firestore-only package command and a zero-credential
security preflight. The workflow must not be executed until the owner has
reviewed the YAML, package scripts and CI preflight. Codex must not commit,
push or trigger the workflow. The owner will decide when to commit, push and
manually execute `workflow_dispatch`.

SaaS-02C.2G-B2.4C-A audited the workflow, package boundary, preflight,
canonical tests and complete worktree. Technical controls passed, but ignored
local files `.env.local` and `firebase-debug.log` trigger the explicit
sensitive-file gate. Their contents were not inspected. The phase is
`incomplete_requires_sensitive_file_owner_review`; B2.4C-B is blocked and
B2.5 is not started. Codex did not commit, push or execute the workflow.

SaaS-02C.2G-B2.4C-A1 reconciled the two local artifacts through metadata only.
They are ignored, untracked, unstaged, absent from diffs and unused by CI; no
sensitive filename is Git-visible. Their contents were not inspected.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = in_progress
SaaS-02C.2G-B2.4A = completed
SaaS-02C.2G-B2.4B = completed
SaaS-02C.2G-B2.4C-A = completed
SaaS-02C.2G-B2.4C-A1 = completed_pending_human_precommit_closure
SaaS-02C.2G-B2.4C-B = blocked_pending_manual_commit_push_and_workflow
SaaS-02C.2G-B2.5 = not started
```

Local ignored files do not form part of the commit. Codex must not inspect
their contents, stage them, delete them, commit, push or execute the workflow.
The owner must approve the final commit procedure.

SaaS-02C.2G-B2.4C-B1 created only the explicitly authorized local thematic
commits. Codex did not push any branch and did not execute the workflow.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = in_progress
SaaS-02C.2G-B2.4C-A = completed
SaaS-02C.2G-B2.4C-A1 = completed
SaaS-02C.2G-B2.4C-B1 = completed_pending_human_push
SaaS-02C.2G-B2.4C-B2 = blocked_pending_manual_push_and_workflow
SaaS-02C.2G-B2.5 = not started
```

The owner must review the commits, push the selected branch manually and
trigger `workflow_dispatch`.

SaaS-02C.2G-B2.4C-B2 received an owner statement that push and manual dispatch
occurred, but no completed workflow evidence. Codex only audited the supplied
placeholders and did not repeat or query the run.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_runtime_evidence_missing
SaaS-02C.2G-B2.4C-B1 = completed
SaaS-02C.2G-B2.4C-B2 = incomplete_requires_runtime_evidence
SaaS-02C.2G-B2.5 = blocked
```

No Firebase deployment was performed. B2.5 must not start until complete,
non-sensitive runtime evidence is supplied and reviewed.

SaaS-02C.2G-B2.4C-B2F1 classified the first runtime as
`TEST_HARNESS_CONFIGURATION_FAILURE`: Firestore started, but the shared test
environment also requested Storage, causing 201 setup failures before Rule
assertions. The helper now configures only Firestore; Storage remains deny-all
and unstarted.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_corrected_runtime_execution
SaaS-02C.2G-B2.4C-B2 = incomplete_test_harness_failure
SaaS-02C.2G-B2.4C-B2F1 = completed_pending_human_fix_review
SaaS-02C.2G-B2.5 = blocked
```

No corrected GitHub Actions execution was started. Human fix review is
required before any new runtime attempt.

SaaS-02C.2G-B2.4C-B2F2 committed the approved Firestore-only harness
correction locally as `ada8931` and recorded the failed-run evidence and
traceability. Codex did not push or execute GitHub Actions.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_corrected_runtime_execution
SaaS-02C.2G-B2.4C-B2 = incomplete_pending_corrected_runtime
SaaS-02C.2G-B2.4C-B2F1 = completed
SaaS-02C.2G-B2.4C-B2F2 = completed_pending_human_push
SaaS-02C.2G-B2.5 = blocked
```

The owner must review and push the corrective commits, then manually trigger
the Firestore Rules Runtime Validation workflow on `main`.

SaaS-02C.2G-B2.4C-B2F4 corrects the sole non-Rule failure from the second
runtime: RT-SEC-003 used an invalid three-segment document path. The second
run passed 200 cases; the remaining assertion did not execute. No Rule or
expectation changed.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_final_corrected_runtime
SaaS-02C.2G-B2.4C-B2 = incomplete_single_test_fixture_failure
SaaS-02C.2G-B2.4C-B2F3 = incomplete_200_passed_1_fixture_failed
SaaS-02C.2G-B2.4C-B2F4 = completed_pending_human_fix_review
SaaS-02C.2G-B2.5 = blocked
```

Human review and one final owner-triggered runtime execution are required.
B2.5 was not started.

SaaS-02C.2G-B2.4C-B2F5 records the isolated local correction commit
`3c34e9e7960108bf6f9275e009a202b56171e095`. Codex did not push or execute
GitHub Actions.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.4 = incomplete_pending_final_corrected_runtime
SaaS-02C.2G-B2.4C-B2 = incomplete_pending_final_runtime
SaaS-02C.2G-B2.4C-B2F3 = incomplete_200_passed_1_fixture_failed
SaaS-02C.2G-B2.4C-B2F4 = completed
SaaS-02C.2G-B2.4C-B2F5 = completed_pending_human_push
SaaS-02C.2G-B2.5 = blocked
```

The owner must push the new HEAD and start a new manual workflow instance on
`main`; do not rerun the failed job on the earlier commit. B2.5 remains
blocked.

The local composite baseline preserves the owner-provided legacy compatibility
semantics and reserves all ten canonical SaaS paths with complete client deny.
SaaS-02C.2 is not complete. No deployment was performed.

## SaaS-02C.2G final closure

The owner confirmed that the official manually triggered Firestore Rules
Runtime Validation workflow succeeded on the latest `main` HEAD. Firestore
Emulator runtime passed the canonical 201 Test IDs: 82 expected ALLOW and 119
expected DENY. No deployment or later change occurred.

```text
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B2 = completed
SaaS-02C.2G-B2.1 = completed
SaaS-02C.2G-B2.2 = completed
SaaS-02C.2G-B2.3 = completed
SaaS-02C.2G-B2.4 = completed
SaaS-02C.2G-B2.5 = completed
SaaS-02C.2G = completed
```

The final reconciliation, deferred FLH backlog and residual risks are recorded
in `FIRESTORE_RULES_PROJECT_FINAL_CLOSURE.md`. Domain 1.2.0 and the architecture
freeze remain intact; Storage remains deny-all.

## SaaS-02C.2H no-Storage gate reconciliation

The owner approved the current release as Firestore-only. Historical generic
Phase 02 Storage requirements are
`superseded_for_current_no_storage_release`; Storage is not a prerequisite for
03A. Binary uploads, Media roots, Storage repositories, paths, Rules and
emulator execution remain excluded, and `storage.rules` remains deny-all.

```text
CURRENT_SAAS_STORAGE_POLICY = NO_STORAGE
SaaS-02C.2G = completed
SaaS-02C.2H = completed
SaaS-02C.2H-C1 = completed_pending_human_push
Phase 02 current no-storage scope = completed
03A — Repositorios tenant-aware = ready_not_started
04 — Providers en shadow mode = blocked_by_03A
06 — Activación progresiva de guardas = blocked_by_previous_phases
```

The exact 03A scope is documented in
`SAAS_03A_TENANT_AWARE_REPOSITORIES_SCOPE.md`. No repository or functional code
was created and 03A was not started.

The first implementation step is deliberately split by responsibility:

```text
SaaS-03A = in_progress
SaaS-03A.1A — Shared SaaS Firestore repository infrastructure = completed
SaaS-03A.1A-C1 — Human review and controlled commits = completed_pending_human_push
SaaS-03A.1B — IdentityRepository = ready_not_started
```

`SaaS-03A.1A` may create only shared Firestore dependency, path/ID guard,
timestamp serialization and repository error primitives with their scoped
tests. It does not create a concrete repository. `SaaS-03A.1B` subsequently
implements only `IdentityRepository`. Neither microphase is started here.

SaaS-03A.1A subsequently implemented only pure shared infrastructure under
`src/services/saas/shared/`: validated opaque IDs, ten canonical path strings,
exact tenant consistency, ISO timestamp conversion, snapshot allowlisting,
normalized repository errors and explicit Firestore dependency injection. Its
51 unit tests require no Emulator and no global Firebase instance. See
`SAAS_03A_1A_SHARED_REPOSITORY_INFRASTRUCTURE.md`.

The C1 review strengthened compound sensitive-key filtering without changing
the public contract or test count. SaaS-03A.1B is ready but remains unstarted.

SaaS-03A.1B subsequently implemented only `IdentityRepository` for the global
`identities/{uid}` root. Its exact serializer, dependency-injected read and two
Rule-approved field-scoped update operations are documented in
`SAAS_03A_1B_IDENTITY_REPOSITORY.md`. No UI, legacy service, Rule, index,
Storage resource or remote Firebase resource was changed.

```text
SaaS-03A = in_progress
SaaS-03A.1B = completed
SaaS-03A.1B-C1 = completed_pending_human_push
SaaS-03A.2 — TenantRepository = ready_not_started
```

SaaS-03A.2 was identified but not started.

SaaS-03A.2A subsequently implemented only the client-safe Tenant shell point
read at `tenants/{tenantId}`. The repository exposes no lists, writes,
privileged operations or configuration access. Its strict physical serializer
and 31 pure unit tests are documented in
`SAAS_03A_2A_TENANT_SHELL_REPOSITORY.md`.

```text
SaaS-03A = in_progress
SaaS-03A.2 = in_progress
SaaS-03A.2A = completed
SaaS-03A.2A-C1 = completed_pending_human_push
SaaS-03A.2B = deferred_pending_rules_and_access_policy
SaaS-03A.3 — RegistrationRequestRepository = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 — RegistrationRequest query, pagination, cursor and index contract resolution = completed
SaaS-03A.3A-R1-C1 = completed_pending_human_push
SaaS-03A.3A-R2 — RegistrationRequestRepository shadow implementation = ready_not_started
SaaS-03A.3I — RegistrationRequest index materialization = pending_after_R2
SaaS-03A.3R — RegistrationRequest Firestore Emulator validation = pending_after_index_materialization
```

Settings and Branding remain deferred because current client Rules deny their
fixed documents. SaaS-03A.3 was identified but not started.

SaaS-03A.3A-R2 subsequently implemented the three approved client-safe
RegistrationRequest reads in expand/shadow mode. Exact lifecycle serialization,
UID-bound queries, deterministic pagination and cursor v1 are backed by 59 pure
unit tests.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3A = incomplete_superseded_by_resolution
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R2 = completed_pending_human_code_review
SaaS-03A.3I = blocked_pending_R2_review
SaaS-03A.3R = blocked_by_indexes
```

SaaS-03A.3I locally materialized FI-RRQ-001/002 and FI-CG-003/004 without
deploying them. Human index review and a controlled commit must complete before
the Firestore-only runtime phase.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3I = completed_pending_human_index_review
SaaS-03A.3R = blocked_pending_3I_review_and_commit
```

The 03A.3I-C1 review confirmed the local index file against installed Firebase
tooling and created isolated technical/documentary commits.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3I = completed
SaaS-03A.3I-C1 = completed_pending_human_push
SaaS-03A.3R = ready_not_started
```

The repository remains shadow-only. Human review, local index materialization
and Firestore-only Emulator validation must precede functional integration.

The R2-C1 review completed with two scoped fail-closed corrections and expanded
unit coverage. Index materialization is now the next ready, unstarted phase.

```text
SaaS-03A.3A-R2 = completed
SaaS-03A.3A-R2-C1 = completed_pending_human_push
SaaS-03A.3I = ready_not_started
SaaS-03A.3R = blocked_by_indexes
```

### SaaS-03A.3R-A — RegistrationRequest runtime suite

The Firestore-only integration suite is implemented with 52 isolated cases and
the fixed demo project. It remains unexecuted until human review; the canonical
201 Rules IDs remain a separate runtime suite and count.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed_pending_human_test_review
SaaS-03A.3R-B = blocked_pending_3R_A_review
```

Next: `SaaS-03A.3R-A-C1 — RegistrationRequest runtime suite review and
controlled commits`. 03A.3R-B remains blocked and no MembershipRepository work
starts here.

The controlled C1 review completed the static audit and isolated commits. The
next phase may integrate and execute the runtime suite, but is not started here.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-A = completed
SaaS-03A.3R-A-C1 = completed_pending_human_push
SaaS-03A.3R-B = ready_not_started
```

### SaaS-03A.3R-B1 — RegistrationRequest runtime CI integration

The existing manual workflow now contains a deterministic RegistrationRequest
precheck and a second, independent Firestore-only runtime session after the
unchanged canonical Rules runtime. No workflow run occurred in B1.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_manual_push_and_workflow
```

Next owner actions are push and a new manual `workflow_dispatch` on `main`.
MembershipRepository remains unstarted.

### SaaS-03A.3R-B1-FIX1 corrective closure

FIX1 resolved the nine failures from the first RegistrationRequest repository
runtime without changing Rules, indexes, Domain, Storage, or repository scope.
The corrected local gate passes all 52 cases. Hosted CI evidence is still
required before B2 can close the runtime sequence.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3R = in_progress
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.3R-B2 = blocked_pending_corrected_runtime_evidence
```

Do not start MembershipRepository before the corrected hosted runtime is
reviewed.

### SaaS-03A.3R-B2 corrected runtime closure

The owner confirmed a new corrected `main` workflow succeeded with Rules
`201 / 201` and RegistrationRequest `52 / 52`. All nine former failures pass.
No Rule, index, Storage, repository, test, workflow, package, or Domain file
changed in B2.

```text
SaaS-03A = in_progress
SaaS-03A.3 = completed
SaaS-03A.3A-R1 = completed
SaaS-03A.3A-R2 = completed
SaaS-03A.3I = completed
SaaS-03A.3R = completed
SaaS-03A.3R-A = completed
SaaS-03A.3R-B1 = completed
SaaS-03A.3R-B1-FIX1 = completed
SaaS-03A.3R-B2 = completed
SaaS-03A.3R-B2-C1 = completed_pending_human_push
RegistrationRequestRepository = completed_in_shadow_mode
SaaS-03A.4 = ready_not_started
```

Next: SaaS-03A.4 — MembershipRepository. It is not started here.

### SaaS-03A.4A — MembershipRepository contract and query audit

The audit confirms the canonical Membership root, 12-field physical projection,
three statuses, three tenant roles, owner history reads, client-denied keys and
writes, and collection-group self Rules. It also identifies blockers that make
repository implementation premature: tenant-self and history query shapes are
not closed, Standard pagination has no Membership numeric policy, no
Membership-specific cursor exists, index variants/materialization are pending,
and current Rules deny the documented tenant-admin read contracts.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_pending_contract_resolution
SaaS-03A.4A-R1 = required_not_started
SaaS-03A.4B = blocked
MembershipRepository = not_created
```

Next: `SaaS-03A.4A-R1 — Membership query, pagination, cursor, admin-policy and
index contract resolution`. Do not create MembershipRepository before that
contract review is complete.

### SaaS-03A.4A-R1 — Membership query, pagination, cursor and index resolution

R1 freezes the three client-self APIs and explicitly excludes all admin,
platform, key, lifecycle, and write operations. Both list scopes support the
four omitted/single-status/single-role/status-plus-role combinations, order by
`createdAt DESC` and document ID DESC, use page sizes 1/20/50 with lookahead,
and share a query-bound Membership Standard v1 cursor. Four COLLECTION and four
COLLECTION_GROUP indexes are specified for later 03A.4I materialization.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A = incomplete_superseded_by_resolution
SaaS-03A.4A-R1 = completed_pending_human_contract_review
SaaS-03A.4B = ready_not_started
MembershipRepository = not_created
```

Next: R1 human contract review. Do not implement 03A.4B before that review.

### SaaS-03A.4B — MembershipRepository implementation

After R1 approval, the client-self repository is implemented in shadow mode
with the three frozen APIs, strict serializer, closed options, deterministic
pagination, and portable Membership v1 cursor. Admin, platform, key, write,
lifecycle, consumer, migration, and deployment surfaces remain absent. Eight
Membership indexes are still pending later local materialization.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
MembershipRepository = implemented_shadow
SaaS-03A.4B-C1 = completed_pending_human_push
SaaS-03A.4I = ready_not_started
```

C1 confirms the contract and corrects one fail-closed tenant result-path check;
23 focused unit tests pass. Next: `SaaS-03A.4I — Membership index
materialization`. It remains unstarted and no index JSON changes here.

### SaaS-03A.4I — Membership index materialization

Eight R1 indexes are materialized in local configuration: FI-MEM-005–008 and
FI-CG-001/002/006/007. The four RegistrationRequest indexes remain unchanged,
`fieldOverrides` remains empty, and no deployment or runtime execution occurs.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
MembershipRepository = implemented_shadow
```

Next: 03A.4R-A Membership repository runtime test suite. It is ready but not
started here; no workflow change or runtime execution occurs in C1.

### SaaS-03A.4R-A — Membership repository runtime test suite

The Firestore-only suite is prepared with 81 statically reconciled cases: 44
ALLOW and 37 DENY, classified as 44 SUCCESS, 26 RULES_DENY, 11 CONTRACT_ERROR,
and 0 NOT_FOUND. It uses the demo project, real modular SDK and repository,
isolated fixtures, and all eight Membership query shapes. No Emulator or CI
change occurs in this phase.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed_pending_human_push
SaaS-03A.4R-B = ready_not_started
MembershipRepository = implemented_shadow
```

Next: `SaaS-03A.4R-B1 — Membership runtime CI integration`; it remains
unstarted.

## SaaS-03A.4R-B1 CI integration result

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-A = completed
SaaS-03A.4R-A-C1 = completed
SaaS-03A.4R-B = in_progress
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-C1 = completed_pending_human_push
SaaS-03A.4R-B2 = blocked_pending_manual_push_and_workflow
MembershipRepository = implemented_shadow
```

Next: `SaaS-03A.4R-B2 — Membership runtime execution and closure`. It was not
started; owner push and a new manual workflow execution are required first.

## SaaS-03A.4R-B1-FIX1

The first Membership runtime reported 65/81 passed and 16 fixture-contamination
failures. FIX1 assigns the incompatible serializer fixture to a dedicated UID
and updates only RT-MEM-REP-012 to read it as self. Counts remain 81/44/37 and
44/26/11/0. Static correction and controlled review are complete; corrected
runtime remains pending GitHub Actions because Java is unavailable locally.
`SaaS-03A.4R-B1-FIX1 = completed`,
`SaaS-03A.4R-B1-FIX1-C1 = completed_pending_human_push`, and
`SaaS-03A.4R-B2 = blocked_pending_corrected_runtime_evidence`.

## SaaS-03A.4 final runtime closure

The owner published FIX1 and confirmed a new successful manual workflow on
corrected `main`: Rules 201/201, RegistrationRequest 52/52, and Membership
81/81. All sixteen historical fixture-contamination IDs pass. Membership is
complete in shadow mode; indexes remain undeployed and no functional consumer
or migration is activated.

```text
SaaS-03A = in_progress
SaaS-03A.4 = completed
SaaS-03A.4R = completed
SaaS-03A.4R-B = completed
SaaS-03A.4R-B1 = completed
SaaS-03A.4R-B1-FIX1 = completed
SaaS-03A.4R-B1-FIX1-C1 = completed
SaaS-03A.4R-B2 = completed
MembershipRepository = completed_in_shadow_mode
SaaS-03A.5A = ready_not_started
```

Next: `SaaS-03A.5A — CourseRepository contract and query audit`. It will audit
the physical model, Rules-compatible client reads, query/pagination/cursor
contracts, and conceptual indexes before implementation. It is not started.

## SaaS-03A.5A CourseRepository audit result

The audit confirms the tenant Course path, exact physical shape, lifecycle,
current role/status read policy, FQ-CRS-001..007 and conceptual
FI-CRS-001..005. It also confirms no Course collection-group, client write,
consumer, migration or legacy replacement. The generic query model does not
freeze Course numeric page sizes, a Course-specific cursor envelope, or the
minimum final list API/index variants, so implementation remains blocked.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_pending_contract_resolution
SaaS-03A.5A-R1 = required_not_started
SaaS-03A.5B = blocked
CourseRepository = not_created
```

Next: `SaaS-03A.5A-R1 — Course query, pagination, cursor and index contract
resolution`. No implementation, index materialization or runtime work starts.

## SaaS-03A.5A-R1 Course contract resolution

The resolution defines the minimal read-only API, distinct actor query shapes,
closed options, deterministic 1/20/50 pagination, Course cursor v1, exact nested
serialization and the five later Course indexes. No Rule, index JSON, code,
consumer or legacy service changes in R1.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed_pending_human_contract_review
SaaS-03A.5B = ready_not_started
CourseRepository = not_created
```

Next: human review of R1 followed by `SaaS-03A.5B — CourseRepository
implementation`. 5B is not started here.

## SaaS-03A.5B CourseRepository implementation

CourseRepository is implemented in shadow mode with the exact R1 point/list
surface, deep serializer, actor-shaped query contracts, closed pagination and
Course cursor v1. Forty-two focused tests cover positive and negative contracts.
No index, Rule, consumer, legacy service, migration or remote resource changes.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed_pending_human_code_review
CourseRepository = implemented_shadow
SaaS-03A.5B-C1 = next_not_started
```

Next: `SaaS-03A.5B-C1 — CourseRepository implementation review and controlled
commits`. It is not started here.

## SaaS-03A.5B-C1 CourseRepository review and controlled commits

The implementation and its focused coverage were reconciled with 5A/R1 and
current Rules. Course remains consumer-free shadow code; no index was
materialized and no runtime phase was started.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A = incomplete_superseded_by_resolution
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
SaaS-03A.5B-C1 = completed_pending_human_push
CourseRepository = implemented_shadow
SaaS-03A.5I = ready_not_started
```

Next: `SaaS-03A.5I — Course index materialization`. It remains not started.
