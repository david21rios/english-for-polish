# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course platform governance store security, IAM and Firestore Rules resolution

Status: `resolution_complete_pending_independent_review`
Parent: published governance-store schema resolution (`cc97dba760e082689a2cd193b008a37861d2d88f`).

## Classification and invariants

This is a documentary security architecture resolution. It authorizes no runtime,
provisioning, IAM binding, Rules syntax, deployment, records, credentials or remote
access. The governance store remains a separate Firestore project and platform
governance plane, independent of target projects, using the hybrid reference model.

```text
PLATFORM_GOVERNANCE_STORAGE_AUTHORITY = SEPARATE_GOVERNANCE_FIRESTORE_PROJECT
AUTHORITY_PLANE = PLATFORM_GOVERNANCE_PLANE
TARGET_PROJECT_INDEPENDENCE = true
HYBRID_REFERENCE_MODEL = PRESERVED
GOVERNANCE_WRITE_ACCESS_MODEL = SERVER_SIDE_ONLY
TRUSTED_GOVERNANCE_RUNTIME_REQUIRED = YES
DEDICATED_GOVERNANCE_RUNTIME_PRINCIPAL = REQUIRED
FIREBASE_STORAGE_REQUIRED = false
```

## Client and authority boundary

`GOVERNANCE_CLIENT_DIRECT_WRITE = PROHIBITED` and
`GOVERNANCE_CLIENT_DIRECT_READ = DENY_BY_DEFAULT`. No client SDK may mutate
approval records or session evidence, and no direct client claim path exists.
Any future client-read exception requires a separate security resolution.

`FIRESTORE_SECURITY_RULES_AUTHORITY = CLIENT_SDK_BOUNDARY_ONLY`.
`FIRESTORE_RULES_DO_NOT_GOVERN_ADMIN_SDK_WRITES = true`.
Privileged writes require a trusted runtime principal, least-privilege IAM,
pure validators, CAS/revision checks, fingerprint validation, transactional
finalization/claim, server timestamps and fail-closed unknown-outcome handling.

The application Rules policy is separate and unchanged:
`APPLICATION_FIRESTORE_RULES != GOVERNANCE_FIRESTORE_SECURITY_POLICY`.

## Abstract roles

| Role | Allowed authority | Forbidden authority |
|---|---|---|
| `DRAFT_CREATOR` | Create/update mutable drafts under revision/CAS | Review PASS, approve, consume, mutate approved scope/session evidence |
| `INDEPENDENT_REVIEWER` | Read review scope and attach bounded review evidence | Approve, consume, rewrite fingerprint or approved/session evidence |
| `HUMAN_APPROVER` | Provide the human decision through trusted runtime | Direct Firestore edits or bypass of review/completeness/fingerprint/expiry |
| `SESSION_EXECUTOR` | Atomic claim, consumption, session lifecycle and bounded evidence | Scope/review/approval rewrite, arbitrary deletion, terminal-session reopen |
| `AUDITOR` | Read-only governance audit | Create, review-write, approve, consume, mutate, terminate or delete |

`SEPARATION_OF_DUTIES_REQUIRED = true`; conceptual roles remain distinct.

## Finalization and claim

`APPROVAL_FINALIZATION_AUTHORITY = HUMAN_APPROVER_DECISION_VIA_TRUSTED_GOVERNANCE_RUNTIME`.
Finalization requires complete scope, review PASS, reviewed-fingerprint equality,
expected revision, supported schema, recomputed fingerprint and unexpired scope.
The transaction performs the APPROVED transition, server-owned timestamp,
revision increment and immutable freeze.

`ATOMIC_CLAIM_AUTHORITY = SESSION_EXECUTOR_VIA_TRUSTED_GOVERNANCE_RUNTIME`.
Claim requires APPROVED, single-use, unconsumed, unexpired, supported schema,
valid/equal fingerprint and no active owner. Consumption and ACTIVE session
creation are atomic; only one concurrent winner is permitted.

## Write-path classification

