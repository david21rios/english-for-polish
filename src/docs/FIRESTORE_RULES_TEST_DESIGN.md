# SaaS-02C.2G-B2.2 — Executable Firestore Rules test design

## Purpose, scope and prior state

This document is the sole approved design input for a future B2.3
implementation of local tests for FLH-001, FLH-008, FLH-012, FLH-015 and
FLH-020. B2.1 closed the consumer contracts and found all five compatible with
the current local Rules. This phase creates no test, fixture, dependency,
script, Rule or functional-code artifact.

This phase designed the executable Firestore Rules test suite but did not
create or execute test files.

No Firestore Rule, consumer, service, index or Firebase configuration was
modified.

Java and Firebase Emulator Suite were not executed.

The resulting test matrix is the only authorized input for
SaaS-02C.2G-B2.3.

Runtime validation remains pending and requires a separate owner decision.

## Sources and existing infrastructure

The complete current Rules, B1 implementation/revalidation/closure reports,
B2.1 reports, security design/gate, implementation order, current consumers,
`tests/rules`, `package.json`, lockfile, `firebase.json` and `.firebaserc` were
reviewed directly.

| Concern | Current evidence |
|---|---|
| framework | Node.js built-in test runner (`node:test`) |
| Rules assertions | `@firebase/rules-unit-testing` 4.0.1; `assertFails` already used; `assertSucceeds` available |
| Firebase tooling | `firebase-tools` 15.24.0 |
| project ID | `demo-polish-learning` in helper, script and `.firebaserc` |
| environment helper | `tests/rules/helpers/rulesTestEnvironment.mjs` loads repository Firestore and Storage Rules without `src/firebase.js` |
| current test | `tests/rules/denyAllBaseline.test.mjs` tests Firestore and Storage deny-all targets |
| current fixture material | README only; no executable fixture module |
| emulator ports | Auth 9099; Firestore 8080; Storage 9199; UI 4000 |
| current script | `firebase emulators:exec --only firestore,storage --project demo-polish-learning "node --test tests/rules/*.test.mjs"` |

The current script covers root-level `*.test.mjs`, Firestore and Storage, uses
the demo ID and closes emulators through `emulators:exec`. It does not discover
tests nested under `tests/rules/legacy`. Therefore the recommended executable
tests remain in the `tests/rules` root while helpers and fixtures are nested.
Auth Emulator is unnecessary because Rules Unit Testing supplies synthetic
Auth contexts; the `emulators:start` script includes Auth but `test:rules`
does not.

Java is not installed or authorized. Firestore Emulator cannot currently be
executed. B2.2 may design the tests. B2.3 may implement tests only after human
approval. B2.4 runtime execution remains blocked unless the user later
authorizes a compatible local runtime strategy.

## Principles, nomenclature and future structure

Tests must be deterministic, order-independent, local-only, credential-free,
PII-free and Storage-independent. Each uses a demo project, synthetic
`example.test` email, explicit `assertSucceeds` or `assertFails`, one principal
behavior and cleanup between cases.

```text
tests/rules/
  helpers/rulesTestEnvironment.mjs       existing; extend only if approved
  helpers/testContexts.mjs               future contexts
  helpers/testPayloads.mjs               future payload factories
  helpers/seedData.mjs                   future disabled-Rules seeding
  fixtures/messages.mjs                  future message payloads
  fixtures/forum.mjs                     future posts/replies/users
  fixtures/forumReports.mjs              future report payloads
  fixtures/supportTickets.mjs            future ticket payloads
  messagesCreate.test.mjs                RT-MSG
  forumPostCreate.test.mjs               RT-PST
  forumReplyCreate.test.mjs              RT-RPL
  forumReportCreate.test.mjs             RT-RPT
  supportTicketCreate.test.mjs           RT-SUP
  selectiveHardeningRegression.test.mjs  RT-REG and RT-SEC
  saasRegression.test.mjs                RT-SAS
  denyAllBaseline.test.mjs               existing catch-all/Storage baseline
```

