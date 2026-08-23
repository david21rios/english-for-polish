# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course remote operational inventory authorization resolution

## Status and boundary

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Mode: design/documentation only.
- `REMOTE_OPERATIONAL_INVENTORY_DESIGN = COMPLETE`.
- `REMOTE_OPERATIONAL_INVENTORY_EXECUTION = NOT_AUTHORIZED`.
- `HUMAN_REMOTE_ACCESS_APPROVAL = REQUIRED` immediately before any future remote session.

The published blockers remain environment identity unverified, deployed writer
reachability unknown, deployed Course state unknown, and operational prevention
clearance pending. No Firebase, Hosting, Functions, Firestore, Rules, logs,
credentials, migration, backup, runtime, deployment, or stage operation is
authorized by this resolution.

## Future read-only authorization contract

Before access, a human approval must name the Firebase project, environment,
Firestore database, approved credential/access class, permitted systems, exact
read-only scope, and read-volume limits. Least privilege is mandatory; secrets,
tokens, keys, exports, IAM changes and API enablement are prohibited.

Every command is classified before execution as `READ_ONLY_SAFE`,
`READ_ONLY_BUT_SENSITIVE`, `MUTATING_PROHIBITED`, or
`UNKNOWN_REQUIRES_REVIEW`. Local side effects (aliases, config, caches,
artifacts, emulator state and credential files) must also be checked.

The evidence package may include environment identity, Hosting releases and
reachability, deployed Functions and source identity, external writers,
deployed Rules comparison, Course counts and classifications, prevention inputs
and unresolved unknowns. The canonical path is
`tenants/{tenantId}/courses/{courseId}` with counts for total, valid versioned,
versionless, invalid-version and malformed documents. Raw Course content,
claims, emails, credentials and secrets are excluded.

Hosting, Functions, Cloud Run, Scheduler, CI/CD, scripts and integrations are
classified as current, stale, historical/unreachable, non-CAS, CAS, absent or
unknown. Unknown writer reachability remains fail-closed. Deployed Rules are
compared read-only to repository Rules; material drift affecting Course writes
stops operational clearance.

The future session stops on wrong or ambiguous project/environment/database,
unapproved or overly broad credentials, uncertain command side effects, local
mutation risk, unexpected writers, exceeded read scope, unexpected population,
material Rules drift, unverified source identity, secret exposure, or any
mutation/deploy/API-enable request.

## Ordering and preserved boundaries

The conceptual order is authorization design → independent review → controlled
publication → explicit human approval → command safety audit → read-only
inventory → evidence review → prevention/cutover → proof → backup/export gate →
migration gate → zero-versionless proof → Course runtime authorization.

`MIGRATION = NOT_AUTHORIZED`; CreateCourse, UpdateCourse, ActivateCourse and
ArchiveCourse runtime remain not authorized. F-R2 and Enrollment remain not
started; SaaS-03B-R and Phase 04 remain not started. This document creates no
descendant identifier and authorizes no execution.

Publication state: `PENDING_INDEPENDENT_REVIEW`.

## Quantitative read-scope contract repair

Before any remote access, the explicit human approval must provide concrete
positive-integer limits for every authorized category:

```text
MAX_COURSE_DOCUMENTS_TO_READ
MAX_EXPECTED_TOTAL_COURSE_DOCUMENTS
MAX_TENANTS_TO_ENUMERATE
MAX_FIRESTORE_DOCUMENT_READS
MAX_HOSTING_RELEASES_OR_VERSIONS_TO_INSPECT
MAX_FUNCTIONS_TO_INSPECT
MAX_EXTERNAL_SERVICE_RECORDS_TO_INSPECT
MAX_DEPLOYMENT_HISTORY_RECORDS (when authorized)
MAX_LOG_ENTRIES_TO_READ (when authorized)
LOG_LOOKBACK_WINDOW (when logs are authorized)
```

Any category not approved for the session must be recorded as
`NOT_AUTHORIZED_FOR_THIS_SESSION`; zero is not a substitute. There are no
defaults, unlimited values, implicit expansion, or "as needed" scope.
Firestore document reads are subject to a global ceiling; category ceilings,
pagination and retries count toward the approved budget. Aggregate-first does
not authorize document expansion beyond those limits. Before each command,
execution must compare its expected scope delta with remaining budget and stop
if the result is uncertain or would exceed a limit.

Missing or invalid numeric limits, exhausted limits, pagination overruns,
unexpected population, or log-window/entry overruns are STOP conditions.
Partial evidence is not complete inventory and keeps writer reachability or
deployed Course state fail-closed. Any scope expansion requires new explicit
human approval. The evidence package records approved limits, actual counts,
limits reached and expansion requests.

`REMOTE_READ_SCOPE_NUMERIC_LIMITS_COMPLETE` is required before execution;
otherwise `REMOTE_OPERATIONAL_INVENTORY_EXECUTION = NOT_AUTHORIZED` remains in
force. This repair changes no genealogy or remote authorization boundary.

## Quantitative verifiability completion

