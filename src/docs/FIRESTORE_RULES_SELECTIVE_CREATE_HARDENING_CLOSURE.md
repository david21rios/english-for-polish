# SaaS-02C.2G-B1.7 — Selective create hardening closure

## Purpose, scope and sources

This document records the owner-approved human closure of the local B1
baseline. The complete selective-hardening plan, joint B1.6 revalidation, five
implementation reports, post forensic report, legacy reconciliation,
legacy/SaaS compatibility closure, Rules design, security gate, implementation
order, `firestore.rules` and `storage.rules` were reviewed directly.

```text
SaaS-02C.2G-B1 is closed documentally and locally.
The five selective create hardenings were jointly revalidated.
No Firebase deployment was performed.
No runtime or Emulator Suite validation was performed.
No legacy path is authorized for removal.
The remaining legacy risks continue in the backlog.
```

## Closed B1 scope

| FLH | Path / consumer | Permitted caller and ownership | Shape, constants and time | Unchanged operations | Status |
|---|---|---|---|---|---|
| FLH-001 | `messages/{messageId}`; `Welcome.jsx`, `supportService.createPublicMessage` | anonymous create remains permitted; legacy payload uses `userId=anon` | strict observed keys; `source=welcome`, `status=new`; request-time timestamps | read/update/delete remain legacy-admin | revalidated |
| FLH-008 | `forums/{levelId}/posts/{postId}`; `Foro.jsx` | authenticated, forum-allowed; `userId=request.auth.uid` | exact ten keys; path-level equality; zero counters, empty `likedBy`; request time | read/update/delete and social updates unchanged | revalidated |
| FLH-012 | nested `replies/{replyId}`; `ReplyModal.jsx` | authenticated, forum-allowed; `userId=request.auth.uid` | exact six keys; typed display fields; request time | read/update/delete and parent counter update unchanged | revalidated |
| FLH-015 | `forumReports/{reportId}`; `ReportPostButton.jsx` | authenticated, forum-allowed; `reportedBy=request.auth.uid` | exact eleven keys; closed reason catalogue, `pending`; request time | admin read/update/delete unchanged | revalidated |
| FLH-020 | `supportTickets/{ticketId}`; `SupportForm`/`supportService` | authenticated self; `userId=request.auth.uid` | exact eleven keys; closed category catalogue, `normal`, `open`, `authenticated-support`; request time | self/admin read and admin update/delete unchanged | revalidated |

These are the only B1 semantic changes. Each preserves its observed consumer,
reduces create overposting, binds ownership where applicable, protects initial
constants and timestamps, does not introduce Tenant authority and was not
deployed.

## Recalculated immutable baseline

SHA-256 block hashes use the B1.6 brace-balanced extraction and normalization:
comments and whitespace are removed; paths, identifiers, operators, values and
conditions remain. The posts unit excludes its nested replies block.

| Unit | Recalculated B1.7 | Expected B1.6 | Result |
|---|---|---|---|
| `firestore.rules` bytes | `DFDAB7A238CC274A66CF37C85ED15E88464551B948EBD9AF9832EF3FD83B1C45` | same | equal |
| `firestore.rules` lines | `1084` | `1084` | equal |
| `storage.rules` bytes | `2BB6E20646B7B8DF9D4F3E318B4F9D51C0294AA10B0F899A7D96A4BE0C7DEE8C` | same | equal |
| messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | same | equal |
| posts excluding replies | `DB9D16FEF78E1BF89E7C7333CFED3EF0C927FD1F66FBE3244702A3BA7E46D4BA` | same | equal |
| replies | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` | same | equal |
| forumReports | `AA6D533FB3CD780E7EDE8DD4A11B07C34F2E704576FCA9FE3BB1C8D411967CFE` | same | equal |
| supportTickets | `FFC2E626D128F940563B8ABC19A8F40FB0C7B0F7C3528D4D5E3A46C52EE62982` | same | equal |
| userTests | `FBCA2644A093432ADF1D1E97D75B0681C43E4F0D1DC770D1712551D73C0E8673` | same | equal |
| legacy zone | `C2B80C24ECEF0ADC8F121CB9E7F6716943D48CEF915ACDDB8B2A1DC4E2ED771F` | same | equal |
| SaaS zone | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` | same | equal |
| final catch-all | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | same | equal |

The zone values were recalculated from the same normalized structural units
defined by B1.6, not from a newly chosen substring boundary. The byte hashes at
phase entry and exit are also compared in validation. `userTests` remains equal
to the owner legacy reference.

## Validation performed and not performed

Performed: direct source review; current hash and line-count calculation;
brace-balanced scoped extraction; normalized SHA-256 comparison; legacy/SaaS,
catch-all and no-Storage static review; application build; unit tests;
`git diff --check`; and `git status --short`.

Not performed: official Rules compilation, Firebase CLI, Emulator Suite,
Rules tests, runtime authorization checks, remote project/data inspection,
deployment, App Check, CAPTCHA, rate limiting, migration or backend validation.

## Residual limits and risks

B1 does not make any legacy feature tenant-aware and does not eliminate legacy
risk. It does not solve automated abuse, rate limiting, App Check, CAPTCHA,
backend authority, duplicate messages/reports, PII retention, concurrent
likes/`likedBy`, `repliesCount`, broad update/delete permissions, global admin,
client-controlled `userTests` or progress, public presentations, or residual
`uploadAudio`. It provides no official syntax/runtime assurance.

Every legacy block remains `Ready to remove = No`, including users, progress,
topicProgress, attempts, levels/modules/lessons, temas/missions, tests,
userTests, presentations, forum/replies, forumReports, messages,
supportTickets and aiGeneratedLessons. Removal still requires migrated data,
consumers, repositories and queries; Rules and smoke tests; rollback;
production verification; and human approval.

## Storage, rollback and decision

Firebase Storage remains outside the SaaS target and `storage.rules` remains
deny-all. `uploadAudio` is a residual dependency pending functional retirement,
not a reason to design Storage Rules.

Each B1 create hardening retains an independent rollback: restore only its
prior create expression, preserve all other legacy/SaaS Rules, rerun structural
and runtime checks, smoke the affected consumer and obtain human approval.
No rollback was executed.

```text
FLH-001 = revalidated
FLH-008 = revalidated
FLH-012 = revalidated
FLH-015 = revalidated
FLH-020 = revalidated
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B2 = designed_not_started
```

B2 is defined separately by
`FIRESTORE_LEGACY_HARDENING_B2_SCOPE.md`. No deployment or B2 implementation
is authorized by this closure.