IDs are stable: `MSG`, `PST`, `RPL`, `RPT`, `SUP`, `REG`, `SAS`, `SEC`.

## Context matrix

| Context | UID | Email | Auth | legacy role | blocked | token claims | users document | Use |
|---|---|---|---|---|---|---|---|---|
| CTX-ANON | none | none | No | none | n/a | none | prohibited | public/denial |
| CTX-FORUM | `forum-user-01` | `forum-user-01@example.test` | Yes | `user` | false | uid/email only | FX-USR-001 | post/reply/report |
| CTX-BLOCKED | `forum-blocked-01` | `blocked@example.test` | Yes | `user` | true | uid/email only | FX-USR-002 | blocked denial |
| CTX-FORUM-OTHER | `forum-other-01` | `other@example.test` | Yes | `user` | false | uid/email only | FX-USR-003 | foreign ownership |
| CTX-SUPPORT | `support-user-01` | `support-user@example.test` | Yes | `user` | false | uid/email only | optional FX-USR-004 | ticket owner |
| CTX-SUPPORT-OTHER | `support-other-01` | `support-other@example.test` | Yes | `user` | false | uid/email only | optional FX-USR-005 | ticket non-owner |
| CTX-ADMIN | `legacy-admin-01` | `legacy-admin@example.test` | Yes | `admin` | false | uid/email only | FX-USR-006 | legacy administration |
| CTX-NONADMIN | `non-admin-01` | `non-admin@example.test` | Yes | `user` | false | uid/email only | FX-USR-007 | admin denial |

No custom claim grants legacy authority. `users/{uid}.role` and
`users/{uid}.forumBlocked` are the authoritative legacy fixture fields. No
DEFAULT_ADMINS email is used.

## Fixture matrix and seed policy

| Fixture | Document path | Purpose / minimum fields | Writer | Used by | Cleanup | PII |
|---|---|---|---|---|---|---|
| FX-USR-001..003 | `users/{forum uid}` | role user; forumBlocked false/true | disabled Rules | PST/RPL/RPT/REG | clearFirestore | No |
| FX-USR-004..005 | `users/{support uid}` | role user | disabled Rules; optional for support | SUP | clearFirestore | No |
| FX-USR-006 | `users/legacy-admin-01` | role admin; forumBlocked false | disabled Rules | all admin regression | clearFirestore | No |
| FX-USR-007 | `users/non-admin-01` | role user | disabled Rules | denial regression | clearFirestore | No |
| FX-PST-001 | `forums/A1/posts/post-seed-01` | canonical post owned by forum user | disabled Rules | post/reply non-create | clearFirestore | No |
| FX-RPL-001 | `forums/A1/posts/post-seed-01/replies/reply-seed-01` | canonical reply | disabled Rules | reply non-create | clearFirestore | No |
| FX-MSG-001 | `messages/message-seed-01` | valid persisted public message | disabled Rules | message non-create | clearFirestore | No |
| FX-RPT-001 | `forumReports/report-seed-01` | valid pending report | disabled Rules | report admin regression | clearFirestore | No |
| FX-SUP-001 | `supportTickets/ticket-seed-01` | valid ticket owned by support user | disabled Rules | ticket non-create | clearFirestore | No |
| FX-SAS-001 | canonical Identity/Tenant/key/Membership/request/course/enrollment set | minimum approved physical fields and consistent encoded uidKey | disabled Rules | RT-SAS | clearFirestore | No |

Required seeds are those referenced by a test. Optional support `users`
documents demonstrate that support ownership does not depend on legacy users.
Production documents, real emails, real IDs, Storage objects, unrelated legacy
content and speculative SaaS data are prohibited.

