//src/docs/AUDITORIA_PREPARACION_PILOTO_UNIVERSITARIO_v1.0.md

# AUDITORÍA DE PREPARACIÓN PILOTO UNIVERSITARIO v1.0

## B1 — Arquitectura, autenticación y roles

### Archivo revisado
- `src/App.jsx`

### Estado actual verificado

La aplicación usa `react-router-dom` con carga diferida mediante `lazy` y `Suspense`. La estructura de rutas está separada en rutas públicas, rutas privadas para usuario autenticado y rutas administrativas protegidas por `AdminRoute`.

### Rutas públicas verificadas

- `/welcome`
- `/login`
- `/register`
- `/forgot-password`
- `/contact`
- `/verification-pending`

### Rutas privadas verificadas

- `/home`
- `/profile`
- `/test`
- `/foro`
- `/curso`
- `/curso/:levelId`
- `/temas`
- `/tema/:temaTitle`
- `/tema/:temaTitle/custom-mission`
- `/tema/:temaTitle/mission-chat`
- `/tema/:temaTitle/mission/:missionId`

### Rutas administrativas verificadas

- `/admin`
- `/admin/lessons`
- `/admin/tests`
- `/admin/temas`
- `/admin/forum-reports`
- `/admin/missions`
- `/admin/ai-lessons`
- `/admin/modules`

### Capacidades listas

- Existe separación entre rutas públicas y privadas.
- Existe protección para rutas privadas mediante `PrivateRoute`.
- Existe protección para rutas administrativas mediante `AdminRoute`.
- La estructura de rutas permite demostrar flujo público, estudiante y administrador.
- La carga diferida con `lazy` ayuda al rendimiento inicial.

### Brechas para el piloto

- No existe todavía un rol/ruta específica para `teacher`.
- Las funciones académicas de creación, edición, IA, módulos, lecciones y tests están agrupadas bajo rutas administrativas.
- Para el piloto institucional se requiere diferenciar entre administrador y docente.
- Falta definir una ruta o permiso intermedio para usuarios académicos que puedan crear y editar contenido sin tener autoridad administrativa completa.

### Cambios críticos antes del piloto

- Crear o adaptar el modelo de permisos para soportar `teacher`.
- Definir si se usará `TeacherRoute`, `AcademicRoute` o permisos internos por acción.
- Separar acciones de creación/edición de acciones de aprobación/publicación.
- Evitar que un docente tenga acceso completo a gestión de usuarios o configuración crítica.

### Cambios que pueden esperar

- Rutas multiuniversidad.
- Subdominios institucionales.
- Personalización por universidad.
- Panel global de superadministrador SaaS.

### Decisión de arquitectura preliminar

Para el primer piloto se mantendrá una sola aplicación y una sola institución objetivo. La arquitectura multiuniversidad se aplaza hasta validar la primera universidad. Sin embargo, desde esta fase debe evitarse seguir aumentando funcionalidades administrativas sin distinguir entre `admin` y `teacher`.

### Archivo revisado
- `src/components/PrivateRoute.jsx`

### Estado actual verificado

`PrivateRoute` protege las rutas privadas usando Firebase Auth mediante `useAuthState(auth)`. Si el usuario no está autenticado, redirige a `/login`. Si el usuario existe pero no tiene el correo verificado y `requireEmailVerified` está activo, redirige a `/verification-pending`.

### Capacidades listas

- Protege rutas privadas.
- Maneja estado de carga.
- Redirige usuarios no autenticados.
- Exige verificación de correo electrónico por defecto.
- Conserva la ruta de origen mediante `state.from`.

### Brechas para el piloto

- No carga perfil institucional desde Firestore.
- No conoce `role`.
- No conoce `institutionId`.
- No valida si el usuario pertenece a una universidad.
- No valida si el usuario está activo o aprobado por la institución.

### Decisión preliminar

`PrivateRoute` puede mantenerse como protección general para usuarios autenticados. Los permisos por rol deben manejarse en rutas especializadas como `AdminRoute` y, más adelante, `TeacherRoute` o `AcademicRoute`.

### Archivo revisado
- `src/components/admin/AdminRoute.jsx`

### Estado actual verificado

`AdminRoute` protege las rutas administrativas mediante una combinación de Firebase Authentication y autorización basada en el perfil almacenado en Firestore.

El componente valida:

1. existencia de una sesión autenticada;
2. verificación del correo electrónico;
3. pertenencia al rol administrativo mediante `isUserAdmin(user.uid)`.

Si el usuario no está autenticado, es enviado a `/login`. Si no ha verificado su correo, es enviado a `/verification-pending`. Si está autenticado y verificado pero no es administrador, es enviado a `/home`.

### Capacidades listas

- Protección específica de rutas administrativas.
- Validación independiente de autenticación y autorización.
- Verificación obligatoria de correo electrónico.
- Consulta del rol desde el servicio de datos.
- Comportamiento restrictivo ante errores de autorización.
- Redirección segura de usuarios sin privilegios.
- Conservación de la ruta de origen para usuarios no autenticados.

### Brechas para el piloto

- El modelo de autorización visible actualmente es binario: administrador o no administrador.
- No existe todavía autorización específica para `teacher`.
- No existe una categoría intermedia de permisos académicos.
- Las rutas académicas de creación y edición siguen dependiendo de privilegios administrativos.
- Debe verificarse cómo `isUserAdmin()` determina el rol y cómo se almacena este dato en Firestore.

### Decisión preliminar

`AdminRoute` debe conservarse para funciones exclusivas de la máxima autoridad institucional.

No debe ampliarse simplemente para aceptar docentes, porque eso mezclaría nuevamente permisos administrativos y académicos.

La arquitectura objetivo deberá diferenciar, como mínimo:

- `PrivateRoute`: cualquier usuario autenticado y verificado.
- protección académica: `teacher` y `admin`.
- `AdminRoute`: únicamente `admin`.

La implementación exacta se decidirá después de revisar el modelo actual de usuarios y la función `isUserAdmin()`.

### Archivo revisado
- `src/services/firestoreService.js`
- Sección: `USERS`

### Estado actual verificado

El sistema almacena los perfiles en:

`users/{uid}`

Cada documento de usuario contiene actualmente información de identidad, estado de cuenta, actividad, moderación del foro y un campo `role`.

El modelo actual de autorización reconoce únicamente dos roles:

- `admin`
- `user`

Los usuarios cuyos correos aparecen en la constante `DEFAULT_ADMINS` reciben automáticamente el rol `admin` durante la creación de su documento. Los demás usuarios reciben el rol `user`.

La función `isUserAdmin(userId)` consulta directamente `users/{uid}` y concede condición administrativa únicamente cuando:

`role === "admin"`

La función `updateUserRole()` también restringe actualmente los cambios a los valores `admin` y `user`.

### Capacidades listas

- Perfil de usuario persistente en Firestore.
- Campo de rol explícito.
- Consulta centralizada del rol administrativo.
- Cambio de rol desde el servicio de datos.
- Estado activo del usuario.
- Registro de último acceso.
- Datos académicos y resultados asociados al estudiante.
- Moderación individual del foro.

### Brechas para el piloto

- No existe el rol `teacher`.
- El rol `user` es demasiado genérico para un contexto universitario.
- No existe autorización académica diferenciada.
- La creación de administradores depende parcialmente de una lista de correos hardcoded.
- `updateUserRole()` solo acepta `admin` y `user`.
- Debe verificarse si `createUserDocument()` puede volver a ejecutarse sobre usuarios existentes y sobrescribir roles previamente asignados.
- No existe todavía trazabilidad de quién asignó o modificó un rol.
- No existe todavía asociación institucional explícita en el documento del usuario.

### Arquitectura objetivo para el piloto

El modelo institucional deberá evolucionar hacia:

- `student`
- `teacher`
- `admin`

Responsabilidades:

#### student

Puede acceder al entorno de aprendizaje, realizar tests, estudiar lecciones, completar misiones, participar en actividades autorizadas y consultar su propio progreso.

#### teacher

Puede acceder a funciones académicas autorizadas, crear y editar contenido, utilizar generación asistida por IA y enviar contenido al flujo de revisión.

No debe tener acceso a funciones administrativas críticas.

#### admin

Representa la máxima autoridad institucional dentro de la plataforma.

Puede administrar usuarios y roles, revisar contenido académico, aprobar o devolver contenido con observaciones, publicar contenido y consultar información institucional.

### Decisión arquitectónica preliminar

No se modificará todavía el sistema de roles durante esta fase de auditoría.

Primero se completará el mapa real de:

- autenticación;
- creación de perfiles;
- asignación de roles;
- redirección inicial;
- administración de usuarios;
- reglas de Firestore.

Después se diseñará la migración controlada de `user` hacia `student` y la incorporación de `teacher`.

### Riesgo identificado

La constante `DEFAULT_ADMINS` es válida como mecanismo temporal de desarrollo, pero no debe considerarse el modelo definitivo de asignación administrativa para un piloto institucional.

También debe verificarse el ciclo completo de `createUserDocument()` debido al uso de `{ merge: true }` y a la escritura explícita del campo `role`.

### Archivo revisado
- `src/components/RootRedirect.jsx`

### Estado actual

`RootRedirect` gestiona exclusivamente la ruta raíz `/`.

Su comportamiento actual es:

- usuario autenticado → `/home`
- usuario no autenticado → `/welcome`

### Hallazgo

El componente no implementa persistencia de la última ruta visitada.

Sin embargo, por su integración actual en `App.jsx`, no debería ejecutarse al recargar directamente rutas como `/curso`, `/temas`, `/profile` o `/admin`.

### Incidencia pendiente de diagnóstico

Se reporta que al recargar determinadas páginas la aplicación redirige al usuario autenticado hacia `/home`.

No se modificará `RootRedirect` hasta identificar si:

1. la URL solicitada se transforma primero en `/`;
2. algún componente ejecuta `navigate("/")`;
3. algún componente ejecuta `navigate("/home")`;
4. el flujo de restauración de autenticación provoca la redirección;
5. existe una redirección externa en la configuración del hosting.

### Decisión

Mantener temporalmente `RootRedirect.jsx` sin cambios y auditar el flujo completo de navegación y autenticación antes de implementar persistencia de última ruta.

### Archivo revisado
- `src/pages/Register.jsx`

### Estado actual

El registro permite crear cuentas públicas mediante:

- nombre;
- apellido;
- correo electrónico;
- país;
- edad;
- contraseña.

El componente utiliza `registerUser()` como servicio central para crear la cuenta.

Después del registro:

1. se envía correo de verificación;
2. se redirige a `/verification-pending`;
3. se conserva parcialmente `location.state.from`.

### Capacidades listas

- Registro funcional.
- Validación de correo.
- Validación de contraseña.
- Verificación de correo electrónico.
- Captura de datos básicos del usuario.
- Cálculo de grupo de edad.
- Conservación parcial de la ruta de origen.

### Hallazgos

- Existe una redirección fija a `/home` cuando un usuario autenticado y verificado accede a `/register`.
- El registro no identifica todavía una institución.
- El registro no diferencia explícitamente entre `student`, `teacher` y `admin`.
- El acceso al formulario es público.
- Existen textos visibles mezclados entre inglés y español.
- La creación real del documento Firestore está delegada a `registerUser()` y debe auditarse en `authService.js`.

### Brechas para el piloto

- Definir el mecanismo de incorporación de estudiantes de la universidad piloto.
- Incorporar posteriormente `institutionId`.
- Migrar el rol genérico `user` hacia `student`.
- Impedir que el registro público permita autoseleccionar roles privilegiados.
- Revisar la estrategia institucional de alta de docentes y administradores.
- Completar la internacionalización al polaco.
- Revisar las redirecciones rígidas hacia `/home`.

### Decisión preliminar

No modificar todavía `Register.jsx`.

Primero debe completarse la auditoría del flujo:

`Register.jsx → authService.js → createUserDocument() → Firestore`

Después se diseñará una modificación coordinada del modelo de usuarios y roles.

### Archivo revisado
- `src/services/authService.js`

### Estado actual

`authService.js` centraliza las operaciones principales de autenticación:

- registro;
- login;
- logout.

Durante el registro, el servicio crea el usuario en Firebase Authentication, actualiza el `displayName` y luego crea el perfil extendido en Firestore mediante `createUserDocument()`.

### Capacidades listas

- Servicio de autenticación separado de la interfaz.
- Normalización de correo electrónico.
- Registro con Firebase Auth.
- Actualización de nombre visible en Firebase Auth.
- Creación de perfil en Firestore.
- Login centralizado.
- Logout centralizado.
- Propagación del error original hacia la interfaz.

### Brechas para el piloto

- El servicio no recibe `institutionId`.
- El servicio no recibe un rol institucional explícito.
- El servicio no diferencia registro abierto de registro institucional.
- No existe flujo de invitación para estudiantes, docentes o administradores.
- No existe estado de aprobación institucional.
- No registra quién creó o autorizó el usuario.

### Decisión preliminar

`authService.js` puede mantenerse como servicio base.

La evolución institucional deberá diseñarse de forma coordinada con:

- `Register.jsx`;
- `createUserDocument()`;
- panel de administración de usuarios;
- reglas de Firestore;
- rutas protegidas;
- futuro rol `teacher`.

No se recomienda modificar este archivo de forma aislada.

### Archivo revisado
- `src/pages/Login.jsx`

### Estado actual verificado

`Login.jsx` autentica directamente con Firebase Auth mediante `signInWithEmailAndPassword`.

Después de iniciar sesión correctamente:

- valida que el correo esté verificado;
- actualiza `lastLogin` en `users/{uid}`;
- redirige a `location.state.from.pathname` si existe y es válido;
- si no existe ruta previa válida, redirige a `/home`.

### Capacidades listas

- Login funcional.
- Validación de correo verificado.
- Cierre de sesión automático si el correo no está verificado.
- Actualización de `lastLogin`.
- Conservación parcial de ruta de origen mediante `location.state.from`.
- Manejo de errores amigables.

### Brechas para el piloto

- No consulta el perfil completo del usuario antes de redirigir.
- No diferencia destino inicial por rol.
- No diferencia estudiantes, docentes y administradores.
- No verifica `isActive`.
- No verifica `institutionId`.
- No conserva la última ruta real después de recargar la página.
- Contiene textos visibles mezclados entre inglés y español.

### Incidencia de navegación

`Login.jsx` usa `/home` como destino por defecto cuando no existe `location.state.from`.

Esto es correcto como fallback, pero no resuelve persistencia de última ruta después de F5.

Para conservar la página anterior entre recargas se necesitaría registrar la última ruta válida del usuario autenticado, por ejemplo mediante `sessionStorage`.

### Decisión preliminar

No modificar todavía `Login.jsx`.

Primero debe definirse una estrategia global de navegación autenticada:

- destino por defecto de estudiante;
- destino por defecto de docente;
- destino por defecto de administrador;
- conservación de ruta previa;
- rutas excluidas;
- comportamiento después de verificación de correo.

### Archivo revisado
- `src/components/admin/Admin.jsx`

### Estado actual

`Admin.jsx` funciona como panel administrativo central de la plataforma.

El componente permite:

- validar al administrador autenticado;
- cargar usuarios;
- consultar sus últimos tests;
- visualizar datos académicos básicos;
- cambiar roles;
- bloquear o desbloquear acceso al foro;
- eliminar perfiles de Firestore;
- inicializar la estructura académica;
- abrir información detallada de cada usuario.

### Capacidades listas para el piloto

- Panel administrativo funcional.
- Supervisión centralizada de usuarios.
- Visualización de último acceso.
- Visualización de nivel actual.
- Visualización de nivel de clasificación.
- Consulta de los tres últimos tests completados.
- Gestión de roles.
- Moderación del foro.
- Estado activo disponible en el modelo.
- Interfaz administrativa en polaco.

### Hallazgos arquitectónicos

#### Modelo de roles

El panel todavía utiliza principalmente:

- `admin`
- `user`

El modelo institucional definido para el piloto requiere:

- `admin`
- `teacher`
- `student`

El mecanismo existente `updateUserRole()` puede servir como base para esta evolución.

#### Consultas de tests

La carga de usuarios presenta un patrón N+1:

1. se consulta la colección `users`;
2. por cada usuario se realiza una consulta adicional a `userTests`.

Este diseño es aceptable para un piloto pequeño, pero debe optimizarse antes de escalar el producto.

#### Eliminación incompleta

`deleteUserAccount()` elimina actualmente información de Firestore, pero no elimina la cuenta correspondiente de Firebase Authentication.

Esto puede generar inconsistencias entre:

- Firebase Authentication;
- Firestore.

La eliminación completa deberá implementarse mediante backend privilegiado.

#### Estado de cuenta

El campo `isActive` se carga y muestra, pero debe verificarse si realmente impide el acceso del usuario cuando su valor es `false`.

#### Separación institucional

El administrador actual consulta todos los usuarios de la plataforma.

Esto es válido para el primer piloto con una única universidad.

En una futura arquitectura multiinstitucional será necesario filtrar los usuarios mediante `institutionId` y aplicar aislamiento de datos.

### Brechas para el piloto

- Incorporar el rol `teacher`.
- Renombrar progresivamente el rol `user` como `student`.
- Revisar `AdminUsersTable`.
- Revisar `UserDetailsModal`.
- Revisar `updateUserRole()`.
- Verificar el comportamiento real de `isActive`.
- Definir permisos del futuro rol `teacher`.
- Añadir posteriormente métricas de progreso académico.
- Resolver la eliminación completa de cuentas antes de producción institucional.
- Registrar la optimización de consultas como deuda técnica.

### Decisión preliminar

Mantener `Admin.jsx` como base del panel institucional.

No reconstruir el panel desde cero.

La evolución deberá realizarse extendiendo el modelo actual hacia tres roles:

- `admin`;
- `teacher`;
- `student`.

La separación multiinstitucional no se implementará antes del primer piloto, pero la arquitectura futura deberá contemplar `institutionId`.

### Archivo revisado
- `src/components/admin/AdminUsersTable.jsx`

### Estado actual

`AdminUsersTable.jsx` presenta y filtra los usuarios cargados por el panel administrativo.

La interfaz dispone de:

- búsqueda por nombre, apellido y correo;
- filtro por rol;
- filtro por país;
- filtro por nivel CEFR;
- vista responsive mediante tarjetas;
- tabla para escritorio;
- visualización de nivel;
- visualización del último resultado de test;
- visualización de país;
- visualización de rol;
- apertura del detalle del usuario.

### Capacidades listas para el piloto

- Gestión visual profesional de usuarios.
- Búsqueda funcional.
- Filtros dinámicos.
- Diseño responsive.
- Soporte visual parcial para múltiples roles.
- Compatibilidad con niveles CEFR A1-C2.
- Integración con el detalle individual del usuario.

### Hallazgo sobre roles

El componente ya reconoce:

- `admin`;
- `user`;
- `teacher`;
- `coordinator`.

Sin embargo, el modelo institucional acordado para el primer piloto será:

- `admin`;
- `teacher`;
- `student`.

El rol `coordinator` no se implementará inicialmente.

El rol genérico `user` deberá migrarse posteriormente a `student`.

### Hallazgo de compatibilidad

El componente utiliza `user` como rol por defecto en varios puntos.

No debe modificarse de forma aislada mientras los documentos existentes de Firestore continúen utilizando:

`role: "user"`.

La migración deberá coordinarse con:

- `createUserDocument()`;
- `updateUserRole()`;
- `AdminRoute`;
- futuro control de rutas para docentes;
- reglas de Firestore;
- usuarios existentes.

### Analítica

La tabla muestra actualmente:

- nivel;
- último resultado;
- país;
- rol.

Para una evolución posterior del piloto podrán incorporarse indicadores como:

- último acceso;
- lecciones completadas;
- progreso general;
- estado de actividad.

