# Firestore Legacy Rules Reconciliation

## 1. Scope and authority

This SaaS-02C.1B report reconciles three distinct sources:

1. the **Authoritative user-provided legacy Rules reference**, which describes
   the permissions required by the monoinstitutional application;
2. the current Firebase SDK consumers under `src/`;
3. the approved Domain 1.2.0 SaaS Rules design.

The supplied reference is authoritative for legacy compatibility, but it is not
the normative source for SaaS authorization. The checked-in `firestore.rules`
remains the SaaS-01A deny-all scaffold and was not changed. No assertion is made
about a remotely deployed ruleset.

The current SaaS target does not use Firebase Storage. Existing Storage code is
a residual legacy dependency to retire, not an approved target capability.

## 2. Legacy helper matrix

| Helper | Purpose and authority | Paths | Classification | Limitation/risk | SaaS replacement | Temporary use / retirement |
|---|---|---|---|---|---|---|
| `isAuthenticated()` | Auth session exists | authenticated legacy blocks | REUSABLE_CONCEPT | authentication alone grants no tenant scope | authenticated SaaS helper | retain only in compatibility blocks; retire with them |
| `isOwner(userId)` | `request.auth.uid == userId` | users and self children | REPLACE_WITH_SAAS_HELPER | path ownership is not Membership authorization | exact self/path ownership | required until self consumers migrate |
| `userDocumentExists()` | reads `users/{uid}` | helpers depending on legacy profile | LEGACY_ONLY | couples every decision to mixed user document | bounded Identity/Membership existence | retire after Identity bootstrap and admin/forum split |
| `currentUserData()` | returns `users/{uid}` | admin/forum/user decisions | UNSAFE_FOR_MULTI_TENANT | mixes profile, role and moderation | explicit Identity, Membership and platform authority reads | temporary only for legacy blocks |
| `isAdmin()` | `users/{uid}.role == "admin"` | user/admin/academic/test/forum/AI blocks | UNSAFE_FOR_MULTI_TENANT | neither tenant_admin nor platform_admin; global privilege | capability plus scoped authority/backend | retain only until every admin consumer and bootstrap migrates |
| `isForumAllowed()` | authenticated and not `forumBlocked` | forums/replies/reports | TEMPORARILY_REQUIRED | global flag, no tenant or forum scope | future tenant-aware moderation | retire in forum redesign |
| `isNotChangingRole()` | preserves legacy `users.role` | users update | LEGACY_ONLY | protects only one sensitive field | immutable/allowlisted field rules and backend authority | retire with legacy user writes |
| `incomingUserMatches(userId)` | incoming `userId` equals actor | owned creates | REPLACE_WITH_SAAS_HELPER | client still controls other fields | exact owner/ref/field validation | required for legacy creates only |
| `existingUserMatches(userId)` | stored `userId` equals actor | owned updates/deletes | REPLACE_WITH_SAAS_HELPER | does not prove tenant scope | immutable reference and self scope | retire per migrated consumer |
| `validOwnedCreate(userId)` | auth plus incoming owner checks | progress/results/content | TEMPORARILY_REQUIRED | incomplete schema/unknown-field protection | operation-specific allowlist/backend | retain only in compatibility section |
| `validOwnedUpdate(userId)` | auth plus stored owner and sensitive-field checks | progress/results/content | TEMPORARILY_REQUIRED | broad client delta risk | operation-specific delta validation | retire after consumer migration |

No legacy helper is copied into the SaaS model verbatim.

## 3. Legacy Rules matrix

The policies below record the supplied functional reference. “Admin” always
means legacy `users.role == "admin"`.

