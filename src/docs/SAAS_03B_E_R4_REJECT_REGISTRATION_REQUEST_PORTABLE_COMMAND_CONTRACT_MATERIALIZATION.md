# SaaS-03B-E-R4 — RejectRegistrationRequest Portable Command Contract Materialization

## 1. Scope

SaaS-03B-E-R4 materializes the package-owned portable contract for
`RejectRegistrationRequest`.

This checkpoint is intentionally limited to the portable command contract,
public package exports, generated TypeScript declarations, focused package
tests, SemVer/package topology alignment, and the vendored Functions package
artifact.

It does not implement trusted-backend execution, Firestore transactions,
runtime command-stage authorization, Functions handlers, Firebase Security
Rules, repositories, UI integration, or any Membership creation behavior.

## 2. Preconditions

The authoritative RegistrationRequest backend freeze established that
`RejectRegistrationRequest` converts one valid pending RegistrationRequest to
`rejected`.

The frozen backend contract also establishes the following invariants:

- the target Tenant must exist;
- the target RegistrationRequest must exist;
- the RegistrationRequest must belong to the target Tenant;
- the request must be `pending`, except when evaluating an exact valid replay;
- the actor requires tenant-scoped authority;
- the actor requires `registration_request.review`;
- rejection preserves consistency between RegistrationRequest,
  `registrationRequestKeys/{uidKey}`, and the required privileged audit result;
- rejection does not create Membership;
- rejection does not create `membershipKeys`;
- rejection must distinguish first success, exact replay, conflicting replay,
  stale transition, already-approved state, cancelled state, and expired state;
- rejection never reverses an approved RegistrationRequest.

R4 does not implement those backend checks. It materializes only the portable
contract required by a future trusted-backend implementation.

## 3. Portable command identity

The package-owned portable identity is:

```text
operation = RejectRegistrationRequest
resourceType = registrationRequest
requiredCapability = registration_request.review
targetRequestStatus = rejected
```

The canonical values are derived from the existing migrated package authority:

- `COMMAND_TYPES.REJECT_REGISTRATION_REQUEST`;
- `REGISTRATION_REQUEST_STATUSES.REJECTED`;
- `CAPABILITY_IDS.REGISTRATION_REQUEST_REVIEW`.

No duplicate lifecycle or capability authority was introduced.

## 4. Input contract

The exact portable input field contract is:

```text
commandId
correlationId
tenantId
requestId
```

`validateRejectRegistrationRequestInput` requires an exact field set and
canonical document identifiers.

The portable input does not accept caller-owned lifecycle, persistence,
authority, audit, Membership, or actor fields.

Focused tests explicitly reject examples including:

- `status`;
- `requestedRole`;
- `membershipId`;
- `actorUid`;
- `authority`;
- `capability`;
- `replayed`;
- `reviewedBy`;
- `rejectedAt`;
- `updatedAt`.

## 5. Behavioral payload

`rejectRegistrationRequestBehavioralPayload` derives exactly:

```text
tenantId
requestId
targetRequestStatus = rejected
```

The behavioral payload does not contain:

- `commandId`;
- `correlationId`;
- `membershipId`;
- `targetMembershipStatus`;
- `actorUid`;
- timestamps;
- Firestore paths;
- runtime authority evidence.

The payload is frozen.

No Membership side effect is represented by this portable contract.

## 6. Result contract

The exact portable result field contract is:

```text
commandId
correlationId
operation
resourceType
resourceId
status
replayed
```

A valid result requires:

```text
operation = RejectRegistrationRequest
resourceType = registrationRequest
status = succeeded
replayed = boolean
```

`resourceId` must remain a canonical document identifier.

No Membership identifier or Membership state belongs to the Reject result.

## 7. Audit contract

The portable audit contract is:

```text
operation = RejectRegistrationRequest.update
level = privileged
result = succeeded
```

The audit summary field sets are:

```text
before:
  registrationRequestStatus

after:
  registrationRequestStatus

metadata:
  stage
  replayed
```

The audit contract contains no Membership state.

The focused audit test also verifies absence of:

- `uid`;
- `requestedRole`;
- `membershipId`;
- `membershipExists`;
- `membershipStatus`;
- `actorUid`;
- `displayName`;
- `email`.

## 8. Runtime authorization boundary

R4 does not authorize runtime execution.

