# SaaS-03B-B0-I-R2 — Package topology implementation

## 1. Propósito y alcance

R2 implementa sin rediseño la topología aprobada en R1. Convierte el árbol
parcial en `@mipymetic/saas-contracts`, enlaza el frontend por npm workspace,
crea una frontera npm Functions independiente y contiene dentro de ella el
artifact privado exacto del package.

No crea Cloud Functions, Admin SDK, transportes, backend, Domain migration,
Firebase configuration ni deploy.

## 2. Package y workspace

`packages/saas-contracts/package.json` fija:

```text
name = @mipymetic/saas-contracts
version = 0.1.0
private = true
type = module
sideEffects = false
engines.node = >=20
runtime dependencies = 0
install scripts = 0
```

El root declara `workspaces: ["packages/saas-contracts"]`, una dependencia
exacta `0.1.0`, y sólo dos scripts nuevos: pruebas y `npm pack --dry-run`. npm
regeneró el lockfile root sin incorporar librerías: únicamente registra el
workspace/link local.

## 3. Export map

Se implementaron subpaths explícitos:

- `.`
- `./domain`
- `./persistence`
- `./validation`
- `./commands`
- `./authority`
- `./audit`
- `./errors`

Todos usan named exports. `internal/` no es importable como subpath. `domain`
queda deliberadamente sin exports hasta R3; su boundary existe y Domain 1.2.0
permanece intacto.

## 4. Functions y vendor artifact

`functions/` contiene sólo `package.json`, lockfile, README y `vendor/`. No hay
source backend. Su única dependencia es:

```text
@mipymetic/saas-contracts = file:vendor/mipymetic-saas-contracts-0.1.0.tgz
```

El tarball contiene 19 entradas, 4.4 kB empaquetados y 15.6 kB descomprimidos.
No incluye tests ni `node_modules`.

```text
SHA-256 = aba8c078e1abc7a2155973b0bf8ecec94aaeb633255870d9f48a503f200a2756
npm shasum = be3c15add28784fa804c31f32862346dbc919bcd
integrity = sha512-HPHmZGUOCJmPA65EWfgXzcVKlmMVs+pPSfIx6ufW3cXA+4+YxUMQuUrFmakKH05Xzs30CeFOcKcb6QDTz2ttMA==
```

`saas-contracts-artifact.json` congela identidad, hash e inventario. El lockfile
Functions resuelve exclusivamente ese tarball y `npm ci --prefix functions`
instala dos packages auditados, con cero vulnerabilidades.

## 5. Adaptadores

Los ocho adaptadores existentes sustituyeron imports relativos transversales
por `@mipymetic/saas-contracts/persistence` o `/validation`:

- seis validation modules de Identity, Tenant, RegistrationRequest,
  Membership, Course y Enrollment;
- Shared identifiers;
- Shared Firestore paths.

Sus exports, RepositoryError wrappers, mensajes, APIs, queries, cursores y
serializers permanecen iguales. No hay imports del package hacia `src/` ni
ciclos.

## 6. Pruebas

El package tiene 12 pruebas: API raíz, ocho subpaths, workspace resolution,
manifest, freezing, fields, identifiers, paths, BCP 47, canonical JSON,
dependency audit, Functions dependency, artifact SHA-256 e inventario.

`npm pack --dry-run --json` confirma las mismas 19 entradas y el mismo
shasum/integrity. Un proceso Node con cwd `functions/` importa
`@mipymetic/saas-contracts/persistence` correctamente desde el tarball instalado.

## 7. Validaciones

```text
node --check = PASS (19 JS/MJS)
ESLint = PASS
saas-contracts = 12/12 PASS
dependency audit = PASS
RegistrationRequest = 59/59 PASS
Membership = 23/23 PASS
Course = 51/51 PASS
Enrollment = 46/46 PASS
Shared = 51/51 PASS
Enrollment precheck = 111/42/69; 42/41/28/0
Course precheck = 114/32/82; 32/56/26/0
Membership precheck = 81/44/37; 44/26/11/0
RegistrationRequest precheck = 52/34/18; 34/14/4/0
Rules preflight = 222/88/134 PASS
general tests = 35/35 PASS
Vite build = PASS
npm pack --dry-run = PASS
Functions npm ci/import = PASS
git diff --check = PASS
```

## 8. Supply-chain y rollback

No se publicó nada. El package es privado, scoped, sin dependencies ni install
scripts. El artifact se encuentra dentro de la futura frontera deploy y se
verifica contra hash/inventario. Root y Functions conservan lockfiles separados.

Rollback técnico: restaurar manifests/lockfiles root, retirar únicamente
`functions/`, restaurar los ocho imports relativos y retirar manifest/barrels
R2 conservando el árbol parcial B0-I. No toca Domain, Rules, índices, datos,
Firebase ni documentación histórica.

## 9. Estado

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-A = completed
SaaS-03B-A-R1 = completed
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I = incomplete_superseded_by_resolution
SaaS-03B-B0-I-R1 = completed
SaaS-03B-B0-I-R2 = completed
SaaS-03B-B0-I-R2-C1 = next_not_started
SaaS-03B-B0-I-R3 = blocked_pending_R2_C1
SaaS-03B-B = blocked_pending_B0_I_R2_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = topology_implemented_pending_domain_migration
PACKAGE_TOPOLOGY_BLOCKER = resolved
Privileged Backend = not_created
```

La siguiente microfase es `SaaS-03B-B0-I-R2-C1 — package topology review and
controlled commits`, `next_not_started`. R2-C1 y R3 no se inician aquí.

## 10. Cierre independiente R2-C1

R2-C1 auditó commits, manifests, exports, workspace, lockfiles, artifact y ocho
adapters. Instalaciones limpias raíz/Functions pasaron; el tarball regenerado
fue byte-idéntico al versionado. No hubo defecto técnico ni commit técnico C1.
R2-C1 queda `completed_pending_human_push`; R3 queda `ready_not_started`.

R3-A subsequently completed the read-only Domain authority inventory. It found
40 Domain contracts and defined phased migration without reopening R2.
