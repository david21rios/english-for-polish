# SaaS-02C.2G-A — Selective legacy Rules hardening plan

## 1. Purpose, scope and decision

This document designs—but does not implement—selective hardening for the
highest-risk legacy Firestore blocks. It is based on the current Rules,
owner-provided legacy reference, compatibility closure, and direct inspection
of every related consumer and payload under `src/`.

No Rule, application file, test, index, Firebase resource, Domain contract or
SaaS topology was changed. When evidence is incomplete, the decision is
`KEEP_UNCHANGED_TEMPORARILY` or a stricter prerequisite classification rather
than an unsafe assumption.

```text
SaaS-02C.2G-A selective legacy hardening design = COMPLETE
SaaS-02C.2G-B1 = next, not started
No legacy permission may change before human approval of exact proposals.
```

## 2. Sources and method

The legacy audit, reconciliation, compatibility closure, shadow baseline,
security gate, Rules design, implementation order, `firestore.rules`, the
legacy evidence file and all related consumers were reviewed directly.
Searches covered messages, presentations/audio, forum/reports, AI lessons,
user tests, progress/topic attempts, support, user moderation, roles and admin.

For each operation the audit traced: current allow condition, actual SDK call,
payload construction, query assumptions, likely breakage, required protection,
tests and rollback. No remote data was inspected. The Rules SHA-256 at entry is
`68B97B79EB60A4CF5B747EE078ED98BFF1C4AEFCAA9756D4F64B14ECA3AE8E55`;
the file contains 882 lines. Final validation produced the identical after hash,
so `FIRESTORE_RULES_HASH_BEFORE == FIRESTORE_RULES_HASH_AFTER`.

## 3. Consumer and payload findings

### 3.1 Messages

`Welcome.jsx` writes `name`, `email`, `message`, `source="welcome"`,
`createdAt=serverTimestamp`, `userId="anon"`, and `status="new"`.
`supportService.createPublicMessage` writes the same fields plus
`updatedAt=serverTimestamp`. Both are anonymous creates. No client read,
update or delete consumer was found; those operations remain legacy-admin.

The current Rule validates only name/email/message types and sizes, allowing
unknown fields and client-selected authority/status/timestamps. Spam, PII,
automation and rate limiting cannot be solved by Rules alone. CAPTCHA, App
Check and a public API/backend remain future complementary controls.

### 3.2 Presentations and residual Storage

`firestoreService` exposes `getPresentations(levelId, lessonId)`,
`addPresentation(presentationData)`, `addComment(presentationId, commentData)`
and `uploadAudio(audioBlob)`. Reads query public documents by `levelId` and
`lessonId`; creates spread an unconstrained caller payload and append
`createdAt`, `updatedAt`, `likes=0`, `comments=[]`. Comments spread unknown
`commentData`, add a client-generated ID/ISO timestamp, and update the array.

The exact creation/comment payload and external callers are not proven. Public
read may be part of the current lesson flow. `uploadAudio` writes
`presentations/{timestamp}_audio.wav` to Storage and returns a download URL,
but no direct UI caller was proven. Storage remains deny-all and is not part of
the SaaS target. Reads, creates, comments, deletes and audio therefore require
separate treatment; none is safe to change now without further prerequisites.

### 3.3 Forum and reports

`Foro.jsx` reads posts ordered by `createdAt`; creates exact fields `text`,
`level`, `userId`, `userName`, `userEmail`, zero `repliesCount`/`likes`, empty
`likedBy`, and server timestamps; owners delete their posts. `ReplyModal`
reads replies ordered by `createdAt`, creates `text`, owner/name/email and
timestamps, then separately increments the post `repliesCount`.
`LikeButton` updates `likes` by ±1 and array-unions/removes the current uid.

The current shared-field Rule cannot prove cross-field counter/list coherence,
one-like-per-user under races, or that `repliesCount` corresponds to an actual
reply. Those writes require a trusted backend/transactional design; partial
Rules checks would give false assurance. No reply-update UI was found.

`ReportPostButton` creates exact report fields: `postId`, `level`,
`postUserId`, `postText`, `reportedBy`, `reporterEmail`, `reason`, `details`,
`status="pending"`, and server timestamps. Moderation lists reports by
`createdAt`, updates `status`/`updatedAt`, deletes reports and posts under
legacy admin authority. Duplicate-report prevention requires backend/data.

### 3.4 AI-generated lessons

No direct functional read/write of `aiGeneratedLessons` was found. The current
AI lesson generator writes to `levels/{levelId}/lessons/{lessonId}` (and its
module hierarchy), not this collection. Dynamic usage or historical deployed
documents cannot be excluded without manual remote inspection, so denial is
not approved yet.

