# SaaS-02C.2F — Legacy/SaaS Rules compatibility closure

## 1. Purpose, scope and decision

This report closes the local compatibility audit between the owner-provided
legacy Rules and the partially enabled SaaS Rules zone. It is an audit and
retirement plan only: no permission, helper, match, index, test, application
consumer or Firebase resource was changed.

Normative authority remains Domain 1.2.0 and the approved persistence, access,
query, write-authority and Rules design documents. The legacy reference is
authoritative only for preserving current monoinstitutional behavior.

```text
LEGACY_SEMANTICS_EQUAL=True
Legacy Rules remain temporarily active for existing consumers.
SaaS Rules remain isolated from legacy authorization.
No legacy path is tenant-aware.
No SaaS authorization depends on users/{uid}.role.
No legacy block is approved for removal.
No Firebase deployment was performed.
```

## 2. Sources and method

The complete mandatory documentation set, `firestore.rules`,
`evidence/FIRESTORE_RULES_LEGACY_REFERENCE.rules`, and Firestore consumers under
`src/` were read directly. SDK operations and collection/path literals were
searched globally. The legacy comparison removed only comments, whitespace,
the shared wrapper and the relocated final catch-all; helpers, paths, casing,
operators, field lists and allow expressions remained significant.

The normalized legacy bodies both contain 5,107 functional characters and are
equal. The Rules file SHA-256 at audit start is
`68B97B79EB60A4CF5B747EE078ED98BFF1C4AEFCAA9756D4F64B14ECA3AE8E55`.

## 3. Composite architecture

| Zone | Authority | Current purpose | Cross-use | Result |
|---|---|---|---|---|
| Legacy helpers and matches | Auth plus `users/{uid}` and global `role == admin` | Keep existing consumers functional | No SaaS match calls a legacy helper | Isolated, temporary |
| SaaS helpers and canonical matches | Identity ownership, tenant path, Membership, explicit role/status | Local implementation of approved SaaS reads | No legacy match calls a SaaS helper | Isolated, not deployed |
| Collection-group matches | Embedded `uid` ownership for Membership and Request | Self multi-tenant list contracts | No writes; no legacy collection uses either name | Safe with naming review gate |
| Final catch-all | unconditional deny | Deny every unmatched operation | Applies without widening any earlier match | Safe |

Legacy admin is neither `tenant_admin` nor `platform_admin`. No platform claim
or legacy admin condition bypasses tenant isolation in the SaaS zone.

## 4. Legacy helper inventory

| Helper | Current paths | Authority source | SaaS usage | Legacy dependency and risk | Migration destination | Retirement condition |
|---|---|---|---:|---|---|---|
| `isAuthenticated` | authenticated legacy paths | Auth session | No | broad authentication only | `saasIsAuthenticated` by SaaS operation | all callers migrated and tested |
| `isOwner` | users/progress | path uid | No | no Tenant scope | Identity/self or modeled ownership | user/progress consumers migrated |
| `userDocumentExists` | admin/forum helpers | `users/{uid}` existence | No | mixed legacy document | bounded SaaS roots | admin/forum consumers migrated |
| `currentUserData` | admin/forum helpers | `users/{uid}` data | No | mixed identity/authority | Identity, Membership, moderation roots | no legacy authority consumer |
| `isAdmin` | users, academic, tests, forum, AI, support | `users.role == admin` | No | global privilege | scoped capability plus trusted backend | bootstrap and every admin consumer migrated |
| `isForumAllowed` | posts/replies/reports | `users.forumBlocked` | No | global moderation | future tenant-aware moderation | forum migration complete |
| `isNotChangingRole` | users update | stored/incoming diff | No | protects only `role` | strict operation allowlist | legacy user writes retired |
| `incomingUserMatches` | owned creates | incoming `userId` | No | client-controlled payload | canonical immutable ownership | related writes migrated |
| `existingUserMatches` | owned updates | stored `userId` | No | no Tenant scope | canonical immutable ownership | related writes migrated |
| `validOwnedCreate` | progress descendants | auth plus incoming owner | No | incomplete field protection | operation-specific Rules/backend | progress migration complete |
| `validOwnedUpdate` | progress descendants | auth plus stored/incoming owner | No | broad client delta | operation-specific Rules/backend | progress migration complete |

