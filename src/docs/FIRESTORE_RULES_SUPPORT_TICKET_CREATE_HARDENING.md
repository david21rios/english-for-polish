# SaaS-02C.2G-B1.5 — Support ticket create hardening

## Purpose, scope and sources

This phase changes only `supportTickets/{ticketId}` create authorization. It
reviewed the selective hardening plan, all four prior create-hardening reports,
legacy reconciliation/closure, implementation order, current/reference Rules,
and every support consumer and validator. No functional code, test, index,
Storage Rule, SaaS contract or remote Firebase resource changed.

## Consumers and operations

`src/components/support/SupportForm.jsx` is the only creation UI and calls
`createSupportTicket` in `src/services/support/supportService.js`. The Contact
page requires an authenticated user, and the service rejects missing Auth.
Searches found no support-ticket get/list/update/delete or administrative
consumer. Existing Rules nevertheless preserve self/admin read and admin
update/delete exactly as before.

## Observed payload

The service always writes these eleven required fields:

| Field | Observed contract | Validation |
|---|---|---|
| `userId` | Auth UID | equals `request.auth.uid` |
| `userEmail` | normalized Auth email or empty string | string; non-authoritative |
| `userName` | normalized Auth display name or empty string | string; non-authoritative |
| `category` | UI catalogue | six exact values |
| `subject` | normalized form text | string, 4–120 |
| `message` | normalized form text | string, 20–1000 |
| `priority` | fixed form value/default | exactly `normal` |
| `status` | service initial value | exactly `open` |
| `source` | service constant | exactly `authenticated-support` |
| `createdAt` | `serverTimestamp()` | equals `request.time` |
| `updatedAt` | `serverTimestamp()` | equals `request.time` |

Categories are exactly `technical`, `account`, `course`, `suggestion`, `bug`
and `other`. Although the shared validator recognizes low/normal/high, the only
actual form fixes priority to `normal`; the most restrictive compatible create
policy therefore permits only `normal`. There are no optional payload fields.

## Implemented policy

Inline `hasOnly` and `hasAll` enforce the exact shape. Authentication and self
ownership are required. Email/name remain denormalized presentation data and
are not authorization sources. Initial category, priority, status, source and
timestamps are protected according to the observed consumer contract. Unknown,
SaaS, assignment, response, resolution, audit and deletion fields are excluded.

Support ticket creation remains available to authenticated users. Ticket
ownership is bound to `request.auth.uid`. Unknown-field overposting is denied.
Existing legacy reads, updates and deletes remain unchanged. No tenant-aware
support domain was implemented.

## Abuse, duplicates and residual risks

Repeated ticket creation remains possible. No abuse-prevention backend,
deduplication, rate limiting, CAPTCHA, App Check, email authenticity check,
notification, assignment, response history or authoritative audit log was
implemented. PII retention, global legacy administration, absence of tenant
isolation and the future support domain remain unresolved.

## Static comparison

SHA-256 hashes were recalculated over normalized UTF-8 text using
brace-balanced, block-anchored extraction. An intermediate check found and
reversed an accidental contextual match against the identical former
`userTests` create expression before final validation; `userTests` is identical
to the phase baseline. The final worktree contains only the authorized Rules
semantic change.

| Unit | Before | After |
|---|---|---|
| Rules bytes | `A297DE0F4D601ABAD8CF8748F57D6A16CAB98B5092F8BE1E3B6D34552DCDAA7E` | `DFDAB7A238CC274A66CF37C85ED15E88464551B948EBD9AF9832EF3FD83B1C45` |
| Lines | 1033 | 1084 |
| supportTickets block | `672E3F802DB918A47CE85F9E2BD8BE03DEB1C9AA62FD4DF2A31DEFAB43B5DA8B` | `FFC2E626D128F940563B8ABC19A8F40FB0C7B0F7C3528D4D5E3A46C52EE62982` |
| supportTickets create | `BE9934DEF8465DE3520B41B586693F53539304FAB8C4F0AADBAA74E9644D57BA` | `42B2559C1954F553EED3093ED800DF4DEC8EEF8D65E8CEA40D2C294D0D945830` |
| supportTickets without create | `6189834B5FBFB73155EE4EF0A5ED55F1D0C375FF4F5ACE013306D5A200426838` | `6189834B5FBFB73155EE4EF0A5ED55F1D0C375FF4F5ACE013306D5A200426838` |
| Messages | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` | `E16861635800B636C31D1D75E34ED6F122E124A78C8C330555385CB6F4004FB9` |
| Posts | `4C081E55EB2868C5E20BCB9C6F2D38051E6FB38C2B81806A118948A2B050C49E` | `4C081E55EB2868C5E20BCB9C6F2D38051E6FB38C2B81806A118948A2B050C49E` |
| Replies | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` | `E154FFA1E3D65FF3612C01596269519C17A86CE096E1CA49040A0B24D3BBFB61` |
| forumReports | `AA6D533FB3CD780E7EDE8DD4A11B07C34F2E704576FCA9FE3BB1C8D411967CFE` | `AA6D533FB3CD780E7EDE8DD4A11B07C34F2E704576FCA9FE3BB1C8D411967CFE` |
| Non-supportTickets-create | `A3929E04B97E27EF2D8D88850A3896090B46594C56473C8C5545751D2D343043` | `A3929E04B97E27EF2D8D88850A3896090B46594C56473C8C5545751D2D343043` |
| SaaS zone | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` | `FFF09FA0DA3425AA41BD09B74E75A2F399980187CBE34BE763A006ED810E0A66` |
| Catch-all | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` | `71AD58CF1C0F1B27C441BE6B624AAAD8349B0BB5E3DE16A2886CA99230D0B84A` |

Braces are balanced and the catch-all occurs once at the end. No standalone
Rules parser was available without Firebase CLI, Java, emulator or installation.

## Future tests and rollback

Future tests must cover valid self create; anonymous/foreign/missing owner;
unknown/missing/wrong-type fields; all category and length boundaries;
arbitrary priority/status/source/timestamps; administrative injection; unchanged
self/admin reads and admin writes; and all prior hardenings/SaaS Rules. No test
was created.

Rollback triggers are legitimate SupportForm failure, unexpected payload or
constant, changed read/update/delete or prior-hardening semantics, syntax error
or smoke failure. Restore only the former support create expression, preserve
all other legacy/SaaS Rules, rerun build/tests and compare scoped hashes. No
rollback was required.

## Result and next phase

```text
FLH-020 = implemented_pending_revalidation
SaaS-02C.2G-B1.5 supportTickets create hardening = COMPLETE
SaaS-02C.2G-B1.6 = next, not started
No Firebase deployment was performed.
```

B1.6 will jointly revalidate messages, forum posts, forum replies, forumReports
and supportTickets create hardenings. It was not started. Mandatory human Rules
review is required first.
