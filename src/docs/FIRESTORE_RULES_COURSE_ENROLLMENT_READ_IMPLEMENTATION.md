# SaaS-02C.2E — Course and Enrollment read Rules assessment

> FIX2 superseding correction: Course authorization now evaluates one approved
> Membership graph before its role/status branch. Course lists require explicit
> embedded tenantId equality. Enrollment semantics are unchanged.

## 1. Result

```text
Domain Version: 1.2.0
Architecture Freeze: Approved
SaaS-02C.2E Course and Enrollment read Rules = INCOMPLETE
Course client access = DENY-ALL
Enrollment client access = DENY-ALL
Firebase deployment = NOT PERFORMED
```

This phase stopped before changing `firestore.rules`. Two policies required by
the phase are not defined unequivocally by the approved normative sources.
Minimum privilege and the explicit blocking conditions require fail-closed
behavior rather than inventing readable states.

## 2. Scope and sources

The assessment reviewed directly:

- `DOMAIN_VERSION.md`;
- `DOMAIN_MODEL_ORGANIZATION.md`;
- `DOMAIN_MODEL_ACADEMIC.md`;
- `DOMAIN_MODEL_AUTHORIZATION.md`;
- `DOMAIN_WORKFLOW.md`;
- `DOMAIN_RELATIONSHIP_MODEL.md`;
- `FIRESTORE_PHYSICAL_MODEL.md`;
- `FIRESTORE_ACCESS_PATTERNS.md`;
- `FIRESTORE_QUERY_AND_INDEX_MODEL.md`;
- `FIREBASE_SECURITY_REVIEW_GATE.md`;
- `FIRESTORE_RULES_DESIGN.md`;
- the three preceding local Rules implementation reports;
- `PERSISTENCE_INVARIANTS_AND_OPERATIONS.md` for the explicitly requested
  historical-read cross-check;
- `IMPLEMENTATION_ORDER_SAAS_MULTI_TENANT.md`;
- `src/domain/academic/`, `organization/`, `authorization/`, `workflow/` and
  the current local `firestore.rules` in read-only mode.

No contract, capability, workflow, Access Pattern, Query Contract, topology,
index, test, functional code, Firebase configuration, or deployed resource was
changed.

## 3. Course contract and states

Canonical path:

```text
tenants/{tenantId}/courses/{courseId}
```

The physical contract contains mandatory `courseId`, `tenantId`,
`displayName`, `description`, `learningLanguage`, `supportLanguageCode`,
`interfaceLanguages`, `cefrLevel`, `status`, `createdAt`, and `updatedAt`.
`archivedAt` is conditional. Canonical authorization can safely compare the
embedded IDs with the path and validate `status` against exactly:

```text
draft
active
archived
```

Course is private, belongs to exactly one Tenant, and has no public or platform
client visibility.

## 4. Course role/status matrix

| Actor | Approved evidence | Determinable readable states | Result |
|---|---|---|---|
| anonymous | default deny; public visibility deferred | none | deny |
| student | Rules design says active Courses; FQ-CRS-002/004/005 use active | `active` | defined |
| teacher | C.2E originally found no state set; C.2E-A reconciled minimum privilege | `draft`, `active`; archived denied | resolved pending reimplementation |
| tenant_admin | AP-CRS-004 explicitly manages `draft/active/archived`; AP-CRS-013 covers archived history | all three, in active Tenant | defined |
| platform_admin client | backend-mediated; no private Tenant bypass | none | deny |

The original phase stopped because write capabilities did not define direct
read visibility. C.2E-A now fixes teacher access to `draft` and `active`, denies
`archived`, and preserves backend-only writes.

### FRD-006 — Course readable-status policy by institutional role

| Attribute | Value |
|---|---|
| Path | `tenants/{tenantId}/courses/{courseId}` |
| Evidence | `course.read/list` assigned to teacher; status-by-role required but teacher state set absent |
| Impact | A permissive rule could expose archived or unrelated drafts; an active-only rule could contradict intended teacher authoring access |
| Severity | High |
| Blocks | SaaS-02C.2E and therefore SaaS-02C.2F |
| Treatment | C.2E-A resolved student=`active`, teacher=`draft/active`, tenant_admin=`draft/active/archived` under active Tenant |
| Status | `resolved_pending_reimplementation` |

