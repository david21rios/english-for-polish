# SaaS-03B-B0-I-R4 — Final Deduplication and Package Closure

## 1. Decision

R4 closes as **RESULT A — NO ADDITIONAL TECHNICAL MIGRATION**.

The audit found no defective or unexplained shared-contract duplication, no
missing pure validator required by both current frontend and future backend, and
no missing approved runtime schema. The package boundary is explicit, pure,
reproducible, browser/Node compatible, and independently consumable by the
Functions package. Creating new nullable/immutable arrays, per-command payload
validators, lifecycle helpers, or runtime representations merely to enlarge the
API would invent contracts or move persistence/backend concerns without an
approved consumer. No technical change is justified.

```text
SaaS-03B-B0-I-R4 = completed_pending_human_review_and_push
SaaS-03B-B0-I-R4-C1 = ready_not_started
PURE_CONTRACT_PHYSICAL_EXTRACTION = implementation_complete_pending_R4_C1
SaaS-03B-B = blocked_pending_B0_I_R4_C1
Privileged Backend = not_created
```

R4-C1 and 03B-B were not started.

## 2. Git baseline and prerequisites

- branch: `main`;
- initial HEAD: `b651811fcd4401b1044dd6767a9a41de8b691507`;
- initial `origin/main`: `b651811fcd4401b1044dd6767a9a41de8b691507`;
- initial worktree: clean;
- R3-H, R3-C1-R1, R3-C1-R2, and R3-C1: published and reconciled.

The audit reconciled the B0/B0-I design, R1 topology decision, R2/R2-C1
implementation, R3 authority inventory and final reports, R3-C1 reconciliations
and closure, the Implementation Order, Architecture Freeze, applicable ADRs,
Domain 1.2.0, the physical/persistence model, package, Functions artifact,
Shared, repositories, Rules, tests, and current Git state.

## 3. Package inventory and boundary

`@mipymetic/saas-contracts@0.6.0` contains 30 shipped entries: README and
manifest, plus source modules grouped under `domain`, `persistence`,
`validation`, `commands`, `authority`, `audit`, `errors`, and `internal`.

Its exact public subpaths remain:

```text
.
./domain
./persistence
./validation
./commands
./authority
./audit
./errors
```

All barrels use explicit named exports. There are no wildcard public exports,
accidental subpaths, missing approved exports, backend executors, or internal
path leakage. `src/internal/json.js` is an implementation module; its approved
portable operations are intentionally surfaced through `./validation` while the
internal file path itself is not exported.

The package is private, scoped, ESM, side-effect-free, has a files allowlist and
Node `>=20`, and has zero runtime, peer, optional, or bundled dependencies and
zero install hooks. Its modules import only package-local modules and permitted
standard ECMAScript APIs. Package-to-`src/` runtime imports are zero. Firebase,
React, Vite runtime, DOM/storage, filesystem, networking, environment, Buffer,
credentials, and secrets are absent. Cycle and dependency audits pass.

### Module classification

| Module family | Classification | Closure |
|---|---|---|
| domain | `UNIVERSAL_BROWSER_AND_NODE` | package physical authority for 21 migrated runtime contracts |
| persistence | `UNIVERSAL_BROWSER_AND_NODE` | pure field/path contracts; no SDK types |
| validation | `UNIVERSAL_BROWSER_AND_NODE` | portable primitives and canonical JSON surface |
| commands | `BACKEND_ONLY_CONTRACT` | declarative only; no executor/transport/persistence |
| authority | `BACKEND_ONLY_CONTRACT` | declarative only; no evaluator or Auth integration |
| audit | `BACKEND_ONLY_CONTRACT` | declarative only; no writer/logger/persistence |
| errors | universal vocabulary plus backend declarative extension | RepositoryError remains outside package |
| internal/json.js | `INTERNAL_NOT_EXPORTED` by file path | public operations exposed only through validation API |
| Domain/repository wrappers | `FRONTEND_ONLY_ADAPTER` compatibility surface | retained |

## 4. Duplication and authority closure

The global scan classified matches as package definitions, compatibility
adapters, Shared client infrastructure, structural Domain shapes, Domain-owned
workflows, backend-deferred descriptors, Rules literals, fixtures,
documentation examples, legacy product copies, or unrelated similarities.

The two CEFR arrays in legacy AI/product services are legacy product copies,
outside the SaaS contractual authority path. They are not imported by the
package or Domain adapters and are not made authoritative by R4. Rules literals
and test fixtures remain legitimate independent representations.

Final results:

```text
AUTHORITATIVE_DUPLICATION = 0
DEFECTIVE_DUPLICATION = 0
UNEXPLAINED_DUPLICATION = 0
PACKAGE_TO_SRC_DEPENDENCIES = 0
ACCIDENTAL_PUBLIC_EXPORTS = 0
MISSING_REQUIRED_SHARED_CONTRACTS = 0
```