### 3.5 User tests

`userTests` uses auto IDs and `userId` ownership. Creates include incomplete
test state or completed result documents with scores, levels, nested results,
review flags and timestamps. Client updates write `testProgress`, evaluation
fields, nested scores/details/status and timestamps. Self reads query by
`userId`; the admin panel reads results. The current client can alter academic
results. Authoritative result submission/correction requires backend design;
historical reads must remain compatible.

### 3.6 Progress, topic progress and attempts

Lesson progress writes `userId`, level/lesson/module references, section
indices, completed sections, activity/skill results, scores, percentages,
completion flags and timestamps. Topic transactions write `userId`, `topicId`,
XP totals, completion arrays/counts, best scores/stars, attempt counters and
last-mission summary. Attempt documents include mission metadata, state,
scores/stars, XP, answer, conversation, context, feedback and timestamps.

Local normalization bounds some values, but clients remain authoritative and
legacy documents may be heterogeneous. Academic fraud and replay remain high
risk. Strict allowlists or number validation without a data snapshot could
break the pilot and still would not establish authority; writes require a
future backend/progress model.

### 3.7 Support tickets

`SupportForm` calls `createSupportTicket`. The service writes `userId`,
Auth-derived email/name, `category`, `subject`, `message`, `priority`,
`status="open"`, `source="authenticated-support"`, and server timestamps.
Client reads are self; update/delete and admin reads remain legacy-admin.
The current create Rule validates only `userId`, so overposting can forge
status/priority/identity metadata. A strict create allowlist compatible with
the observed service is a candidate; workflow updates remain unchanged.

### 3.8 Users

Observed fields include `uid`, name/lastName, email/emailVerified, age/group,
country, role, active state, account/organization fields, forum block fields,
levels/unlocks/test history, XP/progress-derived fields and timestamps.
Registration synchronizes a large merge payload; profile edits update six
profile fields; Login/Auth, test and progress flows add other fields; admin
changes role, moderation and deletion. Protecting only `role` leaves broad
overposting, but a complete owner allowlist cannot be introduced until all
writers and deployed heterogeneous data are reconciled. Admin mutations belong
in a future trusted backend.

## 4. Current permission matrix

