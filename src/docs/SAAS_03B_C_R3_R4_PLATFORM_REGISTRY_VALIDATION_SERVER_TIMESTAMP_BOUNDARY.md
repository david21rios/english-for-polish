# SaaS-03B-C-R3-R4 — Platform Registry Validation and Server Timestamp Boundary

## Objective and prerequisites

This microphase materializes the published `SaaS-03B-C-R3-R3` Registry
contract and the portable timestamp decision from `R3-R1/R3-R2`. It is a
prerequisite boundary only: the Platform Command Transaction Store and all
business commands remain unimplemented.

## Shared registry contract

`@mipymetic/saas-contracts/authority` is the unique physical authority for the
frozen ordered `PLATFORM_AUTHORITY_REGISTRY_STATES` catalog:
`uninitialized`, `in_progress`, `completed`, `recovery_required`.
`validatePlatformAuthorityRegistry` accepts exactly the six version-1 fields
`schemaVersion`, `bootstrapState`, `activeCount`, `revision`, `lastCommandId`,
and `updatedAt`. Unknown/missing fields, unknown states, non-integer or negative
counters, invalid timestamps, and invalid command identifiers fail closed.
The initial state additionally requires counts zero and `lastCommandId=null`;
all other states require a valid identifier. Results and issues are frozen.

The additive public contract changes the package from `0.8.0` to `0.9.0`.
Declarations are generated from JS/JSDoc, not edited as an independent
authority. Existing Authority values and semantics are unchanged.

## Portable timestamp boundary

The portable Functions core never imports Firebase types. It exposes one
identity-safe, module-owned server-time token. JSON/client lookalikes cannot
obtain that identity. The Firestore Admin adapter alone maps that token on
`create`, `set`, and `update` to `FieldValue.serverTimestamp()`.

Schema-aware reads normalize physical Admin `Timestamp` instances before core
validation. Platform Authority normalizes required `createdAt`/`updatedAt` and
nullable `activatedAt`/`revokedAt`/`lastClaimSyncAt`; Registry normalizes its
required `updatedAt`. Nullable values remain null. Missing/invalid physical
timestamp fields remain fail-closed at the boundary or validator. No generic
string, numeric epoch, arbitrary object, or SDK sentinel becomes a shared
contract value.

The portable transaction interface gained only an optional known persisted
shape selector. No store, path ownership, command orchestration, business
transaction, handler, or external-effect logic was added. Read/write budgets
remain unchanged.

## Artifact and compatibility

Canonical artifact: `mipymetic-saas-contracts-0.9.0.tgz` (14,955 bytes).

- SHA-256: `9b3a6ae76763b400a3dd1fa52f425331dca97b62e25d287985622c4d1b0cb2ed`
- npm shasum: `63cc153440c2850bbcfbad47e3da9f36a978d9f9`
- integrity: `sha512-kUPs6n13zMx1VJusb3Hu7UdfwUhgM49qaCE0ptiRtP0ageTi+j/g/sOXwF2URvpv7LK3XprXhuUFzyu2apUi0w==`
- inventory: 60 package entries; tests, node_modules, tsbuildinfo, temporaries,
  and secrets excluded.

Two independent packs and the vendored artifact produced the same SHA-256 and
size. Repository LF attributes preserve the established opposite-autocrlf
reproducibility policy. Functions cut over to 0.9.0; the 0.8.0 artifact was
removed after current technical consumers reached zero.

## Validation evidence

- package declarations/check and tests: 37/37 PASS;
- Functions strict TypeScript, lint, ESM-compatible build and tests: 25/25 PASS;
- Shared: 51/51; repositories: 59/59, 23/23, 51/51, 46/46;
- prechecks: Enrollment 111/42/69, Course 114/32/82, Membership 81/44/37,
  RegistrationRequest 52/34/18;
- Rules preflight: 222/88/134; Rules were not executed remotely or changed;
- general tests: 35/35; production build and Node syntax checks PASS;
- package/Functions scoped lint: zero; global legacy baseline remains 13
  errors and 8 warnings, with attributable delta zero;
- package runtime dependencies remain zero; Functions audit remains the
  recorded seven moderate Firebase-SDK-chain findings.

The first general-test attempt inside the restricted sandbox hit the known
esbuild permission boundary; the authorized native rerun passed. Emulator,
remote Firebase, deployment, and push were not used.

## Risks, rollback, and next gate

The adapter normalization is deliberately schema-aware; every future persisted
shape must explicitly declare its physical timestamp fields. Emulator-backed
transaction concurrency and physical read-after-write behavior belong to the
subsequent Store implementation, not this pure boundary.

Rollback is the technical commit: restore package/artifact 0.8.0 and remove the
new registry/timestamp boundary together. Partial rollback would break package
and Functions topology.

State after this commit: `R3-R4 = completed_pending_human_review_and_push`;
the Transaction Store remains `blocked_pending_R3_R4_push`. After human push it
is `ready_not_started`. `SaaS-03B-C`, `03B-D`, and Phase 4 were not started.