Use `withSecurityRulesDisabled` for seed only. Use `clearFirestore()` before
each test (and defensive cleanup after groups), then seed and create fresh
contexts. Never share mutable document IDs between concurrent tests.

## Timestamp strategy

Positive create payloads use the Firestore SDK `serverTimestamp()` sentinel.
During evaluation the server transform is compared with `request.time`; after
commit it persists as a timestamp. Negative cases use an explicit fixed
historical timestamp. They must not substitute `Timestamp.now()`, `new Date()`
or a fixed date into positive cases.

## Master case matrix — messages (34)

All cases target `messages/{autoId}`, FLH-001, and future
`messagesCreate.test.mjs` unless noted.

| IDs | Scenario | Expected | Priority / clause |
|---|---|---|---|
| RT-MSG-001/002 | Welcome payload without updatedAt / orphan payload with server updatedAt | ALLOW / ALLOW | P0 shape/time |
| RT-MSG-003/004 | name length 2 / 100 | ALLOW / ALLOW | P1 bounds |
| RT-MSG-005/006/007 | name length 1 / 101 / non-string | DENY / DENY / DENY | P0 bounds/type |
| RT-MSG-008/009 | email length 5 / 254 | ALLOW / ALLOW | P1 bounds |
| RT-MSG-010/011/012 | email length 4 / 255 / non-string | DENY / DENY / DENY | P1 bounds/type |
| RT-MSG-013/014 | message length 10 / 2000 | ALLOW / ALLOW | P1 bounds |
| RT-MSG-015/016/017 | message length 9 / 2001 / non-string | DENY / DENY / DENY | P1 bounds/type |
| RT-MSG-018/019/020 | wrong source / userId / status | DENY / DENY / DENY | P0 constants |
| RT-MSG-021/022 | valid createdAt / valid optional updatedAt | ALLOW / ALLOW | P0 request.time |
| RT-MSG-023/024 | arbitrary createdAt / updatedAt | DENY / DENY | P0 request.time |
| RT-MSG-025/026 | required key absent / updatedAt absent | DENY / ALLOW | P0 hasAll/optional |
| RT-MSG-027/028 | unknown key / injected admin key | DENY / DENY | P0 hasOnly |
| RT-MSG-029/030/031 | anonymous read / non-admin update / non-admin delete | DENY / DENY / DENY | P1 legacy regression |
| RT-MSG-032/033/034 | admin read / update / delete | ALLOW / ALLOW / ALLOW | P1 isAdmin |

## Master case matrix — forum posts (36)

All target `forums/A1/posts/{id}`, FLH-008 and
`forumPostCreate.test.mjs`.

| IDs | Scenario | Expected | Priority / clause |
|---|---|---|---|
| RT-PST-001/002/003 | valid post / text length 10 / level equals path | ALLOW / ALLOW / ALLOW | P0 canonical create |
| RT-PST-004/005/006 | anonymous / blocked / missing users document | DENY / DENY / DENY | P0 auth/forum gate |
| RT-PST-007/008/009/010 | own UID / foreign UID / missing UID / UID wrong type | ALLOW / DENY / DENY / DENY | P0 ownership/shape |
| RT-PST-011/012/013 | mismatched level / absent level / non-string level | DENY / DENY / DENY | P0 path consistency |
| RT-PST-014/015 | likes 0 / nonzero or negative | ALLOW / DENY | P0 initial constant |
| RT-PST-016/017/018 | likedBy empty / populated / non-list | ALLOW / DENY / DENY | P0 initial constant/type |
| RT-PST-019/020 | repliesCount 0 / nonzero or negative | ALLOW / DENY | P0 initial constant |
| RT-PST-021/022/023 | required field absent / unknown / moderation field injected | DENY / DENY / DENY | P0 shape |
| RT-PST-024/025/026/027 | wrong userName / userEmail / text type / text length 9 | DENY / DENY / DENY / DENY | P1 types/boundary |
| RT-PST-028/029 | server createdAt / updatedAt | ALLOW / ALLOW | P1 timestamp positive |
| RT-PST-030/031 | arbitrary createdAt / updatedAt | DENY / DENY | P0 timestamp |
| RT-PST-032/033/034 | authenticated read / owner update / social-field-only update | ALLOW / ALLOW / ALLOW | P1 unchanged legacy |
| RT-PST-035/036 | owner delete / admin delete | ALLOW / ALLOW | P1 unchanged legacy |