| Path | Operation | Current actor/condition | Consumer | Risk | Potential hardening | Consumer change | Backend | Manual data | Classification |
|---|---|---|---|---|---|---:|---:|---:|---|
| messages | create | anonymous, three field validations | Welcome/support service | spam/overposting | exact allowed/required keys, constants and timestamps | No | No | No | SAFE_TO_HARDEN_NOW |
| messages | read/update/delete | legacy admin | no public client | global admin | retain; later public-contact backend | No | Yes later | No | KEEP_UNCHANGED_TEMPORARILY |
| presentations | read | public | `getPresentations` | public data | authenticated or owner policy | Yes | No | Yes | REQUIRES_CONSUMER_CHANGE |
| presentations | create | authenticated, matching userId | `addPresentation` | unknown spread payload | exact schema/immutable ownership | Yes | No | Yes | REQUIRES_CONSUMER_CHANGE |
| presentations | update | owner/admin | `addComment` | arrays/unknown comments | separate comment operation | Yes | Yes | Yes | REQUIRES_BACKEND |
| presentations | delete | owner/admin | no direct caller proven | destructive | retain pending verification | No | No | Yes | KEEP_UNCHANGED_TEMPORARILY |
| forum posts | read | authenticated | Foro | global exposure | retain until tenant redesign | Yes | No | No | KEEP_UNCHANGED_TEMPORARILY |
| forum posts | create | forum-allowed, matching uid | Foro | overposting | strict known create keys/types/initial values | No | No | No | SAFE_TO_HARDEN_NOW |
| forum posts | owner update | owner/forum-allowed | no edit UI proven | broad mutation | owner field allowlist | Yes | No | Yes | REQUIRES_CONSUMER_CHANGE |
| forum posts | social update | any forum-allowed auth, four fields | LikeButton/ReplyModal | race/counter fraud | backend atomic commands | Yes | Yes | No | REQUIRES_BACKEND |
| forum posts | delete | owner/admin | Foro/moderation | destructive/global admin | retain | No | No | No | KEEP_UNCHANGED_TEMPORARILY |
| replies | read | authenticated | ReplyModal | global | retain | No | No | No | KEEP_UNCHANGED_TEMPORARILY |
| replies | create | forum-allowed, matching uid | ReplyModal | overposting | strict known keys/types/timestamps | No | No | No | SAFE_TO_HARDEN_NOW |
| replies | update | owner/admin | no direct UI proven | broad mutation | verify data/use then constrain | No | No | Yes | REQUIRES_MANUAL_DATA_VERIFICATION |
| replies | delete | owner/admin | no direct self caller proven | destructive | retain pending workflow review | No | No | Yes | KEEP_UNCHANGED_TEMPORARILY |
| forumReports | create | forum-allowed, matching reporter | ReportPostButton | overposting/duplicates | exact create keys/types/constants | No | No | No | SAFE_TO_HARDEN_NOW |
| forumReports | read/update/delete | legacy admin | moderation service | global admin | retain until backend authority | No | Yes later | No | KEEP_UNCHANGED_TEMPORARILY |
| aiGeneratedLessons | CRUD | legacy admin | none proven | unknown historical/dynamic use | deny only after inspection | No | No | Yes | REQUIRES_MANUAL_DATA_VERIFICATION |
| userTests | create | auth, incoming own uid | auth/test flow | result manipulation | backend result command | Yes | Yes | No | REQUIRES_BACKEND |
| userTests | read | self/admin | UI/admin | global admin | retain until migration | No | No | No | KEEP_UNCHANGED_TEMPORARILY |
| userTests | update | self/admin, immutable uid | progress/evaluation | score manipulation | backend correction/progress command | Yes | Yes | No | REQUIRES_BACKEND |
| userTests | delete | admin | admin | retention/destructive | retain pending retention | No | Yes later | Yes | KEEP_UNCHANGED_TEMPORARILY |
| progress/topic/attempts | create/update | owner/admin | progress/mission services | academic fraud | backend authoritative commands | Yes | Yes | Yes | REQUIRES_BACKEND |
| progress/topic/attempts | read | owner/admin | course/profile/mission | global admin | retain pending model | No | No | No | KEEP_UNCHANGED_TEMPORARILY |
| progress/topic/attempts | delete | admin | no ordinary flow | history loss | retain pending retention | No | Yes later | Yes | KEEP_UNCHANGED_TEMPORARILY |
| supportTickets | create | auth, incoming own uid | SupportForm/service | overposting | exact create keys/types/constants/timestamps | No | No | No | SAFE_TO_HARDEN_NOW |
| supportTickets | read | self/admin | support/admin | global admin | retain | No | No | No | KEEP_UNCHANGED_TEMPORARILY |
| supportTickets | update/delete | admin | no self flow | global/destructive | backend support workflow later | Yes | Yes | Yes | KEEP_UNCHANGED_TEMPORARILY |
| users | create | self | registration/auth | authority overposting | preserve registration; reconcile complete shape | Yes | No | Yes | REQUIRES_CONSUMER_CHANGE |
| users | read | self/admin | many | global admin/list | retain until shadow migration | Yes | Yes | No | KEEP_UNCHANGED_TEMPORARILY |
| users | owner update | self except role | profile/auth/test/progress | sensitive-field mutation | operation-specific allowlists | Yes | No | Yes | REQUIRES_CONSUMER_CHANGE |
| users | admin update/delete | admin | admin/moderation | global/destructive | trusted backend commands | Yes | Yes | No | REQUIRES_BACKEND |

## 5. Observed field matrix

`UNKNOWN` means the caller spreads or legacy data may contain unenumerated
fields; it is not a new contract.

| Document | Observed fields and types | Required/optional | Writer | Immutable | Client write | Current validation | Proposed validation | Evidence |
|---|---|---|---|---|---|---|---|---|
| Message | name/email/message/source/userId/status strings; createdAt/updatedAt timestamps | first seven required; updatedAt optional across two writers | anonymous clients | source/userId/status/timestamps | create only | type/size for first three | exact key sets, constants, request-time timestamps | Welcome/support service |
| Presentation | levelId, lessonId, userId and `presentationData` UNKNOWN; timestamps; likes number; comments array; possible audioUrl UNKNOWN | UNKNOWN | authenticated creator/owner | userId, createdAt | create/update/delete | owner only | consumer schema first; immutable owner; split comments | firestoreService spread payload |
| Forum post | text/level/userId/userName/userEmail strings; counters numbers; likedBy array; timestamps | create payload fixed | author and social users | owner/level/createdAt | yes | owner plus affected-key checks | exact create shape; backend social fields | Foro/LikeButton/ReplyModal |
| Reply | text/userId/userName/userEmail strings; timestamps | fixed create | author | userId/createdAt | create; update allowed | owner/forum checks | exact create; verify update need | ReplyModal |
| Forum report | postId/level/postUserId/postText/reportedBy/reporterEmail/reason/details/status strings; timestamps | fixed create | reporter/admin | reporter/target/createdAt | create | reportedBy only | exact keys/types/status/timestamps | ReportPostButton/moderation |
| UserTest | userId string; booleans; timestamps; progress UNKNOWN; nested results/levels/scores/review | lifecycle-dependent | self/admin | userId, created history | yes | userId only | backend result/progress schemas | firestoreService |
| Lesson progress | userId/refs strings; indices/counts/scores/percentages numbers; arrays/maps; booleans; timestamps | lifecycle-dependent | self | owner/references | yes | owner only | backend plus future model | progressService |
| Topic progress | userId/topicId strings; XP/counts numbers; arrays/maps/summaries; timestamps | lifecycle-dependent | self transaction | owner/topic | yes | owner only | backend transaction/model | topicProgressService |
| Attempt | ids/metadata strings; state booleans; scores/XP numbers; conversation/context/feedback; timestamps | builder-defined | self | owner/topic/mission | create | owner only | backend authoritative evaluation | attempt service |
| Support ticket | userId/email/name/category/subject/message/priority/status/source strings; timestamps | fixed create | authenticated self | identity/status/source/timestamps | create | userId only | exact keys/types/constants/timestamps | SupportForm/service |
| User | identity/profile/admin/progress fields of mixed types; UNKNOWN deployed additions | lifecycle-dependent | self/admin/multiple services | uid/role/admin fields vary | broad | role only protected | map every writer, then operation allowlists | auth/profile/admin services |