| Path | Legacy actor | Read | Create | Update | Delete | Current consumer | Risk | Primary status | Future destination / removal gate |
|---|---|---|---|---|---|---|---|---|---|
| `users/{uid}` | self/admin | self or admin | self | self without role change; admin | admin | auth/profile/header/admin/course/forum | Critical | SHADOW_WITH_SAAS | Identity + Membership/platform authority; remove after all mixed-field consumers migrate |
| `users/{uid}/progress/{id}` | self/admin | owner/admin | owner | owner | owner/admin | progress/course/home/profile | High | KEEP_TEMPORARILY | FUTURE_PROGRESS_SUBMODEL; enrollment-aware parity required |
| `users/{uid}/topicProgress/{id}` | self/admin | owner/admin | owner | owner | owner/admin | topic progress/pages | High | KEEP_TEMPORARILY | FUTURE_PROGRESS_SUBMODEL |
| `.../topicProgress/{id}/attempts/{id}` | self/admin | owner/admin | owner with matching payload | owner | owner/admin | mission attempt service | High | KEEP_TEMPORARILY | FUTURE_PROGRESS_SUBMODEL; retain history |
| `levels/{id}` | public/admin | public | admin | admin | admin | Welcome/Home/Curso/course service | Critical | MIGRATE_THEN_REMOVE | FUTURE_ACADEMIC_SUBMODEL; tenant mapping and consumer cutover |
| `levels/{id}/lessons/{id}` | public/admin | public | admin | admin | admin | lesson manager/AI generator/navigation | Critical | MIGRATE_THEN_REMOVE | FUTURE_ACADEMIC_SUBMODEL |
| `levels/{id}/modules/{id}` | public/admin | public | admin | admin | admin | module/course/Welcome | Critical | MIGRATE_THEN_REMOVE | FUTURE_ACADEMIC_SUBMODEL |
| `.../modules/{id}/lessons/{id}` | public/admin | public | admin | admin | admin | module/course/navigation | Critical | MIGRATE_THEN_REMOVE | FUTURE_ACADEMIC_SUBMODEL |
| `temas/{id}` | public/admin | public | admin | admin | admin | topic catalog/pages/admin | High | MIGRATE_THEN_REMOVE | FUTURE_ACADEMIC_SUBMODEL |
| `temas/{id}/Lessons/{id}` | public/admin | public | admin | admin | admin | legacy presentation/lesson access | High | REMOVE_AFTER_CONSUMER_RETIREMENT | casing/data inspection and consumer removal |
| `temas/{id}/missions/{id}` | public/admin | public | admin | admin | admin | mission services/pages/admin | High | MIGRATE_THEN_REMOVE | FUTURE_PROGRESS_SUBMODEL/academic extension |
| `tests/{id}` | public/admin | public | admin | admin | admin | test service/pages/admin | High | KEEP_TEMPORARILY | FUTURE_TEST_SUBMODEL |
| `tests/{id}/sections/{id}` | public/admin | public | admin | admin | admin | test repository batch/reads | High | KEEP_TEMPORARILY | FUTURE_TEST_SUBMODEL |
| `userTests/{id}` | owner/admin | matching user/admin | matching user | owner | owner/admin | auth service/Home/Profile/Admin | High | KEEP_TEMPORARILY | FUTURE_TEST_SUBMODEL plus Membership/Enrollment context |
| `presentations/{id}` | public/owner/admin | public | authenticated/owned | owner/admin, including comments | owner/admin | presentation methods | High | HARDEN_BEFORE_MIGRATION | Course/tenant content; Firestore documents only |
| `forums/{level}/posts/{id}` | public/auth/owner/admin | public | authenticated and forum-allowed | owner/admin plus shared like/count fields | owner/admin | Foro/Like/Reply/moderation | Critical | HARDEN_BEFORE_MIGRATION | FUTURE_FORUM_SUBMODEL; tenant-aware redesign |
| `.../posts/{id}/replies/{id}` | public/auth/owner/admin | public | authenticated and forum-allowed | owner/admin | owner/admin | ReplyModal | High | HARDEN_BEFORE_MIGRATION | FUTURE_FORUM_SUBMODEL |
| `forumReports/{id}` | reporter/admin | admin (and own where supplied) | authenticated | admin | admin | report/moderation services | High | KEEP_TEMPORARILY | FUTURE_FORUM_SUBMODEL |
| `aiGeneratedLessons/{id}` | admin | admin | admin | admin | admin | no direct consumer found | Medium | DENY_AFTER_MANUAL_VERIFICATION | inspect data/dynamic use, then retire; future content tenant-owned |
| `messages/{id}` | anonymous/admin | admin | public constrained create | admin | admin | Welcome/support service | Critical | SEPARATE_PUBLIC_FEATURE | public-contact backend/API design; preserve form until replacement |
| `supportTickets/{id}` | owner/admin | self/admin | authenticated matching owner | self/admin as supplied | admin | support service | High | KEEP_TEMPORARILY | FUTURE_SUPPORT_SUBMODEL with tenant decision |

