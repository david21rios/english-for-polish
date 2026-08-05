# SaaS-03B-B0 — Diseño de extracción de contratos puros

## 1. Propósito y alcance

Esta fase identifica y organiza los contratos reutilizables entre el frontend
actual y el backend privilegiado futuro. El prompt autoriza exclusivamente
documentación: no se mueve Domain, no se crea paquete, código, Functions,
Firebase SDK, transporte ni servicio.

```text
SaaS-03B-B0 = completed_design_only
SaaS-03B-B0-I = ready_not_started
SaaS-03B-B = blocked_pending_03B_B0_I
PURE_CONTRACT_PHYSICAL_EXTRACTION = not_started
```

La extracción física requiere una autorización separada porque implicará crear
un paquete y adaptadores de compatibilidad, y posiblemente ajustar configuración
de packages. Llamar a este resultado “extraído” sería incorrecto.

## 2. Fuentes e inventario

Se revisaron Domain 1.2.0 completo; Shared; Identity, Tenant,
RegistrationRequest, Membership, Course y Enrollment repositories, validaciones,
serializers, cursores, queries, barrels y tests; contratos 03A; auditoría 03B-A,
resolución 03B-A-R1, roadmap y Scope; configuración, Rules, índices, scripts y
workflow en lectura.

Los contratos actuales están distribuidos en tres niveles:

1. Domain puro: enums, capabilities, matriz role/capability, lifecycles y
   descriptores workflow.
2. Shared cliente: identifiers, paths y errores, algunos puros en concepto pero
   acoplados a `RepositoryError` o semántica Firestore cliente.
3. Repositorios: allowlists, validación de shapes/lifecycle, options, cursores,
   serializers de snapshots y mapeos SDK.

R1 añade contratos todavía documentales: command envelope/record, platform
authority, audit, authorization context backend, canonical payload hashing y
result/error metadata.

## 3. Contratos encontrados y clasificación

| Familia | Fuente actual | Pureza | Decisión |
|---|---|---:|---|
| Tenant/Membership/Course/Enrollment/Request/Access enums | `src/domain/**/enums.js` | total | candidato obligatorio |
| lifecycle transitions/workflow actors | Domain enums/workflow | total | candidato obligatorio, sin ejecutar comandos |
| capability IDs/scopes/catalog/matrix | Domain authorization | total | candidato obligatorio |
| JSDoc entity/value-object shapes | Domain model files | total/declarativa | candidato para tipos y schemas, no serializer |
| field allowlists/required/nullable | repository validation modules | constants pure | candidato obligatorio |
| identifier names/rules | Shared identifiers | logic pure, error coupled | extract predicate/result; retain wrapper |
| tenant consistency | Shared identifiers | logic pure, error coupled | extract predicate/assertion-neutral result |
| path builders | Shared paths | string logic pure, validator coupled | extract after neutral identifiers; retain wrappers |
| BCP 47 and CEFR validation | Course validation | pure platform APIs, error coupled | extract normalized validator result |
| nested Course copy/freeze | Course validation | pure | candidate as value-object normalizer |
| lifecycle shape validation | Tenant/Request/Membership/Course/Enrollment validation | pure rules, error coupled | extract rule functions; adapters map errors |
| list options/page limits | query modules | pure but client-query-specific | keep client-side unless backend command needs same contract |
| cursor envelopes/policies | cursor modules | pure encoding plus browser APIs | do not place in foundation core; separate optional query-contract export |
| repository error codes | Shared errors | constants pure | common codes candidate |
| RepositoryError/Firebase mapper | Shared errors | client repository/Firebase semantics | discarded from portable core |
| Firestore dependency injection | Shared dependencies | SDK boundary | discarded |
| snapshot serializer | Shared/domain serializers | snapshot/Firestore-like boundary | discarded |
| timestamp serializer | Shared timestamps | accepts SDK-like `toDate` | discarded; pure ISO/date rules extracted separately only if required |
| repository/query factories | repositories | SDK and policy execution | discarded |
| command/authority/audit schemas | R1 documentation | pure and required | candidate mandatory for physical phase |
| canonical command JSON/hash input | R1 documentation | pure | candidate mandatory; hashing adapter separate |
| metadata size/allowlist contracts | R1 documentation | pure | candidate mandatory |

## 4. Candidatos definitivos

### 4.1 Domain vocabulary

- `TENANT_TYPES`, `TENANT_STATUSES`, `MEMBERSHIP_ROLES`,
  `MEMBERSHIP_STATUSES`;
- `CEFR_LEVELS`, `COURSE_STATUSES`, `ENROLLMENT_STATUSES`;
- `ACCESS_STATES`, `REGISTRATION_REQUEST_STATUSES`, `PLATFORM_ROLES`,
  `CAPABILITY_SCOPES`;