No maximum post-text limit is invented. Social update tests confirm only the
current permission, not counter coherence or atomicity.

## Master case matrix — forum replies (27)

All target `forums/A1/posts/post-seed-01/replies/{id}`, FLH-012 and
`forumReplyCreate.test.mjs`.

| IDs | Scenario | Expected | Priority / clause |
|---|---|---|---|
| RT-RPL-001/002 | valid reply / text length 5 | ALLOW / ALLOW | P0 canonical create |
| RT-RPL-003/004/005 | anonymous / blocked / missing users document | DENY / DENY / DENY | P0 auth/forum gate |
| RT-RPL-006/007 | own UID / foreign UID | ALLOW / DENY | P0 ownership |
| RT-RPL-008 | exact six-field shape | ALLOW | P0 allowlist |
| RT-RPL-009..015 | injected level / postId / likes / likedBy / repliesCount / moderation / unknown | DENY each | P0 allowlist/isolation |
| RT-RPL-016/017 | text length 4 / non-string | DENY / DENY | P1 boundary/type |
| RT-RPL-018/019 | server createdAt / updatedAt | ALLOW / ALLOW | P1 timestamp positive |
| RT-RPL-020/021 | arbitrary createdAt / updatedAt | DENY / DENY | P0 timestamp |
| RT-RPL-022/023/024/025 | authenticated read / owner update / owner delete / admin delete | ALLOW each | P1 unchanged legacy |
| RT-RPL-026 | separate parent repliesCount-only update by allowed user | ALLOW | P2 current non-atomic behavior |
| RT-RPL-027 | foreign arbitrary reply update | DENY | P1 ownership regression |

RT-RPL-026 explicitly does not claim atomicity.

## Master case matrix — forumReports (36)

All target `forumReports/{id}`, FLH-015 and
`forumReportCreate.test.mjs`.

| IDs | Scenario | Expected | Priority / clause |
|---|---|---|---|
| RT-RPT-001 | valid report | ALLOW | P0 canonical create |
| RT-RPT-002/003 | anonymous / blocked | DENY / DENY | P0 auth/forum gate |
| RT-RPT-004/005 | own / foreign reportedBy | ALLOW / DENY | P0 ownership |
| RT-RPT-006..010 | each of five approved reason strings | ALLOW each | P1 catalogue |
| RT-RPT-011/012/013 | unknown / empty / non-string reason | DENY each | P1 catalogue/type |
| RT-RPT-014/015/016/017 | details empty / 500 / 501 / non-string | ALLOW / ALLOW / DENY / DENY | P1 bounds/type |
| RT-RPT-018/019 | pending / other status | ALLOW / DENY | P0 initial constant |
| RT-RPT-020/021/022 | missing field / unknown field / admin field | DENY each | P0 shape |
| RT-RPT-023..027 | wrong postId / level / postUserId / postText / reporterEmail type | DENY each | P1 types |
| RT-RPT-028 | both server timestamps | ALLOW | P1 timestamp positive |
| RT-RPT-029/030 | arbitrary createdAt / updatedAt | DENY / DENY | P0 timestamp |
| RT-RPT-031/032/033 | admin read / update / delete | ALLOW each | P1 isAdmin regression |
| RT-RPT-034/035/036 | non-admin read / update / delete | DENY each | P1 isAdmin regression |

No case claims source-post existence, freshness or report deduplication; the
current Rule provides neither guarantee.

## Master case matrix — supportTickets (46)

