# Auditoría arquitectónica SaaS multi-tenant

**Producto:** MiPyMeTIC Intelligent Platform for Language Learning
**Estado:** decisiones aprobadas; implementación pendiente
**Fase:** SaaS-00 — consolidación arquitectónica
**Documento base:** `AUDITORIA_PREPARACION_PILOTO_UNIVERSITARIO_v1.0.md`

## 1. Propósito y alcance

Este documento consolida la auditoría del repositorio React/Firebase y convierte
las decisiones aprobadas para la evolución SaaS en restricciones
arquitectónicas. No describe una familia de aplicaciones por idioma. Describe
una sola plataforma, una sola versión operativa y múltiples espacios de trabajo
aislados.

En este documento:

- `tenantId` es la frontera técnica organizacional;
- `tenant` puede representar universidad, instituto, academia, colegio, empresa
  u otra organización educativa;
- `interfaceLocale` controla exclusivamente la interfaz;
- `learningLanguageCode` y `supportLanguageCode` pertenecen al curso;
- una identidad Firebase puede tener varias membresías independientes;
- todo contenido académico pertenece al tenant que lo crea;
- no existe contenido académico global compartido entre tenants;
- los niveles CEFR son referencias técnicas globales sin contenido académico.

### Precedencia documental

La auditoría de preparación del piloto continúa siendo evidencia del estado
histórico y funcional del repositorio. Cuando sus recomendaciones futuras
utilicen `institutionId`, `admin/user`, una sola institución o contenido
académico global, quedan sustituidas por las decisiones aceptadas de este
documento y sus ADR. No se modifica el documento v1.0 para no reescribir el
registro histórico de aquella fase.

## 2. Estado actual confirmado

### 2.1 Aplicación y providers

`src/main.jsx` monta `StrictMode`, un límite de errores y `BrowserRouter`.
`src/App.jsx` centraliza rutas públicas, privadas y administrativas. No existen
providers transversales de sesión de aplicación, tenant activo, membresía,
curso activo, inscripción, internacionalización o branding.

`PrivateRoute.jsx` valida autenticación y correo. `AdminRoute.jsx` consulta
`users/{uid}.role === "admin"`. Ninguna guarda valida tenant, membresía,
`isActive`, aprobación, inscripción o suspensión del tenant.

### 2.2 Identidad y autorización

La identidad se guarda en `users/{uid}`. El perfil actual incluye `role`,
`isActive`, `emailVerified`, `accountType`, `organizationId` y
`organizationMembershipStatus`. Los únicos roles admitidos por el servicio son
`user` y `admin`.

El registro público fuerza:

```js
accountType: "independent"
organizationId: null
organizationMembershipStatus: "not_applicable"
```

Los correos incluidos en `DEFAULT_ADMINS` reciben el rol `admin`. Este mecanismo
se conservará sólo como puente de transición y no define el modelo objetivo.

### 2.3 Firebase y datos

El cliente inicializa un solo proyecto Firebase y exporta Auth, Firestore y
Storage. En este checkout no están versionados `firebase.json`,
`firestore.rules`, `storage.rules` ni `firestore.indexes.json`. La autorización
remota desplegada no puede verificarse desde el repositorio.

Los namespaces actuales son globales:

```text
levels/{levelId}
levels/{levelId}/modules/{moduleId}/lessons/{lessonId}
levels/{levelId}/lessons/{lessonId}                 (legacy)
temas/{topicId}
temas/{topicId}/Lessons/{lessonId}                  (legacy)
temas/{topicId}/missions/{missionId}
userTests/{testId}
presentations/{presentationId}
forums/{level}/posts/{postId}
forumReports/{reportId}
messages/{messageId}
supportTickets/{ticketId}
users/{uid}/progress/{progressId}
users/{uid}/topicProgress/{topicId}
users/{uid}/topicProgress/{topicId}/attempts/{attemptId}
```

Estas rutas no expresan tenant, curso o inscripción. `levels/A1` tampoco
identifica el idioma aprendido.

### 2.4 Idiomas

No existe una biblioteca ni un provider de i18n. Los textos visibles están
incrustados principalmente en polaco. El producto y el contenido contienen
referencias incompatibles a Spanish Learning, Learning Polish y English for
Polish.

El idioma académico está fijado en numerosos puntos a English/Polish:

- `MissionChatPage.jsx`;
- `Home.jsx`;
- `AILessonGenerator.jsx`;
- `AudioPlayer.jsx`;
- `writingEvaluationService.js`;
- `lessonSchema.js`;
- `chatbotService.js`;
- prompts en `src/services/ai/prompts`;
- componentes de test, curso, temas y misiones.

### 2.5 Fortalezas que deben preservarse

- Una sola aplicación React con lazy loading.
- Servicios progresivamente agrupados por dominio.
- Normalizadores que mantienen compatibilidad legacy.
- Arquitectura pedagógica completa de las lecciones.
- Estados editoriales `draft` y `published`.
- Persistencia de progreso bajo el usuario.
- Operaciones transaccionales para progreso e intentos de misión.
- Apertura local y flujo de IA de misiones ya simplificado.
- Instrumentación `GeminiAudit`.
- Niveles CEFR canónicos.
- Validadores de formularios separados de componentes.

