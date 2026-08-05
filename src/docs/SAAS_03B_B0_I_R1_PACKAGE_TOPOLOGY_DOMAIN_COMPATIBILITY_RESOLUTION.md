# SaaS-03B-B0-I-R1 — Package topology and Domain compatibility resolution

## 1. Propósito y resultado

Esta resolución cierra la topología de `packages/saas-contracts`, su consumo por
el frontend Vite y por el futuro artefacto Firebase Functions 2nd gen, y la
relación normativa y física con Domain 1.2.0. R1 no modifica ningún archivo
técnico ni completa la extracción parcial.

```text
PACKAGE_TOPOLOGY = RESOLVED
PACKAGE_TOPOLOGY_BLOCKER = resolved
SaaS-03B-B0-I-R1 = completed_pending_human_architecture_review
SaaS-03B-B0-I-R2 = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R2_R3_R4
```

## 2. Estado heredado

La rama es `main`; `HEAD` y `origin/main` son
`399ec41e83d867e60b74c41c4e4560763166ec46`. El worktree contiene únicamente
documentación heredada de 03B-A/R1/B0, el árbol parcial
`packages/saas-contracts` y adaptadores parciales en Shared y seis validation
modules. No existen cambios ajenos. Todo se preserva sin staging, commit, reset,
stash, checkout ni modificación técnica durante R1.

## 3. Fuentes y evidencia técnica

Se revisaron 03B-A/R1, B0/B0-I, roadmap y Scope; ADR-001–009, Architecture
Freeze y Domain 1.2.0; modelos Identity, Organization, Authorization, Academic
y Workflow; persistencia, modelo físico, access/query/index contracts,
concurrencia, seguridad y CI; `package.json`, lockfile, Vite, ESLint,
`firebase.json`, Firebase CLI 15.24.0, el package parcial, Domain, Shared,
repositorios, unit/runtime tests y prechecks.

Firebase documenta `functions.source` como directorio del artefacto y un
`package.json` propio para Functions. `prepareFunctionsUpload()` de
firebase-tools 15.24.0 recorre exclusivamente `sourceDir`, excluye
`node_modules` y archiva paths relativos a ese root. npm workspaces enlaza
packages locales y `npm ci` exige manifests/lockfile coincidentes.

Conclusión: `file:../packages/saas-contracts` funciona en el checkout, pero el
target queda fuera del archivo subido. No es un contrato de deploy válido.

## 4. Alternativas y decisión

| Opción | Frontend | Functions | Deploy | Lockfiles | Riesgo | Decisión |
|---|---|---|---|---|---|---|
| Workspace raíz + package + Functions | nativa | nativa local | exige artifact interno | dos por artefacto | bajo con gate | **seleccionada** |
| Sólo `file:../packages` | válida | local | target externo ausente | media | alto | rechazada |
| Shared dentro de `functions/` | importable | directo | sí | baja | frontera invertida | rechazada |
| Registry privado | válida | registry | sí | baja | credenciales/confusion | prohibida MVP |
| Functions source = repo root | posible | visible | sí | única | mezcla FE/BE | rechazada |

## 5. Topología seleccionada

```text
/
  package.json                 # frontend + workspace root
  package-lock.json            # frontend + contracts workspace
  packages/saas-contracts/
    package.json
    src/
    __tests__/
  functions/
    package.json               # artifact Functions independiente
    package-lock.json
    src/
    vendor/
      mipymetic-saas-contracts-<version>.tgz
```

El package se edita sólo en `packages/saas-contracts`. El `.tgz` es un artifact
generado, no una segunda fuente. Se produce con `npm pack --dry-run` y
`npm pack`, se inspecciona, registra su SHA-256 y se coloca dentro de
`functions/vendor`. `functions/package.json` usa un
`file:vendor/...tgz` exacto. Firebase lo incluye por estar dentro de
`functions.source`; Cloud Build instala sin registry privado ni path externo.

El deploy no genera ni modifica el tarball. El predeploy futuro sólo comprueba
versión, contenido, hash y lockfile; cualquier divergencia falla antes de remoto.

## 6. Identidad y manifest

```text
PACKAGE_NAME = @mipymetic/saas-contracts
PACKAGE_VERSION_INITIAL = 0.1.0
PACKAGE_VERSIONING = SemVer exacto
PACKAGE_TYPE = module
PRIVATE_OR_PUBLISHABLE = private_non_publishable
LICENSE_POLICY = repository-private
RUNTIME_DEPENDENCIES = zero
```

Manifest previsto:

```json
{
  "name": "@mipymetic/saas-contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "engines": { "node": ">=20" },
  "exports": {
    ".": "./src/index.js",
    "./domain": "./src/domain/index.js",
    "./persistence": "./src/persistence/index.js",
    "./validation": "./src/validation/index.js",
    "./commands": "./src/commands/index.js",
    "./authority": "./src/authority/index.js",
    "./audit": "./src/audit/index.js",
    "./errors": "./src/errors/index.js"
  },
  "files": ["src", "README.md"]
}
```

