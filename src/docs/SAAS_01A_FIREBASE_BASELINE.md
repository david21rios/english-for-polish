# SaaS-01A — Inventario Firebase y baseline reproducible

**Fecha:** 2026-07-28  
**Estado:** `partially_completed_external_gate`  
**Commit de entrada:** `33ae607 docs: close SaaS-00 architecture plan`  
**Despliegues o escrituras remotas:** ninguno

## 1. Alcance y conclusión

SaaS-01A deja una baseline local restrictiva y reproducible para Auth,
Firestore y Storage Emulator, junto con pruebas unitarias deny-by-default. La
fase no puede declararse `completed` porque:

1. Java no está instalado y Firestore/Storage Emulator no pueden arrancar;
2. Firebase CLI no tiene ninguna sesión autorizada y el inventario remoto no
   puede verificarse.

El commit de entrada fue comprobado antes de trabajar y no se modificó, amplió
ni reescribió. SaaS-01B puede avanzar en paralelo conforme al plan aprobado,
pero no se inició. SaaS-02 permanece bloqueada.

## 2. Herramientas

| Herramienta | Estado final | Observación |
|---|---|---|
| Node.js | `v24.15.0` | Compatible con `firebase-tools` 15.24.0 (`>=20`, `>=22` o `>=24`) |
| npm | `11.12.1` | En PowerShell se invoca mediante `npm.cmd` por la política local de scripts |
| Firebase CLI global | ausente | No se instaló globalmente |
| `firebase-tools` local | `15.24.0`, devDependency exacta | Se invoca mediante npm/npx |
| `@firebase/rules-unit-testing` | `4.0.1`, devDependency exacta | Compatible con el `firebase` 11 existente |
| Java | ausente de `PATH` | `java -version` falla y `where java` no encuentra ejecutable |
| gcloud | ausente | Informativo; no es necesario para el scaffold local |

`npm install` añadió las dependencias transitivas necesarias para esas dos
devDependencies. No se ejecutó `npm audit fix` ni se actualizaron dependencias
funcionales. npm informó 24 vulnerabilidades en el árbol completo (3 low,
7 moderate y 14 high); requieren una revisión separada y no autorizan una
actualización automática dentro de SaaS-01A.

La documentación oficial vigente admite JDK 11 o posterior, pero advierte que
Firestore Emulator requerirá Java 21 en una versión próxima. Por ello la
instalación manual preferida es un JDK 21 LTS.

## 3. Inventario local

### 3.1 Archivos Firebase encontrados al iniciar

El repositorio no tenía artefactos Firebase versionados antes del scaffold de
SaaS-01A. Al reanudar la fase estaban presentes como cambios sin seguimiento:

```text
.firebaserc
firebase.json
firestore.indexes.json
firestore.rules
storage.rules
src/docs/SAAS_01A_FIREBASE_BASELINE.md
tests/rules/
```

También estaba modificada `.gitignore`. No se encontraron:

```text
database.rules.json
functions/
firebase-debug.log
firebase-export-metadata.json
.firebase/
.firebase-emulator-data/
```

El intento posterior de arranque generó `firebase-debug.log`. El archivo sólo
registra el fallo local de Java/configstore, permanece ignorado y no se
versionará. No se generaron exportaciones ni datos de emulador.

### 3.2 SDK y productos usados por la aplicación

`src/firebase.js` inicializa una única aplicación y exporta Firebase
Authentication con persistencia local del navegador, Cloud Firestore y Cloud
Storage. No se encontró inicialización de Analytics, App Check, Functions,
Admin SDK o Remote Config. Tampoco existe backend `functions/`.

Variables detectadas por nombre, sin mostrar sus valores:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Todas están presentes en la configuración local inspeccionada. El identificador
de proyecto no secreto usado por el cliente es `english-for-polish`; esto es
evidencia local, no verificación del estado remoto.

### 3.3 Rutas Firestore derivadas del código

Identidad y progreso:

```text
users/{uid}
users/{uid}/progress/{progressId}
users/{uid}/topicProgress/{topicProgressId}
users/{uid}/topicProgress/{topicProgressId}/attempts/{attemptId}
userTests/{testId}
```

Contenido académico:

```text
levels/{levelId}
levels/{levelId}/lessons/{lessonId}
levels/{levelId}/modules/{moduleId}
levels/{levelId}/modules/{moduleId}/lessons/{lessonId}
temas/{topicId}
temas/{topicId}/Lessons/{lessonId}
temas/{topicId}/missions/{missionId}
```

Foro, soporte y contacto:

```text
forums/{levelId}/posts/{postId}
forums/{levelId}/posts/{postId}/replies/{replyId}
forumReports/{reportId}
messages/{messageId}
supportTickets/{ticketId}
```

Presentaciones:

```text
presentations/{presentationId}
```