La información detallada debe mantenerse principalmente en el modal individual para evitar sobrecargar la tabla.

### Decisión preliminar

Mantener `AdminUsersTable.jsx` como base del panel institucional.

No reconstruir el componente.

Adaptarlo posteriormente al modelo:

- `admin`;
- `teacher`;
- `student`.

Eliminar conceptualmente `coordinator` del alcance del primer piloto y migrar `user` a `student` de manera coordinada.

### Archivo revisado
- `src/components/admin/UserDetailsModal.jsx`

### Estado actual

`UserDetailsModal.jsx` presenta el detalle individual del usuario y concentra las principales acciones administrativas disponibles actualmente.

El componente muestra:

- datos personales;
- correo electrónico;
- país;
- grupo de edad;
- estado de verificación del correo;
- último inicio de sesión;
- estado activo/inactivo;
- nivel actual;
- nivel de clasificación;
- último resultado de test;
- historial reciente de tests;
- acceso al foro;
- rol actual.

### Capacidades administrativas actuales

El administrador puede:

- cambiar el rol de otro usuario;
- bloquear o desbloquear el acceso al foro;
- iniciar la eliminación de un usuario.

El administrador actual no puede:

- modificar su propio rol;
- bloquearse a sí mismo del foro;
- eliminar su propia cuenta.

Esta protección debe conservarse.

### Hallazgo crítico sobre roles

Aunque el componente contiene etiquetas visuales para:

- `admin`;
- `user`;
- `teacher`;
- `coordinator`;

el selector administrativo solo permite asignar:

- `user`;
- `admin`.

Por tanto, el sistema funcional actual continúa operando con dos roles reales.

El modelo aprobado para el piloto será:

- `admin`;
- `teacher`;
- `student`.

No debe añadirse todavía `teacher` al selector de forma aislada.

La implementación deberá coordinarse con:

- creación de usuarios;
- servicios de autorización;
- rutas protegidas;
- navegación;
- permisos funcionales;
- reglas Firestore;
- workflow de revisión y publicación.

### Hallazgo sobre estado institucional

El componente muestra el campo:

`isActive`

pero actualmente no ofrece una acción administrativa para activar o desactivar una cuenta.

Para el piloto deberá diferenciarse entre:

- `forumBlocked`: restricción exclusiva del foro;
- `isActive`: autorización institucional de acceso a la plataforma.

Se recomienda incorporar posteriormente una acción administrativa para activar o desactivar cuentas.

### Hallazgo sobre eliminación

El componente delega la eliminación mediante:

`onDeleteUser(user)`.

Debe auditarse la implementación real para determinar si la eliminación afecta:

- documento del usuario;
- Firebase Authentication;
- progreso;
- tests;
- actividad;
- datos relacionados;
- contenido creado por docentes.

No debe asumirse que la eliminación actual es completa.

### Seguimiento académico

El modal ya muestra información útil para el piloto:

- nivel;
- test;
- historial;
- último acceso;
- estado.

Como evolución para seguimiento institucional deberán incorporarse:

- lecciones completadas;
- progreso general;
- última actividad académica.

### Decisión preliminar

Mantener `UserDetailsModal.jsx` como base.

No reconstruir el componente.

Adaptarlo posteriormente al modelo de roles:

- `admin`;
- `teacher`;
- `student`.

Añadir en una fase coordinada:

- activación/desactivación institucional;
- información de progreso académico;
- comportamiento completo del rol docente.

La migración de roles no debe ejecutarse todavía de forma aislada.

### Archivo revisado
- `src/services/firestoreService.js`

### Alcance revisado
Se auditó específicamente el bloque de gestión de usuarios y roles.

### Modelo de roles actual

El sistema opera actualmente con dos roles funcionales:

- `admin`;
- `user`.

Los nuevos usuarios reciben automáticamente el rol `user`, excepto los correos definidos en `DEFAULT_ADMINS`, que reciben el rol `admin`.

### Hallazgo sobre administradores predeterminados

Los administradores iniciales están definidos directamente en el código mediante una lista de correos electrónicos.

Este mecanismo puede conservarse temporalmente durante la preparación técnica del piloto, pero no debe constituir el modelo institucional definitivo de asignación de administradores.

### Modelo objetivo aprobado

El piloto universitario utilizará:

- `admin`;
- `teacher`;
- `student`.

Los nuevos registros deberán recibir por defecto el rol `student`.

La migración no debe realizarse de manera aislada.

Debe coordinarse con:

- creación de usuarios;
- actualización de roles;
- componentes administrativos;
- rutas protegidas;
- navegación;
- permisos funcionales;
- reglas de Firestore.

### Verificación administrativa

La función `isUserAdmin()` verifica correctamente si el documento del usuario contiene:

`role === "admin"`.

Puede conservarse.

Sin embargo, el nuevo modelo requerirá posteriormente una capa de autorización capaz de reconocer y gestionar varios roles.

### Cambio de roles

La función `updateUserRole()` solo acepta actualmente:

- `admin`;
- `user`.

Cualquier intento de asignar `teacher` o `student` será rechazado.

La modificación de esta función deberá formar parte de la migración coordinada de roles.

### Estado institucional

Todo nuevo usuario se crea con:

`isActive: true`.

Sin embargo, actualmente no existe una función de servicio para activar o desactivar cuentas.

Para el piloto deberá implementarse una capacidad administrativa que permita:

- desactivar una cuenta sin eliminarla;
- conservar su historial;
- reactivarla posteriormente.

Debe mantenerse la separación entre:

- `forumBlocked`: restricción exclusiva del foro;
- `isActive`: autorización institucional de acceso.

### Hallazgo crítico sobre eliminación

La función `deleteUserAccount()` elimina únicamente:

`users/{userId}`

en Firestore.

No elimina actualmente:

- la cuenta de Firebase Authentication;
- tests asociados;
- progreso académico;
- actividad relacionada;
- presentaciones;
- comentarios;
- otros documentos vinculados al usuario.

Por tanto, el nombre `deleteUserAccount` no representa una eliminación integral de cuenta.

Debe diseñarse una política institucional diferenciando:

1. desactivación;
2. eliminación;
3. anonimización.

La eliminación definitiva deberá tratar explícitamente todos los datos relacionados.

### Hallazgo de seguridad

Las operaciones administrativas del servicio cliente no verifican por sí mismas el rol del usuario que las ejecuta.

Esto puede ser correcto únicamente si las reglas de Firestore aplican la autorización real.

`AdminRoute` protege la interfaz y la navegación, pero no sustituye las reglas de seguridad del backend.

Debe auditarse obligatoriamente el archivo de reglas Firestore antes de aprobar el sistema para un piloto universitario.

### Decisión

Mantener temporalmente el código actual mientras continúa la auditoría.

No implementar todavía el nuevo modelo de roles.

La migración a:

- `admin`;
- `teacher`;
- `student`;

se realizará como un bloque técnico coordinado después de verificar:

- reglas Firestore;
- navegación;
- permisos sobre contenido;
- flujo de aprobación académica.

### Archivo revisado
- `firestore.rules`

### Estado actual

Las reglas de Firestore implementan autorización real del lado backend. El sistema no depende únicamente de la interfaz React para proteger operaciones críticas.

Actualmente existe una función `isAdmin()` que consulta el documento:

`users/{request.auth.uid}`

y valida:

`role == "admin"`

### Capacidades listas

- Las rutas administrativas del frontend están respaldadas por reglas backend.
- Los usuarios autenticados pueden crear su propio documento.
- Los usuarios pueden leer su propio perfil.
- Los administradores pueden leer usuarios.
- Los usuarios pueden actualizar su perfil sin cambiar el campo `role`.
- Solo administradores pueden eliminar usuarios.
- Solo administradores pueden crear, editar o eliminar niveles, módulos, lecciones, temas, misiones y tests.
- Los resultados de test se protegen por `userId`.
- El foro respeta bloqueo mediante `forumBlocked`.
- Los reportes del foro son visibles solo para administradores.
- Todo lo no declarado queda bloqueado por la regla final.

### Hallazgos positivos

La función `isNotChangingRole()` impide que un usuario normal modifique su propio rol.

Esto protege el campo más sensible del documento de usuario.

Las operaciones administrativas críticas no dependen únicamente de `AdminRoute`; también están protegidas por reglas de Firestore.

### Brechas para el piloto

- No existe función `isTeacher()`.
- No existe función `isStudent()`.
- No existe función de autorización académica compartida, por ejemplo `isAcademicStaff()`.
- El rol `teacher` no tendría permisos reales aunque se agregara visualmente.
- Los docentes no pueden crear ni editar contenido sin ser administradores.
- No existe diferenciación entre crear/editar y aprobar/publicar.
- No existe control por `institutionId`.
- Varias colecciones académicas tienen lectura pública mediante `allow read: if true`.
- No existe todavía restricción institucional del contenido por universidad.

### Brecha sobre privacidad institucional

Actualmente las siguientes colecciones permiten lectura pública:

- `levels`
- `lessons`
- `modules`
- `temas`
- `missions`
- `tests`

Esto puede ser aceptable temporalmente para una demostración o prototipo, pero no para un modelo universitario con contenido privado.

Para el primer piloto con una sola institución puede mantenerse temporalmente si el contenido usado es demostrativo o autorizado.

Para la fase institucional real deberá cambiarse a lectura autenticada y, posteriormente, a lectura filtrada por institución.

### Modelo objetivo futuro de reglas

El modelo institucional deberá incluir funciones conceptuales como:

- `isAdmin()`
- `isTeacher()`
- `isStudent()`
- `isAcademicStaff()`
- `isActiveUser()`
- `belongsToInstitution(institutionId)`
- `canManageContent()`
- `canPublishContent()`

### Decisión preliminar

No modificar todavía las reglas.

Las reglas actuales son coherentes con el modelo `admin/user`.

La migración a `admin/teacher/student` deberá hacerse como una tarea técnica coordinada que incluya:

- migración de datos de usuarios;
- actualización de servicios;
- actualización de componentes;
- actualización de rutas;
- actualización de reglas Firestore;
- pruebas de seguridad.

## B2 — Administración académica

### Archivo revisado
- `src/components/admin/AdminNavigationCards.jsx`

### Estado actual

El componente proporciona acceso a los principales dominios de administración académica:

- lecciones;
- generación de lecciones con IA;
- módulos;
- tests;
- temas;
- misiones;
- reportes del foro;
- inicialización de niveles.

### Capacidades listas para demostración

La plataforma ya dispone de una navegación administrativa centralizada que permite mostrar a una universidad que el producto incluye herramientas de gestión académica y no únicamente una interfaz para estudiantes.

El componente presenta accesos funcionales a los principales subsistemas de contenido.

### Hallazgo sobre roles

La navegación actual es estática y está diseñada para un único rol administrativo.

Esto es coherente con el modelo actual, donde únicamente `admin` puede acceder al panel.

El modelo objetivo del piloto incorporará:

- `admin`;
- `teacher`;
- `student`.

Por tanto, la navegación deberá evolucionar posteriormente hacia un modelo basado en capacidades y permisos.

El docente deberá acceder a las herramientas académicas necesarias para crear y editar contenido.

El administrador deberá conservar las capacidades de supervisión, aprobación, publicación, usuarios, moderación y analítica.

### Hallazgo sobre workflow académico

Actualmente no existe una entrada específica para gestionar contenido pendiente de revisión.

El modelo institucional acordado requiere el flujo:

`teacher → creación o modificación → revisión → aprobación o devolución con observaciones → publicación`

Por tanto, deberá incorporarse posteriormente una sección administrativa para:

- contenido pendiente;
- contenido devuelto;
- observaciones;
- aprobación;
- publicación.

### Hallazgo sobre inicialización estructural

La acción `Inicjalizuj poziomy` aparece junto con las herramientas académicas cotidianas.

Esta función corresponde a inicialización técnica de la estructura de datos y no a una operación académica habitual.

Para el primer piloto puede conservarse temporalmente.

En la evolución institucional deberá:

- separarse de la navegación académica;
- restringirse a una autoridad técnica superior;
- evitar que una institución ejecute accidentalmente operaciones estructurales.

### Decisión

Mantener el componente actual durante la auditoría.

No reconstruirlo todavía.

Adaptarlo posteriormente cuando se implemente el modelo:

- `admin`;
- `teacher`;
- `student`;

y el workflow institucional de revisión y publicación.

### Archivo revisado
- `src/components/admin/AdminModules.jsx`

### Estado actual

`AdminModules.jsx` proporciona una interfaz completa para administrar la estructura modular del curso por nivel CEFR.

Actualmente permite:

- consultar módulos por nivel;
- incluir borradores en la vista administrativa;
- crear módulos;
- editar módulos;
- eliminar módulos;
- impedir la eliminación de módulos con lecciones asociadas;
- buscar por título, descripción o identificador;
- visualizar el estado del módulo;
- visualizar estadísticas básicas;
- actualizar manualmente el conteo de lecciones.

### Capacidades listas para demostración

La pantalla es funcional y profesional para mostrar la administración de la estructura académica.

Soporta los niveles:

- A1;
- A2;
- B1;
- B2;
- C1;
- C2.

Esto permite que cada institución determine el alcance CEFR que desea implementar.

### Hallazgo sobre estados

El componente reconoce actualmente:

- `draft`;
- `published`.

Esta estructura proporciona una base inicial para el workflow institucional.

El modelo futuro deberá evaluar estados adicionales como:

- `pending_review`;
- `changes_requested`;
- `published`;
- `archived`.

La definición final deberá coordinarse con el modelo general de revisión académica.

### Hallazgo sobre aprobación

Actualmente la creación y edición se guardan directamente mediante:

- `createModule()`;
- `updateModule()`.

No existe todavía un flujo de:

`teacher → draft → revisión → aprobación o devolución → publicación`.

Esto es aceptable para el modelo actual con un único rol administrador, pero deberá modificarse antes de habilitar el rol docente institucional.

### Hallazgo sobre eliminación

El componente impide eliminar un módulo que contiene lecciones.

Esta protección debe conservarse.

Sin embargo, la eliminación actual no presenta:

- solicitud de eliminación;
- aprobación administrativa;
- soft delete;
- historial;
- auditoría del autor;
- reversión durante 24 horas.

El modelo institucional acordado requiere que los cambios destructivos realizados o solicitados por docentes permanezcan bajo control administrativo.

### Hallazgo sobre control de cambios

La edición actual modifica directamente el módulo existente.

Para el modelo institucional deberá evaluarse un sistema que preserve:

- versión publicada vigente;
- versión propuesta;
- autor del cambio;
- fecha del cambio;
- observaciones;
- estado de revisión;
- posibilidad de restauración.

### Hallazgo sobre conteo de lecciones

El componente permite actualizar manualmente `lessonCount`.

Debe auditarse `moduleService.js` para determinar cómo se mantiene la consistencia de este valor cuando:

- se crea una lección;
- se elimina una lección;
- se mueve una lección;
- falla parcialmente una operación.

La actualización manual no debería constituir el mecanismo principal de consistencia en producción.

### Decisión

Mantener `AdminModules.jsx` como base.

No reconstruir el componente durante la auditoría.

La pantalla está lista para demostración y para operación con el modelo administrativo actual.

Su adaptación institucional deberá realizarse junto con:

- rol `teacher`;
- workflow de revisión;
- aprobación administrativa;
- historial de cambios;
- política de eliminación y reversión.

### Archivo revisado
- `src/components/admin/ModuleForm.jsx`

### Estado actual

`ModuleForm.jsx` gestiona la creación y edición de módulos académicos.

El formulario permite definir:

- nivel CEFR;
- orden;
- título;
- descripción;
- icono;
- color;
- estado.

También calcula automáticamente el siguiente orden disponible mediante `getNextModuleOrder(levelId)`.

### Capacidades listas para demostración

- Creación y edición funcional.
- Validaciones básicas.
- Interfaz en polaco.
- Compatibilidad con niveles A1-C2.
- Estado `draft/published`.
- Personalización visual.
- Integración con la arquitectura `levels/{levelId}/modules`.

### Hallazgo crítico sobre estado inicial

El formulario utiliza actualmente:

`status: "published"`

como estado inicial para módulos nuevos.

Para el modelo institucional, el estado inicial seguro deberá ser:

`draft`

Esto evita publicaciones accidentales y permite integrar el flujo de revisión.

### Hallazgo crítico sobre publicación

El formulario permite seleccionar directamente:

- `published`;
- `draft`.

Esto es válido mientras únicamente el administrador utiliza la pantalla.

Cuando se implemente el rol `teacher`, el docente no deberá poder publicar directamente.

El cambio de estado deberá depender del rol y del workflow académico.

Se recomienda separar las acciones:

- guardar borrador;
- enviar a revisión;
- aprobar;
- publicar;
- archivar;

de los campos académicos normales del formulario.

### Hallazgo sobre auditoría

El formulario no maneja todavía campos como:

- `createdBy`;
- `updatedBy`;
- `submittedBy`;
- `reviewedBy`;
- `publishedBy`;
- fechas de cada acción;
- observaciones de revisión.

Estos datos deberán añadirse desde el servicio o una capa segura, usando el usuario autenticado.

### Hallazgo sobre orden

La validación comprueba que el orden sea mayor que cero, pero no verifica duplicados.

Debe evaluarse posteriormente:

- orden único;
- reordenamiento;
- drag and drop;
- manejo de concurrencia.

### Hallazgo sobre identificador

El formulario no permite editar `moduleId`.

Debe revisarse `moduleService.js` para verificar:

- cómo se genera;
- si es estable;
- si puede cambiar con el título;
- si evita colisiones;
- cómo se relaciona con las lecciones.

### Decisión

Mantener `ModuleForm.jsx` como base.

No modificarlo todavía durante la auditoría.

Su adaptación deberá coordinarse con:

- `moduleService.js`;
- rol `teacher`;
- workflow académico;
- auditoría de cambios;
- permisos Firestore;
- estados institucionales.

### Archivo revisado
- `src/services/moduleService.js`

### Estado actual

El servicio implementa el ciclo funcional completo de módulos:

- creación;
- consulta;
- actualización;
- eliminación;
- reordenamiento;
- consulta de lecciones asociadas;
- actualización de conteos.

Mantiene compatibilidad temporal entre la estructura modular actual y la estructura heredada de lecciones.

### Hallazgo crítico sobre estado predeterminado

El servicio define:

`DEFAULT_STATUS = "published"`

Por tanto, un módulo puede crearse publicado incluso si el formulario no envía explícitamente el estado.

La futura corrección deberá realizarse tanto en:

- `ModuleForm.jsx`;
- `moduleService.js`.

El estado seguro predeterminado deberá ser `draft`.

Cuando se implemente el rol `teacher`, las reglas de Firestore deberán impedir que un docente publique contenido modificando directamente la petición.

### Hallazgo sobre identificadores

El identificador del módulo se genera inicialmente a partir de:

- nivel;
- orden;
- título normalizado.

Después de la creación, `updateModule()` conserva el identificador original aunque cambien el título o el orden.

Esta estabilidad es positiva porque evita romper referencias de lecciones asociadas.

### Hallazgo sobre duplicados

La validación actual comprueba la existencia del identificador generado.

No garantiza estrictamente:

- título único por nivel;
- orden único por nivel.

El mensaje de error actual indica duplicidad de título, aunque técnicamente se verifica duplicidad del ID completo.

### Hallazgo crítico sobre eliminación

La eliminación utiliza `deleteDoc()`.

Actualmente no existe:

- soft delete;
- papelera;
- restauración;
- ventana de reversión;
- auditoría de eliminación;
- aprobación previa.

El parámetro `force` permite omitir la validación de lecciones asociadas.

Para el modelo institucional, las eliminaciones deberán quedar bajo control administrativo y conservar trazabilidad.

### Hallazgo sobre trazabilidad

