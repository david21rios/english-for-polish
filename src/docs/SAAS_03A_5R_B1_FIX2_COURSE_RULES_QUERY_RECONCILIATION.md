# SaaS-03A.5R-B1-FIX2 - Course Rules and query reconciliation

## Purpose and authority

FIX2 is the owner-authorized correction following the first Course runtime
result: 114 Course IDs, 115 Node tests including metadata self-control,
68 passed, 47 failed. FIX1 isolated two roots: repeated Course role
authorization access graphs and list queries that did not prove embedded
`tenantId` ownership required by Rules.

Authority remains Domain 1.2.0, Architecture Freeze, the physical model and
write authority, followed by the corrected Course R1 contract. No UI, Domain,
Storage, legacy service, client write, platform bypass or collection-group
permission changes.

## Rules authorization refactor

Previously `saasCanReadCourseByRole` invoked student, teacher and tenant-admin
helpers, each of which re-entered `saasHasApprovedMembership`. The worst-case
admin branch expanded the Tenant read plus three repeated membershipKey and
Membership validation graphs.

The final graph is:

```text
authenticated request
  -> Tenant exists/status active (one cached Tenant document)
  -> Course tenantId matches path Tenant
  -> saasHasApprovedMembership once
       -> membershipKey exists/data (one cached key document)
       -> Membership exists/data (one cached Membership document)
  -> branch on the resolved canonical Membership role
  -> validate Course status for that role
```

The document access budget is therefore three distinct documents in the
worst case: Tenant, membershipKey and Membership. Repeated field reads target
the same cached documents. The refactor creates
`saasCanApprovedRoleReadCourse`, removes the three Course-specific role helpers,
and preserves the shared Membership helpers.

Final semantics are student=active, teacher=draft/active, and
tenant_admin=draft/active/archived. Suspended or removed Memberships,
suspended or archived Tenants, anonymous actors, foreign Tenants, invalid roles
and platform clients remain denied.

## Canonical Rules coverage and counts

`tests/rules/saasRegression.test.mjs` adds RT-SAS-011..031: six independent
ALLOW and fifteen DENY cases covering every role/status pair, Membership and
Tenant states, anonymous/foreign/platform actors, invalid role, missing/broken
key and UID/Tenant mismatches.

```text
Before: 201 total / 82 ALLOW / 119 DENY
After:  222 total / 88 ALLOW / 134 DENY
```

The static validator and workflow declarations use the final counts.

## Corrected Course query contract

Every tenant-scoped list begins with
`where("tenantId", "==", tenantId)`, followed by status, optional learning
language, optional support language, primary order, document ID order,
optional cursor and limit-plus-one. Student retains exact active status;
teacher retains the fixed draft/active set; admin retains exact status or the
fixed three-state set.

The public API and SDK dependency allowlist do not change. `getCourse`, result
shape, lifecycle, serializer and validation do not change.

Course cursor version 1 and policy `course_standard_v1` remain compatible:
the binding already includes the exact tenantId and query kind, while position
and encoding are unchanged. Old tokens were already Tenant-bound and gain no
ambiguous interpretation from making the query proof explicit.

## Replaced index signatures

The existing five Course entries are replaced in place, not duplicated:

```text
FI-CRS-001 tenantId ASC, status ASC, displayName ASC
FI-CRS-002 tenantId ASC, status ASC, updatedAt DESC
FI-CRS-003 tenantId ASC, status ASC, learningLanguage.languageCode ASC, displayName ASC
FI-CRS-004 tenantId ASC, status ASC, supportLanguageCode ASC, displayName ASC
FI-CRS-005 tenantId ASC, status ASC, learningLanguage.languageCode ASC,
           supportLanguageCode ASC, displayName ASC
```

All use `courses` and `COLLECTION`; `__name__` remains implicit. The final file
has 17 indexes: 4 RegistrationRequest, 8 Membership and 5 Course, with zero
field overrides, duplicates or conflicts. No deployment occurs.

## Tests and validation

Course unit tests assert tenantId as the first filter for student, teacher and
admin shapes while preserving status, language combinations, cursor,
pagination and public API coverage. Runtime IDs remain 114; existing security
IDs now explicitly cover a missing tenant proof, a foreign tenantId proof and a
correct field proof against a foreign collection/actor context.

Static results: Course precheck 114/32/82 and outcomes 32/56/26/0;
Membership 81/44/37; RegistrationRequest 52/34/18; Rules 222/88/134;
Course unit tests 47/47; lint, node checks, index validation and diff checks pass.

Java is unavailable locally (`spawn java ENOENT`), so no corrected Rules or
Course runtime PASS can be claimed. FIX2 remains incomplete pending runtime
validation despite the completed implementation.

## Rollback and risks

Rollback restores the previous Course helper composition, removes RT-SAS-011
through 031, restores 201/82/119 declarations, removes the first tenantId query
constraint, restores the five prior Course index signatures and reverts only
the associated tests/docs. RegistrationRequest, Membership, fieldOverrides and
all unrelated Rules remain untouched. Parse, structural validation, static
preflight and all suites must then be repeated.

Residual risks are the unexecuted local Emulator, undeployed corrected indexes,
and the need for a fresh GitHub Actions run after human review/commits/push.

## State

```text
SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5R = in_progress
SaaS-03A.5R-B1 = completed_with_runtime_failure
SaaS-03A.5R-B1-FIX1 = incomplete_superseded_by_FIX2
SaaS-03A.5R-B1-FIX2 = completed_pending_external_runtime
SaaS-03A.5R-B1-FIX2-C1 = completed_pending_human_push
SaaS-03A.5R-B2 = blocked_pending_push_and_corrected_runtime
CourseRepository = implemented_shadow
```

C1 accepted the implementation after two objective test-coverage corrections.
Controlled commits are created in C1; no push, deploy or B2 execution occurs.
