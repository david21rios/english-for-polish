# SaaS-03B-B0-I-R3-H — Residual authority closure

## Purpose and decision

R3-H reconstructs the residual Domain inventory after R3-B through R3-G and
classifies every remaining authority without turning structural documentation
into runtime code, removing compatibility paths, or absorbing persistence and
backend implementation into R3.

The evidence selects `RESULT_A — residuals are legitimate`. No defective runtime
duplication exists. No technical cleanup or extraction is authorized or needed.

## Sources and initial state

The review reconciled Git, selective continuity guidance, R3-A through R3-G,
R3-D-R1, Architecture Freeze, applicable ADRs, Domain 1.2.0, all 29 files under
`src/domain`, the complete package and Functions topology, Shared, SaaS
repositories, Rules, tests and prechecks.

```text
branch = main
HEAD = origin/main = 458ba921857d061067f44bc6b37b0abd9682f5e9
worktree = clean
R3-G = VALID_R3_G_CLOSURE_WITH_REVALIDATION
```

## Reconstructed inventory

The current Domain inventory has 39 contract rows, not the stale historical
heading of 40: 21 runtime compatibility exports, 12 structural/JSDoc contracts
and 6 locally physical runtime descriptors. The correction follows the actual
row count and current source; it does not delete a contract.

### Package physical authority with Domain adapters (21)

| Family | Package-owned contracts | Domain compatibility path |
|---|---|---|
| identity/status | `ACCESS_STATES`, `REGISTRATION_REQUEST_STATUSES` | `identity/enums.js` |
| tenant/membership | `TENANT_TYPES`, `TENANT_STATUSES`, `MEMBERSHIP_ROLES`, `MEMBERSHIP_STATUSES` | `organization/enums.js` |
| academic | `COURSE_STATUSES`, `ENROLLMENT_STATUSES`, `CEFR_LEVELS` | `academic/enums.js` |
| roles/scopes/actors | `PLATFORM_ROLES`, `CAPABILITY_SCOPES`, `WORKFLOW_ACTORS` | authorization/workflow enum adapters |
| access/lifecycle | `ACCESS_STATE_CONTEXT`, `ACCESS_STATE_PRECEDENCE`, `NULL_ACCESS_STATE_CASES`, `MEMBERSHIP_STATUS_TRANSITIONS`, `ENROLLMENT_STATUS_TRANSITIONS` | identity/organization/academic adapters |
| authorization | `CAPABILITY_IDS`, `CAPABILITIES`, `IDENTITY_SELF_CAPABILITIES`, `ROLE_CAPABILITY_MATRIX` | authorization adapters |

Each Domain path is an explicit compatibility reexport. Searches find the
authoritative runtime definitions only in `packages/saas-contracts/src/domain`.
The adapters do not clone, spread or refreeze those values. Package tests prove
value/order/casing/freezing and reference identity parity. All 21 are classified
`PACKAGE_PHYSICAL_AUTHORITY_WITH_DOMAIN_ADAPTER`; all adapters are retained.

### Structural Domain authority (12)

| ID | Shape and file | Fields/role | Final R3-H classification |
|---|---|---|---|
| DOM-ID-006 | `Identity`, `identity/identity.js` | eight identity fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ID-007 | `RegistrationPolicy`, `identity/registrationPolicy.js` | four policy booleans | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ID-008 | `RegistrationRequest`, `identity/registrationRequest.js` | eight logical workflow fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ORG-006 | `Tenant`, `organization/tenant.js` | ten organization fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ORG-007 | `Membership`, `organization/membership.js` | nine membership fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ORG-008 | `TenantSettings`, `organization/tenantSettings.js` | locale, policy, flags and support | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ORG-009 | `TenantBranding`, `organization/tenantBranding.js` | branding plus nested color shape | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-AUTH-007 | `AuthorizationContext`, `authorization/authorizationContext.js` | actor and nullable boundary state | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ACAD-005 | `Course`, `academic/course.js` | eleven logical course fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ACAD-006 | `Enrollment`, `academic/enrollment.js` | seven logical enrollment fields | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ACAD-007 | `LearningLanguage`, `academic/learningLanguage.js` | `languageCode`, `displayName` | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |
| DOM-ACAD-008 | `InterfaceLanguage`, `academic/interfaceLanguage.js` | `locale`, `displayName` | `STRUCTURAL_SHAPE_DOMAIN_AUTHORITY` |

These files export no runtime value. Package persistence allowlists describe
physical documents and therefore are not duplicate semantic shapes. There is no
approved need to manufacture runtime objects or package exports for these JSDoc
specifications.

`LearningLanguage` remains the language taught by a Course.
`InterfaceLanguage` remains a presentation locale descriptor. They are not
interchangeable. Generic `isCanonicalBcp47` remains the sole executable BCP 47
authority in the package; use of BCP 47 syntax by both shapes does not merge
their semantics.

### Residual runtime Domain authority (6)

