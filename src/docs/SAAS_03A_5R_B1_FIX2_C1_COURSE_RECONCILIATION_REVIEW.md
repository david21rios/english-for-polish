# SaaS-03A.5R-B1-FIX2-C1 - Course reconciliation review

## Scope and sources

C1 reviews FIX1/FIX2 against Domain 1.2.0, Architecture Freeze, Firestore
physical/access/write models, Course R1, Rules and canonical tests,
CourseRepository, cursor, runtime suite, indexes, CI and traceability.

## Rules review

`saasCanApprovedRoleReadCourse` invokes the approved Membership graph once and
then branches on canonical role. Its caller first requires an active Tenant and
`resource.data.tenantId` equal to the path Tenant. Approved Membership requires
authentication, canonical key identity/Tenant/status, an existing referenced
Membership and matching Membership UID/Tenant/ID/status.

The worst case touches three distinct cacheable documents: Tenant,
membershipKey and Membership. The prior three approval traversals are absent.
Student is limited to active; teacher to draft/active; tenant_admin to all three
canonical states. All blocked actors/states remain fail-closed. Writes and
Course collection-group remain denied.

RT-SAS-011..031 are unique: 6 ALLOW and 15 DENY. C1 corrected the platform case
to carry a representative `role=platform_admin` claim, proving Rules do not use
it as a bypass. Final Rules inventory is 222/88/134 with zero duplicates.

## Repository, cursor and indexes

List constraint order is tenantId, status, optional learning, optional support,
primary order, documentId, optional startAfter and limit-plus-one. tenantId is
the required method argument, never an option. No role, accessMode, global query
or collection-group dependency was added. Point get, serializer, page result
and public API remain intact.

Cursor v1 and `course_standard_v1` remain valid because binding already covers
tenantId, query kind, status contract, languages, order and policy. Position
and encoding are unchanged.

FI-CRS-001..005 prepend tenantId ASC and remain `courses`/`COLLECTION` with
implicit `__name__`. Inventory is 17: 4 RegistrationRequest, 8 Membership,
5 Course, zero fieldOverrides, duplicates or conflicts.

## Tests and corrections

Course unit tests remain 47. C1 expanded the teacher test to cover no language,
learning, support and combined filters. Student already covers four variants;
admin covers omitted and every exact status. Runtime remains 114 IDs; security
IDs distinguish missing, foreign and correct tenant proofs.

Static checks pass. Java is unavailable, so no corrected runtime PASS is
claimed. External evidence is mandatory after human push.

## Commit strategy, risks and state

Commits are isolated into Rules/tests/preflight; Course queries/tests/indexes;
workflow counts; documentation. Staging uses explicit paths. No amend, push,
deploy or Emulator occurs. Residual risks are unexecuted external runtime and
undeployed corrected indexes. Rollback is the four-part inverse recorded in
FIX2 and preserves preceding repositories and Storage deny-all.

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-B1 = completed_with_runtime_failure
SaaS-03A.5R-B1-FIX1 = incomplete_superseded_by_FIX2
SaaS-03A.5R-B1-FIX2 = completed_pending_external_runtime
SaaS-03A.5R-B1-FIX2-C1 = completed_pending_human_push
SaaS-03A.5R-B2 = blocked_pending_push_and_corrected_runtime
```

Next: human `git push origin main`, then a new manual workflow run on main.
