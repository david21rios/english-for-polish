# SaaS-02C.2G-B2.1 — Consumer contract and call-graph revalidation

## Purpose, scope and method

This read-only audit reconstructs the current functional contracts for the five
B1 create hardenings from UI entry point to Firestore SDK call. It reviewed all
required closure, implementation, forensic, reconciliation and scope documents,
the complete current `firestore.rules`, and global source searches for resource
names, aliases, SDK operations, ownership fields, constants and timestamps.

The source scan covered `collection`, `doc`, `addDoc`, `setDoc`, `updateDoc`,
`deleteDoc`, `writeBatch`, `runTransaction`, resource literals, collection-name
constants, reexports and callers. Seven functional files contain Firestore
references to the five target resources: `Welcome.jsx`, `Foro.jsx`,
`ReplyModal.jsx`, `ReportPostButton.jsx`, `LikeButton.jsx`,
`forumModerationService.js` and `supportService.js`. UI-only nodes and barrel
reexports were traced separately.

```text
No consumer, service, component or Firebase Rule was modified.
This phase only revalidated the current functional contracts.
The resulting contract matrix is the input for SaaS-02C.2G-B2.2.
No Firebase deployment or runtime Rules validation was performed.
```

## Search and call-graph findings

### Messages

`CG-MSG-001` is active and direct:

`Welcome` contact form → `sendMessage` → trim name/message and lowercase email
→ non-empty/email/minimum-message validation → inline payload → `addDoc` →
`collection(db, "messages")` → automatic document ID.

The active payload is `name`, `email`, `message`, `source="welcome"`,
`userId="anon"`, `status="new"`, `createdAt=serverTimestamp()`.
`updatedAt` is absent.

`CG-MSG-002` is an `ORPHANED_CALLABLE_FUNCTION`:

`supportService.createPublicMessage` → normalize text/email → payload with the
same seven fields plus `updatedAt=serverTimestamp()` → `addDoc` to the
`PUBLIC_MESSAGES_COLLECTION="messages"` constant → automatic ID.

The function is exported directly, through the service default object and via
`services/support/index.js`, but global caller searches found no functional
invocation. `validatePublicMessage` is also exported but has no caller. This
callable is compatible with the Rule but is not counted as an active consumer.

Blocking divergence: `Welcome.sendMessage` and the HTML input require only a
non-empty name and cap it at 80 characters. They do not enforce a two-character
minimum. The Rule requires `name.size() >= 2`. A one-character name reaches
Firestore but is denied. This is `CODE_CONTRACT_DIVERGENCE` and
`INCOMPATIBLE`; no source or Rule is changed here.

### Forum posts

`CG-PST-001`:

`Foro` → `CreatePostForm.onSubmit` → `handleCreatePost` → local
`forumBlocked`, authenticated-user, trim and text-minimum checks → inline
payload → `addDoc` to `forums/{selectedLevel}/posts` → automatic ID → reload
ordered posts.

The exact ten fields are `text`, `level`, `userId`, `userName`, `userEmail`,
`repliesCount`, `likes`, `likedBy`, `createdAt`, `updatedAt`. Values are
path-equal `level`, Auth UID, string display fallbacks, zero counters, empty
list and two server timestamps. `CreatePostForm` limits text to 1000 and
disables submit below 10; the handler repeats the minimum. The Rule requires
the same keys, types, minimum, owner, path level, initial values and request
time. No other producer, admin create, batch or social/moderation create field
was found. Result: `COMPATIBLE`.

### Forum replies

`CG-RPL-001`:

`Foro` → selected post → `ReplyModal` → `handleSubmit` → local
`forumBlocked`, Auth, parent IDs, trim and five-character checks → `addDoc` to
`forums/{level}/posts/{post.id}/replies` → automatic ID → separate
`updateDoc` of the parent post (`repliesCount=increment(1)`, request-time
`updatedAt`) → reload/callback.

The reply payload contains exactly `text`, `userId`, `userName`, `userEmail`,
`createdAt`, `updatedAt`; level and post ID are path-only. Both timestamps use
`serverTimestamp()`. The Rule matches exactly. No batch or transaction exists,
so reply creation can succeed while the counter update fails. That known
non-atomic counter risk is outside the create contract. No other producer or
social field was found. Result: `COMPATIBLE`.

### Forum reports