All target `supportTickets/{id}`, FLH-020 and
`supportTicketCreate.test.mjs`.

| IDs | Scenario | Expected | Priority / clause |
|---|---|---|---|
| RT-SUP-001 | valid own ticket | ALLOW | P0 canonical create |
| RT-SUP-002 | anonymous | DENY | P0 auth |
| RT-SUP-003/004 | own / foreign userId | ALLOW / DENY | P0 ownership |
| RT-SUP-005..010 | each of six approved categories | ALLOW each | P1 catalogue |
| RT-SUP-011/012/013 | unknown / empty / non-string category | DENY each | P1 catalogue/type |
| RT-SUP-014..018 | subject 4 / 120 / 3 / 121 / non-string | ALLOW / ALLOW / DENY / DENY / DENY | P1 bounds/type |
| RT-SUP-019..023 | message 20 / 1000 / 19 / 1001 / non-string | ALLOW / ALLOW / DENY / DENY / DENY | P1 bounds/type |
| RT-SUP-024/025 | priority normal / other | ALLOW / DENY | P0 constant |
| RT-SUP-026/027 | status open / other | ALLOW / DENY | P0 constant |
| RT-SUP-028/029 | source authenticated-support / other | ALLOW / DENY | P0 constant |
| RT-SUP-030..033 | userEmail string/non-string; userName string/non-string | ALLOW / DENY / ALLOW / DENY | P1 denormalized types |
| RT-SUP-034/035/036 | required field absent / unknown / admin field | DENY each | P0 shape |
| RT-SUP-037 | both server timestamps | ALLOW | P1 timestamp positive |
| RT-SUP-038/039 | arbitrary createdAt / updatedAt | DENY / DENY | P0 timestamp |
| RT-SUP-040..043 | self read / admin read / admin update / admin delete | ALLOW each | P1 unchanged legacy |
| RT-SUP-044..046 | non-owner read / non-admin update / non-admin delete | DENY each | P1 unchanged legacy |

`userEmail` and `userName` are typed presentation data, never ownership.

## Cross-resource, permission-union and structural cases

Future file: `selectiveHardeningRegression.test.mjs`.

| Test | Scenario | Expected | Priority |
|---|---|---|---|
| RT-REG-001 | messages payload at supportTickets path | DENY | P1 |
| RT-REG-002 | ticket payload at messages path | DENY | P1 |
| RT-REG-003 | post payload at reply path | DENY | P1 |
| RT-REG-004 | reply payload at post path | DENY | P1 |
| RT-REG-005 | report payload at post path | DENY | P1 |
| RT-REG-006 | combined cross-resource payload | DENY | P0 |
| RT-SEC-001 | parent post match cannot authorize reply create | DENY | P0 |
| RT-SEC-002 | child reply match cannot authorize post create | DENY | P0 |
| RT-SEC-003 | recursive membership match cannot authorize legacy target | DENY | P0 |
| RT-SEC-004 | registrationRequest collection-group match cannot authorize target | DENY | P0 |
| RT-SEC-005 | unknown nested forum path reaches catch-all | DENY | P0 |
| RT-SEC-006 | arbitrary unknown root write reaches catch-all; no allow-true bypass | DENY | P0 |

## Representative SaaS regression cases (10)

Future file: `saasRegression.test.mjs`. Use only minimum canonical synthetic
fixtures from approved physical contracts.

| Test | Scenario | Expected | Priority |
|---|---|---|---|
| RT-SAS-001 | Identity owner get | ALLOW | P0 |
| RT-SAS-002 | Identity owner permitted profile update with server updatedAt | ALLOW | P0 |
| RT-SAS-003 | foreign Identity get | DENY | P0 |
| RT-SAS-004 | approved member point-get active Tenant | ALLOW | P0 |
| RT-SAS-005 | general Tenant list | DENY | P0 |
| RT-SAS-006 | own canonical Membership get | ALLOW | P1 |
| RT-SAS-007 | own canonical RegistrationRequest get | ALLOW | P1 |
| RT-SAS-008 | student reads active Course | ALLOW | P1 |
| RT-SAS-009 | owner reads canonical Enrollment in active Tenant | ALLOW | P1 |
| RT-SAS-010 | client reads membershipKey or registrationRequestKey | DENY | P0 |

