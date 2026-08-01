# SaaS-02C.2E-B — Course and Enrollment Rules reimplementation

## Status and scope

```text
Domain Version: 1.2.0
Architecture Freeze: Approved
Implementation: local only
FRD-006: Closed
FRD-007: Closed
Firebase deployment: not performed
```

This phase implements only the read policies approved in C.2E-A. Course and
Enrollment writes, collection groups, broad teacher Enrollment access,
platform access, anonymous access, and every unrelated path remain denied.

Normative sources were the frozen domain, physical model, 70 Access Patterns,
45 Query Contracts, security gate, Rules design, prior local Rules reports,
C.2E-A resolution, implementation order, domain sources and current Rules.

## Course implementation

The physical `tenants/{tenantId}/courses/{courseId}` contract was revalidated.
Authorization uses `courseId`, `tenantId`, and exactly `draft|active|archived`.
Point get also requires embedded/path ID equality and canonical resource path.

Added helpers:

- `saasCourseStatusIsCanonical`;
- `saasCourseBelongsToTenant`;
- `saasCourseDocumentIsCanonical`;
- `saasCanStudentReadCourse`;
- `saasCanTeacherReadCourse`;
- `saasCanTenantAdminReadCourse`;
- `saasCanReadCourseByRole`;
- `saasCanGetCourse`.

All Course reads require active Tenant and approved same-Tenant Membership.

| Role | Readable statuses | Required list filter |
|---|---|---|
| student | active | `status == active` |
| teacher | draft, active | `status in [draft,active]` |
| tenant_admin | draft, active, archived | `status in [draft,active,archived]` for explicit canonical proof; status-scoped contracts also valid |

Get and list are separate. Suspended/archived Tenant, unknown status,
cross-Tenant, anonymous, platform client, legacy admin and non-approved
Membership all fail closed. Create/update/delete remain false; all Course
commands remain trusted-backend only.

## Enrollment implementation

The physical `tenants/{tenantId}/enrollments/{enrollmentId}` contract was
revalidated. Required authorization fields are enrollmentId, tenantId,
membershipId, courseId, and exactly pending|active|completed|cancelled. No uid
or createdAt was added.

Added helpers:

- `saasEnrollmentStatusIsCanonical`;
- `saasEnrollmentBelongsToTenant`;
- `saasEnrollmentDocumentIsCanonical`;
- `saasEnrollmentMembershipPath/Exists/Data`;
- `saasEnrollmentMembershipStatusIsHistorical`;
- `saasEnrollmentMembershipIsCanonical`;
- `saasEnrollmentBelongsToAuthenticatedUser`;
- `saasTenantAllowsOwnEnrollmentRead`;
- `saasCanReadOwnEnrollment`;
- `saasCanTenantAdminReadEnrollment`;
- `saasCanGetEnrollment`;
- `saasCanListEnrollment`.

Self ownership performs one bounded read of the referenced Membership under the
same Tenant. Its embedded membershipId and tenantId must agree, UID must equal
the authenticated UID, and status must be approved, suspended, or removed.
These statuses establish historical ownership only.

Self get/list is permitted under active or suspended Tenant for all four
Enrollment states. Suspended access is historical, not operational. Archived
Tenant denies every client. Self list requires the canonical tenant collection
query with `membershipId == selectedOwnMembershipId`; Rules are not filters, so
unscoped or foreign-Membership queries fail.

TenantAdmin get/list requires active Tenant plus approved same-Tenant
tenant_admin Membership. It does not read each target Membership. Suspended or
archived Tenant denies administrative client access. Teacher broad get/list is
not granted; a teacher may only pass the independent self-ownership branch.
Platform direct access remains denied.

No Enrollment recursive wildcard exists. Collection-group remains denied.
Create/update/delete, including self cancellation, remain backend-only. Course
is not read for Enrollment ownership; Course archival preserves history.

## Rules read budget

- Course: Tenant + membershipKey + actor Membership through existing cached
  tenant-aware helpers; target implicit and bounded.
- Enrollment self: Tenant + one referenced Membership; no Course, Identity or
  membershipKey.
- Enrollment tenant_admin: Tenant + administrator membershipKey/Membership;
  no referenced Membership per result.

There is no internal query, scan, global fan-out, or unbounded N+1 design.

## Query Contracts and indexes

Course `FQ-CRS-001..007` are traced. Client-enabled subsets are point reads,
student/teacher status-constrained tenant lists, tenant-admin canonical/status
lists, and language variants only when they retain an allowed status predicate.
Backend write validation remains backend-only. Related indexes are built-in
point reads and `FI-CRS-001..005` composites.

Enrollment `FQ-ENR-001`, `002`, `004`, `006`, and scoped `007` are enabled for
their self/admin read purpose. `FQ-ENR-003` teacher purpose remains deferred,
`005/008` invariant/write validation remains backend-only. Related indexes are
built-in point reads and `FI-ENR-001..007` required/probable variants.

No index JSON was materialized; production availability of composite queries
depends on the later index phase.

## Match overlap and preservation

Course and Enrollment have only their nested tenant matches plus final
catch-all. No recursive Course/Enrollment rule exists. Tenant root permission
does not authorize subcollections. Membership/Request recursive matches do not
overlap. Legacy contains no canonical plural Course/Enrollment match.

The Identity, Tenant, Membership/Request self and legacy regions were not
changed. Final catch-all remains unique, final, and deny-all.

## FRD closure

FRD-006 is Closed: student=active, teacher=draft/active, tenant_admin=all three,
with active Tenant and approved Membership.

FRD-007 is Closed: active Tenant permits self and same-Tenant admin reads;
suspended permits only self historical read; archived denies every client.

## Risks and future tests

Rules query predicates must be matched by canonical status/membershipId filters;
Rules do not post-filter. Composite indexes remain unmaterialized and runtime
emulator coverage is deferred. Missing/malformed fields fail closed.

Future tests must cover every Course role/status/Tenant combination, required
filters, cross-Tenant/anonymous/platform denial and writes; all Enrollment
states, Membership statuses and mismatch cases, active/suspended/archived
Tenant behavior, tenant-admin scope, teacher broad denial, membershipId query
constraint, collection-group denial and writes. Tests were not created here.

## Closure and next gate

All C.2E-B criteria are satisfied structurally and remain subject to mandatory
human Rules review. No deploy occurred.

```text
SaaS-02C.2E = completed
SaaS-02C.2E-B = completed_pending_human_rules_review
SaaS-02C.2F = next, not started
```
