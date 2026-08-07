# SaaS-03B-B0-I-R3-E — Capability authorization matrix migration

## Purpose and scope

R3-E moves physical authority for the four existing declarative authorization
contracts `CAPABILITY_IDS`, `CAPABILITIES`, `IDENTITY_SELF_CAPABILITIES` and
`ROLE_CAPABILITY_MATRIX` from Domain to
`@mipymetic/saas-contracts/domain`. Domain 1.2.0 remains normative authority;
its historical files are explicit, reference-identical compatibility reexports.
No permission, role, scope, workflow or Rules behavior changed.

The R3-A inventory recorded a historical baseline of 35 IDs/descriptors. The
published Domain at the R3-E Git Gate contains 37: the previously reconciled
`registration_request.cancel_self` and `membership.restore` contracts account
for the difference. R3-E preserves the current 37/37 authority rather than
rewriting it to match stale inventory metadata.

## Inventory and authority

The final catalog contains 37 ordered, unique capability IDs and 37 deeply
frozen descriptors with exact `{ id, scope, resource, description }` shapes.
Every descriptor key equals its ID and every scope belongs to the already
migrated `CAPABILITY_SCOPES` contract.

`IDENTITY_SELF_CAPABILITIES` remains an ordered, frozen six-entry array. The
role matrix remains deeply frozen with the following exact structure:

| Family | Role | Assignments |
|---|---|---:|
| Membership | `student` | 5 |
| Membership | `teacher` | 8 |
| Membership | `tenant_admin` | 23 |
| Platform | `platform_admin` | 8 |

There are no unknown IDs, unknown roles, unassigned catalog entries or
duplicates within a source. Eight capabilities intentionally occur across more
than one role source: `membership.read_self`, `course.list`, `course.read`,
`enrollment.read_self`, `enrollment.cancel_self`, `course.create`,
`course.update` and `enrollment.list`. These are established overlapping role
assignments, not defects. `platform_admin` remains outside Membership roles.

No executable authorization evaluator belongs to R3-E. The only additional
authorization module, `authorizationContext.js`, is a pure conceptual input
shape, not an evaluator or permission decision, and remains outside this scope.

## Workflow and Rules parity

All capability references in `TENANT_WORKFLOW`,
`REGISTRATION_REQUEST_WORKFLOW`, `MEMBERSHIP_WORKFLOW`, `COURSE_WORKFLOW` and
`ENROLLMENT_WORKFLOW` resolve to the 37-ID catalog. Their initial states,
creation actors, transitions, terminal states and required capability metadata
remain unchanged. Complete workflows remain temporary Domain physical
authority under R3-D-R1 and are deferred to R3-H.

Firestore Rules remain the final client-access authority. They were not edited;
the role separation and all canonical Rules preflight counts remain intact.
JavaScript capability declarations neither grant access nor bypass Rules.

## Package, SemVer and Functions artifact

The package advances from `0.4.0` to `0.5.0` because four backward-compatible
public contracts were added to the existing `./domain` and root APIs. Exports
are named and explicit; no wildcard export or runtime dependency was added.

The vendored artifact is `mipymetic-saas-contracts-0.5.0.tgz`, with 30 entries,
SHA-256 `83c29b8913f7a902c3b51cf566982592ec1c3a5c22a9cd959ffb59423556e57b`, npm
shasum `683cc750042764ff49a7210c8eb81402924be128`, and integrity
`sha512-Q9jJoOcL1C7bKxJVkTESRgntS8JCzcfEgrxaf1LRNHPs+XQeA4B7nck7EvO9VustcK3PB9c+bjG8VEUyJ5ylRw==`.
It excludes tests, `node_modules` and secrets. Independent regeneration is
byte-identical; Functions clean install and isolated import pass.

## Validation, risks and rollback

Package tests pass 24/24. RegistrationRequest passes 59/59, Membership 23/23,
Course 51/51, Enrollment 46/46 and Shared 51/51. Static prechecks preserve
Enrollment 111/42/69, Course 114/32/82, Membership 81/44/37 and
RegistrationRequest 52/34/18. Rules preflight passes 222/88/134, general tests
35/35, and build, Node checks, ESLint, dependency/purity/cycle audits,
packaging, reproducibility and diff checks pass.

Residual risks are limited to the deliberate role overlaps, package/vendor
coordination and Domain-owned workflow descriptors awaiting R3-H. Rollback
restores the four Domain definitions, removes the package exports/tests,
restores version `0.4.0`, both lockfiles, the `0.4.0` tarball and artifact
manifest, then repeats all validations. No Firestore data migration is needed.

## Decision and state

R3-E is complete pending human review and push. R3-F is ready but not started.

```text
SaaS-03B-B0-I-R3-E = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-F = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = capability_authorization_contracts_migrated
Privileged Backend = not_created
```