The 12 JSDoc/entity/value-object shapes remain
`STRUCTURAL_SHAPE_DOMAIN_AUTHORITY`. The five complete workflows remain
`WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY`. `APPROVE_REGISTRATION_REQUEST` remains
`BACKEND_DEFERRED`. No runtime shape, workflow, transition, or command executor
was invented.

## 5. Adapter inventory and decisions

All nine Domain adapters are `KEEP_COMPATIBILITY_ADAPTER`:

| Adapter | Contract family | Current consumers / reason |
|---|---|---|
| `domain/academic/enums.js` | Course/Enrollment statuses, CEFR | academic modules, repositories, workflows, tests; preserves Domain path |
| `domain/authorization/capabilities.js` | capability IDs/catalog | workflows, authorization consumers and tests |
| `domain/authorization/enums.js` | platform roles/scopes | authorization surface and tests |
| `domain/authorization/identitySelfCapabilities.js` | self capabilities | authorization compatibility surface |
| `domain/authorization/roleCapabilityMatrix.js` | role matrix | authorization/workflow consumers |
| `domain/identity/accessStatePrecedence.js` | access-state pure contracts | identity/authorization compatibility surface |
| `domain/identity/enums.js` | access/request statuses | identity/workflow/repository consumers |
| `domain/organization/enums.js` | Tenant/Membership contracts | organization/workflow/repository consumers |
| `domain/workflow/actors.js` | workflow actors | five Domain workflow descriptors |

They explicitly reexport the same package instances and do not clone, spread,
refreeze, or reconstruct values. Removal would break legitimate historical
imports and is not authorized before functional cutover.

The eight earlier client adapters are also retained: six repository validation
surfaces reexport persistence field contracts, Shared identifiers maps pure
identifier failure to `RepositoryError`, and Shared paths preserves the existing
client API while using package path builders. Their status is
`DEFER_ADAPTER_REMOVAL_TO_FUNCTIONAL_CUTOVER`.

Adapters removed in R4: zero.

## 6. Persistence, validators, and schemas

### Persistence

Package-owned contracts comprise the exact field/required-field arrays for the
six implemented SaaS roots, the Identity profile update allowlist, and pure
builders for Identity, Tenant configuration, RegistrationRequest/key,
Membership/key, Course, Enrollment, platform authority/control, privileged
command, and platform/Tenant audit paths.

Firestore serializers, timestamps, snapshots, references, queries, cursors,
repositories, transaction behavior, and runtime lifecycle invariants remain
`PERSISTENCE_SPECIFIC` and outside the package. Cursor policy IDs remain with
their owning repository because B0 explicitly rejected speculative cursor API
extraction without a second consumer.

### Validators

| Contract | Final owner |
|---|---|
| document identifier predicate/result | `PACKAGE_OWNED` |
| plain-object, exact/required keys, enum membership | `PACKAGE_OWNED` |
| canonical BCP 47 | `PACKAGE_OWNED` |
| deep JSON copy/freeze and canonical JSON/UTF-8 | `PACKAGE_OWNED` |
| Domain enum/transition values | `PACKAGE_OWNED`, Domain compatibility adapter |
| Shared identifier error mapping / same-Tenant assertion | `SHARED_CLIENT_ONLY` |
| repository entity/lifecycle validators | `PERSISTENCE_DEPENDENT` |
| cursor/options validators | `PERSISTENCE_DEPENDENT` |
| command authorization/state/payload execution validation | `BACKEND_DEFERRED` |
| Firebase/snapshot/timestamp validation | `OUT_OF_SCOPE` / prohibited in package |

Repository validators preserve exact `RepositoryError` codes, operations,
resources, and messages. Moving them would not remove an authoritative pure
duplicate; it would couple the package to client infrastructure or invent a new
neutral issue API. Existing package primitives cover the browser/backend shared
needs. Missing required shared validators: zero.

### Schemas and policies

Package-owned declarative schemas are the persistence field/path contracts,
command types/status/record fields and schema version, platform authority and
registry/state fields and schema version, audit fields/levels/results/limits and
schema version, plus common/backend error vocabularies.

Domain entity/value-object declarations remain `DOMAIN_STRUCTURAL`. Firestore
converters and repository lifecycle/cursor schemas are `PERSISTENCE_SPECIFIC`.
Per-command executable payload validation, authorization evaluation, and
backend result execution are `BACKEND_DEFERRED`; R4 does not manufacture new
payload-schema symbols from prose before the Functions foundation establishes
their implementation consumer. UI form and legacy schemas are `CLIENT_ONLY` or
`OUT_OF_SCOPE`. Missing approved shared runtime schemas: zero.