Los barrels usan exports nombrados explícitos; `internal/` no se exporta.
`private:true`, cero runtime dependencies y ausencia de lifecycle install
scripts impiden publicación o ejecución accidental.

## 7. Workspace y lockfiles

```text
ROOT_PACKAGE_JSON_CHANGE_REQUIRED = YES
ROOT_PACKAGE_LOCK_CHANGE_REQUIRED = YES
CONTRACT_PACKAGE_JSON_REQUIRED = YES
FUNCTIONS_PACKAGE_JSON_REQUIRED = YES
NPM_WORKSPACES_REQUIRED = YES
LOCKFILE_STRATEGY = root_lock_plus_functions_artifact_lock
```

R2 añadirá `workspaces: ["packages/saas-contracts"]` al root y una dependencia
frontend exacta con la misma versión. npm regenerará el lockfile raíz y enlazará
el workspace. Functions no será workspace: es un artifact desplegable separado,
con lockfile propio, SDKs backend y tarball local exacto. Así `npm ci --prefix
functions` no depende del filesystem ni lockfile padre y funciona igual en
Windows y Ubuntu.

## 8. Consumo frontend, backend, Emulator y CI

Frontend importa subpaths por package name. Vite resuelve el workspace desde
`node_modules`, respeta ESM, export map, `sideEffects:false` y tree-shaking. No
requiere aliases/rutas transversales; Hostinger recibe sólo el bundle Vite.

Functions importa los mismos subpaths desde el tarball instalado. Emulación y
tests backend ejecutan `npm ci` en `functions/`; no usan `../packages`. Deploy
usa `functions.source = functions`, incluyendo manifest, lockfile, source y
vendor, pero no `node_modules`.

CI ejecutará `npm ci` raíz y `npm ci --prefix functions` por separado. Antes de
deploy se simula localmente el packaging y se inspecciona su inventario; R2/R3/R4
no contactan Firebase.

## 9. Autoridad de Domain

Se selecciona el Modelo 3, distinguiendo behavioral y transport-neutral:

- Domain 1.2.0 sigue siendo autoridad normativa; el Freeze no cambia.
- `saas-contracts` será autoridad física única de vocabulario, lifecycle,
  capabilities y contratos persistence/transport-neutral.
- `src/domain/**` conserva paths mediante adapters/reexports; mantiene modelos
  conductuales/JSDoc no compartidos.
- frontend/backend consumen el package; legacy puede usar Domain durante la
  migración.

El package nunca importa Domain. Una constante migrada no conserva otra
declaración literal autoritativa en Domain. Se cumplen source única y cero ciclos.

## 10. Matriz por familia

| Familia | Actual | Normativa futura | Física futura | FE/BE | Adapter | Fase | Duplicación temporal/final |
|---|---|---|---|---|---|---|---|
| Tenant enums/lifecycle | Domain | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| Membership roles/status/lifecycle | Domain | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| Request status/lifecycle | Domain | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| Course status/CEFR | Domain | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| Enrollment status/lifecycle | Domain | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| Identity/persistence fields | repos/package parcial | physical model | package persistence | ambos | repo | R2/R4 | parcial/0 |
| nullable/immutable fields | repos/docs | physical model | package persistence | ambos | validators | R3/R4 | sí/0 |
| identifiers | Shared/package parcial | persistence | package validation | ambos | Shared error | R2 | parcial/0 |
| paths | Shared/package parcial | physical model | package persistence | ambos | Shared | R2 | parcial/0 |
| BCP 47 | Course validation | language contract | package validation | ambos | Course | R3 | sí/0 |
| copy/freeze/canonical JSON | repos/package | R1 neutral | package validation/internal | ambos | no | R2/R4 | parcial/0 |
| error codes | Shared/package | R1 | package errors | ambos | RepositoryError | R3 | sí/0 |
| capabilities | Domain auth | Domain 1.2.0 | package domain | ambos | Domain | R3 | sí/0 |
| command/authority/audit | R1/package | 03B-A-R1 | package subpaths | BE; safe FE types | no | R2/R4 | parcial/0 |
| schema/policy IDs | docs/repos | owning contract | owning package subpath | ambos | consumer | R3/R4 | sí/0 |

## 11. Fronteras y exports

`UNIVERSAL_BROWSER_AND_NODE`: domain, persistence, validation, errors y
canonical JSON. `BACKEND_ONLY_CONTRACT`: commands, authority y audit
declarativos, siempre sin infraestructura. `FRONTEND_ONLY_ADAPTER`: wrappers
Shared/repository. `INTERNAL_NOT_EXPORTED`: helpers recursivos.

Prohibidos: Firebase client/Admin/Functions, React/Vite, DOM, filesystem,
process/env, Buffer, network, secretos, credenciales y executors backend.

API pública congelada por los ocho subpaths del manifest. No se admite
`export *` indiscriminado.

## 12. Tratamiento parcial e imports

