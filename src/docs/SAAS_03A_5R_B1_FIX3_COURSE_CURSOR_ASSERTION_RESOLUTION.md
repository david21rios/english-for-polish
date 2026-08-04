# SaaS-03A.5R-B1-FIX3 - Course cursor assertion resolution

## Purpose and runtime evidence

FIX3 resolves the sole remaining Course runtime failure after FIX2. The new
manual workflow executed 114 Course Test IDs plus one metadata self-control:
113 Course IDs passed, `RT-CRS-REP-063` failed, and metadata self-control
passed. The workflow remained failed; no corrected runtime PASS is claimed.

The captured `RepositoryError` originated in `validatePosition()` through
`decodeCourseCursor()` and `executeList()`:

```text
message = Course cursor position is outside its Tenant binding.
operation = decode_course_cursor
resource = course_cursor
```

The runtime assertion already required `CONTRACT_VIOLATION`; it returned false
because `validatePosition()` constructed `INVALID_ARGUMENT`.

## Contract, cause and correction

Course R1 distinguishes malformed encoding, schema, values, path shape and
timestamps (`INVALID_ARGUMENT`) from a structurally valid cursor incompatible
with its query binding (`CONTRACT_VIOLATION`). The failing token retained a
canonical Course path but its path Tenant differed from the cursor binding.
That is binding incompatibility, not malformed syntax.

This was a one-branch product taxonomic defect in `courseCursor.js`, not a
fixture or assertion defect. The branch now uses the existing
`incompatible()` constructor. API, cursor version 1, policy
`course_standard_v1`, encoding, queries, Rules and indexes remain unchanged.

A dedicated unit test mutates only `position.documentPath` to another canonical
Tenant and verifies code `CONTRACT_VIOLATION`, operation
`decode_course_cursor`, resource `course_cursor` and the captured message.
Malformed path shapes remain independently classified as `INVALID_ARGUMENT`.

## Counts, validation and external evidence

```text
TOTAL = 114
ALLOW = 32
DENY = 82
SUCCESS = 32
RULES_DENY = 56
CONTRACT_ERROR = 26
NOT_FOUND = 0
```

Static validation covers unit tests, syntax, lint, all three repository
prechecks, Rules preflight, general tests, build and diff checks. A fresh
workflow must still establish Rules 222/222, RegistrationRequest 52/52,
Membership 81/81 and Course 114/114 with global SUCCESS.

## Rollback, risks and state

Rollback restores the former `invalid()` call, removes the dedicated unit test
and reverts these FIX3 documentation updates. Rules, indexes, queries and
runtime metadata are outside rollback. The residual risk is pending external
runtime confirmation; Course indexes remain undeployed.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-B1 = completed_with_runtime_failure
SaaS-03A.5R-B1-FIX1 = incomplete_superseded_by_FIX2
SaaS-03A.5R-B1-FIX2 = completed_with_single_runtime_assertion_failure
SaaS-03A.5R-B1-FIX3 = completed_pending_external_runtime
SaaS-03A.5R-B2 = blocked_pending_corrected_runtime_evidence
```

Next is human push followed by a new manual workflow on `main`. B2 is not
started. No Firebase remote access, deploy or index deployment occurs here.

## External confirmation and FIX4 handoff

The post-FIX3 workflow confirms `RT-CRS-REP-063` now passes. Course again
reached 113/114 IDs; the sole new failure was `RT-CRS-REP-120`, whose supposed
malformed-path fixture was actually another canonical cross-Tenant path. FIX3
is therefore completed. FIX4 isolates case 120 as a noncanonical five-segment
path without changing the production cursor classification.
