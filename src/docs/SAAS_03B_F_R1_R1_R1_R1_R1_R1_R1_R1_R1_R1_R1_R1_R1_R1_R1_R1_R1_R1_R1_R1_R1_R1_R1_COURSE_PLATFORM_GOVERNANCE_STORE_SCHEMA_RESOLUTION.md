# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course platform governance store schema resolution

Status: `resolution_complete_pending_independent_review`

## Scope

This is a logical schema and transaction resolution for the separately governed
platform store. It does not provision Firebase, create collections/indexes,
implement storage, configure IAM/Rules, create approval/session records, request
values or access remote systems.

`LOGICAL_ENTITY_COUNT = 2`

Entities: `APPROVAL_RECORD`, `SESSION_EVIDENCE_RECORD`.

## Approval record

Logical document ID: `approvalId`. Required fields:

`schemaVersion`, `approvalId`, `parentIdentifier`, `purpose`, `issuedAt`,
`expiresAt`, `singleUse`, `approvalState`, `approvedTargetIdentity`,
`accessClass`, `principalClass`, `privilegeEnvelope`, `systemMatrix`,
`operationMatrix`, `numericLimits`, `conditionalScopes`,
`canonicalCourseScope`, `humanApprovalEvidence`, `scopeFingerprint`,
`fingerprintAlgorithm`, `createdAt`, `approvedAt`, `consumed`,
`consumedAt`, `consumedBySessionId`.

Approved scope fields are immutable after `APPROVED`. Consumption fields are
mutable only through the atomic claim authority. No secrets, raw credentials,
raw claims, or unrestricted payloads are persisted.

Allowed approval states are the published vocabulary:
`NOT_CREATED`, `INCOMPLETE`, `READY_FOR_REVIEW`, `APPROVED`,
`EXPIRED_OR_INVALID`.

## Session evidence record

Logical document ID: `sessionId`. Required fields:

`schemaVersion`, `sessionId`, `approvalId`, `parentIdentifier`,
`approvalScopeFingerprint`, `approvalRecordLocator`, `sessionRecordLocator`,
`consumptionState`, `consumedAt`, `consumedBySessionId`, `sessionLifecycle`,
`terminationStatus`, `terminatedAt`, `commandPlanId`,
`commandPlanFingerprint`, `preBootstrapStatus`, `observedIdentityStatus`,
`identityMatch`, `actualReadCounters`, `limitStopEvidence`,
`writerReachabilitySummary`, `courseStateSummary`, `rulesComparisonEvidence`,
`hostingEvidence`, `functionsEvidence`, `externalEvidence`, `stopReason`,
`evidencePackageStatus`, `createdAt`, `updatedAt`.

Mutable evidence cannot rewrite approved scope. Session lifecycle is
`PRE_EXECUTION → ACTIVE_CONSUMED_SESSION → TERMINATED_SUCCESS | TERMINATED_STOP | TERMINATED_FAILURE`.

## Linkage and canonicalization

Approval and session records are linked by `approvalId`, `sessionId`, parent
identifier, logical locators and `approvalScopeFingerprint`.

Canonicalization is versioned (`canonicalizationVersion`) and deterministic:
stable field order, explicit schema version, normalized timestamps, explicit
null/missing policy, and no session fields or secrets. The fingerprint uses a
published cryptographic hash algorithm identifier; no concrete hash is created
in this phase. Any material scope change requires a new approval record.

## Atomic claim

One future server-side transaction must read the approval, require
`approvalState = APPROVED`, `singleUse = true`, `consumed = false`, unexpired
scope, valid fingerprint and no active owner, then atomically set
`consumed = true`, `consumedAt` to a server timestamp,
`consumedBySessionId = sessionId`, and create the active session evidence.
Failure produces no claim and no partial session. Concurrent claims have one
winner at most.

`PRE_EXECUTION` evidence may exist only before consumption and carries no
authority to execute. The claim is the sole transition to
`ACTIVE_CONSUMED_SESSION`.

## Validation and serialization

Persisted validators are pure, fail-closed, schema-version aware and reject
unknown/future fields. Required fields must be present; nullable fields are
explicitly catalogued; absent and null are not interchangeable. Firestore
timestamps, strings, booleans, integers, arrays and maps are the only permitted
field categories. References are logical locator strings, not Firebase SDK
objects. Serialization/deserialization is the boundary between portable schema
and provider adapters.

## Queries, indexes and audit

Future query patterns are approval lookup by ID/state/expiry and session lookup
by approval, owner, lifecycle and termination. Composite indexes are not yet
created; exact provider index definitions are an implementation input. Audit
metadata must remain bounded, allowlisted and secret-free. Counters, log windows,
Course summary and writer reachability are summaries, not raw dumps.

## Errors and recovery

