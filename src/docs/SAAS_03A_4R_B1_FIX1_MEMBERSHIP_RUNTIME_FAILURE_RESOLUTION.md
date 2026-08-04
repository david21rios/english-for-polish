# SaaS-03A.4R-B1-FIX1 — Membership runtime failure resolution

## Evidence and classification

The first manual Membership gate on `main` reached all 81 cases and reported
65 passed and 16 failed, with exit code 1. The failed IDs were
RT-MEM-REP-020 through RT-MEM-REP-024, RT-MEM-REP-030,
RT-MEM-REP-040 through RT-MEM-REP-044, RT-MEM-REP-050,
RT-MEM-REP-062, RT-MEM-REP-063, RT-MEM-REP-067 and RT-MEM-REP-068.
They shared a repository `CONTRACT_VIOLATION` while serializing
`tenants/tenant-a/memberships/membership-invalid`.

This was a fixture-isolation defect, not a repository, Rules, query, cursor,
index or SDK defect. The deliberately incompatible document used
`uid-student-a`, `tenant-a`, role `platform_admin`, and status `approved`.
Consequently it matched broad self queries and approved-status queries for the
canonical student before their assertions ran. Role-specific queries passed
because no canonical role equals `platform_admin`; suspended and removed
queries passed because the fixture status was approved. Full-dataset and
terminal pagination failed when traversal eventually retrieved the document.

## Correction

The incompatible fixture now has the dedicated identity `uid-incompatible`.
RT-MEM-REP-012 authenticates and queries that same UID, so Rules permit the
self read and the real repository serializer still rejects role
`platform_admin` with `CONTRACT_VIOLATION`. Canonical fixtures and all 81 IDs,
metadata and outcomes remain unchanged:

```text
TOTAL = 81
ALLOW = 44
DENY = 37
SUCCESS = 44
RULES_DENY = 26
CONTRACT_ERROR = 11
NOT_FOUND = 0
```

Only the Membership runtime harness user table, incompatible fixture and
RT-MEM-REP-012 context changed. MembershipRepository, Shared, Rules, indexes,
Storage, existing canonical fixtures, CI workflow, precheck and packages remain
unchanged.

## Historical-case exclusion matrix

All 16 cases authenticate and query `uid-student-a`; the incompatible fixture
now has `uid-incompatible`, so Firestore excludes it before serialization. The
queries and their original assertions are unchanged.

| Test ID | Scope/Tenant | Filters | Preserved assertion |
|---|---|---|---|
| RT-MEM-REP-020 | tenant / tenant-a | uid | owner-only results |
| RT-MEM-REP-021 | tenant / tenant-a | uid | foreign UID exclusion |
| RT-MEM-REP-022 | tenant / tenant-a | uid | Tenant isolation |
| RT-MEM-REP-023 | tenant / tenant-a | uid | createdAt order |
| RT-MEM-REP-024 | tenant / tenant-a | uid | document-ID tie break |
| RT-MEM-REP-030 | tenant / tenant-a | uid + approved | exact status |
| RT-MEM-REP-040 | collection-group / all | uid | multiple Tenants |
| RT-MEM-REP-041 | collection-group / all | uid | owner-only results |
| RT-MEM-REP-042 | collection-group / all | uid | foreign exclusion |
| RT-MEM-REP-043 | collection-group / all | uid | global order |
| RT-MEM-REP-044 | collection-group / all | uid | full-path tie break |
| RT-MEM-REP-050 | collection-group / all | uid + approved | exact status |
| RT-MEM-REP-062 | tenant / tenant-a | uid, paged | full reconstruction |
| RT-MEM-REP-063 | tenant / tenant-a | uid, pageSize 20 | terminal page |
| RT-MEM-REP-067 | collection-group / all | uid, paged | full reconstruction |
| RT-MEM-REP-068 | collection-group / all | uid, pageSize 20 | terminal page |

## Validation and residual blocker

Syntax, ESLint, both repository prechecks, Membership unit tests, general
tests, build, Rules preflight and diff validation pass. Java remains unavailable
on the local host, so corrected runtime evidence must be produced later by a
new GitHub Actions execution with Temurin 21. Static correction and C1 review
are complete; this does not assert 81 passed / 0 failed before that execution.

No commit, push, deploy or workflow execution is performed in FIX1. B2 remains
blocked and is not started.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4R = in_progress
SaaS-03A.4R-B = in_progress
SaaS-03A.4R-B1 = completed_with_runtime_fix_pending_validation
SaaS-03A.4R-B1-FIX1 = completed
SaaS-03A.4R-B1-FIX1-C1 = completed_pending_human_push
SaaS-03A.4R-B2 = blocked_pending_corrected_runtime_evidence
MembershipRepository = implemented_shadow
```
