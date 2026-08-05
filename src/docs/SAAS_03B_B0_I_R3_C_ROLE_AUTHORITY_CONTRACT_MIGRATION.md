# SaaS-03B-B0-I-R3-C - Roles, capability scopes and workflow actors migration

## Purpose, scope and sources

R3-C moves the physical authority for `MEMBERSHIP_ROLES`, `PLATFORM_ROLES`,
`CAPABILITY_SCOPES`, and `WORKFLOW_ACTORS` to
`@mipymetic/saas-contracts/domain`. Domain 1.2.0 remains normative and its
historical paths remain compatibility reexports. The R3-A inventory, R3-B,
R2/R2-C1, R1 topology, B0/B0-I, 03B-A-R1, implementation order, repository
scope, Domain modules, package, Rules, repositories, tests and prechecks were
audited. Initial Git state was clean `main`, with HEAD and `origin/main` both
`edcaeab9ae7656a7a2889e4e5f749a876d8b9f9e`.

This phase excludes capability IDs/descriptors/matrices, workflows and
transitions, lifecycle validators, CEFR/languages, errors, commands,
authority/audit implementations and backend infrastructure.

## Authority and exact contracts

| Contract | Exact ordered values | Previous physical file | Final package file |
|---|---|---|---|
| `MEMBERSHIP_ROLES` | `student`, `teacher`, `tenant_admin` | `organization/enums.js` | `domain/membership.js` |
| `PLATFORM_ROLES` | `platform_admin` | `authorization/enums.js` | `domain/authorization.js` |
| `CAPABILITY_SCOPES` | `self`, `tenant`, `platform` | `authorization/enums.js` | `domain/authorization.js` |
| `WORKFLOW_ACTORS` | `identity_self`, `tenant_admin`, `platform_admin`, `platform_system` | `workflow/actors.js` | `domain/workflowActors.js` |

Values, key order, casing, freezing and reference identity are unchanged.
Domain adapters reexport the package objects without copies. Package imports
never point to Domain. No derived contract was migrated.

A Membership role is not a platform authority; a workflow actor is not proof
of executing authority; a capability scope is not a role; Custom Claims are
not authoritative; payload values never confer authority. R3-C adds no
authorization behavior.

## Consumers and parity

Existing repository validation, capability descriptors,
`ROLE_CAPABILITY_MATRIX`, and five workflows retain historic Domain imports.
Tests prove exact package/Domain reference identity. Rules parity preserves
`student`, `teacher`, and `tenant_admin`, while `platform_admin` remains outside
Membership roles. Every capability descriptor uses a migrated scope; matrix
keys exactly equal Membership and platform roles. Every workflow actor is
known; the Course teacher creation actor remains a Membership role. No matrix,
workflow, transition, capability, Rule or persisted value changed.

Literal occurrences were classified as package authority, Domain compatibility
surface, Rules literal, matrix/workflow reference, fixture, UI text or
documentation. No authoritative code duplication remains for the four migrated
contracts.

## Package version and Functions artifact

The package advances `0.2.0` to `0.3.0`, a SemVer minor because compatible
named exports were added to public `./domain`. Root and Functions manifests and
lockfiles resolve `0.3.0`. Functions consumes only the vendored tarball and has
no Admin SDK, Functions SDK, handler or deploy script.

- tarball: `mipymetic-saas-contracts-0.3.0.tgz`
- SHA-256: `6c0e6a3bacdd1441867b3ef22084ca8d04e70e06a8e1cd617f2dad670b19a67c`
- npm shasum: `5e656fe028c60dec89da2adde90516d81bfb682f`
- integrity: `sha512-TB9a8qO/q76+P4ZkYlMaq/HsPl/4hN8FbaflGII34vTkxsfFGdyHZBw2ytZ9eFF2Iya68jq5gXDB2PYS2S2SWg==`
- inventory: 27 sorted entries; no tests or `node_modules`
- byte-exact regeneration, clean Functions install and isolated import: PASS

## Validation

Package tests passed 18/18. RegistrationRequest passed 59/59, Membership 23/23,
Course 51/51, Enrollment 46/46 and Shared 51/51. Prechecks remain Enrollment
111/42/69 (42/41/28/0), Course 114/32/82 (32/56/26/0), Membership 81/44/37
(44/26/11/0), and RegistrationRequest 52/34/18 (34/14/4/0). Rules preflight
remains 222/88/134. General tests passed 35/35; build, Node checks, ESLint and
`git diff --check` passed. The first general-test attempt hit only a sandbox
`esbuild` read denial; the identical elevated validation passed.

No Emulator, workflow, Firebase remote access, deploy or backend execution was
performed.

## Risks, rollback and decision

Residual risk is future literal drift or consumers bypassing adapters.
Capabilities and workflows remain Domain-owned for later phases. Rollback
restores the three Domain definitions, removes the four package exports and
tests, returns manifests/lockfiles/artifact to `0.2.0`, and reruns all gates.
No data migration is needed because values did not change.

All R3-C gates pass. State is
`SaaS-03B-B0-I-R3-C = completed_pending_human_review_and_push`,
`SaaS-03B-B0-I-R3-D = ready_not_started`, and
`PURE_CONTRACT_PHYSICAL_EXTRACTION = roles_scopes_actors_migrated`.
Privileged Backend remains `not_created`; R3-D and 03B-B were not started.