El servicio registra fechas, pero no autores.

Existen:

- `createdAt`;
- `updatedAt`.

No existen:

- `createdBy`;
- `updatedBy`;
- `deletedBy`;
- información de revisión o publicación.

### Hallazgo sobre conteos

`lessonCount` y `publishedLessonCount` son datos desnormalizados almacenados en el módulo.

El servicio permite recalcularlos manualmente.

Debe revisarse `lessonManager.js` para determinar si estos valores se mantienen automáticamente al:

- crear;
- eliminar;
- duplicar;
- mover;
- publicar una lección.

### Hallazgo sobre compatibilidad heredada

`getLessonsByModule()` consulta primero la estructura modular nueva.

Solo consulta la estructura heredada cuando la nueva subcolección está completamente vacía.

No fusiona ambas fuentes.

Debe verificarse que la migración no haya dejado lecciones distribuidas simultáneamente entre ambas estructuras.

### Hallazgo positivo sobre reordenamiento

`reorderModules()` utiliza `writeBatch()`.

Esto permite actualizar conjuntamente el orden de múltiples módulos y constituye una buena base para una futura interfaz de reordenamiento.

### Decisión

Mantener el servicio como base.

No modificarlo durante la auditoría.

El subsistema de módulos queda funcional para demostración y para el modelo administrativo actual.

Antes del piloto institucional con docentes deberá coordinarse su evolución con:

- estado inicial `draft`;
- rol `teacher`;
- workflow de revisión;
- trazabilidad;
- eliminación reversible;
- reglas Firestore;
- consistencia automática de conteos.

### Archivo revisado
- `src/components/Lessons.jsx`

### Estado actual

El componente constituye el panel principal de gestión manual de lecciones.

Permite:

- consultar lecciones por nivel;
- agruparlas por módulo;
- filtrar por módulo;
- filtrar por grupo de edad;
- filtrar por estado;
- crear lecciones manuales;
- acceder al generador de lecciones con IA;
- editar lecciones;
- publicar y despublicar;
- eliminar lecciones;
- recalcular conteos de los módulos afectados.

### Hallazgo positivo: creación segura

Las nuevas lecciones manuales utilizan `draft` como estado predeterminado.

Esto constituye una base adecuada para evolucionar hacia un workflow institucional de revisión.

### Hallazgo crítico: workflow insuficiente

Actualmente los estados funcionales principales son:

- `draft`;
- `published`.

La publicación y despublicación se ejecutan directamente desde el panel administrativo.

No existen todavía:

- `pending_review`;
- `changes_requested`;
- `approved`;
- observaciones de revisión;
- identificación del revisor;
- identificación del publicador.

### Hallazgo crítico: edición directa de contenido publicado

La edición utiliza directamente `updateLesson()`.

No existe evidencia en este componente de:

- versionado;
- copia de la versión anterior;
- propuesta de cambio;
- aprobación de una nueva versión;
- restauración.

Una modificación sobre contenido publicado puede sustituir directamente el contenido previamente aprobado.

### Hallazgo crítico: eliminación irreversible

La eliminación utiliza confirmación visual y posteriormente ejecuta `deleteLesson()`.

No existen:

- soft delete;
- papelera;
- `deletedAt`;
- `deletedBy`;
- ventana de reversión;
- aprobación administrativa.

### Hallazgo sobre conteos

El componente ejecuta `refreshModuleLessonCount()` después de:

- crear;
- eliminar;
- actualizar;
- publicar;
- despublicar.

Esto mantiene parcialmente sincronizados los conteos.

Sin embargo, la consistencia depende de que cada flujo de la aplicación recuerde ejecutar manualmente esta operación.

Debe verificarse:

- `lessonManager.js`;
- generación de lecciones con IA;
- duplicación;
- movimientos entre módulos.

### Riesgo: movimiento entre módulos

Cuando una lección se actualiza, el componente refresca el conteo del módulo final.

No se observa actualización explícita del módulo de origen.

Si una lección cambia de módulo, el módulo anterior podría conservar un conteo incorrecto.

Debe verificarse el comportamiento de `updateLesson()`.

### Hallazgo sobre modelo heredado

El componente mantiene compatibilidad simultánea con:

- `level` y `nivel`;
- `title` y `titulo`;
- `description` y `descripcion`.

Esta compatibilidad reduce riesgos durante la migración, pero constituye deuda técnica que deberá consolidarse posteriormente.

### Hallazgo sobre trazabilidad

Las operaciones no incluyen explícitamente:

- `createdBy`;
- `updatedBy`;
- `publishedBy`;
- `deletedBy`;
- motivo del cambio;
- observaciones de revisión.

### Decisión

Mantener el componente sin modificaciones durante la auditoría.

El panel es funcional para:

- demostración universitaria;
- administración centralizada;
- gestión académica inicial.

Antes de habilitar cuentas docentes en el piloto deberán implementarse:

1. rol `teacher`;
2. rol `coordinator`;
3. workflow de revisión;
4. publicación autorizada;
5. trazabilidad;
6. versionado o historial de cambios;
7. eliminación reversible;
8. control de permisos en Firestore.

### Archivo revisado
- `src/services/lessonManager.js`

### Estado actual

El servicio centraliza la persistencia y recuperación de lecciones.

Implementa:

- consulta por nivel;
- consulta por módulo;
- recuperación completa;
- creación;
- actualización;
- eliminación;
- duplicación;
- actualización masiva;
- numeración automática;
- orden automático dentro del módulo;
- normalización de estructuras de datos;
- compatibilidad con datos heredados.

### Hallazgo crítico: movimiento entre módulos

`updateLesson()` escribe la lección directamente en el `moduleId` recibido.

No conoce el módulo anterior.

Si una lección cambia del módulo A al módulo B:

- se escribe una copia en el módulo B;
- no se elimina explícitamente la copia del módulo A.

Esto puede producir duplicación física de una misma lección entre módulos.

El riesgo también afecta potencialmente a `bulkUpdateLessons()`.

### Decisión

Corregir antes del piloto.

La actualización deberá conocer:

- módulo anterior;
- módulo nuevo.

Cuando ambos sean diferentes deberá realizarse una operación atómica que:

1. escriba la lección en el módulo nuevo;
2. elimine la lección del módulo anterior;
3. permita actualizar los conteos de ambos módulos.

### Hallazgo crítico: ausencia de versionado

Las actualizaciones utilizan `setDoc(..., { merge: true })`.

La versión anterior es sobrescrita.

No existen:

- historial de versiones;
- snapshots;
- comparación de cambios;
- restauración;
- reversión.

### Hallazgo crítico: eliminación física

`deleteLesson()` utiliza `writeBatch()` y elimina físicamente:

- la lección modular;
- la posible copia heredada.

No existen:

- soft delete;
- papelera;
- ventana de restauración;
- identidad del eliminador;
- motivo de eliminación.

### Hallazgo sobre conteos

El servicio no actualiza:

- `lessonCount`;
- `publishedLessonCount`.

Esta responsabilidad permanece en los componentes consumidores.

Como consecuencia, operaciones como:

- duplicación;
- actualización masiva;
- futuros flujos alternativos;

pueden modificar las lecciones sin sincronizar los conteos.

### Hallazgo sobre estructura heredada

`getLessonsByLevel()` consulta únicamente la estructura modular nueva.

`getLessonContent()` conserva fallback hacia la estructura heredada.

`deleteLesson()` elimina también la posible copia heredada.

Debe verificarse que no existan lecciones que permanezcan únicamente en:

`levels/{levelId}/lessons/{lessonId}`

porque no aparecerían en el listado administrativo actual.

### Hallazgo sobre timestamps

El servicio utiliza fechas ISO generadas en el cliente mediante:

`new Date().toISOString()`.

Para trazabilidad institucional deberán utilizarse timestamps confiables del servidor.

### Hallazgo sobre identidad del actor

No se almacenan:

- `createdBy`;
- `updatedBy`;
- `publishedBy`;
- `deletedBy`.

El servicio tampoco registra:

- motivo del cambio;
- observaciones;
- estado de revisión;
- identidad del revisor.

### Hallazgos positivos

- Las nuevas lecciones utilizan `draft` por defecto.
- Las duplicaciones utilizan `draft`.
- La eliminación limpia también copias heredadas.
- Existe normalización entre estructuras antiguas y nuevas.
- La recuperación de contenido dispone de mecanismos de fallback.
- Las actualizaciones masivas utilizan `writeBatch()`.

### Estado

El servicio es funcional para el modelo administrativo actual.

Antes del piloto deberá corregirse como mínimo el movimiento entre módulos.

Antes de habilitar el workflow docente deberán implementarse:

1. trazabilidad;
2. workflow de revisión;
3. versionado;
4. eliminación reversible;
5. timestamps de servidor;
6. control de permisos por rol.

### Archivo revisado
- `src/components/forms/LessonsForm.jsx`

### Estado actual

El formulario administrativo de lecciones permite:

- crear lecciones;
- editar lecciones;
- seleccionar módulo;
- modificar el orden dentro del módulo;
- editar el contenido académico mediante pestañas;
- validar campos básicos;
- advertir sobre cambios sin guardar;
- guardar borradores mediante un hook pendiente de auditoría.

### BLOQUEANTE-PILOTO B2-001 — Movimiento incorrecto entre módulos

El formulario permite cambiar el `moduleId` de una lección existente.

Sin embargo:

- no conserva explícitamente el módulo original;
- no envía `previousModuleId`;
- el servicio `updateLesson()` solamente escribe en el módulo nuevo.

Esto confirma que una lección puede permanecer físicamente en el módulo anterior y crearse también en el módulo nuevo.

#### Componentes afectados

- `LessonsForm.jsx`
- `Lessons.jsx`
- `lessonManager.js`
- sincronización de conteos de módulos

#### Decisión

Corregir antes del piloto mediante un movimiento atómico que:

1. conserve el módulo original;
2. escriba la lección en el módulo nuevo;
3. elimine la copia del módulo anterior;
4. actualice los conteos de ambos módulos.

### B2-002 — Selección automática del primer módulo

Cuando una lección no tiene `moduleId`, el formulario selecciona automáticamente el primer módulo disponible.

Esto puede provocar asignaciones accidentales.

#### Recomendación

Para nuevas lecciones:

- exigir selección consciente del módulo.

Para edición:

- conservar el módulo actual.

### B2-003 — Posible duplicidad de orden

El formulario valida que `orderInModule` sea mayor que cero, pero no verifica si otra lección utiliza el mismo orden dentro del módulo.

Esto puede generar órdenes académicos ambiguos.

### Hallazgo sobre workflow editorial

El formulario no administra directamente estados como:

- `pending_review`;
- `changes_requested`;
- `approved`.

Esto no constituye un error del modelo actual, pero deberá ampliarse antes de habilitar el rol docente.

### Hallazgo sobre borradores

El botón `Zapisz szkic` depende del hook `useFormData`.

Debe auditarse el hook para determinar:

- dónde se almacena el borrador;
- si persiste entre sesiones;
- si está asociado al usuario;
- si está asociado a una lección;
- si puede confundirse con un borrador institucional.

### Hallazgos positivos

- El nivel no puede modificarse desde el formulario.
- Toda nueva lección requiere módulo.
- El orden debe ser mayor que cero.
- Existen advertencias por cambios sin guardar.
- El formulario soporta estructuras académicas antiguas y nuevas.
- El formulario impide guardar si faltan campos básicos.

### Archivo revisado
- `src/components/forms/components/hooks/useFormData.js`

### Estado actual

El hook administra el estado local del formulario de lecciones y proporciona:

- actualización de campos simples;
- actualización de campos anidados;
- gestión de arreglos;
- detección de cambios pendientes;
- reinicio del formulario;
- guardado y carga de un borrador local.

### B2-004 — Borrador local ambiguo

La función `saveDraft()` no guarda el contenido en Firestore.

El borrador se almacena exclusivamente en `localStorage` bajo la clave:

`lessonFormDraft`

Por tanto, no constituye un borrador institucional persistente.

### Riesgos identificados

#### Clave global única

Solo puede existir un borrador local a la vez.

Guardar un segundo formulario sobrescribe el anterior.

#### Sin asociación al usuario

El borrador no contiene una separación segura por usuario autenticado.

En dispositivos compartidos podría existir exposición o mezcla de contenido entre usuarios.

#### Sin asociación a la lección

La clave no diferencia:

- nivel;
- módulo;
- lección;
- creación;
- edición.

#### Recuperación no integrada

Aunque el hook expone `loadDraft()`, `LessonsForm.jsx` no utiliza actualmente esa función.

El usuario puede guardar un borrador sin disponer de una acción visible para recuperarlo.

#### Falsa sensación de persistencia

Después de guardar en `localStorage`, el hook ejecuta:

`setIsDirty(false)`

Esto desactiva la advertencia de cambios pendientes aunque el contenido no haya sido almacenado en Firestore.

#### Borradores obsoletos

No existe limpieza mediante `localStorage.removeItem()` después de:

- guardar definitivamente;
- cancelar;
- publicar;
- eliminar.

### Decisión

El borrador local no debe confundirse con el estado académico `draft`.

Antes del piloto institucional deberá elegirse una de estas estrategias:

1. eliminar temporalmente el botón de borrador local;
2. renombrarlo explícitamente como borrador local del navegador;
3. implementar borradores institucionales reales en Firestore.

La opción recomendada para el piloto es implementar borradores persistentes en Firestore asociados a:

- usuario;
- lección;
- institución;
- fecha de actualización.

Si se conserva adicionalmente el borrador local, su clave deberá incluir al menos:

- `userId`;
- `levelId`;
- `lessonId`.

También deberá existir:

- recuperación visible;
- eliminación del borrador después del guardado definitivo;
- advertencia de que el contenido está almacenado únicamente en ese dispositivo.

### Archivo revisado
- `src/components/forms/components/utils/initialState.js`

### Estado actual

El archivo define la estructura inicial de las lecciones y de los ejercicios.

La estructura académica contempla:

- ubicación por nivel y módulo;
- orden dentro del módulo;
- estado editorial;
- objetivos;
- vocabulario;
- gramática;
- actividades;
- lectura;
- práctica interactiva;
- producción escrita;
- producción oral;
- ejercicios interactivos;
- evaluación;
- recursos;
- reflexión final;
- metadata.

### B2-005 — Duplicidad de campos de identidad

La estructura mantiene simultáneamente:

- `id`;
- `lessonId`;

y:

- `level`;
- `nivel`.

Esto refleja compatibilidad con modelos históricos, pero permite inconsistencias.

#### Decisión

No realizar una migración inmediata antes del piloto.

Definir posteriormente un modelo canónico basado en:

- `lessonId`;
- `levelId`;
- `moduleId`;
- `orderInModule`.

### B2-006 — Versionado aparente pero no funcional

La metadata contiene:

`version: "1.0"`

Sin embargo, no existe historial real de versiones.

Las actualizaciones sobrescriben el documento vigente.

No existen:

- revisiones;
- snapshots;
- comparación;
- restauración;
- incremento de versión.

El campo actual no debe considerarse un sistema de versionado.

### B2-007 — Timestamps generados en el cliente

`createdAt` y `updatedAt` se generan mediante:

`new Date().toISOString()`.

Además, nacen durante la inicialización del formulario y no necesariamente durante la persistencia real.

Para trazabilidad institucional deberán generarse mediante timestamps de servidor en las operaciones de persistencia.

### B2-008 — Resolución de `actividades[]`

La búsqueda global confirma referencias a `actividades` en:

- `initialState.js`;
- `firestoreService.js`;
- `lessonManager.js`;
- un comentario de estilos en `Nivel.css`.

No se encontraron usos funcionales en:

- las pestañas del formulario activo;
- `TabContent`;
- `LessonSectionRenderer`;
- la vista activa del estudiante.

Por tanto, `actividades[]` se clasifica como un campo legacy residual.

Sin embargo, todavía es transportado por las capas de inicialización y persistencia, por lo que no debe eliminarse durante la preparación inmediata del piloto.

Estado:

- uso pedagógico activo: no;
- persistencia por compatibilidad: sí;
- bloqueante para piloto: no;
- eliminación inmediata: no recomendada.

### Hallazgo positivo — Flujo pedagógico instrumentado

La vista del estudiante implementa una secuencia pedagógica completa:

1. introducción;
2. vocabulario;
3. gramática;
4. lectura;
5. práctica interactiva;
6. producción escrita;
7. producción oral;
8. evaluación;
9. recursos;
10. reflexión final.

Las secciones pueden registrar:

- finalización;
- puntuación;
- cantidad de preguntas;
- respuestas correctas;
- cantidad de ejercicios;
- ejercicios completados.

Esta capacidad constituye una base relevante para las métricas del piloto universitario.

### B2-009 — Duplicidad arquitectónica de práctica interactiva

La auditoría identificó dos estructuras con finalidad aparentemente equivalente:

#### Flujo activo

- modelo moderno de edición: `interactivePractice`;
- compatibilidad legacy: `practica_interactiva`;
- componente administrativo activo: `InteractivePractice.jsx`;
- pestaña activa: `practice`;
- vista del estudiante: `LessonSectionRenderer`;
- datos consumidos por el estudiante: `practica_interactiva.ejercicios`.

#### Flujo alternativo

- modelo moderno: `interactiveExercises`;
- modelo legacy: `ejercicios_interactivos`;
- componente: `interactiveExercises/index.jsx`.

La revisión de `TabContent`, `constants.js` y `LessonSectionRenderer.jsx` confirma que el flujo alternativo no forma parte del formulario administrativo activo ni de la vista principal del estudiante.

Sin embargo, la carpeta `interactiveExercises/` no está obsoleta.

`InteractivePractice.jsx` reutiliza activamente los siguientes editores:

- `interactiveExercises/FillInTheBlank.jsx`;
- `interactiveExercises/MatchingExercise.jsx`;
- `interactiveExercises/MultipleChoice.jsx`;
- `interactiveExercises/OrderExercise.jsx`.

Por tanto, debe distinguirse entre:

- carpeta `interactiveExercises/`: activa;
- editores individuales de ejercicios: activos;
- `interactiveExercises/index.jsx`: aparentemente obsoleto;
- `interactiveExercises`: modelo aparentemente residual;
- `ejercicios_interactivos`: modelo aparentemente residual.

#### Riesgo técnico

La plataforma mantiene compatibilidad entre estructuras modernas y heredadas.

Esta compatibilidad funciona actualmente, pero incrementa:

- la complejidad del modelo;
- el riesgo de divergencia;
- el costo de mantenimiento;
- la dificultad de futuras migraciones.

#### Estado

- duplicidad arquitectónica: confirmada;
- flujo principal: identificado;
- severidad: media;
- bloqueante para piloto: no;
- eliminación inmediata: no recomendada.

#### Decisión

No eliminar la carpeta `interactiveExercises/`.

Antes de retirar `interactiveExercises/index.jsx` o los campos residuales deberá verificarse:

1. ausencia de imports globales del componente `index.jsx`;
2. ausencia de consumo por otros flujos;
3. persistencia de datos históricos en Firestore;
4. compatibilidad con lecciones existentes.

La futura arquitectura deberá conservar un único modelo canónico y centralizar la compatibilidad legacy en una capa de normalización.

### B2-010 — Ejercicios sin identificador estable

La auditoría confirma que los ejercicios creados desde el flujo activo de práctica interactiva no reciben un identificador estable propio.

En `InteractivePractice.jsx`, los nuevos ejercicios se crean sin un campo `id`.

Además, el renderizado utiliza el índice del arreglo como clave:

`key={index}`

La revisión del flujo alternativo `interactiveExercises/index.jsx` confirma el mismo patrón:

- los nuevos ejercicios tampoco reciben un identificador estable;
- el renderizado también depende de la posición dentro del arreglo.

#### Riesgo técnico

