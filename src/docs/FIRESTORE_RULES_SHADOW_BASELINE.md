# Firestore Rules Shadow Baseline

## Purpose and phase

SaaS-02C.2A establishes a local composite Firestore Rules baseline. It does not
enable SaaS client access and it does not authorize deployment.

Sources:

- Domain 1.2.0 and the approved Firestore topology;
- `FIRESTORE_RULES_DESIGN.md`;
- `FIRESTORE_LEGACY_RULES_RECONCILIATION.md`;
- the owner-provided legacy rules preserved verbatim in
  `evidence/FIRESTORE_RULES_LEGACY_REFERENCE.rules`.

## Composite structure

`firestore.rules` contains one `rules_version`, one Firestore service, one
database match and four ordered sections:

1. legacy compatibility helpers;
2. legacy compatibility paths;
3. SaaS multi-tenant shadow paths;
4. one final catch-all deny.

The legacy zone preserves the eleven helpers, paths, allow expressions and
field lists supplied by the owner. This is temporary compatibility, not the
SaaS authorization model. Known risks—global `admin`, public academic content,
client progress, forum shared-field writes, anonymous messages and public
presentations—remain intentionally unchanged.

## SaaS shadow zone

The following ten canonical paths are reserved:

1. `identities/{uid}`
2. `tenants/{tenantId}`
3. `tenants/{tenantId}/configuration/settings`
4. `tenants/{tenantId}/configuration/branding`
5. `tenants/{tenantId}/registrationRequests/{requestId}`
6. `tenants/{tenantId}/registrationRequestKeys/{uidKey}`
7. `tenants/{tenantId}/memberships/{membershipId}`
8. `tenants/{tenantId}/membershipKeys/{uidKey}`
9. `tenants/{tenantId}/courses/{courseId}`
10. `tenants/{tenantId}/enrollments/{enrollmentId}`

At the historical SaaS-02C.2A baseline every path was deny-all. The name
“shadow baseline” is retained as historical provenance. Subsequent approved
local phases now provide limited Identity self, Tenant get, Membership and
RegistrationRequest self, and tenant-scoped Course and Enrollment reads.
Configuration and lookup documents remain client deny-all; canonical writes
remain denied except the already approved limited Identity self update.

No legacy helper is called by the SaaS zone, no SaaS helper is called by the
legacy zone, and no Firebase deployment has occurred.

## Compatibility and retirement

Legacy behavior is preserved locally so current consumers are not removed by a
destructive replacement. A legacy block may be retired only after its data and
consumers migrate, Rules and smoke tests pass, reconciliation succeeds and a
rollback is available.

Storage is outside the current SaaS target. `storage.rules` remains deny-all;
no Storage path or Media model is introduced and residual `uploadAudio` code is
not enabled or removed in this phase.

## Validation and gate

- evidence/reference and composite legacy semantics compared;
- ten SaaS paths and ten deny-all statements counted;
- wrappers, braces and final catch-all checked structurally;
- build, tests and `git diff --check` executed;
- no emulator, Firebase CLI, remote access or deployment used.

```text
Legacy behavior preserved locally.
SaaS canonical paths reserved.
SaaS client access remains deny-all.
No Firebase deployment was performed.
```

SaaS-02C.2B is next but not started. A mandatory human review of
`firestore.rules` is required before it begins.

## SaaS-02C.2F compatibility revalidation

`FIRESTORE_RULES_LEGACY_SAAS_COMPATIBILITY_CLOSURE.md` confirms that legacy
semantics still equal the owner-provided reference, the current local SaaS
permissions do not widen legacy permissions, overlaps are safe, and no legacy
block is ready for retirement. This update does not alter the original
SaaS-02C.2A decisions or imply deployment.
