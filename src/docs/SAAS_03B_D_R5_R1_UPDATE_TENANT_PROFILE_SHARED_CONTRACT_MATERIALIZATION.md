# SaaS-03B-D-R5-R1 - UpdateTenantProfile Shared Contract Materialization

## Decision

**RESULT A - the closed UpdateTenantProfile normative contract is materialized in the shared package.**

This microphase materializes only the package-owned UpdateTenantProfile contract
closed by SaaS-03B-D-R5. It does not implement the Functions business command,
handler, Tenant transaction store, authority lookup workflow, Firestore Rules,
indexes, Firebase configuration, client code or deployment.

## Published genealogy

```text
SaaS-03B-D-R4
  -> SaaS-03B-D-R5
    -> SaaS-03B-D-R5-R1
```

R5 was published at commit:

```text
3f206e998a620884584aa98c6501b2e52e5053bc
```

The exact identifier SaaS-03B-D-R5-R1 did not previously exist in the published
documentation. R5-R1 is therefore the minimum child checkpoint for the shared
contract materialization explicitly required by R5.

## Shared package release

The additive public contract surface requires a SemVer minor release:

```text
@mipymetic/saas-contracts
0.14.0 -> 0.15.0
```

The root workspace dependency is updated to 0.15.0.
Functions consume the exact vendored 0.15.0 artifact.

## Materialized command identity

The package now owns:

```text
COMMAND_TYPES.UPDATE_TENANT_PROFILE = "UpdateTenantProfile"
```

UpdateTenantProfile is added to ATOMIC_TENANT_COMMAND_TYPES.

The existing privileged command-stage model is preserved:

```text
UpdateTenantProfile
  completed -> allowed
  prepared  -> rejected
```

No new command stage is introduced.

## Materialized input contract

The exact external input fields are:

```text
commandId
correlationId
tenantId
patch
```

The exact allowed patch fields are:

```text
displayName
shortName
country
locale
timezone
```

The package exposes:

```text
UPDATE_TENANT_PROFILE_INPUT_FIELDS
UPDATE_TENANT_PROFILE_PATCH_FIELDS
validateUpdateTenantProfileInput
```

Validation is exact-shape and fail-closed.

The patch must be non-empty and contain only approved profile fields.

Materialized value rules preserve R5:

- displayName: trimmed non-empty string;
- shortName: trimmed non-empty string;
- country: uppercase two-letter country code;
- locale: canonical BCP 47;
- timezone: trimmed non-empty string.

Unknown top-level fields and forbidden patch fields are rejected.
No expectedVersion, expectedUpdatedAt, revision, membershipId, lifecycle field,
server timestamp, Tenant snapshot or authority evidence is introduced.

## Behavioral payload

The package exposes:

```text
updateTenantProfileBehavioralPayload
```

Its exact behavioral payload is:

```text
{
  tenantId,
  patch
}
```

commandId and correlationId remain envelope bindings and are excluded from the
behavioral payload projection exactly as required by R5.

## Result contract

The package exposes:

```text
UPDATE_TENANT_PROFILE_RESULT_FIELDS
UPDATE_TENANT_PROFILE_OPERATION
UPDATE_TENANT_PROFILE_RESOURCE_TYPE
validateUpdateTenantProfileResult
```

The exact stable result remains the universal seven-field Tenant command shape:

```text
{
  commandId,
  correlationId,
  operation: "UpdateTenantProfile",
  resourceType: "tenant",
  resourceId: tenantId,
  status: "succeeded",
  replayed
}
```

No profile values, Membership identifiers or PII are added to the result.

## Audit contract

The package now owns the exact R5 audit literals:

```text
operation: UpdateTenantProfile.update
resourceType: tenant
level: privileged
result: succeeded
```

It also owns the exact non-PII audit allowlists:

```text
beforeSummary: tenantStatus
afterSummary:  tenantStatus
metadata:      stage, changedFieldCount
```

The materialization does not write an audit event. It only publishes the portable
contract that a later Functions implementation must consume.

## Public exports and declarations

The new runtime surface is exported through:

```text
@mipymetic/saas-contracts/commands
@mipymetic/saas-contracts
```

Generated TypeScript declarations include:

```text
types/commands/updateTenantProfile.d.ts
types/commands/contracts.d.ts
types/commands/index.d.ts
types/index.d.ts
```

The declarations are generated from the runtime package sources and pass the
existing deterministic declaration and strict NodeNext consumer tests.

## Canonical artifact

Functions consume:

```text
functions/vendor/mipymetic-saas-contracts-0.15.0.tgz
```

Final reproducible artifact metadata:

```text
version:    0.15.0
filename:   mipymetic-saas-contracts-0.15.0.tgz
entries:    66
SHA-256:    5c1a5825247376696ecaca3ae99ab8b625759a32e106161602e719e9d6ce6108
npm shasum: ccb90ce6cd6c6a9f4b50226bd12510dcba46f8bf
integrity:  sha512-yL4Ahx64eqltQ7Zi/ghMQWaMH30jqoJK8+Fan7DWlhtFc2Hj4Faw0Cn/L7iVZeMrqHbuC1HnefIFPzNszZU/mg==
```

Two independent npm packs produced the exact same SHA-256.

The previous 0.14.0 Functions artifact is removed as part of the atomic vendor
cutover.

## Tests

Shared package validation:

```text
package tests: 69/69 PASS
package TypeScript check: PASS
package topology: 5/5 PASS
strict NodeNext declarations: PASS
deterministic declarations: PASS
artifact reproducibility: PASS
```

UpdateTenantProfile-specific shared tests cover:

- command identity;
- atomic completed-only stage authorization;
- exact input fields;
- exact patch fields;
- valid full and partial patches;
- empty patch rejection;
- unknown top-level rejection;
- forbidden field rejection;
- invalid value rejection;
- malformed identifier rejection;
- behavioral payload projection;
- exact stable result;
- exact non-PII audit contract.

Functions validation after vendored artifact cutover:

```text
npm run check: PASS
```

No UpdateTenantProfile Functions implementation exists yet.

## Firebase / infrastructure impact

No changes were made to:

```text
.firebaserc
firebase.json
src/firebase.js
firestore.rules
firestore.indexes.json
storage.rules
```

No Firebase remote service was used.
No deploy occurred.

Rules impact for this shared-only materialization is:

```text
RULES_IMPACT_NONE
```

Rules regression remains mandatory when the executable backend command is later
implemented and independently reviewed.

## Materialization boundary

R5-R1 does not implement:

- authenticated actor parsing;
- MembershipKey lookup;
- Membership lookup;
- AuthorityResolution composition;
- tenant.update capability enforcement in a business command;
- Tenant reread/update transaction;
- Command persistence;
- AuditEvent persistence;
- replay execution;
- backend error mapping;
- public HTTP/callable handler;
- client integration.

Those belong to a later implementation checkpoint after publication of R5-R1.

## State

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed
SaaS-03B-D-R5 = completed
SaaS-03B-D-R5-R1 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = shared_contract_materialized_pending_R5_R1_push
UpdateTenantSettings = blocked_pending_UpdateTenantProfile_sequence
UpdateTenantBranding = blocked_pending_UpdateTenantSettings_sequence
SuspendTenant = blocked_pending_update_family_completion
RestoreTenant = blocked_pending_update_family_completion
ArchiveTenant = blocked_pending_update_family_completion
SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

## Next gate

After human review and publication of R5-R1, derive the minimum next checkpoint
for executable UpdateTenantProfile backend implementation.

Do not start UpdateTenantSettings, UpdateTenantBranding or Tenant lifecycle
commands before the UpdateTenantProfile sequence is closed.