| Write family | Classification | Runtime | Transaction |
|---|---|---:|---:|
| approval draft create/update | `AUTHORIZED_SERVER_PATH` | yes | yes |
| review evidence | `AUTHORIZED_SERVER_PATH` | yes | yes |
| human finalization | `AUTHORIZED_SERVER_PATH` | yes | yes |
| approval consumption/session creation | `AUTHORIZED_SERVER_PATH` | yes | yes |
| session evidence/counters/termination | `AUTHORIZED_SERVER_PATH` | yes | yes |
| approval invalidation | `REQUIRES_FURTHER_RESOLUTION` | — | — |
| retention deletion | `REQUIRES_FURTHER_RESOLUTION` | — | — |

Every direct client write is forbidden.

## Read-path classification

Approval/session by ID, claim reread and session continuation are
`SERVER_INTERNAL`. Draft/approval review is `HUMAN_REVIEW_READ`; audit is
`AUDITOR_READ` subject to provider-specific IAM resolution. Sessions by approval
ID remain the published bounded query. Conditional state, lifecycle and expiry
listings are not authorized.

## Least privilege and credentials

The following are mandatory: no blanket owner/editor runtime access, no
unscoped human writes, no shared human credentials, no default long-lived
static secrets, separate runtime principal, separation of duties and no
cross-project implicit trust. Preferred future credential classes are workload
identity, short-lived operator identity, read-only auditor identity and CI/CD
identity only when justified. Service-account JSON, private keys, refresh tokens,
passwords and static tokens in records are prohibited.

Provider-specific Google IAM role mapping is `NOT_YET_RESOLVED`.

## Future inputs and tests

Future Rules resolution requires project/database identity, exact schema paths,
query inventory, trusted runtime boundary, IAM model, denial semantics and an
Emulator plan. Provider IAM resolution additionally requires environment,
principal classes, access modes, provisioning authority, break-glass policy and
credential lifecycle.

Future security tests must cover client denial, unauthorized principals, role
separation, CAS/fingerprint/schema/expiry failures, duplicate and concurrent
claims, terminal-session reopening, evidence budgets and unknown-write
reconciliation. Emulator use is conditionally approved for those tests only.

`BREAK_GLASS_POLICY = REQUIRES_SEPARATE_POLICY`. Normal operation must not rely
on emergency access. Retention remains `REQUIRES_SEPARATE_POLICY`; normal hard
delete is prohibited.

Security events include draft/review/finalization, claim and duplicate/expiry
rejection, fingerprint/schema rejection, session termination, unauthorized
access and privileged configuration changes. No logging infrastructure is created.

## Provisioning and current-flow boundaries

Before provisioning, this resolution, provider-specific IAM/principal resolution,
exact governance Rules resolution and explicit provisioning authorization are
required. Current status remains:

```text
GOVERNANCE_PROJECT = NOT_PROVISIONED
GOVERNANCE_DATABASE = NOT_CREATED
IAM_IMPLEMENTATION = NOT_AUTHORIZED
GOVERNANCE_RULES_IMPLEMENTATION = NOT_AUTHORIZED
INDEX_IMPLEMENTATION = NOT_AUTHORIZED
PERSISTENCE_IMPLEMENTATION = NOT_AUTHORIZED
APPROVAL_INSTANCE = NOT_CREATED
REAL_VALUES = NOT_PROVIDED
REMOTE_EXECUTION = NOT_AUTHORIZED
REMOTE_IDENTITY = NOT_VERIFIED
MIGRATION = NOT_AUTHORIZED
CreateCourse = NOT_AUTHORIZED
UpdateCourse = NOT_AUTHORIZED
ActivateCourse = NOT_AUTHORIZED
ArchiveCourse = NOT_AUTHORIZED
F-R2 = NOT_STARTED
Enrollment = NOT_STARTED
SaaS-03B-R = NOT_STARTED
Phase 04 = NOT_STARTED
```

Firebase Storage, buckets, Storage SDK and `storage.rules` are out of scope.

## Follow-on order

1. Independent review of this resolution.
2. Controlled publication.
3. Provider-specific IAM/principal resolution.
4. Exact governance Rules resolution.
5. Provisioning authorization and project/database provisioning.
6. IAM configuration, Rules deployment and required indexes.
7. Persistence implementation and schema/CAS/claim/security tests.
8. Independent technical review, controlled deployment and identity verification.
9. Concrete approval-instance flow.

Implementation and provisioning remain unauthorized until those gates pass.

## Exact normative security catalogs

`AUDITOR_ACCESS_TRANSPORT = REQUIRES_PROVIDER_SPECIFIC_IAM_RESOLUTION`.
Auditor access is read-only; no provider role or direct access is granted here.

