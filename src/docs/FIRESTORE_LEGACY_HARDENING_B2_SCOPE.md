# SaaS-02C.2G-B2 — Controlled scope and microphase design

## Evidence and unambiguous definition

The normative selective-hardening plan defines the sequence exactly:

1. B1 implements only FLH-001, FLH-008, FLH-012, FLH-015 and FLH-020.
2. **B2 revalidates affected consumers and semantics.**
3. B3 records deferred consumer/backend/manual proposals.
4. C performs final compatibility revalidation.

The implementation order and B1.6 report call B2 the next, not-started phase
but do not assign it a different function. Legacy reconciliation and the
compatibility closure preserve consumers and retirement gates; they do not
authorize another hardening batch. Unrelated uses of “B2” as a CEFR level or
another audit label are not SaaS-02C.2G-B2 definitions.

```text
B2_SCOPE = UNAMBIGUOUS
B2 = revalidation of the five B1 consumer contracts and Rules semantics
B2_READINESS = READY_WITH_PREREQUISITES
```

B2 excludes implementation of the 18 deferred FLH proposals, new Rule
permissions/hardening, consumer or backend changes, data migration, remote
inspection, deployment, and Storage work.

## B1 subjects associated with B2

The only FLH subjects revalidated by B2 are FLH-001, FLH-008, FLH-012,
FLH-015 and FLH-020. They are already `revalidated`; B2 must add controlled
consumer regression and executable authorization evidence without changing
their contracts.

## Pending FLH inventory (excluded from B2 implementation)

All flags below preserve the classifications and prerequisites in the approved
plan. “Rules now” is `No` because B2 is validation-only.

| FLH | Resource / operation | Classification | Consumer / risk | Prerequisite and dependency flags | Rules now | Proposed destination / order / gate |
|---|---|---|---|---|---|---|
| 002 | messages abuse | REQUIRES_BACKEND | public contact; spam/PII | consumer Yes; backend Yes; remote No; Storage No | No | B3 record, later public API; backend/product gate |
| 003 | presentations read | REQUIRES_CONSUMER_CHANGE | presentation query; public exposure | consumer Yes; backend No; manual/remote Yes; Storage No | No | B3 record, later presentation policy; contract/data gate |
| 004 | presentations create | REQUIRES_CONSUMER_CHANGE | spread payload; unknown shape | consumer Yes; backend No; manual/remote Yes; Storage No | No | after 003 evidence; consumer-contract gate |
| 005 | presentation comments | REQUIRES_BACKEND | array update; race | consumer Yes; backend Yes; manual/remote Yes; Storage No | No | after 004, future backend; backend gate |
| 006 | presentation delete | KEEP_UNCHANGED_TEMPORARILY | destructive owner/admin | consumer No; backend No; manual/remote Yes; Storage No | No | B3 record; retention/data gate |
| 007 | uploadAudio/audioUrl | REMOVE_AFTER_CONSUMER_RETIREMENT | residual presentation audio | consumer Yes; backend No; manual/remote Yes; Storage dependency Yes (prohibited target) | No | future functional retirement only; no-Storage gate |
| 009 | post owner update | REQUIRES_CONSUMER_CHANGE | edit flow; broad mutation | consumer Yes; backend No; manual Yes; remote Yes; Storage No | No | B3 record, later forum edit contract; human contract gate |
| 010 | likes/repliesCount | REQUIRES_BACKEND | LikeButton/ReplyModal; counter races | consumer Yes; backend Yes; manual No; remote No; Storage No | No | future atomic commands; backend/concurrency gate |
| 011 | post delete | KEEP_UNCHANGED_TEMPORARILY | owner/admin destructive | consumer No; backend No; manual Yes; remote Yes; Storage No | No | B3 record; retention/migration gate |
| 013 | reply update | REQUIRES_MANUAL_DATA_VERIFICATION | no proven consumer | consumer No; backend No; manual/remote Yes; Storage No | No | manual evidence before any proposal; data gate |
| 014 | reply delete | KEEP_UNCHANGED_TEMPORARILY | owner/admin destructive | consumer No; backend No; manual/remote Yes; Storage No | No | B3 record; workflow/retention gate |
| 016 | forumReports admin ops | KEEP_UNCHANGED_TEMPORARILY | moderation; global admin | consumer No; backend later Yes; manual No; remote No; Storage No | No | future moderation backend; authority gate |
| 017 | aiGeneratedLessons CRUD | REQUIRES_MANUAL_DATA_VERIFICATION | no direct consumer proven | consumer No; backend No; manual/remote Yes; Storage No | No | manual inspection before deny; data gate |
| 018 | userTests writes | REQUIRES_BACKEND | test flows; result manipulation | consumer Yes; backend Yes; manual No; remote No; Storage No | No | future test commands; domain/backend gate |
| 019 | progress/topic/attempt writes | REQUIRES_BACKEND | progress services; academic fraud | consumer Yes; backend Yes; manual/remote Yes; Storage No | No | future progress model/migration; backend/migration gate |
| 021 | support admin ops | KEEP_UNCHANGED_TEMPORARILY | support/admin; global authority | consumer Yes; backend later Yes; manual Yes; remote Yes; Storage No | No | future support authority; backend gate |
| 022 | users create/owner update | REQUIRES_CONSUMER_CHANGE | many writers; mixed authority | consumer Yes; backend No; manual/remote Yes; Storage No | No | writer/data reconciliation first; contract gate |
| 023 | users admin update/delete | REQUIRES_BACKEND | admin/moderation; destructive | consumer Yes; backend Yes; manual No; remote No; Storage No | No | future trusted commands; platform-authority gate |

