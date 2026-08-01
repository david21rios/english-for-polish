# Auditoría de compatibilidad y transición de Firestore Rules legacy

## 1. Alcance, fuentes y limitación probatoria

Se revisaron las diecisiete fuentes normativas solicitadas, todo
`firestore.rules`, `tests/rules/` y los accesos SDK bajo `src/`. No se modificó
Firebase ni código.

El archivo local actual no contiene las Rules legacy descritas en el encargo.
Contiene exclusivamente un wildcard deny-all con comentario de scaffold
SaaS-01A. Los helpers `isAuthenticated`, `isOwner`, `userDocumentExists`,
`currentUserData`, `isAdmin`, `isForumAllowed`, `isNotChangingRole`,
`incomingUserMatches`, `existingUserMatches`, `validOwnedCreate` y
`validOwnedUpdate` no existen en el ruleset local. Algunas descripciones aparecen
sólo en auditorías históricas, que no prueban el ruleset desplegado vigente.

Por tanto, toda columna “Current policy” significa **deny por scaffold local**;
la política real que hoy mantiene usuarios funcionales es desconocida y no puede
inferirse sin recuperar un snapshot autoritativo. Esta discrepancia bloquea un
cutover seguro.

## 2. Helpers legacy

| Helper expected | Current purpose reported historically | Authority | Collections | Compatibility/class | Migration destination | Risk | Retirement prerequisite |
|---|---|---|---|---|---|---|---|
| isAuthenticated | Auth presence | Auth | broad | Reusable concept; absent locally | Authenticated helper SaaS | Low concept/high evidence | authoritative legacy rules snapshot |
| isOwner | path/data user equality | Auth+document | owned docs | Replaceable; absent | self ownership per canonical path | High | consumers migrated/tested |
| userDocumentExists | user profile existence | users | users/dependents | Legacy-only; absent | Identity/Membership checks | High | Identity bootstrap migrated |
| currentUserData | read users uid | users | broad | Unsafe for SaaS; absent | bounded Identity/Membership reads | Critical | remove role/forum dependencies |
| isAdmin | users uid role=admin | users.role | admin content | Unsafe for SaaS; absent | platform/tenant capability via backend | Critical | bootstrap/claims/registries verified |
| isForumAllowed | forumBlocked false | users | forum | Temporarily required concept; absent | future tenant-aware moderation | High | SaaS-11A migration |
| isNotChangingRole | preserve users.role | users | users | Legacy-only; absent | immutable Membership/Platform authority | High | legacy admin retired |
| incomingUserMatches | incoming userId matches Auth | payload | owned creates | Replaceable; absent | exact ownership/ref validation | High | per-path rules tests |
| existingUserMatches | existing userId matches Auth | stored data | owned updates | Replaceable; absent | immutable ownership | High | per-path rules tests |
| validOwnedCreate | auth + payload owner/shape | Auth/payload | owned docs | Replaceable; absent | canonical create/backend commands | High | consumer migration |
| validOwnedUpdate | owner + immutable role | Auth/old/new | owned docs | Replaceable; absent | allowlisted client deltas/backend | High | consumer migration |

No helper puede reutilizarse como implementación sin su fuente real. En
particular, `isAdmin` nunca representa student, teacher, tenant_admin o
platform_admin.

## 3. Inventario Legacy → SaaS

Todas las policies locales son read/create/update/delete deny. “Consumers” son
accesos reales detectados; “status” clasifica el bloque conceptual requerido para
compatibilidad, no una regla presente.