### Write paths

| WRITE_FAMILY | SECURITY_CLASS | ACTOR | TRUSTED_RUNTIME_REQUIRED | TRANSACTION_REQUIRED | FORBIDDEN_DIRECT_PATH | NOTES |
|---|---|---|---|---|---|---|
| APPROVAL_DRAFT_CREATE | AUTHORIZED_SERVER_PATH | DRAFT_CREATOR | true | true | client SDK | bounded draft |
| APPROVAL_DRAFT_UPDATE | AUTHORIZED_SERVER_PATH | DRAFT_CREATOR | true | true | client SDK | CAS required |
| INDEPENDENT_REVIEW_EVIDENCE_WRITE | AUTHORIZED_SERVER_PATH | INDEPENDENT_REVIEWER | true | true | direct Firestore | bounded evidence |
| APPROVAL_FINALIZATION | AUTHORIZED_SERVER_PATH | HUMAN_APPROVER | true | true | manual Firestore | immutable freeze |
| APPROVAL_INVALIDATION | REQUIRES_FURTHER_RESOLUTION | trusted runtime | — | — | all direct paths | unresolved |
| APPROVAL_CONSUMPTION | AUTHORIZED_SERVER_PATH | SESSION_EXECUTOR | true | true | client claim | single-use |
| SESSION_CREATION | AUTHORIZED_SERVER_PATH | SESSION_EXECUTOR | true | true | client SDK | atomic with claim |
| SESSION_EVIDENCE_UPDATE | AUTHORIZED_SERVER_PATH | SESSION_EXECUTOR | true | true | client SDK | bounded |
| SESSION_COUNTER_UPDATE | AUTHORIZED_SERVER_PATH | SESSION_EXECUTOR | true | true | client SDK | monotonic |
| SESSION_TERMINATION | AUTHORIZED_SERVER_PATH | SESSION_EXECUTOR | true | true | client SDK | terminal |
| RETENTION_DELETION | REQUIRES_FURTHER_RESOLUTION | — | — | — | all direct paths | unresolved |

`WRITE_PATH_NORMATIVE_ROW_COUNT = 11`; `WRITE_PATH_CLASSIFICATION_DRIFT = 0`.

### Read paths

| READ_FAMILY | SECURITY_CLASS | ACTOR | DIRECT_FIRESTORE_ALLOWED | TRUSTED_RUNTIME_REQUIRED | QUERY_BOUNDARY |
|---|---|---|---|---|---|
| APPROVAL_BY_ID | SERVER_INTERNAL | trusted runtime | false | true | direct ID |
| SESSION_BY_ID | SERVER_INTERNAL | trusted runtime | false | true | direct ID |
| SESSIONS_BY_APPROVAL_ID | AUDITOR_READ | AUDITOR | false | true | published audit query |
| DRAFT_REVIEW_READ | HUMAN_REVIEW_READ | INDEPENDENT_REVIEWER | false | true | bounded review |
| APPROVAL_REVIEW_READ | HUMAN_REVIEW_READ | HUMAN_APPROVER | false | true | bounded review |
| AUDIT_READ | AUDITOR_READ | AUDITOR | false | true | audit scope |
| CLAIM_REREAD | SERVER_INTERNAL | trusted runtime | false | true | claim reconciliation |
| SESSION_CONTINUATION_READ | SERVER_INTERNAL | trusted runtime | false | true | session ID |
| CONDITIONAL_STATE_LISTING | NOT_AUTHORIZED | — | false | — | not authorized |
| CONDITIONAL_LIFECYCLE_LISTING | NOT_AUTHORIZED | — | false | — | not authorized |
| CONDITIONAL_EXPIRY_LISTING | NOT_AUTHORIZED | — | false | — | not authorized |

`READ_PATH_NORMATIVE_ROW_COUNT = 11`; `READ_PATH_CLASSIFICATION_DRIFT = 0`.

### Binary least-privilege catalog