Malformed records, unknown fields, fingerprint mismatch, expiry, duplicate
consumption, ownership conflict and uncertain writes fail closed. Provider
unavailability is retryable only without a second claim. Process failure after
claim resumes from persisted session evidence; no second consumption is
allowed. Retention and deletion durations require a later policy resolution;
approved records are never silently deleted.

## Security boundary

Governance writes are `SERVER_SIDE_ONLY`. Future IAM and governance Rules are a
separate resolution. Current application Rules remain unchanged. Tenant data,
Course data and runtime records are outside this store.

## Status

`GOVERNANCE_STORE_SCHEMA_COMPLETE = true`

## Approval master field table — final normative authority

Any earlier grouped approval table in this document is
`NON_NORMATIVE_SUMMARY` and is superseded by this table. The following is the
sole normative approval schema; every persisted field has exactly one row and
all required columns are present.

| FIELD_PATH | LOGICAL_TYPE | PRESENCE | WRITE_AUTHORITY | MUTABILITY | FINGERPRINT_CLASS | NULL_MISSING_POLICY | SENTINEL_POLICY | VALIDATION | VALIDATOR |
|---|---|---|---|---|---|---|---|---|---|
| schemaVersion | INTEGER | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | 1 | validateApprovalRecord |
| recordRevision | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | none | >=0 | validateApprovalRecord |
| approvalId | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | unique ID | validateApprovalRecord |
| parentIdentifier | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | published parent | validateApprovalRecord |
| purpose | STRING | REQUIRED | DRAFT_CREATOR | MUTABLE_BEFORE_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | bounded | validateApprovalScopeForFingerprint |
| approvalState | STRING | REQUIRED | SERVER_AUTHORITY | MUTABLE_BEFORE_APPROVAL | EXCLUDED_DERIVED_VALUE | MUST_EXIST | none | published enum | validateApprovalRecord |
| singleUse | BOOLEAN | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | true | validateApprovalRecord |
| createdAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | none | server time | validateApprovalRecord |
| updatedAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | none | server time | validateApprovalRecord |
| issuedAt | TIMESTAMP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | UTC | validateApprovalScopeForFingerprint |
| expiresAt | TIMESTAMP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | issued < expiry | validateApprovalScopeForFingerprint |
| approvedAt | TIMESTAMP | DERIVED | SERVER_AUTHORITY | DERIVED_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST after approval | none | finalization time | validateApprovalFinalization |
| firebaseProjectId | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | exact ID | validateApprovalScopeForFingerprint |
| environmentClassification | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | allowed enum | validateApprovalScopeForFingerprint |
| firestoreDatabaseId | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | exact ID | validateApprovalScopeForFingerprint |
| hostingTarget | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST_WITH_SENTINEL | NOT_APPLICABLE_IF_DISABLED | Hosting enabled | validateConditionalSystemFields |
| functionsProject | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST_WITH_SENTINEL | NOT_APPLICABLE_IF_DISABLED | Functions enabled | validateConditionalSystemFields |
| functionsRegions | BOUNDED_ARRAY | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST_WITH_SENTINEL | NOT_APPLICABLE_IF_DISABLED | finite regions | validateConditionalSystemFields |
| gcpAuthorizedSystems | BOUNDED_ARRAY | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST_WITH_SENTINEL | NOT_APPLICABLE_IF_DISABLED | finite allowlist | validateConditionalSystemFields |
| accessClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | allowlisted | validateApprovalScopeForFingerprint |
| principalClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | allowlisted | validateApprovalScopeForFingerprint |
| privilegeEnvelope | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | no secrets | validateApprovalScopeForFingerprint |
| redactedPrincipalIdentifier | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST_WITH_SENTINEL | NOT_APPLICABLE_IF_DISABLED | non-secret | validateApprovalScopeForFingerprint |
| remoteSystemAuthorizationMatrix | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | complete | validateApprovalScopeForFingerprint |
| operationClassMatrix | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | complete | validateApprovalScopeForFingerprint |
| numericLimits | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | finite positive | validateApprovalScopeForFingerprint |
| conditionalScopes | MAP | REQUIRED | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | markers | disabled rules | validateConditionalSystemFields |
| canonicalCourseScope | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | canonical path | validateApprovalScopeForFingerprint |
| tenantId | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | NOT_APPLICABLE_IF_DISABLED | tenant scope only | validateApprovalScopeForFingerprint |
| scopeFingerprint | STRING | DERIVED | SERVER_AUTHORITY | DERIVED_IMMUTABLE | EXCLUDED_DERIVED_VALUE | MUST_EXIST after review | none | SHA-256 | validateApprovalScopeForFingerprint |
| scopeCanonicalizationVersion | INTEGER | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | 1 | validateApprovalScopeForFingerprint |
| scopeFingerprintAlgorithm | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | none | SHA-256 | validateApprovalScopeForFingerprint |
| reviewStatus | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | PASS | validateApprovalFinalization |
| reviewerClass | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | allowlisted | validateApprovalFinalization |
| reviewReference | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | bounded non-secret | validateApprovalFinalization |
| reviewedAt | TIMESTAMP | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | reviewer time | validateApprovalFinalization |
| reviewedScopeFingerprint | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | equals recomputed | validateApprovalFinalization |
| approvalDecision | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | APPROVED | validateApprovalFinalization |
| approverClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | allowlisted | validateApprovalFinalization |
| approvalEvidenceReference | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | none | bounded non-secret | validateApprovalFinalization |
| consumed | BOOLEAN | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST | none | claim invariant | validateAtomicClaimPreconditions |
| consumedAt | TIMESTAMP | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST_WITH_SENTINEL | NOT_SET | server timestamp after claim | validateAtomicClaimPreconditions |
| consumedBySessionId | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST_WITH_SENTINEL | NOT_ASSIGNED | valid session after claim | validateAtomicClaimPreconditions |