No pending proposal is reclassified, implemented or marked ready for removal.
B3 owns the documentary consolidation of these deferrals; later product/domain
phases must separately authorize any implementation.

## Readiness and prerequisites

B2 can be fragmented without altering successful application behavior, but it
cannot complete dynamically today: no official parser validation, Rules test
suite, Emulator Suite execution or remote deployment exists. It requires:

- frozen B1 byte and normalized block baseline;
- renewed consumer/payload inventory with no unreviewed writer;
- approved positive/negative case catalogue;
- explicit authorization before creating Rules tests;
- locally available supported runtime/Emulator prerequisites in their own
  phase (no installation is authorized here);
- rollback evidence for each independent create hardening;
- human review after every security-sensitive step.

It does not require Storage, migrated data, production deployment, new
contracts or remote data inspection for B1 consumer/semantics validation.

## Controlled microphases

| Phase | Purpose | Potential files / change type | Dependencies and prerequisites | Risk / rollback | Gate and closure |
|---|---|---|---|---|---|
| B2.1 | Revalidate the five consumers, payloads and current call graph read-only | new audit doc only | B1 closure; source inventory | missed dynamic writer; no code rollback needed | Consumer Contract Review Gate; exact contracts/no unknown writer |
| B2.2 | Design the executable Rules regression matrix and fixtures without implementing it | test-design doc only | B2.1 approved | incomplete adversarial coverage; revert doc | Firestore Rules Human Review Gate; approved positive/negative matrix |
| B2.3 | Implement only the approved local Rules tests | `tests/rules/` and authorized test support only; no Rule or app change | B2.2 approved; runtime prerequisites confirmed | test harness drift; revert only test artifacts | Runtime Rules Test Gate entry review; suite builds and scope is exact |
| B2.4 | Execute local runtime/Emulator validation of all five hardenings and unchanged operations | validation report; no production mutation | B2.3; supported local runtime; rollback ready | false confidence/environment mismatch; retain B1 and stop | Runtime Rules Test Gate; all approved cases pass |
| B2.5 | Joint consumer/semantic reconciliation and B2 closure | closure/implementation-order docs only | B2.4 approved | documentary misclassification; revert docs | Rollback Readiness + human closure; evidence complete, no regression |

No microphase is started by this design. Potential files are descriptive and
require a new explicit authorization prompt for each phase.

## Topological order and cycle check

```text
B2.1 -> B2.2
B2.2 -> B2.3
B2.3 -> B2.4
B2.4 -> B2.5

phaseNodes = 5
phaseEdges = 4
visited = 5
cycle = false
```