`CG-RPT-001`:

`Foro` post list → `ForumPostsList` → `ForumPostCard` (foreign post menu) →
`ReportPostButton` → `handleSubmitReport` → Auth/post guard and controlled form
state → inline payload → `addDoc(collection(db, "forumReports"))` → automatic
ID.

The eleven fields are `postId`, `level`, `postUserId`, `postText`,
`reportedBy`, `reporterEmail`, `reason`, `details`, `status`, `createdAt`,
`updatedAt`. Missing display/reference data becomes an empty string; details is
always present, trimmed and may be empty, with UI maximum 500. The exact reason
catalogue is: `Inappropriate content`, `Spam`, `Harassment or offensive
language`, `Wrong level or irrelevant topic`, `Other`. Status is `pending` and
both timestamps use `serverTimestamp()`.

The component does not read `forumBlocked`, but the Rule preserves
`isForumAllowed()` as the authoritative create condition. No reply-report
producer or duplicate guard exists. `forumModerationService` performs only
admin list, status update and delete operations; it does not create reports.
Result: `COMPATIBLE` for an authenticated, forum-allowed caller.

### Support tickets

`CG-SUP-001`:

`Contact` authenticated route → `SupportForm.handleSubmit` →
`validateSupportTicket` → normalized `{category, subject, message, priority}`
→ barrel reexport → `supportService.createSupportTicket` → require
`auth.currentUser`, normalize again and add Auth identity/constants/timestamps
→ `addDoc` to `SUPPORT_TICKETS_COLLECTION="supportTickets"` → automatic ID.

The eleven required fields are `userId`, `userEmail`, `userName`, `category`,
`subject`, `message`, `priority`, `status`, `source`, `createdAt`, `updatedAt`.
Auth supplies UID/email/name; missing email/name normalize to empty strings,
which remain strings. Active UI priority is fixed at `normal`; status is
`open`; source is `authenticated-support`; both timestamps use
`serverTimestamp()`. Categories are exactly `technical`, `account`, `course`,
`suggestion`, `bug`, `other`; subject is 4–120 and message 20–1000. The service
is reexported by `services/support/index.js`; the component is reexported by
`components/support/index.js`. No second producer, public ticket variant or
admin create was found. Result: `COMPATIBLE`.

## Call-graph matrix

| Flow | Resource | UI/event | Validator / payload builder | Service/wrapper | SDK/path | Auth / owner / time | Result |
|---|---|---|---|---|---|---|---|
| CG-MSG-001 | messages | Welcome form / `sendMessage` | inline trim/email/non-empty/min-message; inline object | none | `addDoc`; `messages`; auto ID | anonymous; `anon`; server time | active, INCOMPATIBLE name minimum |
| CG-MSG-002 | messages | none proven | service normalization/object | direct export, default object, support barrel | `addDoc`; constant `messages`; auto ID | anonymous; `anon`; two server times | ORPHANED_CALLABLE_FUNCTION, payload compatible |
| CG-PST-001 | posts | CreatePostForm / Foro handler | UI max 1000; handler trim/min 10; inline object | prop callback only | `addDoc`; `forums/{level}/posts`; auto ID | Auth UID; server times | active, COMPATIBLE |
| CG-RPL-001 | replies | ReplyModal submit | trim/min 5; inline object | none | `addDoc`; nested replies; auto ID | Auth UID; server times | active, COMPATIBLE |
| CG-RPT-001 | reports | ReportPostButton submit | closed select, details max 500; inline object | ForumPostCard/List | `addDoc`; `forumReports`; auto ID | Auth UID; server times | active, COMPATIBLE |
| CG-SUP-001 | tickets | Contact/SupportForm submit | `validateSupportTicket`; service normalization/object | service/component barrels | `addDoc`; constant `supportTickets`; auto ID | Auth UID; server times | active, COMPATIBLE |

## Field and variant matrix