The currently modeled privileged-command stages remain closed for
`RejectRegistrationRequest`:

```text
not_started = false
prepared = false
completed = false
```

The portable contract therefore exists without enabling trusted-backend or
Functions execution.

No `functions/src/*` business-code path was modified.

No Firebase configuration, Security Rules, indexes, Storage Rules, or client
Firebase file was modified.

## 9. Public package surface

The portable source was materialized at:

```text
packages/saas-contracts/src/commands/rejectRegistrationRequest.js
```

The generated declaration was materialized at:

```text
packages/saas-contracts/types/commands/rejectRegistrationRequest.d.ts
```

The source export surfaces are:

```text
packages/saas-contracts/src/commands/index.js
packages/saas-contracts/src/index.js
```

The declaration export surfaces are:

```text
packages/saas-contracts/types/commands/index.d.ts
packages/saas-contracts/types/index.d.ts
```

The command-level relative export path is:

```text
./rejectRegistrationRequest.js
```

The root-level relative export path is:

```text
./commands/rejectRegistrationRequest.js
```

The public symbols are:

- `REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS`;
- `REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS`;
- `REJECT_REGISTRATION_REQUEST_AUDIT_LEVEL`;
- `REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS`;
- `REJECT_REGISTRATION_REQUEST_AUDIT_OPERATION`;
- `REJECT_REGISTRATION_REQUEST_AUDIT_RESULT`;
- `REJECT_REGISTRATION_REQUEST_INPUT_FIELDS`;
- `REJECT_REGISTRATION_REQUEST_OPERATION`;
- `REJECT_REGISTRATION_REQUEST_REQUIRED_CAPABILITY`;
- `REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE`;
- `REJECT_REGISTRATION_REQUEST_RESULT_FIELDS`;
- `REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS`;
- `rejectRegistrationRequestBehavioralPayload`;
- `validateRejectRegistrationRequestInput`;
- `validateRejectRegistrationRequestResult`.

Source/declaration export parity passed.

## 10. SemVer and Functions vendor cutover

R4 adds a backward-compatible public package contract, therefore the package
advanced:

```text
0.22.0 -> 0.23.0
```

The aligned version surfaces include:

- `packages/saas-contracts/package.json`;
- root `package.json`;
- root `package-lock.json`;
- Functions `package.json`;
- Functions `package-lock.json`;
- package topology expectations;
- vendored Functions artifact;
- artifact manifest.

The prior vendored artifact:

```text
mipymetic-saas-contracts-0.22.0.tgz
```

was replaced by:

```text
mipymetic-saas-contracts-0.23.0.tgz
```

Artifact evidence:

```text
entryCount = 82
SHA-256 = c9b935311bf8e8eff359798f8c0473eb7e80a66939c650d527a31dfd90381143
npm shasum = 023bb351f0e1c28f03fb600cb4ac6fb87228148b
npm integrity = sha512-/7UHDYUtIfjzz8s3M9PJ8NhM7BTqDmWjEVTAssPMJ8Ih21kcWWIk/JJh2H0qbCW40nERoiZxOkkdy+JZM6mWXQ==
```

The canonical artifact file inventory is the ordered inventory emitted by
`npm pack --json`.

The artifact manifest records the same 82-entry npm-pack inventory.

Artifact SHA-256, npm shasum, npm integrity and reproducibility all passed.

A clean isolated Functions installation from the vendored `0.23.0` artifact
passed.

An isolated Functions import of the Reject portable contract also passed.

## 11. Validation evidence

R4 technical validation evidence includes:

- targeted `RejectRegistrationRequest` tests: `8/8 PASS`;
- complete package suite: `145/145 PASS`;
- package topology tests: `5/5 PASS`;
- `check:types`: PASS;
- `build:types`: PASS;
- deterministic declaration generation: PASS;
- generated declaration hash parity: PASS;
- package dry-run: PASS;
- artifact entry count: `82`;
- artifact SHA-256 parity: PASS;
- artifact npm shasum parity: PASS;
- artifact npm integrity parity: PASS;
- artifact reproducibility: PASS;
- Functions clean vendor install: PASS;
- isolated Functions Reject import: PASS;
- runtime stage authorization remains closed: PASS;
- Membership effects: none;
- forbidden runtime/Firebase mutation count: `0`;
- `git diff --check`: PASS.

During the SemVer/vendor cutover, the package topology test initially exposed
an artifact manifest inventory-order mismatch.

