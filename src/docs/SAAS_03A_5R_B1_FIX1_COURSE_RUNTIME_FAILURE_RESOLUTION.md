# SaaS-03A.5R-B1-FIX1 - Course runtime failure diagnosis

## Evidence

The failed `Firestore Rules Runtime Validation` run on `main` at
`60fec8f1951ef5509b4e8cd7a375740d997a2813` reported 115 Node tests: 114
Course contract IDs plus one metadata self-control. The result was 68 passed,
47 failed and exit code 1. Rules, RegistrationRequest and Membership had passed.

Failed IDs:

```text
RT-CRS-REP-007 RT-CRS-REP-008 RT-CRS-REP-009
RT-CRS-REP-020 RT-CRS-REP-021 RT-CRS-REP-022 RT-CRS-REP-023 RT-CRS-REP-124
RT-CRS-REP-030 RT-CRS-REP-031 RT-CRS-REP-032 RT-CRS-REP-033 RT-CRS-REP-125
RT-CRS-REP-040 RT-CRS-REP-041 RT-CRS-REP-042 RT-CRS-REP-043 RT-CRS-REP-126
RT-CRS-REP-050 RT-CRS-REP-051 RT-CRS-REP-052 RT-CRS-REP-053 RT-CRS-REP-054 RT-CRS-REP-127
RT-CRS-REP-060 RT-CRS-REP-061 RT-CRS-REP-062
RT-CRS-REP-063 RT-CRS-REP-064 RT-CRS-REP-065 RT-CRS-REP-066
RT-CRS-REP-110 RT-CRS-REP-111 RT-CRS-REP-112 RT-CRS-REP-113 RT-CRS-REP-114
RT-CRS-REP-115 RT-CRS-REP-118 RT-CRS-REP-119 RT-CRS-REP-120 RT-CRS-REP-121
RT-CRS-REP-122 RT-CRS-REP-123 RT-CRS-REP-128 RT-CRS-REP-129 RT-CRS-REP-130
RT-CRS-REP-072
```

## Tenant-admin authorization

`uid-course-admin` authenticates against active `tenant-a`. Its canonical
membershipKey stores that uid, Tenant, `status=approved`, and points to
`membership-tenant-a-uid-course-admin`. The Membership repeats the same uid,
Tenant and ID and has `role=tenant_admin`, `status=approved`, with complete
lifecycle fields. No fixture, path, role, status, claim or identity defect exists.

Domain, Architecture Freeze, Rules design and R1 authorize this actor to read
draft, active and archived Courses. Implemented Rules express that intent in
`saasCanTenantAdminReadCourse`. However `saasCanReadCourseByRole` evaluates
student, teacher and tenant-admin branches independently; each re-enters the
multi-document `saasHasApprovedMembership` access graph. Student succeeds on
the first branch and teacher on the second, while tenant admin reaches the third
and the Emulator denies all three point gets. A safe Rules correction must
resolve approved Membership data once, branch on its canonical role, and add
canonical tenant-admin Course tests.

```text
COURSE_RUNTIME_AUTHORIZATION_CONTRACT_DIVERGENCE
FIRESTORE_RULES_CHANGE_REQUIRES_SEPARATE_HUMAN_AUTHORIZATION
```

## List query shapes

The repository sends:

- student: `status == active`, optional exact language equalities,
  `displayName ASC`, `documentId ASC`;
- teacher: `status in [draft, active]`, the same optional language equalities,
  `displayName ASC`, `documentId ASC`;
- tenant admin: exact status or `status in [draft, active, archived]`,
  `updatedAt DESC`, `documentId DESC`.

Each family adds optional `startAfter` and `limit(pageSize + 1)`. This matches
R1 and FI-CRS-001..005, but none adds `where("tenantId", "==", tenantId)`.

The list rule invokes `saasCanReadCourseByRole`, which requires
`resource.data.tenantId == tenantId`. Firestore Rules are not result filters;
the collection path does not prove an embedded field value. All approved list
shapes therefore fail authorization before serialization.

Adding the equality only to tests would create false coverage. Adding it to
CourseRepository changes R1 and expands all five composite indexes. Removing
the Rules predicate would weaken fail-closed handling of inconsistent documents.
The safe correction is separately authorized work covering R1, CourseRepository,
cursor binding where applicable, unit/runtime tests and FI-CRS-001..005.

```text
COURSE_RUNTIME_QUERY_CONTRACT_DIVERGENCE
```

## Failure grouping

| Group | IDs | Cause |
|---|---:|---|
| tenant-admin point gets | 007-009 | primary Rules evaluation defect |
| student lists | 020-023,124 | primary missing tenant equality proof |
| teacher lists | 030-033,125 | primary missing tenant equality proof |
| tenant-admin lists | 040-043,126 | both primary defects |
| pagination/cursor setup | 050-054,127,060-066,110-115,118-123,128-130 | derived from denied base list |
| archived serialization | 072 | derived from denied admin point get |

No independent fixture, harness, cursor, pagination, serializer or productive
CourseRepository defect was demonstrated.

## Changes, validation and decision

No technical file was modified. Rules, indexes, Storage, CourseRepository,
fixtures/tests, precheck and workflow remain intact. Counts remain 114 IDs,
32 ALLOW and 82 DENY; outcomes remain 32 SUCCESS, 56 RULES_DENY,
26 CONTRACT_ERROR and 0 NOT_FOUND.

The permitted local runtime attempt could not start because Java is unavailable
(`spawn java ENOENT`). No local test ran and no PASS is claimed. Firebase CLI
attempted its public update check, but no project API or Firebase data service
was accessed.

`SaaS-03A.5R-B1-FIX1` is
`incomplete_pending_separate_rules_and_query_contract_authorization`; B2 is
blocked. A separately authorized corrective phase must implement and review the
two bounded corrections, then obtain 114/114 plus metadata self-control before
commit review or runtime closure.

FIX2 supersedes this blocked state after explicit owner authorization. It
implements both bounded corrections, but remains pending runtime validation
because Java is unavailable locally.