| ID | Contract | Dependencies/current role | Final classification |
|---|---|---|---|
| DOM-WF-002 | `TENANT_WORKFLOW` | statuses, platform actor, capabilities; four transitions | `WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY` |
| DOM-WF-003 | `REGISTRATION_REQUEST_WORKFLOW` | statuses, actors, capabilities; four terminal transitions | `WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY` |
| DOM-WF-004 | `MEMBERSHIP_WORKFLOW` | statuses, actors, capabilities; four transitions | `WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY` |
| DOM-WF-005 | `COURSE_WORKFLOW` | statuses, teacher/admin creation, capabilities; three transitions | `WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY` |
| DOM-WF-006 | `ENROLLMENT_WORKFLOW` | statuses, actors, capabilities; four transitions | `WORKFLOW_TEMPORARY_DOMAIN_AUTHORITY` |
| DOM-WF-007 | `APPROVE_REGISTRATION_REQUEST` | cross-aggregate preconditions/effects, actor and idempotency semantics | `BACKEND_DEFERRED` |

The five workflow descriptors are pure and technically could import their now
package-owned dependencies, but technical feasibility is not normative approval.
R3-D-R1 explicitly excluded complete workflow migration and deferred the final
physical-authority question. No later source authorizes extraction in R3-H.
They therefore remain Domain runtime authority until a separately approved
workflow-contract phase decides otherwise. Their `initialState`, actors,
transitions, terminal states, capabilities and observations remain unchanged.

Tenant, RegistrationRequest and Course lifecycle data remains embedded in these
descriptors. R3-H does not invent `TENANT_STATUS_TRANSITIONS`,
`REGISTRATION_REQUEST_STATUS_TRANSITIONS`, `COURSE_STATUS_TRANSITIONS`, terminal
sets or validators.

`APPROVE_REGISTRATION_REQUEST` is a frozen declarative cross-aggregate boundary,
not an executor. The package has the command type ID but not an equivalent of
this full descriptor. Its eventual implementation belongs to privileged backend
command design; no handler, transaction, idempotency store or audit writer is
created here.

## Global duplication classification

| Finding | Classification/action |
|---|---|
| package definitions plus Domain reexports | `AUTHORITATIVE_PACKAGE_DEFINITION` + `DOMAIN_COMPATIBILITY_REEXPORT`; retain |
| Firestore status/role literals | `LEGITIMATE_RULES_LITERAL`; retain and protect with parity tests |
| independent unit/runtime/precheck data | `TEST_FIXTURE_COPY`; retain test independence |
| explanatory source/docs strings | `DOCUMENTATION_EXAMPLE`; retain |
| local CEFR arrays/sets in AI, missions, auth and legacy UI | `LEGACY_DUPLICATION`; defer functional cutover |
| UI list including `Adaptive` | `UNRELATED_SIMILARITY`; not the canonical CEFR contract |
| Shared Repository errors versus package error codes | legitimate separate surfaces fixed by R3-G |
| cursor/query/serializer/repository contracts | `PERSISTENCE_DEFERRED` or `PROHIBITED_TO_MIGRATE_IN_R3` |
| second independently mutable runtime authority for migrated contracts | none |

`DEFECTIVE_DUPLICATION` is zero before and after R3-H. No definitions or adapters
are removed. Legacy CEFR copies remain a controlled compatibility risk because
cutting over product/UI behavior is outside pure Domain authority migration.

## Package, errors, persistence and backend boundaries

Package version remains `0.6.0`. Its explicit root and subpaths cover domain,
persistence, validation, commands, authority, audit and errors. Dependency audit
confirms package-to-Domain imports, Firebase, React, DOM, filesystem/network,
secrets, prohibited runtime dependencies and cycles are absent.

The vendored artifact remains `mipymetic-saas-contracts-0.6.0.tgz`, SHA-256
`6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2`,
with 30 entries. No package byte changed, so artifact regeneration, Functions
clean install and isolated import are not required in R3-H.

R3-G remains closed: `REPOSITORY_ERROR_CODES` and `RepositoryError` stay Shared
client infrastructure; common/backend codes and result contracts stay package
declarations. RepositoryError, Firebase normalization, cursors, queries,
serializers, snapshots and repository dependencies do not migrate in R3.

No Firebase Functions, Admin SDK, commands, persistence, transactions, audit or
authority execution is implemented.

## Validation and parity gate

The closure gate executes package/Domain parity, workflow parity, Shared and
four repository suites, all four runtime prechecks, Rules preflight, general
tests, build, Node syntax, ESLint and diff checks. Existing package tests cover
the migrated values, order, casing, freezing, reference identity, workflow
parity, Rules literals, CEFR, capability matrix, dependency purity and artifact
manifest.

The required outcome is zero drift for migrated values/order/casing/freezing,
references, workflows, Rules literals, errors/results, CEFR and authorization
matrices.

## Risks and rollback

Residual risks are explicit: complete workflows await normative placement;
structural shapes could later need a typed/shared representation; legacy CEFR
copies can drift; the approval descriptor awaits backend command design; and
production behavior is not activated. None is an unexplained duplicate or a
defect in current shadow repositories.

Rollback is documentation-only: revert the R3-H closure record and traceability
updates. No source, package, artifact, lockfile, Rules or data rollback applies.

## State and next phase

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-H = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-C1 = ready_not_started
SaaS-03B-B0-I-R4 = blocked_pending_R3_C1
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = residual_authority_reconciled
Privileged Backend = not_created
```

R3-H is `COMPLETE` under `RESULT_A`. R3-C1 was not started.