Query-specific self-list cases remain part of the broader SaaS suite; this is
the requested minimal B1 regression selection, not a redesign.

## Storage conceptual cases

The existing separate baseline already represents four conceptual cases:
anonymous/authenticated Storage read/write are DENY. B2.3 must not add upload
tests without separate authorization. Storage cases are not included in the
201 Firestore-case total.

## Counts and prioritization

| Family | Total | ALLOW | DENY |
|---|---:|---:|---:|
| messages | 34 | 14 | 20 |
| posts | 36 | 14 | 22 |
| replies | 27 | 11 | 16 |
| forumReports | 36 | 14 | 22 |
| supportTickets | 46 | 22 | 24 |
| cross-resource regression | 6 | 0 | 6 |
| permission union/security | 6 | 0 | 6 |
| SaaS regression | 10 | 7 | 3 |
| **Total** | **201** | **82** | **119** |

Priority assignment in the master rows yields: P0 Critical 98, P1 High 102,
P2 Medium 1, P3 Low 0. P2 is the observational non-atomic repliesCount
behavior; P3 is intentionally empty. Not every test is classified P0.

## Master case metadata matrix

The scenario catalog above supplies each unique Test ID, payload variation,
expected result and priority. The following inherited metadata completes every
required master-matrix column without repeating 201 identical path cells.

| ID family | resource / operation | actor and authentication | seed | path | Rule clause | consumer contract | FLH | future file |
|---|---|---|---|---|---|---|---|---|
| RT-MSG | messages create/non-create | anonymous, non-admin or seeded admin as stated | FX-MSG for non-create; none for create | `messages/{id}` | strict keys/types/constants/time; isAdmin non-create | CC-MSG-001/002 | FLH-001 | `messagesCreate.test.mjs` |
| RT-PST | post create/non-create | CTX-FORUM/BLOCKED/OTHER/ADMIN/ANON | FX-USR; FX-PST for non-create | `forums/A1/posts/{id}` | auth, forum gate, shape, owner, level, zero/empty, time | CC-PST-001/002 | FLH-008 | `forumPostCreate.test.mjs` |
| RT-RPL | reply create/non-create | CTX-FORUM/BLOCKED/OTHER/ADMIN/ANON | FX-USR, FX-PST; FX-RPL for non-create | `forums/A1/posts/post-seed-01/replies/{id}` | auth, forum gate, shape, owner, text, time | CC-RPL-001/002 | FLH-012 | `forumReplyCreate.test.mjs` |
| RT-RPT | forumReports create/admin regression | CTX-FORUM/BLOCKED/OTHER/ADMIN/ANON | FX-USR; FX-RPT for non-create | `forumReports/{id}` | auth, forum gate, shape, reporter, catalogue, status, time | CC-RPT-001/002 | FLH-015 | `forumReportCreate.test.mjs` |
| RT-SUP | supportTickets create/non-create | CTX-SUPPORT/OTHER/ADMIN/ANON | FX-SUP for non-create; users optional | `supportTickets/{id}` | auth, shape, owner, catalogues, constants, time | CC-SUP-001/002 | FLH-020 | `supportTicketCreate.test.mjs` |
| RT-REG | cross-resource create | context required by destination | relevant source/destination minimum | destination path named by case | destination allowlist/auth | all five | relevant FLH pair | `selectiveHardeningRegression.test.mjs` |
| RT-SEC | overlap/catch-all create | CTX-FORUM or authenticated synthetic | minimum parent/user seed when required | path named by case | match union and final deny | structural | all five | `selectiveHardeningRegression.test.mjs` |
| RT-SAS | representative SaaS read/update | synthetic SaaS owner/member/other | FX-SAS-001 | canonical SaaS path named by case | current SaaS helpers/matches | approved SaaS contracts | n/a | `saasRegression.test.mjs` |