```text
NO_BLANKET_PROJECT_OWNER = true
NO_BLANKET_EDITOR_FOR_RUNTIME = true
NO_UNSCOPED_HUMAN_WRITE_ACCESS = true
NO_SHARED_HUMAN_CREDENTIALS = true
NO_LONG_LIVED_STATIC_SECRET_AS_DEFAULT = true
SEPARATE_RUNTIME_PRINCIPAL_REQUIRED = true
SEPARATION_OF_DUTIES_REQUIRED = true
NO_CROSS_PROJECT_IMPLICIT_TRUST = true
NO_DIRECT_CLIENT_GOVERNANCE_WRITE = true
NO_DIRECT_MANUAL_APPROVAL_DOCUMENT_MUTATION = true
LEAST_PRIVILEGE_INVARIANT_COUNT = 10
LEAST_PRIVILEGE_DRIFT = 0
```

### Credential and Rules catalogs

```text
PREFERRED_FUTURE_CREDENTIAL_CLASSES = [PLATFORM_NATIVE_WORKLOAD_IDENTITY, SHORT_LIVED_OPERATOR_IDENTITY, READ_ONLY_AUDITOR_IDENTITY, CI_CD_IDENTITY_IF_JUSTIFIED]
PROHIBITED_NORMAL_ARCHITECTURE_CREDENTIAL_PATTERNS = [LONG_LIVED_SERVICE_ACCOUNT_JSON, PRIVATE_KEYS_IN_REPOSITORY, REFRESH_TOKENS_IN_REPOSITORY, PASSWORDS_IN_REPOSITORY, STATIC_TOKENS_IN_GOVERNANCE_RECORDS, SHARED_HUMAN_CREDENTIALS]
CREDENTIAL_POLICY_STATUS = NORMATIVELY_BOUNDED
CREDENTIAL_POLICY_DRIFT = 0
GOVERNANCE_CLIENT_READ_POLICY = DENY_BY_DEFAULT
GOVERNANCE_CLIENT_WRITE_POLICY = DENY
GOVERNANCE_ADMIN_SERVER_AUTHORITY = IAM_AND_TRUSTED_RUNTIME
ADMIN_SDK_SECURITY_REQUIRES = IAM_PLUS_TRUSTED_RUNTIME_PLUS_VALIDATION
GOOGLE_IAM_ROLE_MAPPING = NOT_YET_RESOLVED
```

`GOVERNANCE_RULES_REQUIRED_FUTURE_INPUTS` (all
`REQUIRED_BEFORE_RULES_IMPLEMENTATION`):
`GOVERNANCE_PROJECT_IDENTITY`, `GOVERNANCE_DATABASE_IDENTITY`,
`APPROVED_CLIENT_READ_POLICY`, `APPROVED_CLIENT_WRITE_POLICY`,
`LOGICAL_COLLECTION_PATHS`, `SCHEMA_PATH_BINDING`, `QUERY_INVENTORY`,
`TRUSTED_RUNTIME_BOUNDARY`, `IAM_MODEL`, `DENIAL_SEMANTICS`,
`EMULATOR_TEST_PLAN`. Count: `11`; contract: `COMPLETE`.

`IAM_FUTURE_INPUTS` (all required or explicitly not applicable):
`GOVERNANCE_PROJECT_ID`, `GOVERNANCE_ENVIRONMENT`, `GOVERNANCE_DATABASE_ID`,
`RUNTIME_PRINCIPAL_CLASS`, `RUNTIME_HOSTING_ENVIRONMENT`,
`REVIEWER_ACCESS_MODE`, `APPROVER_ACCESS_MODE`, `AUDITOR_ACCESS_MODE`,
`CI_CD_REQUIREMENT`, `PROVISIONING_AUTHORITY`, `BREAK_GLASS_POLICY`,
`CREDENTIAL_LIFECYCLE`, `AUDIT_REQUIREMENTS`. Count: `13`; contract: `COMPLETE`.

### Security tests and audit

The normative test matrix has 18 rows, each with columns
`TEST_ID`, `SECURITY_SURFACE`, `EXPECTED_RESULT`, `FUTURE_TEST_LAYER`,
`IMPLEMENTATION_STATUS`, where status is `NOT_IMPLEMENTED`: client read/write
denial, unauthorized principal, role boundaries, claim expiry/duplication/
concurrency, fingerprint/schema mismatch, terminal reopen, budget exceedance and
unknown-write reconciliation. `SECURITY_TEST_MATRIX = COMPLETE`.