## 3. Decisiones arquitectónicas aprobadas

### D-01 — Frontera `tenantId`

`tenantId` sustituye a `institutionId` como contrato técnico principal. Los
términos institución, universidad u organización se utilizarán sólo en UI.

```js
{
  tenantId: "tenant_...",
  tenantType: "university"
}
```

Los campos legacy `organizationId` e `institutionId`, si aparecen en datos de
migración, se interpretarán únicamente mediante adaptadores temporales. No
deben propagarse a nuevos contratos.

### D-02 — Identidad global y membresías

```text
users/{uid}
tenants/{tenantId}/memberships/{uid}
```

`users/{uid}` contiene identidad y preferencias globales. La membresía contiene
rol, estado y autorización para un tenant concreto. Aprobar, suspender,
reactivar o eliminar una membresía no afecta a las demás.

### D-03 — Tenant activo

La sesión de aplicación resolverá:

```js
{
  activeTenantId,
  activeMembership,
  activeRole,
  activeEnrollmentId,
  activeCourseId
}
```

Una sola membresía activa permite entrada directa. Varias membresías activas
producen `tenant_selection_required` y obligan a seleccionar espacio de trabajo.
Cambiar tenant invalida el estado
derivado del tenant anterior y vuelve a cargar membresía, inscripción,
capacidades y datos.

`activeTenantId` es estado de pestaña/sesión, preferentemente en
`sessionStorage`. El perfil puede conservar `lastActiveTenantId` como preferencia
de UX, nunca como autoridad. La autorización nunca confiará exclusivamente en
la selección del cliente.
Cada regla y operación privilegiada validará la membresía contra el tenant de la
ruta.

### D-04 — Roles

Roles de membresía:

```text
student
teacher
tenant_admin
```

Rol global futuro:

```text
platform_admin
```

No se utilizará `admin` sin calificador. `platform_admin` no se obtiene por
membresía y no convierte al usuario en miembro de todos los tenants.

### D-05 — Contenido privado y propiedad

Todo curso, módulo, lección, test, tema, misión, foro, archivo y contenido
generado pertenece al tenant. Los campos `createdBy`, `updatedBy`,
`submittedBy`, `reviewedBy` y `publishedBy` son trazabilidad, no ownership.

Retirar a un creador no elimina ni transfiere contenido. La plataforma no
ofrecerá copiar o listar contenido de otro tenant.

### D-06 — Cursos e idiomas

Cada tenant crea cursos independientes. Cada curso declara:

```js
{
  learningLanguageCode: "en",
  supportLanguageCode: "pl"
}
```

No se crearán campos ambiguos como `language`, `baseLanguage` o
`courseLanguage` en contratos nuevos.

La arquitectura interna actual de la lección se conserva íntegra. Sólo se
añaden las relaciones `tenantId` y `courseId` en el modelo de persistencia. No
se divide el contenido entre estructuras académicas y auxiliares y no se
introducen traducciones académicas especulativas.

### D-07 — CEFR global sin contenido

`A1`, `A2`, `B1`, `B2`, `C1` y `C2` son configuración técnica versionada. Los
niveles no contienen directamente lecciones globales. El contenido bajo un
nivel pertenece siempre a un curso y tenant.

### D-08 — Idioma de interfaz

`interfaceLocale` es una preferencia independiente:

```text
pl-PL, es-CO, en-US, it-IT, pt-PT, sk-SK
```

Precedencia inicial:

1. selección explícita en Welcome;
2. preferencia temporal anterior al registro;
3. perfil global del usuario;
4. locale predeterminado del tenant;
5. locale predeterminado de plataforma.

Cambiar `interfaceLocale` no cambia curso, prompts pedagógicos ni contenido.

### D-09 — Versión única

Todos los tenants utilizan la versión operativa de MiPyMeTIC. Las diferencias
se expresan mediante configuración y feature flags compatibles, no forks de
código ni versiones congeladas por tenant.

## 4. Modelo de datos recomendado

Se recomienda un subárbol tenant para datos privados y documentos globales sólo
para identidad y configuración técnica:

```text
users/{uid}
tenants/{tenantId}
tenants/{tenantId}/memberships/{uid}
tenants/{tenantId}/invitations/{invitationId}
tenants/{tenantId}/courses/{courseId}
tenants/{tenantId}/courses/{courseId}/modules/{moduleId}
tenants/{tenantId}/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
tenants/{tenantId}/courses/{courseId}/tests/{testId}
tenants/{tenantId}/courses/{courseId}/topics/{topicId}
tenants/{tenantId}/courses/{courseId}/topics/{topicId}/missions/{missionId}
tenants/{tenantId}/courses/{courseId}/forums/{forumId}/posts/{postId}
tenants/{tenantId}/enrollments/{enrollmentId}
tenants/{tenantId}/auditEvents/{eventId}
users/{uid}/tenantPreferences/{tenantId}
```