All blocks start `Ready to remove = No`. Exact field validation from the
owner-provided source must be preserved when a compatibility ruleset is later
implemented and tested; this report does not generate executable syntax.

## 4. Paths used by code but not represented by an explicit legacy block

No additional Firestore collection literal was proven outside the matrix. The
code does expose structural duplication (`levels/.../lessons` and
`levels/.../modules/.../lessons`) and case-sensitive `temas/.../Lessons`.
Firebase Storage `presentations/*` is not a Firestore path and is handled as a
residual dependency below.

## 5. Consumer matrix

| File/module group | Path | SDK operation | Actor/assumption | Legacy/SaaS | Migration dependency |
|---|---|---|---|---|---|
| `auth/firestoreService`, Login, Header, Admin, Profile/EditProfile, Curso/Foro | `users` | point/list/create/update/delete | self or global admin | Legacy | Identity bootstrap, Membership/platform authority, forum split |
| progress service, Home/Profile/course navigation | `users/*/progress` | point/list/set/update | path owner | Legacy | progress model and Enrollment mapping |
| topic progress/attempt services, Tema/Mission pages | `users/*/topicProgress[/attempts]` | point/list/add/update | path/payload owner | Legacy | progress/attempt history migration |
| course/module/lesson services, Welcome/Home/Curso, AI generator | `levels[/modules/lessons]` | point/list/CRUD | public read/admin write | Legacy | tenant-owned academic submodel |
| topic/mission services and pages/admin | `temas[/Lessons/missions]` | point/list/CRUD | public read/admin write | Legacy | future topic/mission model |
| test repository/service/pages/admin | `tests[/sections]` | point/list/batch/CRUD | public/admin | Legacy | future test model |
| auth service, Home/Profile/Admin | `userTests` | query/add/update | self/admin | Legacy | results migration |
| presentation methods in auth service | `presentations` | query/add/update | public/auth/owner | Legacy | content migration and audio removal |
| Foro, LikeButton, ReplyModal, moderation | `forums/*/posts[/replies]` | query/add/update/delete | public/auth/owner/admin | Legacy | tenant-aware forum |
| ReportPostButton/moderation | `forumReports` | add/list/update/delete | reporter/admin | Legacy | moderation redesign |
| Welcome and support service | `messages` | anonymous add | public | Legacy public | separate contact security |
| support service | `supportTickets` | authenticated add | self | Legacy | support domain |

The SDK search identifies 32 Firestore consumer files. Grouping above is only
used where modules share the same collection pattern.

## 6. Legacy users decomposition and administration

Observed fields include `uid`, `name`, `lastName`, `displayName`, `email`,
`emailVerified`, `photoURL`, `age`, `ageGroup`, `country`, `role`, `isActive`,
`accountType`, `organizationId`, `organizationMembershipStatus`, `level`,
progress/XP-derived data, `forumBlocked`, its reason/time, and timestamps.