| Grupo | Clasificación |
|---|---|
| persistence fields/paths | KEEP_WITH_FUTURE_ADJUSTMENT |
| validation identifiers/objects | KEEP_WITH_FUTURE_ADJUSTMENT |
| internal/json | KEEP_WITH_FUTURE_ADJUSTMENT; no export interno accidental |
| command/authority/audit/errors | KEEP_WITH_FUTURE_ADJUSTMENT |
| `src/index.js` | REPLACE_IN_R2 por barrels de subpath |
| package tests | KEEP_WITH_FUTURE_ADJUSTMENT para imports por package name |
| seis validation adapters | KEEP_WITH_FUTURE_ADJUSTMENT |
| Shared identifiers/paths | KEEP_WITH_FUTURE_ADJUSTMENT |
| Domain | BLOCKED_PENDING_DOMAIN_MIGRATION hasta R3 |

Los imports relativos actuales son temporales. R2 los reemplaza por
`@mipymetic/saas-contracts/<subpath>`. Los paths públicos antiguos permanecen
como adapters hasta R4.

## 13. Migración R2–R4

1. **R1**: esta resolución.
2. **R2**: manifests/workspace/export maps, artifact pack, imports por package
   name y tests clean-install/packaging.
3. **R2-C1**: revisión de topología, lockfiles, tarball y commits.
4. **R3**: mover físicamente enums, lifecycles y capabilities; Domain queda como
   compatibility adapters.
5. **R3-C1**: revisión Freeze/API y commits.
6. **R4**: deduplicación final, schemas/validators y pruebas completas de ambos
   artifacts desde checkout limpio.
7. **R4-C1**: revisión final, commits y push humano.
8. **03B-B**: foundation Functions.

R2 no cambia valores Domain; R3 no crea Functions; R4 no despliega.

## 14. Pruebas, packaging y CI

R2/R3/R4 validan API/export maps exactos; imports browser/Node/Functions;
`npm ci` limpio raíz y Functions; lockfiles deterministas; dependency audit;
cero imports prohibidos/ciclos; paridad Domain/adapters; unit tests, prechecks,
Rules, tests generales y Vite build; `npm pack --dry-run`; inventario/hash del
tarball; y simulación del archive Functions sin deploy.

No se usa snapshot como única garantía. Golden vectors cubren valores, freezing,
Unicode y canonical JSON.

## 15. Supply chain y rollback

- scope privado, `private:true`, cero publicación/dependencies runtime;
- SemVer exacto, export allowlist y `sideEffects:false`;
- tarball local con hash/inventario revisado;
- dos lockfiles sometidos a `npm ci`;
- sin install scripts, secretos ni registry privado;
- Dependabot sólo sobre manifests/lockfiles;
- revisión humana de topología y artifact vendor.

Rollback R2 restaura manifests, lockfiles, config e imports relativos y retira
sólo vendor artifacts. R3 restaura declaraciones Domain desde el commit previo.
R4 mantiene una versión compatible para ambos artifacts. No toca Rules, índices,
datos ni Firebase remoto.

## 16. Riesgos y diferidos

Riesgos controlados: tarball obsoleto, lockfiles divergentes, export accidental,
backend contracts incluidos por un import frontend y drift Domain. Hash, exports,
clean install y parity gates son obligatorios.

Diferidos no bloqueantes: registry publication (prohibida MVP), TypeScript
declarations, Cloud Run, IDs/región productivos y deploy remoto. La versión Node
exacta de Functions se fija en 03B-B dentro del rango aprobado.

## 17. Cierre

Quedan resueltos topología, identidad, manifests, workspace, lockfiles, consumos,
deploy inclusion, autoridades Domain, source of truth, export map, boundaries,
migración, tratamiento parcial, supply chain, tests, CI y rollback.

Decision: `SaaS-03B-B0-I-R1 = COMPLETE`, pendiente de revisión humana. No se
inicia R2 ni 03B-B.

## 18. Implementación posterior R2

R2 implementó el workspace, package manifest/export map, dos lockfiles, artifact
privado contenido en `functions/vendor` y los ocho package imports. Domain sigue
intacto. Las pruebas de package, clean install Functions, pack inventory,
repositorios, prechecks, Rules y build pasan. R2 queda `completed`; R2-C1 es
`next_not_started` y R3 continúa bloqueada.

## 19. Verificación R2-C1

La revisión confirmó conformidad R1→R2, clean installs, Functions aislado,
lockfiles, artifact reproducible y adapters. No hubo corrección técnica. Tras el
push humano, R3 queda `ready_not_started`.

R3-A later made the R1 authority split actionable: 27 executable contracts need
package extraction with Domain reexports; 13 structural/cross-aggregate
contracts remain temporary Domain authority pending later review.

R3-B validates the authority split: Domain adapters reexport seven package-owned
objects, with no package-to-Domain edge and strict reference parity.

R3-C confirms the same authority direction for roles, scopes and workflow
actors; the package still has no edge to Domain.
