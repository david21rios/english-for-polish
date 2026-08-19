# SaaS-03B-E-R3 — ApproveRegistrationRequest Portable Command Contract Materialization

## 1. Scope

SaaS-03B-E-R3 materializes the package-owned portable command contract for
`ApproveRegistrationRequest`.

This checkpoint does not implement the privileged backend workflow itself.
It does not create or expose a Functions handler, perform Firestore writes,
authorize runtime command stages, modify Firebase Security Rules, modify
Firestore indexes, modify Storage Rules, or activate any client consumer.

The technical implementation is intentionally limited to the portable command
contract, its public package surface, generated declarations, focused package
tests, package SemVer cutover, and the vendored Functions package artifact.

## 2. Preconditions

The preceding SaaS-03B-E sequence established the required authority:

- SaaS-03B-E-R1 froze the RegistrationRequest backend contract family.
- `ApproveRegistrationRequest` is the first ordered RegistrationRequest command.
- `RejectRegistrationRequest` remains second.
- SaaS-03B-E-R2 materialized the shared persisted RegistrationRequest and
  RegistrationRequestKey contracts required before command implementation.
- root RegistrationRequest remains authoritative.
- RegistrationRequestKey remains a derived exact persisted projection.
- terminal RegistrationRequest keys remain retained.
- implicit supersession is not permitted inside `ApproveRegistrationRequest`.

R3 does not reopen those decisions.

## 3. Portable command identity

The package now exposes the exact command identity:

```text
operation = ApproveRegistrationRequest
resourceType = registrationRequest
requiredCapability = registration_request.review
targetRequestStatus = approved
targetMembershipStatus = approved
```

The command operation is derived from the canonical `COMMAND_TYPES` contract.

The target lifecycle values are derived from the canonical package-owned
RegistrationRequest and Membership status contracts.

The required capability is derived from the canonical capability catalog.

## 4. Input contract

The exact ordered input fields are:

```text
commandId
correlationId
tenantId
requestId
```

All four values must satisfy the canonical document-identifier validator.

The validator is fail-closed and rejects unknown fields. Caller-owned lifecycle,
authority and persistence fields are therefore not accepted by this portable
input contract.

Examples explicitly rejected by focused tests include:

- `status`;
- `requestedRole`;
- `membershipId`;
- `actorUid`;
- `authority`;
- `capability`;
- `replayed`;
- `approvedAt`.

## 5. Behavioral payload

`approveRegistrationRequestBehavioralPayload` derives only the portable
behavioral target:

```text
tenantId
requestId
targetRequestStatus = approved
targetMembershipStatus = approved
```

Envelope-only identifiers such as `commandId` and `correlationId` are not copied
into the behavioral payload.

The portable contract does not choose or persist Membership identifiers, actor
identity, timestamps, authority evidence, Firestore paths or transaction state.

Those concerns remain backend/runtime responsibilities.

## 6. Result contract

The exact ordered result fields are:

```text
commandId
correlationId
operation
resourceType
resourceId
status
replayed
```

The exact portable result semantics are:

```text
operation = ApproveRegistrationRequest
resourceType = registrationRequest
status = succeeded
replayed = boolean
```

Identifiers remain validated through the canonical document-identifier
contract.

Unknown result fields are rejected.

## 7. Audit contract

The portable audit contract is materialized as:

```text
operation = ApproveRegistrationRequest.update
level = critical
result = succeeded
```

Exact before fields:

```text
registrationRequestStatus
membershipExists
```

Exact after fields:

```text
registrationRequestStatus
membershipStatus
```

Exact metadata fields:

```text
stage
replayed
```

The focused package test confirms that raw or unnecessary identity data such as
`uid`, `requestedRole`, `membershipId`, `actorUid`, `displayName` and `email`
are not included in these portable audit field allowlists.

## 8. Runtime authorization boundary

R3 deliberately does not authorize execution of the command.

The existing privileged command stage authorization remains closed for
`ApproveRegistrationRequest`:

```text
not_started = false
prepared = false
completed = false
```

No Functions business-code path was modified.

No `functions/src/*` file was modified.

No Firebase configuration, Rules, index, Storage or client Firebase file was
modified.

Therefore R3 materializes a portable executable contract surface without
creating a privileged backend executor.

## 9. Public package surface

The new command contract is exported from:

- `packages/saas-contracts/src/commands/index.js`;
- `packages/saas-contracts/src/index.js`.

Generated declaration surfaces are exported from:

- `packages/saas-contracts/types/commands/approveRegistrationRequest.d.ts`;
- `packages/saas-contracts/types/commands/index.d.ts`;
- `packages/saas-contracts/types/index.d.ts`.

The command implementation remains package-owned and portable.