- capability IDs/catalog and role-capability matrix;
- canonical transition maps and workflow actor identifiers.

Domain remains normative. Physical extraction must move the implementation to
the neutral package and leave compatibility re-exports at every existing Domain
path; it must not maintain two independently editable copies.

### 4.2 Physical/document contracts

- field allowlists, required and nullable sets for Identity, Tenant,
  RegistrationRequest, Membership, Course and Enrollment;
- exact nested shapes for learning/interface languages;
- canonical identifier names and segment constraints;
- pure document/collection path builders for existing roots plus R1 roots;
- platform authority, authority registry, tenant-admin constraint, command
  record and audit event schemas;
- schema versions and metadata size limits.

Path builders return strings and reject invalid segments through a neutral
validation result/error code. They never accept SDK references.

### 4.3 Validation and normalization

- `isPlainObject`, exact-key/unknown-field validation and required-field checks;
- identifiers, canonical BCP 47, CEFR and enum membership;
- lifecycle/state-transition predicates;
- same-tenant and ID/path consistency predicates;
- deep-copy/deep-freeze for plain JSON-compatible value objects;
- canonical JSON normalization for command hashing.

Portable validators return a discriminated result:

```text
{ ok: true, value }
{ ok: false, issue: { code, field, reason } }
```

They do not instantiate `RepositoryError`, backend errors or transport errors.
Frontend/backend adapters map issues to their own error classes without changing
codes or exposing values.

### 4.4 Command and metadata contracts

- exact command envelope and per-command schemas approved by R1;
- command type/status enums and replay/result shapes;
- audit level/result enums and exact audit metadata schema;
- authority lifecycle and registry schema;
- error code vocabulary including backend extensions;
- canonical payload projection before SHA-256.

The pure package canonicalizes payload bytes but does not perform credential
checks, persistence, transactions, hashing key management or audit writes.

## 5. Contratos descartados

The following remain in adapters and cannot enter the portable package:

- Firebase client/Admin imports, snapshots, DocumentReference, Timestamp,
  query constraints and dependency injection;
- `serializeSnapshot`, Firestore-like `timestampToIsoString`, `mapFirebaseError`
  and the existing `RepositoryError` class;
- repositories, query builders, `getDocs`/`startAfter`, transactions and Rules;
- callable/HTTP request objects, token/App Check verification and Functions
  configuration;
- React, Context, hooks, Providers, UI state and `src/firebase.js`;
- cursor browser codecs as a mandatory foundation dependency;
- secrets, project IDs, service-account data and runtime environment values.

Cursor constants may later be exposed through an optional `query-contracts`
subpath, but cursor encoding/decoding stays with the consumer until a shared use
case exists. No cursor code is moved speculatively.

## 6. Organización final propuesta

Physical phase `03B-B0-I` will create one dependency-free local package:

```text
packages/saas-contracts/
  package.json
  src/
    domain/
      enums.js
      capabilities.js
      lifecycles.js
      entitySchemas.js
    persistence/
      fields.js
      identifiers.js
      paths.js
    validation/
      results.js
      objects.js
      strings.js
      locales.js
      lifecycles.js
    commands/
      enums.js
      schemas.js
      canonicalPayload.js
    authority/
      schemas.js
      lifecycles.js
    audit/
      schemas.js
      metadata.js
    errors/
      codes.js
    index.js
  test/
```

It is ESM JavaScript with JSDoc during extraction, matching the current
frontend without adding a TypeScript build step. The future TypeScript Functions
project consumes its generated/inferred declarations or a later declaration-only
step. Introducing a compiler in B0-I is prohibited unless separately justified.

Public exports are explicit and grouped by subpath; internal helpers are not
exported. There is no default export, side effect, environment read, global
mutation or dependency.

## 7. Dependencies

Allowed:

- ECMAScript standard library;
- `Intl.getCanonicalLocales`;
- `TextEncoder` only where canonical UTF-8 bytes are explicitly produced;
- other modules inside the same pure package.

Forbidden:

- `firebase`, `firebase-admin`, `firebase-functions`;
- React/Vite/browser storage/DOM;
- Node filesystem, network, process/environment, Buffer and crypto in the core;
- repositories, services, UI, `src/firebase.js`;
- timestamps or references with SDK methods such as `toDate()`.

SHA-256 execution is a consumer adapter: the pure package returns canonical
UTF-8 bytes; backend uses an approved crypto implementation.

## 8. Compatibility strategy

Physical extraction must be expand-only:

1. characterize every current export with tests;
2. create neutral package and contract tests;
3. move one family at a time;
4. leave re-export/adapter modules at all current Domain/Shared/repository paths;
5. preserve names, values, frozen behavior, errors and public repository barrels;
6. run existing unit/runtime static prechecks after each family;
7. forbid duplicate authoritative constants through an import graph check;
8. only remove compatibility adapters in a later contract phase after consumers
   migrate.

