# SaaS-02C.2G-B1.4 — Forum report create hardening

## Purpose, scope and sources

This phase changes only `forumReports/{reportId}` create authorization. It
reviewed the selective plan, B1.1–B1.3 evidence, legacy reconciliation and
compatibility closure, implementation order, current/reference Rules, and all
source consumers. No consumer, test, index, SaaS contract, Storage Rule or
remote Firebase resource changed.

## Consumers

`src/components/forum/ReportPostButton.jsx` is the sole creator. It sends an
exact eleven-field payload. `src/services/forum/forumModerationService.js` is
the administrative consumer: it lists ordered by `createdAt`, updates `status`
and `updatedAt`, deletes reports, deletes reported posts and marks associated
reports `resolved`. Those administrative Rules remain `isAdmin()` unchanged.

## Observed creation contract

| Field | Observed contract | Validation |
|---|---|---|
| `postId` | post ID | non-empty string |
| `level` | post level or empty fallback | string |
| `postUserId` | post owner UID or empty fallback | string |
| `postText` | copied post text or empty fallback | string |
| `reportedBy` | authenticated UID | equals `request.auth.uid` |
| `reporterEmail` | Auth email or empty fallback | string; non-authoritative |
| `reason` | UI select | exact five-value catalogue |
| `details` | trimmed textarea, always present | string, maximum 500 |
| `status` | `pending` | exact initial value |
| `createdAt` | `serverTimestamp()` | equals `request.time` |
| `updatedAt` | `serverTimestamp()` | equals `request.time` |

All eleven fields are required and no optional field was observed. The reason
catalogue is exactly: `Inappropriate content`, `Spam`, `Harassment or offensive
language`, `Wrong level or irrelevant topic`, and `Other`.

## Implemented policy

The validation is inline and uses exact `hasOnly` plus `hasAll`. Authentication
and the existing `isForumAllowed()` behavior are preserved; a forum-blocked
user remains unable to report. `reportedBy` is the only ownership authority.
Email, copied content and post author are denormalized evidence, not authority.
The global report path cannot prove post existence without an added read, so
this shape-hardening phase does not claim referential integrity.

Forum report creation remains available to authenticated, forum-enabled users.
Reporter ownership is bound to `request.auth.uid`. Unknown-field overposting is
denied. Initial status and timestamps are protected. Administrative fields are
absent from the allowlist.

## Preserved administration and duplicates

Existing legacy moderation reads, updates and deletes remain unchanged. Posts,
replies and their counters remain unchanged. Duplicate-report prevention was
not implemented. Duplicate reports remain possible; prevention requires a
backend or dedicated lookup/constraint design.

## Residual risks

This phase does not resolve duplicate or malicious reports, authenticated spam,
PII retention, stale copied `postText`, referential integrity, global moderation
or admin authority, tenant isolation, rate limiting, App Check, backend
validation or an authoritative audit log. `forumReports` remains legacy and
global, never tenant-aware.

## Static comparison

SHA-256 hashes were recalculated over normalized UTF-8 text using
brace-balanced block extraction.

| Unit | Before | After |
|---|---|---|
| Rules bytes | `D16B24C56B559E77B1EBFB91F8D0C75D485961A088923E865FE55C0070971D6E` | `A297DE0F4D601ABAD8CF8748F57D6A16CAB98B5092F8BE1E3B6D34552DCDAA7E` |
| Lines | 984 | 1033 |
| forumReports block | `B1164FBD94F016B9BFC840B9A1C6D3E78753AB5B43F88450FEE219D1C39567B7` | `AA6D533FB3CD780E7EDE8DD4A11B07C34F2E704576FCA9FE3BB1C8D411967CFE` |
| forumReports create | `57D5BFB99946E20950A44B56A016CC1B039287C863F4ECA1EA0B24B40DC8BEAD` | `E7DE64D474B0577C3492E64FE1CD85FE59628FB9594B92738B4A764B52FBF57E` |
| forumReports without create | `FC00212C1D6C36422D5634AA6AA4F14DB461D13D02529721F661FF1DE5DE5094` | `FC00212C1D6C36422D5634AA6AA4F14DB461D13D02529721F661FF1DE5DE5094` |
| Posts | `4C081E55EB2868C5E20BCB9C6F2D38051E6FB38C2B81806A118948A2B050C49E` | `4C081E55EB2868C5E20BCB9C6F2D38051E6FB38C2B81806A118948A2B050C49E` |
| Replies | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` |
| Messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` |
| Non-forumReports-create | `1C137AF075CFB71687D31BF37010C6B10DEA9926D136D936F011B7D0788D9BAB` | `1C137AF075CFB71687D31BF37010C6B10DEA9926D136D936F011B7D0788D9BAB` |
| SaaS zone | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` |
| Catch-all | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` |

Braces are balanced and the final catch-all occurs once. No standalone local
Rules parser was available without Firebase CLI, Java, emulator or installation.

## Future tests and rollback

Future tests must cover valid authenticated create; anonymous/blocked/foreign
reporter denial; missing/unknown/wrong-type fields; reason catalogue; details
limit; initial status; request-time timestamps; administrative overposting; and
unchanged admin read/update/delete plus messages/posts/replies/SaaS semantics.
No test was created.

Rollback triggers are legitimate-create failure, unexpected payload/status,
changed moderation/forum/messages behavior, syntax failure or smoke-test
failure. Restore only the former report-create expression, preserve all prior
hardening and admin operations, rerun build/tests and compare non-create hashes.
No rollback was required.

## Result and gate

```text
FLH-015 = implemented_pending_revalidation
SaaS-02C.2G-B1.4 forumReports create hardening = COMPLETE
SaaS-02C.2G-B1.5 = next, not started
No Firebase deployment was performed.
```

Mandatory human Rules review is required before B1.5.
