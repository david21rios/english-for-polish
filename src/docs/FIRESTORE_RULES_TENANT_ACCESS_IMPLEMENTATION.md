# Firestore Rules Tenant Access Implementation

## Objective and sources

SaaS-02C.2C implements tenant-aware SaaS helpers and point-read access to
`tenants/{tenantId}` for an approved member of that same Tenant. Domain 1.2.0,
the physical/query models, Rules design, Identity implementation and current
rules were reviewed. Identity, legacy compatibility and all Tenant
subcollections remain otherwise unchanged.

## Membership resolution and uidKey

The approved topology stores Membership at
`tenants/{tenantId}/memberships/{membershipId}` and its bounded lookup at
`tenants/{tenantId}/membershipKeys/{uidKey}`. The key document contains
`tenantId`, `uid`, `membershipId`, `status`, `originRequestId` and `updatedAt`;
Membership contains canonical `membershipId`, `tenantId`, `uid`, `role` and
`status` plus its approved lifecycle fields.

The canonical algorithm is:

```text
u1_<base64url(UTF-8(uid), no-padding)>
```

Firestore Rules exposes `String.toUtf8()`, `Bytes.toBase64()` using base64url,
and `String.replace()`. The implementation therefore computes:

```text
"u1_" + uid.toUtf8().toBase64().replace("=", "")
```

This removes Base64 padding without substituting uid, membershipId or another
encoding. The key remains inaccessible directly to clients.

```text
MEMBERSHIP_RESOLUTION = IMPLEMENTABLE
```

## Tenant-aware helpers and fail-closed checks

Helpers with the `saas` prefix provide Tenant path/existence/data/state,
uidKey and key path, referenced Membership path/existence/data, approved
membership validation and student/teacher/tenant_admin role predicates.

Authorization verifies, in order:

- authentication;
- canonical membershipKey existence;
- key uid, tenantId, approved status and membershipId;
- referenced Membership existence;
- Membership uid, tenantId, membershipId and approved status;
- Tenant existence and active or suspended state;
- archived state is explicitly excluded.

Any absent field, missing document or mismatch fails closed. There is no
fallback through `users`, email, legacy admin, `DEFAULT_ADMINS`, Identity roles
or platform authority.

## Read budget and query behavior

A Tenant point read conceptually requires three document access calls:

1. membershipKey;
2. referenced Membership;
3. Tenant.

Repeated identical `get`/`exists` calls are eligible for Rules evaluation
caching, but authorization does not depend on that optimization for semantics.
The bounded point-read budget remains below the single-document request limit.
The Tenant rule uses `allow get`, not `allow read`; `list` is explicitly denied.
Members cannot enumerate Tenants. Multi-Tenant discovery must later resolve
self Memberships and issue authorized point reads.

## Tenant rule and states

| State/context | Point read result |
|---|---|
| active + approved same-Tenant Membership | allowed operational Tenant document read |
| suspended + approved same-Tenant Membership | allowed informational Tenant document read only |
| archived | denied |
| missing/suspended/removed/cross-Tenant Membership | denied |
| anonymous or direct platform client | denied |

Create, update, delete and list remain denied. Settings, Branding,
RegistrationRequests, both key collections, Memberships, Courses and
Enrollments remain direct client deny-all. Internal `get`/`exists` checks do not
grant direct access to Membership or membershipKey documents.

## Preserved surfaces

Static normalized comparison confirms:

```text
IDENTITY_SEMANTICS_EQUAL=True
LEGACY_SEMANTICS_EQUAL=True
```

The catch-all remains unique and final. Storage remains unchanged and deny-all.

## Future tests

The later Rules testing phase must cover:

1. anonymous cannot read Tenant;
2. authenticated user without Membership cannot read Tenant;
3. user with Membership from another Tenant cannot read Tenant;
4. approved member can read active Tenant;
5. suspended Membership cannot read Tenant;
6. removed Membership cannot read Tenant;
7. approved member can read suspended Tenant information;
8. approved member cannot read archived Tenant;
9. platform_admin client cannot bypass isolation;
10. user cannot create, update or delete Tenant;
11. inconsistent membershipKey denies access;
12. Membership tenantId mismatch denies access;
13. Membership uid mismatch denies access.

## Risks, validation and gate

The rule is not executed in an emulator in this phase. Static validation covers
the encoding expression, helper isolation, path/state/ref checks, point-read
only policy, deny-all subcollections, structural balance and preserved zones.
Physical lookup consistency remains a trusted-backend invariant and all drift
fails closed. General Tenant lists and platform access remain backend-mediated.

No Firebase deployment was performed. SaaS-02C.2D is not started. Mandatory
human review of Tenant access Rules is required before continuing.