| Legacy path | Consumers/operations | Ownership | SaaS destination | Strategy/status | Target/removal gate | Risk |
|---|---|---|---|---|---|---|
| users/{uid} | firestoreService, Login, Header, Admin, Profile, Curso, Foro, ReplyModal, EditProfile, navigation; CRUD/admin | uid mixed with global role/forum/profile | Identity + Membership + future progress/forum | SHADOW_WITH_SAAS | identity/auth/admin/forum consumers migrated | Critical |
| users/{uid}/progress/{id} | progressService, Home/Profile/navigation; read/write/query | path uid | future SaaS-09 + Enrollment/Course | KEEP_TEMPORARILY | progress migration and parity | High |
| users/{uid}/topicProgress/{id} | topicProgressService, Home/Profile/Tema/MissionChat; read/write | path uid | future SaaS-09 | KEEP_TEMPORARILY | topic progress migrated | High |
| .../topicProgress/{id}/attempts/{id} | topicMissionAttemptService; add/read/list | path uid + payload userId | future SaaS-09 | KEEP_TEMPORARILY | attempt history migrated | High |
| levels/{levelId} | initializeData, courseService, Curso/Home/Welcome | global academic | future academic submodel/Course content | MIGRATE_THEN_REMOVE | all level consumers tenant-aware | Critical |
| levels/{levelId}/lessons/{id} | firestoreService, lessonManager, AILessonGenerator, navigation | global academic | future Module/Lesson | MIGRATE_THEN_REMOVE | lesson model + consumers | Critical |
| levels/{levelId}/modules/{id} | moduleService/courseService/Welcome/Home | global academic | future Module | MIGRATE_THEN_REMOVE | module model + consumers | Critical |
| .../modules/{id}/lessons/{id} | module/course/navigation services | global academic | future Lesson | MIGRATE_THEN_REMOVE | nested lesson consumers | Critical |
| temas/{temaId} | topicCatalog, mission services/pages/admin | global topic | future academic/mission submodel | MIGRATE_THEN_REMOVE | topic model and consumers | High |
| temas/{temaId}/Lessons/{id} | firestoreService legacy capitalization | global academic | future Lesson | REMOVE_AFTER_CONSUMER_RETIREMENT | capital-L consumers removed/data inspected | High |
| temas/{temaId}/missions/{id} | topicMissionService, Tema/MissionChat/admin | global mission | future SaaS-09/domain | MIGRATE_THEN_REMOVE | mission topology/consumers | High |
| tests/{testId} | testRepository/service/pages/admin | global test | future test domain | KEEP_TEMPORARILY | SaaS test model | High |
| tests/{testId}/sections/{id} | testRepository batch/read | test child | future test domain | KEEP_TEMPORARILY | sections migrated | High |
| userTests/{id} | firestoreService, Home/Profile/Admin; create/update/query | payload userId | future assessment + Membership | KEEP_TEMPORARILY | enrollment-aware results migration | High |
| presentations/{id} | firestoreService get/add/comment | payload ownership not uniformly enforced | future Course/Tenant content | HARDEN_BEFORE_MIGRATION | consumers/data/audio separated | High |
| forums/{level}/posts/{id} | Foro/Like/Reply/moderation; CRUD/counters/arrays | post.userId + global level | future SaaS-11A tenant forum | HARDEN_BEFORE_MIGRATION | tenant forum redesign | Critical |
| .../posts/{id}/replies/{id} | ReplyModal; add/list | reply.userId | future SaaS-11A | HARDEN_BEFORE_MIGRATION | replies tenant-aware | High |
| forumReports/{id} | ReportPostButton/moderation services | reporter/admin | future SaaS-11A moderation | KEEP_TEMPORARILY | report workflow migrated | High |
| aiGeneratedLessons/{id} | no literal/current consumer found | unknown | future tenant-owned academic/backend | DENY_IMMEDIATELY_IF_UNUSED candidate | data/manual verification + smoke test | Medium |
| messages/{id} | Welcome and supportService; anonymous create | public contact | separate public-contact design | HARDEN_BEFORE_MIGRATION | protected API/rate controls | Critical |
| supportTickets/{id} | supportService; authenticated create | payload userId/Auth | future support domain/tenant-aware | KEEP_TEMPORARILY | support model + tenant decision | High |

No path anterior debe forzarse a uno de los diez paths iniciales cuando falta
Module, Lesson, Progress, Test, Forum, Support o Media.

## 4. Paths usados pero ausentes de Rules explícitas