```text
Legacy helper used by SaaS Rules = No
```

## 5. SaaS helper inventory

There are 57 SaaS helpers. All fail closed when required data, paths, IDs,
statuses or ownership do not match.

| Domain | Helpers | Purpose / related reads | Legacy dependency | Isolation and cost |
|---|---|---|---|---|
| Authentication and Identity | `saasIsAuthenticated`, `saasIsSelf`, `saasIdentityChangedFieldsAllowed`, `saasIdentityFieldTypesValid`, `saasIdentityUpdatedAtValid` | self ownership and strict update delta; no related read | None | uid path equality; 0 related reads |
| Tenant resolution | `saasTenantPath`, `saasTenantExists`, `saasTenantData`, three status helpers, `saasTenantReadableByApprovedMember` | Tenant existence/status and approved-member get | None | exact tenant path; Tenant plus Membership resolution |
| Membership resolution | `saasUidKey`, key path/existence/id helpers, Membership path/existence/data, `saasHasApprovedMembership` | internal key and Membership resolution | None | uid, tenantId, ID and approved status; bounded cached reads |
| Tenant roles | `saasHasTenantRole`, `saasIsStudent`, `saasIsTeacher`, `saasIsTenantAdmin` | explicit Membership role | None | same approved Membership; no global role |
| Self Membership/Request | ownership, tenant, canonical-document, get/list and collection-group helpers | embedded uid/tenantId/path validation | None | fail closed; direct reads need no related document |
| Course | eight canonical/status/role/get helpers | Tenant plus approved Membership resolution | None | active Tenant and same tenant; bounded Rules reads |
| Enrollment | fourteen canonical/Membership/ownership/admin/get/list helpers | Tenant and referenced Membership; admin resolution | None | indirect self ownership or same-tenant admin; bounded Rules reads |

```text
SaaS helper used by legacy Rules = No
```

## 6. Legacy path inventory and compatibility classification

All legacy paths have `Tenant-aware = No`.