Estas rutas proceden de referencias del código y no prueban que existan
remotamente ni descartan colecciones no referenciadas.

### 3.4 Storage derivado del código

La única ruta de subida confirmada es:

```text
presentations/{timestamp}_audio.wav
```

No contiene `tenantId`, `courseId`, usuario ni identificador de presentación.
No se encontró una eliminación del blob desde el cliente.

### 3.5 Superficies de acceso directo

Existen accesos Firestore tanto en servicios como en UI, entre otros:
`Header.jsx`, `Welcome.jsx`, `Login.jsx`, `Home.jsx`, `Curso.jsx`, `Foro.jsx`,
`Profile.jsx`, `TemaDetalle.jsx`, `MissionChatPage.jsx`,
`PersonalizedMissionPage.jsx`, componentes de foro, perfil y administración.
Este inventario confirma la necesidad futura de repositorios tenant-aware, sin
implementarlos en esta fase.

## 4. Inventario histórico de Git

Se ejecutaron búsquedas de sólo lectura con `git log --all`, `git branch --all`,
`git ls-files` y `git check-ignore`.

- No existe historial para `firebase.json`, `firestore.rules`,
  `storage.rules` o `firestore.indexes.json` en las ramas visibles.
- Ramas visibles: `main`, `origin/main`, `origin/master` y
  `origin/HEAD -> origin/master`.
- Los cuatro archivos no estaban versionados ni ignorados.
- No hay evidencia Git verificable de reglas o índices históricos.

Por tanto, los scaffolds actuales no restauran ni representan una versión
desplegada anterior.

## 5. Inventario remoto de sólo lectura

### 5.1 Resultado real

- `npx firebase --version`: confirma 15.24.0.
- `npx firebase login:list`: informa que no hay cuentas autorizadas.
- `npx firebase use` y `npx firebase projects:list`: no pueden autenticarse.
- No se ejecutó `firebase login`, no se solicitaron credenciales y no se
  cambiaron aliases remotos.
- El sandbox también impide al CLI escribir su configstore bajo el perfil del
  usuario (`EPERM`); esta limitación es secundaria frente a la ausencia real de
  autenticación.

No se verificaron remotamente proyectos, Hosting, Functions, extensiones,
reglas, índices, proveedores Auth, dominios autorizados, App Check, Storage,
IAM, regiones, cuotas o alertas.

### 5.2 Procedimiento manual requerido

Con una cuenta de sólo lectura autorizada y fuera de este sandbox:

1. ejecutar `npx firebase login:list`;
2. ejecutar `npx firebase projects:list` y confirmar explícitamente
   `english-for-polish`;
3. consultar Hosting, Functions y Extensions sólo con comandos de listado;
4. abrir Firebase Console y copiar las reglas desplegadas de Firestore y
   Storage a archivos de evidencia separados; no sobrescribir los scaffolds;
5. exportar o registrar los índices compuestos y field overrides desde la
   consola y compararlos con `firestore.indexes.json`;
6. registrar proveedores y plantillas Auth, dominios autorizados, App Check,
   región, buckets y metadatos relevantes;
7. revisar la comparación y aprobarla antes de SaaS-02.

La CLI no se considera fuente de descarga de reglas desplegadas si no existe un
comando de sólo lectura verificable. No debe usarse `firebase deploy`,
`firebase use --add` ni ningún comando de mutación para completar el inventario.

## 6. Baseline local

| Archivo | Propósito y fuente | Estado/riesgo | Condición de reemplazo |
|---|---|---|---|
| `.firebaserc` | Alias local por defecto | Apunta sólo a `demo-polish-learning`; no identifica producción | Mantener demo como default; cualquier alias remoto exige revisión explícita |
| `firebase.json` | Configuración manual del Emulator Suite | JSON válido; sin Hosting ni Functions | Ajustar sólo tras validar CLI y contratos |
| `firestore.rules` | Baseline local segura | Deniega toda lectura/escritura; no representa producción y rompe flujos funcionales | Reemplazar en SaaS-02 tras 01B, inventario remoto y tests |
| `storage.rules` | Baseline local segura | Deniega toda lectura/escritura; no representa producción | Igual que Firestore |
| `firestore.indexes.json` | Archivo mínimo requerido | JSON válido con listas vacías; no representa índices remotos | Reconciliar antes de SaaS-02 |
| `tests/rules/` | Tests sintéticos de la baseline | Preparados, no ejecutados por falta de Java | Ejecutar tras instalar JDK 21 |

No existe ninguna regla general `allow ... if true`. Ninguno de estos archivos
debe desplegarse como representación del estado productivo.

## 7. Emulator Suite

Proyecto aislado:

```text
demo-polish-learning
```

Puertos configurados y libres durante la comprobación:

| Emulator | Puerto |
|---|---:|
| Authentication | 9099 |
| Cloud Firestore | 8080 |
| Cloud Storage | 9199 |
| Emulator UI | 4000 |