La ausencia de un identificador persistente dificulta futuras funciones de:

- auditoría individual por ejercicio;
- versionado;
- analítica;
- reordenamiento;
- trazabilidad;
- comparación entre versiones;
- restauración de cambios;
- seguimiento del rendimiento por ejercicio.

Si un ejercicio cambia de posición dentro del arreglo, su identidad depende actualmente de su índice y no de una clave persistente.

#### Estado

- problema confirmado: sí;
- afecta al flujo activo: sí;
- severidad: media;
- bloqueante para piloto: no.

#### Decisión

No modificar inmediatamente el modelo antes de completar la auditoría del flujo de persistencia.

En la evolución del modelo canónico, cada ejercicio deberá disponer de un identificador estable generado al momento de su creación.

El identificador deberá:

- persistir durante las ediciones;
- permanecer estable aunque cambie el orden del ejercicio;
- permitir trazabilidad individual;
- facilitar futuras métricas y auditorías.

La implementación deberá coordinarse con el futuro sistema de versionado y trazabilidad para evitar una migración duplicada.

### B2-011 — Compatibilidad distribuida pese a existir un normalizador canónico

La compatibilidad entre modelos modernos y heredados se encuentra distribuida entre múltiples componentes y servicios.

La revisión de `src/utils/lessonNormalizer.js` confirma que la plataforma dispone de una capa específica de normalización mediante:

- `normalizeLesson()`;
- `getCanonicalLessonData()`.

Este normalizador transforma múltiples variantes históricas hacia una estructura canónica basada en `lessonData`.

La revisión posterior de `courseNavigationService.js` confirma que el flujo principal del estudiante utiliza efectivamente esta capa mediante:

`getCanonicalLessonData(mergedLesson)`

Por tanto, el problema no consiste en la ausencia del normalizador ni en que el flujo del estudiante lo omita.

El problema consiste en que la compatibilidad continúa distribuida después de la normalización.

`courseNavigationService.js`:

1. combina los datos base y el contenido de la lección;
2. obtiene el modelo canónico;
3. reconstruye una capa de compatibilidad legacy;
4. entrega un objeto híbrido con estructuras originales, legacy y canónicas.

Además, otros formularios y componentes continúan implementando aliases y transformaciones propias.

#### Riesgo técnico

La coexistencia de:

- normalización centralizada;
- reconstrucción posterior de estructuras legacy;
- compatibilidad dentro de formularios;
- aliases dentro de componentes de presentación;

puede producir comportamientos diferentes según el flujo utilizado para leer, editar, guardar o renderizar una lección.

También dificulta determinar:

- qué estructura constituye la fuente de verdad;
- qué componentes dependen todavía del modelo legacy;
- qué aliases pueden retirarse de forma segura.

#### Estado

- problema confirmado: sí;
- normalizador central existente: sí;
- uso en el flujo principal del estudiante: confirmado;
- compatibilidad posterior distribuida: confirmada;
- severidad: media;
- bloqueante para piloto: no.

#### Decisión

No crear un nuevo normalizador.

La plataforma deberá conservar `lessonNormalizer.js` como capa central y auditar progresivamente los consumidores del modelo académico.

La evolución futura deberá:

1. identificar qué componentes consumen campos canónicos;
2. identificar cuáles dependen todavía de campos legacy;
3. migrar progresivamente esos consumidores;
4. reducir la reconstrucción de compatibilidad histórica;
5. hacer que el modelo canónico sea la fuente uniforme para los flujos activos.

No debe eliminarse la compatibilidad actual durante la preparación inmediata del piloto.

### B2-012 — Constantes de actividades no utilizadas

La búsqueda global confirma que las constantes:

- `MIN_ACTIVITIES`;
- `MAX_ACTIVITIES`;

solo aparecen en:

- su declaración dentro de `constants.js`;
- el documento de auditoría.

No existen referencias funcionales a:

- `MIN_ACTIVITIES`;
- `MAX_ACTIVITIES`;
- `LIMITS.MIN_ACTIVITIES`;
- `LIMITS.MAX_ACTIVITIES`.

Este resultado complementa B2-008, donde se confirmó que `actividades[]` no participa actualmente en:

- las pestañas del formulario;
- `TabContent`;
- `LessonSectionRenderer`;
- la vista activa del estudiante.

#### Clasificación

Las constantes se consideran configuración residual no utilizada.

#### Estado

- problema confirmado: sí;
- uso funcional actual: no;
- severidad: baja;
- bloqueante para piloto: no.

#### Decisión

No es necesario modificar estas constantes durante la preparación inmediata del piloto.

Podrán eliminarse posteriormente durante una limpieza controlada del modelo legacy, coordinada con:

- la revisión de `actividades[]`;
- la limpieza de campos residuales;
- la consolidación del modelo canónico de lecciones.

No debe interpretarse su existencia como una validación activa del número mínimo o máximo de actividades.


### B2-013 — Compatibilidad adicional en la vista del estudiante

La revisión de `LessonSectionRenderer.jsx` confirma que la vista del estudiante implementa directamente múltiples aliases para soportar distintas versiones del modelo de datos:

- `type / tipo`;
- `question / pregunta`;
- múltiples variantes de respuesta correcta;
- `term / termino / palabra`;
- `translation / traduccion`;
- `definition / definicion`;
- `example / ejemplo`;
- `evaluation / evaluacion`;
- `questions / cuestionario / quiz`;
- `selfAssessment / autoevaluacion`;
- `title / titulo`;
- `description / descripcion`;
- `audience / audiencia`.

La revisión posterior de `courseNavigationService.js` permite precisar este hallazgo.

`LessonSectionRenderer.jsx` no recibe directamente los datos crudos obtenidos desde Firestore.

Antes de llegar al renderer, la lección atraviesa el siguiente flujo:

`Firestore → getLessonContentFromModule() → buildLessonDetails() → getCanonicalLessonData() → useCourseNavigation → Nivel.jsx → LessonSectionRenderer.jsx`

Por tanto, el flujo principal del estudiante sí utiliza el normalizador canónico.

Sin embargo, `buildLessonDetails()` reconstruye después una capa de compatibilidad legacy mediante:

`buildLegacyCompatibilityLayer(canonicalLesson)`

El renderer recibe finalmente un objeto híbrido que contiene:

- datos originales;
- estructuras legacy reconstruidas;
- estructura canónica.

#### Hallazgo

Los aliases existentes en `LessonSectionRenderer.jsx` no demuestran que la vista reciba datos sin normalizar.

Demuestran que la compatibilidad histórica continúa existiendo incluso después de la normalización central.

El renderer mantiene una segunda capa defensiva de interpretación sobre un objeto que ya contiene representaciones canónicas y legacy.

#### Riesgo técnico

Esta estrategia:

- aumenta la complejidad del renderer;
- dificulta identificar qué aliases siguen siendo realmente necesarios;
- prolonga la dependencia de estructuras históricas;
- complica la eliminación segura de campos legacy;
- puede ocultar inconsistencias entre el modelo canónico y las estructuras reconstruidas.

#### Estado

- problema confirmado: sí;
- flujo previo por el normalizador: confirmado;
- objeto recibido por la vista: híbrido;
- aliases adicionales en el renderer: confirmados;
- severidad: media;
- bloqueante para piloto: no.

#### Decisión

No eliminar los aliases existentes durante la preparación inmediata del piloto.

Debe identificarse progresivamente cuáles aliases siguen siendo necesarios después de la ejecución de `buildLessonDetails()`.

La evolución futura deberá migrar `LessonSectionRenderer.jsx` hacia el consumo del modelo canónico y retirar únicamente aquellas compatibilidades cuya ausencia haya sido verificada en:

- lecciones actuales;
- lecciones históricas;
- contenido creado manualmente;
- contenido generado mediante IA.

El objetivo final será que el renderer reciba una estructura uniforme y no necesite reinterpretar variantes históricas.

### B2-014 — El flujo del estudiante normaliza y reconstruye compatibilidad legacy

La revisión de `courseNavigationService.js` confirma que el flujo principal del estudiante utiliza el normalizador canónico.

La cadena comprobada es:

`Firestore → getLessonContentFromModule() → buildLessonDetails() → getCanonicalLessonData() → useCourseNavigation → Nivel.jsx → LessonSectionRenderer.jsx`

Dentro de `buildLessonDetails()` se ejecuta:

`getCanonicalLessonData(mergedLesson)`

Por tanto, las lecciones pasan por `lessonNormalizer.js` antes de ser entregadas a la vista del estudiante.

Sin embargo, inmediatamente después de obtener el modelo canónico, el servicio ejecuta:

`buildLegacyCompatibilityLayer(canonicalLesson)`

Esta función reconstruye estructuras heredadas para:

- `titulo`;
- `descripcion`;
- `objetivos`;
- `contenidos`;
- `lectura`;
- `practica_interactiva`;
- `produccion_escrita`;
- `produccion_oral`;
- `evaluacion`;
- `recursos_adicionales`;
- `reflexion_final`.

El objeto final se construye combinando:

- `...mergedLesson`;
- `...legacyCompatibility`;
- `...canonicalLesson`.

#### Hallazgo

El problema no consiste en que el flujo del estudiante omita el normalizador.

El flujo sí normaliza, pero posteriormente vuelve a generar estructuras heredadas para mantener compatibilidad con componentes existentes.

Como resultado, `lessonDetails` no constituye un modelo canónico puro, sino un objeto híbrido que contiene simultáneamente:

- datos originales;
- representaciones legacy;
- representación canónica.

#### Aspecto positivo

La arquitectura actual constituye una estrategia de migración progresiva.

Permite:

- mantener funcionando lecciones históricas;
- proteger componentes todavía dependientes del modelo legacy;
- introducir el modelo canónico sin realizar una migración destructiva inmediata.

#### Riesgo técnico

La estrategia también:

- prolonga la dependencia del modelo legacy;
- dificulta identificar qué estructura consume cada componente;
- permite que nuevos componentes continúen utilizando campos heredados;
- aumenta la complejidad del objeto académico;
- dificulta retirar definitivamente los aliases históricos.

#### Estado

- normalización en el flujo del estudiante: confirmada;
- uso de `lessonNormalizer.js`: confirmado;
- reconstrucción posterior de compatibilidad legacy: confirmada;
- modelo entregado a la vista: híbrido;
- severidad: media;
- bloqueante para piloto: no.

#### Decisión

No eliminar `buildLegacyCompatibilityLayer()` durante la preparación inmediata del piloto.

La compatibilidad actual protege el funcionamiento de lecciones y componentes existentes.

La evolución futura deberá realizarse progresivamente:

1. identificar qué componentes todavía consumen campos legacy;
2. migrarlos al modelo canónico;
3. verificar las lecciones históricas;
4. reducir gradualmente la capa de compatibilidad;
5. eliminar los aliases únicamente cuando ningún flujo activo dependa de ellos.

El objetivo final será:

`Firestore → lessonNormalizer.js → modelo canónico → componentes`

sin reconstrucción posterior innecesaria de estructuras legacy.

#### Alcance confirmado

La búsqueda global de:

- `buildLessonDetails`;
- `buildLegacyCompatibilityLayer`;

confirma que ambas funciones están localizadas exclusivamente en:

`src/services/courseNavigationService.js`

Las demás coincidencias corresponden únicamente al documento de auditoría.

Esto permite concluir que la construcción explícita del objeto híbrido no está distribuida entre múltiples servicios.

La estrategia:

`datos originales → normalización canónica → reconstrucción legacy → objeto híbrido`

se encuentra encapsulada en el servicio de navegación académica utilizado por la vista del estudiante.

#### Valoración arquitectónica

Este encapsulamiento constituye un aspecto positivo.

Aunque el modelo entregado a la vista continúa siendo híbrido, la lógica responsable de construirlo está centralizada en un único punto.

Esto reduce el riesgo de:

- implementaciones divergentes de la capa legacy;
- duplicación de la reconstrucción híbrida;
- comportamientos diferentes entre múltiples servicios de navegación.

La deuda técnica permanece principalmente en los componentes que todavía consumen aliases o estructuras heredadas, no en una multiplicación de servicios que reconstruyan el objeto híbrido.

#### Estado actualizado

- construcción del objeto híbrido: centralizada;
- servicio responsable: `courseNavigationService.js`;
- duplicación de `buildLessonDetails()`: no detectada;
- duplicación de `buildLegacyCompatibilityLayer()`: no detectada;
- alcance principal confirmado: flujo de navegación del estudiante;
- severidad: media;
- bloqueante para piloto: no.

### Archivo revisado
- `src/pages/AdminAILessons.jsx`

### B2-015 — Página contenedora del generador de lecciones con IA

`AdminAILessons.jsx` funciona como página contenedora del generador administrativo de lecciones mediante IA.

Su responsabilidad se limita a:

- proporcionar la estructura visual de la página;
- renderizar `AILessonGenerator`;
- integrarse con la ruta administrativa `/admin/ai-lessons`.

La protección de acceso se realiza externamente mediante `AdminRoute` desde la configuración de rutas en `App.jsx`.

#### Hallazgos

El archivo no contiene lógica de:

- generación mediante IA;
- validación académica;
- selección de módulo;
- persistencia;
- revisión;
- aprobación;
- publicación.

Estas responsabilidades están delegadas a:

`src/components/admin/AILessonGenerator.jsx`

y a los servicios utilizados por dicho componente.

#### Estado

- estructura de página: correcta;
- protección administrativa: confirmada;
- problemas funcionales detectados: ninguno;
- severidad: informativa;
- bloqueante para piloto: no.

#### Decisión

Mantener `AdminAILessons.jsx` sin cambios.

La auditoría del flujo de generación de lecciones mediante IA debe continuar en:

`src/components/admin/AILessonGenerator.jsx`

### B2-016 — Flujo de generación IA controlado

La revisión de `AILessonGenerator.jsx` confirma que la generación de lecciones mediante IA sigue un flujo controlado.

La secuencia implementada es:

Administrador

↓

selección de:

- nivel;
- módulo;
- grupo etario;
- tema.

↓

generación mediante agentes IA

↓

previsualización completa

↓

guardado como borrador

↓

edición manual

↓

publicación posterior desde el panel de lecciones.

La IA no publica contenido automáticamente.

#### Hallazgo

La plataforma utiliza la IA únicamente como herramienta de asistencia para la creación de contenido académico.

La decisión final permanece bajo control humano.

#### Estado

- generación automática: sí;
- publicación automática: no;
- revisión humana obligatoria: sí;
- bloqueante para piloto: no.

#### Valoración

Esta arquitectura coincide con el modelo pedagógico definido para el piloto universitario.

### B2-017 — La IA genera lecciones integradas al curso

La generación de contenido mediante IA utiliza información estructural del curso antes de iniciar la generación.

Cada lección incorpora:

- nivel;
- módulo;
- orden dentro del módulo;
- identificador académico;
- grupo etario.

Esto garantiza que el contenido generado pertenezca desde su creación a la estructura académica del curso.

#### Estado

Implementación correcta.

No requiere cambios para el piloto.

### B2-018 — Toda lección generada por IA nace como borrador

La generación automática establece de forma explícita:

- status = draft;
- approvedByTeacher = false;
- createdByAI = true;
- generatedByAI = true.

Esto impide que contenido generado automáticamente sea visible para los estudiantes sin intervención humana.

#### Estado

Correcto.

Coincide con el modelo editorial definido para el piloto universitario.

### B2-019 — Trazabilidad del contenido generado mediante IA

Cada borrador generado incorpora información suficiente para reconstruir su origen.

Se registra:

- usuario creador;
- correo del creador;
- metadata IA;
- reporte de auditoría;
- idioma objetivo;
- idioma de soporte;
- nivel;
- módulo;
- orden académico;
- timestamps.

#### Valoración

La trazabilidad supera la requerida para el piloto universitario.

Constituye una base adecuada para futuras funciones de auditoría institucional.

### B2-020 — Persistencia duplicada de las lecciones generadas

El generador IA guarda la lección simultáneamente en:

levels/{level}/modules/{module}/lessons

y

levels/{level}/lessons

Esta duplicidad mantiene compatibilidad con la arquitectura histórica.

#### Riesgo

Puede producir:

- duplicidad de mantenimiento;
- inconsistencias futuras;
- necesidad de sincronización.

#### Estado

No bloqueante para el piloto.

Debe revisarse durante la futura consolidación del modelo académico.

# B3 — Usabilidad del Editor Académico

## Objetivo

Evaluar la experiencia de creación y edición de contenido académico desde la perspectiva del docente, identificando oportunidades de mejora relacionadas con productividad, consistencia, accesibilidad y experiencia de usuario antes de iniciar la producción masiva del currículo.

---

## B3-001 — Reubicar botones "Agregar" al final de cada lista

### Problema

En múltiples secciones del editor los botones para agregar nuevos elementos se encuentran al inicio del listado.

Cuando existen numerosos elementos (vocabulario, ejercicios, recursos, objetivos, etc.) el docente debe desplazarse continuamente hacia la parte superior para agregar nuevos registros.

### Impacto

- disminuye la productividad durante la creación de contenido;
- incrementa el desplazamiento vertical;
- hace más lenta la edición de lecciones extensas.

### Estado

- problema confirmado: sí;
- afecta múltiples formularios: sí;
- bloqueante para piloto: no;
- prioridad: alta.

### Decisión

Mover los botones **"Agregar"** al final de cada colección dinámica para mantener el flujo natural de edición.

---

## B3-002 — El ejercicio Matching no admite respuestas duplicadas

### Problema

El ejercicio de tipo **Matching** impide utilizar el mismo valor de la columna derecha para más de una pareja.

Ejemplo válido:

```
I    → am
You  → are
He   → is
She  → is
```

Actualmente la segunda utilización de **"is"** queda bloqueada.

### Impacto

- limita la creación de ejercicios gramaticales;
- produce actividades incorrectas para contenidos reales;
- afecta la calidad pedagógica del ejercicio.

### Estado

- problema confirmado: sí;
- afecta ejercicios Matching: sí;
- bloqueante para piloto: no;
- prioridad: alta.

### Decisión

Modificar el modelo interno para que las asociaciones utilicen identificadores independientes y no el texto visible como clave única.

---

## B3-003 — Creación masiva de objetivos

### Problema

Actualmente cada objetivo debe agregarse individualmente.

Durante la creación de lecciones completas esto obliga al docente a copiar y pegar cada objetivo por separado.

### Impacto

- aumenta el tiempo de edición;
- dificulta la creación de lecciones extensas;
- reduce la productividad.

### Estado

- problema confirmado: sí;
- bloqueante para piloto: no;
- prioridad: alta.

### Decisión

Permitir pegar múltiples objetivos separados por líneas.

El sistema deberá generar automáticamente un objetivo independiente por cada línea.

---

## B3-004 — El campo "Notatka dydaktyczna" debe admitir texto multilínea

### Problema

Las observaciones didácticas frecuentemente requieren varios párrafos, ejemplos y comparaciones.

Actualmente el campo resulta demasiado limitado para este propósito.

### Impacto

- limita la calidad de las explicaciones;
- dificulta documentar errores frecuentes;
- reduce el valor pedagógico del contenido.

### Estado

- problema confirmado: sí;
- bloqueante para piloto: no;
- prioridad: alta.

### Decisión

Convertir el campo en un **textarea multilínea** con altura suficiente para explicaciones extensas.

---

## B3-005 — Traducción completa de filtros y etiquetas administrativas al polaco

### Problema

Algunos filtros y controles administrativos permanecen parcialmente en inglés.

### Impacto

- genera inconsistencias visuales;
- reduce la uniformidad de la interfaz administrativa.

### Estado

- problema confirmado: sí;
- bloqueante para piloto: no;
- prioridad: media.

### Decisión

Completar la localización al polaco antes del piloto universitario.

---

## B3-006 — Estado inicial del panel de filtros