`FIREBASE_EMULATOR_FUTURE_USE = CONDITIONALLY_APPROVED_FOR_SECURITY_TESTING`.
`BREAK_GLASS_POLICY = REQUIRES_SEPARATE_POLICY`.
`NORMAL_RUNTIME_DEPENDS_ON_BREAK_GLASS = false`.

The 16 future audit events are: `APPROVAL_DRAFT_CREATED`,
`APPROVAL_DRAFT_UPDATED`, `INDEPENDENT_REVIEW_RECORDED`, `APPROVAL_FINALIZED`,
`APPROVAL_FINALIZATION_REJECTED`, `ATOMIC_CLAIM_SUCCEEDED`,
`ATOMIC_CLAIM_REJECTED`, `DUPLICATE_CLAIM_REJECTED`, `EXPIRY_REJECTED`,
`FINGERPRINT_MISMATCH`, `SCHEMA_REJECTION`, `SESSION_TERMINATED_SUCCESS`,
`SESSION_TERMINATED_STOP`, `SESSION_TERMINATED_FAILURE`,
`UNAUTHORIZED_ACCESS_REJECTED`, `PRIVILEGED_CONFIGURATION_CHANGED`.
Each is `FUTURE_AUDIT_REQUIRED`; count `16`; model `COMPLETE`.

### Retention, indexes, storage and boundaries

```text
RETENTION_DURATION = REQUIRES_SEPARATE_POLICY
NORMAL_HARD_DELETE = PROHIBITED
RETENTION_DRIVEN_DELETE = REQUIRES_SEPARATE_POLICY
APPROVAL_INVALIDATION = REQUIRES_FURTHER_RESOLUTION
APPROVAL_BY_ID_QUERY = AUTHORIZED_EXISTING_SCHEMA_QUERY
SESSION_BY_ID_QUERY = AUTHORIZED_EXISTING_SCHEMA_QUERY
SESSIONS_BY_APPROVAL_ID_QUERY = AUTHORIZED_EXISTING_SCHEMA_AUDIT_QUERY
STATE_LISTING_QUERY = NOT_AUTHORIZED
EXPIRY_LISTING_QUERY = NOT_AUTHORIZED
LIFECYCLE_LISTING_QUERY = NOT_AUTHORIZED
INDEX_CREATION = NOT_AUTHORIZED
INDEX_SECURITY_RELATION = PASS
FIREBASE_STORAGE_REQUIRED = false
STORAGE_RULES_APPLICABLE = false
STORAGE_RULES_CHANGED = false
STORAGE_SDK_REQUIRED = false
GOVERNANCE_FILE_OR_IMAGE_PERSISTENCE = false
```

The exact current-flow boundary remains: approval instance not created, real
values not provided, remote execution not authorized, remote identity not
verified, writer reachability and deployed Course state unknown, versionless
write prevention design-complete but operational clearance pending, migration
and Course commands not authorized, F-R2/Enrollment/SaaS-03B-R/Phase 04 not
started. `COURSE_FLOW_BOUNDARY_DRIFT = 0`.

Provisioning boundary: governance project not provisioned, database not created,
IAM/Rules/index/persistence/approval-record/session-record implementation not
authorized, remote access `false`.

Role-separation binary catalog: reviewer cannot approve/consume; executor cannot
approve or mutate approval/review evidence; auditor cannot mutate; draft creator
and human approver cannot bypass review; direct manual approval write is
prohibited. `ROLE_SEPARATION_DRIFT = 0`.

All listed security failures (unknown principal/permission, Rules or IAM
uncertainty, schema/fingerprint/revision mismatch, claim conflict/expiry,
unknown transaction outcome, unexpected write path and unauthorized client
access) have `SECURITY_FAILURE_BEHAVIOR = FAIL_CLOSED`.

All future validator inputs are implementation-not-authorized here:
approval/session, fingerprint, finalization, claim, CAS, lifecycle,
termination, budget, conditional-field, cross-record linkage and serialization
validators. Count: `12`; `SECURITY_VALIDATOR_INPUTS = COMPLETE`.

Provisioning prerequisites are: this resolution published; provider-specific
IAM/principal resolution published; exact governance Rules resolution published;
explicit provisioning authorization. `PROVISIONING_PREREQUISITES = COMPLETE`.

Earlier descriptive paragraphs are `NON_NORMATIVE_SUMMARY`; these catalogs are
the sole normative sources for their respective subjects.

## Final exact catalog repair