`APPROVAL_RECORD_FIELD_TABLE = COMPLETE`
`APPROVAL_GROUPED_NORMATIVE_ROW_COUNT = 0`
`APPROVAL_FIELD_COVERAGE_DRIFT = 0`

### Timestamp authority audit

| FIELD_PATH | AUTHORITY | PRESENCE | SET_AT | VALIDATION | CLOCK_TRUST |
|---|---|---|---|---|---|
| approval.createdAt | SERVER_OWNED | REQUIRED | creation | server timestamp | server |
| approval.updatedAt | SERVER_OWNED | REQUIRED | mutation | server timestamp | server |
| approval.issuedAt | HUMAN_APPROVED_VALUE | REQUIRED | approval issuance | UTC | human-approved |
| approval.reviewedAt | INDEPENDENT_REVIEW_EVIDENCE | REQUIRED | review | UTC | reviewer evidence |
| approval.approvedAt | SERVER_OWNED | DERIVED | finalization | UTC | server |
| approval.expiresAt | HUMAN_APPROVED_VALUE | REQUIRED | approval scope | issued < expiry | human-approved |
| approval.consumedAt | SERVER_OWNED | CONDITIONAL | atomic claim | server timestamp | server |
| session.createdAt | SERVER_OWNED | REQUIRED | atomic claim | server timestamp | server |
| session.updatedAt | SERVER_OWNED | REQUIRED | mutation | server timestamp | server |
| session.identityBootstrapExecutedAt | SERVER_OWNED | CONDITIONAL | bootstrap evidence | iff executed | server |
| session.sessionTerminatedAt | SERVER_OWNED | CONDITIONAL | terminal transition | iff terminal | server |
| session.actualLogWindowStart | SERVER_OWNED | CONDITIONAL | log read | UTC subset | server |
| session.actualLogWindowEnd | SERVER_OWNED | CONDITIONAL | log read | UTC subset | server |

### Null, missing and sentinel audit

| FIELD_PATH | NULL_POLICY | MISSING_POLICY | SENTINEL_POLICY | VALID_STATES | INVALID_STATES | VALIDATOR |
|---|---|---|---|---|---|---|
| hostingTarget | never null | absent only when disabled | NOT_APPLICABLE_IF_DISABLED | enabled string/disabled marker | null/empty | validateConditionalSystemFields |
| functionsProject | never null | absent only when disabled | NOT_APPLICABLE_IF_DISABLED | enabled string/disabled marker | null/empty | validateConditionalSystemFields |
| functionsRegions | never null | absent only when disabled | NOT_APPLICABLE_IF_DISABLED | bounded array/disabled marker | unbounded/null | validateConditionalSystemFields |
| gcpAuthorizedSystems | never null | absent only when disabled | NOT_APPLICABLE_IF_DISABLED | finite array/disabled marker | unbounded/null | validateConditionalSystemFields |
| redactedPrincipalIdentifier | never null | absent until supplied | NOT_SET_ALLOWED | bounded string/NOT_SET | secret/empty | validateApprovalRecord |
| tenantId | never null | absent when environment-wide | NOT_APPLICABLE | scoped string/not applicable | null as scope | validateApprovalScopeForFingerprint |
| approvedAt | never null | absent before approval | NOT_SET_ALLOWED | timestamp after approval | pre-approval timestamp | validateApprovalFinalization |
| reviewStatus | never null | must exist before approval | NO_SENTINEL_ALLOWED | PASS before approval | missing/unknown | validateApprovalFinalization |
| reviewerClass | never null | must exist before approval | NO_SENTINEL_ALLOWED | allowlisted class | missing/unknown | validateApprovalFinalization |
| reviewReference | never null | must exist before approval | NO_SENTINEL_ALLOWED | bounded reference | secret/raw transcript | validateApprovalFinalization |
| reviewedAt | never null | must exist before approval | NO_SENTINEL_ALLOWED | review timestamp | missing/client clock | validateApprovalFinalization |
| reviewedScopeFingerprint | never null | must exist before approval | NO_SENTINEL_ALLOWED | equals scope fingerprint | mismatch | validateApprovalFinalization |
| approvalDecision | never null | must exist before approval | NO_SENTINEL_ALLOWED | APPROVED | other final value | validateApprovalFinalization |
| approverClass | never null | must exist before approval | NO_SENTINEL_ALLOWED | allowlisted class | missing/unknown | validateApprovalFinalization |
| approvalEvidenceReference | never null | must exist before approval | NO_SENTINEL_ALLOWED | bounded reference | secret/raw transcript | validateApprovalFinalization |
| consumedAt | never null | absent before claim | NOT_SET_ALLOWED | NOT_SET or server timestamp | client timestamp | validateAtomicClaimPreconditions |
| consumedBySessionId | never null | absent before claim | NOT_ASSIGNED_ALLOWED | NOT_ASSIGNED or valid session | arbitrary value | validateAtomicClaimPreconditions |