## 6. Consumer matrix

| File | Feature/path | Operation and payload/query | Expected permission | Potential breakage | Required adaptation |
|---|---|---|---|---|---|
| `Welcome.jsx` | messages | anonymous add; seven-field payload | public create | key policy mismatch | none for FLH-001 |
| `supportService.js` | messages | anonymous add; same plus updatedAt | public create | optional updatedAt mishandled | none if both shapes allowed |
| `firestoreService.js` | presentations | query by levelId/lessonId; spread create; array comment; audio upload | public read/owned writes | unknown payload/public dependency | explicit DTO, auth policy, no-Storage UX |
| `Foro.jsx` | posts | ordered list, fixed create, owner delete | authenticated/owner | create keys or read/delete changes | none for create-only FLH-008 |
| `LikeButton.jsx` | posts | increment likes plus union/remove uid | authenticated social update | any stronger atomic policy | backend command |
| `ReplyModal.jsx` | replies/posts | ordered list, fixed reply create, counter increment | authenticated/self | split write fails partially | backend counter or reconciliation |
| `ReportPostButton.jsx` | forumReports | fixed report create | reporter create | stricter keys | none for FLH-015 |
| `forumModerationService.js` | reports/posts | list, status update, delete | legacy admin | admin replacement | trusted backend later |
| `AILessonGenerator.jsx` | levels lessons | writes levels, not aiGeneratedLessons | legacy admin | denying unknown historical path | manual data/dynamic-use verification |
| test/auth/admin modules | userTests | uid query, creates, progress/result updates | self/admin | backend transition | command/repository migration |
| progress/topic/attempt services | user progress hierarchy | frequent merge/transaction/add and history reads | self/admin | stricter shape blocks heterogeneous flows | future progress backend/model |
| `SupportForm`/support service | supportTickets | fixed authenticated create | self create | exact key mismatch | none for FLH-020 |
| auth/profile/admin/forum services | users | create/merge/update/list/delete | self/admin | registration/profile/admin breakage | operation split and backend |

## 7. Proposal matrix and FLH backlog