| Resource | Required keys / types | Optional | Constants/catalogue | Origin/transformation | Rules compatibility |
|---|---|---|---|---|---|
| messages | name/email/message/source/userId/status strings; createdAt timestamp | updatedAt timestamp only in orphan service variant | welcome/anon/new | Welcome trims and lowercases email; service normalizes | keys/types/constants/time compatible; active name minimum incompatible |
| posts | text/level/userId/userName/userEmail strings; counts numbers; likedBy list; two timestamps | none | counts 0; list empty | text trimmed; level state/path; Auth/profile fallbacks | compatible |
| replies | text/userId/userName/userEmail strings; two timestamps | none | none beyond owner/time | text trimmed; parent IDs only in path; Auth/profile fallbacks | compatible |
| forumReports | nine strings plus two timestamps | none; details required but may be empty | five reasons; pending | post/user state; details trimmed | compatible |
| supportTickets | nine strings plus two timestamps | none in persisted object | six categories; normal/open/authenticated-support | validator/service normalize; Auth supplies identity | compatible |

No target payload contains `null`, a map or an array except posts `likedBy=[]`.
All persisted timestamp fields use `serverTimestamp()`, which is compatible
with `request.time`. No `Timestamp.now`, `new Date`, `Date.now`, strings or
preserved client values occur in these create payloads.

## Authentication and ownership matrix

| Resource | Caller | UID source | Email/name source | Ownership field | Rules enforcement | Blocked-user condition |
|---|---|---|---|---|---|---|
| messages | anonymous | constant | public form | `userId=anon` compatibility marker | constant shape, not Auth ownership | none |
| posts | authenticated | `auth.currentUser.uid` | user doc/Auth fallback | `userId` | equals `request.auth.uid` | UI and `isForumAllowed()` |
| replies | authenticated | `auth.currentUser.uid` | user doc/Auth fallback | `userId` | equals `request.auth.uid` | UI and `isForumAllowed()` |
| forumReports | authenticated | `auth.currentUser.uid` | Auth email | `reportedBy` | equals `request.auth.uid` | Rules `isForumAllowed()` |
| supportTickets | authenticated page and service | `auth.currentUser.uid` | Auth, normalized | `userId` | equals `request.auth.uid` | not applicable |

## Paths and identifiers

| Resource | Exact collection path | Document ID | Parent/path fields | Duplicated payload IDs |
|---|---|---|---|---|
| messages | `messages` | automatic | none | none |
| posts | `forums/{selectedLevel}/posts` | automatic | selected level | `level` must equal path |
| replies | `forums/{level}/posts/{post.id}/replies` | automatic | level and post ID | neither duplicated |
| forumReports | `forumReports` | automatic | none | postId and level are references, not report ID |
| supportTickets | `supportTickets` | automatic | none | none |

All casing matches the Rules.

## Non-create operation inventory

| Resource | Read/get/list | Update | Delete | Actor / use / Rule posture |
|---|---|---|---|---|
| messages | no functional client found | none found | none found | legacy admin permitted; no active UI consumer |
| posts | Foro lists by level ordered by createdAt | LikeButton changes likes/likedBy; ReplyModal changes repliesCount/updatedAt | Foro owner delete; moderation admin delete | authenticated/owner/admin under unchanged legacy Rules |
| replies | ReplyModal lists ordered by createdAt | no active UI writer found | no active UI writer found | authenticated read; owner/admin update/delete remain permitted |
| forumReports | moderation service lists ordered by createdAt | moderation changes status/updatedAt | moderation deletes report; may delete associated post | legacy admin-only Rules |
| supportTickets | no functional read service found | none found | none found | Rules retain self/admin read and admin update/delete |

## Wrappers, reexports and orphaned writers

- `services/support/index.js`: active indirect reexport for
  `createSupportTicket`; also reexports unused `createPublicMessage` and
  `validatePublicMessage`.
- `components/support/index.js`: active indirect barrel for `SupportForm` and
  sibling UI components.
- Forum create writes are direct component/page SDK calls; no repository,
  factory, batch wrapper or dynamic collection-name builder intervenes.
- `supportService.createPublicMessage` is the only orphaned target writer. It
  has no functional caller found by import/call searches, so it is not used to
  expand the active contract.

## Contract matrix for B2.2