`TIMESTAMP_AUTHORITY_DRIFT = 0`
`NULL_MISSING_MARKER_DRIFT = 0`
`VALIDATOR_FIELD_COVERAGE_DRIFT = 0`

## Exact field-by-field materialization

The following tables are the sole normative field authority for this
unpublished resolution. Every persisted field has an individual row.

### Approval fields

| FIELD_PATH | TYPE | PRESENCE | AUTHORITY | MUTABILITY | FINGERPRINT | NULL/MISSING | VALIDATION |
|---|---|---|---|---|---|---|---|
| schemaVersion | INTEGER | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | 1 |
| recordRevision | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | finite >=0 |
| approvalId | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | unique ID |
| parentIdentifier | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | published parent |
| purpose | STRING | REQUIRED | DRAFT_CREATOR | MUTABLE_BEFORE_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | bounded |
| approvalState | STRING | REQUIRED | SERVER_AUTHORITY | MUTABLE_BEFORE_APPROVAL | EXCLUDED_DERIVED_VALUE | MUST_EXIST | published enum |
| singleUse | BOOLEAN | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | true |
| createdAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | server time |
| updatedAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | server time |
| issuedAt | TIMESTAMP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | UTC |
| expiresAt | TIMESTAMP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | issued < expiry |
| approvedAt | TIMESTAMP | DERIVED | SERVER_AUTHORITY | DERIVED_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST after approval | finalization time |
| firebaseProjectId | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | exact ID |
| environmentClassification | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | allowed enum |
| firestoreDatabaseId | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | exact ID |
| hostingTarget | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | Hosting enabled |
| functionsProject | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | Functions enabled |
| functionsRegions | BOUNDED_ARRAY | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | bounded regions |
| gcpAuthorizedSystems | BOUNDED_ARRAY | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | finite allowlist |
| accessClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | allowlisted |
| principalClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | allowlisted |
| privilegeEnvelope | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | no secrets |
| redactedPrincipalIdentifier | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | non-secret |
| remoteSystemAuthorizationMatrix | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | complete |
| operationClassMatrix | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | complete |
| numericLimits | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | positive integers |
| conditionalScopes | MAP | REQUIRED | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | marker rules |
| canonicalCourseScope | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | canonical path |
| tenantId | STRING | CONDITIONAL | HUMAN_APPROVER | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | tenant-scoped only |
| scopeFingerprint | STRING | DERIVED | SERVER_AUTHORITY | DERIVED_IMMUTABLE | EXCLUDED_DERIVED_VALUE | MUST_EXIST after review | SHA-256 |
| scopeCanonicalizationVersion | INTEGER | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | 1 |
| scopeFingerprintAlgorithm | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | SHA-256 |
| reviewStatus | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | PASS |
| reviewerClass | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | allowlisted |
| reviewReference | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | bounded non-secret |
| reviewedAt | TIMESTAMP | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | reviewer time |
| reviewedScopeFingerprint | STRING | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | equals recomputed |
| approvalDecision | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | APPROVED |
| approverClass | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | allowlisted |
| approvalEvidenceReference | STRING | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST | bounded non-secret |
| consumed | BOOLEAN | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST | invariant |
| consumedAt | TIMESTAMP | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST_WITH_SENTINEL | NOT_SET before claim |
| consumedBySessionId | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST_WITH_SENTINEL | NOT_ASSIGNED before claim |

### Session fields

