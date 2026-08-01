# SaaS-02C.2E-A — Course and Enrollment policy resolution

## Status and scope

```text
Domain Version: 1.2.0
Architecture Freeze: Approved
Change classification: Security-policy clarification only
SaaS-02C.2E-A Course and Enrollment policy resolution = COMPLETE
FRD-006 = resolved_pending_reimplementation
FRD-007 = resolved_pending_reimplementation
```

This reconciliation resolves only the two ambiguities found by SaaS-02C.2E.
It adds no entity, field, state, role, capability, workflow, ownership relation,
path, index, Query Contract, or executable Rule. `firestore.rules` remains
unchanged and Course/Enrollment remain client deny-all.

The decision was checked against Domain 1.2.0, authorization, workflows,
persistence, physical topology, Access Patterns, Query Contracts, the Firebase
security gate, Rules design, and the blocked C.2E report. No contradiction was
found.

## Course policy

Every Course client read requires authentication, active Tenant, approved
same-Tenant Membership, exact role, matching tenantId, and canonical Course ID.

| Actor | Readable | Denied |
|---|---|---|
| student | active | draft, archived |
| teacher | draft, active | archived |
| tenant_admin | draft, active, archived | none of the canonical states |
| anonymous/platform client | none | all |

Tenant suspended or archived denies Course to every client. Historical recovery
is future trusted-backend access. All Course writes remain backend-only.

Canonical queries:

```text
student: tenants/{tenantId}/courses where status == "active"
teacher: tenants/{tenantId}/courses where status in ["draft", "active"]
tenant_admin: tenant-scoped list without status, or approved status contracts
```

The teacher query may be split into two status queries only if later index/query
testing requires it; the readable set cannot broaden. No global/collection-group
Course query or index materialization is approved here.

## Enrollment ownership and history

Self ownership remains exclusively:

```text
Enrollment.membershipId
  -> Membership.membershipId
  -> Membership.uid
  -> request.auth.uid
```

Enrollment and Membership must be canonical and share tenantId. Membership may
be approved, suspended, or removed for historical ownership. UID is not
duplicated into Enrollment and role alone never proves ownership.

An owner may read pending, active, completed, and cancelled Enrollment when the
Tenant matrix permits it:

| Tenant | Self owner | tenant_admin | teacher/platform client |
|---|---|---|---|
| active | own read allowed | same-Tenant get/list allowed | denied |
| suspended | own historical read allowed | denied | denied |
| archived | denied | denied | denied |

Suspended Tenant self Enrollment read is historical, not operational. It grants
no Course access, progress, transition, write, administration, or foreign-owner
access. Archived recovery is future trusted backend plus explicit authority,
purpose, and audit.

Canonical self query:

```text
tenants/{tenantId}/enrollments
where membershipId == selectedOwnMembershipId
```

TenantAdmin may use only approved tenant-scoped `FQ-ENR-*` contracts while the
Tenant is active. Teacher has no client query. Enrollment collection-group
remains denied.

## Read categories

- Operational read requires active Tenant and supports normal authorized use.
- Historical self read applies only to own Enrollment under suspended Tenant.
- Archived recovery is denied to clients and deferred to trusted backend.

No extra persisted state or historical projection is introduced.

## Findings

```text
FRD-006 = resolved_pending_reimplementation
student      -> active
teacher      -> draft, active
tenant_admin -> draft, active, archived
common gate  -> active Tenant + approved same-Tenant Membership

FRD-007 = resolved_pending_reimplementation
active       -> self read and scoped tenant_admin read
suspended    -> self historical read; tenant_admin denied
archived     -> all client reads denied
recovery     -> future trusted backend with audit
```

Neither finding is Closed until Rules are implemented and revalidated.
FRD-008 remains not required because ownership and the per-Membership query are
bounded.

## Closure

All requested role/status, Tenant-status, query, historical, platform, and
collection-group decisions are explicit and minimum-privilege. No new
contradiction was detected.

```text
SaaS-02C.2E remains incomplete_blocked pending reimplementation.
SaaS-02C.2E-A = completed_pending_human_policy_review
SaaS-02C.2E-B = next, not started
SaaS-02C.2F = not started
```

Human policy review is mandatory. No Rules implementation or deploy occurred.