## 10. SemVer and Functions vendor cutover

The additive public package surface moves:

```text
@mipymetic/saas-contracts
0.21.0 -> 0.22.0
```

The following dependency surfaces were aligned to `0.22.0`:

- root package dependency;
- root lockfile workspace version;
- Functions vendored dependency;
- Functions lockfile;
- package topology assertions;
- vendor artifact manifest.

The prior vendored artifact:

```text
mipymetic-saas-contracts-0.21.0.tgz
```

was removed and replaced by:

```text
mipymetic-saas-contracts-0.22.0.tgz
```

Artifact evidence:

```text
entryCount = 80
SHA-256 = 30c4a25b1b45c96d430a40bbe927937f0920c110f8edeb0b1407dbcd79346321
npm shasum = 4bb96f2e885836c9e1adee315b50227b5a68ffbc
npm integrity = sha512-cXFwBhIg4MHkSJmayG08PpgV7TjN9wU9OOKfv7lay1pNZJ8WFHRn26Yz4G6LdbetiC2tjBRe0Xad30UitCt8YQ==
```

The manifest inventory contains 80 unique entries in canonical sorted order.

Artifact cryptographic parity and reproducibility both passed.

## 11. Validation evidence

The final R3 technical validation established:

- targeted `ApproveRegistrationRequest` contract tests: `8/8 PASS`;
- complete `saas-contracts` package suite: `137/137 PASS`;
- package topology tests: `5/5 PASS`;
- package `check:types`: PASS;
- package `build:types`: PASS;
- package dry-run: PASS;
- artifact SHA-256 parity: PASS;
- artifact reproducibility: PASS;
- Functions clean install from vendored `0.22.0`: PASS;
- isolated Functions import of the Approve contract: PASS;
- exact final technical mutation surface: PASS;
- forbidden Functions business/Firebase mutation count: `0`;
- `git diff --check`: PASS.

The transient package-topology failure encountered during the cutover was
caused only by artifact manifest file ordering. The tarball inventory and
manifest inventory already had semantic set parity. The correction sorted only
`artifact.files`; the tarball was not rebuilt and its SHA-256 remained
unchanged.

A later runtime-token audit false positive was also resolved: the substring
`onRequest` appeared only inside `RegistrationRequest` identifiers. Exact
runtime token matching found zero actual `onRequest` or `onCall` usage in the
portable command source.

## 12. Technical commit

The reviewed technical implementation is recorded in:

```text
0ee4402e10466b188d0578edccca7a952ab356e7
```

Subject:

```text
feat(saas): materialize approve registration request contract
```

Parent:

```text
f4f12d39b69ff5ed46d9f40e36cd18a1a714847e
```

The commit contains the exact reviewed 16-file technical surface:

- 4 added files;
- 11 modified files;
- 1 deleted file;
- 580 insertions;
- 101 deletions.

The worktree was clean immediately after the technical commit.

No push was performed.

## 13. Explicit exclusions

R3 does not authorize or implement:

- `ApproveRegistrationRequest` Functions business execution;
- callable or HTTP Functions exposure;
- Firestore transactions;
- RegistrationRequest mutation;
- Membership creation or mutation;
- RegistrationRequestKey mutation;
- MembershipKey mutation;
- authoritative timestamps;
- idempotency persistence;
- replay persistence;
- backend authorization evaluation;
- backend audit persistence;
- `RejectRegistrationRequest`;
- Course or Enrollment backend workflows;
- repository mutation;
- UI or React changes;
- Provider changes;
- Firebase Security Rules changes;
- Firestore index changes;
- Storage Rules changes;
- deployment;
- npm publication.

## 14. R3 closure state

At this documentation checkpoint:

```text
SaaS-03B-E = in_progress
SaaS-03B-E-R1 = completed_and_published
SaaS-03B-E-R2 = completed
SaaS-03B-E-R3 = completed_pending_documentary_review_and_commit
ApproveRegistrationRequest portable contract = materialized
ApproveRegistrationRequest privileged runtime = not_implemented
ApproveRegistrationRequest runtime stage authorization = closed
RejectRegistrationRequest = next_ordered_candidate_not_started
Privileged backend execution = not_created_by_R3
Functions business code = unchanged
Firebase = unchanged
package version = 0.22.0
technical commit = 0ee4402e10466b188d0578edccca7a952ab356e7
documentation commit = pending
push = pending_human_action
```

R3 does not assign a new identifier to the next checkpoint.

After this documentary closure is reviewed and committed, the next roadmap gate
must determine the minimum authorized checkpoint for the second ordered
RegistrationRequest command, `RejectRegistrationRequest`, or any prerequisite
resolution required by the existing architecture.

No implementation beyond R3 is started here.