| FIELD_PATH | TYPE | PRESENCE | AUTHORITY | MUTABILITY | NULL/MISSING | BUDGET/VALIDATION |
|---|---|---|---|---|---|---|
| schemaVersion | INTEGER | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | exactly 1 |
| recordRevision | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | finite >=0 |
| sessionId | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | unique ID |
| approvalId | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | linked approval |
| parentIdentifier | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | equals approval |
| approvalScopeFingerprint | STRING | REQUIRED | DERIVED_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | equals approval |
| sessionLifecycleState | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | lifecycle enum |
| sessionTerminationStatus | STRING | REQUIRED | SERVER_AUTHORITY | TERMINAL_ONLY | MUST_EXIST | lifecycle pair |
| sessionTerminatedAt | TIMESTAMP | CONDITIONAL | SERVER_AUTHORITY | TERMINAL_ONLY | NOT_SET | terminal timestamp |
| commandPlanId | STRING | REQUIRED | SERVER_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | bounded ID |
| commandPlanFingerprint | STRING | REQUIRED | SERVER_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | fingerprint |
| preBootstrapChecklistStatus | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | allowlisted |
| bootstrapCommandAuditStatus | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | allowlisted |
| identityBootstrapExecuted | BOOLEAN | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | boolean |
| identityBootstrapExecutedAt | TIMESTAMP | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_SET | iff executed |
| observedRemoteIdentityStatus | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | allowlisted |
| observedFirebaseProjectId | STRING | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_SET | identity evidence |
| observedEnvironment | STRING | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_SET | identity evidence |
| observedFirestoreDatabaseId | STRING | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_SET | identity evidence |
| projectIdentityMatch | BOOLEAN | REQUIRED | DERIVED_AUTHORITY | DERIVED | MUST_EXIST | equality |
| environmentMatch | BOOLEAN | REQUIRED | DERIVED_AUTHORITY | DERIVED | MUST_EXIST | equality |
| databaseMatch | BOOLEAN | REQUIRED | DERIVED_AUTHORITY | DERIVED | MUST_EXIST | equality |
| operationalInventoryEntered | BOOLEAN | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | gate |
| actualTotalCourseDocuments | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | >=0; maxExpectedTotalCourseDocuments |
| actualCourseDocumentsRead | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | >=0; maxCourseDocumentsToRead |
| actualFirestoreDocumentReads | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | >=0; maxFirestoreDocumentReads |
| actualTenantsEnumerated | INTEGER | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | >=0; maxTenantsToEnumerate |
| actualFunctionsInspected | INTEGER | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | >=0; maxFunctionsToInspect |
| actualHostingRecordsInspected | INTEGER | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | >=0; maxHostingRecordsToInspect |
| actualExternalServicesInspected | INTEGER | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | >=0; maxExternalServicesToInspect |
| actualDeploymentHistoryRecords | INTEGER | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | >=0; maxDeploymentHistoryRecords |
| actualLogEntriesRead | INTEGER | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | >=0; maxLogEntriesToRead |
| actualLogWindowStart | TIMESTAMP | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | UTC subset |
| actualLogWindowEnd | TIMESTAMP | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | UTC subset |
| writerReachabilityStatus | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | allowlisted |
| deployedCourseState | STRING | REQUIRED | DERIVED_AUTHORITY | DERIVED | MUST_EXIST | published enum |
| courseStateSummary | MAP | REQUIRED | DERIVED_AUTHORITY | DERIVED | MUST_EXIST | fixed child schema |
| writerReachabilitySummary | BOUNDED_ARRAY | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | bounded writer budget |
| rulesComparisonStatus | STRING | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | allowed status |
| deployedRulesFingerprint | STRING | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | bounded |
| repositoryRulesFingerprint | STRING | CONDITIONAL | DERIVED_AUTHORITY | DERIVED | NOT_APPLICABLE | bounded |
| hostingEvidence | MAP | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | bounded |
| functionsEvidence | MAP | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | bounded |
| externalServiceEvidence | BOUNDED_ARRAY | CONDITIONAL | SERVER_AUTHORITY | SERVER_MUTABLE | NOT_APPLICABLE | finite allowlist |
| stopCode | STRING | CONDITIONAL | SERVER_AUTHORITY | TERMINAL_ONLY | NOT_SET | allowlisted |
| stopReason | STRING | CONDITIONAL | SERVER_AUTHORITY | TERMINAL_ONLY | NOT_SET | bounded |
| evidencePackageStatus | STRING | REQUIRED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | lifecycle mapping |
| createdAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | IMMUTABLE_AFTER_CREATE | MUST_EXIST | server time |
| updatedAt | TIMESTAMP | SERVER_OWNED | SERVER_AUTHORITY | SERVER_MUTABLE | MUST_EXIST | server time |

### Cross-record, evidence and query invariants

`session.approvalId`, `session.parentIdentifier` and
`session.approvalScopeFingerprint` must equal the linked approval values;
consumed approval ownership must equal `session.sessionId`. Course summary
children are individually typed counters/state with exact reconciliation.
Writer, Rules, Hosting, Functions and external child fields are individually
typed and bounded by approved budgets/allowlists. Query classes are: approval
ID and session ID direct lookup/no custom index; sessions by approval required
for audit/single-field index; state/expiry/lifecycle/termination listings
conditional and unauthorized. No index is created.

