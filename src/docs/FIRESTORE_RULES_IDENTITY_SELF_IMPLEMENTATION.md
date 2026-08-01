# Firestore Rules Identity Self Implementation

## Purpose, scope and sources

SaaS-02C.2B enables the first local SaaS client access exclusively at
`identities/{uid}`. Sources reviewed include Domain 1.2.0 Identity and
Authorization contracts, the physical model, Access Patterns, Query Contracts,
the Firebase Security Review Gate, Rules design and the C.2A shadow baseline.

No Tenant, Membership, platform or legacy authorization participates in this
permission. No deployment is authorized or performed.

## SaaS helpers

- `saasIsAuthenticated()` checks only `request.auth != null`.
- `saasIsSelf(uid)` requires the authenticated uid to equal the path uid.
- `saasIdentityChangedFieldsAllowed()` restricts the document delta.
- `saasIdentityFieldTypesValid()` validates the approved mutable values.
- `saasIdentityUpdatedAtValid()` requires `updatedAt == request.time`.

They are separate from all legacy helpers and do not read `users`, Tenant,
Membership, roles, `DEFAULT_ADMINS` or platform authority.

## Identity permissions

| Operation | Local result | Conditions |
|---|---|---|
| read | enabled for self | authenticated uid equals path uid |
| create | denied | backend-only bootstrap remains future work |
| update | enabled for self, limited | ownership + delta allowlist + types + request time |
| delete | denied | backend-only deletion/anonymization remains future work |

No anonymous, other-Identity, legacy-admin or direct platform read is enabled.
List access is not granted because a list cannot satisfy a distinct self path
uid for arbitrary results.

## Mutable and protected fields

The only affected keys allowed are `displayName`, `photoURL`,
`interfaceLocale` and `updatedAt`.

- `displayName` must be a string. No length bound is imposed because the
  normative contract defines none.
- `photoURL` must be a string or null. It is an external provider URL; no URL
  regex or Firebase Storage path is introduced.
- `interfaceLocale` must be a string. BCP 47 remains contractual; the complex
  validator is deferred under FRD-002.
- `updatedAt` must equal `request.time`.

The strict affected-key allowlist protects `uid`, `email`, `emailVerified`,
`createdAt` and every unknown or institutional field. It also prevents adding
`tenantId`, role/status, memberships, enrollments or platform roles, deleting
immutable fields, and overposting a partial replacement. Full-shape validation
is not added because the physical contract has legitimate nullable/optional
evolution concerns; the delta is the authoritative boundary here.

`emailVerified` is not used for this non-sensitive self profile authorization
and cannot be changed. Future sensitive operations must use the Authentication
token as their authoritative verification source.

## Remaining paths and compatibility

All nine other SaaS paths remain exactly deny-all. The normalized legacy zone
continues to match the immutable owner-provided evidence. The final catch-all
remains unique and unchanged. `storage.rules` remains deny-all.

## Future tests

The later approved Rules testing phase must cover:

1. anonymous cannot read Identity;
2. user can read own Identity;
3. user cannot read another Identity;
4. user cannot create Identity;
5. user can update approved own fields;
6. user cannot update email;
7. user cannot update emailVerified;
8. user cannot add role;
9. user cannot set arbitrary updatedAt;
10. user cannot delete Identity.

No test is created in this phase.

## Risks, validation and closure

Local syntax cannot be exercised with an emulator under this phase. Static
checks validate helper uniqueness/use, balanced structure, legacy equality,
Identity-only enablement and nine remaining denies. Request-time equality is
kept exactly as approved. Display-name bounds and full BCP 47 validation remain
non-blocking deferred decisions.

```text
Identity self read enabled locally.
Identity self limited update enabled locally.
Identity create and delete remain denied.
All other SaaS paths remain deny-all.
Legacy Rules remain semantically unchanged.
No Firebase deployment was performed.
```

SaaS-02C.2C is next but not started. Mandatory human review of the Identity
Rules is required before continuing.