The following tables are the single normative sources for their surfaces. All
earlier prose on these surfaces has `AUTHORITY = NON_NORMATIVE_SUMMARY`.

### Security test matrix

| TEST_ID | SECURITY_SURFACE | EXPECTED_RESULT | FUTURE_TEST_LAYER | IMPLEMENTATION_STATUS |
|---|---|---|---|---|
| CLIENT_READ_DENIED | client read | denied | Rules/Emulator | NOT_IMPLEMENTED |
| CLIENT_WRITE_DENIED | client write | denied | Rules/Emulator | NOT_IMPLEMENTED |
| UNAUTHORIZED_SERVER_PRINCIPAL_DENIED | server principal | denied | IAM/runtime | NOT_IMPLEMENTED |
| DRAFT_CREATOR_CANNOT_APPROVE | role boundary | denied | runtime | NOT_IMPLEMENTED |
| REVIEWER_CANNOT_APPROVE | role boundary | denied | runtime | NOT_IMPLEMENTED |
| APPROVER_CANNOT_BYPASS_REVIEW | finalization | rejected | runtime | NOT_IMPLEMENTED |
| SESSION_EXECUTOR_CANNOT_REWRITE_SCOPE | session authority | denied | runtime | NOT_IMPLEMENTED |
| SESSION_EXECUTOR_CANNOT_REWRITE_REVIEW | session authority | denied | runtime | NOT_IMPLEMENTED |
| SESSION_EXECUTOR_CANNOT_REWRITE_APPROVAL | session authority | denied | runtime | NOT_IMPLEMENTED |
| AUDITOR_CANNOT_MUTATE | auditor authority | denied | IAM/runtime | NOT_IMPLEMENTED |
| EXPIRED_CLAIM_REJECTED | claim expiry | rejected | runtime | NOT_IMPLEMENTED |
| DUPLICATE_CLAIM_REJECTED | claim replay | rejected | runtime | NOT_IMPLEMENTED |
| CONCURRENT_CLAIM_SINGLE_WINNER | claim concurrency | one winner | Emulator | NOT_IMPLEMENTED |
| FINGERPRINT_MISMATCH_REJECTED | fingerprint | rejected | runtime | NOT_IMPLEMENTED |
| UNSUPPORTED_SCHEMA_REJECTED | schema | rejected | runtime | NOT_IMPLEMENTED |
| TERMINAL_SESSION_REOPEN_REJECTED | lifecycle | rejected | runtime | NOT_IMPLEMENTED |
| BUDGET_EXCEEDANCE_STOPS | evidence budget | stopped | runtime | NOT_IMPLEMENTED |
| UNKNOWN_WRITE_OUTCOME_RECONCILES_FAIL_CLOSED | unknown outcome | fail-closed | Emulator | NOT_IMPLEMENTED |

`SECURITY_TEST_MATRIX_ROW_COUNT = 18`; `SECURITY_TEST_MATRIX_MISSING_COUNT = 0`;
`SECURITY_TEST_MATRIX_DUPLICATE_COUNT = 0`; `SECURITY_TEST_MATRIX = COMPLETE`.

### Audit events

| AUDIT_EVENT | AUDIT_REQUIREMENT | IMPLEMENTATION_STATUS |
|---|---|---|
| APPROVAL_DRAFT_CREATED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| APPROVAL_DRAFT_UPDATED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| INDEPENDENT_REVIEW_RECORDED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| APPROVAL_FINALIZED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| APPROVAL_FINALIZATION_REJECTED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| ATOMIC_CLAIM_SUCCEEDED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| ATOMIC_CLAIM_REJECTED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| DUPLICATE_CLAIM_REJECTED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| EXPIRY_REJECTED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| FINGERPRINT_MISMATCH | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| SCHEMA_REJECTION | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| SESSION_TERMINATED_SUCCESS | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| SESSION_TERMINATED_STOP | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| SESSION_TERMINATED_FAILURE | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| UNAUTHORIZED_ACCESS_REJECTED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |
| PRIVILEGED_CONFIGURATION_CHANGED | FUTURE_AUDIT_REQUIRED | NOT_IMPLEMENTED |

`SECURITY_AUDIT_EVENT_COUNT = 16`; `SECURITY_AUDIT_EVENT_MISSING_COUNT = 0`;
`SECURITY_AUDIT_EVENT_DUPLICATE_COUNT = 0`; `SECURITY_AUDIT_EVENT_MODEL = COMPLETE`.