| ID | Path/operation | Finding/severity | Exact conceptual change | Classification | Prerequisite | Tests/smoke test | Rollback | Phase / blocking |
|---|---|---|---|---|---|---|---|---|
| FLH-001 | messages create | Critical overposting | allow only both observed key sets; types/sizes, constants and server timestamps | SAFE_TO_HARDEN_NOW | human approval | both valid payloads; unknown/missing/type/time negatives; submit both forms | restore prior create expression; resubmit forms | G-B1; blocks only proposal |
| FLH-002 | messages abuse | Critical spam/PII | route through rate-limited API with CAPTCHA/App Check signals | REQUIRES_BACKEND | backend/product design | abuse/rate/replay tests | restore direct create | later; non-blocking B1 |
| FLH-003 | presentations read | High public exposure | require approved authenticated/ownership policy | REQUIRES_CONSUMER_CHANGE | caller/share-flow and data inspection | public/auth/owner scenarios | restore public read | later; blocks proposal |
| FLH-004 | presentations create | High unknown payload | explicit creation schema and immutable owner | REQUIRES_CONSUMER_CHANGE | enumerate callers/payload/data | accepted variants and overposting | restore owned create | later |
| FLH-005 | presentation comments | High array/race | backend append-only comment command | REQUIRES_BACKEND | comment model/API | concurrency/owner/moderation | restore owner update | later |
| FLH-006 | presentation delete | High destructive | retain until ownership/retention verified | KEEP_UNCHANGED_TEMPORARILY | data/caller inspection | owner/admin deletion smoke | unchanged block | later |
| FLH-007 | uploadAudio/audioUrl | High no-Storage conflict | remove binary upload expectation and residual fields after consumers retire | REMOVE_AFTER_CONSUMER_RETIREMENT | UI/data inspection | presentation without audio | restore legacy UI/code | functional cleanup |
| FLH-008 | forum post create | High overposting | fixed keys/types, zero counters, empty likedBy, request-time timestamps | SAFE_TO_HARDEN_NOW | human approval | valid/blocked/foreign/unknown/initial-value tests; create post | restore create expression | G-B1 |
| FLH-009 | post owner update | High broad mutation | owner-edit field allowlist separate from social fields | REQUIRES_CONSUMER_CHANGE | define/edit consumer | owner/foreign/immutable tests | restore owner branch | later |
| FLH-010 | post likes/repliesCount | Critical counter races | trusted atomic like/reply counter commands | REQUIRES_BACKEND | backend/idempotency design | concurrency/duplicate/replay | restore direct social update | later |
| FLH-011 | post delete | High destructive | retain owner/admin deletion | KEEP_UNCHANGED_TEMPORARILY | retention/forum migration | owner/foreign/admin smoke | unchanged block | later |
| FLH-012 | reply create | High overposting | fixed keys/types and request-time timestamps | SAFE_TO_HARDEN_NOW | human approval | valid/blocked/foreign/unknown tests; reply flow | restore create expression | G-B1 |
| FLH-013 | reply update | Medium no consumer | inspect deployed data/dynamic use before constraining/denying | REQUIRES_MANUAL_DATA_VERIFICATION | manual inspection | owner/admin edit tests if used | retain prior branch | later |
| FLH-014 | reply delete | High destructive | retain pending workflow evidence | KEEP_UNCHANGED_TEMPORARILY | consumer/retention decision | owner/admin/foreign tests | unchanged | later |
| FLH-015 | forumReports create | High overposting | exact keys/types, pending status, request-time timestamps | SAFE_TO_HARDEN_NOW | human approval | valid/blocked/foreign/unknown/status/time tests | restore create expression | G-B1 |
| FLH-016 | forumReports admin ops | High global admin | retain until backend moderation | KEEP_UNCHANGED_TEMPORARILY | backend/admin migration | list/status/delete smoke | unchanged | later |
| FLH-017 | aiGeneratedLessons CRUD | Medium unknown use | deny only after remote data and indirect-use inspection | REQUIRES_MANUAL_DATA_VERIFICATION | manual checklist complete | admin path smoke/absence evidence | restore admin CRUD | later |
| FLH-018 | userTests writes | Critical result manipulation | backend submission/progress/correction commands | REQUIRES_BACKEND | test model/repository | score/tamper/replay/history tests | restore self writes | later |
| FLH-019 | progress/topic/attempt writes | Critical academic fraud | backend authoritative progress/evaluation commands | REQUIRES_BACKEND | progress model/data migration | bounds/replay/concurrency/history | restore owned writes | later |
| FLH-020 | supportTickets create | High overposting | exact known keys/types, own Auth fields, open status/source, server timestamps | SAFE_TO_HARDEN_NOW | human approval | valid/foreign/unknown/status/time tests; submit SupportForm | restore own create | G-B1 |
| FLH-021 | support admin ops | High global admin | retain until support backend | KEEP_UNCHANGED_TEMPORARILY | support authority/model | self/admin/status/delete | unchanged | later |
| FLH-022 | users create/owner update | Critical mixed authority | split operation-specific allowlists protecting all sensitive fields | REQUIRES_CONSUMER_CHANGE | enumerate writers and deployed fields | registration/profile/login/test regressions | restore broad self update | later |
| FLH-023 | users admin update/delete | Critical global/destructive | trusted backend commands | REQUIRES_BACKEND | platform bootstrap/admin API | role/moderation/delete/audit | restore legacy admin | later |

Classification totals: 23 proposals; 5 `SAFE_TO_HARDEN_NOW`, 4
`REQUIRES_CONSUMER_CHANGE`, 6 `REQUIRES_BACKEND`, 2
`REQUIRES_MANUAL_DATA_VERIFICATION`, 5 `KEEP_UNCHANGED_TEMPORARILY`, and 1
`REMOVE_AFTER_CONSUMER_RETIREMENT`. None blocks the entire G-B1 phase; each
non-safe prerequisite blocks only its own proposal. Human approval blocks all
five safe candidates from implementation.