| Concern | Fields | Destination |
|---|---|---|
| Identity | uid, email, emailVerified, display/name, external provider photoURL, personal profile | `identities/{uid}` subject to Domain 1.2.0 |
| Membership | organizationId/status only after semantic mapping | tenant Membership, never copied mechanically |
| Platform administration | role=admin/user | controlled platform authority/bootstrap, not Identity |
| Tenant administration | none safely inferable from global role | future Membership capability |
| Progress | level, progress, XP, test-derived fields | future progress/test model |
| Forum moderation | forumBlocked/reason/time | future forum moderation model |
| Legacy compatibility | age/ageGroup/accountType and mixed timestamps | retain until ownership/data decision |
| Unknown | ad-hoc deployed fields | data inspection before migration |

`DEFAULT_ADMINS`, `isAdmin()`, AdminRoute/Header/Admin, global user operations,
academic CRUD and forum moderation form one legacy authority bridge. It must not
create Memberships or become permanent SaaS authorization. Retirement requires
verified platform bootstrap/recovery, migrated consumers, Rules tests and smoke
tests.

## 7. Public academic content, progress and tests

The supplied rules grant public reads to the global academic/test hierarchy.
Current pages depend on those reads, while SaaS content is tenant-owned and not
anonymous. The temporary compatibility section therefore cannot be removed or
restricted before tenant mapping, shadow reads, consumer cutover and rollback.

Client-writable progress, topic progress, attempts and user tests are owned by
uid but lack Membership/Enrollment/Course context. They may be manipulated if
field validation is broad. They remain historical self data until future models
provide equivalent semantics; no physical progress model is introduced here.

## 8. Presentations, forum, messages, support and AI

- `presentations` remains a Firestore-document feature with public exposure and
  unclear Course/Tenant ownership. Audio URLs are residual and not approved.
- Forum is a `TEMPORARY_LEGACY_GLOBAL_FEATURE` and
  `REQUIRES_TENANT_AWARE_REDESIGN`. Client likes, `likedBy`, `repliesCount` and
  non-owner shared-field changes have race/manipulation risks.
- `forumReports` remains a temporary moderation path tied to global admin.
- `aiGeneratedLessons` has no direct literal consumer; the current generator
  writes `levels/.../lessons`. Data and indirect calls must be inspected before
  denial/removal.
- `messages` is `SEPARATE_PUBLIC_CONTACT_FEATURE`; anonymous creation presents
  spam, PII, size/type, overposting, XSS and rate-control risks. A future backend
  or public API is recommended without removing the current form prematurely.
- `supportTickets` is `TEMPORARY_LEGACY_SELF_SUPPORT` and
  `FUTURE_TENANT_AWARE_SUPPORT_DOMAIN`.

## 9. Public permissions matrix

| Path | Public permission | Reason/consumer | Sensitive risk | Restrict now | Migration required |
|---|---|---|---|---|---|
| levels/modules/lessons | read | Welcome/course UI | curriculum/cross-tenant exposure | No | tenant academic reads |
| temas/Lessons/missions | read | topics/missions | global ownership leakage | No | topic/mission model |
| tests/sections | read | test UI | assessment disclosure | No | test model |
| presentations | read | presentation UI | institutional/user content and residual URLs | No | ownership/data/consumer cutover |
| forums/posts/replies | read | forum UI | global posts/identity data | No | tenant-aware forum |
| messages | create | contact form | PII/spam/abuse | No, not without replacement | separate public endpoint/hardening |

## 10. No-Storage decision and dependency matrix

**The current SaaS target does not use Firebase Storage.** Storage paths,
ownership, Rules, Media, buckets and file migration are outside this target.
`storage.rules` remains deny-all.