### Problema

El panel de filtros aparece expandido al ingresar al administrador de lecciones.

Ocupa una parte importante del área útil de trabajo.

### Impacto

- reduce el espacio disponible para visualizar las lecciones;
- obliga al usuario a cerrar manualmente el panel en cada ingreso.

### Estado

- problema confirmado: sí;
- bloqueante para piloto: no;
- prioridad: media.

### Decisión

Mostrar el panel inicialmente colapsado y permitir que el usuario lo expanda únicamente cuando lo necesite.

---

# Mejoras futuras (Versión posterior al piloto)

Las siguientes observaciones corresponden a oportunidades de evolución funcional detectadas durante la creación de contenido académico. No constituyen problemas del piloto, sino funcionalidades de una versión posterior de la plataforma.

---

## B3-101 — Explicación pedagógica de respuestas del Quiz

### Propuesta

Agregar dos nuevos campos opcionales a cada pregunta del cuestionario:

- Explanation
- Learning Objective

### Beneficio

La plataforma podrá explicar inmediatamente por qué una respuesta es correcta y qué concepto académico está evaluando.

Esto permitirá una retroalimentación mucho más rica y facilitará futuros sistemas de aprendizaje adaptativo mediante IA.

---

## B3-102 — Renombrar "Notatka dydaktyczna"

### Propuesta

Evaluar cambiar el nombre del campo:

```
Notatka dydaktyczna
```

por

```
Wskazówka dydaktyczna
```

### Beneficio

El nuevo nombre representa mejor la función pedagógica del campo y favorece la consistencia del contenido generado.

---

## B3-103 — Personajes permanentes del curso

### Propuesta

Crear un conjunto estable de personajes que acompañen al estudiante durante todo el currículo.

Ejemplo:

- Emma
- Tom
- Anna
- David
- Sophie
- Lucas

### Beneficio

Incrementa la continuidad narrativa, mejora la retención del vocabulario y aporta identidad propia al curso.

---

## B3-104 — Continuidad narrativa entre lecturas

### Propuesta

Las lecturas deberán formar una historia continua.

Cada lectura deberá preparar naturalmente la siguiente lección.

### Beneficio

Genera una experiencia de aprendizaje más inmersiva y coherente, similar a la utilizada por materiales académicos de Cambridge y Oxford.

---

## B3-105 — Campo "Skill Assessed"

### Propuesta

Agregar opcionalmente un nuevo campo:

- Vocabulary
- Grammar
- Reading
- Listening
- Speaking
- Inference
- Main Idea
- Detail

### Beneficio

Permitirá que la IA identifique patrones de desempeño y recomiende actividades específicas para reforzar las habilidades con mayores dificultades.

---

## B3-106 — Retroalimentación automática de pronunciación

### Propuesta

Después de cada grabación de voz, incorporar una evaluación automática mediante IA.

Ejemplo:

- Pronunciation Score
- Fluency
- Grammar
- Vocabulary
- Personalized Feedback (Polish)

### Beneficio

Convertirá la sección **Speaking** en un verdadero tutor de pronunciación y comunicación oral.

---

## B3-107 — Metadatos avanzados para recursos

### Propuesta

Agregar metadatos opcionales a cada recurso adicional:

- Difficulty
- Estimated Duration
- Skill
- Official Source

### Beneficio

Permitirá recomendaciones inteligentes de recursos según las necesidades individuales del estudiante.

---

## B3-108 — Pegado inteligente desde IA

### Propuesta

Permitir pegar bloques completos generados por IA para que el formulario distribuya automáticamente el contenido en sus respectivos campos.

### Beneficio

Reducirá significativamente el tiempo requerido para crear nuevas lecciones.

---

## B3-109 — Importación masiva de lecciones

### Propuesta

Permitir importar una lección completa desde un documento estructurado.

### Beneficio

Facilitará la creación masiva de contenido y disminuirá el trabajo manual del equipo docente.

---

# B4. Auditoría del módulo **CEFR Placement Test**

**Estado:** ✅ Finalizado (Versión piloto universitaria)

**Fecha:** Julio 2026

**Auditor:** Revisión técnica integral del módulo Test CEFR.

---

# Objetivo de la auditoría

Durante esta fase se realizó una revisión exhaustiva del módulo **CEFR Placement Test**, con el objetivo de verificar que el sistema pudiera utilizarse durante el piloto universitario con un comportamiento consistente, confiable y técnicamente sólido.

La auditoría incluyó tanto la revisión del código fuente como pruebas funcionales manuales y pruebas asistidas mediante IA (Gemini 2.5 Flash).

Se verificaron especialmente:

- estructura de datos
- flujo del examen
- persistencia
- cálculo de resultados
- evaluación automática de escritura
- arquitectura del servicio IA
- experiencia del usuario
- tiempos de respuesta
- robustez ante respuestas incorrectas
- preparación para futuras mejoras.

---

# Componentes auditados

Durante esta etapa fueron revisados los siguientes componentes.

## Administración

- Test.jsx
- TestsSection.jsx
- testService.js
- firestoreService.js

---

## Motor del examen

- TestResults.jsx
- TestLevelResultModal.jsx
- cálculo de resultados por sección
- cálculo de resultados por nivel
- cálculo de pesos
- lógica de aprobación
- progresión entre niveles

---

## Servicios IA

```
services/ai/
```

Revisión completa de:

- aiService.js
- geminiProvider.js
- writingEvaluationService.js
- writingEvaluatorPrompt.js

---

## Firestore

Se revisó:

- almacenamiento de resultados
- recuperación de pruebas
- carga de niveles
- lectura de preguntas
- persistencia de evaluaciones
- integración con Gemini

---

# Correcciones realizadas

Durante la auditoría se corrigieron diversos problemas detectados.

## 1. Recuperación de pruebas

### Problema

El sistema intentaba llamar:

```
getAllTests()
```

aunque dicha función no existía dentro de testService.js.

Esto ocasionaba errores como:

```
TypeError:
getAllTests is not a function
```

y la pantalla de administración aparecía vacía.

### Solución

Se reconstruyó completamente:

```
testService.js
```

incluyendo todas las funciones públicas necesarias.

Resultado:

✅ recuperación correcta de pruebas

✅ administración funcional

---

## 2. Banco completo de pruebas CEFR

Se construyeron completamente los exámenes de:

- A1
- A2
- B1
- B2
- C1
- C2

Cada nivel contiene:

- Multiple Choice
- Writing
- Reading

Todos los textos fueron revisados manualmente para evitar:

- respuestas duplicadas
- ambigüedad
- inconsistencias gramaticales
- errores CEFR.

---

## 3. Evaluación IA

Se sustituyó el flujo inicial por un evaluador especializado para escritura CEFR.

Se implementó:

```
writingEvaluationService.js
```

con:

- normalización
- validación
- detección de errores
- detección de idiomas
- detección de respuestas irrelevantes
- ponderación
- manejo de fallos
- modo degradado cuando Gemini no responde.

---

## 4. Prompt especializado

Se rediseñó completamente:

```
writingEvaluatorPrompt.js
```

El nuevo prompt obliga a Gemini a evaluar:

- cumplimiento de la tarea
- gramática
- vocabulario
- coherencia
- registro
- mecánica
- adecuación CEFR

además de detectar automáticamente:

- off topic
- mezcla de idiomas
- copia
- repetición
- texto sin sentido
- lenguaje ofensivo

y devolver únicamente JSON válido.

---

## 5. Integración IA

Se verificó completamente:

```
aiService.js
```

y

```
geminiProvider.js
```

quedando correctamente integrados con el nuevo evaluador.

Se comprobó:

- envío del prompt
- recepción JSON
- reintentos
- timeout
- manejo de errores
- respuesta válida
- recuperación automática.

---

---

# B4.1 Pruebas funcionales realizadas

Durante la auditoría se ejecutaron pruebas manuales, funcionales y de integración sobre todos los niveles del examen CEFR.

El objetivo fue verificar el comportamiento completo del sistema desde la perspectiva de un estudiante y desde la perspectiva técnica del sistema.

---

# 1. Pruebas sobre Multiple Choice

Se verificó:

- carga correcta de preguntas
- carga correcta de respuestas
- respuestas únicas
- respuesta correcta única
- cálculo del porcentaje
- almacenamiento en Firestore
- recuperación posterior

Resultado:

✅ Correcto.

No se encontraron problemas de funcionamiento.

---

# 2. Pruebas sobre Reading

Se verificó:

- carga de textos
- carga de preguntas
- evaluación
- cálculo
- almacenamiento

Resultado:

✅ Correcto.

No se encontraron inconsistencias.

---

# 3. Pruebas sobre Writing

Esta fue la sección más auditada debido a su complejidad.

Se realizaron múltiples escenarios.

---

## Escenario 1

Respuesta correcta y relacionada con la pregunta.

Resultado esperado:

- alta puntuación
- aprobación

Resultado obtenido:

✅ correcto.

---

## Escenario 2

Respuesta completamente fuera del tema.

Ejemplo:

El estudiante escribía un texto completamente diferente al solicitado.

Resultado esperado:

- baja puntuación
- detección Off Topic

Resultado obtenido:

✅ correcto.

Gemini detectó correctamente que la respuesta no resolvía la tarea.

---

## Escenario 3

Respuesta mezclando inglés y español.

Resultado esperado:

- penalización importante.

Resultado obtenido:

✅ correcto.

Gemini detectó contenido en otro idioma.

---

## Escenario 4

Texto repetido.

Se utilizó copy/paste repetitivo.

Resultado esperado:

- fuerte penalización.

Resultado obtenido:

✅ correcto.

---

## Escenario 5

Texto suficientemente largo pero irrelevante.

Se escribieron más de cien palabras sin responder la pregunta.

Resultado esperado:

- Task Achievement muy bajo.

Resultado obtenido:

✅ correcto.

---

## Escenario 6

Respuesta con buena gramática pero incorrecta respecto al ejercicio.

Resultado esperado:

- buena gramática
- baja puntuación final

Resultado obtenido:

✅ correcto.

Este escenario permitió confirmar que el sistema ya no evalúa únicamente si el inglés es correcto, sino también si realmente responde a la tarea solicitada.

---

# 4. Validación del Prompt

El prompt fue refinado varias veces.

Durante la auditoría se detectó que Gemini inicialmente otorgaba puntuaciones demasiado altas.

Posteriormente se añadieron restricciones específicas para:

- detectar respuestas fuera del tema
- detectar mezcla de idiomas
- detectar repetición
- detectar respuestas copiadas
- detectar lenguaje ofensivo
- detectar contenido sin sentido

Resultado:

La calidad de evaluación mejoró significativamente.

---

# 5. Validación del servicio de evaluación

Se auditó completamente:

writingEvaluationService.js

Se verificó:

- normalización
- validación
- parsing JSON
- ponderación
- manejo de errores
- evaluación degradada
- integración con Gemini

Resultado:

✅ correcto.

---

# 6. Validación del proveedor Gemini

Se revisó:

geminiProvider.js

Pruebas realizadas:

- timeout
- reintentos
- errores HTTP
- respuestas vacías
- respuestas JSON
- parsing

Resultado:

✅ correcto.

---

# 7. Validación del flujo IA

Se verificó:

Pregunta

↓

Prompt

↓

Gemini

↓

JSON

↓

Normalización

↓

Resultado final

↓

Firestore

↓

Visualización

Resultado:

✅ correcto.

---

# 8. Tiempos de respuesta

Durante las pruebas se observaron tiempos aproximados de:

Primera respuesta IA:

10 a 22 segundos.

En algunos casos:

hasta 25 segundos.

El tiempo depende principalmente del procesamiento realizado por Gemini y no del sistema desarrollado.

El procesamiento local representa una fracción mínima del tiempo total.

---

# 9. Observaciones detectadas

Durante la auditoría se detectaron varios aspectos susceptibles de mejora.

Estos elementos no impiden el funcionamiento del piloto universitario, pero quedan registrados para futuras iteraciones del producto.

## 9.1 Restricción de reingreso

Actualmente el sistema bloquea el acceso al examen durante el período configurado.

Sin embargo, debería permitirse:

- ingresar nuevamente
- consultar el estado del examen
- consultar el resultado obtenido

sin permitir presentar un nuevo intento.

Estado:

Pendiente.

---

## 9.2 Temporizador de reintento

Debe verificarse que el período configurado (1 día, 4 días, 21 días, etc.) realmente expire correctamente.

Actualmente se requiere una validación específica.

Estado:

Pendiente.

---

## 9.3 Copia exacta del ejemplo

Actualmente un estudiante podría copiar exactamente el texto de ejemplo.

En futuras versiones deberá detectarse este comportamiento y penalizarse automáticamente.

Estado:

Pendiente.

---

## 9.4 Barras de progreso

Actualmente las barras avanzan al cambiar de sección.

El comportamiento esperado debería ser:

incrementar únicamente cuando las preguntas realmente hayan sido contestadas.

Esto permitirá representar el progreso real del examen.

Estado:

Pendiente.

---

## 9.5 Reanudación del examen

Actualmente un estudiante puede abandonar el examen y volver a ingresar desde el inicio.

El comportamiento esperado es:

- restaurar automáticamente el punto exacto donde abandonó el examen
- mantener respuestas anteriores
- restaurar el temporizador

Estado:

Pendiente.

---

## 9.6 Penalización por abandonar

En futuras versiones se propone:

- penalización temporal
- reducción del tiempo restante
- registro del abandono

como mecanismo antifraude.

Estado:

Pendiente.

---

## 9.7 Cambio de pestaña

En versiones posteriores se evaluará:

- detectar pérdida de foco
- detectar cambio de pestaña
- detectar múltiples abandonos

con fines estadísticos y antifraude.

No se recomienda bloquear inmediatamente al estudiante.

Estado:

Pendiente.

---

## 9.8 Administración de preguntas

Dentro del panel de administración se recomienda mover el botón:

"Dodaj zadanie"

al final del formulario.

Esto mejora considerablemente la experiencia del administrador.

Estado:

Pendiente.

---

# Conclusión de las pruebas

Después de todas las pruebas realizadas se concluye que el módulo **CEFR Placement Test** presenta un comportamiento estable y suficientemente robusto para ser utilizado durante el piloto universitario.

Las incidencias encontradas corresponden principalmente a mejoras de experiencia de usuario y funcionalidades avanzadas, no a errores críticos del sistema.

El flujo completo:

Creación del examen → Presentación → Evaluación → IA → Cálculo → Persistencia → Visualización

ha sido validado satisfactoriamente.

Estado general del módulo:

🟢 APROBADO PARA PILOTO UNIVERSITARIO.

---

# B4.2 Riesgos residuales

Después de la auditoría se identifican los siguientes riesgos residuales.

| Riesgo | Impacto | Probabilidad | Estado |
|---------|----------|-------------|--------|
| Dependencia de disponibilidad de Gemini | Medio | Bajo | Aceptado |
| Variación de tiempos de respuesta de IA | Bajo | Medio | Aceptado |
| Cambios futuros en la API de Gemini | Medio | Bajo | Monitorear |
| Posible copia del texto de ejemplo | Bajo | Medio | Pendiente |
| Reanudación incompleta del examen | Medio | Bajo | Pendiente |
| Progreso visual basado en secciones y no preguntas | Bajo | Alto | Pendiente |

Los riesgos anteriores no impiden la realización del piloto universitario.

Se consideran riesgos aceptables para una versión piloto controlada.

---

# B4.3 Conclusión de auditoría

Después de la revisión completa del módulo **CEFR Placement Test**, se concluye que la arquitectura implementada cumple los objetivos definidos para la versión piloto universitaria.

Se verificó satisfactoriamente:

- arquitectura general
- flujo completo del examen
- persistencia en Firestore
- integración con Gemini
- evaluación automática de escritura
- cálculo de resultados
- progresión entre niveles
- almacenamiento de resultados
- funcionamiento de los servicios IA
- robustez ante respuestas incorrectas
- validación de escenarios fuera del tema
- detección de mezcla de idiomas
- evaluación CEFR basada en criterios

Durante la auditoría fueron identificadas diversas oportunidades de mejora relacionadas principalmente con experiencia de usuario y mecanismos avanzados de control del examen.

Ninguna de las observaciones encontradas constituye un bloqueo para la ejecución del piloto universitario.

Por lo tanto, el módulo **CEFR Placement Test** queda aprobado para su utilización durante el piloto universitario.

---

## Estado final

| Área | Estado |
|------|--------|
| Arquitectura | ✅ Aprobada |
| Firestore | ✅ Aprobado |
| Servicios IA | ✅ Aprobados |
| Evaluación Writing | ✅ Aprobada |
| Reading | ✅ Aprobado |
| Multiple Choice | ✅ Aprobado |
| Flujo completo | ✅ Aprobado |
| Persistencia | ✅ Aprobada |
| Panel administrativo | ✅ Aprobado |
| Preparación para piloto | ✅ Aprobada |

---

**Resultado de auditoría**

🟢 **APROBADO PARA PILOTO UNIVERSITARIO**

Versión auditada:

**CEFR Placement Test v1.0**

Fecha:

Julio 2026

# B5 — Auditoría del módulo de Autenticación y Soporte al Usuario

**Estado:** ✅ Finalizado (Versión piloto universitaria)

**Fecha:** Julio 2026

**Auditor:** Revisión técnica integral del módulo de autenticación, registro y soporte al usuario.

---

# Objetivo de la auditoría

Durante esta fase se realizó una revisión integral del módulo de autenticación y soporte al usuario con el objetivo de verificar su preparación para el piloto universitario.

La auditoría no se limitó al funcionamiento del inicio de sesión y del registro de usuarios. También se evaluó la arquitectura interna del código, la separación de responsabilidades, la reutilización de componentes, la internacionalización de la interfaz, la accesibilidad y la preparación del sistema para futuras funcionalidades institucionales.

Como resultado de esta etapa se ejecutó una refactorización arquitectónica completa del módulo, manteniendo la compatibilidad funcional con la versión anterior, pero mejorando significativamente la organización interna del código, la mantenibilidad y la escalabilidad de la plataforma.

---

# Componentes auditados

## Autenticación

- `src/pages/Login.jsx`
- `src/pages/Register.jsx`

## Soporte

- `src/pages/Contact.jsx`

## Servicios

- `src/services/support/`
  - supportService.js
  - supportValidation.js
  - index.js

## Componentes reutilizables

- SupportHeader
- SupportInfoCards
- SupportUserInfo
- SupportCategorySelect
- SupportSubjectField
- SupportMessageField
- SupportSubmitButton
- SupportForm
- SupportSuccess

## Arquitectura

Se revisó especialmente:

- separación de responsabilidades;
- validaciones;
- accesibilidad;
- reutilización de componentes;
- internacionalización;
- persistencia en Firestore;
- organización de servicios;
- desacoplamiento entre interfaz y lógica de negocio.

---

# B5.1 — Refactorización del módulo Login

### Archivo revisado

- `src/pages/Login.jsx`

### Estado actual

El módulo de autenticación fue completamente refactorizado.

La lógica de autenticación quedó desacoplada de la presentación mediante una arquitectura más modular y mantenible.

La autenticación continúa utilizando Firebase Authentication, pero la organización interna del código fue simplificada y preparada para futuras ampliaciones del sistema.

### Capacidades listas

- Interfaz completamente en polaco.
- Validaciones mejoradas.
- Manejo uniforme de errores.
- Mejor accesibilidad.
- Separación entre lógica y presentación.
- Código más limpio y mantenible.
- Preparado para futuras integraciones con autenticación institucional y MFA.

### Hallazgos

La refactorización no modificó el comportamiento funcional del proceso de autenticación.

El objetivo principal fue mejorar la arquitectura interna y reducir el acoplamiento del componente.

### Decisión