B2.1 establishes the actual contract before test design; B2.2 freezes test
intent before executable changes; B2.3 creates the harness before runtime;
B2.4 supplies evidence before closure. There is no back-edge or cycle.

## Gates

| Gate | Input | Criterion / evidence | Result | Phase |
|---|---|---|---|---|
| Consumer Contract Review | current consumers, call graph, payloads | all writers and variants identified; no unknown field | APPROVED / BLOCKED | B2.1 |
| Firestore Rules Human Review | B1 baseline and test design | cases match exact allows/denials and unchanged operations | APPROVED / CHANGES_REQUIRED | B2.2 and before B2.3 |
| No-Storage Compliance | dependency searches and test scope | no new Storage use; residual uploadAudio excluded | COMPLIES / BLOCKED | every B2 phase |
| Runtime Rules Test | approved suite and local results | official/local supported execution passes every case | PASS / FAIL / NOT_AVAILABLE | B2.3–B2.4 |
| Rollback Readiness | prior expressions and triggers | five independent restorations and verification steps available | READY / NOT_READY | before B2.4 and B2.5 |

A Backend Requirement Gate and Migration Readiness Gate do not apply to B2's
validation-only scope; they remain mandatory for the corresponding deferred
FLH proposals. Production deployment is expressly outside B2.

## Risks, rollback and no-Storage

Risks are incomplete consumer discovery, mismatch between static and runtime
semantics, absent toolchain, test fixtures that do not represent actual Auth
claims, permission-union regressions and accidental expansion beyond five
creates. Any failure stops the sequence. Restore only the affected test/doc
artifact; if runtime exposes a B1 defect, do not improvise a Rule fix—record it
and require a separately authorized correction phase using the independent B1
rollback plan.

Firebase Storage remains outside the current SaaS target. `storage.rules`
remains deny-all. No B2 microphase may introduce Storage use or preserve new
binary uploads. FLH-007 remains future functional retirement work.

```text
SaaS-02C.2G-B2 = designed_not_started
SaaS-02C.2G-B2.1 = next, not started
Mandatory human approval required before starting SaaS-02C.2G-B2.1.
```

This phase defines scope only; it implements no B2 microphase, Rule, test,
consumer, backend, migration, deployment or remote operation.

## B2.1 execution result

The read-only consumer-contract audit is recorded in
`FIRESTORE_RULES_CONSUMER_CONTRACT_REVALIDATION.md`. Four active contracts are
compatible, but the active Welcome messages flow accepts a one-character name
while `messages` create Rules require at least two characters. The support
service public-message writer is exported but has no functional caller and is
classified `ORPHANED_CALLABLE_FUNCTION`.

```text
SaaS-02C.2G-B2 = in_progress
SaaS-02C.2G-B2.1 = incomplete_requires_contract_reconciliation
SaaS-02C.2G-B2.2 = blocked
B2.2 readiness = BLOCKED_BY_MESSAGE_NAME_CONTRACT
```

The general B2 definition and later microphases remain unchanged. No Rule,
consumer, test, Storage resource or remote Firebase state changed.

## B2.1A reconciliation status

The approved consumer correction is documented in
`FIRESTORE_RULES_MESSAGE_NAME_CONTRACT_RECONCILIATION.md`. Welcome now validates
and persists a trimmed name under the same 2–100 contract as Rules. The Rules
and orphaned service writer did not change.

```text
B2.1A = completed_pending_human_component_review
B2.1B = next, not started
B2.1B = post-change Welcome revalidation and B2.1 closure
B2.2 = blocked_pending_B2.1_closure
```

Mandatory human review of the Welcome component change is required before
B2.1B. No later B2 microphase was started.

## B2.1B closure status

`FIRESTORE_RULES_CONSUMER_CONTRACT_CLOSURE.md` confirms that the Welcome
correction resolves the only blocking B2.1 contract divergence, the orphaned
writer remains compatible, no new writer exists and the other four contracts
remain compatible.

```text
B2.1 = completed
B2.1A = completed
B2.1B = completed_pending_human_closure
B2.2 = next, not started
B2.2_READINESS = READY_FOR_TEST_DESIGN
```