Los resultados, intentos y progreso deben depender de la inscripción:

```text
tenants/{tenantId}/enrollments/{enrollmentId}/lessonProgress/{lessonId}
tenants/{tenantId}/enrollments/{enrollmentId}/testAttempts/{attemptId}
tenants/{tenantId}/enrollments/{enrollmentId}/topicProgress/{topicId}
tenants/{tenantId}/enrollments/{enrollmentId}/missionAttempts/{attemptId}
```

Justificación:

- el tenant es visible en la ruta y en las reglas;
- la exportación, archivo o eliminación del tenant es delimitable;
- no depende de que cada consulta recuerde añadir un filtro;
- el progreso sigue perteneciendo al estudiante mediante `userId`, pero está
  contextualizado por inscripción;
- las consultas globales de plataforma se resuelven con agregados controlados o
  backend, no concediendo lectura general a clientes.

No se recomienda mantener colecciones académicas raíz sólo con un campo
`tenantId`: una omisión de filtro sería demasiado peligrosa. Puede duplicarse
`tenantId` dentro del documento como defensa, validación y soporte analítico,
pero la ruta es la primera frontera.

## 5. Contratos recomendados

### 5.1 Tenant

```js
{
  tenantId,
  tenantType,
  name,
  slug,
  countryCode,
  status, // onboarding | active | suspended | archived
  defaultInterfaceLocale,
  supportedInterfaceLocales,
  registrationPolicy,
  branding,
  createdAt,
  updatedAt
}
```

### 5.2 Usuario global

```js
{
  uid,
  email,
  displayName,
  interfaceLocale,
  lastActiveTenantId, // preferencia opcional, no autoritativa
  isGloballyActive,
  platformRole, // null | platform_admin
  createdAt,
  updatedAt
}
```

### 5.3 Membresía

```js
{
  tenantId,
  userId,
  role, // student | teacher | tenant_admin
  status, // pending | approved | rejected | suspended | removed
  approvedBy,
  approvedAt,
  suspendedBy,
  suspendedAt,
  suspensionReason,
  createdAt,
  updatedAt
}
```

`status` es la única autoridad canónica del lifecycle. Si `isActive` debe
conservarse temporalmente para leer documentos legacy, se deriva mediante la
invariante:

```js
isActive === (status === "approved")
```

No puede escribirse independientemente y se retira en la fase 12. La
autorización nueva exige `status === "approved"`.

### 5.4 Curso

```js
{
  tenantId,
  courseId,
  title,
  learningLanguageCode,
  supportLanguageCode,
  status,
  enabledCefrLevels,
  createdBy,
  updatedBy,
  createdAt,
  updatedAt
}
```

### 5.5 Inscripción

```js
{
  enrollmentId,
  tenantId,
  courseId,
  userId,
  status, // pending | active | completed | suspended | withdrawn
  placementLevel,
  currentLevel,
  createdAt,
  updatedAt
}
```

Un nivel de diagnóstico no debe guardarse como capacidad lingüística global del
usuario.

### 5.6 Política de registro

```js
{
  studentAccessMode:
    "any_email" |
    "institutional_domain" |
    "institution_code" |
    "manual_approval" |
    "invitation_only",
  teacherAccessMode: "invitation_only",
  tenantAdminAccessMode: "invitation_only",
  requireInstitutionalEmail: false,
  allowedEmailDomains: [],
  requireEmailVerification: true,
  invitationTtlHours: 168
}
```

Los modos definen entrada; no sustituyen aprobación ni activación. Por ejemplo,
`institutional_domain` valida dominio y puede crear una membresía aprobada sólo
si la política lo expresa explícitamente.

### 5.7 Invitación

```js
{
  invitationId,
  tenantId,
  normalizedEmailHash,
  encryptedOrRestrictedEmail,
  role,
  courseIds,
  status, // pending | accepted | expired | revoked
  tokenHash,
  expiresAt,
  invitedBy,
  acceptedBy,
  acceptedAt,
  createdAt
}
```

`normalizedEmailHash` será un HMAC del correo normalizado con una clave del
servidor, no un hash simple. El email sólo se conservará cifrado o en una
ubicación backend restringida cuando sea necesario para el envío y la
trazabilidad.

El token será aleatorio, de un solo uso y sólo su hash se almacenará. La
colección no será legible por clientes y la aceptación se ejecutará
exclusivamente en backend. Tendrá expiración, revocación, protección contra
replay y política de purga/retención. No se realizará una consulta pública
“¿existe este email?”. La UI dará un mensaje neutral y Firebase Auth resolverá
el flujo de inicio de sesión. Esto limita enumeración de cuentas.

## 6. Contrato canónico de acceso

Precedencia recomendada:

1. `anonymous`;
2. `authenticated_unverified`;
3. `user_globally_inactive`;
4. `tenant_selection_required`;
5. `tenant_suspended`;
6. `membership_suspended`;
7. `membership_rejected`;
8. `membership_pending`;
9. `email_verified_without_membership`;
10. `approved_without_enrollment`;
11. `active`.

