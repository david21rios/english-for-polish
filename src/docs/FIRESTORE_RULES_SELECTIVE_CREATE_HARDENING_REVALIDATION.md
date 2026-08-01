# SaaS-02C.2G-B1.6 — Joint selective create hardening revalidation

## Purpose, scope and sources

This read-only closure jointly revalidates the five authorized legacy create
hardenings: messages, forum posts, forum replies, forumReports and
supportTickets. It reviewed the complete current and owner-supplied Rules,
individual implementation/forensic reports, selective plan, reconciliation,
compatibility closure, normative Rules design/security gate, implementation
order and all current consumers. No Rule, functional code, test, index, Storage
configuration or remote Firebase resource changed.

## Consumers and contracts

Global SDK/path searches found no new writer or payload variant.

| Resource | Consumer | Authentication/ownership | Required payload | Constants and timestamps | FLH | Decision |
|---|---|---|---|---|---|---|
| messages | `Welcome.jsx`, `supportService.createPublicMessage` | anonymous permitted; `userId=anon` | name, email, message, source, userId, status, createdAt; updatedAt optional | source `welcome`, status `new`, request-time timestamps | FLH-001 | revalidated |
| forum posts | `Foro.jsx` | Auth, forum allowed, `userId=auth.uid` | text, level, userId, userName, userEmail, repliesCount, likes, likedBy, createdAt, updatedAt | path level; zero counters; empty likedBy; request time | FLH-008 | revalidated |
| forum replies | `ReplyModal.jsx` | Auth, forum allowed, `userId=auth.uid` | text, userId, userName, userEmail, createdAt, updatedAt | level/post are path-authoritative; request time | FLH-012 | revalidated |
| forumReports | `ReportPostButton.jsx` | Auth, forum allowed, `reportedBy=auth.uid` | postId, level, postUserId, postText, reportedBy, reporterEmail, reason, details, status, createdAt, updatedAt | five reasons; pending; request time | FLH-015 | revalidated |
| supportTickets | `SupportForm` through `supportService` | Auth, `userId=auth.uid` | userId, userEmail, userName, category, subject, message, priority, status, source, createdAt, updatedAt | six categories; normal/open/authenticated-support; request time | FLH-020 | revalidated |

The report reason catalogue remains `Inappropriate content`, `Spam`,
`Harassment or offensive language`, `Wrong level or irrelevant topic`, `Other`.
Support categories remain `technical`, `account`, `course`, `suggestion`, `bug`,
`other`.

## Structural extraction and current hashes

A deterministic brace-balanced scanner starts after each full match marker and
tracks nested braces. Allow expressions terminate at their semicolon. The posts
hash excludes its nested replies match where separation is required. Textual
normalization removes only comments and whitespace; operators, paths, fields,
values and conditions remain. SHA-256 is calculated over normalized UTF-8.

