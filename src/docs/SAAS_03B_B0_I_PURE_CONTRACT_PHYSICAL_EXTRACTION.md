# SaaS-03B-B0-I — Extracción física de contratos puros

## 1. Resultado

B0-I materializó un árbol puro parcial, caracterizó sus contratos y conectó
allowlists, identifiers y paths existentes mediante adaptadores compatibles.
La fase no puede cerrarse porque la topología autorizada prohíbe simultáneamente
modificar Domain y crear configuración de paquete/workspace.

```text
SaaS-03B-B0-I = incomplete_package_topology_blocker
SaaS-03B-B = blocked
PURE_CONTRACT_PHYSICAL_EXTRACTION = partial_uncommitted
PACKAGE_TOPOLOGY_BLOCKER = open
```

No se crearon commits. El código parcial queda disponible para revisión humana,
pero no se presenta como paquete consumible por Functions.

## 2. Fuentes e inventario

Se revisaron B0, 03B-A/R1, ADR y Architecture Freeze, Domain 1.2.0, persistencia
y seguridad, Shared y los seis repositorios con validadores, serializers,
queries, cursores, unit/runtime tests y prechecks. El inventario distinguió
constantes iguales por valor de contratos iguales por autoridad.

Duplicaciones autoritativas eliminadas: field allowlists/required fields de
Identity, Tenant, RegistrationRequest, Membership, Course y Enrollment. La regla
de identificador y construcción de diez paths SaaS existentes se delegó al árbol
puro conservando wrappers RepositoryError.

## 3. Estructura creada

```text
packages/saas-contracts/
  src/
    audit/contracts.js
    authority/contracts.js
    commands/contracts.js
    errors/codes.js
    internal/json.js
    persistence/fields.js
    persistence/paths.js
    validation/identifiers.js
    validation/objects.js
    index.js
  __tests__/contracts.test.mjs
```

No se añadió `package.json`: hacerlo estaba prohibido. Por ello es un árbol ESM
puro importable relativamente por Vite, no aún un paquete desplegable.

## 4. API pública y contratos extraídos

El barrel usa exports explícitos. Expone:

- allowlists/required fields de los seis roots;
- predicates de identifiers/plain objects/exact keys/required keys/enums/BCP47;
- builders para Identity, Tenant/config, Request/key, Membership/key, Course,
  Enrollment y roots R1 de authority/control/command/audit;
- command types/status/schema;
- platform authority/status/schema;
- audit levels/results/schema/limits;
- common/backend error-code vocabularies declarativos;
- JSON-compatible deep copy/freeze y canonical JSON/UTF-8 preparation.

No implementa hashing, comandos, autorización, auditoría, persistence ni SDK.

## 5. Contratos no extraídos

- Todos los enums, lifecycles, capabilities y role-capability matrix de Domain
  permanecen autoritativos en `src/domain/`.
- RepositoryError y Firebase mapper permanecen en Shared.
- Snapshot/Timestamp serializers, query builders, cursors, repositories,
  dependency injection y runtime fixtures permanecen intactos.

Copiar los enums Domain al árbol habría creado dos fuentes. Importarlos desde
`src/` habría violado `packages/saas-contracts ↛ src`. Convertir Domain en
adaptadores habría modificado Domain, expresamente prohibido.

## 6. Adaptadores y consumidores

Los seis validation modules conservan los mismos nombres exportados, ahora
reexportados desde `persistence/fields.js`. Shared identifiers delega el
predicate puro pero sigue creando el mismo RepositoryError. Shared paths valida
con sus wrappers y llama builders puros. APIs, mensajes, códigos, queries,
cursores y serializers permanecen iguales.

Consumidores migrados indirectamente: Identity, Tenant, RegistrationRequest,
Membership, Course y Enrollment serializers/repositories que ya importaban esos
módulos. No se cambió ningún barrel público de repositorio.

## 7. Dependency audit y compatibilidad