The package file set itself was correct. Raw physical tar-member order was not
the canonical inventory contract.

The manifest was therefore aligned to the canonical ordered file inventory
reported by `npm pack --json`.

The tarball itself was not changed by that inventory-order repair and retained
the same cryptographic identity.

A later cached export review produced another review-only false negative by
checking the command-level relative path against the root-level index.

The corrected per-surface expectations are:

```text
SOURCE_COMMAND_INDEX = ./rejectRegistrationRequest.js
SOURCE_ROOT_INDEX = ./commands/rejectRegistrationRequest.js
TYPE_COMMAND_INDEX = ./rejectRegistrationRequest.js
TYPE_ROOT_INDEX = ./commands/rejectRegistrationRequest.js
```

All four export surfaces subsequently passed exact public-symbol parity.

## 12. Technical commit

The reviewed technical surface was committed as:

```text
c67162aa65cc6ed95c6272f21c3664a010b40712
feat(saas): materialize reject registration request contract
```

Its parent is:

```text
f0bdbd09d407725e03c38d6b3aa6d450b12e3024
```

The technical commit contains exactly 16 paths:

```text
functions/package-lock.json
functions/package.json
functions/vendor/mipymetic-saas-contracts-0.22.0.tgz
functions/vendor/mipymetic-saas-contracts-0.23.0.tgz
functions/vendor/saas-contracts-artifact.json
package-lock.json
package.json
packages/saas-contracts/__tests__/packageTopology.test.mjs
packages/saas-contracts/__tests__/rejectRegistrationRequestContracts.test.mjs
packages/saas-contracts/package.json
packages/saas-contracts/src/commands/index.js
packages/saas-contracts/src/commands/rejectRegistrationRequest.js
packages/saas-contracts/src/index.js
packages/saas-contracts/types/commands/index.d.ts
packages/saas-contracts/types/commands/rejectRegistrationRequest.d.ts
packages/saas-contracts/types/index.d.ts
```

Classification:

```text
added = 4
modified = 11
deleted = 1
```

No Functions business-code path or Firebase path exists in the technical
commit.

The repository was clean immediately after the technical commit.

No push was performed.

## 13. Explicit exclusions

R4 does not implement:

- trusted-backend execution;
- Firestore transaction execution;
- RegistrationRequest persistence mutation;
- registrationRequestKeys persistence mutation;
- audit-event persistence;
- authentication;
- runtime authorization;
- capability enforcement at runtime;
- replay persistence;
- stale-transition resolution;
- conflicting-replay handling;
- Functions callable handlers;
- Functions HTTP handlers;
- Membership creation;
- membershipKeys creation;
- Membership lifecycle transitions;
- Firebase Security Rules changes;
- Firestore index changes;
- Storage Rules changes;
- repository changes;
- service changes;
- Domain runtime changes;
- provider changes;
- UI changes.

Those responsibilities remain outside this portable-contract checkpoint.

## 14. Risks and rollback

The R4 portable contract does not activate runtime behavior.

The principal package-level risk is drift between source exports,
declarations, package version surfaces, the Functions vendored artifact and
its manifest.

That risk is controlled through deterministic declarations, package topology
tests, npm-pack inventory parity, cryptographic artifact identity,
reproducibility, clean isolated installation, and isolated import validation.

Rollback of the technical R4 surface must treat the technical commit as one
coherent unit.

Partial rollback of SemVer, declaration surfaces, vendored artifact, artifact
manifest or package exports would recreate package topology drift and is not
authorized.

No rollback operation was performed during R4.

## 15. R4 closure state

At this documentation materialization checkpoint:

```text
SaaS-03B-E-R4 = completed_pending_documentary_review_and_commit
RejectRegistrationRequest portable contract = materialized
RejectRegistrationRequest privileged runtime = not_implemented
RejectRegistrationRequest runtime stage authorization = closed
Membership effects = none
Functions business code = unchanged
Firebase = unchanged
package version = 0.23.0
artifact entries = 82
technical commit = c67162aa65cc6ed95c6272f21c3664a010b40712
documentation commit = pending
push = pending_human_action
```

R4 does not authorize runtime execution.

R4 also does not invent or authorize a successor checkpoint by itself.

After documentary review and commit, the explicit SaaS-03B-E roadmap must be
consulted to select the next ordered checkpoint.