`APPROVAL_RECORD_FIELD_TABLE = COMPLETE`
`SESSION_RECORD_FIELD_TABLE = COMPLETE`
`APPROVAL_FIELD_MUTABILITY_MATRIX = COMPLETE`
`SESSION_FIELD_MUTABILITY_MATRIX = COMPLETE`
`PARENT_IDENTIFIER_LINKAGE_VALIDATION = COMPLETE`
`GOVERNANCE_STORE_SCHEMA_COMPLETE = true`

## Field-level schema materialization repair

This section is authoritative for the same unpublished resolution and closes
the verifier-level gaps without creating a new descendant.

### NON_NORMATIVE_SUMMARY — superseded approval field table

The following legacy grouped table is explanatory only. `S` means
server-owned, `D` derived, `H` human authority and `C` conditional.

| FIELD | TYPE | PRESENCE | AUTHORITY | MUTABILITY | FINGERPRINT | NULL/MISSING | VALIDATION |
|---|---|---|---|---|---|---|---|
| schemaVersion | INTEGER | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | exactly 1 |
| recordRevision | INTEGER | REQUIRED | S | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | finite >=0 |
| approvalId | STRING | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | unique non-secret ID |
| parentIdentifier | STRING | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | published lineage |
| purpose | STRING | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | bounded non-empty |
| approvalState | STRING | REQUIRED | S/H | MUTABLE_BEFORE_APPROVAL | EXCLUDED_DERIVED_VALUE | MUST_EXIST | published enum |
| singleUse | BOOLEAN | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | true only |
| createdAt/updatedAt | TIMESTAMP | SERVER_OWNED | S | SERVER_MUTABLE_ONLY | EXCLUDED_DERIVED_VALUE | MUST_EXIST | server time |
| issuedAt/expiresAt | TIMESTAMP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | UTC; issued < expiry |
| approvedAt | TIMESTAMP | DERIVED | S | SERVER_MUTABLE_ONLY | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST after approval | finalization time |
| targetIdentity | MAP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | exact sub-schema |
| accessClass/principalClass | STRING | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | allowlisted |
| privilegeEnvelope | MAP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | no secrets |
| remoteSystemAuthorizationMatrix | MAP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | complete matrix |
| operationClassMatrix | MAP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | complete matrix |
| numericLimits | MAP | REQUIRED | H | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | finite positive limits |
| conditionalScopes | MAP | REQUIRED | H | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | disabled markers |
| canonicalCourseScope | STRING | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | canonical path |
| tenantId | STRING | CONDITIONAL | H | CONDITIONAL_IMMUTABLE | INCLUDED_IN_IMMUTABLE_SCOPE | NOT_APPLICABLE | only tenant-scoped |
| scopeFingerprint | STRING | DERIVED | S | DERIVED_IMMUTABLE | EXCLUDED_DERIVED_VALUE | MUST_EXIST after review | SHA-256 |
| scopeCanonicalizationVersion | INTEGER | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | 1 |
| scopeFingerprintAlgorithm | STRING | REQUIRED | D | IMMUTABLE_AFTER_APPROVAL | INCLUDED_IN_IMMUTABLE_SCOPE | MUST_EXIST | SHA-256 |
| reviewStatus/reviewerClass/reviewReference/reviewedAt/reviewedScopeFingerprint | MAP | REQUIRED | INDEPENDENT_REVIEWER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST before approval | PASS + fingerprint equality |
| approvalDecision/approverClass/approvalEvidenceReference | MAP | REQUIRED | HUMAN_APPROVER | IMMUTABLE_AFTER_APPROVAL | EXCLUDED_AUDIT_EVIDENCE | MUST_EXIST before approval | APPROVED + bounded reference |
| consumed | BOOLEAN | REQUIRED | S | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | MUST_EXIST | consumption invariant |
| consumedAt/consumedBySessionId | TIMESTAMP/STRING | REQUIRED | S | SERVER_MUTABLE_ONLY | EXCLUDED_MUTABLE_STATE | sentinel before claim | atomic claim |

The grouped rows above are logical field families whose individual member
names and rules are normative; no additional persisted approval fields exist.

### Session field table and mutability

All session fields are typed, exact and bounded: `schemaVersion` and
`recordRevision` are INTEGER/SERVER_MUTABLE; identity and linkage fields
(`sessionId`, `approvalId`, `parentIdentifier`, `approvalScopeFingerprint`,
`commandPlanId`, `commandPlanFingerprint`) are STRING and
`IMMUTABLE_AFTER_CREATE`; lifecycle/termination fields are STRING/TIMESTAMP,
`SERVER_MUTABLE`/`TERMINAL_ONLY`; booleans such as
`identityBootstrapExecuted` and `operationalInventoryEntered` are
`SERVER_MUTABLE`; all actual counters are INTEGER/SERVER_MUTABLE and paired to
their approved budgets; observed identities and summaries are bounded STRING or
MAP; conditional Rules/Hosting/Functions/external evidence is CONDITIONAL; stop
code/reason and package status are SERVER_MUTABLE; `createdAt`/`updatedAt` are
server timestamps. No generic evidence map may hide a required field.