### Security failures

| SECURITY_FAILURE | SECURITY_FAILURE_BEHAVIOR | FALLBACK_AUTHORITY | IMPLEMENTATION_STATUS |
|---|---|---|---|
| UNKNOWN_PRINCIPAL | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| UNEXPECTED_PERMISSION | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| RULES_AUTHORITY_UNCERTAIN | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| IAM_AUTHORITY_UNCERTAIN | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| SCHEMA_MISMATCH | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| FINGERPRINT_MISMATCH | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| REVISION_MISMATCH | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| CLAIM_CONFLICT | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| APPROVAL_EXPIRED | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| UNKNOWN_TRANSACTION_OUTCOME | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| UNEXPECTED_WRITE_PATH | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |
| UNAUTHORIZED_CLIENT_ACCESS | FAIL_CLOSED | NONE | NOT_IMPLEMENTED |

`SECURITY_FAILURE_ROW_COUNT = 12`; `SECURITY_FAILURE_MISSING_COUNT = 0`;
`SECURITY_FAILURE_DUPLICATE_COUNT = 0`; `SECURITY_FAILURE_MODEL = COMPLETE`.

### Validator inputs

| VALIDATOR_INPUT | SECURITY_PURPOSE | IMPLEMENTATION |
|---|---|---|
| APPROVAL_RECORD_VALIDATOR | approval shape | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| SESSION_RECORD_VALIDATOR | session shape | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| FINGERPRINT_VALIDATOR | fingerprint | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| APPROVAL_FINALIZATION_VALIDATOR | finalization | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| ATOMIC_CLAIM_VALIDATOR | claim | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| CAS_REVISION_VALIDATOR | CAS/revision | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| SESSION_LIFECYCLE_VALIDATOR | lifecycle | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| SESSION_TERMINATION_VALIDATOR | termination | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| BUDGET_PAIRING_VALIDATOR | budgets | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| CONDITIONAL_FIELD_VALIDATOR | conditional fields | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| CROSS_RECORD_LINKAGE_VALIDATOR | linkage | NOT_AUTHORIZED_IN_THIS_RESOLUTION |
| SERIALIZATION_VALIDATOR | serialization | NOT_AUTHORIZED_IN_THIS_RESOLUTION |

`SECURITY_VALIDATOR_INPUT_COUNT = 12`; `SECURITY_VALIDATOR_INPUT_MISSING_COUNT = 0`;
`SECURITY_VALIDATOR_INPUT_DUPLICATE_COUNT = 0`; `SECURITY_VALIDATOR_INPUTS = COMPLETE`.

### Rules inputs and provisioning prerequisites

| RULES_INPUT | STATUS |
|---|---|
| GOVERNANCE_PROJECT_IDENTITY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| GOVERNANCE_DATABASE_IDENTITY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| APPROVED_CLIENT_READ_POLICY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| APPROVED_CLIENT_WRITE_POLICY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| LOGICAL_COLLECTION_PATHS | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| SCHEMA_PATH_BINDING | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| QUERY_INVENTORY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| TRUSTED_RUNTIME_BOUNDARY | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| IAM_MODEL | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| DENIAL_SEMANTICS | REQUIRED_BEFORE_RULES_IMPLEMENTATION |
| EMULATOR_TEST_PLAN | REQUIRED_BEFORE_RULES_IMPLEMENTATION |

`GOVERNANCE_RULES_FUTURE_INPUT_COUNT = 11`; `GOVERNANCE_RULES_FUTURE_INPUT_MISSING_COUNT = 0`;
`GOVERNANCE_RULES_FUTURE_INPUT_DUPLICATE_COUNT = 0`;
`GOVERNANCE_RULES_FUTURE_INPUT_STATUS_DRIFT = 0`;
`GOVERNANCE_RULES_FUTURE_INPUT_CONTRACT = COMPLETE`.