Se considera la nueva implementación como la base oficial del sistema de autenticación de la plataforma.

---

# B5.2 — Refactorización del módulo Register

### Archivo revisado

- `src/pages/Register.jsx`

### Estado actual

El formulario de registro fue completamente reconstruido.

La nueva implementación desacopla la lógica de negocio de la interfaz y centraliza las validaciones del proceso de registro.

### Capacidades listas

- Interfaz completamente traducida al polaco.
- Validaciones centralizadas.
- Mejor experiencia de usuario.
- Componentización del formulario.
- Comentarios JSDoc en inglés.
- Arquitectura preparada para futuras ampliaciones.

### Hallazgos

La refactorización mejora significativamente la mantenibilidad sin alterar el comportamiento funcional del registro.

La estructura obtenida facilita futuras integraciones con modelos institucionales y nuevos flujos de autenticación.

### Decisión

Mantener esta implementación como base del sistema institucional de registro de usuarios.

---

# B5.3 — Refactorización completa del módulo Contact

### Archivo revisado

- `src/pages/Contact.jsx`

### Estado actual

La página fue reconstruida completamente.

El componente dejó de contener lógica de negocio y pasó a funcionar exclusivamente como orquestador de componentes especializados.

Toda la persistencia fue trasladada al nuevo módulo de servicios.

### Capacidades listas

- Arquitectura desacoplada.
- Formularios reutilizables.
- Separación entre presentación y lógica.
- Internacionalización al polaco.
- Preparado para futuras funcionalidades.

### Hallazgos

La nueva implementación elimina el acceso directo a Firestore desde la interfaz.

Toda la comunicación con la capa de persistencia quedó encapsulada dentro del módulo de servicios de soporte.

### Decisión

La arquitectura actual constituye la base definitiva para la evolución del sistema de soporte de la plataforma.

---

# B5.4 — Creación del módulo Support

### Archivos revisados

- `src/services/support/`
- `src/components/support/`

### Estado actual

Se creó un nuevo subsistema completo para la gestión de solicitudes de soporte.

La solución adopta una arquitectura por capas donde la interfaz, las validaciones, la lógica de negocio y la persistencia permanecen completamente desacopladas.

### Arquitectura implementada

```
UI Components

        │

        ▼

SupportForm

        │

        ▼

supportValidation

        │

        ▼

supportService

        │

        ▼

Firestore
```

### Capacidades listas

- Creación de tickets autenticados.
- Creación de mensajes públicos.
- Validaciones centralizadas.
- Manejo uniforme de errores.
- Componentes reutilizables.
- Prevención de doble envío.
- Manejo de estados de carga.
- Preparado para historial de tickets.
- Preparado para adjuntos.
- Preparado para FAQ.
- Preparado para integración futura con panel administrativo.

### Hallazgos

Ningún componente visual conoce Firestore ni Firebase.

Toda la comunicación con la capa de persistencia se realiza exclusivamente mediante la capa de servicios.

Esta arquitectura reduce el acoplamiento y facilita futuras modificaciones de infraestructura.

### Decisión

Adoptar esta arquitectura como patrón de referencia para futuros módulos de la plataforma.

---

# B5.5 — Internacionalización del módulo

### Alcance revisado

Se auditó la interfaz completa del sistema de autenticación y soporte.

### Estado actual

Toda la interfaz visible para el usuario fue migrada al idioma polaco.

Los comentarios técnicos y la documentación JSDoc permanecen en inglés.

### Hallazgos

Se estableció una política uniforme para todo el proyecto:

- interfaz de usuario en polaco;
- comentarios técnicos en inglés;
- documentación JSDoc en inglés.

Esta separación mejora la experiencia del usuario y facilita el mantenimiento del código por parte de futuros desarrolladores.

### Decisión

Adoptar esta política como estándar oficial para todos los nuevos módulos de la plataforma.

---

# B5.6 — Arquitectura basada en componentes reutilizables

### Alcance revisado

Se evaluó la nueva organización de componentes implementada durante la refactorización del sistema de autenticación y soporte.

### Estado actual

La plataforma evoluciona hacia una arquitectura basada en componentes especializados y reutilizables.

Cada componente posee una única responsabilidad claramente definida.

La lógica de negocio, las validaciones y la persistencia permanecen desacopladas de la interfaz de usuario.

### Hallazgos

La nueva estructura reduce considerablemente el tamaño de los componentes principales.

Además:

- mejora la reutilización del código;
- facilita las pruebas unitarias;
- simplifica el mantenimiento;
- favorece la incorporación de nuevas funcionalidades;
- reduce el acoplamiento entre módulos.

La arquitectura implementada constituye una mejora significativa respecto a la versión inicial de la plataforma.

### Decisión

Se adopta oficialmente la componentización desacoplada como criterio arquitectónico para el desarrollo futuro del proyecto.

---

# Conclusión de la auditoría

La revisión realizada confirma que el módulo de autenticación y soporte presenta una arquitectura significativamente más sólida que la versión original.

La refactorización ejecutada permitió mejorar la organización interna del sistema sin afectar su comportamiento funcional.

La nueva arquitectura facilita la evolución del producto hacia escenarios institucionales de mayor complejidad, permitiendo incorporar nuevas funcionalidades sin necesidad de rediseñar nuevamente el módulo.

---

# Estado final

| Área | Estado |
|------|--------|
| Login | ✅ Aprobado |
| Register | ✅ Aprobado |
| Contact | ✅ Aprobado |
| Arquitectura Support | ✅ Aprobada |
| Internacionalización | ✅ Aprobada |
| Componentización | ✅ Aprobada |
| Preparación para crecimiento | ✅ Aprobada |

---

# Resultado de auditoría

🟢 **APROBADO PARA PILOTO UNIVERSITARIO**

Versión auditada:

**Authentication & Support Module v1.0**

Fecha:

**Julio 2026**

# B6 — Auditoría del módulo Topics y Missions

**Estado:** 🟡 Preparado para pruebas finales de aceptación

**Fecha:** Julio 2026

**Auditor:** Revisión técnica integral del sistema de temas, navegación académica, conversaciones con IA y motor de misiones.

---

# Objetivo de la auditoría

Durante esta fase se realizó una revisión exhaustiva del núcleo pedagógico de la plataforma, compuesto por el sistema de Temas (Topics) y el sistema de Misiones (Missions).

Este módulo constituye el principal diferenciador funcional del producto frente a plataformas tradicionales de aprendizaje de idiomas, ya que integra contenidos académicos estructurados con conversaciones dinámicas asistidas por Inteligencia Artificial.

La auditoría tuvo como objetivos principales:

- verificar la arquitectura general del sistema;
- revisar el flujo completo de navegación entre temas y misiones;
- validar la integración con Firestore;
- revisar la comunicación con Gemini;
- reducir complejidad arquitectónica;
- disminuir el consumo innecesario de llamadas a IA;
- mejorar la mantenibilidad del código;
- preparar el módulo para futuras ampliaciones académicas.

Durante esta etapa no se realizaron únicamente correcciones funcionales.

Gran parte del trabajo consistió en una refactorización profunda de la arquitectura del módulo con el propósito de simplificar responsabilidades, eliminar estados redundantes y mejorar la experiencia del usuario.

---

# Componentes auditados

## Navegación de Temas

- ThemeProvider
- ThemeSelector
- ThemeCard
- Topics
- Home
- Welcome

---

## Motor de Misiones

- MissionPlayer
- MissionChat
- MissionHeader
- MissionProgress
- MissionFinishPanel
- MissionSummary
- MissionCompletion
- MissionEvaluation

---

## Hooks

Se revisaron especialmente:

- useMissionPlayer
- hooks relacionados con navegación
- hooks de persistencia
- hooks de progreso

---

## Servicios

Se auditaron los servicios responsables de:

- recuperación de temas;
- recuperación de misiones;
- persistencia del progreso;
- comunicación con Firestore;
- comunicación con Gemini;
- evaluación de conversaciones;
- cálculo de progreso.

---

## Firestore

Se revisó especialmente:

- estructura de Topics;
- estructura de Missions;
- progreso del usuario;
- almacenamiento de conversaciones;
- persistencia de resultados;
- recuperación de estado.

---

## Inteligencia Artificial

Se auditó la integración con:

- Gemini 2.5 Flash
- prompts de misión
- evaluación automática
- generación de respuestas
- flujo de finalización
- control de consumo de llamadas.

---

# Arquitectura revisada

La arquitectura completa del sistema se evaluó siguiendo el flujo funcional real utilizado por el estudiante.

El recorrido principal auditado fue el siguiente:

```

Usuario

↓

Welcome

↓

Selección de Tema

↓

Listado de Misiones

↓

Inicio de conversación

↓

Mission Player

↓

Conversación con IA

↓

Evaluación

↓

Persistencia

↓

Retroalimentación

↓

Actualización del progreso

```

La auditoría verificó cada uno de estos pasos tanto desde la perspectiva funcional como desde la perspectiva arquitectónica.

---

# Objetivos arquitectónicos alcanzados

Como resultado del proceso de auditoría se consiguieron los siguientes objetivos:

- reducción del acoplamiento entre componentes;
- simplificación del flujo de navegación;
- disminución de estados redundantes;
- separación más clara de responsabilidades;
- reducción del número de llamadas innecesarias a Gemini;
- mejora del rendimiento general del módulo;
- preparación para futuras funcionalidades académicas.

La arquitectura obtenida facilita considerablemente la evolución futura del producto y reduce la complejidad del mantenimiento del código.

---

# Alcance de la refactorización

La revisión no se limitó a corregir errores puntuales.

Se ejecutó una refactorización estructural del módulo con énfasis en:

- arquitectura;
- experiencia de usuario;
- rendimiento;
- mantenibilidad;
- consumo de IA;
- claridad del flujo pedagógico.

Como consecuencia, varios componentes fueron simplificados y otros fueron reorganizados para eliminar lógica duplicada o responsabilidades innecesarias.

El resultado constituye una base mucho más sólida para la evolución del sistema de aprendizaje conversacional.

# B6.1 — Auditoría del sistema de Topics (Temas)

## Objetivo

El sistema de Topics constituye la puerta de entrada al aprendizaje conversacional de la plataforma.

Su responsabilidad consiste en organizar el contenido académico en contextos temáticos, facilitando una progresión natural entre escenarios de conversación y permitiendo que el estudiante practique el idioma dentro de situaciones cercanas a la vida real.

La auditoría tuvo como objetivo verificar:

- arquitectura del sistema;
- navegación entre temas;
- persistencia del tema seleccionado;
- integración con Firestore;
- reutilización de componentes;
- experiencia de usuario;
- preparación para futuras ampliaciones del catálogo académico.

---

## Componentes auditados

Se revisaron principalmente:

- ThemeProvider
- ThemeSelector
- ThemeCard
- Home
- Welcome
- Topics
- servicios relacionados con Themes
- integración con Firestore

---

## Arquitectura revisada

El flujo funcional auditado fue el siguiente:

```

Usuario

↓

Welcome

↓

ThemeSelector

↓

Selección de Tema

↓

Persistencia del Tema

↓

Listado de Misiones

↓

Inicio de Mission Player

```

La auditoría verificó tanto la experiencia del usuario como la separación de responsabilidades entre los distintos componentes.

---

# B6.1.1 — ThemeProvider

### Archivo revisado

- ThemeProvider

### Estado actual

El sistema utiliza un proveedor centralizado para administrar el tema académico seleccionado por el estudiante.

Este proveedor evita que cada componente tenga que consultar Firestore de manera independiente.

La información permanece disponible para toda la aplicación mediante contexto compartido.

### Capacidades listas

- tema seleccionado disponible globalmente;
- actualización automática de componentes consumidores;
- reducción de consultas repetidas;
- arquitectura preparada para nuevos módulos.

### Hallazgos

La utilización de un contexto central mejora considerablemente la cohesión del sistema y evita duplicidad de lógica relacionada con la selección del tema.

### Decisión

Mantener ThemeProvider como único punto de acceso al tema activo.

No se recomienda que otros componentes gestionen directamente este estado.

---

# B6.1.2 — ThemeSelector

### Archivo revisado

- ThemeSelector.jsx

### Estado actual

El selector de temas fue revisado para simplificar la interacción del estudiante durante el ingreso al sistema.

La interfaz permite visualizar claramente los temas disponibles antes de comenzar las conversaciones con IA.

### Capacidades listas

- selección intuitiva;
- integración con ThemeProvider;
- actualización automática del estado;
- interfaz consistente con el resto de la plataforma.

### Hallazgos

La arquitectura desacopla completamente la presentación del mecanismo de persistencia.

El componente únicamente comunica la selección realizada.

Toda la administración del estado queda delegada al proveedor correspondiente.

### Decisión

Mantener el componente enfocado exclusivamente en la interacción del usuario.

La lógica de negocio debe permanecer fuera del componente visual.

---

# B6.1.3 — ThemeCard

### Archivo revisado

- ThemeCard.jsx

### Estado actual

Cada tema se representa mediante un componente independiente encargado únicamente de la presentación visual de la información.

La estructura facilita la incorporación de nuevos temas sin modificar la navegación principal.

### Capacidades listas

- reutilización;
- diseño uniforme;
- escalabilidad;
- mantenimiento simplificado.

### Hallazgos

La componentización reduce considerablemente la complejidad del selector de temas.

Cada tarjeta mantiene una única responsabilidad.

### Decisión

Mantener la arquitectura basada en componentes individuales para representar cada tema.

---

# B6.1.4 — Welcome

### Archivo revisado

- Welcome.jsx

### Estado actual

La pantalla de bienvenida fue reorganizada durante el proceso de auditoría para integrarse de forma más natural con el nuevo flujo de navegación.

Actualmente constituye el punto inicial de acceso para usuarios no autenticados y presenta una experiencia más consistente con el resto de la plataforma.

### Capacidades listas

- integración con autenticación;
- integración con selección de temas;
- navegación simplificada;
- experiencia inicial más clara.

### Hallazgos

La reorganización permitió reducir lógica duplicada y mejorar la claridad del flujo inicial de aprendizaje.

### Decisión

Mantener Welcome como punto de entrada principal de la plataforma.

---

# B6.1.5 — Home

### Archivo revisado

- Home.jsx

### Estado actual

La pantalla principal fue ajustada para trabajar correctamente con el nuevo sistema de temas y con el flujo de navegación hacia las misiones.

El componente mantiene una función principalmente organizadora, delegando responsabilidades específicas a componentes especializados.

### Capacidades listas

- navegación hacia Topics;
- navegación hacia Missions;
- integración con ThemeProvider;
- arquitectura desacoplada.

### Hallazgos

El componente evita concentrar lógica de negocio compleja y actúa como coordinador del flujo principal de navegación.

### Decisión

Conservar Home como orquestador del sistema de aprendizaje.

---

# B6.1.6 — Integración con Firestore

### Estado actual

La auditoría verificó que la información de los temas pueda recuperarse correctamente desde Firestore y mantenerse disponible durante la navegación del estudiante.

La arquitectura desacopla la persistencia del resto de componentes visuales.

### Capacidades listas

- recuperación de temas;
- sincronización con el estado de la aplicación;
- preparación para ampliaciones futuras.

### Hallazgos

La separación entre Firestore y la interfaz facilita cambios futuros en la estructura de almacenamiento sin afectar la experiencia del usuario.

### Decisión

Mantener la persistencia encapsulada dentro de la capa de servicios.

Los componentes visuales no deben acceder directamente a Firestore.

---

# Conclusión de la auditoría del sistema Topics

La revisión confirma que el sistema de Topics proporciona una base sólida para organizar el contenido conversacional de la plataforma.

La arquitectura obtenida favorece:

- reutilización de componentes;
- separación de responsabilidades;
- mantenibilidad;
- escalabilidad;
- incorporación de nuevos temas académicos.

El módulo queda preparado para soportar el crecimiento del catálogo de conversaciones y constituye el punto de partida del sistema de aprendizaje basado en misiones.

# B6.2 — Auditoría del Mission Player

## Objetivo

El componente Mission Player constituye el núcleo del aprendizaje conversacional de la plataforma.

Es el responsable de coordinar toda la interacción entre el estudiante, la Inteligencia Artificial, el sistema de progreso académico y la persistencia de resultados.

Durante esta auditoría se revisó profundamente tanto su funcionamiento como su arquitectura interna.

El objetivo principal fue simplificar el flujo de ejecución, reducir el acoplamiento entre componentes, eliminar estados redundantes y disminuir el consumo innecesario de llamadas al modelo Gemini.

---

## Componentes auditados

Se revisaron principalmente:

- MissionPlayer.jsx
- MissionHeader.jsx
- MissionProgress.jsx
- MissionFinishPanel.jsx
- MissionSummary.jsx
- useMissionPlayer.js
- servicios de evaluación
- integración con Firestore
- integración con Gemini

---

## Flujo funcional auditado

La auditoría verificó el recorrido completo seguido por el estudiante durante una misión.

```

Usuario

↓

Selecciona misión

↓

MissionPlayer

↓

Conversación con IA

↓

Actualización del progreso

↓

Cumplimiento del mínimo de respuestas

↓

Finalización de misión

↓

Evaluación IA

↓

Persistencia

↓

Retroalimentación

↓

Actualización del progreso académico

```

Cada uno de estos pasos fue revisado individualmente para identificar oportunidades de simplificación y optimización.

---

# B6.2.1 — Refactorización arquitectónica del Mission Player

### Archivo revisado

- MissionPlayer.jsx

### Estado inicial

La versión inicial concentraba múltiples responsabilidades dentro del componente principal.

Además de controlar la interfaz, administraba diversos estados relacionados con la evaluación semántica, el progreso de la misión y la habilitación del proceso de finalización.

Como consecuencia, el flujo resultaba difícil de seguir y de mantener.

### Hallazgos

Durante la revisión se identificó la existencia de varios estados cuya responsabilidad se solapaba o que habían quedado como resultado de la evolución histórica del componente.

Entre ellos se encontraban estados relacionados con:

- evaluación previa;
- progreso semántico;
- análisis intermedio;
- estados de revisión;
- acciones posteriores de evaluación.

La coexistencia de estos estados aumentaba la complejidad del flujo y hacía más difícil comprender cuándo una misión realmente debía finalizar.

### Refactorización realizada

Se simplificó significativamente la responsabilidad del componente.

MissionPlayer pasó a concentrarse únicamente en:

- administrar la conversación;
- mostrar el progreso;
- coordinar la finalización;
- actualizar la interfaz.

Toda la lógica especializada quedó delegada a componentes y servicios específicos.

### Resultado

La nueva arquitectura presenta un flujo considerablemente más simple, con menor cantidad de estados internos y una responsabilidad claramente definida para cada componente.

---

# B6.2.2 — Simplificación del flujo de finalización

### Estado inicial

Originalmente el sistema realizaba dos procesos diferentes de evaluación.

El primero ocurría al alcanzar el número mínimo de intervenciones del estudiante.

Posteriormente se ejecutaba una segunda evaluación cuando el usuario decidía finalizar la misión.

Este comportamiento implicaba dos llamadas independientes al modelo Gemini.

### Problemas detectados

Durante la auditoría se identificaron varias consecuencias negativas:

- incremento innecesario del consumo de IA;
- duplicidad de procesamiento;
- mayor complejidad del código;
- dificultad para comprender el flujo de ejecución;
- incremento del tiempo total de espera del usuario.

### Arquitectura anterior

```
Número mínimo alcanzado

↓

Evaluación IA

↓

Botón Finalizar

↓

Nueva evaluación IA

↓

Resultado final
```

### Arquitectura implementada

La arquitectura fue simplificada eliminando completamente la evaluación intermedia.

Actualmente el número mínimo de respuestas únicamente habilita el botón de finalización.

La evaluación mediante IA ocurre una única vez.