| File | Function/operation | Caller/feature | Path | Active | Approved in SaaS | Classification | Replacement / retirement |
|---|---|---|---|---:|---:|---|---|
| `src/firebase.js` | `getStorage(app)` export | imported by auth Firestore service | bucket from environment | Yes as initialization | No | ACTIVE_LEGACY_DEPENDENCY | remove only in later functional cleanup after caller retirement |
| `src/services/auth/firestoreService.js` | `ref`, `uploadBytes`, `getDownloadURL`; `uploadAudio` | exported presentation/audio helper; no direct UI caller proven | `presentations/{timestamp}_audio.wav` | callable residual | No | ACTIVE_LEGACY_DEPENDENCY + REQUIRES_DATA_INSPECTION | disable/remove audio feature after consumer/data inspection |
| interactive AudioRecorder | browser `blob:` URL only | local recording UI | none | Yes, local only | Not Storage | REQUIRES_UI_ADJUSTMENT only if persistence expected | keep local preview or remove persistence expectation |
| domain/docs `photoURL` | external URL reference | Identity profile | no Storage path | Yes conceptually | Yes, external/null | not a Storage dependency | provider URL or null; initials/generated avatar otherwise |

No `uploadBytesResumable`, `deleteObject`, `listAll` or `getMetadata` consumer was
found. No new audio/binary upload is preserved in the target. Existing URLs and
whether any data was uploaded require later inspection without importing them
into the SaaS model.

## 11. Primary classification by legacy block

- **KEEP_TEMPORARILY:** progress, topicProgress/attempts, tests/sections,
  userTests, forumReports, supportTickets.
- **HARDEN_BEFORE_MIGRATION:** presentations and forum/posts/replies.
- **SHADOW_WITH_SAAS:** users while Identity/Membership/platform authority are
  introduced.
- **MIGRATE_THEN_REMOVE:** levels/modules/lessons and temas/missions.
- **REMOVE_AFTER_CONSUMER_RETIREMENT:** case-sensitive `temas/.../Lessons`,
  users role/moderation compatibility and residual Storage calls.
- **DENY_AFTER_MANUAL_VERIFICATION:** `aiGeneratedLessons` only.
- **SEPARATE_PUBLIC_FEATURE:** messages/contact.
- **OUT_OF_SCOPE:** new binary media/Storage architecture and legal retention.

Each classification requires consumer evidence, data verification, smoke tests
and rollback before contraction.

## 12. Coexistence and implementation order

`expand → shadow → migrate → verify → enforce → contract` is canonical:

1. Expand SaaS paths in deny-by-default shadow mode without removing legacy.
2. Shadow new providers/repositories without changing visible behavior.
3. Migrate only after mappings and ownership are defined; no automatic
   dual-write. Controlled dual-read is fallback only.
4. Verify counts, references, ownership, authorization and UX.
5. Enforce tenant-aware Rules progressively with tests and monitored cohorts.
6. Contract only after migration, reconciliation, smoke tests and rollback.

Recommended sequence:

1. C.2A SaaS paths in deny-by-default shadow mode.
2. C.2B Identity self Rules.
3. C.2C Tenant and Membership read helpers.
4. C.2D RegistrationRequest and Membership self reads.
5. C.2E Course and Enrollment tenant-scoped reads.
6. C.2F preserve required legacy blocks in an explicit compatibility section.
7. C.2G harden public/client-writable legacy blocks without breaking consumers.
8. C.2H materialize required indexes.
9. C.2I design SaaS plus compatibility Rules tests.
10. C.2J reconciliation and readiness review.

No microphase is started by this document.

## 13. Retirement matrix

| Legacy block | Data migrated | Consumer migrated | Rules tests | Smoke tests | Rollback | Ready to remove |
|---|---:|---:|---:|---:|---:|---:|
| users/auth/admin | No | No | No | No | Required | No |
| academic/topic content | No | No | No | No | Required | No |
| progress/tests/results | No | No | No | No | Required | No |
| presentations/forum/reports | No | No | No | No | Required | No |
| messages/support | No | No | No | No | Required | No |
| aiGeneratedLessons | Unknown | Unknown | No | No | Required | No |
| Storage initialization/uploadAudio | N/A/data inspection | No | N/A | No | Required | No |

## 14. Risks