`singleProjectMode` está activo. No se configura Functions, Hosting ni otro
producto. La aplicación no fue conectada a emuladores; las pruebas crean su
propio entorno mediante Firebase Rules Unit Testing.

Scripts seguros:

```text
npm run firebase:version
npm run emulators:start
npm run test:rules
```

Todos fuerzan `demo-polish-learning`; ninguno contiene deploy ni selecciona
producción. No se habilitó persistencia, pero `.firebase-emulator-data/` está
ignorado para un uso futuro controlado.

### 7.1 Arranque real

Se ejecutó `npm run test:rules`, que invoca `emulators:exec` para Firestore y
Storage. Resultado real:

```text
Error: spawn java ENOENT
Could not spawn `java -version`.
```

El CLI cerró el hub de emuladores. Firestore, Storage, Auth y UI no llegaron a
quedar operativos en una ejecución completa. Tras el intento no existía ningún
listener en 9099, 8080, 9199 o 4000.

El CLI local funciona, aunque el sandbox genera además un error de escritura en
el configstore del perfil. No se modificó la configuración global para
ocultarlo.

## 8. Pruebas de reglas

`tests/rules/denyAllBaseline.test.mjs` contiene ocho pruebas:

- Firestore: lectura y escritura denegadas para usuario anónimo;
- Firestore: lectura y escritura denegadas para usuario autenticado ficticio;
- Storage: lectura y escritura denegadas para usuario anónimo;
- Storage: lectura y escritura denegadas para usuario autenticado ficticio.

`tests/rules/helpers/rulesTestEnvironment.mjs` carga las reglas directamente
desde el repositorio y usa sólo `demo-polish-learning`. No importa
`src/firebase.js` ni su configuración productiva.

Ambos archivos pasan `node --check`. Las ocho pruebas no se ejecutaron porque
los emuladores fallaron antes de iniciar por falta de Java; no se presentan
como aprobadas.

Comando pendiente:

```text
npm run test:rules
```

Resultado esperado: ocho pruebas aprobadas, carga correcta de ambas reglas y
cierre limpio de los emuladores.

## 9. Validación del proyecto

- `npm test`: 35/35 pruebas existentes aprobadas al repetir fuera de la
  restricción de lectura del sandbox.
- `npm run build`: correcto; 816 módulos transformados. Mantiene avisos
  preexistentes de Browserslist y tamaño de chunks.
- `npm run lint`: falla con 13 errores y 8 warnings preexistentes en archivos
  funcionales fuera del alcance. No reporta errores en los archivos SaaS-01A.
- JSON de `.firebaserc`, `firebase.json` y `firestore.indexes.json`: válido.
- JavaScript de los tests nuevos: sintaxis válida.

La primera ejecución sandboxed de tests/build falló porque esbuild no podía
resolver `vite.config.js` fuera del límite de lectura; la repetición autorizada
fuera del sandbox fue correcta.

## 10. Gates

### 10.1 Gate para cerrar SaaS-01A

1. instalar manualmente JDK 21 LTS sin modificar el proyecto;
2. comprobar `java -version` y `where java`;
3. ejecutar `npm run test:rules`;
4. confirmar ocho pruebas aprobadas, carga de reglas y cierre limpio;
5. opcionalmente ejecutar `npm run emulators:start`, comprobar Auth,
   Firestore, Storage y UI, y detenerlo limpiamente.

Hasta completar estos puntos, el estado sigue siendo
`partially_completed_external_gate`.

### 10.2 Gate remoto previo a SaaS-02

1. disponer de una sesión Firebase con permisos de sólo lectura;
2. identificar inequívocamente el proyecto remoto;
3. capturar reglas e índices remotos desde fuentes verificables;
4. inventariar Auth, Storage y recursos desplegados;
5. comparar remoto/local sin sobrescribir la baseline;
6. aprobar los contratos de SaaS-01B y la matriz de capacidades;
7. aprobar explícitamente el reemplazo de las reglas provisionales.

## 11. Próximo paso

SaaS-01B puede comenzar en paralelo según el mapa aprobado, pero no fue
iniciada. La acción concreta inmediata para SaaS-01A es instalar manualmente
JDK 21 LTS, validar `PATH` y ejecutar `npm run test:rules`. En paralelo, una
persona autorizada debe recopilar el inventario remoto de sólo lectura.
SaaS-02 debe permanecer bloqueada hasta cerrar ambos gates.

## 12. Declaración de seguridad

- no se hizo commit ni push;
- no se desplegaron reglas, índices, Hosting o Functions;
- no se inició `firebase login`;
- no se escribieron ni modificaron datos remotos;
- no se expusieron API keys, tokens o credenciales;
- no se conectó la aplicación a los emuladores;
- no se modificó código funcional;
- no se inició SaaS-01B ni SaaS-02.