## 5. Course Rules not implemented

No Course helper was added. The following remains unchanged:

```text
Course get = deny
Course list = deny
Course create = deny
Course update = deny
Course delete = deny
```

The student query would be compatible once the full role policy is approved:

```text
tenants/{tenantId}/courses where status == "active"
```

Tenant-admin contracts can use status-scoped queries or an unfiltered
tenant-scoped list. Teacher uses the bounded status set `in [draft, active]`.
Tenant must be active and the actor Membership approved for every Course read.

## 6. Enrollment contract and states

Canonical path:

```text
tenants/{tenantId}/enrollments/{enrollmentId}
```

The physical contract contains mandatory `enrollmentId`, `tenantId`,
`membershipId`, `courseId`, `status`, `enrolledAt`, and `updatedAt`.
`completedAt` and `cancelledAt` are conditional. Generic `createdAt` is not a
physical Enrollment field. States are exactly:

```text
pending
active
completed
cancelled
```

Course archival does not delete Enrollment. Terminal Enrollments are retained.

## 7. Enrollment ownership feasibility

Ownership is technically provable with one bounded point lookup:

```text
Enrollment.membershipId
  -> tenants/{tenantId}/memberships/{membershipId}
  -> Membership.uid == request.auth.uid
```

A future safe predicate can validate:

- authenticated actor;
- Enrollment embedded `tenantId` and `enrollmentId` equal the path;
- referenced Membership exists under the same Tenant;
- Membership embedded IDs equal the reference and path;
- Membership `uid` equals `request.auth.uid`.

No `uid` duplication, Course read, collection-group, unbounded lookup, or
cross-Tenant read is required. Self list remains feasible as one tenant-scoped
query per known Membership context with mandatory
`membershipId == selectedMembershipId`. Consequently FRD-008 is not created.

## 8. Enrollment role and Tenant-status policy

| Access | Active Tenant | Suspended Tenant | Archived Tenant |
|---|---|---|---|
| own Enrollment | allowed through referenced Membership | historical self read allowed | client denied; backend recovery deferred |
| tenant_admin get/list | approved by `enrollment.list`, same active Tenant | operational access denied | denied |
| teacher broad access | FAP-005 deferred | denied | denied |
| platform_admin client | denied/backend-mediated | denied | denied |

The original phase stopped because the non-active Tenant boundary was not
explicit. C.2E-A now allows own historical Enrollment under a suspended Tenant,
denies tenant-admin client reads there, and denies every client under archived.

### FRD-007 — Enrollment historical-read policy under non-active Tenant

| Attribute | Value |
|---|---|
| Path | `tenants/{tenantId}/enrollments/{enrollmentId}` |
| Evidence | Enrollment history retained; suspended “authorized history” generic; no explicit Enrollment rule for suspended/archived Tenant |
| Impact | Could expose private history after Tenant closure or prevent an intended self-history use case |
| Severity | High |
| Blocks | SaaS-02C.2E and therefore SaaS-02C.2F |
| Treatment | C.2E-A allows own history under active/suspended Tenant, denies every client under archived Tenant, and limits tenant_admin to active Tenant |
| Status | `resolved_pending_reimplementation` |

## 9. Enrollment Rules not implemented

No Enrollment helper was added in the blocked phase. Until C.2E-B, the current
local posture remains:

```text
Enrollment get = deny
Enrollment list = deny
Enrollment collection-group = deny
Enrollment create = deny
Enrollment update = deny
Enrollment delete = deny
```

Broad teacher Enrollment access remains denied because FAP-005 is deferred.
Student access would be ownership-based rather than role-wide. Tenant-admin
read would require active Tenant, approved same-Tenant Membership and exact
`tenant_admin` role. Direct platform access remains denied.

## 10. Query Contracts and indexes

### Course

| Contract | Intended actor | Filter | Index | Enabled |
|---|---|---|---|---:|
| FQ-CRS-001 | scoped member/admin | point courseId | built-in | No |
| FQ-CRS-002 | student/member, status policy | optional/active status | FI-CRS-001 when filtered | No |
| FQ-CRS-003 | tenant_admin | status | FI-CRS-002 | No |
| FQ-CRS-004/005/006 | scoped member | active/status plus language fields | FI-CRS-003/004/005 | No |
| FQ-CRS-007 | tenant_admin history | archived | FI-CRS-002 | No |