| Estado | Ruta permitida principal | Acción | Responsable |
|---|---|---|---|
| `anonymous` | Welcome/Login/Register | autenticarse | usuario |
| `authenticated_unverified` | verificación | reenviar/verificar | usuario |
| `user_globally_inactive` | cuenta inactiva | contactar plataforma | platform admin |
| `tenant_selection_required` | `/select-workspace` | seleccionar tenant o cerrar sesión | usuario |
| `email_verified_without_membership` | selector/solicitud | solicitar o aceptar invitación | usuario |
| `membership_pending` | aprobación pendiente | esperar/cancelar | tenant admin |
| `membership_rejected` | acceso rechazado | contactar tenant | tenant admin |
| `membership_suspended` | membresía suspendida | contactar tenant | tenant admin |
| `tenant_suspended` | tenant no disponible | esperar/contactar plataforma | platform admin |
| `approved_without_enrollment` | selección/alta de curso | inscribirse o esperar asignación | tenant |
| `active` | aplicación | operar según capacidades | usuario |

`tenant_selection_required` aparece cuando existen dos o más memberships
aprobadas y ninguna selección de sesión es válida. Las rutas privadas tenant
redirigen a `/select-workspace`; se permiten seleccionar tenant, consultar el
estado de los espacios y cerrar sesión.

Con varias membresías se evalúa el estado de cada una. Una suspensión no debe
ocultar otros tenants aprobados. El selector mostrará espacios disponibles y
estados informativos sin conceder acceso.

Requisitos para `active`:

- `student`: membership aprobada, enrollment activo y curso activo;
- `teacher`: membership aprobada; selecciona curso sólo cuando la operación lo
  requiere;
- `tenant_admin`: membership aprobada; no requiere enrollment;
- `platform_admin`: contexto global de plataforma y ningún acceso automático a
  contenido tenant.

`approved_without_enrollment` se aplica principalmente a estudiantes.
Firebase Authentication y el token autenticado son la autoridad de
`emailVerified`. `users/{uid}.emailVerified`, si se conserva, es sólo un
snapshot sincronizado e insuficiente para autorizar.

## 7. Administradores globales temporales

`DEFAULT_ADMINS` se conservará durante las primeras fases únicamente para no
perder acceso administrativo al preparar la infraestructura. Restricciones:

- no crea membresías;
- no concede acceso automático al contenido de tenants;
- no se reutiliza en reglas como lista permanente;
- se encapsula posteriormente detrás de una función temporal claramente
  marcada;
- cada uso se registra;
- sólo permite bootstrap controlado de la administración de plataforma.

Migración recomendada:

1. crear el contrato global `platformRole`;
2. preparar un script administrativo de un solo uso, fuera del navegador, con
   Admin SDK;
3. recibir una lista explícita de UID y correo verificado;
4. comprobar que no exista previamente ningún `platform_admin`;
5. asignar custom claims y registro persistido global restringido;
6. crear un evento auditable;
7. verificar acceso y recuperación;
8. inutilizar o retirar el script;
9. retirar toda lectura de `DEFAULT_ADMINS` en fase 12.

El bootstrap inicial no requiere que ya exista un `platform_admin`, evitando una
dependencia circular. La fuente confiable ordinaria será backend con Firebase
Admin SDK, custom claims para autorización rápida y un documento global
restringido para trazabilidad. Firestore cliente no podrá autoconceder
`platform_admin`.

Los dos correos de `DEFAULT_ADMINS` pueden conservar acceso legacy temporal. No
ejecutan el bootstrap desde el cliente ni reciben memberships automáticas.

## 8. Registro, invitaciones y cuentas existentes

### Estudiante

```text
país → tenant → oferta de curso → interfaceLocale → identidad
→ verificación → solicitud de membresía → aprobación → inscripción → acceso
```

### Teacher y tenant_admin

Sólo por invitación o alta confiable. El registro público nunca acepta estos
roles.

### Correo ya registrado

La aplicación no intentará crear una segunda identidad. Debe responder de forma
neutral: “Si ya existe una cuenta, inicia sesión para continuar con la
invitación o solicitud”. Tras autenticarse, el backend compara el correo
verificado con la invitación.

Debe impedirse:

- dos membresías con el mismo `uid` en el mismo tenant;
- aceptar invitaciones vencidas o revocadas;
- reutilizar tokens;
- aceptar una invitación destinada a otro correo;
- cambiar el email y conservar invitaciones sin reverificación.

## 9. Seguridad y Storage

Las reglas deben comprobar, para toda ruta privada:

- usuario autenticado;
- usuario global activo cuando el estado esté disponible de forma confiable;
- tenant de la ruta;
- membership del tenant de la ruta, sin confiar en la preferencia guardada;
- membership con `status === "approved"`;
- capacidad requerida;
- pertenencia de curso, inscripción y recurso al mismo tenant.