Every scenario's expected result is exactly `ALLOW` or `DENY`; there is no
ambiguous expectation.

## FLH traceability matrix

| FLH | Hardening evidence | Contract | Rule block | Cases | Fixtures | Expected |
|---|---|---|---|---|---|---|
| FLH-001 | messages hardening/B1 closure | CC-MSG-001 | `messages` create | RT-MSG-001..034 | FX-MSG-001, contexts | explicit ALLOW/DENY above |
| FLH-008 | post hardening/forensic review | CC-PST-001 | posts create | RT-PST-001..036 | FX-USR, FX-PST | explicit ALLOW/DENY above |
| FLH-012 | reply hardening | CC-RPL-001 | replies create | RT-RPL-001..027 | FX-USR, FX-PST, FX-RPL | explicit ALLOW/DENY above |
| FLH-015 | report hardening | CC-RPT-001 | forumReports create | RT-RPT-001..036 | FX-USR, FX-RPT | explicit ALLOW/DENY above |
| FLH-020 | support hardening | CC-SUP-001 | supportTickets create | RT-SUP-001..046 | FX-SUP, contexts | explicit ALLOW/DENY above |

## B2.3 implementation strategy and authorized future files

B2.3 may create only the future files listed in the structure table and may
minimally extend the existing environment helper if the approved design
requires `clearFirestore`/disabled seeding exports. It must import `node:test`,
Rules Unit Testing assertions/environment APIs, Firestore SDK operations and
fixture factories—never `src/firebase.js`. It must implement only the 201
approved cases, preserve `denyAllBaseline.test.mjs`, run syntax/import checks
that do not start emulators, change no Rules or consumer, and stop before B2.4.

| Future path | Purpose / test IDs | Imports and helpers | Existing dependencies |
|---|---|---|---|
| `tests/rules/helpers/testContexts.mjs` | CTX-* factories | test environment authenticated/unauthenticated contexts | Rules Unit Testing 4.0.1 |
| `tests/rules/helpers/testPayloads.mjs` | deterministic mutation/boundary factories | fixture constants and Firestore serverTimestamp | Firebase SDK 11.x |
| `tests/rules/helpers/seedData.mjs` | FX-* seeding and cleanup | withSecurityRulesDisabled, clearFirestore, SDK setDoc | Rules Unit Testing 4.0.1 |
| `tests/rules/fixtures/messages.mjs` | RT-MSG payload bases | testPayloads | none new |
| `tests/rules/fixtures/forum.mjs` | RT-PST/RPL user/post/reply bases | testPayloads | none new |
| `tests/rules/fixtures/forumReports.mjs` | RT-RPT bases/catalogue | testPayloads | none new |
| `tests/rules/fixtures/supportTickets.mjs` | RT-SUP bases/catalogue | testPayloads | none new |
| `tests/rules/messagesCreate.test.mjs` | RT-MSG-001..034 | node:test, assertions, Firestore SDK, helpers | existing packages |
| `tests/rules/forumPostCreate.test.mjs` | RT-PST-001..036 | same plus forum fixtures | existing packages |
| `tests/rules/forumReplyCreate.test.mjs` | RT-RPL-001..027 | same plus forum fixtures | existing packages |
| `tests/rules/forumReportCreate.test.mjs` | RT-RPT-001..036 | same plus report fixtures | existing packages |
| `tests/rules/supportTicketCreate.test.mjs` | RT-SUP-001..046 | same plus support fixtures | existing packages |
| `tests/rules/selectiveHardeningRegression.test.mjs` | RT-REG-001..006, RT-SEC-001..006 | all payload helpers, assertions | existing packages |
| `tests/rules/saasRegression.test.mjs` | RT-SAS-001..010 | SaaS seed helpers, assertions and SDK queries | existing packages |