| Unit | Block | Create | Without create |
|---|---|---|---|
| messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `839F245DC23DB7C90C4099949ADE2F638C9F8C8210B528BD673727F8EF4C8B2C` | `5CEAC6A6977E0867FD1F6D5CD589CC1C127611BDCCBF7D62FAE0739B38CE6AA7` |
| posts excluding replies | `DB9D16FEF78E1BF89E7C7333CFED3EF0C927FD1F66FBE3244702A3BA7E46D4BA` | `304A818C1E17BBAFCED67597ECF17DEBE9D73D6F839BEF595FDFF92E9641BBF7` | `A80B5621CB0A5DD3616444FD8E91041A39E68424C9EA5C10A3A783F808A109B8` |
| replies | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` | `6D6D406CE400C72DEF03A209ED974D6024C5B838F106788A9FAAED73690270C4` | `A859F840600A8B97AE802B0A7E70FB890EC9C0062AA68FEB3AD388D81111A568` |
| forumReports | `AA6D533FB3CD780E7EDE8DD4A11B07C34F2E704576FCA9FE3BB1C8D411967CFE` | `E7DE64D474B0577C3492E64FE1CD85FE59628FB9594B92738B4A764B52FBF57E` | `FC00212C1D6C36422D5634AA6AA4F14DB461D13D02529721F661FF1DE5DE5094` |
| supportTickets | `FFC2E626D128F940563B8ABC19A8F40FB0C7B0F7C3528D4D5E3A46C52EE62982` | `42B2559C1954F553EED3093ED800DF4DEC8EEF8D65E8CEA40D2C294D0D945830` | `6189834B5FBFB73155EE4EF0A5ED55F1D0C375FF4F5ACE013306D5A200426838` |

Additional joint baseline hashes:

```text
userTests = FBCA2644A093432ADF1D1E97D75B0681C43E4F0D1DC770D1712551D73C0E8673
legacy zone = C2B80C24ECEF0ADC8F121CB9E7F6716943D48CEF915ACDDB8B2A1DC4E2ED771F
SaaS zone = FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66
catch-all = 71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A
complete normalized Rules = AD0F8F94D93495453CD0DD084AE4E96DD83DBC661AB1A6814F18C9CD147AD7A4
normalized storage.rules = 62069710DAC65CC5FFCAF1F1FC5698D7BF9DBB334DCA51EE71F22F85E2A8E76F
```

Historical expression hashes match B1.1, B1.2A, B1.3, B1.4 and B1.5. Parent
post hashes differ across nested-reply phases only when the earlier extraction
included replies; the isolated outer-post hash is stable. The B1.2 transcription
issue remains corrected by B1.2A and was not reintroduced.

## Legacy reference, userTests and difference classification

The current `userTests` normalized hash equals the authoritative reference hash
`FBCA2644A093432ADF1D1E97D75B0681C43E4F0D1DC770D1712551D73C0E8673`.
Path, create/read/update/delete, fields, conditions and helper use are identical;
there is no residual B1.5 contextual edit.

Every functional difference from the owner reference belongs to exactly one
approved class: `AUTHORIZED_SAAS_ADDITION`,
`AUTHORIZED_MESSAGES_CREATE_HARDENING`, `AUTHORIZED_POST_CREATE_HARDENING`,
`AUTHORIZED_REPLY_CREATE_HARDENING`,
`AUTHORIZED_FORUM_REPORT_CREATE_HARDENING`, or
`AUTHORIZED_SUPPORT_TICKET_CREATE_HARDENING`. Documentary composition also has
comment/whitespace differences. `UNAUTHORIZED_CHANGE = none`.

All non-target legacy reads, updates and deletes retain pre-B1 semantics:

```text
ALL_NON_TARGET_READ_SEMANTICS_EQUAL=True
ALL_NON_TARGET_UPDATE_SEMANTICS_EQUAL=True
ALL_NON_TARGET_DELETE_SEMANTICS_EQUAL=True
USER_TESTS_SEMANTICS_EQUAL_TO_PRE_B1_BASELINE=True
```

## Matches and helpers

There are 11 original legacy helpers, zero added legacy helpers and 55 SaaS
helpers. All five create validations are inline. Legacy helpers are not used by
SaaS; SaaS helpers are not used by legacy; no unsafe shared create helper exists.

Direct, nested, recursive, collection-group and catch-all matches were reviewed.
The posts match does not grant reply access; replies require their own nested
allow. Recursive matches only cover canonical SaaS membership/request lists and
do not overlap these legacy names. Firestore permission union creates no bypass.

```text
NO_CREATE_PERMISSION_UNION_BYPASS=True
NO_RECURSIVE_MATCH_BYPASS=True
NO_COLLECTION_GROUP_BYPASS=True
NO_CATCH_ALL_BYPASS=True
NO_SAAS_LEGACY_PERMISSION_CROSSOVER=True
```

## SaaS, catch-all and Storage

Identity, Tenant, Membership/Request and Course/Enrollment semantics remain
equal to the pre-B1 composite baseline. Lookup documents remain client deny-all.
The catch-all occurs once, is final and denies read/write. No unconditional
legacy/SaaS catch-all allow exists. `storage.rules` remains unchanged and
deny-all; residual `uploadAudio` remains outside the SaaS target.

Independent Firestore Rules syntax validation = `NOT AVAILABLE`. Structural
validation found balanced braces, unique wrapper and final catch-all. Semantic
static review passed. Runtime/emulator validation and remote deployment
validation were not performed.

## Future-test matrix

| Area | Positive | Negative/regression |
|---|---|---|
| Messages | both valid anonymous shapes | unknown fields, constants, spoofing, timestamps; admin ops |
| Posts | valid authenticated create | blocked/foreign/level/counters/likedBy/timestamps; reads/updates/deletes |
| Replies | valid authenticated create | blocked/foreign/unknown/social/moderation/timestamps; counter flow |
| Reports | valid authenticated create | foreign reporter/reason/status/details/admin fields/timestamps; admin ops |
| Support | valid authenticated create | foreign uid/category/priority/status/source/admin fields/timestamps; legacy ops |
| Regression | SaaS self/Tenant/Membership/Request/Course/Enrollment reads | catch-all and Storage deny |

No executable test was created.

## Independent rollback plan

Each hardening can be reverted independently by restoring only its prior create
expression from the owner reference/B1 report. Trigger: legitimate-flow or
syntax/smoke regression. Files: `firestore.rules` plus an authorized rollback
record only. Smoke the matching consumer, then rerun all five create regressions,
legacy read/update/delete checks and SaaS/catch-all denial. Human rollback
approval is mandatory. No rollback was executed.

## Residual risks

B1 does not solve automated abuse, rate limiting, CAPTCHA, App Check, backend
validation, duplicates, PII retention, report referential integrity, concurrent
social counters, non-atomic repliesCount, broad legacy edits/deletes, global
admin, missing Tenant isolation, client-controlled userTests/progress, public
presentations, residual uploadAudio, tenant-aware forum/support or authoritative
audit. B1 reduces overposting and spoofing only in five create operations.

## Decisions and gate

```text
FLH-001 = revalidated
FLH-008 = revalidated
FLH-012 = revalidated
FLH-015 = revalidated
FLH-020 = revalidated
SaaS-02C.2G-B1.6 joint selective create hardening revalidation = COMPLETE
SaaS-02C.2G-B1 = completed_pending_human_closure
SaaS-02C.2G-B2 = next, not started
```

Mandatory human joint review is required before B2. No deployment was performed.