Storage recomendado:

```text
tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/...
tenants/{tenantId}/users/{uid}/submissions/{submissionId}/...
tenants/{tenantId}/support/{ticketId}/...
```

La ruta actual `presentations/{timestamp}_audio.wav` no permite aislamiento ni
ownership y deberá migrarse. Metadatos y extensión se validarán; los nombres no
dependerán sólo de timestamps.

## 10. Auditoría administrativa, retención y eliminación

Se recomienda un log append-only:

```text
tenants/{tenantId}/auditEvents/{eventId}
```

Debe registrar actor, capacidad, acción, recurso, tenant, timestamp del
servidor, resultado y correlation ID, evitando almacenar contenido sensible
completo.

Política preferida:

- retirar membresía mediante estado, no borrar inmediatamente;
- conservar contenido institucional;
- anonimizar referencias personales cuando expire la retención;
- separar borrado de identidad global de borrado de una membresía;
- impedir borrar una identidad mientras existan obligaciones de retención;
- ejecutar borrado/anónimo mediante backend idempotente;
- registrar legal hold y exportación por tenant.

## 11. Migración del contenido actual

Debe designarse explícitamente un `legacyTenantId` para el contenido existente.
No se inferirá por idioma ni por correo del creador.

Orden:

1. inventario y snapshot verificable;
2. crear tenant inicial y curso inicial;
3. crear memberships mínimas y enrollments legacy para estudiantes;
4. validar providers en shadow mode;
5. mapear `levels`, módulos, lecciones, temas, misiones y tests;
6. migrar contenido por dominio;
7. mapear progreso a inscripciones usando mappings de contenido;
8. reconciliar conteos, referencias y hashes;
9. activar guardas/lecturas con feature flags;
10. mantener fallback legacy durante una ventana limitada;
11. retirar rutas legacy sólo en fase 12.

Para cada dominio se adopta una ventana corta de mantenimiento:

1. snapshot;
2. bloqueo temporal de escrituras;
3. migración del delta final;
4. reconciliación;
5. cambio coordinado de reglas y consumidores;
6. smoke tests;
7. reapertura de escrituras.

Dual-read sólo proporciona fallback; no captura escrituras concurrentes.
Dual-write idempotente o CDC se reservan como alternativas futuras si no puede
usarse mantenimiento.

La decisión de cuál organización recibe los datos actuales es operativa y debe
ser aprobada por el propietario del producto antes de ejecutar la migración.
Arquitectónicamente se recomienda un único tenant inicial explícito.

### 11.1 Storage y presentaciones

No se utilizarán redirects transparentes. Los blobs legacy se conservan durante
la transición, cada documento migrado registra `legacyStoragePath`, el
consumidor intenta primero la ruta nueva y usa fallback legacy durante una
ventana controlada. Las referencias y blobs se reconcilian antes de aprobar su
eliminación en fase 12.

### 11.2 Clasificación global y tenant

Datos privados del tenant:

- memberships;
- cursos y contenido;
- progreso, tests e intentos;
- temas, misiones y foro institucional;
- archivos académicos;
- soporte académico contextual.

Datos potencialmente globales de plataforma:

- mensajes públicos anteriores al registro;
- contacto comercial;
- soporte general de MiPyMeTIC;
- configuración técnica;
- auditoría de plataforma;
- identidad global.

“Global” no significa público: PII y operaciones siguen protegidas por
rules/backend. Esta clasificación no convierte contenido académico en propiedad
de la plataforma; todo contenido académico permanece tenant-owned.

## 12. Estrategia de despliegue

Una sola versión semántica de plataforma:

- cambios de esquema compatibles hacia atrás;
- migraciones expand/migrate/contract;
- feature flags con dueño, fecha de expiración y valor seguro;
- staging con datos sintéticos multi-tenant;
- canary por cohortes de tenants sólo como despliegue gradual, no como versión
  permanente;
- comunicación de cambios y mantenimiento;
- backups y punto de restauración;
- health checks posteriores;
- rollback de aplicación independiente del rollback de datos;
- migraciones idempotentes y reanudables.

Los providers se conectan primero en `shadow mode`: resuelven y comparan sin
bloquear rutas. Después se crean tenant/curso legacy, memberships y enrollments,
se reconcilia y sólo entonces se activa enforcement por feature flag.

## 13. Internacionalización y configuración

### Configuración técnica versionada

```text
src/config/productConfig.js
src/config/localeConfig.js
src/config/cefrConfig.js
src/config/routeConfig.js
src/config/featureFlags.js
```

### Traducciones de interfaz

```text
src/i18n/locales/pl-PL/
src/i18n/locales/es-CO/
src/i18n/locales/en-US/
src/i18n/locales/it-IT/
src/i18n/locales/pt-PT/
src/i18n/locales/sk-SK/
```

### Configuración del tenant

```text
tenants/{tenantId}/settings/general
tenants/{tenantId}/settings/branding
tenants/{tenantId}/settings/auth
tenants/{tenantId}/settings/features
```