## 8. Manual verification procedure

For `aiGeneratedLessons`, presentation/reply uncertainties and heterogeneous
legacy data, a later authorized operator must: inspect collection existence and
document counts; sample shapes without exporting sensitive content; check audit
logs and dynamic callers; identify last read/write time; reconcile deployed
fields with consumers; perform a manual smoke test; document rollback; and
obtain human approval. This phase performs none of those remote actions.

## 9. Future test catalogue

- Messages: both valid shapes succeed; unknown, missing, wrong type, oversized,
  arbitrary timestamp/status/source/uid fail; clients cannot read/update/delete.
- Presentations: future policy covers anonymous/auth/owner reads, exact owned
  create, foreign/owner mutation, delete policy, comments and no-Storage audio.
- Forum: blocked create fails; exact post/reply creates pass; foreign arbitrary
  updates/deletes fail; invalid counters/likedBy fail; legacy admin moderation
  remains compatible until migrated.
- Reports/support: exact self payload succeeds; ownership/status/timestamp and
  unknown-field attacks fail; existing moderation/support reads still work.
- Tests/progress: self reads remain; tampered scores/XP/userId and replay fail
  once backend commands exist; heterogeneous history remains readable.
- Users: registration and profile pass; owner cannot alter role, moderation,
  admin, Auth-derived or academic-result fields; admin workflows are tested at
  their future backend boundary.

No executable test was created.

## 10. Rollback standard

Every proposal retains the exact previous Rule block from the compatibility
reference. Rollback triggers are legitimate-request denial, query failure,
unexpected permission errors, partial forum/support/contact failure or data
shape mismatch. The action is to restore only the prior affected block, rerun
Rules/static tests and smoke the same consumer. Rule rollback does not mutate
data; backend/consumer proposals additionally require compatible release
rollback. Production verification must confirm both restored success and
continued denial of unrelated operations.

## 11. Risks

| Severity | Findings |
|---|---|
| Critical | anonymous-message abuse; global admin; client-authoritative results/progress; forum social-counter races; broad mixed users authority |
| High | PII, public presentations, residual Storage/audio, forum/report/support overposting, destructive operations, unknown fields |
| Medium | heterogeneous documents, casing/timestamp drift, unused-path uncertainty, missing adapters |
| Low | documentation drift and apparently unused operations awaiting proof |
| Observation | no emulator, Rules tests or remote snapshot exists; the pilot can be broken by apparently simple hardening, so only exact create-shape candidates advance |

## 12. Recommended implementation order and closure

1. SaaS-02C.2G-A: this audit and plan.
2. SaaS-02C.2G-B1: after human approval, implement only FLH-001, FLH-008,
   FLH-012, FLH-015 and FLH-020.
3. SaaS-02C.2G-B2: revalidate affected consumers and semantics.
4. SaaS-02C.2G-B3: record deferred consumer/backend/manual proposals.
5. SaaS-02C.2G-C: final compatibility revalidation.

All closure criteria comply: consumers, payloads, fields and operations were
inventoried; every proposal is classified with prerequisites, tests, smoke and
rollback; future manual/backend/consumer work is explicit; Rules and functional
code remain unchanged.

## 19. Human closure of B1 and controlled B2 scope

SaaS-02C.2G-B1.7 records the owner's human joint approval and closes B1
documentally and locally. The five approved proposals remain exactly:

```text
FLH-001 = revalidated
FLH-008 = revalidated
FLH-012 = revalidated
FLH-015 = revalidated
FLH-020 = revalidated
SaaS-02C.2G-B1 = completed
```

The final immutable baseline and residual limitations are recorded in
`FIRESTORE_RULES_SELECTIVE_CREATE_HARDENING_CLOSURE.md`.

The existing sequence defines B2 as revalidation of affected consumers and
semantics, not as implementation of another FLH batch. Its five controlled
microphases, prerequisites and gates are defined in
`FIRESTORE_LEGACY_HARDENING_B2_SCOPE.md`. The other 18 FLH proposals retain
their existing classifications and status; none is implemented, reclassified
or ready for removal.

```text
SaaS-02C.2G-B2 = designed_not_started
SaaS-02C.2G-B2.1 = next, not started
Mandatory human approval required before starting SaaS-02C.2G-B2.1.
```

## 20. B2.1 consumer-contract revalidation

`FIRESTORE_RULES_CONSUMER_CONTRACT_REVALIDATION.md` reconstructs the five call
graphs from current source. FLH-001, FLH-008, FLH-012, FLH-015 and FLH-020
remain `revalidated`; no other FLH changed and no path is ready for removal.

