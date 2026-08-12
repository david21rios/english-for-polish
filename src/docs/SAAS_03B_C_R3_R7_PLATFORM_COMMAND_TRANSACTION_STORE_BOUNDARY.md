# SaaS-03B-C-R3-R7 — Platform Command Transaction Store Boundary

## Result and continuity

This resumed execution keeps the existing R3-R7 identifier. Its first attempt
stopped fail-closed as `BLOCKED_EMULATOR_RUNTIME_UNAVAILABLE`: Firestore
Emulator 1.21.0 was cached but Java was unavailable, and no Store or staging
survived. With Eclipse Temurin Java 21.0.12 available, the result is
`completed_pending_human_review_and_push`.

The result is a portable Functions-core Store with unit and real Firestore
Emulator evidence. It does not implement BootstrapPlatformAdmins,
RecoverPlatformAdmin, RevokePlatformAdmin, Firebase Auth effects, callable
handlers, 03B-D or Phase 4.

## Boundary and API

`createPlatformCommandTransactionStore(runner)` exposes one minimal
`mutate(input)` primitive. Future approved sagas supply the bound command ID,
correlation ID and payload hash; next approved status/stage; exact Authority
transitions; Registry state/count delta; and a precomputed audit ID. The Store
owns persistence coherence. It does not authorize, resolve capabilities,
perform transport, or call Firebase Auth.

```text
future command saga
  -> Platform Command Transaction Store
  -> TransactionRunnerPort / TransactionPort
  -> Firestore Admin adapter
```

The Store has no Firebase import. Every read follows snapshot → shape-aware
timestamp normalization → package validator → trusted core value. Missing or
malformed Registry, Authority, and schema-v2 Command data fails closed. All
reads precede all writes, including two-Authority bootstrap.

## Ownership, Registry and command coherence

`transitionCommandId` is the sole transition owner. The same command may
resume; another command receives `CONFLICT`; correlation, actor, audit,
timestamp, `lastCommandId`, and bootstrap IDs never substitute for ownership.
Stable `active`/`revoked` transitions clear ownership atomically.

Every committed Registry mutation sets `revision = previous + 1`,
`lastCommandId = commandId`, and `updatedAt = serverOwnedTimestamp()`.
Uncommitted attempts persist no increment. Read-only replay remains the
existing executor/idempotency responsibility and does not call Store mutate.
Payload hash/correlation mismatches conflict, stage backtracking/skipping is
rejected, and the resulting schema-v2 Command is validated before writing.

Closed count semantics are enforced: bootstrap prepare is zero and completion
is +2; recovery is zero or +1; revoke prepare is -1 and completion is zero. The
revoke decrement and `activeCount > 1` precondition share one transaction.
Same-owner resume repeats no delta and count cannot become negative.

## Retry, timestamps and atomic audit

The authoritative transaction boundary enforces 19-read/19-write budgets and
rejects `externalEffect()` in callbacks. The Store generates no random IDs,
uses no process clock, performs no networking/Auth work, and takes audit IDs
before the callback.

Authority, Registry, Command and critical audit writes are atomic. Authoritative
times use the identity-safe `ServerOwnedTimestamp`; only the Admin adapter maps
it to `FieldValue.serverTimestamp()`. Emulator reread confirmed native
Firestore Timestamp storage and canonical logical normalization. Existing
audit bounds/allowlists prevent PII, email, raw claims, payloads and secrets.

## Verification

Functions tests increased 27 → 33. They cover bootstrap +2 once, recovery
+1/zero, revoke -1 once, last-admin denial, ownership/clearing,
revision/lastCommandId, bindings, status/stage, malformed persistence,
timestamp tokens, atomic audit, budgets, and external-effect rejection.
Strict TypeScript, build, lint, ESM smoke, clean isolated install/build/tests,
and eight isolated runtime imports pass.

Firestore Emulator 1.21.0 ran locally with Java 21 and dummy project
`demo-polish-learning-r3-r7`; 5/5 integration tests pass:

- competing bootstrap commands produce exactly one owner/revision/audit;
- commands competing for one Authority produce one owner and one conflict;
- same-owner prepared resume preserves count and ownership;
- concurrent revokes at activeCount 2 commit only one decrement, retry the
  competitor, reread count 1 and reject last-admin;
- server timestamps persist natively and normalize through the Store boundary.

The real lock conflict caused callback retry; only the committed transaction
changed revision/count or wrote audit. The CLI stopped Emulator and hub cleanly.
No Firebase remote service or deploy was used.

Full regression: package 40/40; Shared 51/51; repositories 59/59, 23/23,
51/51, 46/46; prechecks 111/42/69, 114/32/82, 81/44/37, 52/34/18; Rules
222/88/134; general 35/35; root build; and 279 Node syntax checks all pass.
Functions lint is 0/0. Global lint remains the recorded legacy 13 errors/8
warnings with attributable delta zero.

Root audit remains 25 findings (3 low, 9 moderate, 13 high); Functions remains
7 moderate. They are pre-existing dependency debt. Package runtime dependencies
and attributable supply-chain delta remain zero. Package/artifact 0.10.0 is
unchanged.

## Risk, rollback and next step

Future sagas must select only their approved primitive and keep read-only replay
outside Store mutate. Emulator evidence is local and authorizes neither remote
Firebase testing nor deployment. Before push, rollback is removal of the four
technical Store/test/export paths and these docs; after commit, revert the two
local commits if review rejects them. No persisted migration ran.

After human review and push, SaaS-03B-C may begin its three closed command
implementations. SaaS-03B-D and Phase 4 remain blocked/not started.