`SESSION.parentIdentifier == APPROVAL.parentIdentifier`,
`SESSION.approvalId` resolves to that approval, and the session fingerprint
must equal the approval fingerprint at claim.

### Timestamp, marker and type rules

`createdAt`, `updatedAt`, `approvedAt`, `consumedAt`, session creation/update,
identity-bootstrap and termination timestamps are `SERVER_OWNED`; `issuedAt`
and `expiresAt` are `HUMAN_APPROVED_VALUE`; `reviewedAt` is
`INDEPENDENT_REVIEW_EVIDENCE`; observed windows are server-owned. Exact markers
are `NOT_SET`, `NOT_ASSIGNED` and `NOT_APPLICABLE_IF_DISABLED`; required fields
cannot be null. Every field uses exactly one of STRING, BOOLEAN, INTEGER,
TIMESTAMP, MAP or BOUNDED_ARRAY.

### Evidence schemas and bounds

Course summaries persist five non-negative counters plus one allowed state and
must reconcile exactly. Writer entries contain category, reachability,
evidence, cutover decision and bounded unknown reason. Rules evidence contains
status and optional bounded fingerprints. Hosting, Functions and external
evidence use their exact bounded execution/count/identity/capability fields;
unbounded arrays are prohibited. Every repeated structure is bounded by its
approved limit or finite allowlist; overflow yields `STOPPED_INCOMPLETE` or
`REQUIRES_FUTURE_BOUNDED_ARTIFACT_MODEL`.

### Queries and indexes

| QUERY | CLASSIFICATION | LOOKUP | INDEX |
|---|---|---|---|
| approval by ID | REQUIRED | DIRECT_DOCUMENT_LOOKUP | SINGLE_DOCUMENT_LOOKUP_NO_CUSTOM_INDEX |
| session by ID | REQUIRED | DIRECT_DOCUMENT_LOOKUP | SINGLE_DOCUMENT_LOOKUP_NO_CUSTOM_INDEX |
| sessions by approval | REQUIRED_FOR_AUDIT | QUERY | SINGLE_FIELD_INDEX_SUFFICIENT |
| approvals by state/expiry | CONDITIONAL | QUERY | QUERY_NOT_AUTHORIZED_YET |
| sessions by lifecycle/termination | CONDITIONAL | QUERY | QUERY_NOT_AUTHORIZED_YET |

### Validators and closure

Future pure validators map exactly to approval/session shape, fingerprint
scope, finalization, claim preconditions, transitions, termination, budget
pairing, conditional fields, Course/writer summaries and serialization.
Session executors cannot mutate review or human approval evidence. Retention
tags remain excluded pending policy; normal hard delete is prohibited.

`PARENT_IDENTIFIER_LINKAGE_VALIDATION = COMPLETE`
`TIMESTAMP_AUTHORITY_TABLE = COMPLETE`
`QUERY_ACCESS_PATTERN_INVENTORY = COMPLETE`
`INDEX_REQUIREMENT_ANALYSIS = COMPLETE`
`GOVERNANCE_STORE_SCHEMA_COMPLETE = true`

Provisioning, implementation, IAM, Rules, approval instance creation, Course
runtime, migration, F-R2, Enrollment, SaaS-03B-R and Phase 04 remain
unauthorized/not started.

## Normative completeness repair

This section supersedes any earlier placeholder or deferred wording in this
document. It is the same unpublished resolution; no new genealogy child is
created.

### Fixed fingerprint contract

`APPROVAL_SCOPE_CANONICALIZATION_VERSION = 1`

`APPROVAL_SCOPE_FINGERPRINT_ALGORITHM = SHA-256`

Canonical bytes are UTF-8 JSON with fixed top-level order, lexicographically
ordered map keys, declared array order, JSON booleans, canonical base-10
integers, deterministic JSON string escaping, UTC RFC3339 timestamps at
millisecond precision, no insignificant whitespace, locale dependence or SDK
objects. Missing and null remain distinct; disabled fields retain their exact
published markers. No secrets or session evidence are included.

Fingerprint input set:

| Field group | Fingerprint treatment |
|---|---|
| approvalId, parentIdentifier, schemaVersion, purpose | INCLUDED_IN_IMMUTABLE_SCOPE |
| singleUse, issuedAt, expiresAt, approvedAt | INCLUDED_IN_IMMUTABLE_SCOPE |
| target identity, access/principal/privilege scope | INCLUDED_IN_IMMUTABLE_SCOPE |
| system/operation matrices, numeric/conditional scopes | INCLUDED_IN_IMMUTABLE_SCOPE |
| canonicalCourseScope | INCLUDED_IN_IMMUTABLE_SCOPE |
| human/review evidence | EXCLUDED_AUDIT_EVIDENCE |
| createdAt, updatedAt | EXCLUDED_DERIVED_VALUE |
| consumed, consumedAt, consumedBySessionId | EXCLUDED_MUTABLE_STATE |
| all session fields | EXCLUDED_MUTABLE_STATE |