Command, authority, and audit modules remain declarative-only and coherent.
The R3-G boundary is unchanged: `REPOSITORY_ERROR_CODES` and `RepositoryError`
remain Shared/client; `COMMON_ERROR_CODES` and `BACKEND_ERROR_CODES` remain
package-owned without collapsing distinct semantics.

## 7. SemVer, EOL, and artifact

No public API or package source changed. Version remains `0.6.0`; a SemVer bump
would create a release without a technical delta. The repository EOL rule
`packages/saas-contracts/** text eol=lf` remains unchanged and its package test
passes.

The unchanged vendored artifact is
`functions/vendor/mipymetic-saas-contracts-0.6.0.tgz`:

- SHA-256: `6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`;
- npm shasum: `a4a6580a36ce66d139aa3362354a18d8e1c2d4fc`;
- integrity: `sha512-TRNmDHBGJhlBsDHAt7VI2BWlgU0hZelGAetdguk8S1zTZAWH0X1f/JfbytUtNtQLkYZVEq4tx6iH16nMDZSLvA==`;
- packed size: 7,682 bytes;
- unpacked size: 34,038 bytes;
- inventory: 30 entries;
- exclusions: tests, `node_modules`, secrets, credentials, and external files.

`npm pack --dry-run --json`, the source inventory, artifact manifest, and
Functions lockfile agree. A fresh pack from a clean checkout is byte-identical
to the vendor artifact. Source/artifact parity and reproducibility pass.

## 8. Clean checkout and runtime compatibility

A new local clone of the published R4 baseline passed:

- `npm ci --ignore-scripts` (919 packages; no local/untracked dependency);
- package tests 26/26;
- general tests 35/35;
- Vite production build, 816 modules;
- fresh artifact SHA/size exact match.

Functions passed an isolated `npm ci --ignore-scripts` with one package and
resolved the root plus all seven public subpaths: 8/8 imports. Root Node import
simulation also resolved 8/8. Neither uses Firebase Functions runtime or Admin
SDK. Browser/Vite compatibility passes.

## 9. Full validation matrix

- package/API/validation/persistence/command/authority/audit/error tests: 26/26 PASS;
- dependency, forbidden-import, cycle, purity, EOL, artifact tests: PASS;
- Domain/reference-identity and adapter compatibility: PASS;
- five-workflow parity: PASS;
- Shared: 51/51 PASS;
- RegistrationRequest: 59/59 PASS;
- Membership: 23/23 PASS;
- Course: 51/51 PASS;
- Enrollment: 46/46 PASS;
- Enrollment precheck: 111 total, 42 ALLOW, 69 DENY; outcomes 42/41/28/0;
- Course precheck: 114 total, 32 ALLOW, 82 DENY; outcomes 32/56/26/0;
- Membership precheck: 81 total, 44 ALLOW, 37 DENY; outcomes 44/26/11/0;
- RegistrationRequest precheck: 52 total, 34 ALLOW, 18 DENY; outcomes 34/14/4/0;
- Rules preflight: 222 total, 88 ALLOW, 134 DENY, PASS;
- general tests: 35/35 PASS;
- build: PASS, 816 modules;
- Node syntax: 130 scoped files PASS;
- scoped lint: 130 files, 0 errors, 0 warnings;
- `git diff --check`: PASS.

Global lint remains the recorded non-blocking legacy baseline: 13 errors and 8
warnings in 11 files; B0-I/R4 delta is zero. Root clean install reports the
existing 25 vulnerabilities (3 low, 9 moderate, 13 high). The package has zero
runtime dependencies and Functions installs only the vendored package, so
package/Functions attributable findings and the B0-I supply-chain delta are
zero. No dependency update or `npm audit fix` occurred.

## 10. Changes, risks, and rollback

Technical changes: none. No adapter, validator, schema, manifest, package,
lockfile, artifact, Domain, Shared, repository, Rule, index, Storage Rule,
Firebase configuration, UI, workflow, or backend file changed.

Deferred findings remain explicit rather than hidden: legacy product CEFR
copies, global lint debt, root dependency debt, structural Domain shapes,
Domain-owned workflows, repository/cursor validators, and backend executable
payload/authorization validation. Each has an owner and phase boundary; none is
an ambiguous shared authority or R4 blocker.

Risks are accidental adapter removal before functional cutover, treating Rules
literals/fixtures as defective duplicates, exposing internal helpers by path,
or implementing backend semantics in the declarative package. R4 prevents these
through explicit classifications and independent R4-C1.

Rollback is documentation-only: revert the R4 documentation commit and restore
the prior roadmap checkpoint. No technical or data rollback is required.

## 11. Closure and next action

All R4 closure gates pass. `PURE_CONTRACT_PHYSICAL_EXTRACTION` is implemented
but remains pending independent R4-C1 review. Human review and push of this
documentation commit are required before starting R4-C1. The privileged backend
remains uncreated and 03B-B remains blocked.