| Legacy path | Read / create / update / delete | Consumers and actor | SaaS destination | Classification | Risk | Removal gate |
|---|---|---|---|---|---|---|
| `users/{uid}` | self/admin; self; self-no-role/admin; admin | auth, profile, header, admin, course, forum | Identity plus scoped Membership/platform authority | SHADOW_WITH_SAAS | Critical | mixed-field data and every consumer migrated |
| `users/{uid}/progress/{id}` | self/admin; self/admin; self/admin; admin | progress/course/home/profile | future progress model | KEEP_TEMPORARILY | High | enrollment-aware parity and history verified |
| `users/{uid}/topicProgress/{id}` | self/admin owned CRUD | topic progress/pages | future progress model | KEEP_TEMPORARILY | High | model, consumers and history migrated |
| `.../attempts/{id}` | self/admin owned CRUD | mission attempt service | future attempt model | KEEP_TEMPORARILY | High | attempt history reconciled |
| `levels/{id}` | public; admin C/U/D | course UI/services | tenant academic model | MIGRATE_THEN_REMOVE | Critical | Tenant mapping and cutover |
| `levels/{id}/lessons/{id}` | public; admin C/U/D | lesson/navigation/AI | tenant academic model | MIGRATE_THEN_REMOVE | Critical | data and consumers migrated |
| `levels/{id}/modules/{id}` | public; admin C/U/D | module/course/Welcome | tenant academic model | MIGRATE_THEN_REMOVE | Critical | data and consumers migrated |
| `.../modules/{id}/lessons/{id}` | public; admin C/U/D | module/course/navigation | tenant academic model | MIGRATE_THEN_REMOVE | Critical | dual hierarchy reconciled |
| `temas/{id}` | public; admin C/U/D | topic catalog/pages/admin | future academic submodel | MIGRATE_THEN_REMOVE | High | model and consumers migrated |
| `temas/{id}/Lessons/{id}` | public; admin C/U/D | legacy lesson/presentation access | future academic submodel | REMOVE_AFTER_CONSUMER_RETIREMENT | High | casing/data/manual inspection complete |
| `temas/{id}/missions/{id}` | public; admin C/U/D | mission services/pages | future mission model | MIGRATE_THEN_REMOVE | High | mission model and consumers migrated |
| `tests/{id}` | public; admin C/U/D | test services/pages | future test model | KEEP_TEMPORARILY | High | replacement operational |
| `tests/{id}/sections/{id}` | public; admin C/U/D | test repository | future test model | KEEP_TEMPORARILY | High | sections migrated and verified |
| `userTests/{id}` | self/admin owned access | test/history/admin | future results model | KEEP_TEMPORARILY | High | Membership/Enrollment-aware results migrated |
| `presentations/{id}` | public; owned C; owner/admin U/D | presentation service | tenant Course-related content | HARDEN_BEFORE_MIGRATION | High | consumer/data/URL inspection and replacement |
| `forums/{level}/posts/{id}` | auth read; forum-allowed C; broad shared-field U; owner/admin D | forum UI/moderation | future tenant forum | HARDEN_BEFORE_MIGRATION | Critical | counters and tenant-aware redesign tested |
| `.../replies/{id}` | auth read; forum-allowed C; owner/admin U/D | ReplyModal | future tenant forum | HARDEN_BEFORE_MIGRATION | High | forum migration complete |
| `forumReports/{id}` | admin read/U/D; reporter C | report/moderation service | future moderation | KEEP_TEMPORARILY | High | moderation workflow migrated |
| `aiGeneratedLessons/{id}` | admin CRUD | no direct literal consumer proven | future tenant content/backend | DENY_AFTER_MANUAL_VERIFICATION | Medium | data and dynamic-use inspection |
| `messages/{id}` | admin read/U/D; constrained anonymous C | Welcome/contact/support | separate public contact boundary | SEPARATE_PUBLIC_FEATURE | Critical | replacement endpoint and smoke test |
| `supportTickets/{id}` | self/admin read; self C; admin U/D | support service | future tenant-aware support | KEEP_TEMPORARILY | High | support ownership decision and migration |

No block is ready for removal.

## 7. SaaS paths and current operational state

| SaaS path | Read status | Write status | Actor/isolation | Legacy overlap | Phase / test / deploy |
|---|---|---|---|---|---|
| `identities/{uid}` | self | limited self update only | exact uid; global Identity | none with `users` | C.2B local; tests pending; not deployed |
| `tenants/{tenantId}` | approved member get for active/suspended | deny | key plus approved same-tenant Membership | none | C.2C local; tests pending; not deployed |
| `configuration/settings` | deny | deny | none | none | reserved; not deployed |
| `configuration/branding` | deny | deny | none | none | reserved; not deployed |
| `registrationRequests/{requestId}` | self get/list and self collection-group | deny | embedded uid and tenantId | none | C.2D local; tests pending; not deployed |
| `registrationRequestKeys/{uidKey}` | deny | deny | internal only | none | reserved; not deployed |
| `memberships/{membershipId}` | self get/list and self collection-group | deny | embedded uid and tenantId | none | C.2D local; tests pending; not deployed |
| `membershipKeys/{uidKey}` | deny | deny | internal Rules lookup only | none | reserved; not deployed |
| `courses/{courseId}` | role/status tenant-scoped | deny | active Tenant and approved Membership | none with global academic paths | C.2E-B local; tests pending; not deployed |
| `enrollments/{enrollmentId}` | self historical or active-tenant admin | deny | referenced Membership or approved admin | none with progress | C.2E-B local; tests pending; not deployed |

No SaaS path permits anonymous access. No client has direct platform bypass.
Lookup documents remain inaccessible. SaaS repositories, consumers and data
migrations were not found; Rules implementation does not imply operability.