### Schema versions and CAS

`APPROVAL_RECORD_SCHEMA_VERSION = 1` and
`SESSION_EVIDENCE_SCHEMA_VERSION = 1`. Higher versions reject with
`REJECT_UNSUPPORTED_SCHEMA_VERSION`.

Both records require `recordRevision` as a finite non-negative integer.
Draft updates, finalization and session updates use a transaction reread with
expected revision; successful writes increment exactly once. No Course version
semantics are imported.

### Approval record field authority

Every approval field is one of: required, conditional, derived or
server-owned. `approvalId`, `parentIdentifier`, schema version, purpose,
approved target identity, access scope, matrices, limits, canonical scope,
single-use, issuance/expiry and fingerprint are mutable before approval and
immutable after approval. `createdAt`, `updatedAt`, `approvedAt`, `consumedAt`
and consumption linkage are server-owned. Review and human approval evidence
are writeable only by their respective authority classes. Unknown fields reject.

### Session record field authority

`sessionId`, `approvalId`, fingerprint, parent identifier and command-plan
bindings are immutable after creation. Lifecycle, termination, observations,
counters and bounded evidence are server-mutable; terminal fields are
terminal-only; conditional system evidence is conditional; derived summaries
are derived. Session executors cannot mutate approval, review or human approval
fields.

### Lifecycle and termination

`PRE_EXECUTION` is not an authoritative persisted session. The authoritative
record begins at `ACTIVE_CONSUMED_SESSION`. Valid pairs are:

| Lifecycle | terminationStatus | terminatedAt |
|---|---|---|
| ACTIVE_CONSUMED_SESSION | NOT_TERMINATED | NOT_SET |
| TERMINATED_SUCCESS | SUCCESS | required server timestamp |
| TERMINATED_STOP | STOP | required server timestamp |
| TERMINATED_FAILURE | FAILURE | required server timestamp |

No terminal re-entry, ownership switch or terminal-to-active transition is
valid.

### Expiry and timestamps

Claim is allowed iff `authoritativeClaimTime < expiresAt`; equality is expired
and rejected. `createdAt`, `consumedAt`, session creation/update/termination
times and `approvedAt` are server-owned. `issuedAt` and `expiresAt` are human
approved values; `reviewedAt` is reviewer evidence time. Expiry is derived at
claim/read time and does not require background mutation.

### Finalization and claim

Finalization transaction requires READY_FOR_REVIEW, completeness PASS,
independent review PASS, explicit human approval, expected recordRevision,
valid expiry and equality between reviewed, approved and recomputed
fingerprints. It atomically sets APPROVED, approvedAt and freezes scope.

Claim recomputes persisted scope and requires equality with persisted and
expected fingerprints, supported version/algorithm, approved/unexpired,
single-use/unconsumed state, no owner and a non-colliding session ID. It then
atomically consumes the approval and creates ACTIVE_CONSUMED_SESSION.

### Limits and evidence

All approved limits are finite integers greater than zero. Session counters are
finite integers greater than or equal to zero, absolute and monotonic. Each
actual counter is paired with its approved limit and must not exceed it; an
unknown delta or exceedance stops the session. Log windows require UTC
`approvedStart < approvedEnd`, with actual windows contained within them.

Course summary counters reconcile exactly to total documents. Writer,
Rules, Hosting, Functions and external evidence use bounded allowlisted
summaries only. Unbounded arrays, raw Course data, Rules text, source bundles,
credentials and secrets are prohibited.

### Markers, validation and retention

`NOT_APPLICABLE_IF_DISABLED`, `NOT_SET` and `NOT_ASSIGNED` are exact markers;
required fields cannot be null; missing and null are distinct. Tenant ID is
conditional only for explicitly tenant-scoped inventory and is never a key.
Pure validators must cover approval/session shape, fingerprint scope,
finalization, claim preconditions, transitions, termination, budgets,
conditional fields, summaries and serialization.

`RETENTION_TAG_FIELDS = NOT_INCLUDED_UNTIL_RETENTION_POLICY_RESOLUTION`.
Normal hard delete is prohibited; retention-driven deletion requires a later
policy.

### Query and index classification

Direct approval/session ID lookups require no custom index. Sessions by
approval ID are required for audit and use a single-field index. State/expiry
and lifecycle listings are conditional and remain `QUERY_NOT_AUTHORIZED_YET`.
No index is implemented in this phase.

`GOVERNANCE_STORE_SCHEMA_COMPLETE = true`