`rulesTestEnvironment.mjs` may be minimally modified only if B2.3 explicitly
authorizes exports needed by the table. `denyAllBaseline.test.mjs` is preserved.

## Future commands and B2.4

Conceptual runtime command: `npm run test:rules`. The current script is
sufficient for the proposed root-level test files, Firestore/Storage startup,
demo project and clean emulator shutdown. No script change is required for
this structure. If B2.3 instead receives approval for nested executable tests,
the future script would need an explicit recursive glob; that alternative is
not selected here.

B2.4 is the runtime phase and is currently
`BLOCKED_BY_RUNTIME_ENVIRONMENT`. No choice is made between Java installation,
another machine, CI, external manual execution or another compatible runtime.
That requires a later owner decision. Neither `npm run test:rules` nor any
Firebase CLI command was executed in B2.2.

## Risks, rollback and closure criteria

Risks: omitted cases; inaccurate `users` fixtures; helper/context mismatch;
incorrect server transforms; permission-union false positives; state leakage;
order dependence; false confidence without runtime; future consumer/Rule
drift; incorrect demo project; Java dependency; confusing the orphan writer
with the active writer; and divergent emulator/tool versions. These are
mitigated by traceability, disabled-rule seed boundaries, per-case cleanup,
stable IDs and mandatory human/runtime gates, but remain unverified at runtime.

Documentary rollback removes only this design and restores B2.2 references,
while leaving B2.1 closed, B2.3 unstarted and all Rules/consumers intact.

All 35 B2.2 closure criteria are satisfied documentally. Runtime success is
not a B2.2 criterion.

```text
SaaS-02C.2G-B2.2 executable Rules test design = COMPLETE
SaaS-02C.2G-B2.3 = next, not started
SaaS-02C.2G-B2.4 = blocked_by_runtime_environment
```

No deployment is authorized or performed.

## B2.3 implementation reconciliation finding

Static implementation exposed an arithmetic contradiction preserved in this
design: the ten explicit RT-SAS rows contain 7 ALLOW and 3 DENY expectations,
although the summary table states 6 ALLOW and 4 DENY. Consequently the
explicit 201-case matrix totals 82 ALLOW / 119 DENY rather than the contracted
81 / 120. See `FIRESTORE_RULES_TEST_IMPLEMENTATION.md`.

```text
B2.3 implementation status = incomplete_requires_test_design_correction
```

No matrix row was silently changed. A separately authorized design correction
must resolve the exact expected result before B2.3 can close.

## B2.3A count reconciliation

`FIRESTORE_RULES_TEST_EXPECTATION_RECONCILIATION.md` forensically confirmed
Alternative A. The historical contradiction above is preserved as evidence,
but its premise is resolved: all ten detailed RT-SAS expectations are correct,
and the aggregate summary was arithmetically wrong.

```text
Total = 201
ALLOW = 82
DENY = 119
COUNT_RECONCILIATION = resolved
ROOT_CAUSE = aggregate arithmetic error
No individual test expectation requires modification
```

## B2.4A CI runtime strategy

`FIRESTORE_RULES_CI_RUNTIME_STRATEGY.md` confirms a feasible zero-credential
CI path for the canonical 201 cases (82 ALLOW, 119 DENY). Static implementation
is complete and runtime remains pending. The current command also discovers a
separate Storage baseline, so B2.4B must establish a Firestore-only canonical
command before a workflow is created. No test or technical file changed here.

B2.4B statically implements the manual CI workflow and explicit Firestore-only
command. The canonical matrix remains 201 cases, 82 ALLOW and 119 DENY. Runtime
execution was not performed and no test case or expectation changed.
