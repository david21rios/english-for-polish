# SaaS-03B-C-R3 — Platform Authority Persisted Schema Versioning Resolution

## Decision

No prior identifier exists for this blocker. `SaaS-03B-C-R3` is the new direct
resolution beneath 03B-C. Result: **VERSIONING POLICY CLOSED**.

This microphase changes documentation only. It does not add `schemaVersion`,
`transitionCommandId`, validators, a Transaction Store or business commands.

## Current inventory and semantics

`AUTHORITY_SCHEMA_VERSION` is exported from
`@mipymetic/saas-contracts/authority` and the package root with value `1`; its
derived declaration is public and it is shipped in the Functions artifact.
The only persisted consumer demonstrated by code and normative documentation is
the Platform Authority Registry, whose exact fields are `schemaVersion`,
`bootstrapState`, `activeCount`, `revision`, `lastCommandId` and `updatedAt`.

The Platform Authority exact shape instead contains twelve required fields:
`uid`, `authority`, `status`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`,
`activatedAt`, `revokedAt`, `revokedBy`, `bootstrapCommandId` and
`lastClaimSyncAt`. Five are nullable: `activatedAt`, `revokedAt`, `revokedBy`,
`bootstrapCommandId` and `lastClaimSyncAt`. It has no schema discriminator and
no complete runtime validator.

Therefore the constant cannot truthfully be interpreted as the persisted
version of both shapes. Its current real persisted semantics are registry
version 1. The Authority omission is classified **HISTORICAL_OMISSION / INCOMPLETE_CONTRACT**,
not deliberate external version inference. The current 12-field Authority is a
legacy unversioned design, not a formally persisted “authority v1”.

Other related schemas remain independent: privileged command and audit records
each persist their own `schemaVersion: 1`; tenant authority state has its own
field list and is outside this resolution.

## Strategies considered

- **A — explicit Authority discriminator:** selected. It gives deterministic,
  exact, fail-closed reads and supports future schema evolution.
- **B — package-version-only:** rejected; persisted documents outlive package
  releases and cannot reveal their shape version.
- **C — field-presence inference:** rejected; it creates a second, implicit
  discriminator and can hide corruption.
- **D — independent Authority/Registry versions:** selected. Ownership changes
  Authority without changing Registry.
- **E — one shared version:** rejected; it would bump unchanged Registry shapes
  and couple unrelated evolution.
- **F — accept legacy/current unions indefinitely:** rejected before first
  deployment; it adds migration complexity without evidenced production data.

## Version names and evolution policy

The following names are normatively approved for the later technical ownership
resolution:

```text
PLATFORM_AUTHORITY_SCHEMA_VERSION = 1
PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION = 1
```

`AUTHORITY_SCHEMA_VERSION` is currently the ambiguous registry-v1 constant. At
technical materialization it must be replaced by the two explicit constants.
It may remain as a deprecated compatibility alias of
`PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION` for one package-major compatibility
window, but no new code may consume the alias. Removing it requires the package
SemVer policy below.

Authority and Registry versions advance independently and only when their own
persisted exact shape or semantics change incompatibly. Equal numeric values do
not imply shared versioning.

## First explicit Authority schema

The ownership resolution may define the first explicit Authority schema as:

```text
schemaVersion = PLATFORM_AUTHORITY_SCHEMA_VERSION (1)
transitionCommandId = required nullable ownership field
the existing twelve fields
```

`schemaVersion` is the sole discriminator. Field presence never substitutes for
it. The ownership resolution still owns the exact transitionCommandId status
matrix and validator implementation; neither is implemented here.

All writers use the shared constant. `schemaVersion` is server-owned metadata,
never accepted from Bootstrap/Recover/Revoke payloads. Readers accept only the
current explicit version and exact shape. Missing, null, non-integer, negative,
unknown or future versions fail closed. Missing newly required fields also fail
closed. There is no silent default to version 1.

Registry remains exact version 1 and keeps its existing shape. The future
registry validator should use the registry-specific constant; its creation can
remain in the Transaction Store resolution because no Registry shape changes
here.

## Data, compatibility and migration

Repository and roadmap evidence establishes:

- BootstrapPlatformAdmins has never been implemented or executed by this work;
- the privileged backend has not been deployed;
- there are no public handlers or other writers for `platformAuthorities`;
- these phases used no remote Firebase access;
- tests and fakes are not production data.

Classification: **NO_PERSISTED_PRODUCTION_AUTHORITY_DATA_EVIDENCE**. This is not
an assertion that no Firebase project could contain unrelated data; it is the
bounded evidence relevant to this backend and collection.

Migration policy: **MIGRATION_DEFERRED_UNTIL_FIRST_DEPLOYMENT / NO MIGRATION
REQUIRED FOR THE APPROVED FIRST DEPLOYMENT**. Before first deployment, the
ownership resolution and Transaction Store must write only explicit Authority
schema 1. No legacy compatibility reader, automatic defaulting or migration
script is authorized. If human operational evidence later establishes existing
Platform Authority records, deployment stops and a separate data compatibility
microphase is required.

## TypeScript, validators and SemVer

The exact Authority shape is package-public even though backend-only. Adding
required `schemaVersion` and `transitionCommandId`, adding a current Authority
type/validator, and splitting or deprecating the version constant change public
source contracts.

Policy for the later technical release:

- if `AUTHORITY_SCHEMA_VERSION` remains as a compatibility alias and all prior
  exports remain usable, the additive explicit constants/validator/field lists
  require a package **MINOR** release (`0.7.0 -> 0.8.0`);
- if the ambiguous export is removed or its value/meaning is incompatibly
  changed, package **MAJOR** is required;
- PATCH is prohibited for this materialization.

Persisted schema version and npm SemVer are separate: Authority schema 1 can be
introduced by package 0.8.0 because one versions stored document shape and the
other versions the public library API.

Declarations remain generated from JS/JSDoc. The ownership resolution must add
a complete pure runtime Authority validator, exact current type and tests; no
manual declaration drift or `any` is permitted. The Registry validator remains
separately scoped to the Transaction Store unless ownership materialization
proves it strictly necessary earlier.

## Read/write, rollback and risks

Current-only reads maximize fail-closed behavior before first deployment. The
principal risk is undiscovered pre-existing Platform Authority data. The
operational gate above prevents deployment if such evidence appears.

Before any records exist, rollback is code/package/artifact rollback. After
explicit schema-1 records exist, rolling back to code that understands only the
legacy unversioned shape is unsafe and prohibited; rollback must retain a reader
for schema 1 or use a separately approved data migration/reconciliation plan.

## Roadmap

```text
SaaS-03B-C-R3 = completed_pending_human_review_and_push
Platform Authority Transition Ownership Resolution = blocked_pending_R3_push
Platform Command Transaction Store Boundary = blocked
SaaS-03B-C = blocked
SaaS-03B-D = blocked
03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, resume Platform Authority Transition Ownership.
Then resolve the Transaction Store. Only afterward may 03B-C implementation be
retried.