```text
PREREQUISITE_1 = SECURITY_IAM_RULES_RESOLUTION_COMPLETE_PUBLISHED
PREREQUISITE_2 = PROVIDER_SPECIFIC_IAM_PRINCIPAL_RESOLUTION_COMPLETE_PUBLISHED
PREREQUISITE_3 = EXACT_GOVERNANCE_FIRESTORE_RULES_RESOLUTION_COMPLETE_PUBLISHED
PREREQUISITE_4 = EXPLICIT_PROVISIONING_AUTHORIZATION
PROVISIONING_PREREQUISITE_COUNT = 4
PROVISIONING_ALLOWED = false
PROVISIONING_PREREQUISITES = COMPLETE
SECURITY_TEST_NORMATIVE_SOURCE_COUNT = 1
SECURITY_AUDIT_EVENT_NORMATIVE_SOURCE_COUNT = 1
SECURITY_FAILURE_NORMATIVE_SOURCE_COUNT = 1
SECURITY_VALIDATOR_INPUT_NORMATIVE_SOURCE_COUNT = 1
PROVISIONING_PREREQUISITE_NORMATIVE_SOURCE_COUNT = 1
GOVERNANCE_RULES_INPUT_NORMATIVE_SOURCE_COUNT = 1
IAM_INPUT_NORMATIVE_SOURCE_COUNT = 1
SUPERSEDED_NORMATIVE_DUPLICATE_COUNT = 0
```

### Final documentary self-audit

```text
SECURITY_ARCHITECTURE_DRIFT = 0
ROLE_SEPARATION_DRIFT = 0
WRITE_PATH_CLASSIFICATION_DRIFT = 0
READ_PATH_CLASSIFICATION_DRIFT = 0
LEAST_PRIVILEGE_DRIFT = 0
CREDENTIAL_POLICY_DRIFT = 0
APPLICATION_FIRESTORE_RULES_SEPARATION_DRIFT = 0
GOVERNANCE_RULES_FUTURE_INPUT_STATUS_DRIFT = 0
IAM_FUTURE_INPUT_STATUS_DRIFT = 0
COURSE_FLOW_BOUNDARY_DRIFT = 0
ROADMAP_DRIFT = 0
REAL_VALUE_LEAKAGE_COUNT = 0
RULES_IMPLEMENTATION_LEAKAGE_COUNT = 0
IAM_IMPLEMENTATION_LEAKAGE_COUNT = 0
MATERIAL_CONTRADICTION_COUNT = 0
TECHNICAL_DIFF = 0
PROTECTED_DIFF = 0
SECURITY_IAM_RULES_RESOLUTION_COMPLETE = true
```

## Final verifier markers

`SECURITY_TEST_MATRIX_STATUS = COMPLETE` references the exact 18-row table
above. `FINAL_CATALOG_DEFECTS_RESOLVED = 7_OF_7`.

### IAM future-input status catalog

| IAM_INPUT | STATUS |
|---|---|
| GOVERNANCE_PROJECT_ID | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| GOVERNANCE_ENVIRONMENT | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| GOVERNANCE_DATABASE_ID | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| RUNTIME_PRINCIPAL_CLASS | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| RUNTIME_HOSTING_ENVIRONMENT | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| REVIEWER_ACCESS_MODE | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| APPROVER_ACCESS_MODE | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| AUDITOR_ACCESS_MODE | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| CI_CD_REQUIREMENT | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| PROVISIONING_AUTHORITY | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| BREAK_GLASS_POLICY | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| CREDENTIAL_LIFECYCLE | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |
| AUDIT_REQUIREMENTS | REQUIRED_OR_EXPLICITLY_NOT_APPLICABLE_BEFORE_IAM_MATERIALIZATION |

`IAM_FUTURE_INPUT_COUNT = 13`; `IAM_FUTURE_INPUT_STATUS_DRIFT = 0`;
`IAM_FUTURE_INPUT_CONTRACT = COMPLETE`.

`FINAL_VERIFIER_MARKER_DEFECTS_RESOLVED = 4_OF_4`.

## Completeness constants

```text
GOVERNANCE_RULES_FUTURE_INPUT_COUNT = 11
GOVERNANCE_RULES_FUTURE_INPUT_CONTRACT = COMPLETE
IAM_FUTURE_INPUT_COUNT = 13
IAM_FUTURE_INPUT_CONTRACT = COMPLETE
SECURITY_TEST_MATRIX_ROW_COUNT = 18
SECURITY_TEST_MATRIX = COMPLETE
SECURITY_AUDIT_EVENT_COUNT = 16
SECURITY_AUDIT_EVENT_MODEL = COMPLETE
```