Separación:

- configuración técnica: constantes estables, contratos y defaults seguros;
- traducciones: textos propios del producto;
- tenant settings: nombre, branding, políticas y features permitidas;
- contenido académico: lecciones, tests, temas y misiones privados.

No se guardarán catálogos de traducción completos en Firestore. No se
convertirán prompts, CEFR o secretos en configuración editable arbitraria.

### 13.1 Inventario de valores visibles y configuración dispersa

| Categoría | Ubicaciones confirmadas | Destino futuro |
|---|---|---|
| nombre técnico del paquete | `package.json` (`spanish-learning-app`) | `productConfig` y nombre neutro del paquete |
| título, locale HTML y favicon | `index.html` (`lang="pl"`, `Learning Polish`, `LearnSpanish4.svg`) | product config, locale runtime y assets de marca |
| logotipo y textos de marca | `Header.jsx`, `Footer.jsx`, assets `LearnSpanish*` | shell de marca + tenant branding |
| “English for Polish” | `Header.jsx`, `Footer.jsx` | claves i18n/product config |
| “Polish Learning AI” | `lessonSchema.js`, `lessonAgentsPrompts.js` | identificador de producto configurable |
| idioma English/Polish | `Home.jsx`, `Welcome.jsx`, `CourseHero.jsx`, `TopicIntro.jsx`, `WritingExercise.jsx`, `MissionInput.jsx`, componentes de test y personalización | contrato del curso + traducciones UI |
| idioma de misiones | `MissionChatPage.jsx`, `topicMissionAttemptService.js`, `missionPlayerUtils.js`, `services/ai/missions/*` | `activeCourse.learningLanguageCode` y `supportLanguageCode` |
| idioma de generación/evaluación | `AILessonGenerator.jsx`, `writingEvaluationService.js`, `lessonSchema.js`, `lessonAgentsPrompts.js`, `writingEvaluatorPrompt.js` | parámetros obligatorios del curso |
| chatbot/tutor | `AIChatWidget.jsx`, `Home.jsx`, `chatbotService.js`, `aiService.js`, prompts tutor | configuración del curso y operación |
| voz y locale de audio | `AudioPlayer.jsx`, `missionPlayerUtils.js` | mapa versionado language-to-speech |
| navegación pública/privada | `App.jsx`, `Header.jsx`, `Footer.jsx`, `AdminNavigationCards.jsx` | `routeConfig` + catálogos i18n + capacidades |
| títulos de panel administrativo | `components/admin/*`, `pages/Admin*` | catálogos i18n |
| auth, labels, placeholders y errores | `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `VerificationPending.jsx`, `components/login/*`, `components/register/*` | namespace i18n `auth` |
| dashboard/perfil | `Home.jsx`, `Profile.jsx`, `components/profile/*` | namespaces `dashboard` y `profile` |
| curso/lecciones | `Curso.jsx`, `Nivel.jsx`, `Lessons.jsx`, `components/cursos/*`, `components/nivel/*`, `components/forms/*` | namespaces UI; contenido permanece en Firestore tenant |
| tests y CEFR visibles | `Test.jsx`, `components/test/*`, `TestsSection.jsx` | namespaces `assessment`; CEFR técnico en `cefrConfig` |
| temas, misiones y feedback | `Temas.jsx`, `TemaDetalle.jsx`, `MissionChatPage.jsx`, `components/topics/*` | namespaces `topics` y `missions` |
| foro y soporte | `Foro.jsx`, `components/forum/*`, `Contact.jsx`, `components/support/*`, validadores | namespaces `forum` y `support` |
| errores de inicialización | `main.jsx`, `components/shared/ErrorMessage.jsx` | namespace `errors`, con fallback pre-React seguro |
| colores globales | `tailwind.config.js`, `src/index.css`, clases repetidas en UI | tokens de producto; overrides tenant limitados |
| datos de contacto | `Welcome.jsx`, `Footer.jsx`, `Contact.jsx`, soporte | `productConfig` o tenant settings según ownership |
| emails administradores | `firestoreService.js` (`DEFAULT_ADMINS`) | backend/claims y registro global restringido |
| políticas de tests | `firestoreService.js` y variables `VITE_TEST_*` | configuración técnica o política de curso/tenant validada |
| configuración Firebase/IA | `firebase.js`, `geminiProvider.js`, `languageToolService.js` | configuración de entorno; nunca tenant-editable ni traducción |

Los nombres de idiomas que forman parte de un selector deben derivarse de
códigos BCP 47/ISO soportados y mostrarse con `Intl.DisplayNames` o un catálogo
controlado. Los códigos persistidos no deben ser etiquetas traducidas.

### 13.2 Clasificación de textos

- **Producto traducible:** botones, navegación, validaciones, mensajes, alertas,
  títulos, estados vacíos, accesibilidad y errores.
- **Configuración de producto no traducible directamente:** ID, nombre
  canónico, URLs, límites, flags y operaciones.
- **Tenant editable:** nombre, logo, contacto, políticas y branding permitido.
- **Contenido académico:** texto creado por docentes/IA dentro del curso; no se
  mueve al sistema i18n.
- **Datos del usuario:** nombres, respuestas, conversaciones y evidencias; no
  se tratan como traducciones ni configuración.

## 14. Auditoría de `src/styles`

### Método

Se inspeccionaron los once CSS completos, todos los imports `.css` del
repositorio y coincidencias de selectores en fuentes JS/JSX. También se
consideraron clases dinámicas, template strings, componentes lazy y selectores
genéricos. La única hoja importada por la aplicación es `src/index.css`.

Ningún archivo de `src/styles` tiene un import desde código funcional ni
`@import` desde otra hoja. Una coincidencia textual como `footer`, `header`,
`menu`, `container`, `card`, `contact-form` o `test-info` no activa una hoja que
no está cargada.

| Archivo | Import real | Diagnóstico | Duplicidad/riesgo | Recomendación |
|---|---:|---|---|---|
| `Curso.css` | no | selectores `curso-*` sin uso encontrado | replica layout hoy expresado con Tailwind | candidato fuerte |
| `Footer.css` | no | `.footer` no cargado | nombre genérico; Footer actual usa Tailwind | candidato, validar footer responsive |
| `global.css` | no | `@layer` no cargado; usa tokens `primary`/`primary-dark` incompatibles con la escala actual | duplica `container`, `card`, `button`; `primary-dark` no está definido como token simple | candidato fuerte |
| `Header.css` | no | reglas legacy de navegación/perfil | nombres genéricos y layout sticky; Header actual usa Tailwind | candidato, validar menú desktop/mobile |
| `Home.css` | no | selectores `home-*` sin uso | colores y layouts duplicados | candidato fuerte |
| `Login.css` | no | selectores legacy sin uso | duplica Register; `.error-message` colisiona con Nivel/Register | candidato fuerte |
| `Nivel.css` | no | hoja extensa legacy sin import | selectores genéricos `.menu`, `.lesson-*`, `.error-message`; riesgo de confundir coincidencias textuales | candidato, mayor validación visual de lecciones |
| `Register.css` | no | selectores legacy sin uso | duplicación casi literal de Login | candidato fuerte |
| `Test.css` | no | selectores legacy sin uso | duplica TestQuestion y componentes actuales Tailwind | candidato, validar todos los tipos de pregunta |
| `TestQuestion.css` | no | selectores legacy sin uso | duplica `.question-container` y `.option-btn` de Test.css | candidato fuerte |
| `Welcome.css` | no | selectores legacy sin uso/import | `contact-form` y `test-info` coinciden con IDs/clases parciales, pero la hoja no se carga | candidato, validar landing responsive |

Todos contienen cero media queries. La compatibilidad responsive actual
proviene de utilidades Tailwind, no de estas hojas. Se detectan colores
hexadecimales repetidos: verdes `#4CAF50/#45a049`, azules
`#3498db/#2980b9`, grises, blancos y sombras. Login/Register duplican estructura
y valores; Test/TestQuestion duplican opciones y contenedor de pregunta.

`src/index.css` sí está activo. Contiene una definición duplicada de
`.nav-link` en dos posiciones y colores hardcodeados para scrollbar. Debe
consolidarse en una fase posterior, no eliminarse.

Los estilos inline localizados son principalmente anchos dinámicos de barras de
progreso y posiciones calculadas. No deben reemplazarse automáticamente porque
representan valores runtime. Archivos afectados: `TestProgress.jsx`,
`MissionFeedbackSummary.jsx`, `MissionCriteriaFeedback.jsx`,
`TopicProgress.jsx`, `MissionProgress.jsx`, `LessonProgress.jsx`,
`LevelCard.jsx`, `CourseCirlce.jsx`, `ProfileProgress.jsx` y estado de generación
personalizada.

Pruebas antes de eliminar:

1. build limpio antes/después;
2. capturas desktop y móvil de Welcome, Header, Footer, Login, Register, Home,
   Curso, Nivel y Test;
3. navegación con componentes lazy;
4. estados hover, focus, disabled, error, loading y selected;
5. tipos de pregunta y lección;
6. viewport estrecho, tablet y escritorio;
7. búsqueda final de imports y carga de CSS en el bundle;
8. prueba de accesibilidad visual y foco;
9. eliminación en un commit aislado y reversible.

Conclusión: los once archivos son candidatos a eliminación futura. `Nivel.css`,
`Header.css`, `Footer.css`, `Welcome.css` y `Test.css` requieren mayor
verificación por amplitud funcional o selectores genéricos. No se eliminó
ninguno.

## 15. Refactorización por responsabilidad

| Archivo | Responsabilidades mezcladas | Separación futura | Momento |
|---|---|---|---|
| `firestoreService.js` | usuarios, roles, lecciones, temas, misiones, tests, presentaciones y Storage | repositorios por dominio y adaptadores legacy | después del modelo/rules, antes de migrar consumidores |
| `Test.jsx` | sesión de test, navegación, scoring, evaluación, persistencia y UI | controlador/hook, repositorio y presentación | al introducir test por curso/inscripción |
| `MissionChatPage.jsx` | rutas, acceso, carga, persistencia y UI | loader tenant-aware, controlador y vista | tras Session/Tenant/Course context |
| `Home.jsx` | consultas, agregación, recomendación y render | dashboard service/model y secciones | tras progreso por inscripción |
| `Welcome.jsx` | marketing, consulta de contenido, contacto y onboarding | landing, selectores y formulario de contacto | al implementar onboarding e i18n |
| `Header.jsx` | Auth, admin check, navegación, branding y responsive | shell, workspace switcher, account menu y nav config | después de providers |
| `Footer.jsx` | branding, enlaces y contenido visible extenso | configuración, traducciones y vista | durante i18n |

No deben dividirse antes de fijar contratos transversales: hacerlo ahora
duplicaría provisionalmente `organizationId`, `admin` y textos hardcodeados.
Tampoco deben posponerse más allá de la migración de sus dominios, porque
mantener lecturas globales dentro de componentes dificultaría demostrar
aislamiento.

## 16. Riesgos, dependencias y bloqueantes

| Hallazgo | Prioridad | Complejidad | Dependencias | Bloqueante |
|---|---|---|---|---:|
| reglas Firebase no versionadas | P0 | alta | modelo de datos | sí |
| colecciones globales sin tenant/curso | P0 | muy alta | tenant y curso | sí |
| Auth sólo valida email | P0 | media | SessionProvider y estados | sí |
| rol global `admin` ambiguo | P0 | alta | membresías/capacidades | sí |
| panel admin lee usuarios globales | P0 | alta | reglas y repositorios tenant | sí |
| progreso y tests no dependen de inscripción | P0 | alta | enrollment | sí |
| Storage sin tenant | P0/P1 | media | reglas Storage | sí para archivos |
| ausencia de i18n | P1 | alta | interfaceLocale | no para backend inicial |
| Gemini en cliente | P1 | alta | backend/cuotas | sí para producción SaaS |
| CSS legacy sin cargar | P3 | baja | regresión visual | no |
| documentos y README desactualizados | P2 | media | decisiones aprobadas | no |

## 17. Asuntos analizados y recomendación preferida

1. **Colecciones:** subárbol tenant, con identidad global separada.
2. **Invitaciones:** token de un solo uso, hash persistido y aceptación backend.
3. **Enumeración:** mensajes neutrales; no endpoint público por email.
4. **Primer tenant_admin:** bootstrap por `platform_admin`, auditado y de un solo
   uso; nunca registro público.
5. **DEFAULT_ADMINS:** puente temporal; migrar a claims + registro global seguro.
6. **Tenant activo:** preferencia global de conveniencia, revalidada contra
   membresías; nunca autoridad de seguridad.
7. **Múltiples membresías:** selector de workspace y estado independiente.
8. **Cambio de tenant:** limpiar caches/estado, revalidar y cambiar rutas.
9. **Storage:** prefijo obligatorio `tenants/{tenantId}` y reglas por membresía.
10. **Progreso:** por `enrollmentId`.
11. **Tests:** definición bajo curso; intentos bajo inscripción.
12. **Foro:** bajo curso cuando sea académico; foro general bajo tenant.
13. **Retención:** retirada lógica, anonimización backend y legal hold.
14. **Auditoría:** eventos append-only por tenant y log global restringido.
15. **Migración:** tenant inicial explícito y scripts idempotentes.
16. **Emulator:** obligatorio en CI para Auth/Firestore/Storage/rules.
17. **Deploy:** expand/migrate/contract, flags temporales, canary y rollback.

## 18. Pendientes de producto, no de arquitectura

Las siguientes decisiones necesitan valor operativo, pero tienen solución
arquitectónica definida:

- identidad concreta del tenant que recibirá los datos legacy;
- locales que estarán disponibles en el primer lanzamiento;
- política inicial de registro de cada tenant;
- periodos legales de retención;
- región Firebase y requisitos contractuales;
- límites de cuota y coste de IA por tenant;
- quiénes aprobarán el bootstrap inicial.

No son alternativas al uso de `tenantId`, membresías, contenido privado o
cursos propios.

## 19. Documentos relacionados

- `IMPLEMENTATION_ORDER_SAAS_MULTI_TENANT.md`
- `DEPENDENCY_MAP_SAAS_MULTI_TENANT.md`
- `ADR/ADR-001-tenant-boundary.md`
- `ADR/ADR-002-global-identity-tenant-memberships.md`
- `ADR/ADR-003-private-tenant-content-ownership.md`
- `ADR/ADR-004-course-language-model.md`
- `ADR/ADR-005-single-platform-version.md`
- `ADR/ADR-006-temporary-platform-administration.md`
- `ADR/ADR-007-access-state-machine.md`
- `ADR/ADR-008-migration-cutover-strategy.md`
- `ADR/ADR-009-active-tenant-session-model.md`