Validators require special adapters: current frontend errors must remain byte-
compatible in code/operation/resource/message where tests assert them. Neutral
issues are mapped by the existing modules. No serializer output, cursor token,
query shape, path or API changes in B0-I.

## 9. Physical extraction batches

The authorized future implementation should use bounded batches:

1. package skeleton plus dependency-boundary tests;
2. enums/capabilities/lifecycles with Domain compatibility re-exports;
3. identifiers/paths/field sets with Shared and repository adapters;
4. neutral validation primitives and lifecycle validators;
5. R1 command/authority/audit schemas and canonical payload helper;
6. full compatibility and forbidden-import audit.

Each batch must preserve the baseline. If moving Domain files is not explicitly
authorized in B0-I, the package may initially re-export Domain vocabulary for
frontend use but the Functions deployment must then include the same source;
independent duplication remains prohibited.

## 10. Testing contract for B0-I

- exact enum values, frozen collections and transition matrices;
- capability matrix equality;
- exact field allowlists and nullable/required sets;
- valid/invalid identifiers and paths;
- BCP 47 and lifecycle validation parity;
- unknown/missing field results;
- canonical JSON determinism across key insertion order and Unicode;
- command/audit/authority schema allowlists;
- deep-copy/freeze with no SDK object acceptance;
- forbidden-import graph;
- compatibility imports from every existing path;
- all existing repository unit tests, prechecks, Rules preflight, general tests
  and build.

No Emulator is needed for the pure package itself. Existing runtime suites stay
unchanged and are executed later when integration scope authorizes Emulator.

## 11. Risks and controls

| Risk | Control |
|---|---|
| two sources of truth | move plus compatibility re-export; duplicate-constant check |
| error behavior regression | neutral issue adapter and characterization tests |
| frontend bundle gains backend code | zero dependency, explicit exports, bundle audit |
| backend imports client SDK indirectly | recursive forbidden-import test |
| canonical JSON differs by runtime | golden vectors for Unicode, arrays, numbers and key order |
| cursor/token compatibility changes | exclude cursor codecs from mandatory extraction |
| Domain freeze altered | values/transitions unchanged; human review before physical move |
| package/tooling scope expands | B0-I must explicitly authorize package configuration changes |

## 12. Decisions and state

```text
PURE_CONTRACT_PACKAGE = packages/saas-contracts
PURE_CONTRACT_FORMAT = ESM JavaScript with JSDoc
PURE_CONTRACT_RUNTIME_DEPENDENCIES = none
DOMAIN_SOURCE_STRATEGY = move once plus compatibility re-exports
VALIDATION_STRATEGY = neutral discriminated results plus consumer adapters
CURSOR_EXTRACTION = deferred until shared use exists
SERIALIZER_EXTRACTION = snapshot serializers prohibited; plain-value helpers allowed
PHYSICAL_EXTRACTION = not_started
```

Decision: B0 design is complete, but no physical extraction occurred because it
was not authorized. `SaaS-03B-B0-I — pure contract physical extraction and
compatibility adapters` is the exact next phase, `ready_not_started`.

## 13. B0-I execution result

B0-I created and validated a partial pure ESM tree and compatibility adapters,
but could not produce a deployable single-source package under the simultaneous
prohibitions on package/workspace and Domain changes.

```text
SaaS-03B-B0-I = incomplete_package_topology_blocker
SaaS-03B-B0-I-R1 = required_not_started
SaaS-03B-B = blocked
```

## 14. Package topology resolution

B0-I-R1 selecciona un workspace npm raíz y el package privado
`@mipymetic/saas-contracts`. Functions será un artifact npm independiente que
consume un tarball revisado dentro de `functions/vendor`; se rechaza
`file:../packages` porque Firebase sólo archiva el source root configurado.

Domain 1.2.0 permanece normativo. R3 moverá únicamente la implementación física
portable y dejará compatibility reexports. R2, R3 y R4 deben cerrar antes de
03B-B.

## 15. R2 topology implementation

La topología aprobada quedó materializada: package privado versionado, workspace
root, subpath exports, lockfile root, Functions lockfile y tarball verificado
dentro de `functions/vendor`. Los adapters usan package imports. Domain y sus
valores permanecen intactos para R3.

## 16. Cierre de topología

R2-C1 confirmó con clean installs, Functions aislado, pack dry-run y comparación
reproducible que la topología no depende accidentalmente de Vite. La extracción
sigue pendiente sólo por R3 y R4.

R3-A now divides the remaining Domain authority migration into reversible
families B–H plus final C1. This planning does not change the B0 package API.

R3-B expands `./domain` with seven foundational contracts and removes their
local physical copies through reference-identical reexports.
