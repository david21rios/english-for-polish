# SaaS-02C.2G-B1.2A — Forensic revalidation of forum post hardening

## Purpose and scope

This read-only forensic review resolves the contradictory non-post-create hash
reported after SaaS-02C.2G-B1.2. Sources were the current `firestore.rules`,
the owner-supplied legacy reference, the B1.1 and B1.2 reports, the selective
hardening plan, Git diff/status evidence and the implementation order. No Rule,
functional code, test, index, Firebase configuration or remote resource changed.

## Reproducible baseline reconstruction

The immediately-post-B1.1 baseline was reconstructed in memory from the current
composite ruleset. A brace-balanced parser located the canonical
`forums/{levelId}/posts/{postId}` block; a semicolon-bounded extractor replaced
only its current `allow create` expression with the former expression found in
`FIRESTORE_RULES_LEGACY_REFERENCE.rules`:

```text
allow create: if isForumAllowed()
  && request.resource.data.userId == request.auth.uid;
```

This retains the complete legacy ruleset, all local SaaS Rules and the B1.1
messages hardening. It is therefore not the original legacy-only baseline and
does not depend on a commit lacking accumulated phases. No temporary artifact
was written into the repository.

## Extraction and normalization

Blocks were extracted by scanning balanced braces after their full match marker;
allow expressions were extracted through their terminating semicolon. Separate
units were produced for messages, posts, posts create, posts without create,
replies, legacy without posts create, the complete SaaS zone, catch-all and full
file. Read, update and delete were also extracted independently.

Textual normalization removes only block comments, line comments and whitespace.
Structural normalization removes exactly the posts `allow create` expression;
it does not remove the post block, replies, messages, helpers or generic create
lines. Every hash below is SHA-256 over normalized UTF-8 text, using the same
algorithm for baseline and current.

## Recalculated hashes

| Unit | Baseline | Current | Equal |
|---|---|---|---|
| Complete file | `903B2B77D05C3375A6787AB529BACAA9E0DA67260DAD7560B2FD73515F1B326D` | `4DE6BA3DFA0CC2B2EF63456E9867BA5E8D404782C409433E3AF5FFF945F30DDD` | No, expected |
| Messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | Yes |
| Posts | `B749118CCE4EF47E7C083064D8D211DCB40DD16204754D89907F7D2752EA3021` | `5B28A0064C33001E249CDD7C5FD10E0DE968E2BA1013689BD7B37FA9AD4F9029` | No, expected |
| Posts create | `D61F666AAFE21391A91DABB8F7068397FE4391BA05A3DEA146507527961230A7` | `304A818C1E17BBAFCED67597ECF17DEBE9D73D6F839BEF595FDFF92E9641BBF7` | No, authorized |
| Posts without create | `8656BC6A44A43BF0AD05595CFB3DE1BE80B3FF9F9F6F87B67CDC176D905372D0` | `8656BC6A44A43BF0AD05595CFB3DE1BE80B3FF9F9F6F87B67CDC176D905372D0` | Yes |
| Replies | `4A62E064B832E76D13A4C5CE49A10184CF42039036E1A72357F7F4B9EDADFC37` | `4A62E064B832E76D13A4C5CE49A10184CF42039036E1A72357F7F4B9EDADFC37` | Yes |
| Legacy without posts create | `6C9737B2E67D96C1B96AFE6B25C78202CC4D6A05FCA1AA698111279FA3228559` | `6C9737B2E67D96C1B96AFE6B25C78202CC4D6A05FCA1AA698111279FA3228559` | Yes |
| Complete SaaS zone | `660DC974C82E7B1C050AD663891EA9493611AA5724DD8940AF958EE08DF67623` | `660DC974C82E7B1C050AD663891EA9493611AA5724DD8940AF958EE08DF67623` | Yes |
| Catch-all | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | Yes |

## Exact diff and classification

One difference exists, at the post-create expression near current lines
301–343. The former two-condition expression was replaced by authenticated and
forum-enabled validation of the exact ten-field shape, self `userId`, text,
level, presentation fields, zero counters, empty `likedBy` and request-time
timestamps. Classification: `AUTHORIZED_POST_CREATE_CHANGE`.

There are zero `COMMENT_ONLY`, `WHITESPACE_ONLY`, `LINE_ENDING_ONLY`,
`UNAUTHORIZED_SEMANTIC_CHANGE` or `EXTRACTION_OR_NORMALIZATION_ERROR`
differences. Posts read/update/delete hashes are equal independently.

## Semantic validation

```text
MESSAGES_SEMANTICS_EQUAL=True
REPLIES_SEMANTICS_EQUAL=True
POST_READ_SEMANTICS_EQUAL=True
POST_UPDATE_SEMANTICS_EQUAL=True
POST_DELETE_SEMANTICS_EQUAL=True
POST_CREATE_SEMANTICS_EQUAL=False
OTHER_LEGACY_SEMANTICS_EQUAL=True
IDENTITY_SEMANTICS_EQUAL=True
TENANT_SEMANTICS_EQUAL=True
MEMBERSHIP_REQUEST_SELF_SEMANTICS_EQUAL=True
COURSE_ENROLLMENT_SEMANTICS_EQUAL=True
CATCH_ALL_SEMANTICS_EQUAL=True
```

## Root cause and documentary correction

The B1.2 technical output and its implementation report both recorded the equal
non-post-create value
`29A83065161F7021B63ADF4B92770A738085EB2E34F7A64C477BCF6531A16502`
before and after. The subsequent final response transcribed an incorrect current
value ending `EB99282C5E1E7CCF12E45A4D4BA6`; that suffix came from the distinct
B1.1 non-message hash
`BA61503B7774FAAE14D349BD8E382316D417EB99282C5E1E7CCF12E45A4D4BA6`.
Thus the cause is a cross-phase transcription/substitution error, not a Rules
mutation or nondeterministic normalization. Historical values remain recorded;
this report supplies the correction and reproducible evidence.

## Decision

Option A is proven: only the posts `allow create` expression changed.

```text
FLH-008 = revalidated
SaaS-02C.2G-B1.2 = COMPLETE
SaaS-02C.2G-B1.2A forum post hardening forensic revalidation = COMPLETE
SaaS-02C.2G-B1.3 = next, not started
```

Mandatory human forensic review is required before B1.3. No Firebase deployment
was performed, and Rules must not be modified as part of this revalidation.