## 8. Match overlap audit

| Target | Matching blocks | Allowed operations | Potential overlap | Result |
|---|---|---|---|---|
| legacy paths | exact/nested legacy plus catch-all | unchanged legacy policy | catch-all deny cannot widen | SAFE |
| Identity | direct Identity plus catch-all | self read/limited update | no legacy match shares path | SAFE |
| Tenant root/subcollections | tenant hierarchy plus catch-all | explicit per child | parent match does not automatically grant children | SAFE |
| Membership | tenant direct, recursive collection-group, catch-all | own get/list; no writes | recursive list requires uid ownership | SAFE |
| RegistrationRequest | tenant direct, recursive collection-group, catch-all | own get/list; no writes | recursive list requires uid ownership | SAFE |
| Course | tenant direct plus catch-all | role/status get/list; no writes | no recursive Course match | SAFE |
| Enrollment | tenant direct plus catch-all | bounded get/list; no writes | no recursive Enrollment match | SAFE |
| `Lessons` versus `lessons` | distinct legacy paths | legacy only | case-sensitive duplication | REVIEW_REQUIRED, not unsafe overlap |

No `UNSAFE` overlap exists. The two collection-group rules allow list only,
require `resource.data.uid == request.auth.uid`, and do not match a current
legacy collection. A future collection named `memberships` or
`registrationRequests` requires mandatory Rules review. There is no Course or
Enrollment collection-group match.

## 9. Consumer reconciliation

Global SDK searches confirm active legacy consumers across auth/profile/admin,
course/module/lesson, progress/topic attempts, tests/results, forum/moderation,
presentations, messages and support. Representative dependencies remain:

| Files/features | Legacy paths / operations | Can retire | Prerequisite |
|---|---|---:|---|
| auth service, Login, Header, Profile, Admin | users get/list/set/update/delete | No | Identity and authority migration |
| course/module/lesson services and pages | levels hierarchy get/list/CRUD | No | tenant academic repository and data |
| topic/mission services and pages | temas hierarchy get/list/CRUD | No | future academic/mission model |
| progress and attempt services | users progress/topicProgress/attempts | No | Enrollment-aware progress model |
| test repository/auth service | tests/sections/userTests | No | future test/results model |
| presentation methods | presentations query/add/update | No | ownership hardening and audio retirement |
| forum UI and moderation | forums/replies/forumReports CRUD | No | tenant forum and counter design |
| Welcome/support | messages/supportTickets add/read | No | public-contact/support replacements |

No functional code literal for the canonical SaaS collections, no SaaS
repository, no migrated SaaS data evidence and no deployment evidence were
found. Their state is therefore: local Rules implemented, repository not
implemented, consumer not migrated, data not migrated, deployment not
performed.

## 10. Retirement gates

Every legacy block requires all of the following before removal:

1. data migrated and reconciled;
2. consumer and repository migrated;
3. queries migrated and authorized by their Rules contracts;
4. Rules tests passed;
5. functional smoke tests passed;
6. rollback available and rehearsed;
7. production verification completed;
8. explicit human approval obtained.

```text
Ready to remove = No
```

This applies to every legacy block, including `aiGeneratedLessons` pending
manual verification.

## 11. Legacy–SaaS boundaries