```
Número mínimo alcanzado

↓

Habilitar botón Finalizar

↓

Usuario decide finalizar

↓

Única evaluación IA

↓

Resultado final
```

### Beneficios obtenidos

La nueva arquitectura proporciona:

- menor consumo de Gemini;
- menor tiempo de espera;
- flujo más fácil de comprender;
- menor complejidad del código;
- reducción significativa del número de estados internos.

Esta decisión constituye una de las mejoras arquitectónicas más importantes realizadas durante la auditoría.

---

# B6.2.3 — Eliminación de estados redundantes

Durante la revisión se eliminaron diversos estados internos que ya no aportaban valor al nuevo flujo simplificado.

La refactorización permitió retirar variables relacionadas con:

- progreso semántico;
- análisis intermedio;
- solicitud previa de evaluación;
- estados de revisión;
- acciones posteriores de validación.

### Hallazgos

La eliminación de estos estados redujo considerablemente el número de condiciones que debía evaluar MissionPlayer durante su ejecución.

Como consecuencia, el flujo de navegación resulta actualmente mucho más predecible y sencillo de mantener.

### Decisión

Mantener únicamente aquellos estados estrictamente necesarios para controlar:

- conversación;
- carga;
- progreso;
- finalización;
- actualización visual.

Todo procesamiento adicional deberá permanecer encapsulado en componentes especializados o servicios independientes.

---

# B6.2.4 — Separación de responsabilidades

Uno de los principales objetivos de esta auditoría consistió en reforzar la separación de responsabilidades entre los distintos componentes del sistema.

La nueva arquitectura establece claramente las funciones de cada elemento.

MissionPlayer coordina el flujo general.

MissionHeader administra la información superior de la misión.

MissionProgress representa visualmente el avance del estudiante.

MissionFinishPanel administra el proceso de finalización.

useMissionPlayer concentra la lógica reutilizable del flujo.

Los servicios especializados gestionan la comunicación con Firestore y Gemini.

### Resultado

La distribución de responsabilidades obtenida reduce significativamente el acoplamiento entre componentes y facilita futuras ampliaciones del sistema sin necesidad de modificar el núcleo del Mission Player.

# B6.3 — Componentización del flujo de misiones

## Objetivo

Uno de los principales objetivos de la auditoría consistió en transformar el sistema de misiones desde una arquitectura basada en un componente con múltiples responsabilidades hacia una arquitectura formada por componentes pequeños, especializados y fácilmente mantenibles.

La revisión permitió redistribuir las responsabilidades del flujo conversacional, consiguiendo una separación mucho más clara entre la presentación, el progreso, la finalización de la misión y la lógica de negocio.

Como resultado, el sistema quedó preparado para futuras ampliaciones sin incrementar la complejidad del componente principal.

---

# B6.3.1 — MissionHeader

### Archivo revisado

- `MissionHeader.jsx`

### Estado actual

MissionHeader concentra exclusivamente la información superior de la misión.

El componente presenta información contextual al estudiante mientras la conversación permanece activa.

### Responsabilidades

- título de la misión;
- descripción;
- información contextual;
- controles superiores;
- estados visuales de carga.

### Hallazgos

Durante la auditoría se eliminaron dependencias innecesarias con estados internos del Mission Player.

El componente dejó de participar en decisiones relacionadas con la evaluación de la misión.

### Resultado

MissionHeader quedó convertido en un componente puramente de presentación.

Su única responsabilidad consiste en representar el estado visual superior de la misión.

---

# B6.3.2 — MissionProgress

### Archivo revisado

- `MissionProgress.jsx`

### Estado inicial

La versión anterior intentaba representar simultáneamente:

- progreso de conversación;
- progreso semántico;
- estados de análisis;
- habilitación para evaluación;
- información derivada de múltiples procesos internos.

Como consecuencia, el componente terminó reflejando decisiones arquitectónicas que pertenecían realmente al sistema de evaluación.

### Problemas detectados

Se identificaron varios indicadores cuyo significado resultaba ambiguo para el usuario.

Entre ellos:

- progreso semántico;
- estados de análisis;
- solicitudes de evaluación;
- indicadores intermedios.

La interfaz transmitía información técnica que no aportaba valor al proceso de aprendizaje.

### Refactorización realizada

MissionProgress fue reconstruido para representar únicamente el progreso observable por el estudiante.

Actualmente informa exclusivamente:

- respuestas realizadas;
- respuestas mínimas requeridas;
- porcentaje de avance de la conversación.

### Beneficios

La nueva implementación:

- reduce complejidad;
- mejora la comprensión del progreso;
- elimina indicadores técnicos;
- simplifica considerablemente el componente.

### Decisión

MissionProgress no debe conocer información relacionada con Gemini ni con la evaluación semántica.

Su responsabilidad queda limitada exclusivamente al progreso visible del estudiante.

---

# B6.3.3 — MissionFinishPanel

### Archivo revisado

- `MissionFinishPanel.jsx`

### Estado actual

El componente concentra exclusivamente el proceso de finalización de la misión.

Su función consiste en presentar al usuario las acciones disponibles una vez alcanzado el número mínimo de intervenciones.

### Hallazgos

Durante la refactorización se eliminó la dependencia de múltiples estados relacionados con evaluaciones previas.

El panel dejó de participar en procesos intermedios y pasó a coordinar únicamente la solicitud de finalización.

### Resultado

MissionFinishPanel se convirtió en el único punto de entrada para iniciar la evaluación definitiva de la misión.

Esta arquitectura evita duplicidad de decisiones dentro del flujo conversacional.

---

# B6.3.4 — useMissionPlayer

### Archivo revisado

- `useMissionPlayer.js`

### Estado inicial

El hook concentraba gran cantidad de estados derivados del flujo histórico del sistema.

Algunos de estos estados eran utilizados únicamente por arquitecturas anteriores de evaluación.

### Refactorización realizada

Durante la auditoría se eliminaron múltiples estados que dejaron de tener utilidad después de simplificar el flujo general.

También se eliminaron funciones relacionadas con la invalidación manual de estados de evaluación.

El hook quedó centrado exclusivamente en:

- conversación;
- progreso;
- persistencia;
- finalización;
- comunicación con los servicios.

### Beneficios

La reducción de estados produjo:

- menor complejidad;
- menor acoplamiento;
- código más legible;
- mantenimiento simplificado.

### Decisión

Toda lógica adicional relacionada con evaluación deberá implementarse mediante servicios especializados y no mediante nuevos estados dentro del hook principal.

---

# B6.3.5 — Nuevo modelo de responsabilidades

Como resultado de la auditoría, la arquitectura del sistema quedó claramente distribuida entre componentes especializados.

```
MissionPlayer

│

├── MissionHeader

├── MissionProgress

├── MissionChat

├── MissionFinishPanel

└── useMissionPlayer

            │

            ▼

Servicios

            │

            ▼

Firestore + Gemini
```

Cada componente posee una única responsabilidad claramente definida.

Esto facilita:

- mantenimiento;
- pruebas;
- evolución del sistema;
- incorporación de nuevas funcionalidades.

---

# B6.3.6 — Beneficios arquitectónicos obtenidos

La nueva arquitectura permitió alcanzar varios objetivos importantes.

### Reducción del acoplamiento

Los componentes dejaron de depender de estados internos que pertenecían a otros módulos.

### Mayor reutilización

Cada componente puede evolucionar de forma independiente.

### Mejor mantenibilidad

La reducción del tamaño y de la complejidad de cada componente facilita futuras modificaciones.

### Escalabilidad

La arquitectura permite incorporar nuevas funcionalidades sin necesidad de modificar continuamente MissionPlayer.

### Claridad del flujo

Cada componente posee una responsabilidad única y fácilmente identificable.

Esta organización reduce considerablemente la curva de aprendizaje para nuevos desarrolladores que participen en el proyecto.

---

# Conclusión

La componentización realizada durante esta auditoría constituye uno de los cambios arquitectónicos más importantes del sistema de misiones.

El nuevo diseño reduce la complejidad del código, mejora la mantenibilidad y establece una base sólida para la evolución futura del aprendizaje conversacional asistido por Inteligencia Artificial.

La separación clara entre componentes de presentación, lógica de negocio y servicios especializados representa una mejora significativa respecto a la arquitectura original.

# B6.4 — Optimización del flujo de evaluación mediante Inteligencia Artificial

## Objetivo

Durante la auditoría se revisó completamente el flujo de evaluación de las misiones conversacionales con el objetivo de reducir el consumo de recursos de Inteligencia Artificial, simplificar la arquitectura del sistema y mejorar la experiencia del estudiante.

La revisión permitió identificar un flujo de evaluación redundante que realizaba múltiples llamadas al modelo Gemini durante una misma misión.

Como resultado, se diseñó e implementó una nueva arquitectura basada en una única evaluación final.

---

# B6.4.1 — Arquitectura original

### Estado inicial

La primera implementación realizaba dos evaluaciones independientes sobre una misma conversación.

La primera evaluación ocurría automáticamente cuando el estudiante alcanzaba el número mínimo de respuestas requeridas.

Posteriormente, cuando el estudiante decidía finalizar la misión, el sistema ejecutaba nuevamente otra evaluación completa utilizando exactamente la misma conversación.

El flujo original era el siguiente:

```

Conversación

↓

Número mínimo alcanzado

↓

Evaluación IA

↓

Habilitación del botón Finalizar

↓

Usuario decide finalizar

↓

Nueva evaluación IA

↓

Resultado definitivo

```

---

### Problemas detectados

Durante la auditoría se identificaron varias consecuencias negativas.

#### Consumo innecesario de IA

La conversación era enviada dos veces al modelo Gemini.

Esto duplicaba el consumo de tokens y aumentaba el costo potencial del sistema.

---

#### Mayor tiempo de espera

El estudiante debía esperar dos procesos independientes de evaluación.

Esto incrementaba innecesariamente la duración de la misión.

---

#### Complejidad arquitectónica

La existencia de dos evaluaciones obligaba al sistema a mantener múltiples estados internos relacionados con:

- progreso semántico;
- solicitud de evaluación;
- análisis intermedio;
- revisión;
- evaluación definitiva.

Estos estados incrementaban considerablemente la complejidad del Mission Player.

---

#### Mayor dificultad de mantenimiento

El flujo de ejecución resultaba difícil de comprender incluso para el propio equipo de desarrollo.

La lógica de evaluación estaba distribuida entre varios componentes y múltiples estados internos.

---

# B6.4.2 — Revisión arquitectónica

Durante la auditoría se analizó el verdadero objetivo del número mínimo de respuestas.

Se concluyó que dicho requisito no debía utilizarse como disparador de una evaluación mediante IA.

Su única finalidad pedagógica consiste en garantizar que el estudiante haya mantenido una conversación suficientemente extensa antes de permitir la finalización de la misión.

En consecuencia, la evaluación intermedia dejó de tener sentido desde el punto de vista arquitectónico.

---

# B6.4.3 — Nueva arquitectura implementada

Como resultado del análisis se diseñó un flujo considerablemente más simple.

```

Conversación

↓

Número mínimo alcanzado

↓

Habilitar botón Finalizar

↓

Usuario decide finalizar

↓

Única evaluación IA

↓

Persistencia

↓

Retroalimentación

↓

Actualización del progreso

```

La evaluación mediante Gemini ocurre únicamente cuando el estudiante decide finalizar la misión.

No existe ninguna evaluación previa.

---

# B6.4.4 — Beneficios obtenidos

## Reducción del consumo de IA

Cada misión genera una única llamada al modelo Gemini.

La eliminación de la evaluación intermedia reduce aproximadamente a la mitad el consumo de recursos destinados a la evaluación conversacional.

---

## Simplificación del código

La desaparición del flujo intermedio permitió eliminar múltiples estados y condiciones del Mission Player.

El nuevo flujo resulta considerablemente más fácil de comprender y mantener.

---

## Mejor experiencia del estudiante

El estudiante percibe un comportamiento más natural.

El sistema simplemente le informa cuándo ya puede finalizar la misión.

La evaluación ocurre únicamente cuando realmente decide hacerlo.

---

## Mayor coherencia pedagógica

La conversación permanece completamente libre de interrupciones técnicas.

El estudiante conversa de forma continua hasta decidir finalizar la actividad.

Esto hace que la experiencia sea más cercana a una conversación real.

---

# B6.4.5 — Simplificación de estados internos

La nueva arquitectura permitió eliminar diversos estados que únicamente existían para soportar la evaluación intermedia.

Entre ellos se encontraban estados relacionados con:

- progreso semántico;
- análisis previo;
- solicitud de evaluación;
- revisión intermedia;
- acciones posteriores de evaluación.

La reducción de estados disminuye considerablemente la complejidad cognitiva del sistema.

---

# B6.4.6 — Separación entre reglas pedagógicas y evaluación IA

Uno de los cambios conceptuales más importantes obtenidos durante la auditoría consiste en separar claramente dos responsabilidades diferentes.

## Regla pedagógica

El número mínimo de respuestas constituye una regla académica.

Su única función consiste en determinar cuándo el estudiante puede solicitar la evaluación final.

No representa una medida automática de calidad de la conversación.

---

## Evaluación mediante IA

La calidad de la conversación es determinada exclusivamente mediante la evaluación realizada por Gemini.

El modelo analiza la conversación completa y determina si la misión fue cumplida satisfactoriamente.

Ambas responsabilidades quedaron completamente desacopladas.

---

# B6.4.7 — Preparación para futuras evoluciones

La nueva arquitectura permite incorporar futuras mejoras sin modificar nuevamente el flujo principal.

Entre ellas:

- nuevos modelos de IA;
- distintos proveedores de evaluación;
- rúbricas especializadas;
- criterios adaptativos;
- evaluación multinivel;
- evaluación por competencias;
- análisis conversacional avanzado.

La lógica principal del Mission Player permanecerá inalterada.

---

# B6.4.8 — Impacto arquitectónico

La simplificación del flujo de evaluación representa una de las decisiones arquitectónicas más relevantes adoptadas durante esta auditoría.

Los principales beneficios obtenidos son:

- reducción del consumo de IA;
- menor complejidad del sistema;
- menor tiempo de espera;
- código más mantenible;
- flujo pedagógico más natural;
- arquitectura preparada para futuras ampliaciones.

Esta decisión constituye uno de los pilares sobre los cuales continuará evolucionando el sistema conversacional de la plataforma.

---

# Conclusión

La auditoría permitió transformar un flujo complejo basado en múltiples evaluaciones hacia una arquitectura considerablemente más simple, eficiente y mantenible.

La separación entre las reglas pedagógicas y la evaluación realizada por Inteligencia Artificial mejora tanto la experiencia del estudiante como la calidad técnica del sistema.

La nueva arquitectura reduce el costo operativo del módulo, simplifica el mantenimiento y proporciona una base sólida para futuras evoluciones del aprendizaje conversacional asistido por IA.

# B6.5 — Auditoría de la integración con Inteligencia Artificial (Gemini)

## Objetivo

La presente auditoría evaluó la integración entre el sistema de aprendizaje conversacional y el proveedor de Inteligencia Artificial utilizado durante el desarrollo de la plataforma.

El análisis no se limitó al funcionamiento del modelo Gemini, sino que revisó la arquitectura completa de integración, el desacoplamiento entre la lógica de negocio y el proveedor de IA, el manejo de errores, la eficiencia operativa y la capacidad de evolución futura.

Uno de los objetivos principales consistió en garantizar que la plataforma no dependiera estructuralmente de un proveedor específico de Inteligencia Artificial.

---

# Alcance de la auditoría

Se revisaron principalmente los siguientes aspectos:

- integración con Gemini 2.5 Flash;
- servicios responsables de las conversaciones;
- generación de respuestas;
- evaluación automática de misiones;
- construcción de prompts;
- manejo de errores;
- control de llamadas al modelo;
- recuperación ante fallos;
- preparación para múltiples proveedores de IA.

---

# B6.5.1 — Arquitectura de integración

## Estado inicial

Durante las primeras etapas del desarrollo, varias funciones del sistema mantenían una dependencia relativamente estrecha con la implementación específica de Gemini.

Aunque esta aproximación permitió acelerar el desarrollo inicial, representaba un riesgo para la evolución futura del producto.

Cada cambio relacionado con el proveedor de IA tenía el potencial de afectar componentes pertenecientes al flujo académico.

---

## Refactorización

Como resultado de la auditoría se consolidó una arquitectura basada en servicios especializados.

La lógica de negocio dejó de conocer detalles específicos del proveedor de IA.

La arquitectura actual puede representarse de la siguiente manera:

```

Mission Player

↓

Servicios Conversacionales

↓

Servicio de IA

↓

Proveedor de Inteligencia Artificial

↓

Gemini

```

Esta separación reduce considerablemente el acoplamiento entre la plataforma académica y el modelo utilizado para generar las respuestas.

---

# B6.5.2 — Construcción de prompts

Durante la auditoría se revisó el mecanismo utilizado para construir las instrucciones enviadas al modelo de Inteligencia Artificial.

Los prompts fueron reorganizados para mantener una estructura más consistente y facilitar futuras modificaciones.

Actualmente la construcción de instrucciones contempla, entre otros elementos:

- contexto de la misión;
- rol asignado al asistente;
- objetivos pedagógicos;
- idioma de conversación;
- restricciones conversacionales;
- criterios de evaluación.

---

## Beneficios

La centralización de la construcción de prompts facilita:

- mantenimiento;
- evolución de las misiones;
- incorporación de nuevos criterios;
- reutilización del mismo modelo de conversación.

---

# B6.5.3 — Manejo de errores

Uno de los aspectos más importantes revisados durante la auditoría fue la gestión de errores provenientes del proveedor de IA.

Se verificó especialmente el comportamiento ante situaciones como:

- pérdida de conectividad;
- errores internos del proveedor;
- límites de cuota;
- respuestas incompletas;
- tiempos de espera elevados.

---

## Hallazgos

Se comprobó que la aplicación puede detectar adecuadamente errores provenientes del servicio de IA y evitar que el estudiante pierda el estado general de la misión.

El sistema mantiene la estabilidad del flujo conversacional incluso cuando la generación de respuestas no puede completarse exitosamente.

---

# B6.5.4 — Gestión de cuotas

Durante las pruebas se identificaron escenarios asociados al agotamiento temporal de la cuota gratuita del servicio Gemini.

Entre ellos:

- HTTP 429
- RESOURCE_EXHAUSTED
- límites diarios
- límites por minuto

Estos escenarios fueron documentados como parte del comportamiento esperado del proveedor y no como defectos propios de la plataforma.

---

## Decisión arquitectónica

La plataforma fue diseñada para que este tipo de errores permanezcan encapsulados dentro de la capa de servicios.

Los componentes de la interfaz no deben conocer detalles específicos sobre la causa técnica del fallo.

Esta separación facilita la sustitución del proveedor sin afectar la experiencia general del usuario.

---

# B6.5.5 — Independencia del proveedor

Uno de los objetivos estratégicos alcanzados consiste en evitar la dependencia tecnológica respecto a un proveedor específico.

La arquitectura obtenida permite reemplazar Gemini por otros modelos sin modificar la lógica principal del sistema académico.

Entre los proveedores que podrían incorporarse en el futuro se encuentran:

- OpenAI GPT;
- Claude;
- Azure OpenAI;
- Llama;
- Mistral;
- proveedores internos.

La lógica pedagógica permanecería inalterada.

---

# B6.5.6 — Beneficios arquitectónicos

La nueva arquitectura proporciona múltiples ventajas.

## Desacoplamiento

La plataforma académica no depende directamente de Gemini.

---

## Escalabilidad

Es posible incorporar nuevos modelos de IA sin modificar Mission Player.

---

## Flexibilidad

La selección del proveedor puede realizarse mediante configuración.

---

## Evolución futura

La arquitectura facilita la incorporación de:

