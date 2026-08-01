# SaaS-02C.2G-B2.1A — Welcome message-name contract reconciliation

## Problem, sources and decision

B2.1 proved that the active `src/pages/Welcome.jsx` contact form accepted any
non-empty trimmed name, while the local `messages` create Rule requires a
string between 2 and 100 characters. A one-character value could therefore
pass the UI and later be denied by Firestore.

The active component, orphan support writer, current Rules, B1 reports,
closure, B2.1 audit, B2 scope, selective plan and implementation order were
reviewed directly. The approved decision is `CONSUMER_CHANGE`: preserve the
stricter security contract and align only the active Welcome consumer.

Relaxing Rules was rejected because it would weaken the already revalidated
public-message boundary. Refactoring Welcome through the orphan writer was
also rejected because it would change the call graph and payload by adding
`updatedAt`.

## Previous and reconciled behavior

Before this phase, `name` was state local to Welcome, updated directly by the
input and normalized as `const cleanName = name.trim()` in `sendMessage`.
The handler rejected only an empty trimmed value. HTML used `required` and
`maxLength={80}` with no `minLength`.

The reconciled handler retains `cleanName = name.trim()` and now rejects when
`cleanName.length < 2 || cleanName.length > 100`, using the existing `error`
state and Polish message:

```text
Imię i nazwisko musi mieć od 2 do 100 znaków.
```

The input now uses `minLength={2}` and `maxLength={100}` as UX assistance.
The handler remains authoritative. Case, accents, alphabet, internal spaces
and other international characters are not transformed or restricted.

## Payload preservation

Before and after, Welcome writes exactly:

```text
name: cleanName
email: cleanEmail
message: cleanMessage
source: "welcome"
createdAt: serverTimestamp()
userId: "anon"
status: "new"
```

The collection remains `messages`, the ID remains automatic and `updatedAt`
remains absent. Only the already-trimmed `cleanName` is persisted; email and
message validation, loading/error/success behavior, form reset, navigation,
styles, responsive layout and anonymous flow are unchanged.

## Static case matrix

| Input | Normalized | Result |
|---|---|---|
| `""` | `""` | denied by required/non-empty handler check |
| `" "` | `""` | denied after trim |
| `"A"` | `"A"` | denied: fewer than 2 |
| `" A "` | `"A"` | denied after trim |
| `"AB"` | `"AB"` | permitted |
| `" Ana "` | `"Ana"` | permitted and persisted as `Ana` |
| exactly 100 characters | unchanged except outer trim | permitted |
| 101 characters | unchanged except outer trim | denied by handler; HTML also prevents ordinary entry |
| name with accents | accents preserved | permitted when length is 2–100 |
| non-Latin name | characters preserved | permitted when length is 2–100 |
| internal spaces | preserved | permitted when trimmed length is 2–100 |

## Orphaned writer

`supportService.createPublicMessage` remains exported directly, via the
default service object and through `services/support/index.js`. No functional
caller was found. It remains `ORPHANED_CALLABLE_FUNCTION`, continues to add
`updatedAt=serverTimestamp()` and its payload remains accepted by the current
Rules. It was not modified, removed or connected to Welcome.

## Compatibility and regression controls

```text
WELCOME_NAME_MIN_LENGTH_COMPATIBLE=True
WELCOME_NAME_MAX_LENGTH_COMPATIBLE=True
WELCOME_NAME_TRIMMED_BEFORE_WRITE=True
WELCOME_MESSAGES_PAYLOAD_COMPATIBLE=True
WELCOME_MESSAGES_CONSTANTS_COMPATIBLE=True
WELCOME_MESSAGES_TIMESTAMP_COMPATIBLE=True
MESSAGES_RULES_UNCHANGED=True
```

Static review confirms that email/message validation, submit state, success and
error handling, reset, collection, authentication posture, imports, navigation
and styles are unchanged. No specific Welcome component test infrastructure
was found; no test was created.

## Risks, rollback, validation and result

The change does not solve anonymous abuse, rate limiting, CAPTCHA, App Check,
PII retention or backend validation. HTML length counts JavaScript string
units, consistently with the handler and expected Rules string-size contract;
international alphabets remain allowed.

Rollback trigger: valid 2–100 names fail, payload/style/navigation changes, or
build/tests fail. Rollback restores only the prior name length condition and
input attributes while preserving Rules and all five B1 hardenings, then reruns
build/tests and documents the reason. No rollback was required.

The technical-file hashes stayed unchanged; the Welcome hash changed as
expected. Build, existing tests and diff checks passed. Firebase CLI, Emulator
Suite, runtime Rules validation and deployment were not performed.

```text
WELCOME_NAME_CONTRACT_DIVERGENCE = resolved_pending_revalidation
SaaS-02C.2G-B2.1A Welcome name contract reconciliation = COMPLETE
SaaS-02C.2G-B2.1B = next, not started
SaaS-02C.2G-B2.2 = blocked_pending_B2.1_closure
```

The active Welcome consumer now enforces the same 2–100 character name
contract required by Firestore Rules.

The name is trimmed before validation and persistence.

The Firestore Rules were not relaxed or modified.

The orphaned `createPublicMessage` function was preserved without modification.

No Firebase deployment was performed.

## Post-reconciliation revalidation

The read-only B2.1B review independently rechecked Welcome, the current
messages Rule, global writers and the other four B1 contracts. Its closure is
`FIRESTORE_RULES_CONSUMER_CONTRACT_CLOSURE.md`.

```text
post_reconciliation_revalidation = passed
B2.1A = completed
WELCOME_NAME_CONTRACT_DIVERGENCE = resolved
```