El test recorre `packages/saas-contracts/src` y rechaza imports Firebase,
Admin/Functions, React/Vite, `src/firebase`, globals browser/storage, Buffer y
Node fs/path/process. No usa dependencias npm nuevas.

El código compartido usa sólo ECMAScript, `Intl.getCanonicalLocales` y
`TextEncoder`. Vite puede resolver los imports relativos y no se exponen módulos
backend. El backend futuro no puede consumir correctamente este árbol desde un
artefacto Functions independiente hasta aprobar una topología de paquete.

## 8. Pruebas y defectos

Se añadieron caracterizaciones de API explícita, freezing, allowlists, paths,
identifiers, BCP47, enum membership, deep copy/freeze, canonical JSON/UTF-8,
contratos declarativos y dependencia prohibida.

Defecto encontrado: el primer patrón del dependency audit interpretaba la
palabra “document” en mensajes como uso del DOM. Se corrigió para detectar uso
ejecutable del global. ESLint detectó después una variable local obsoleta en el
adapter de identifiers; se eliminó. Ninguno afectó comportamiento productivo.

## 9. Bloqueador y resolución requerida

`PACKAGE_TOPOLOGY_BLOCKER` requiere autorización conjunta para:

1. crear `packages/saas-contracts/package.json` con exports ESM explícitos;
2. decidir workspace/file dependency e inclusión en el artefacto Functions;
3. modificar los archivos Domain únicamente como compatibility reexports, sin
   cambiar valores de Domain 1.2.0;
4. migrar enums/capabilities/lifecycles a una sola fuente;
5. actualizar lockfile sólo mediante tooling aprobado;
6. repetir browser bundle, import graph y tests completos.

Hasta entonces la foundation queda bloqueada. No se recomienda publicar el
paquete ni duplicar Domain.

## 10. Rollback

Retirar `packages/saas-contracts`, restaurar las seis allowlists locales y los
dos adapters Shared. No existen cambios de datos, Rules, índices, paquetes ni
Firebase. Los documentos heredados se preservan.

## 11. Estado y siguiente fase

La siguiente fase requerida es
`SaaS-03B-B0-I-R1 — package topology and Domain compatibility resolution`,
`required_not_started`. Sólo tras cerrarla podrá existir una nueva ejecución de
extracción/revisión y habilitar 03B-B.

## 12. Resolución posterior B0-I-R1

B0-I-R1 resolvió el bloqueo sin modificar la implementación parcial. La
topología contractual usa `@mipymetic/saas-contracts` como package ESM privado
en un workspace raíz para frontend/tests y un tarball versionado generado por
`npm pack` dentro de `functions/vendor` para el artifact Functions. Así el
deploy no depende de un path externo al `sourceDir`.

Domain 1.2.0 continúa siendo autoridad normativa; R3 trasladará la autoridad
física portable al package y dejará reexports compatibles. R2 implementará
manifests, export maps, lockfiles y packaging; R4 cerrará la deduplicación.

```text
SaaS-03B-B0-I = incomplete_superseded_by_resolution
SaaS-03B-B0-I-R1 = completed_pending_human_architecture_review
SaaS-03B-B0-I-R2 = ready_not_started
PACKAGE_TOPOLOGY_BLOCKER = resolved
SaaS-03B-B = blocked_pending_B0_I_R2_R3_R4
```

## 13. Implementación de topología R2

R2 convirtió este árbol en `@mipymetic/saas-contracts@0.1.0`, añadió export maps
y workspace root, reemplazó los ocho imports relativos y creó el artifact
Functions contenido. La topología y lockfiles están implementados; Domain no se
migra hasta R3. Las 12 pruebas del package y toda la regresión pasan.

## 14. Revisión R2-C1

La topología pasó clean installs raíz/Functions y el artifact coincide byte por
byte con el package. No hay dependencias prohibidas, ciclos ni duplicación
residual extraída. R2-C1 queda pendiente de push; R3 está `ready_not_started`.

R3-A completed the Domain inventory and consumer/duplication graph without
technical changes. The next planned slice is foundational enums/statuses R3-B.
