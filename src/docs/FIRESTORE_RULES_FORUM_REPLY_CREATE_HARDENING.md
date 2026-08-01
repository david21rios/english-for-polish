# SaaS-02C.2G-B1.3 — Forum reply create hardening

## Purpose, scope and sources

This phase hardens only `allow create` for
`forums/{levelId}/posts/{postId}/replies/{replyId}`. It reviewed the selective
hardening plan, B1.1/B1.2/B1.2A evidence, legacy reconciliation and closure,
implementation order, current and reference Rules, and all source searches for
reply creation. No other permission, consumer, test, index, Storage rule or
remote Firebase resource was changed.

## Consumer and observed payload

Global SDK/path searches found one reply writer:
`src/components/forum/ReplyModal.jsx`. It performs `addDoc` with exactly six
required fields:

| Field | Observed value/type | Implemented validation |
|---|---|---|
| `text` | trimmed string; UI minimum 5 | string and size >= 5 |
| `userId` | authenticated `user.uid` | equals `request.auth.uid` |
| `userName` | profile/Auth/fallback display string | string |
| `userEmail` | Auth email or empty string | string |
| `createdAt` | `serverTimestamp()` | equals `request.time` |
| `updatedAt` | `serverTimestamp()` | equals `request.time` |

There are no optional fields. The payload does not embed level or parent post
ID; their canonical authority is the path. It contains no photo, likes,
`likedBy`, counters, status, deletion or moderation fields.

## Implemented policy

The validation remains inline so the only semantic change is reply create. It
requires `isAuthenticated()` and preserves `isForumAllowed()` unchanged. Exact
`hasOnly` and `hasAll` sets reject unknown and missing fields. Ownership is
bound exclusively to the authenticated UID; display name and email are typed
denormalized presentation data and never authorization sources. Both timestamps
must use request time. No maximum text length was invented because none was
found in the current UI, legacy Rules or approved plan.

Forum reply creation remains available to authenticated, forum-enabled users.
Reply ownership is bound to `request.auth.uid`. Unknown-field overposting is
denied. Embedded level and post references are protected when present; the
observed contract contains neither, so the path is authoritative. Existing
reply reads, updates and deletes remain unchanged. Existing post Rules remain
unchanged.

## Parent counter flow

After `addDoc` succeeds, `ReplyModal.jsx` separately calls `updateDoc` on the
parent post with `repliesCount: increment(1)` and an updated server timestamp.
There is no batch or transaction. A failure between operations can leave the
reply and counter inconsistent, and the client-writable increment remains
manipulable. Parent post `repliesCount` behavior remains unchanged and still
requires future backend hardening under FLH-010 (`REQUIRES_BACKEND`).

## Preserved permissions and residual risks

Reply read/update/delete, every post operation, messages hardening, other legacy
blocks, SaaS Rules and final catch-all retain their prior semantics. This phase
does not solve authenticated spam, abusive content, sanitization, moderation,
broad reply edits, legacy deletion, non-atomic/manipulable counters, global
admin, tenant isolation, rate limiting or App Check. The forum remains legacy
and global, not tenant-aware.

## Static comparison

Hashes are SHA-256 over normalized UTF-8 text using brace-balanced extraction.
The posts comparison excludes its nested replies match; the complete enclosing
post block necessarily changes because replies are nested within it.

| Unit | Before | After |
|---|---|---|
| Rules bytes | `5B93D593DAD79C37A9F572FFC98F658DFB198483BDB090FA5B6CFC38894495D0` | `D16B24C56B559E77B1EBFB91F8D0C75D485961A088923E865FE55C0070971D6E` |
| Lines | 957 | 984 |
| Reply block | `4A62E064B832E76D13A4C5CE49A10184CF42039036E1A72357F7F4B9EDADFC37` | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` |
| Reply create | `D61F666AAFE21391A91DABB8F7068397FE4391BA05A3DEA146507527961230A7` | `6D6D406CE400C72DEF03A209ED974D6024C5B838F106788A9FAAED73690270C4` |
| Reply without create | `A859F840600A8B97AE802B0A7E70FB890EC9C0062AA68FEB3AD388D81111A568` | `A859F840600A8B97AE802B0A7E70FB890EC9C0062AA68FEB3AD388D81111A568` |
| Posts excluding nested replies | `DB9D16FEF78E1BF89E7C7333CFED3EF0C927FD1F66FBE3244702A3BA7E46D4BA` | `DB9D16FEF78E1BF89E7C7333CFED3EF0C927FD1F66FBE3244702A3BA7E46D4BA` |
| Messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` |
| Non-reply-create | `D7A6BD93C90000B1D78DA44C30CFEC2A446B9533234EDC362BFE941E50DC5696` | `D7A6BD93C90000B1D78DA44C30CFEC2A446B9533234EDC362BFE941E50DC5696` |
| SaaS zone | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` |
| Catch-all | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` |

Structural checks found balanced braces, one final catch-all and no semantic
change outside reply create. No already-installed standalone Rules parser was
available without Firebase CLI, Java, emulator or installation.

## Future tests

Future Rules tests must cover anonymous and blocked denial; valid self create;
foreign/missing owner; unknown/missing fields; invalid/empty/short text; invalid
display strings; arbitrary timestamps; unexpected level, post, social or
moderation fields; and unchanged reply read/update/delete, post operations,
counter update and messages behavior. No test was created in this phase.

## Rollback

Triggers are a legitimate reply failure, an unexpected legitimate field,
changed blocked-user/post/reply/messages semantics, syntax failure or smoke-test
failure. Rollback restores only the former reply-create expression, preserves
messages and post hardening plus every other legacy/SaaS block, reruns build and
tests, compares non-reply-create hashes and records the reason. No rollback was
required.

## Result and gate

```text
FLH-012 = implemented_pending_revalidation
SaaS-02C.2G-B1.3 forum reply create hardening = COMPLETE
SaaS-02C.2G-B1.4 = next, not started
No Firebase deployment was performed.
```

Mandatory human Rules review is required before B1.4.