| Contract | Resource/op | Actor/path | Allowed = required keys | Optional | Types/constants/ownership/time | Expected result |
|---|---|---|---|---|---|---|
| CC-MSG-001 | messages create active | anonymous; `messages` | name,email,message,source,userId,status,createdAt | updatedAt | strings; welcome/anon/new; request time | valid shape ALLOW except one-char name exposes current divergence |
| CC-MSG-002 | messages admin ops | legacy admin | existing document | n/a | `isAdmin()` | admin read/update/delete ALLOW; public DENY |
| CC-PST-001 | post create | Auth/forum allowed; level-scoped path | exact ten keys | none | owner UID; text ≥10; level; zero/empty; request time | ALLOW |
| CC-PST-002 | post non-create | Auth/owner/admin | existing post | n/a | unchanged affected-field branches | legacy read/update/delete regression |
| CC-RPL-001 | reply create | Auth/forum allowed; nested path | exact six keys | none | owner UID; text ≥5; strings; request time | ALLOW |
| CC-RPL-002 | reply non-create | Auth/owner/admin | existing reply | n/a | unchanged owner/admin branches | legacy read/update/delete regression |
| CC-RPT-001 | report create | Auth/forum allowed; `forumReports` | exact eleven keys | none | reporter UID; reason list; details ≤500; pending; request time | ALLOW |
| CC-RPT-002 | report admin ops | legacy admin | existing report | n/a | `isAdmin()` | admin read/update/delete ALLOW; non-admin DENY |
| CC-SUP-001 | ticket create | Auth self; `supportTickets` | exact eleven keys | none | owner UID; six categories; lengths; normal/open/source; request time | ALLOW |
| CC-SUP-002 | ticket non-create | self/admin | existing ticket | n/a | unchanged self/admin branches | self/admin read; admin update/delete regression |

## Regression-case inventory

B2.2 must elaborate fixtures for: valid create; anonymous create; missing Auth;
foreign ownership; missing required key; unknown key; wrong type; invalid fixed
value/catalogue; arbitrary timestamp; boundary lengths; read; list/get where
relevant; update; delete; blocked forum user; path-level mismatch; empty/zero
initial values; optional messages `updatedAt`; and cross-resource/SaaS/catch-all
regression. It must specifically cover the current one-character messages-name
conflict before any executable suite can be approved.

## Divergences, Storage, risks and decision

`CODE_CONTRACT_DIVERGENCE`: documentation previously treated both messages
producers as active, but current source has only the direct Welcome caller;
`createPublicMessage` is exported yet orphaned. This is traceability drift, not
a Rule incompatibility by itself.

`CODE_RULES_DIVERGENCE`: Welcome accepts and submits a one-character non-empty
name, while the Rule denies any name shorter than two characters. This can
break a legitimate current form submission and is blocking. No other payload,
path, ownership, constant or timestamp divergence was found.

No active contract in these five create flows requires Firebase Storage.
`storage.rules` remains deny-all and residual `uploadAudio` is unrelated.

```text
SaaS-02C.2G-B2.1 consumer contract and call graph revalidation = INCOMPLETE
SaaS-02C.2G-B2.1 = incomplete_requires_contract_reconciliation
SaaS-02C.2G-B2.2 = blocked
```

A separately authorized corrective phase must decide whether the public form
or the Rule owns the minimum-name contract, then reconcile and revalidate it.
This report does not select or implement that correction. B2.2, runtime Rules
validation and deployment were not started.

## B2.1A corrective resolution

The owner selected `CONSUMER_CHANGE`. SaaS-02C.2G-B2.1A aligned only the active
Welcome form with the existing Rule by validating the already-trimmed name at
2–100 characters and adding matching HTML length hints. The seven-field
payload, constants, timestamp, collection and orphaned service writer remain
unchanged. See `FIRESTORE_RULES_MESSAGE_NAME_CONTRACT_RECONCILIATION.md`.

```text
WELCOME_NAME_CONTRACT_DIVERGENCE = resolved_pending_revalidation
SaaS-02C.2G-B2.1 remains incomplete pending B2.1B
SaaS-02C.2G-B2.2 remains blocked
```

The historical B2.1 finding above is preserved. This update does not itself
perform the required post-change revalidation.

## B2.1B final closure

The authorized read-only post-reconciliation review is recorded in
`FIRESTORE_RULES_CONSUMER_CONTRACT_CLOSURE.md`. It confirmed the trimmed
2–100 Welcome contract, unchanged seven-field payload, compatible orphaned
writer, absence of new messages writers, and continued compatibility of posts,
replies, forumReports and supportTickets. The historical finding above remains
evidence of the original divergence.

```text
WELCOME_NAME_CONTRACT_DIVERGENCE = resolved
B2.1_FINAL_STATUS = completed
SaaS-02C.2G-B2.2 = next, not started
```