- múltiples proveedores simultáneos;
- balanceo de modelos;
- selección automática del proveedor;
- evaluación mediante diferentes modelos;
- estrategias de redundancia.

---

# B6.5.7 — Riesgos identificados

La auditoría identificó algunos riesgos que deberán considerarse durante la evolución del sistema.

## Dependencia de servicios externos

La disponibilidad de las conversaciones depende del proveedor de IA seleccionado.

---

## Cambios en modelos

Los modelos de lenguaje evolucionan continuamente.

Los cambios en comportamiento pueden requerir ajustes periódicos de los prompts.

---

## Costos operativos

El crecimiento del número de estudiantes incrementará proporcionalmente el consumo de recursos de Inteligencia Artificial.

Será necesario establecer mecanismos de monitoreo y optimización permanente.

---

# B6.5.8 — Recomendaciones

Como resultado de la auditoría se recomienda:

- mantener completamente desacoplada la lógica pedagógica del proveedor de IA;
- conservar centralizada la construcción de prompts;
- encapsular todo acceso al modelo dentro de servicios especializados;
- implementar métricas de consumo;
- preparar una interfaz común para múltiples proveedores.

---

# Conclusión

La auditoría confirma que la integración con Inteligencia Artificial constituye uno de los pilares tecnológicos de la plataforma.

La arquitectura obtenida proporciona un equilibrio adecuado entre flexibilidad, mantenibilidad y capacidad de evolución futura.

El desacoplamiento entre la lógica académica y el proveedor de IA representa una decisión estratégica que permitirá incorporar nuevos modelos de lenguaje sin afectar el funcionamiento general del sistema.

Esta aproximación posiciona a la plataforma para evolucionar conforme aparezcan nuevas generaciones de modelos conversacionales, preservando la inversión realizada en la arquitectura académica.

# B6.6 — Auditoría de la persistencia del progreso académico

## Objetivo

La presente auditoría revisó la arquitectura responsable de la persistencia del progreso académico del estudiante durante el desarrollo de las misiones conversacionales.

El objetivo principal consistió en verificar que toda la información generada durante el proceso de aprendizaje pudiera almacenarse de forma consistente, recuperarse posteriormente y servir como base para futuras funcionalidades analíticas y pedagógicas.

La revisión incluyó tanto la estructura de almacenamiento como la forma en que los distintos componentes interactúan con la capa de persistencia.

---

# Alcance de la auditoría

Se revisaron principalmente los siguientes aspectos:

- almacenamiento del progreso por misión;
- almacenamiento del progreso por tema;
- persistencia de conversaciones;
- resultados de evaluación;
- sincronización con Firestore;
- recuperación del estado del estudiante;
- consistencia de los datos;
- preparación para futuras ampliaciones.

---

# B6.6.1 — Arquitectura de persistencia

## Estado actual

La plataforma utiliza Cloud Firestore como mecanismo principal para almacenar la información académica generada durante las sesiones de aprendizaje.

La arquitectura fue diseñada para desacoplar completamente la lógica de negocio del mecanismo de almacenamiento.

Los componentes visuales no realizan operaciones directas sobre Firestore.

Toda interacción ocurre mediante servicios especializados.

---

## Arquitectura obtenida

```

Mission Player

↓

Servicios Académicos

↓

Servicios de Persistencia

↓

Cloud Firestore

```

Esta organización facilita futuras modificaciones sin afectar los componentes de la interfaz.

---

# B6.6.2 — Persistencia del progreso

Durante la auditoría se verificó que el progreso del estudiante pueda mantenerse entre distintas sesiones de uso.

La arquitectura contempla el almacenamiento de información relacionada con:

- misión actual;
- misiones completadas;
- progreso por tema;
- estado general del aprendizaje;
- resultados obtenidos.

Esta información constituye la base para la evolución académica del estudiante.

---

## Beneficios

La persistencia del progreso permite:

- continuar el aprendizaje posteriormente;
- evitar pérdida de información;
- mantener continuidad entre sesiones;
- facilitar futuras estadísticas académicas.

---

# B6.6.3 — Persistencia de conversaciones

Uno de los aspectos revisados consistió en verificar el tratamiento de las conversaciones mantenidas entre el estudiante y la Inteligencia Artificial.

La arquitectura permite almacenar la información necesaria para reconstruir posteriormente el contexto de la misión.

Esta capacidad resulta especialmente importante para futuras funcionalidades como:

- revisión del aprendizaje;
- auditorías académicas;
- análisis conversacional;
- mejora continua de las misiones.

---

## Hallazgos

Se confirmó la conveniencia de mantener desacoplado el almacenamiento de conversaciones respecto a los componentes visuales.

Mission Player no administra directamente la persistencia.

Esta responsabilidad pertenece exclusivamente a la capa de servicios.

---

# B6.6.4 — Persistencia de resultados

La auditoría verificó la capacidad del sistema para almacenar los resultados finales de cada misión.

Entre la información considerada se encuentran:

- estado de aprobación;
- resultados de evaluación;
- indicadores de progreso;
- fecha de finalización;
- información de seguimiento.

Esta información permitirá construir posteriormente historiales académicos completos.

---

# B6.6.5 — Consistencia de datos

Uno de los objetivos principales consistió en garantizar que la información almacenada permanezca consistente aun cuando ocurran situaciones inesperadas.

Durante la revisión se analizaron escenarios relacionados con:

- interrupciones de conexión;
- errores del proveedor de IA;
- cancelación de sesiones;
- interrupción del navegador.

La arquitectura minimiza el riesgo de inconsistencias mediante la separación entre la lógica de negocio y la persistencia.

---

# B6.6.6 — Recuperación del estado

La plataforma fue diseñada para permitir que el estudiante continúe utilizando el sistema sin perder su historial académico.

La recuperación del estado contempla información relacionada con:

- tema seleccionado;
- progreso alcanzado;
- misiones disponibles;
- resultados previos;
- información necesaria para reconstruir el contexto académico.

---

# B6.6.7 — Escalabilidad del modelo de datos

La auditoría verificó que el modelo de persistencia permita incorporar nuevas funcionalidades sin modificar significativamente la estructura existente.

Entre las capacidades previstas se encuentran:

- múltiples cursos;
- múltiples idiomas;
- distintos niveles CEFR;
- estadísticas de aprendizaje;
- paneles docentes;
- seguimiento institucional;
- analítica avanzada.

La arquitectura actual constituye una base adecuada para dichas ampliaciones.

---

# B6.6.8 — Riesgos identificados

Durante la revisión se identificaron algunos aspectos que deberán monitorearse durante la evolución del sistema.

## Crecimiento del volumen de datos

El almacenamiento de conversaciones incrementará progresivamente el tamaño de la base de datos.

Será conveniente implementar estrategias de archivado y retención de información.

---

## Consultas complejas

El crecimiento del número de estudiantes requerirá optimizar consultas y estructuras de índices en Firestore.

---

## Costos de almacenamiento

La evolución del sistema deberá considerar el impacto económico asociado al crecimiento del historial conversacional.

---

# B6.6.9 — Recomendaciones

Como resultado de la auditoría se recomienda:

- mantener encapsulado todo acceso a Firestore;
- evitar operaciones directas desde componentes visuales;
- conservar claramente separadas las capas de persistencia y presentación;
- implementar métricas de crecimiento del almacenamiento;
- diseñar futuras estrategias de archivado histórico.

---

# Conclusión

La auditoría confirma que la arquitectura de persistencia constituye una base sólida para soportar la evolución académica de la plataforma.

La separación entre los componentes de presentación, la lógica de negocio y la capa de almacenamiento mejora significativamente la mantenibilidad del sistema y facilita futuras ampliaciones.

La estructura obtenida permite preservar el historial de aprendizaje del estudiante y proporciona el soporte necesario para incorporar nuevas capacidades analíticas, docentes e institucionales en versiones posteriores del producto.

# B6.7 — Riesgos residuales y oportunidades de evolución

## Objetivo

Toda arquitectura de software debe concebirse como un sistema evolutivo.

El propósito de esta sección consiste en documentar las principales oportunidades de crecimiento identificadas durante la auditoría, así como aquellos aspectos que, aunque no representan defectos del sistema, podrán incrementar significativamente el valor académico y tecnológico de la plataforma en futuras versiones.

Las observaciones aquí registradas no constituyen incumplimientos del proyecto actual.

Corresponden a capacidades previstas dentro de la hoja de ruta tecnológica del producto.

---

# B6.7.1 — Evolución del sistema conversacional

La arquitectura desarrollada permite ampliar considerablemente las capacidades actuales del aprendizaje mediante Inteligencia Artificial.

Entre las funcionalidades identificadas durante la auditoría se encuentran:

- conversaciones multiagente;
- personajes virtuales especializados;
- escenarios conversacionales dinámicos;
- simulaciones de situaciones reales;
- conversaciones ramificadas según el desempeño del estudiante;
- adaptación automática del contexto de la conversación.

La estructura obtenida durante esta fase permite incorporar estas capacidades sin modificar la arquitectura principal del Mission Player.

---

# B6.7.2 — Personalización mediante Inteligencia Artificial

Actualmente las misiones siguen un flujo pedagógico definido.

Sin embargo, la arquitectura ya permite evolucionar hacia experiencias completamente personalizadas.

Entre las posibilidades identificadas se encuentran:

- adaptación automática del nivel de dificultad;
- recomendaciones individuales;
- selección inteligente de misiones;
- generación dinámica de actividades;
- aprendizaje adaptativo basado en desempeño.

Estas capacidades podrán incorporarse progresivamente utilizando la misma arquitectura de servicios ya implementada.

---

# B6.7.3 — Evaluación avanzada

La evaluación actual se centra en verificar el cumplimiento de los objetivos conversacionales definidos para cada misión.

Durante la auditoría se identificó la posibilidad de incorporar mecanismos adicionales de evaluación, tales como:

- evaluación por competencias;
- rúbricas configurables;
- análisis gramatical avanzado;
- evaluación léxica;
- análisis de coherencia discursiva;
- seguimiento longitudinal del aprendizaje.

La arquitectura actual permite integrar estos mecanismos sin afectar el flujo general de conversación.

---

# B6.7.4 — Pronunciación y evaluación fonética

Uno de los principales caminos de evolución consiste en incorporar interacción por voz.

Las capacidades previstas incluyen:

- reconocimiento automático del habla;
- evaluación fonética;
- análisis de pronunciación;
- retroalimentación sobre fluidez;
- detección de errores de pronunciación;
- ejercicios específicos de entonación.

La arquitectura desacoplada entre Mission Player y los servicios facilita la incorporación futura de estos módulos especializados.

---

# B6.7.5 — Analítica académica

Durante la auditoría se identificó la conveniencia de incorporar capacidades analíticas dirigidas tanto a estudiantes como a docentes.

Entre ellas:

- evolución del aprendizaje;
- progreso por competencias;
- estadísticas de conversación;
- frecuencia de práctica;
- indicadores de desempeño;
- tendencias individuales;
- reportes institucionales.

La estructura de persistencia desarrollada durante esta fase constituye una base adecuada para dichas funcionalidades.

---

# B6.7.6 — Soporte para múltiples modelos de Inteligencia Artificial

La arquitectura obtenida evita depender exclusivamente de un único proveedor.

En futuras versiones podrán coexistir distintos modelos especializados.

Ejemplos:

- Gemini;
- GPT;
- Claude;
- Llama;
- Mistral;
- modelos propios.

Incluso será posible seleccionar automáticamente el modelo más adecuado según el tipo de actividad académica.

---

# B6.7.7 — Internacionalización

La plataforma fue concebida desde sus primeras etapas con un enfoque multilingüe.

La arquitectura permitirá extender progresivamente el aprendizaje hacia nuevos idiomas sin modificar significativamente los componentes existentes.

Entre las posibilidades previstas se encuentran:

- múltiples idiomas base;
- múltiples idiomas objetivo;
- contenidos específicos por región;
- adaptación cultural de las conversaciones;
- localización completa de la experiencia educativa.

---

# B6.7.8 — Integración institucional

Durante la auditoría también se identificaron oportunidades para incorporar capacidades orientadas al sector educativo.

Entre ellas:

- panel docente;
- administración académica;
- seguimiento de grupos;
- estadísticas institucionales;
- integración con plataformas LMS;
- exportación de resultados.

La arquitectura actual proporciona una base adecuada para dichas integraciones.

---

# B6.7.9 — Riesgos tecnológicos identificados

Durante la revisión se identificaron algunos factores externos que deberán monitorearse durante la evolución del producto.

## Evolución de los modelos de IA

Los modelos de lenguaje evolucionan continuamente.

Será necesario revisar periódicamente los prompts y los mecanismos de evaluación para mantener resultados consistentes.

---

## Costos operativos

El incremento del número de estudiantes implicará un crecimiento proporcional en el consumo de recursos de Inteligencia Artificial y almacenamiento.

Será recomendable implementar métricas de consumo y estrategias de optimización.

---

## Cambios tecnológicos

La evolución de Firestore, Gemini o futuros proveedores puede requerir adaptaciones menores en la capa de servicios.

Gracias a la arquitectura desacoplada, estos cambios no deberían afectar la lógica académica principal.

---

# B6.7.10 — Valor estratégico de la arquitectura

La auditoría confirma que el diseño obtenido no solo satisface las necesidades actuales del proyecto, sino que constituye una plataforma preparada para evolucionar durante los próximos años.

Las decisiones arquitectónicas adoptadas permiten:

- incorporar nuevas funcionalidades sin reescribir el núcleo del sistema;
- reemplazar proveedores tecnológicos cuando sea necesario;
- ampliar el alcance académico del producto;
- facilitar el mantenimiento del código;
- preservar la inversión realizada durante esta etapa del desarrollo.

En consecuencia, la arquitectura actual representa una base sólida para la consolidación de la plataforma como un ecosistema de aprendizaje conversacional asistido por Inteligencia Artificial.

# B6.8 — Conclusión general de la auditoría del módulo Topics & Missions

## Resumen ejecutivo

El proceso de auditoría permitió revisar integralmente el núcleo funcional de la plataforma de aprendizaje conversacional, abarcando tanto la arquitectura del sistema de Topics como el flujo completo de ejecución de las Missions.

Durante esta etapa se realizó una revisión técnica orientada no solamente a corregir aspectos funcionales, sino principalmente a fortalecer la arquitectura del producto mediante la simplificación de responsabilidades, la reducción del acoplamiento entre componentes y la preparación del sistema para futuras evoluciones.

La auditoría confirma que el módulo constituye actualmente el principal diferenciador tecnológico y pedagógico de la plataforma.

---

# Objetivos alcanzados

Durante el proceso de auditoría se alcanzaron satisfactoriamente los siguientes objetivos:

- reorganización de la arquitectura del sistema de Topics;
- consolidación del flujo de navegación académica;
- refactorización integral del Mission Player;
- separación clara entre componentes de presentación y lógica de negocio;
- centralización de la persistencia mediante servicios especializados;
- optimización del flujo de evaluación con Inteligencia Artificial;
- reducción significativa del consumo de llamadas al modelo Gemini;
- simplificación de estados internos;
- fortalecimiento de la mantenibilidad del código;
- preparación de la plataforma para futuras ampliaciones académicas.

---

# Principales decisiones arquitectónicas

La auditoría permitió consolidar varias decisiones de diseño que constituyen la base de la evolución futura del producto.

Entre ellas destacan:

## Componentización

La distribución de responsabilidades entre componentes especializados reduce significativamente la complejidad del sistema.

---

## Desacoplamiento

La lógica académica permanece independiente tanto de Firestore como del proveedor de Inteligencia Artificial.

---

## Persistencia

Toda la gestión del progreso académico quedó centralizada mediante servicios especializados.

---

## Evaluación

La evaluación conversacional fue simplificada a una única ejecución por misión, eliminando procesos redundantes y reduciendo el consumo de recursos.

---

## Escalabilidad

La arquitectura permite incorporar nuevas funcionalidades sin modificar el núcleo del sistema conversacional.

---

# Evaluación del cumplimiento

| Área auditada | Estado |
|---------------|--------|
| Arquitectura Topics | ✅ Conforme |
| Navegación académica | ✅ Conforme |
| Mission Player | ✅ Conforme |
| Componentización | ✅ Conforme |
| Persistencia | ✅ Conforme |
| Integración Firestore | ✅ Conforme |
| Integración Gemini | ✅ Conforme |
| Evaluación IA | ✅ Conforme |
| Optimización del flujo | ✅ Conforme |
| Escalabilidad | ✅ Conforme |
| Mantenibilidad | ✅ Conforme |
| Preparación para futuras versiones | ✅ Conforme |

---

# Fortalezas identificadas

Como resultado del proceso de auditoría se identifican las siguientes fortalezas del sistema:

- arquitectura claramente modular;
- adecuada separación de responsabilidades;
- bajo acoplamiento entre componentes;
- facilidad de mantenimiento;
- integración consistente con Firestore;
- integración desacoplada con Inteligencia Artificial;
- preparación para múltiples idiomas;
- preparación para múltiples proveedores de IA;
- base adecuada para crecimiento institucional.

---

# Observaciones

Durante la auditoría no se identificaron defectos estructurales que comprometan la continuidad del desarrollo del módulo.

Las observaciones registradas corresponden principalmente a oportunidades de evolución contempladas dentro de la hoja de ruta tecnológica del producto.

Estas oportunidades fueron documentadas en el apartado de riesgos residuales y evolución futura.

---

# Estado del módulo

El módulo Topics & Missions presenta actualmente un grado elevado de madurez arquitectónica.

Las principales funcionalidades previstas para esta etapa se encuentran implementadas y organizadas bajo una arquitectura coherente, escalable y preparada para futuras ampliaciones.

La estructura obtenida proporciona una base sólida para continuar con la evolución del ecosistema de aprendizaje conversacional.

---

# Preparación para el piloto universitario

Como resultado de la presente auditoría, el módulo se considera preparado para iniciar la fase de pruebas funcionales y pedagógicas del piloto universitario.

Las pruebas deberán concentrarse principalmente en:

- experiencia del estudiante;
- calidad pedagógica de las conversaciones;
- comportamiento del modelo de Inteligencia Artificial;
- rendimiento bajo escenarios reales de uso;
- retroalimentación académica.

La arquitectura desarrollada proporciona un nivel adecuado de estabilidad para esta etapa.

---

# Recomendaciones estratégicas

Se recomienda que las siguientes etapas del proyecto concentren sus esfuerzos en:

- validación con estudiantes reales;
- incorporación de analítica académica;
- integración de evaluación por voz;
- expansión del catálogo de misiones;
- incorporación progresiva de aprendizaje adaptativo;
- desarrollo de herramientas para docentes e instituciones.

---

# Dictamen final de auditoría

Como resultado de la revisión técnica integral realizada sobre el módulo **Topics & Missions**, se concluye que la arquitectura implementada satisface los objetivos definidos para esta fase del proyecto.

La plataforma presenta una organización consistente de responsabilidades, una adecuada separación entre sus diferentes capas de arquitectura y un nivel de madurez suficiente para soportar la evolución prevista dentro de la hoja de ruta tecnológica.

Las decisiones arquitectónicas adoptadas durante esta etapa fortalecen significativamente la mantenibilidad, la escalabilidad y la capacidad de adaptación futura del sistema.

En consecuencia, el módulo auditado queda aprobado para continuar hacia la fase de validación funcional y pedagógica correspondiente al piloto universitario.

---

# Estado final de la auditoría

**Resultado:** ✅ APROBADO PARA PILOTO UNIVERSITARIO

**Módulo auditado:** Topics & Missions

**Versión:** 1.0

**Estado arquitectónico:** Estable

**Estado funcional:** Conforme

**Preparación para evolución futura:** Alta

**Fecha de cierre:** Julio de 2026