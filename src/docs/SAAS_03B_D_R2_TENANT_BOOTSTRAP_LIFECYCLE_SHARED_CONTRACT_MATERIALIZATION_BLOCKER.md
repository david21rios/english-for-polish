# SaaS-03B-D-R2 — Tenant Bootstrap and Lifecycle Shared Contract Materialization Blocker

## Decision

`SaaS-03B-D-R2` stops before technical edits with **RESULT C**: no technical
materialization is safe because required semantics remain `NOT_SPECIFIED`.
Partial command-catalogue or validator additions would falsely present phase-D
contracts as closed and would require local invention.

The Git Gate passed at published commit
`d719cfefa1260d4a24de4ae10aabd6857c18efe7`. R1 remains authoritative and no
new normative or technical source has closed its gaps.

## Physical inventory

Starting package: `@mipymetic/saas-contracts@0.11.0`.

| Surface | Published state | R2 decision |
|---|---|---|
| BootstrapTenant command type | present | unchanged; type alone is insufficient |
| UpdateTenantProfile type | absent | not added |
| UpdateTenantSettings type | absent | not added |
| UpdateTenantBranding type | absent | not added |
| SuspendTenant type | absent | not added |
| RestoreTenant type | absent | not added |
| ArchiveTenant type | absent | not added |
| seven capabilities/matrices | present | sufficient, unchanged |
| command schema/stages | v2; not_started/prepared/completed | no new stage justified; D authorization remains blocked |
| Tenant/Membership field catalogues | present | no exact persisted runtime validators |
| settings/branding catalogues | absent | no arbitrary-object escape hatch allowed |
| membershipKey path | present | value schema and canonical encoder absent |
| tenant-admin authority-state fields/path | present | schema version and runtime validator absent |
| audit/error generic contracts | present | operation-specific allowlists/mappings absent |

Package, declarations, artifact and Functions dependency remain unchanged.

## Workflow readiness

### BootstrapTenant

Not ready for shared materialization. Its main payload and atomic aggregate are
documented, but the following remain unresolved:

- exact persisted settings and branding shapes/nullability;
- canonical membershipKey transformation and value schema;
- tenant-admin authority-state schemaVersion and validator;
- exact result `resourceType` and whether/how generated membershipId is exposed
  without extending the generic seven-field result;
- exact audit operations, resource types, summaries and metadata;
- exact package-owned input/persisted validators and command-stage allowlisting.

The command remains Firestore-only: Auth/Identity are evidence, Auth writes are
zero, and Tenant/config/first Membership/key/authority-state/command/audits must
commit together. These invariants do not supply the missing physical schemas.

### Update family

`UpdateTenantProfile`, `UpdateTenantSettings` and `UpdateTenantBranding` remain
authorized but normatively incomplete. No source closes their exact payloads,
required/optional/null fields, CAS token, repeat semantics or result/audit
literals. Settings and branding lack package field catalogues. Therefore none
of their command types or validators may be reserved in R2.

### Lifecycle family

The state machine is established (`active -> suspended`, `suspended -> active`,
`active|suspended -> archived`, archived terminal), and capabilities exist.
Nevertheless exact payloads, new-command-against-target-state behavior, result
resource types, audit allowlists and exhaustive error mapping are absent. No
lifecycle command type may be added until those decisions are normative.

## Validators and invariants

No safe validator can be created from field names alone:

- Tenant lacks a closed persisted schemaVersion/nullability contract;
- settings and branding lack exact field/value catalogues;
- membershipKey lacks canonical encoding, collision/value shape and validator;
- tenant-admin authority state lacks schemaVersion and validator semantics.

Bootstrap's initial authority tuple is normatively `activeCount=1`, with
revision/lastCommandId/updatedAt changed only by committed authority mutations.
The last-admin `activeCount <= 1` rejection is a cross-document transaction
invariant and must not be embedded incorrectly into a local shape validator.

## Transaction boundary

Future phase-D commands reuse `TransactionRunnerPort`, `TransactionPort`,
canonical hashing, command validation, audit writer and error taxonomy. The
Platform Command Transaction Store remains platform-authority-specific and must
not receive Tenant flags. Choosing a Tenant store API is deferred until the
missing document and command contracts are closed; no second Foundation is
authorized.

## Rules and configuration

| Surface | Classification |
|---|---|
| firestore.rules | `NO_CHANGE_REQUIRED_NOW`; later lifecycle/authority regression is mandatory |
| firestore.indexes.json | `NO_CHANGE_REQUIRED_NOW`; planned operations are bounded point reads |
| storage.rules | `NO_CHANGE_REQUIRED_NOW` |
| firebase.json | `NO_CHANGE_REQUIRED_NOW` |
| .firebaserc | `NO_CHANGE_REQUIRED_NOW` |
| src/firebase.js | `NO_CHANGE_REQUIRED_NOW` |

Existing Rules understand Tenant active/suspended/archived and Membership-based
client authorization, while the authority-state constraint is backend-only.
Any later proven Rules mismatch requires a separately authorized reconciliation.

## Resolution sequencing

The gaps are not one homogeneous schema issue. Bootstrap shared persistence,
tenant-admin update payload/CAS semantics, and platform lifecycle repeat/audit
semantics have different actors and invariants. They require ordered normative
resolution, not one invented materialization.

Only the next minimum identifier is assigned:

`SaaS-03B-D-R2-R1 — Tenant Bootstrap Shared Persistence and Result Contract Resolution`.

It must close settings, branding, membershipKey, tenant-admin authority state,
BootstrapTenant result/audit and validators. It must not implement the command.
Identifiers for update and lifecycle resolutions are intentionally not assigned
until R2-R1 is reviewed and its shared consequences are known.

## State

```text
SaaS-03B-C = completed
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = blocked_pending_R2_R1_normative_resolution
SaaS-03B-D = split_into_ordered_microphases_blocked_pending_contract_completion
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

No business command, package, declaration, artifact, Functions, Domain,
Shared/client, Rules, index or Firebase configuration file changed.