| Severity | Findings |
|---|---|
| Critical | no tenant isolation; global admin; public academic content; anonymous messages; mixed users authority; destructive legacy replacement would break consumers |
| High | client-controlled progress/results; forum counters/likes/ownership; public presentations; tenantless support; global AI/content; broad deletes/updates; unknown fields |
| Medium | casing/duplicated academic paths; timestamp inconsistency; query/rule coupling; legacy URLs and residual Storage code; App Check absent as complementary control |
| Low | apparently unused aiGeneratedLessons path pending verification; documentation drift risk |
| Observation | supplied Rules are compatibility evidence; checked-in Rules remain deny-all and SaaS design remains normative |

## 15. FLR backlog

| ID | Evidence | Severity | Treatment/phase | Blocks C.2A |
|---|---|---|---|---:|
| FLR-001 | owner supplied legacy Rules reference; local file is scaffold | Resolved evidence gap | preserve provenance and implement later only in tested compatibility section | No |
| FLR-002 | firebase initialization and `uploadAudio` | High | no-Storage decision; retire function/import after inspection in functional cleanup | No |
| FLR-003 | users.role, DEFAULT_ADMINS, isAdmin/admin consumers | Critical | shadow platform/tenant authority; preserve bridge until bootstrap/tests | No for shadow; blocks admin cutover |
| FLR-004 | messages public create | Critical | separate public-contact hardening/backend design | No for shadow |
| FLR-005 | global forum/counters/moderation | High | compatibility hardening then tenant-aware redesign | No for shadow |
| FLR-006 | public global academic consumers | Critical | preserve, shadow migrate, verify, then enforce | No for shadow; blocks contraction |
| FLR-007 | users mixes identity/authorization/moderation/progress | Critical | field-by-field migration and consumer retirement | No for shadow |
| FLR-008 | client-controlled progress/results | High | future progress/test model and Enrollment mapping | No for shadow |
| FLR-009 | no-Storage functional adjustment | High | remove binary persistence expectation; provider photoURL/null/avatar | No for shadow |

## 16. Closure criteria

| Criterion | Result |
|---|---|
| Supplied legacy Rules/helpers/paths reconciled | Cumple |
| Consumers, users/admin and public content identified | Cumple |
| Progress/tests/forum/presentations/messages/support audited | Cumple |
| Residual Storage dependencies and no-Storage decision documented | Cumple |
| Coexistence, matrices, risks and implementation order defined | Cumple |
| Firebase and functional code unchanged | Cumple |

```text
SaaS-02C.1B legacy Rules reconciliation = COMPLETE
SaaS-02C.2A = NOT STARTED
Storage architecture = not used in current SaaS target
Storage posture = deny-all
```

SaaS-02C.2 must begin in shadow deny-by-default mode. Legacy Rules must not be
removed until their consumers are migrated.

## 17. SaaS-02C.2F compatibility closure

The composed local ruleset was revalidated in
`FIRESTORE_RULES_LEGACY_SAAS_COMPATIBILITY_CLOSURE.md` after the local Identity,
Tenant, Membership, RegistrationRequest, Course and Enrollment read phases.
The normalized legacy semantics remain equal to the owner-provided evidence,
and legacy and SaaS helper families remain isolated.

All retirement gates remain unsatisfied: data, consumers, repositories and
queries are not migrated; Rules and smoke tests, rollback, production
verification and human approval remain pending. Consequently every legacy
block remains `Ready to remove = No`. This preserves the historical analysis
above while recording the current compatibility result.

## 18. SaaS-02C.2G-A selective hardening design

`FIRESTORE_LEGACY_SELECTIVE_HARDENING_PLAN.md` audits exact consumers and
payloads without changing Rules. Five create-only candidates are classified
`SAFE_TO_HARDEN_NOW`: messages, forum posts, replies, forum reports and support
tickets. They remain proposals pending human approval; all counter, result,
progress, presentation, users-admin, unknown-use and no-Storage changes are
blocked by their documented consumer, backend, manual-verification or
retirement prerequisites. No legacy block is ready for removal.
