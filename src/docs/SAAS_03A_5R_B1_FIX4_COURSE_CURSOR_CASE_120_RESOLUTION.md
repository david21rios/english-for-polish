# SaaS-03A.5R-B1-FIX4 - Course cursor case 120 resolution

## Runtime evidence and scope

The post-FIX3 workflow executed 115 Node tests: 114 passed and one failed. Of
the 114 Course IDs, 113 passed and only `RT-CRS-REP-120` failed; metadata
self-control passed. `RT-CRS-REP-063` passed, confirming FIX3's
`CONTRACT_VIOLATION` classification for a canonical cross-Tenant position.

The failing title was `[DENY] — malformed cursor schema or position is
rejected`. The captured `RepositoryError` was:

```text
code = CONTRACT_VIOLATION
operation = decode_course_cursor
resource = course_cursor
message = Course cursor position is outside its Tenant binding.
```

No corrected runtime PASS is claimed in FIX4.

## Exact cursor reconstruction

`RT-CRS-REP-120` obtains the first cursor from
`listActiveCoursesForTenant("tenant-a", {pageSize: 1})`. Its query kind is
`course_active_catalog`; binding Tenant is `tenant-a`; the first ordered Course
is `course-active-a1` (`displayName=Alpha`). The original position path is:

```text
tenants/tenant-a/courses/course-active-a1
```

The former mutation changed only `position.documentPath` to:

```text
tenants/tenant-b/courses/course-active-a1
```

That value is valid syntax, has four segments, preserves the canonical
`tenants/{tenantId}/courses/{courseId}` shape and a valid courseId, but belongs
to another Tenant relative to the binding. It therefore duplicated the
cross-Tenant incompatibility already covered by `RT-CRS-REP-063` and could not
legitimately expect `INVALID_ARGUMENT`.

## Contract classification and minimal correction

R1 and FIX3 classify undecodable Base64URL/UTF-8/JSON, incomplete or extra
schema, noncanonical path shape and invalid timestamp as `INVALID_ARGUMENT`.
Supported structure with incompatible version, query kind, binding, filters,
order, policy or a canonical position outside its binding Tenant is
`CONTRACT_VIOLATION`.

The defect was the runtime fixture mutation, not `courseCursor.js`. Case 120
continues to represent malformed position syntax and now mutates the path to:

```text
tenants/tenant-a/courses/nested/course-active-a1
```

This five-segment path is structurally noncanonical, reaches `pathParts()` and
returns `INVALID_ARGUMENT`, operation `decode_course_cursor`, resource
`course_cursor`, message `Course cursor path is not canonical.` Case 063 remains
the independent canonical cross-Tenant `CONTRACT_VIOLATION` guarantee.

Unit coverage independently proves: malformed five-segment path is
`INVALID_ARGUMENT`; canonical cross-Tenant path is `CONTRACT_VIOLATION`;
canonical same-Tenant path is valid; and changing only the canonical courseId
within the same Tenant remains structurally valid because cursor v1 contains no
separate courseId binding or signature.

## Counts, validation, risk and state

Runtime metadata is unchanged:

```text
TOTAL = 114
ALLOW = 32
DENY = 82
SUCCESS = 32
RULES_DENY = 56
CONTRACT_ERROR = 26
NOT_FOUND = 0
```

Static validation includes syntax, lint, Course unit tests, all repository
prechecks, Rules preflight, general tests, build and diff checks. Java remains
unavailable locally, so a fresh external workflow must establish Rules
222/222, RegistrationRequest 52/52, Membership 81/81 and Course 114/114.

Residual risk is the pending external runtime confirmation. Rules, indexes,
Course production code, queries, workflow and prechecks are unchanged.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-B1 = completed_with_runtime_failure
SaaS-03A.5R-B1-FIX2 = completed
SaaS-03A.5R-B1-FIX3 = completed
SaaS-03A.5R-B1-FIX4 = completed_pending_external_runtime
SaaS-03A.5R-B2 = blocked_pending_corrected_runtime_evidence
```

B2 and EnrollmentRepository are not started. The next action is human push and
a new manual workflow run on `main`, not a rerun of an earlier job.