El wildcard local cubre con deny, pero no existe bloque explícito para ninguno
de los paths de la matriz. Esto incluye la duplicación `levels/.../lessons` vs
`levels/.../modules/.../lessons` y la variante case-sensitive
`temas/.../Lessons`. Tampoco existen bloques locales para `messages`,
`supportTickets`, `forumReports`, `presentations` o `userTests`.

## 5. Colección users

Campos reales observados en creación/sincronización: uid, name, lastName,
email, age, ageGroup, country, role, isActive, emailVerified, accountType,
organizationId, organizationMembershipStatus, forumBlocked,
forumBlockedReason, forumBlockedAt, createdAt, updatedAt y lastLogin. Consumers
también usan display/name, level/progress/estadísticas indirectas según datos
legacy.

| Destination | Fields/concepts |
|---|---|
| Identity | uid, email, emailVerified, name/displayName, photoURL cuando exista, perfil personal |
| Membership | organizationId/organizationMembershipStatus sólo tras reconciliar a tenantId/status; nunca copiar mecánicamente |
| Authorization | role=admin/user es legacy; no pertenece a Identity ni equivale a MembershipRole/PlatformRole |
| Forum moderation | forumBlocked/reason/at requiere SaaS-11A |
| Progress/Enrollment | level, XP/progress/test history requieren modelos futuros y contexto Membership/Course |
| Legacy compatibility | age/ageGroup/country/accountType hasta decidir ownership contractual |
| Unknown/data inspection | campos ad hoc existentes no enumerables sin snapshot de datos |

`isAdmin` sólo puede retirarse después de migrar AdminRoute/Header/Admin,
initializeData, firestoreService y Rules desplegadas, y verificar bootstrap de
platform_admin. `DEFAULT_ADMINS` aparece en firestoreService y asigna admin por
email; no debe crear Membership ni autoridad permanente.

## 6. Administración legacy

| Use | File/rule | Operation | Current authority | Future authority/capability | Phase/removal | Risk |
|---|---|---|---|---|---|---|
| email bootstrap | firestoreService DEFAULT_ADMINS | create users role | email list | controlled platform bootstrap | later bootstrap; remove only after recovery tests | Critical |
| admin check | firestoreService, Header, AdminRoute, initializeData | UI/data admin | users.role | platform_admin or tenant_admin by operation | consumer migration | Critical |
| role update/list/delete users | Admin + firestoreService | global user admin | legacy admin | platform/tenant capability + backend | backend/admin migration | Critical |
| forum blocking/reports | Admin/services | moderation | legacy admin/users flags | future SaaS-11A authority | forum redesign | High |
| academic CRUD | admin components/services | levels/topics/tests/content | legacy admin | tenant capabilities/backend | academic migration | Critical |

## 7. Public academic content and presentations

The code consumes levels/modules/lessons from Welcome, Curso, Home and course
services; topics/missions from public/authenticated pages; tests from test UI;
and presentations by levelId/lessonId. Historical “public read” assumptions are
therefore real consumer dependencies, but no such grants exist in the local
rules file. They cannot be closed or preserved safely until the deployed ruleset
is known.

| Path | Expected legacy public dependency | Restrict now | Migration |
|---|---|---|---|
| levels/modules/lessons | Welcome/Course/Home | No | shadow tenant academic model then consumers |
| temas/missions | topic pages and mission flows | No | future topic/mission model |
| tests/sections | test loading | No | future test model |
| presentations | presentation queries/content/comments | No | inspect sensitivity, migrate to Tenant/Course |

Presentations are Firestore documents, but `uploadAudio` also writes Firebase
Storage at `presentations/{timestamp}_audio.wav`; this contradicts “Storage is
not used”. Public visibility and ownership cannot be settled without data and
deployed-rule inspection.

## 8. Progress, tests and attempts

Progress and topicProgress are self-path data written by clients, used throughout
Home/Profile/course/mission UX, and may be manipulated if deployed validation is
weak. Attempts contain bounded conversation/evaluation/XP fields and client
serverTimestamp calls. userTests carries placement/test progress and evaluation.
All are **Legacy protected self data**, **Can coexist temporarily**, **Future
SaaS-09/test domain**, and **Requires enrollment-aware migration**. No new
physical model is approved here.