The future evidence package must include deterministic fields:

```text
AUTHORIZED_NUMERIC_LIMITS
ACTUAL_FIRESTORE_DOCUMENT_READS
ACTUAL_COURSE_DOCUMENTS_READ
ACTUAL_TENANTS_ENUMERATED
ACTUAL_FUNCTIONS_INSPECTED
ACTUAL_HOSTING_RECORDS_INSPECTED
ACTUAL_EXTERNAL_SERVICE_RECORDS_INSPECTED
ACTUAL_DEPLOYMENT_HISTORY_RECORDS
ACTUAL_LOG_ENTRIES_READ
ACTUAL_LOG_WINDOW
LIMITS_REACHED
LIMITS_REACHED_BY_CATEGORY
SCOPE_EXPANSION_REQUESTED
SCOPE_EXPANSION_APPROVED
SESSION_STOP_REASON
REMOTE_READ_SCOPE_NUMERIC_LIMITS_COMPLETE
```

For `NOT_AUTHORIZED_FOR_THIS_SESSION`, the actual field is `NOT_EXECUTED`.
Otherwise actual counts are finite integers `>= 0` and satisfy
`ACTUAL <= AUTHORIZED`; authorized limits are finite integers `> 0`. Negative,
zero, fractional, blank, missing, NaN-like, infinite, implicit or ambiguous
string values are invalid. Time windows are bounded positive durations or
explicit start/end timestamps with `start < end` and explicit timezone/UTC.
Actual log/history windows must be contained within authorized windows.

The bounded quantitative STOP vocabulary is:

```text
NUMERIC_LIMIT_MISSING
NUMERIC_LIMIT_INVALID
AUTHORIZED_LIMIT_REACHED
NEXT_COMMAND_WOULD_EXCEED_LIMIT
PAGINATION_WOULD_EXCEED_LIMIT
TENANT_LIMIT_REACHED
COURSE_DOCUMENT_LIMIT_REACHED
FIRESTORE_READ_BUDGET_REACHED
FUNCTION_INVENTORY_LIMIT_REACHED
HOSTING_INVENTORY_LIMIT_REACHED
EXTERNAL_SERVICE_LIMIT_REACHED
DEPLOYMENT_HISTORY_LIMIT_REACHED
LOG_ENTRY_LIMIT_REACHED
LOG_WINDOW_LIMIT_REACHED
EXPECTED_SCOPE_DELTA_UNKNOWN
READ_SCOPE_EXCEEDED
```

Each code stops before the exceeding command. Before every command the runner
computes `EXPECTED_SCOPE_DELTA` and remaining budgets; unknown or excessive
deltas stop. Every page and retry increments actual counters, and a next-page
token never authorizes another page. Retries are conservatively charged and
cannot expand scope. Global Firestore reads are cross-checked against Course
reads, and all category counters are cross-checked against their paired limits.

Partial evidence is never complete: writer reachability remains `UNKNOWN`,
deployed Course state remains `DEPLOYED_STATE_UNKNOWN`, and prevention remains
pending. Scope expansion requires a new explicit human approval. The gate is
complete only when every authorized category has a valid finite limit or an
explicit not-authorized marker; otherwise
`REMOTE_READ_SCOPE_NUMERIC_LIMITS_COMPLETE = false` and execution remains
`NOT_AUTHORIZED`.

## Observed Course population evidence

The future aggregate/count phase must record
`ACTUAL_TOTAL_COURSE_DOCUMENTS`: the total observed canonical population at
`tenants/{tenantId}/courses/{courseId}` within the approved scope. It is
distinct from `ACTUAL_COURSE_DOCUMENTS_READ` (full document inspection) and
`ACTUAL_FIRESTORE_DOCUMENT_READS` (global read budget).

The verifier must check:

```text
ACTUAL_TOTAL_COURSE_DOCUMENTS <= MAX_EXPECTED_TOTAL_COURSE_DOCUMENTS
```

`UNEXPECTED_COURSE_POPULATION_SIZE` means the observed total exceeds that
threshold and stops before document-level expansion. The observed total is a
finite integer `>= 0`; zero is valid only after a complete, unambiguous
aggregate query. Missing or incomplete aggregate evidence is not zero and
leaves deployed Course state fail-closed.

The four Course quantities remain separate: expected population threshold,
observed aggregate population, maximum document-level inspection, and actual
document-level inspection. Complete diagnostic counts reconcile as:

```text
VALID_VERSIONED_COURSES + VERSIONLESS_COURSES +
INVALID_VERSION_COURSES + MALFORMED_COURSES = ACTUAL_TOTAL_COURSE_DOCUMENTS
```

The evidence package records `ACTUAL_TOTAL_COURSE_DOCUMENTS` and
`COURSE_POPULATION_THRESHOLD_CHECK` (`PASS`, `FAIL`, or `INCOMPLETE`). A failed
check uses the population stop; an incomplete check does not claim excess but
remains `DEPLOYED_STATE_UNKNOWN`. No automatic sampling or scope expansion is
permitted.