Posts, replies, reports and support create contracts are compatible. B2.1 found
that Welcome can submit a one-character name while the hardened messages Rule
requires a minimum of two, so B2.1 requires contract reconciliation and B2.2 is
blocked. The exported `createPublicMessage` service has no proven caller and is
recorded as orphaned, not as an additional active payload. Nothing was
implemented or corrected in this audit.

### B2.1A Welcome consumer reconciliation

The owner approved `CONSUMER_CHANGE`. Welcome now applies its existing trim and
enforces 2–100 characters before the unchanged seven-field messages write; its
HTML input exposes the same bounds. Rules and `createPublicMessage` were not
modified. `FLH-001 = revalidated`, all other FLH states remain unchanged and no
path is ready for removal. The correction is
`resolved_pending_revalidation` until B2.1B.

## 13. FLH-001 execution record

SaaS-02C.2G-B1.1 implemented only FLH-001 and is documented in
`FIRESTORE_RULES_MESSAGES_CREATE_HARDENING.md`. The strict create allowlist,
observed constants and request-time timestamps are
`implemented_pending_revalidation`. The other 22 proposals remain unchanged;
this record does not declare the hardening validated or authorize another
proposal.

## 14. FLH-008 execution record

SaaS-02C.2G-B1.2 implemented only FLH-008 and is documented in
`FIRESTORE_RULES_FORUM_POST_CREATE_HARDENING.md`. Its exact create shape,
ownership, initial counters, empty `likedBy`, level equality and request-time
timestamps are `implemented_pending_revalidation`. FLH-001 remains implemented
pending revalidation; the other 21 proposals and FLH-010 counter risk remain
unchanged. This record does not validate the forum or authorize replies.

## 15. FLH-008 forensic revalidation

SaaS-02C.2G-B1.2A reconstructed the post-B1.1 baseline and recalculated scoped
hashes using brace-balanced extraction. Only posts `allow create` differs;
messages, replies, posts read/update/delete, other legacy Rules, SaaS Rules and
catch-all are equal. The prior divergent final-response hash was a cross-phase
transcription error, not a Rules change. See
`FIRESTORE_RULES_FORUM_POST_FORENSIC_REVALIDATION.md`.

```text
FLH-008 = revalidated
```

No other proposal or risk status changes, and replies remain unauthorized.

## 16. FLH-012 execution record

SaaS-02C.2G-B1.3 implemented only FLH-012 and is documented in
`FIRESTORE_RULES_FORUM_REPLY_CREATE_HARDENING.md`. Its exact six-field shape,
self ownership, minimum observed text contract and request-time timestamps are
`implemented_pending_revalidation`. FLH-001 remains implemented pending
revalidation, FLH-008 remains revalidated, and all other proposals retain their
previous states. FLH-010 and the non-atomic parent `repliesCount` risk remain
open. This record does not validate the complete forum or authorize B1.4.

## 17. FLH-015 execution record

SaaS-02C.2G-B1.4 implemented only FLH-015 and is documented in
`FIRESTORE_RULES_FORUM_REPORT_CREATE_HARDENING.md`. Its exact eleven-field
shape, reporter ownership, five-value reason catalogue, 500-character details
limit, pending state and request-time timestamps are
`implemented_pending_revalidation`. FLH-001 and FLH-012 retain their pending
revalidation states, FLH-008 remains revalidated, and every other proposal is
unchanged. Global administration, duplicate-report and counter risks remain
open; the forum is not declared completely secured.

## 18. FLH-020 execution record

SaaS-02C.2G-B1.5 implemented only FLH-020 and is documented in
`FIRESTORE_RULES_SUPPORT_TICKET_CREATE_HARDENING.md`. Its exact eleven-field
shape, self ownership, six categories, observed text limits, normal priority,
open state, authenticated-support source and request-time timestamps are
`implemented_pending_revalidation`. FLH-001, FLH-012 and FLH-015 retain their
pending-revalidation states; FLH-008 remains revalidated; all other proposals
are unchanged. Abuse, global administration and missing Tenant isolation remain
open. B1.6 joint revalidation has not started.

## 19. Joint B1.6 revalidation

`FIRESTORE_RULES_SELECTIVE_CREATE_HARDENING_REVALIDATION.md` revalidated the
five create hardenings together using current consumers, brace-balanced block
extraction, historical hashes, the owner legacy reference and explicit
userTests/SaaS/catch-all checks.

```text
FLH-001 = revalidated
FLH-008 = revalidated
FLH-012 = revalidated
FLH-015 = revalidated
FLH-020 = revalidated
```

