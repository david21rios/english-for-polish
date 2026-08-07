# SaaS-03B-B0-I-R3-D — Lifecycle and transition contract migration

## Purpose and final scope

This microphase executes the scope frozen by `SaaS-03B-B0-I-R3-D-R1`
(`RESOLUTION_A`). It moves physical authority for exactly five existing pure
contracts from Domain to `@mipymetic/saas-contracts/domain`, while Domain 1.2.0
remains normative authority and its historical export paths remain compatible.

The migrated contracts are `ACCESS_STATE_CONTEXT`, `ACCESS_STATE_PRECEDENCE`,
`NULL_ACCESS_STATE_CASES`, `MEMBERSHIP_STATUS_TRANSITIONS` and
`ENROLLMENT_STATUS_TRANSITIONS`. No lifecycle symbol was invented.

`TENANT_WORKFLOW`, `REGISTRATION_REQUEST_WORKFLOW`, `MEMBERSHIP_WORKFLOW`,
`COURSE_WORKFLOW` and `ENROLLMENT_WORKFLOW` remain complete Domain-owned
descriptors. They were parity evidence only; none was moved or edited.

## Authority, values and compatibility

Before this change, the physical definitions lived in
`identity/accessStatePrecedence.js`, `organization/enums.js` and
`academic/enums.js`. They now live in the corresponding explicit package
domain modules. Those Domain files are explicit compatibility reexports, so a
historical Domain import and the package import resolve to the same frozen
object.

The access context remains `{ scope: "tenant", key: "uid + tenantId",
requiresTenantId: true, outsideTenantResult: null }`. Access precedence keeps
its exact five-rule order: email verification, institutional suspension,
approved Membership, pending RegistrationRequest and rejected
RegistrationRequest. The six null cases remain unchanged and ordered.

Membership transitions remain `approved -> suspended|removed`, `suspended ->
approved|removed`, and `removed -> []`. Enrollment transitions remain `pending
-> active|cancelled`, `active -> completed|cancelled`, and terminal empty lists
for `completed` and `cancelled`. Tests prove exact values, casing, order,
freezing, nested freezing, denied-transition semantics and reference identity.

Rules remain unchanged. Static parity tests retain the persisted status and
role literals, while complete workflow baseline tests prove unchanged initial
states, terminal states and transition pairs. Capabilities, authorization
matrices and workflow orchestration remain outside R3-D.

## Package, artifact and validation

The backward-compatible public additions advance the private package from
`0.3.0` to `0.4.0` under the existing minor-version precedent. The explicit
`./domain` and root APIs expose the five names without wildcard exports.

The Functions artifact is
`mipymetic-saas-contracts-0.4.0.tgz`. Its SHA-256 is
`ab62bccfcc6492e86b830ac5503525fa8c9fa0addce08c39e781f0a58a1f4da9`, npm
shasum is `6b016abd274ced772cf146a7f7d0f67b6a13f5f3`, and npm integrity is
`sha512-sxZtGf6EQ3NcFHyajQwPHF2IbaywZJTl8/EDqSTqYQzkb5qkFYr5LWbpc7ZHBft1cMZYIXWdhLvLP5LKKX4Tog==`.
Its 27-entry inventory excludes tests, `node_modules` and secrets. A separately
generated artifact is byte-identical; Functions clean install and isolated
imports pass.

Validation passed: package 21/21; RegistrationRequest 59/59; Membership 23/23;
Course 51/51; Enrollment 46/46; Shared 51/51; runtime prechecks Enrollment
111/42/69, Course 114/32/82, Membership 81/44/37 and RegistrationRequest
52/34/18; Rules preflight 222/88/134; general tests 35/35; build, Node checks,
ESLint, dependency/purity audit, packaging and `git diff --check` all pass. No
Emulator, workflow, Firebase remote access or deployment was used.

## Residual risk, R3-H and rollback

The complete workflows intentionally remain residual Domain physical authority.
R3-H must reconcile them after capability migration and must not infer a new
lifecycle API from this phase. The package remains private and vendored, so its
artifact and both lockfiles must continue to change together.

Rollback restores the three Domain definitions, removes the five package
exports/tests, restores package version `0.3.0`, both manifests and lockfiles,
the `0.3.0` artifact and its manifest, then repeats all validations. Persisted
values did not change, so no Firestore data migration is required.

## Decision and state

All five authorized contracts migrated with zero semantic drift and no second
physical authority. Therefore R3-D is complete pending human review and push.

```text
SaaS-03B-B0-I-R3-D-R1 = completed
SaaS-03B-B0-I-R3-D = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-E = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
Privileged Backend = not_created
```

The next microphase is `SaaS-03B-B0-I-R3-E — Capabilities and Authorization
Matrices`, but it has not been started.