Mandatory human approval of the B2.1 closure is required before B2.2. B2.2
was not started.

## B2.2 executable test-design result

The approved design is `FIRESTORE_RULES_TEST_DESIGN.md`. It traces 201 future
Firestore cases to the five revalidated FLH findings, current contracts,
fixtures, contexts, expected ALLOW/DENY results and future root-level test
files compatible with the current script.

```text
B2.1 = completed
B2.2 = completed_pending_human_test_design_review
B2.3 = next, not started
B2.4 = blocked_by_runtime_environment
B2.5 = not started
```

## B2.4A CI runtime strategy result

`FIRESTORE_RULES_CI_RUNTIME_STRATEGY.md` establishes that an isolated hosted
runner can validate the demo-only Firestore suite with no local Java, Firebase
login, credential, secret, real-project access or deployment. B2.4B must first
make the canonical command Firestore-only because the current glob also
includes the separate Storage deny-all baseline.

```text
B2.3 = completed
B2.3A = completed
B2.3B = not required
B2.4 = in_progress
B2.4A = completed_pending_human_ci_strategy_review
B2.4B = next, not started
B2.4C = not started
B2.5 = not started
CI_RUNTIME_STRATEGY = FEASIBLE
```

No workflow was created. Human approval is required before B2.4B.

## B2.4B static workflow implementation

The manual Firestore-only workflow, canonical seven-file package command and
read-only security preflight are recorded in
`FIRESTORE_RULES_CI_WORKFLOW_IMPLEMENTATION.md`.

```text
B2.4 = in_progress
B2.4A = completed
B2.4B = completed_pending_human_workflow_review
B2.4C = next, not started
B2.5 = not started
```

B2.4C may begin only after human workflow review, an owner-approved manual
commit, owner-approved manual push and manual `workflow_dispatch` execution.

## B2.4C-A precommit audit result

The workflow, preflight, package boundary and canonical 201 / 82 / 119 suite
passed static audit. The phase remains incomplete because ignored local files
`.env.local` and `firebase-debug.log` exist and trigger the explicit
sensitive-file gate; their contents were not inspected.

```text
B2.4 = in_progress
B2.4A = completed
B2.4B = completed
B2.4C-A = incomplete_requires_sensitive_file_owner_review
B2.4C-B = blocked
B2.5 = not started
```

No commit, push, workflow execution, remote access or deployment occurred.

## B2.4C-A1 ignored-file reconciliation

The prior conservative blocker is resolved: `.env.local` is
`LOCAL_IGNORED_CONFIGURATION` and `firebase-debug.log` is
`LOCAL_IGNORED_DEBUG_ARTIFACT`. Both are ignored, untracked, unstaged,
diff-absent and unused by CI; no sensitive filename is Git-visible.

```text
B2.4 = in_progress
B2.4A = completed
B2.4B = completed
B2.4C-A = completed
B2.4C-A1 = completed_pending_human_precommit_closure
B2.4C-B = blocked_pending_manual_commit_push_and_workflow
B2.5 = not started
```

No commit, push or workflow execution occurred.

## B2.3A forensic count resolution

Alternative A was proven: the detailed matrix and static implementation agree
on 201 cases, 82 ALLOW and 119 DENY. The previous 81/120 aggregate was a
documentation arithmetic error; no test expectation or test file changes.

```text
B2.2 = completed
B2.3 = completed_pending_human_static_test_review
B2.3A = completed_pending_human_count_reconciliation_review
B2.3B = not required
B2.4 = blocked_by_runtime_environment
B2.5 = not started
```

Java is not installed or authorized, so B2.4 requires a separate owner
decision about a compatible runtime. B2.3 was not started.

## B2.3 static implementation finding

The 201 unique IDs were materialized and pass static syntax checks, but the
explicit B2.2 cases total 82 ALLOW / 119 DENY because RT-SAS is 7/3 while its
summary says 6/4. No expectation was changed without authorization.

```text
B2.2 = completed_requires_count_reconciliation
B2.3 = incomplete_requires_test_design_correction
B2.4 = blocked
B2.5 = not started
```