The other 18 proposals and all deferred abuse, backend, administration,
counter, migration and Tenant-isolation risks remain unchanged. No legacy block
is ready for removal, and SaaS-02C.2G is not complete.

## 20. B2.1 consumer-contract closure

The B2.1A Welcome consumer correction was revalidated read-only in B2.1B and
is closed in `FIRESTORE_RULES_CONSUMER_CONTRACT_CLOSURE.md`. The messages
contract divergence is resolved; all five audited create contracts are
compatible with the unchanged local Rules. FLH-001, FLH-008, FLH-012, FLH-015
and FLH-020 remain `revalidated`. No other FLH changed, no Rule was modified
and no legacy path is ready for removal. B2.2 remains not started pending human
approval.

## 21. B2.2 executable test design

`FIRESTORE_RULES_TEST_DESIGN.md` completes the documentary design for all five
revalidated hardenings. FLH-001, FLH-008, FLH-012, FLH-015 and FLH-020 are
covered by stable future case IDs; their states remain `revalidated`. No other
FLH changed, no Rule/test/consumer was modified, no path is ready for removal,
and runtime validation remains pending. B2.3 is not started pending human
review; B2.4 remains blocked by the unauthorized Java/emulator environment.

## 22. B2.3 static implementation blocker

The authorized test files cover all five revalidated FLH findings and all 201
IDs, with valid static syntax and unchanged Rules/consumers. Count validation
found the B2.2 RT-SAS arithmetic contradiction: explicit expectations produce
82 ALLOW / 119 DENY, not 81 / 120. No FLH status changes, no path is ready for
removal, and runtime remains unexecuted. B2.3 requires a documentary test
design correction before it can close.

## 23. B2.3A expectation-count reconciliation

The forensic review selected Alternative A: 201 canonical cases contain 82
ALLOW and 119 DENY expectations, and no individual test needs correction. The
81/120 summary was an arithmetic documentation error. All five FLH remain
`revalidated`; Rules, consumers and tests are unchanged, runtime is pending and
no path is ready for removal.

## 24. B2.4A CI runtime strategy

The static suite remains 201 cases: 82 ALLOW and 119 DENY. A zero-credential,
demo-only hosted CI runtime is feasible after B2.4B separates the Firestore
suite from the existing Storage baseline. Runtime was not executed, no
workflow was created, Rules remain unchanged, all FLH states remain unchanged
and no legacy path is ready for removal.

## 25. B2.4B static workflow implementation

The manual CI workflow is implemented statically for the 201 / 82 / 119 suite.
It is zero-credential, zero-deployment and Firestore-only; Auth, Storage and
the Storage baseline are excluded. Runtime was not executed, FLH states remain
unchanged and no path is ready for removal.

## 26. B2.4C-A precommit audit

The manual workflow, preflight and 201 / 82 / 119 execution boundary passed
static audit with zero credentials, zero deployment and no Storage. Ignored
local artifacts `.env.local` and `firebase-debug.log` trigger the explicit
sensitive-file gate, so B2.4C-A requires owner review and repeat audit. No FLH
state changed, no Rule or consumer changed and no path is ready for removal.

## 27. B2.4C-A1 ignored-file reconciliation

The local configuration and debug files are correctly ignored, untracked,
unstaged, outside all diffs and unused by CI. No sensitive file is Git-visible,
so the precommit technical audit is closed pending human approval. Commit and
workflow execution remain pending; credentials and deployment remain absent,
Storage stays out of scope, FLH states are unchanged and no path is ready for
removal.

## 31. B2.4C-B2F2 corrective commits

The Firestore-only helper correction is isolated in local commit `ada8931`.
The first runtime remains classified as a harness failure; Rules correctness
is not yet evaluated. Owner push and corrected workflow dispatch are pending,
FLH states are unchanged and no path is ready for removal.

## 30. B2.4C-B2F1 harness correction

The first runtime selected all 201 cases but evaluated no Rule assertion: the
shared harness incorrectly requested Storage. The helper is now Firestore-only
with 201/82/119 unchanged. Storage remains deny-all, no emulator or deployment
was added, FLH states are unchanged and no path is ready for removal.

## 28. B2.4C-B1 controlled commits

The accumulated approved work was recorded in thematic local commits using
explicit paths. Ignored local files, lockfile and Storage remained excluded;
FLH states and removal gates did not change. Push and runtime workflow
execution remain pending owner action.

## 29. B2.4C-B2 runtime evidence review

The owner reported manual push and workflow dispatch, but no runtime log or
completed summary was provided. SHA, toolchain, emulator, compilation and
201 / 82 / 119 results remain unverified. Credentials, deployment and Storage
remain absent from the local design; no FLH changed and no path is ready for
removal.
