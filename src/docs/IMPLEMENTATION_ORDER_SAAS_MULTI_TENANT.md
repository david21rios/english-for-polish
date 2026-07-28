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

### Crear

```text
src/config/productConfig.js
src/config/localeConfig.js
src/config/cefrConfig.js
src/config/routeConfig.js
src/config/featureFlags.js
src/domain/tenants/tenantModel.js
src/domain/memberships/membershipModel.js
src/domain/courses/courseModel.js
src/domain/enrollments/enrollmentModel.js
src/domain/access/accessState.js
src/domain/auth/capabilities.js
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
storage.rules
firestore.indexes.json
tests/rules/firestore.*
tests/rules/storage.*
```

### Dependencias

01A y 01B completas.

### Modelo/reglas

- identidad propia;
- membership por tenant;
- capacidades;
- course/enrollment;
- Storage tenant-aware;
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
- Storage;
- campos protegidos;
- consultas previstas e índices.

### Aceptación y gate

Suite de reglas verde en emulador y revisión de seguridad. No conectar UI antes.

### Riesgo y rollback

Divergencia con producción. Despliegue sólo tras plan de compatibilidad; rollback
al ruleset baseline versionado.

## 03A — Repositorios tenant-aware

### Objetivo

Añadir persistencia en modo expand sin retirar servicios legacy.

### Crear

```text
src/services/tenants/tenantRepository.js
src/services/memberships/membershipRepository.js
src/services/invitations/invitationRepository.js
src/services/courses/tenantCourseRepository.js
src/services/enrollments/enrollmentRepository.js
src/services/audit/auditRepository.js
```

### Modificar

- extraer por dominio desde `firestoreService.js`;
- conservar adaptadores legacy con nombre explícito.

### Dependencias

Fase 02.

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