| Concern | Legacy authority/model | SaaS authority/model | Coexistence risk | Current separation | Migration gate |
|---|---|---|---|---|---|
| Authentication | Auth session | Auth session as prerequisite | low | separate helpers | auth regression tests |
| Identity/profile | mixed `users` | global `identities` | field divergence | distinct paths | field mapping and cutover |
| Roles | global `users.role` | Membership role/platform backend | privilege confusion | no shared helper | bootstrap and capability tests |
| Tenant Membership | absent | key plus Membership | legacy cannot isolate | SaaS-only paths | membership data migration |
| Platform administration | global admin | trusted backend | accidental bypass | direct client bypass absent | backend/bootstrap review |
| Academic content | public global levels/temas | tenant Course plus future submodels | exposure during coexistence | distinct paths | tenant mapping and consumer migration |
| Course | legacy level hierarchy | tenant Course | semantic mismatch | distinct paths | academic repository/data |
| Enrollment/progress | uid progress/results | Enrollment plus future progress | false equivalence | distinct roots | enrollment-aware progress design |
| Tests | global tests/userTests | future test domain | public/result exposure | no forced mapping | test model and migration |
| Forum | global user/forum authority | future tenant forum | cross-tenant exposure | outside current SaaS paths | forum redesign |
| Support | global/self support | future tenant support | missing tenantId | outside current SaaS paths | support ownership decision |
| Public contact | anonymous messages | separate public boundary | abuse/PII | not treated as private SaaS | replacement API/hardening |
| Storage | residual upload | excluded | legacy code can fail under deny | `storage.rules` deny-all | functional retirement |

Explicitly: legacy admin is not `tenant_admin` or `platform_admin`;
`users/{uid}` is not `identities/{uid}`; legacy progress is not Enrollment;
legacy levels are not Tenant Courses.

## 12. No-Storage

Firebase Storage remains outside the current SaaS target and `storage.rules`
remains deny-all. `src/firebase.js` still initializes Storage and
`src/services/auth/firestoreService.js` still exports `uploadAudio` using
`uploadBytes` and `getDownloadURL`. This is a legacy residual dependency, is not
approved for SaaS, was not removed here, and must be retired functionally before
legacy presentation cleanup.

## 13. Risks

| Severity | Findings |
|---|---|
| Critical | No new compatibility defect found. Existing legacy risks remain: global admin, public academic content, anonymous messages and lack of tenant isolation. Any future cross-use of helper families or unsafe overlap would be blocking. |
| High | Client-controlled progress/results, public presentations, mutable forum counters/likes, unknown fields, broad legacy admin deletes and public/contact abuse. |
| Medium | Reserved collection-group names, `Lessons` casing, inconsistent timestamps, consumers without adapters, and local Rules without repositories/tests/data. |
| Low | Documentation drift and apparently unused paths pending manual verification. |
| Observation | The compound local ruleset is not deployed; compatibility preserves risks temporarily rather than approving them as SaaS behavior. |

## 14. Rules file state

| Metric | Result |
|---|---:|
| SHA-256 before audit | `68B97B79EB60A4CF5B747EE078ED98BFF1C4AEFCAA9756D4F64B14ECA3AE8E55` |
| SHA-256 after audit | `68B97B79EB60A4CF5B747EE078ED98BFF1C4AEFCAA9756D4F64B14ECA3AE8E55` |
| Lines | 882 |
| Legacy helpers | 11 |
| SaaS helpers | 57 |
| Legacy matches | 21 |
| Canonical SaaS matches | 10 |
| Collection-group matches | 2 |
| Final catch-all | 1 |

The final validation confirmed that the before and after hashes are equal.

## 15. Closure criteria and next gate

All SaaS-02C.2F criteria comply: exact legacy semantics, complete helper/path
inventories, isolated helper families, safe overlaps, bounded collection-group
rules, identified consumers/states, complete classifications and retirement
gates, no block ready for removal, documented boundaries and no-Storage, and no
Rules/Firebase/application mutation.

```text
SaaS-02C.2F legacy/SaaS Rules compatibility closure = COMPLETE
SaaS-02C.2G = next, not started
```

SaaS-02C.2G is the selective hardening of legacy public and client-writable
blocks without breaking current consumers. It requires mandatory human review
of this compatibility closure and must not start from this report.

## 16. Human approval and SaaS-02C.2G-A

The mandatory SaaS-02C.2F compatibility review was approved. Compatibility
remains valid: SaaS-02C.2G-A only produced the linked
`FIRESTORE_LEGACY_SELECTIVE_HARDENING_PLAN.md`; it did not modify Rules or mark
any legacy block ready for retirement. Exact `SAFE_TO_HARDEN_NOW` proposals
still require a separate human hardening review before implementation.
