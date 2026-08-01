# SaaS-02C.2G-B1.2 — Forum post create hardening

## Purpose and scope

This microphase hardens only create authorization at
`forums/{levelId}/posts/{postId}`. Post reads, updates, deletes, replies, social
updates, every other legacy block, all SaaS Rules, functional code, tests,
indexes, Storage and remote Firebase remain unchanged.

The hardening plan, messages hardening, legacy reconciliation, compatibility
closure, implementation order, current/reference Rules and every functional
`forums` consumer were reviewed directly.

## Consumers and payload

Global SDK searches found one post-create consumer: `src/pages/Foro.jsx`.
`forumModerationService`, `LikeButton` and `ReplyModal` operate on existing
posts but do not create them.

The single writer sends exactly these ten required fields and no optional
field:

| Field | Observed value/type | Create rule |
|---|---|---|
| `text` | trimmed string; UI requires at least 10 characters | string, size >= 10 |
| `level` | selected forum level string | string equal to path `levelId` |
| `userId` | `auth.currentUser.uid` | equal to `request.auth.uid` |
| `userName` | resolved name/displayName/fallback | string |
| `userEmail` | Auth email or empty string | string |
| `repliesCount` | `0` | exactly zero |
| `likes` | `0` | exactly zero |
| `likedBy` | `[]` | list with size zero |
| `createdAt` | `serverTimestamp()` | equal to `request.time` |
| `updatedAt` | `serverTimestamp()` | equal to `request.time` |

No `userPhoto`, moderation field, status or unknown structure is emitted.

## Implemented validation

The expression is inline to keep every non-post-create normalized byte stable.
It requires authentication and preserves `isForumAllowed()` unchanged. An
exact `hasOnly` plus `hasAll` set rejects missing and unknown fields.

Ownership is exclusively `userId == request.auth.uid`; display name and email
are non-authoritative strings. The embedded level must equal `levelId` from the
path. Initial counters are zero, `likedBy` is empty, and both timestamps equal
request time. No arbitrary moderation field can pass the allowlist.

No maximum post-text size was introduced because no existing normative maximum
was found. HTML sanitization, content moderation and word filtering are not
implemented by Rules.

## Preserved behavior

Forum post creation remains available to authenticated, forum-enabled users.
Blocked and anonymous users remain denied. Existing post reads, owner/social
updates, deletes and legacy-admin moderation are unchanged. Reply Rules remain
unchanged. The previously implemented messages hardening remains identical.

No backend counter management was implemented. Likes, `likedBy` and
`repliesCount` update risks remain `REQUIRES_BACKEND` under FLH-010.

## Residual risks

This phase does not resolve authenticated spam, abusive content, sanitization,
moderation, concurrent likes, `likedBy` coherence, `repliesCount` drift, broad
owner edits, legacy deletes, global admin, tenant isolation, rate limiting or
App Check. The forum remains a global legacy feature, never tenant-aware.

## Future tests

The later Rules-test phase must cover anonymous/blocked denial; valid create;
foreign or missing owner; unknown/missing fields; invalid or short text;
mismatched level; invalid visual-field types; non-zero/negative counters;
non-empty or invalid `likedBy`; arbitrary timestamps or moderation fields; and
preservation of reads, owner/social updates, deletes, replies and admin
moderation. No executable test was created here.

## Static evidence

| Metric | Before | After |
|---|---|---|
| Rules SHA-256 | `CA985999D860A4A1855208A5FDF1D7817C2B58F556A24E88BB0699CC9B949C02` | `5B93D593DAD79C37A9F572FFC98F658DFB198483BDB090FA5B6CFC38894495D0` |
| Lines | 916 | 957 |
| Post block | `B749118CCE4EF47E7C083064D8D211DCB40DD16204754D89907F7D2752EA3021` | `5B28A0064C33001E249CDD7C5FD10E0DE968E2BA1013689BD7B37FA9AD4F9029` |
| Post create | `D61F666AAFE21391A91DABB8F7068397FE4391BA05A3DEA146507527961230A7` | `304A818C1E17BBAFCED67597ECF17DEBE9D73D6F839BEF595FDFF92E9641BBF7` |
| Non-post-create | `29A83065161F7021B63ADF4B92770A738085EB2E34F7A64C477BCF6531A16502` | `29A83065161F7021B63ADF4B92770A738085EB2E34F7A64C477BCF6531A16502` |
| Messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` |

## Rollback

Triggers are legitimate create failure, an unrecognized legitimate field,
changed blocked-user/update/delete behavior, syntax failure or smoke-test
failure. Rollback restores only the former post-create expression, preserves
messages hardening, replies, every other legacy/SaaS block, reruns build/tests
and compares all scoped hashes. No rollback was required.

## Result and gate

```text
Forum post creation remains available to authenticated, forum-enabled users.
Post ownership is bound to request.auth.uid.
Unknown-field overposting is denied.
Initial likes, likedBy and repliesCount are protected.
Existing post reads, updates, deletes and moderation remain unchanged.
Reply Rules remain unchanged.
No backend counter management was implemented.
FLH-008 = implemented_pending_revalidation
SaaS-02C.2G-B1.2 forum post create hardening = COMPLETE
No Firebase deployment was performed.
```

SaaS-02C.2G-B1.3 has not started. Mandatory human Rules review is required
before it may begin.

## Forensic revalidation B1.2A

`FIRESTORE_RULES_FORUM_POST_FORENSIC_REVALIDATION.md` independently
reconstructed the post-B1.1 baseline and confirmed that only posts `allow
create` changed. The static-evidence table above contains the correctly
calculated historical value: non-post-create was
`29A83065161F7021B63ADF4B92770A738085EB2E34F7A64C477BCF6531A16502`
both before and after.

For historical transparency, the B1.2 final response instead transcribed the
incorrect current value
`29A83065161F7021B63ADF4B92770A738085EB99282C5E1E7CCF12E45A4D4BA6`.
That value mixed the correct prefix with the suffix of a B1.1 non-message hash;
it was not produced by the B1.2 comparison. The error was documentary only.
Messages, replies, posts read/update/delete, all other legacy blocks, the SaaS
zone and catch-all are equal. `FLH-008 = revalidated` and B1.2 remains
`COMPLETE`, pending the mandatory human forensic review of B1.2A.