### Enrollment

| Contract | Intended actor | Filter | Index | Enabled |
|---|---|---|---|---:|
| FQ-ENR-001 | self/admin | point enrollmentId | built-in | No |
| FQ-ENR-002/006 | self/admin | membershipId, optional status | FI-ENR-001/002 | No |
| FQ-ENR-003 | admin; teacher deferred | courseId, optional status | FI-ENR-003/004 | No |
| FQ-ENR-004 | tenant_admin | optional status | FI-ENR-005 | No |
| FQ-ENR-005 | backend/admin invariant | membershipId+courseId | FI-ENR-006 | No |
| FQ-ENR-007 | exact self/admin history | owner/course plus terminal status | FI-ENR-007 probable variants | No |
| FQ-ENR-008 | backend validation set | point-read composition | constituent/built-in | No |

No index was created or modified. No Course or Enrollment collection-group is
approved.

## 11. Rules read budget

The feasible future Course check is bounded to Tenant plus the actor's
membershipKey/Membership resolution already used by tenant-aware helpers. The
target Course is implicit. The feasible self Enrollment check needs one
referenced Membership; adding Tenant would be one further bounded point read if
the approved Tenant-status policy requires it. Tenant-admin Enrollment access
uses Tenant plus the administrator lookup/Membership, never one Membership per
result. No design requires N+1 scans, internal queries, Course-per-Enrollment
reads, or collection-group Enrollment access.

## 12. Match overlap and preserved semantics

The current Course and Enrollment matches are nested under the Tenant and remain
explicit deny-all. No recursive match covers either collection ID. The Tenant
root allow does not grant subcollection access. Legacy paths contain no
canonical `courses` or `enrollments` permission. The unique final catch-all
remains final and deny-all.

Because `firestore.rules` was not changed in this phase:

```text
IDENTITY_SEMANTICS_EQUAL=True
TENANT_SEMANTICS_EQUAL=True
MEMBERSHIP_REQUEST_SELF_SEMANTICS_EQUAL=True
LEGACY_SEMANTICS_EQUAL=True
```

Storage remains deny-all and Firebase remote was not contacted.

## 13. Future test cases

All requested Course cases must eventually cover anonymous, missing/foreign or
non-approved Membership, active-only student access, each explicitly approved
teacher/admin state, suspended/archived Tenant, cross-Tenant and platform
denials, status-filter query compatibility, and denied writes.

Enrollment cases must cover all four own states, referenced-Membership UID/ID
and Tenant mismatch, required membershipId query filter, foreign Membership,
tenant-admin same-active-Tenant access, teacher broad deny, student broad-list
deny, platform deny, collection-group deny, and all client writes denied.

These are documented only. `tests/rules/` was not modified.

## 14. Closure criteria and conclusion

The physical contracts, enums, ownership composition, Query Contracts, indexes,
read budget, match overlap and deny postures are verifiable. C.2E-A resolved
the teacher Course state set and Enrollment self-history Tenant-status matrix
without changing Rules. These implementation criteria remain pending:

- Course and Enrollment helpers implemented;
- Course get/list enabled with the resolved status matrix;
- Enrollment self/admin get/list enabled with the resolved Tenant matrix;
- Rules revalidated and FRD-006/007 closed.

All other reviewed safety constraints remain fail-closed. No permissions were
expanded to compensate.

```text
SaaS-02C.2E Course and Enrollment read Rules = INCOMPLETE
Historical C.2E result = INCOMPLETE
SaaS-02C.2E-B reimplementation = COMPLETE pending human Rules review
FRD-006 = Closed
FRD-007 = Closed
SaaS-02C.2F = NOT STARTED
Mandatory human Rules review = REQUIRED
```

The original blocked result is retained as history. C.2E-A resolved policy and
C.2E-B implemented it locally. Course and Enrollment writes remain backend-only,
Enrollment collection-group remains denied, and no deploy was performed.