## 9. Forum and moderation

Forum is global by level, not Tenant. Clients create/delete posts, create
replies, increment repliesCount and mutate likes/likedBy. Reports copy post data;
moderation reads/deletes reports/posts and users flags gate participation.
Risks: counter/array races, spoofed author fields, global visibility, cross-tenant
future leakage and legacy users dependency. Classification:
**HARDEN_BEFORE_MIGRATION**, remain temporarily, redesign in SaaS-11A. Unsafe
counter/ownership behavior must be constrained before production, but not in
this phase.

## 10. Messages, support and AI content

- `messages`: Welcome and supportService create anonymous records containing
  name/email/message/source/status/timestamps; separate implementations coexist.
  No authoritative field/size/rate/App Check protection is proven. Public legacy
  exception; separate public-contact security and backend/API recommended.
- `supportTickets`: authenticated client creates userId/email/name/category/
  subject/message/priority/status/source/timestamps. Temporary compatibility;
  tenant-aware future support domain required.
- `aiGeneratedLessons`: no consumer of this collection was found. Current AI
  lesson generator writes `levels/.../lessons`, so the expected path is an
  unused candidate only after data/manual verification. Future content must be
  Tenant-owned and backend-generated.

## 11. Consumer matrix

Grouped only by identical path pattern.

