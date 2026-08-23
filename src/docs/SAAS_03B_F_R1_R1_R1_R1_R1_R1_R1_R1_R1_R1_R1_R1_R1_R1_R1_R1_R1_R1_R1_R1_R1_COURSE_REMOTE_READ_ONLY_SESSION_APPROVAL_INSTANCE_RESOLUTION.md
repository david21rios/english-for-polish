# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course remote read-only session approval instance resolution

## Status and genealogy

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`.
- Published parent roadmap reconciliation: `eb227d94e6dd0deffb42af711591812642c3bb59`.
- Status: `resolution_complete_pending_independent_review`.
- `HUMAN_APPROVAL_INSTANCE_STATUS = NOT_CREATED`.
- `HUMAN_APPROVAL_REAL_VALUES = NOT_PROVIDED`.
- `REMOTE_OPERATIONAL_INVENTORY_EXECUTION = NOT_AUTHORIZED`.

This is documentation only. It is not a package API, runtime object, Firestore
business entity, Firebase configuration, command contract or audit event.

## Approval-instance object and purpose

The future object is `COURSE_REMOTE_READ_ONLY_SESSION_APPROVAL`, a documentary
operational approval for at most one bounded, read-only Course inventory session.
Its purpose is limited to remote identity verification, deployed-writer
reachability inventory, optionally authorized deployed Rules comparison, Course
state/version inventory and bounded supporting metadata.

It never authorizes writes, deletes, deploys, IAM mutation, backup/export,
migration, remediation, Course runtime, stage opening, F-R2, Enrollment,
SaaS-03B-R or Phase 04.

## Approval identity schema

The concrete future instance must contain, without implicit defaults:

`APPROVAL_ID`, `APPROVAL_PARENT_IDENTIFIER`, `APPROVAL_PURPOSE`,
`APPROVAL_ISSUED_AT`, `APPROVAL_EXPIRES_AT`, `APPROVAL_SINGLE_USE`,
`APPROVAL_STATE`, `FIREBASE_PROJECT_ID`, `ENVIRONMENT_CLASSIFICATION`,
`FIRESTORE_DATABASE_ID`, `ACCESS_CLASS`, `PRINCIPAL_CLASS`,
`PRIVILEGE_ENVELOPE`, `REMOTE_SYSTEM_AUTHORIZATION_MATRIX`,
`OPERATION_CLASS_MATRIX` and `NUMERIC_LIMIT_OBJECT`.

Documentary states are exactly:
`NOT_CREATED | INCOMPLETE | READY_FOR_REVIEW | APPROVED | EXPIRED_OR_INVALID`.

Environment vocabulary is `PRODUCTION | STAGING | DEVELOPMENT |
OTHER_EXPLICITLY_NAMED`; `UNKNOWN` cannot authorize execution.

## Human-approved target and access model

Human input must explicitly approve Firebase project, environment and Firestore
database, plus any enabled Hosting, Functions or GCP identifiers. Local config,
aliases and branch state are `LOCAL_HINT_ONLY` and never final identity proof.

Access is a conceptual class/envelope such as `READ_ONLY_VIEWER`,
`FIRESTORE_READ_ONLY`, `HOSTING_METADATA_VIEWER`, `FUNCTIONS_METADATA_VIEWER`
or `GCLOUD_VIEWER`. The model separates `ACCESS_CLASS_APPROVED`,
`ACCESS_ACTUALLY_AVAILABLE` and `ACCESS_OBSERVED_SUFFICIENT`. Credentials,
tokens, keys, credential files, secret values and unnecessary PII are prohibited.

## Remote system and operation authorization

Every system is explicitly `AUTHORIZED` or
`NOT_AUTHORIZED_FOR_THIS_SESSION`. The matrix covers:

`FIREBASE_PROJECT_IDENTITY`, `FIRESTORE_COURSE_AGGREGATE`,
`FIRESTORE_COURSE_DOCUMENT_VALIDATION`, `FIRESTORE_RULES_READ`,
`HOSTING_METADATA`, `HOSTING_RELEASE_HISTORY`, `FUNCTIONS_METADATA`,
`FUNCTIONS_DEPLOYMENT_HISTORY`, `GCLOUD_PROJECT_IDENTITY`, `CLOUD_RUN_METADATA`,
`CLOUD_SCHEDULER_METADATA`, `DEPLOYMENT_HISTORY`, `LOGS` and
`EXTERNAL_SERVICE_INVENTORY`.

Bounded operation classes are `IDENTITY_READ`, `METADATA_LIST`,
`METADATA_DESCRIBE`, `AGGREGATE_COUNT`, `BOUNDED_DOCUMENT_READ`,
`DEPLOYED_RULES_READ`, `DEPLOYMENT_METADATA_READ`, `LOG_READ` and
`EXTERNAL_ATTESTATION_REVIEW`. Both system and operation authorization are
required; no command is implied.

Unspecified system/operation is unauthorized. Unknown effects stop. Mutating
commands are prohibited. Scope expansion requires new explicit human approval.

## Quantitative and Course scope model

The instance carries finite positive integer limits:

`MAX_EXPECTED_TOTAL_COURSE_DOCUMENTS`, `MAX_COURSE_DOCUMENTS_TO_READ`,
`MAX_FIRESTORE_DOCUMENT_READS`, `MAX_TENANTS_TO_ENUMERATE`,
`MAX_FUNCTIONS_TO_INSPECT`, `MAX_HOSTING_RECORDS_TO_INSPECT`,
`MAX_EXTERNAL_SERVICES_TO_INSPECT`, `MAX_DEPLOYMENT_HISTORY_RECORDS`,
`MAX_LOG_ENTRIES`, `LOG_WINDOW_START` and `LOG_WINDOW_END`.

Disabled categories use `NOT_AUTHORIZED_FOR_THIS_SESSION`. Zero-as-disabled,
negative, decimal, blank, infinite, ambiguous or default values are invalid.
Future actual counters are finite integers greater than or equal to zero and
remain unset in this resolution.

Canonical scope is fixed as:

`CANONICAL_COURSE_PATH = tenants/{tenantId}/courses/{courseId}`

Legacy `levels/...` is excluded. Aggregate population and document-level
validation are independent toggles.

## System-specific boundaries

Rules authorization, if enabled, permits only deployed Rules read/compare; no
edit, deploy, release or rollback. Hosting authorization requires explicit site,
channel, bounded record count, history scope and source/build metadata scope.
Functions authorization requires project, regions, generations and bounded
metadata inspection; `FUNCTIONS_METADATA_ONLY = true`, with no invocation,
source download, deployment or configuration mutation.

Firebase authorization does not imply GCP authorization. Cloud Run, Scheduler,
logs and deployment history require independent toggles. Logs require a bounded,
timezone-explicit window. External inventory requires a finite maximum or named
allowlist; unknown services remain excluded.

## Single-use, expiry and evidence

`APPROVAL_SINGLE_USE = true`. Initial future tuple is
`UNCONSUMED`, `false`, `NOT_SET`, `NOT_ASSIGNED` for consumption state,
consumed boolean, consumed timestamp and owner. `APPROVAL_EXPIRES_AT` is
required and human-selected; no default duration exists.

Human-approved input is kept separate from future observed evidence: observed
identity, actual read counts, writer classifications, Course state, session ID,
consumption timestamp and bootstrap results are not populated here.

## Execution and ceremony boundary

Approval instance completion does not itself authorize execution. The future
sequence is: draft concrete instance; validate completeness; independent review;
human final approval; derive command plan; safety audit; reconfirm if required;
pre-bootstrap checks; consume approval; perform identity bootstrap; then perform
the bounded inventory. No step is executed by this resolution.

Any material change to target, scope, systems, operations, limits, expiry or
purpose creates a new instance or invalidates the current one.

## Governance and completeness

The concrete instance is a documentary human-approval artifact governed outside
runtime/business persistence. It must not be represented as a package enum or
Firestore business document. `COURSE_REMOTE_READ_ONLY_SESSION_APPROVAL_INSTANCE_COMPLETE`
is true only when every required field and every enabled-category limit is
present and valid; no default or silent expansion is allowed.

## Current boundary and next order

`REMOTE_ENVIRONMENT_IDENTITY = NOT_VERIFIED`;
`DEPLOYED_WRITER_REACHABILITY = UNKNOWN`;
`DEPLOYED_COURSE_STATE = UNKNOWN`;
`VERSIONLESS_WRITE_PREVENTION = DESIGN_COMPLETE_OPERATIONAL_CLEARANCE_PENDING`.
Migration, Course runtime, F-R2, Enrollment, SaaS-03B-R and Phase 04 remain
not authorized/not started.

The next ordered work is independent review of this resolution, publication if
approved, concrete human values, instance creation, review of the actual
instance, explicit final authorization, command-plan safety and only then a
single bounded read-only session.

## Exact field-classification vocabulary and table

The closed vocabulary is exactly:
`HUMAN_APPROVED_INPUT`, `FIXED_NORMATIVE_SCOPE`, `FUTURE_OBSERVED_EVIDENCE`,
`FUTURE_SESSION_EVIDENCE` and `CONDITIONAL_IF_SYSTEM_AUTHORIZED`.

| fields | classification |
|---|---|
| APPROVAL_ID, APPROVAL_ISSUED_AT, APPROVAL_EXPIRES_AT, APPROVAL_STATE, FIREBASE_PROJECT_ID, ENVIRONMENT_CLASSIFICATION, FIRESTORE_DATABASE_ID, ACCESS_CLASS, PRINCIPAL_CLASS, PRIVILEGE_ENVELOPE, REMOTE_SYSTEM_AUTHORIZATION_MATRIX, OPERATION_CLASS_MATRIX, numeric limits, system-specific targets and scopes | HUMAN_APPROVED_INPUT |
| APPROVAL_PARENT_IDENTIFIER, APPROVAL_PURPOSE, APPROVAL_SINGLE_USE, CANONICAL_COURSE_PATH | FIXED_NORMATIVE_SCOPE |
| ACTUAL_TOTAL_COURSE_DOCUMENTS, ACTUAL_COURSE_DOCUMENTS_READ, ACTUAL_FIRESTORE_DOCUMENT_READS, OBSERVED_REMOTE_IDENTITY_STATUS, PROJECT_IDENTITY_MATCH, ENVIRONMENT_MATCH, DATABASE_MATCH, DEPLOYED_WRITER_REACHABILITY, DEPLOYED_COURSE_STATE | FUTURE_OBSERVED_EVIDENCE |
| APPROVAL_CONSUMPTION_STATE, APPROVAL_CONSUMED, APPROVAL_CONSUMED_AT, APPROVAL_CONSUMED_BY_SESSION_ID, SESSION_ID, SESSION_LIFECYCLE_STATE, SESSION_TERMINATION_STATUS, SESSION_TERMINATED_AT, PRE_BOOTSTRAP_CHECKLIST_STATUS, POST_BOOTSTRAP_IDENTITY_CHECKLIST_STATUS, IDENTITY_BOOTSTRAP_EXECUTED, IDENTITY_BOOTSTRAP_EXECUTED_AT, OPERATIONAL_INVENTORY_ENTERED, ACCESS_ACTUALLY_AVAILABLE, ACCESS_OBSERVED_SUFFICIENT | FUTURE_SESSION_EVIDENCE |
| HOSTING_SITE_OR_TARGET, HOSTING_CHANNEL_SCOPE, HOSTING_HISTORY_SCOPE, FUNCTIONS_PROJECT, FUNCTIONS_REGIONS, FUNCTIONS_GENERATIONS, GCP_PROJECT_ID, LOG_SYSTEM, LOG_PURPOSE, LOG_WINDOW_START, LOG_WINDOW_END, DEPLOYMENT_HISTORY_SYSTEM, EXTERNAL_SERVICE_ALLOWLIST and their enabled-category limits | CONDITIONAL_IF_SYSTEM_AUTHORIZED |

Each field has exactly one classification. Human input is never silently
sourced from observation; observed/session evidence is not pre-filled; fixed
scope is not user-overridable; conditional fields are absent or
`NOT_APPLICABLE_IF_DISABLED` unless their system is authorized.

`FIELD_CLASSIFICATION_VOCABULARY = EXPLICIT_COMPLETE`,
`FIELD_CLASSIFICATION_TABLE = COMPLETE`, `FIELD_CLASSIFICATION_DRIFT = 0`,
and `FIELD_CLASSIFICATION_SEMANTICS = EXPLICIT_COMPLETE`.

## Human-input source vocabulary and table

The closed source vocabulary is exactly:
`USER_DECLARED`, `LOCAL_HINT_REQUIRES_HUMAN_CONFIRMATION`,
`FIXED_BY_PUBLISHED_CONTRACT`, `NOT_APPLICABLE_IF_DISABLED` and
`REMOTE_OBSERVED_LATER`.

| fields | source classification |
|---|---|
| APPROVAL_PURPOSE, ENVIRONMENT_CLASSIFICATION, ACCESS_CLASS, PRINCIPAL_CLASS, PRIVILEGE_ENVELOPE, system matrix, operation matrix and enabled limits | USER_DECLARED |
| FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID | LOCAL_HINT_REQUIRES_HUMAN_CONFIRMATION |
| APPROVAL_PARENT_IDENTIFIER, CANONICAL_COURSE_PATH, APPROVAL_SINGLE_USE | FIXED_BY_PUBLISHED_CONTRACT |
| disabled conditional targets, scopes, windows and limits | NOT_APPLICABLE_IF_DISABLED |
| ACTUAL_* counters, observed identity/matches, writer reachability, Course state and session/bootstrap evidence | REMOTE_OBSERVED_LATER |

`HUMAN_INPUT_SOURCE_VOCABULARY = EXPLICIT_COMPLETE`,
`HUMAN_INPUT_SOURCE_CLASSIFICATION_TABLE = COMPLETE`,
`SOURCE_CLASSIFICATION_DRIFT = 0`.

## Exact human-input checklist

Each item has field, required status, condition, source and validation:

| # | field | required status | condition | source | validation |
|---:|---|---|---|---|---|
|1|APPROVAL_PURPOSE|required|always|USER_DECLARED|exact bounded purpose|
|2|FIREBASE_PROJECT_ID|required|always|LOCAL_HINT_REQUIRES_HUMAN_CONFIRMATION|human confirms|
|3|ENVIRONMENT_CLASSIFICATION|required|always|USER_DECLARED|closed vocabulary|
|4|FIRESTORE_DATABASE_ID|required|always|LOCAL_HINT_REQUIRES_HUMAN_CONFIRMATION|human confirms|
|5|ACCESS_CLASS|required|always|USER_DECLARED|read-only class|
|6|PRINCIPAL_CLASS|required|always|USER_DECLARED|no secrets|
|7|PRIVILEGE_ENVELOPE|required|always|USER_DECLARED|bounded read-only|
|8|REMOTE_SYSTEM_AUTHORIZATION_MATRIX|required|always|USER_DECLARED|explicit allow/deny|
|9|OPERATION_CLASS_MATRIX|required|always|USER_DECLARED|bounded classes|
|10|COURSE_AGGREGATE_POPULATION_READ|required|always|USER_DECLARED|explicit allow/deny|
|11|COURSE_DOCUMENT_LEVEL_VALIDATION_READ|required|always|USER_DECLARED|explicit allow/deny|
|12|FIRESTORE_RULES_READ_AUTHORIZATION|required|always|USER_DECLARED|explicit allow/deny|
|13|HOSTING_SITE_OR_TARGET|conditional|Hosting authorized|USER_DECLARED|exact target|
|14|HOSTING_CHANNEL_SCOPE|conditional|Hosting authorized|USER_DECLARED|bounded scope|
|15|HOSTING_HISTORY_SCOPE|conditional|Hosting history authorized|USER_DECLARED|bounded history|
|16|FUNCTIONS_PROJECT|conditional|Functions authorized|USER_DECLARED|exact project|
|17|FUNCTIONS_REGIONS|conditional|Functions authorized|USER_DECLARED|bounded regions|
|18|FUNCTIONS_GENERATIONS|conditional|Functions authorized|USER_DECLARED|allowed generations|
|19|GCP_PROJECT_ID|conditional|GCP authorized|USER_DECLARED|exact project|
|20|LOG_SYSTEM|conditional|Logs authorized|USER_DECLARED|exact system|
|21|LOG_PURPOSE|conditional|Logs authorized|USER_DECLARED|bounded purpose|
|22|LOG_WINDOW_START|conditional|Logs authorized|USER_DECLARED|bounded timezone|
|23|LOG_WINDOW_END|conditional|Logs authorized|USER_DECLARED|after start|
|24|DEPLOYMENT_HISTORY_SYSTEM|conditional|History authorized|USER_DECLARED|exact system|
|25|EXTERNAL_SERVICE_ALLOWLIST or MAX_EXTERNAL_SERVICES_TO_INSPECT|conditional|External inventory authorized|USER_DECLARED|finite scope|
|26|MAX_EXPECTED_TOTAL_COURSE_DOCUMENTS|required|always|USER_DECLARED|finite integer > 0|
|27|MAX_COURSE_DOCUMENTS_TO_READ|conditional|Document validation authorized|USER_DECLARED|finite integer > 0|
|28|MAX_FIRESTORE_DOCUMENT_READS|required|always|USER_DECLARED|finite integer > 0|
|29|MAX_TENANTS_TO_ENUMERATE|required|always|USER_DECLARED|finite integer > 0|
|30|MAX_FUNCTIONS_TO_INSPECT|conditional|Functions authorized|USER_DECLARED|finite integer > 0|
|31|MAX_HOSTING_RECORDS_TO_INSPECT|conditional|Hosting authorized|USER_DECLARED|finite integer > 0|
|32|MAX_EXTERNAL_SERVICES_TO_INSPECT|conditional|Numeric external scope|USER_DECLARED|finite integer > 0|
|33|MAX_DEPLOYMENT_HISTORY_RECORDS|conditional|History authorized|USER_DECLARED|finite integer > 0|
|34|MAX_LOG_ENTRIES|conditional|Logs authorized|USER_DECLARED|finite integer > 0|
|35|APPROVAL_EXPIRES_AT|required|always|USER_DECLARED|future timestamp|
|36|APPROVAL_SINGLE_USE|required|always|FIXED_BY_PUBLISHED_CONTRACT|must be true|

Disabled categories are `NOT_AUTHORIZED_FOR_THIS_SESSION` or
`NOT_APPLICABLE_IF_DISABLED`; no defaults exist.
`HUMAN_INPUT_CHECKLIST = EXPLICIT_COMPLETE`,
`HUMAN_INPUT_CHECKLIST_ITEM_COUNT = 36`, and
`HUMAN_INPUT_CHECKLIST_COMPLETE = true` only when all applicable items pass.

## Governance and storage authority

`APPROVAL_INSTANCE_STORAGE_MODEL = HYBRID_REFERENCE_MODEL` and
`APPROVAL_INSTANCE_STORAGE_DECISION = RESOLVED`.

Committed repository documentation is authoritative for the normative schema
and immutable approval-scope history. A redacted immutable approval reference
and human approval record hold approved scope. Mutable consumption, ownership,
lifecycle, termination and observed evidence live in an external human/session
operational record. Git is not a mutable session-state database; no historical
commit is rewritten and no secret is stored.

| field group | authoritative owner |
|---|---|
| schema, parent, purpose, canonical path and normative constants | NORMATIVE_REPOSITORY_DOCUMENTATION |
| approved target, systems, operations, limits, expiry and immutable scope tuple | IMMUTABLE_APPROVAL_RECORD / HUMAN_APPROVAL_RECORD |
| consumption, owner, session lifecycle, termination and timestamps | MUTABLE_SESSION_EVIDENCE_RECORD |
| observed identity, counters, writer/Course classification and bootstrap evidence | MUTABLE_SESSION_EVIDENCE_RECORD |

This model supports single-use enforcement, expiry, durable auditability,
immutable scope and evolving session evidence without rewriting Git history.
`STORAGE_MUTABILITY_MODEL = PASS`.

Once final approval is given, the scope tuple is immutable. Any change requires
`NEW_APPROVAL_INSTANCE_REQUIRED`. `APPROVAL_STATE` is distinct from
`APPROVAL_CONSUMPTION_STATE`, `SESSION_LIFECYCLE_STATE` and
`SESSION_TERMINATION_STATUS`.

The completeness rule is now:
`COURSE_REMOTE_READ_ONLY_SESSION_APPROVAL_INSTANCE_COMPLETE = true` only when
identity schema, field/source classifications, checklist, storage decision,
mutability model and all previously defined validity requirements pass. No
concrete instance exists yet.
