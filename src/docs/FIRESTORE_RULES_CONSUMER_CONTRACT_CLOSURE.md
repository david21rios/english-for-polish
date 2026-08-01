# SaaS-02C.2G-B2.1B — Consumer contract closure

## Purpose and scope

This read-only phase revalidated the B2.1A Welcome correction against current
consumer source and local Firestore Rules. It also checked the other four B1
create contracts. No consumer, service, Rule, index, test, Storage file or
remote Firebase state was modified.

## Historical divergence and Welcome revalidation

B2.1 found that `Welcome.jsx` accepted a one-character name while the
`messages` create Rule requires 2–100 characters. B2.1A applied the approved
`CONSUMER_CHANGE`. The original finding remains preserved in the B2.1 report.

Current source computes `cleanName = name.trim()`, rejects normalized lengths
below 2 or above 100, and persists `name: cleanName`. The input declares
`minLength={2}` and `maxLength={100}`.

| Static case | Result |
|---|---|
| empty or spaces only | denied by UI |
| one useful character | denied by UI |
| two useful characters | permitted |
| 100 useful characters | permitted |
| 101 useful characters | denied by UI |
| outer spaces | removed before validation and persistence |
| accents, internal spaces, international characters | permitted within bounds |
| unknown field or wrong fixed value | denied by Rules |
| arbitrary timestamp | denied by Rules |

## Messages contract

Welcome calls `addDoc(collection(db, "messages"), payload)`, so its document ID
is automatic. The payload contains exactly:

```text
name: cleanName
email: cleanEmail
message: cleanMessage
source: "welcome"
createdAt: serverTimestamp()
userId: "anon"
status: "new"
```

`updatedAt` is absent.

| Field | Code | Rules | Result |
|---|---|---|---|
| name | trimmed string, 2–100 | string, 2–100 | COMPATIBLE |
| email | normalized string under current UI checks | string, 5–254 | COMPATIBLE |
| message | trimmed string, 10–1000 | string, 10–2000 | COMPATIBLE |
| source | `welcome` | `welcome` | COMPATIBLE |
| userId | `anon` | `anon` | COMPATIBLE |
| status | `new` | `new` | COMPATIBLE |
| createdAt | server timestamp | request time | COMPATIBLE |
| updatedAt | absent | optional request time | COMPATIBLE |

```text
WELCOME_NAME_CONTRACT_DIVERGENCE = resolved
WELCOME_MESSAGES_CONTRACT_COMPATIBLE=True
```

## Orphaned writer and search result

`supportService.createPublicMessage` remains exported directly, by the default
service object and by `src/services/support/index.js`. No functional caller was
found. It remains `ORPHANED_CALLABLE_FUNCTION`, writes the same contract plus
`updatedAt=serverTimestamp()`, and remains compatible with Rules.

```text
ACTIVE_MESSAGES_WRITERS = 1
ORPHANED_MESSAGES_WRITERS = 1
NEW_MESSAGES_WRITERS = 0
ORPHANED_WRITER_RULES_COMPATIBLE=True
```

## Other contracts and non-create operations

| Resource | Consumer | Contract result |
|---|---|---|
| messages | `Welcome.jsx` | COMPATIBLE |
| posts | `Foro.jsx` | COMPATIBLE |
| replies | `ReplyModal.jsx` | COMPATIBLE |
| forumReports | `ReportPostButton.jsx` | COMPATIBLE |
| supportTickets | `SupportForm` → `createSupportTicket` | COMPATIBLE |

```text
POST_CONTRACT_COMPATIBLE=True
REPLY_CONTRACT_COMPATIBLE=True
FORUM_REPORT_CONTRACT_COMPATIBLE=True
SUPPORT_TICKET_CONTRACT_COMPATIBLE=True
ALL_NON_CREATE_CONTRACTS_UNCHANGED=True
```

No blocking code/documentation or code/Rules divergence remains for these five
contracts. Historical documentation now consistently classifies
`createPublicMessage` as orphaned rather than active.

## Immutable baseline and validation

| File | SHA-256 |
|---|---|
| `src/pages/Welcome.jsx` | `4B84C62B432299AC0FA84AD647045E00642756FC06DE1DB4C4F3E3686C9A3A50` |
| `firestore.rules` | `DFDAB7A238CC274A66CF37C85ED15E88464551B948EBD9AF9832EF3FD83B1C45` |
| `storage.rules` | `2BB6E20646B7B8DF9D4F3E318B4F9D51C0294AA10B0F899A7D96A4BE0C7DEE8C` |
| `firestore.indexes.json` | `6742255415C36DAF631B52F233039190AF819205CC41FA58D07DD7D9E180C2B9` |
| `src/firebase.js` | `917F615299596D67AE645D7C4F76D07C2A058064B8B58E6872A08F0B2C30F6C0` |
| `package.json` | `20C1DB5E3729AF8FAF8911793DEB9323B5FF83B0DFBB96E9FCB0E0891AD0A93D` |
| `package-lock.json` | `E905F89559D1248F00EA682CD8AFDCE90740ED4EFC750F836EB8872CDC5C5E0A` |
| `supportService.js` | `CE5393131F0101F208087D632687CDB6F3D8C73C104BE471363E691FF69AAC14` |

No Welcome-specific test exists and none was created. No runtime Rules test,
Emulator Suite, Firebase CLI, login or deployment was performed.

## Storage, residual risk and decision

No audited contract requires Firebase Storage. `storage.rules` remains
deny-all; `uploadAudio` is unrelated and deferred. Static compatibility does
not replace runtime Rules tests. Abuse controls, PII retention and orphan
cleanup remain deferred.

```text
SaaS-02C.2G-B2.1 = completed
SaaS-02C.2G-B2.1A = completed
SaaS-02C.2G-B2.1B = completed_pending_human_closure
B2.2_READINESS = READY_FOR_TEST_DESIGN
```

The Welcome consumer now satisfies the Firestore Rules name contract of
2–100 trimmed characters.

The active messages payload is fully compatible with the current local
Firestore Rules.

The orphaned `createPublicMessage` writer remains compatible but has no proven
functional caller.

The other four B1 consumer contracts remain compatible.

SaaS-02C.2G-B2.1 is closed.

No Firebase deployment or runtime Rules validation was performed. B2.2 was
not started and requires mandatory human approval of this closure.

## B2.1 human closure and B2.2 result

The owner approved the B2.1 closure. B2.2 subsequently completed the
document-only executable test design in `FIRESTORE_RULES_TEST_DESIGN.md`.

```text
B2.1 human closure = approved
B2.2 test design = completed_pending_human_test_design_review
```

No test file was created or executed.