| Files/modules | Firestore path | Operations | Actor/assumption | Dependency |
|---|---|---|---|---|
| auth/firestoreService; Login/Header/Admin/AdminRoute/EditProfile; Profile/Curso/Foro/Reply | users | PR/list/create/update/delete | self or legacy admin | Identity/admin/forum split |
| progressService; Home/Profile/course navigation | users/progress | PR/list/write | path self | SaaS-09 |
| topicProgressService; missionAttemptService; Home/Profile/Tema/MissionChat | users/topicProgress[/attempts] | PR/list/add/update | path self | SaaS-09 |
| courseService/moduleService/lessonManager/navigation; Welcome/Home/Curso/AILessonGenerator | levels/modules/lessons | list/PR/CRUD | public or legacy admin | tenant academic migration |
| topicCatalog/topicMission services; Tema/Mission pages/admin | temas[/Lessons|missions] | list/PR/CRUD | public/auth/admin | future topic/mission |
| testRepository/testService/pages/admin | tests/sections | list/PR/batch/CRUD | public/admin | test domain |
| firestoreService; Home/Profile/Admin | userTests | query/add/update | self/admin | assessment migration |
| firestoreService | presentations | query/add/update comments | public/auth ownership unclear | Course/Tenant + Storage issue |
| Foro/LikeButton/ReplyModal | forums/posts/replies | list/add/update/delete | auth/owner plus shared counters | SaaS-11A |
| ReportPostButton/moderationService | forumReports | add/list/update/delete | auth/legacy admin | SaaS-11A |
| Welcome/supportService | messages | anonymous add | public | public-contact security |
| supportService | supportTickets | authenticated add | self payload | support domain |
| firestoreService uploadAudio | Storage presentations/* | upload/read URL | authenticated caller unclear | Storage gate contradiction |

## 12. Public permission matrix

| Path | Local public policy | Consumer expects | Sensitive risk | Restrict now | Required migration |
|---|---|---|---|---|---|
| levels/modules/lessons | deny | read | curriculum exposure | No | academic consumers |
| temas/missions | deny | read | global/tenant leakage | No | topic/mission consumers |
| tests/sections | deny | read | assessment disclosure | No | test consumers |
| presentations | deny | read | user/material/audio exposure | No | data inspection + consumers |
| messages | deny | anonymous create | PII/spam/XSS/overposting | Not safely without preserving form | public endpoint/hardening |

## 13. Blocks by transition state

- **KEEP_TEMPORARILY:** progress, topicProgress/attempts, tests/sections,
  userTests, forumReports, supportTickets.
- **HARDEN_BEFORE_MIGRATION:** forums/posts/replies, messages, presentations.
- **SHADOW_WITH_SAAS:** users alongside identities/Memberships.
- **MIGRATE_THEN_REMOVE:** levels/modules/lessons, temas/missions.
- **REMOVE_AFTER_CONSUMER_RETIREMENT:** capitalized `temas/.../Lessons` and
  legacy users authorization fields/helpers.
- **DENY_IMMEDIATELY_IF_UNUSED:** aiGeneratedLessons candidate only; requires
  data inspection and smoke test, so not yet executable.
- **OUT_OF_SCOPE:** future Storage/Media topology and legal retention; current
  Storage usage remains a blocker, not evidence of no usage.

## 14. Coexistence and cutover

`expand → shadow → migrate → verify → enforce → contract`:

1. Expand adds SaaS paths deny-by-default without removing legacy.
2. Shadow introduces providers/repositories and controlled reads, no visible
   behavior switch or automatic dual-write.
3. Migrate copies/transforms only after ownership mappings exist.
4. Verify compares counts, refs, ownership, authorization and UI results.
5. Enforce switches guarded cohorts/consumers and tests isolation.
6. Contract removes a legacy block only with migrated data/consumer, Rules tests,
   smoke tests and rollback.

| Domain | Cutover |
|---|---|
| Identity | shadow/dual-read controlled fallback, then SaaS only |
| Authorization | legacy only until trusted platform/tenant bootstrap; backend adapter |
| Academic | legacy only then shadow read; migrate by Tenant |
| Progress/tests | legacy only/temporary compatibility until future models |
| Forum | legacy only with hardening, then SaaS-11A |
| Presentations/AI | legacy only; backend adapter/migration after ownership |
| Messages | temporary public compatibility, then separate backend/API |
| Support | legacy self support, then tenant-aware support domain |

No dual-write is approved automatically.

## 15. Blocks that cannot change and early candidates

Cannot harden/remove yet: users; academic public reads; progress/topicProgress/
attempts; tests/userTests; presentations; forum/replies/reports; messages;
supportTickets. Each has live consumers above and exits only after its target
model, consumer migration, tests and rollback.

Early candidates, not actions:

| Candidate | Classification | Preconditions |
|---|---|---|
| aiGeneratedLessons deny | Requires data inspection/manual smoke test | verify no data/dynamic consumer |
| unknown fields on messages/support | Requires manual smoke test | exact deployed rules and payload compatibility |
| unused deletes/updates per block | Requires consumer search + data inspection | authoritative rules snapshot |
| SaaS paths deny shadow | Safe candidate | keep legacy untouched; tests before deploy |

## 16. Implementation order

1. 02C.2A: SaaS paths in deny-by-default shadow mode; preserve legacy.
2. 02C.2B: Identity self rules after bootstrap compatibility tests.
3. 02C.2C: tenant-scoped read helpers/rules.
4. 02C.2D: Membership/Request self reads and CG tests.
5. 02C.2E: Course/Enrollment reads.
6. 02C.2F: preserve/harden required legacy blocks from authoritative snapshot.
7. 02C.2G: conceptual index materialization.
8. 02C.2H: Rules tests including legacy/SaaS coexistence.
9. 02C.2I: reconciliation and compatibility validation.

No microphase may begin until the blockers below are resolved.

## 17. Retirement matrix

Every block starts `Ready to remove = No`.

| Block | Prerequisites | Data migrated | Consumer migrated | Rules tests | Smoke | Rollback | Ready |
|---|---|---:|---:|---:|---:|---:|---:|
| users/auth/admin | trusted bootstrap + Identity/Membership | No | No | No | No | required | No |
| academic content | future models + tenant mapping | No | No | No | No | required | No |
| progress/tests | future domain + enrollment mapping | No | No | No | No | required | No |
| forum/reports | SaaS-11A | No | No | No | No | required | No |
| presentations/AI | ownership + Storage decision | No | No | No | No | required | No |
| messages/support | public/support security design | No | No | No | No | required | No |

## 18. Risks

| Severity | Findings |
|---|---|
| Critical | deployed Rules unknown; local deny-all contradicts functional app assumptions; no tenant isolation in legacy model; global role admin; public/contact and forum risk; Storage usage contradicts gate posture |
| High | mixed users authority, client progress/results, public academic/presentations assumptions, forum counters/arrays, global AI/content, deletes/overposting/unknown fields/timestamps |
| Medium | duplicated/case-sensitive academic paths, query/rule mismatch, App Check absent as complement, legacy data dependency |
| Low | stale unused aiGeneratedLessons candidate and documentation drift |
| Observation | local deny-all is safe as scaffold but cannot describe production compatibility |

## 19. FLR backlog and blockers

| ID | Path/helper/consumer | Risk/severity | Treatment | Phase | Blocks C.2 |
|---|---|---|---|---|---:|
| FLR-001 | firestore.rules vs all consumers | deployed legacy rules absent; Critical | obtain authoritative ruleset and provenance, compare without deploying | pre-C.2 | Yes |
| FLR-002 | Storage presentations uploadAudio | gate says unused/deny-all but code uploads; Critical | decide feature status and audit deployed Storage rules/data | pre-C.2/Storage review | Yes |
| FLR-003 | users.role/DEFAULT_ADMINS/admin consumers | privilege model mismatch; Critical | preserve bridge, design bootstrap/adapter/tests | C.2F/backend | Yes for admin cutover |
| FLR-004 | messages anonymous | abuse/PII; Critical | separate contact security/backend/App Check/rate strategy | C.2F/future support | No for SaaS shadow |
| FLR-005 | forums counters/ownership | manipulation/global scope; High | temporary hardening + SaaS-11A plan | C.2F | No for SaaS shadow |
| FLR-006 | academic public consumers | premature denial breaks UI; Critical | inventory deployed grants, shadow migrate, cohort verification | C.2F/academic | Yes for legacy replacement |

## 20. Storage

The required confirmation cannot be made. Firebase Storage **is used** by
`firestoreService.uploadAudio` through upload and download-URL SDK calls under
`presentations/`. `storage.rules` is locally deny-all, and Storage Rules Design
Gate remains Not ready. No Storage path/model is designed here.

## 21. Criteria and decision

| Criterion | Result |
|---|---|
| Helpers legacy audited | No cumple — source rules absent |
| Paths/consumers/users/admin/public/progress/forum/presentations/AI/messages/support inventoried | Cumple |
| Every conceptual legacy block classified | Cumple with evidence limitation |
| Coexistence/order/retirement criteria | Cumple |
| Legacy→SaaS matrix complete | Cumple for code-visible paths |
| Storage confirmed unused/out of scope | No cumple — active SDK usage found |
| Firebase unchanged | Cumple |

```text
SaaS-02C.1A legacy Rules compatibility audit = INCOMPLETE
SaaS-02C.2 = NOT STARTED
```

Blocking evidence:

1. `firestore.rules`: only deny-all scaffold; expected legacy helpers/paths are
   unavailable and deployed rules cannot be queried in this phase.
2. `src/services/auth/firestoreService.js`: Storage upload/download consumer
   contradicts the required assertion that Storage is unused.

No correction or new phase is proposed; Implementation Order is not modified.

## 22. Reconciliation follow-up — SaaS-02C.1B

The owner subsequently supplied the complete legacy Rules as an
**Authoritative user-provided legacy Rules reference**. This resolves the
evidence gap recorded by FLR-001 without changing the checked-in deny-all
scaffold or making the legacy model normative for SaaS.

The definitive reconciliation, permission/consumer matrices, coexistence plan
and retirement gates are recorded in
`FIRESTORE_LEGACY_RULES_RECONCILIATION.md`. SaaS-02C.1B also adopts the explicit
decision that Firebase Storage is not part of the current SaaS target. The
existing `getStorage`/`uploadAudio` code is a residual dependency requiring
later functional retirement; `storage.rules` remains deny-all.

The historical `INCOMPLETE` result above remains preserved as the outcome of
SaaS-02C.1A before the supplied reference and no-Storage decision.
