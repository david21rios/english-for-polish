# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course human remote read-only access approval gate

## Status and purpose

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- `HUMAN_APPROVAL_SCHEMA_STATUS = DEFINED_PENDING_INDEPENDENT_REVIEW`.
- `HUMAN_APPROVAL_INSTANCE_STATUS = NOT_CREATED`.
- `HUMAN_APPROVAL_REAL_VALUES = NOT_PROVIDED`.

This documentary object, `COURSE_REMOTE_READ_ONLY_SESSION_APPROVAL`, defines
one single-use, expiring approval for one bounded Course operational inventory
session. It is not a package/runtime enum, persisted contract, Firebase
authorization, deployment, migration, backup or runtime authorization.

## Approval binding

The future approval must explicitly identify `APPROVAL_ID`, target Firebase
project, environment, Firestore database, approved access/principal class,
purpose, permitted systems and operation classes, issue/expiry timestamps and
single-use mode. Observed remote identity must independently match the approved
target; local aliases and credentials do not prove identity. Secrets, tokens,
keys, passwords, credential files and IAM dumps are prohibited.

Each Firebase/GCP/Hosting/Functions/Rules/Firestore/log/external system is
explicitly `AUTHORIZED` or `NOT_AUTHORIZED_FOR_THIS_SESSION`. Operation classes
remain separately auditable; mutating or unknown commands are always blocked.

## Quantitative approval

The human approval supplies finite positive integer limits for Course population,
Course document inspection, Firestore reads, tenants, Functions, Hosting and
external services, plus deployment-history/log limits and bounded windows when
enabled. Disabled categories use the explicit not-authorized marker. No zero,
default, unlimited, implicit or open-ended value is valid. Aggregate Course
population and document-level validation are separate approval toggles.

The approval is invalid on target/scope mismatch, expiry, prior consumption,
missing limits, blocked command classification, Rules drift, unexpected writer,
secret exposure, local side effects or scope expansion. Material amendment
creates a new approval. Expansion ends the current session and requires new
explicit human approval.

## Execution checklist and evidence

Execution remains `NOT_AUTHORIZED` until approval validity, identity/database,
access class, system/operation scope, numeric limits, command safety, clean
worktree, no mutation, no secret exposure and session purpose all pass. Future
evidence records approval ID, approved target, systems, operations, limits,
issue/expiry, consumption and stop state without credentials or raw Course
content.

`REMOTE_ENVIRONMENT_IDENTITY = NOT_VERIFIED` and
`REMOTE_OPERATIONAL_INVENTORY_EXECUTION = NOT_AUTHORIZED`. Course runtimes,
migration, backup/export, F-R2, Enrollment, SaaS-03B-R and Phase 04 remain
closed or not started.

## Documentary verifiability repair

### Session ownership and lifecycle

`APPROVAL_CONSUMPTION_STATE` is exactly one of `UNCONSUMED`,
`CONSUMED_BY_CURRENT_ACTIVE_SESSION` or `CONSUMED_BY_PRIOR_SESSION`.
`APPROVAL_ALREADY_CONSUMED` blocks only a new session when the state is
`CONSUMED_BY_PRIOR_SESSION`; it does not self-invalidate the active session
that consumed the approval. Evidence records `SESSION_ID` and
`APPROVAL_CONSUMED_BY_SESSION_ID`. A different session ID is prior consumption
and is blocked. `ACTIVE_SESSION_SELF_INVALIDATION = PROHIBITED`.

`SESSION_LIFECYCLE_STATE` is one of `PRE_EXECUTION`,
`ACTIVE_CONSUMED_SESSION`, `TERMINATED_SUCCESS`, `TERMINATED_STOP` or
`TERMINATED_FAILURE`. The first remote command transitions pre-execution to
active-consumed; terminal states never return to active. Pre-command failure
leaves the session pre-execution and unconsumed. Consumption is recorded
immediately before the first authorized command and remains true for every
terminal outcome.

### Bootstrap checklists

`PRE_BOOTSTRAP_CHECKLIST` contains approval existence/state/expiry, unconsumed
new-session status, complete approved target/access/system/operation scope,
numeric limits, purpose, derived command plan, safety audit, reconfirmation
gate, clean worktree, no mutation/secrets/expansion. Its status is `PASS` or
`FAIL`; failure means no consumption or bootstrap. It explicitly excludes
`PROJECT_IDENTITY_MATCH`, `ENVIRONMENT_MATCH` and `DATABASE_MATCH`.

`POST_BOOTSTRAP_IDENTITY_CHECKLIST` contains executed bootstrap, available
observed identity, project/environment/database matches, applicable target
identity match, no ambiguity and no target switch. Its status is `PASS` or
`FAIL`; operational inventory requires both checklist statuses PASS.

### Command-plan and execution evidence

Evidence records `COMMAND_PLAN_ID`, derivation time, scope fingerprint,
safety-audit status, `COMMAND_PLAN_RECONFIRMATION_REQUIREMENT` (`REQUIRED` or
`NOT_REQUIRED`), bounded reason, reconfirmed value/time and final status
(`READY_FOR_EXECUTION` or `BLOCKED`). `NOT_REQUIRED` requires
`NO_MATERIAL_PLAN_DRIFT`; `REQUIRED` must be reconfirmed before consumption.

Evidence also records approval consumption state/boolean/time/trigger, owning
session, first command class/plan, lifecycle and termination status/time;
bootstrap checklist/audit/plan/executed time, observed identity status,
project/environment/database matches, post-bootstrap status and inventory
entry. `APPROVAL_CONSUMED` is true for either consumed state, but continuation
requires current session ID ownership. A new session with prior ownership is
prohibited.

Bootstrap is read-only identity establishment only. After it, identity checks
must pass before operational inventory. Identity mismatch, unknown identity,
scope expansion or failed bootstrap terminates the consumed session. Expiry is
a pre-session deadline; a session consumed before expiry may continue only
within its fixed approved scope and other stop constraints.
migration, backup/export, F-R2, Enrollment, SaaS-03B-R and Phase 04 remain
closed or not started.

## Execution semantics repair

`APPROVAL_CONSUMPTION_TRIGGER = IMMEDIATELY_BEFORE_FIRST_AUTHORIZED_REMOTE_COMMAND`.
The identity-bootstrap command is included. Immediately before it,
`APPROVAL_CONSUMED` transitions from false to true and
`APPROVAL_CONSUMED_AT` is recorded. Any subsequent success, failure,
mismatch, stop, partial result, tool/network failure or operator abort leaves
the approval consumed; reuse requires a new approval. Failures before the first
remote command do not consume it, but expiry/invalidity still prevents reuse.

Execution has two documentary phases: `IDENTITY_BOOTSTRAP` then
`OPERATIONAL_INVENTORY`. Bootstrap is limited to establishing observed project,
environment and database identity and performs no inventory. Before bootstrap,
the pre-bootstrap checklist validates approval, scope, limits, safety, clean
worktree and no mutation/secrets/expansion, but does not require observed
identity matches. After bootstrap, the post-bootstrap checklist requires exact
project/environment/database matches; mismatch terminates the consumed session
without further inspection.

`FINAL_COMMAND_PLAN_RECONFIRMATION = CONDITIONALLY_REQUIRED`. It is not
required only when the final audited plan is materially identical to the
approved plan. Any target, system, operation, query, tool, argument, scope,
limit, order or classification change requires explicit reconfirmation before
consumption; scope expansion instead requires a new approval. Reconfirmation
occurs after command derivation and safety audit, before consumption and before
bootstrap.

Documentary evidence records command-plan identity/reconfirmation, consumption
trigger/time, first command class, bootstrap status, observed identity matches,
session termination and reuse prohibition. These rules are not runtime or
package contracts.
No real values are provided; remote inventory remains not authorized.

## Final state-model materialization

The documentary evidence uses the exact truth table:

```text
UNCONSUMED                         -> APPROVAL_CONSUMED=false
CONSUMED_BY_CURRENT_ACTIVE_SESSION -> APPROVAL_CONSUMED=true
CONSUMED_BY_PRIOR_SESSION          -> APPROVAL_CONSUMED=true
```

`APPROVAL_CONSUMED_AT` is `NOT_SET` iff consumed is false and required iff
true. `SESSION_ID` must equal `APPROVAL_CONSUMED_BY_SESSION_ID` for current
continuation; a different ID is prior consumption and blocks a new session.

Lifecycle and termination are closed by this table:

```text
PRE_EXECUTION             -> NOT_TERMINATED
ACTIVE_CONSUMED_SESSION   -> NOT_TERMINATED
TERMINATED_SUCCESS        -> SUCCESS
TERMINATED_STOP           -> STOP
TERMINATED_FAILURE        -> FAILURE
```

Only PRE_EXECUTION→ACTIVE_CONSUMED_SESSION and the three active→terminal
transitions are valid. Terminal states cannot reopen or transition again;
terminal timestamps are required only for terminal states.

`OBSERVED_REMOTE_IDENTITY_STATUS` is one of `NOT_OBSERVED`,
`OBSERVED_COMPLETE`, `OBSERVED_INCOMPLETE`, `OBSERVED_CONFLICTING`; only
complete permits post-bootstrap PASS. `OPERATIONAL_INVENTORY_ENTERED` is true
iff the session is active, bootstrap executed, both checklists PASS and all
identity matches PASS.

The pre-bootstrap checklist has explicit PASS/FAIL fields for approval,
unconsumed new-session state, approved target/access/system/operation scope,
limits, purpose, plan derivation, safety, reconfirmation, clean worktree and
no mutation/secrets/expansion. It excludes project/environment/database
matches. The post-bootstrap checklist explicitly requires bootstrap execution,
observed identity complete, project/environment/database PASS, applicable
target checks, no ambiguity and no target switch.

Command-plan evidence consists of ID, derivation time, scope fingerprint,
safety status, reconfirmation requirement (`REQUIRED|NOT_REQUIRED`), bounded
reason, reconfirmed value/time, before-consumption result and final status
(`READY_FOR_EXECUTION|BLOCKED`). Consumption evidence includes session/owner,
state/boolean/time/trigger, first command class/plan, lifecycle and
termination status/time. Bootstrap evidence includes checklist status, plan,
audit, executed flag/time, observed identity, matches, post-bootstrap status
and inventory entry. Retry fields are documentary and same-session only.

The complete schema status is `APPROVAL_SESSION_EVIDENCE_SCHEMA = COMPLETE`.

## Exact verifier records (authoritative)

The following records are the authoritative materialization; any earlier
summary wording is non-authoritative.

### NEW_SESSION_START_ALLOWED

`NEW_SESSION_START_ALLOWED = true` iff every named condition is satisfied:
`APPROVAL_CONSUMPTION_STATE = UNCONSUMED`, `APPROVAL_CONSUMED = false`,
`APPROVAL_CONSUMED_AT = NOT_SET`, `APPROVAL_CONSUMED_BY_SESSION_ID = NOT_ASSIGNED`,
`APPROVAL_STATE_APPROVED = PASS`, `APPROVAL_NOT_EXPIRED = PASS`,
`NO_CONCURRENT_CONSUMPTION_AMBIGUITY = PASS`,
`SESSION_LIFECYCLE_STATE = PRE_EXECUTION`,
`PRE_BOOTSTRAP_CHECKLIST_STATUS = PASS`,
`COMMAND_PLAN_FINAL_STATUS = READY_FOR_EXECUTION`, and
`COMMAND_PLAN_RECONFIRMED_BEFORE_CONSUMPTION` is `PASS` or `NOT_REQUIRED`.
Otherwise it is `false`.

N1: current-active consumption with a different attempted session ID -> false.
N2: prior consumption -> false.
N3: owner not `NOT_ASSIGNED` for a new session -> false.
N4: approval state not `PASS` -> false.
N5: approval not-expired state not `PASS` -> false.
N6: concurrency ambiguity not `PASS` -> false.
N7: lifecycle not `PRE_EXECUTION` -> false.
N8: pre-bootstrap checklist not `PASS` -> false.
N9: command-plan final status not `READY_FOR_EXECUTION` -> false.
N10: reconfirmation-before-consumption `FAIL` -> false.

### Exact fail-closed state rows

| ID | condition | lifecycle | consumption | termination | inventory |
|---|---|---|---|---|---|
| F1 | PRE_BOOTSTRAP_CHECKLIST_STATUS = FAIL | PRE_EXECUTION | UNCONSUMED | NOT_TERMINATED | false |
| F2 | first authorized bootstrap command begins | ACTIVE_CONSUMED_SESSION | CONSUMED_BY_CURRENT_ACTIVE_SESSION | NOT_TERMINATED | false |
| F3 | bootstrap command failure | TERMINATED_FAILURE | CONSUMED_BY_CURRENT_ACTIVE_SESSION | FAILURE | false |
| F4 | OBSERVED_REMOTE_IDENTITY_STATUS = OBSERVED_INCOMPLETE | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F5 | OBSERVED_REMOTE_IDENTITY_STATUS = OBSERVED_CONFLICTING | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F6 | PROJECT_IDENTITY_MATCH = FAIL | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F7 | PROJECT_IDENTITY_MATCH = UNKNOWN | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F8 | ENVIRONMENT_MATCH = FAIL | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F9 | ENVIRONMENT_MATCH = UNKNOWN | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F10 | DATABASE_MATCH = FAIL | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F11 | DATABASE_MATCH = UNKNOWN | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F12 | post-bootstrap PASS and all identity matches PASS | ACTIVE_CONSUMED_SESSION | CONSUMED_BY_CURRENT_ACTIVE_SESSION | NOT_TERMINATED | eligible true |
| F13 | scope expansion required | TERMINATED_STOP | CONSUMED_BY_CURRENT_ACTIVE_SESSION | STOP | false |
| F14 | normal authorized completion | TERMINATED_SUCCESS | CONSUMED_BY_CURRENT_ACTIVE_SESSION | SUCCESS | false |
| F15 | execution/tool/network/permission failure after consumption | TERMINATED_FAILURE | CONSUMED_BY_CURRENT_ACTIVE_SESSION | FAILURE | false |

`FAIL_CLOSED_STATE_TABLE = EXPLICIT_COMPLETE` iff rows F1-F15 are present.

### Individually materialized invariant records

Record notation is exact: `CURRENT_ACTIVE` means
`APPROVAL_CONSUMPTION_STATE = CONSUMED_BY_CURRENT_ACTIVE_SESSION`;
`consumed-at`, `terminated-at`, `bootstrap-at`, `first-command-plan` and
`first-command-started-at` mean the correspondingly named evidence fields;
`state`, `owner`, `consumption`, `lifecycle`, `termination`, `continuation`,
`bootstrap`, `pre-check`, `post-check`, `project`, `environment`, `database`,
`identity`, `reconfirmed` and `reason` likewise denote their exact named
fields above. Each record's RESULT is the normative fail-closed result.

I1: CONDITION `APPROVAL_CONSUMPTION_STATE = UNCONSUMED AND APPROVAL_CONSUMED = true`; RESULT `INVALID`.
I2: CONDITION `CONSUMED_BY_CURRENT_ACTIVE_SESSION AND APPROVAL_CONSUMED = false`; RESULT `INVALID`.
I3: CONDITION `CONSUMED_BY_PRIOR_SESSION AND APPROVAL_CONSUMED = false`; RESULT `INVALID`.
I4: CONDITION `APPROVAL_CONSUMED = false AND APPROVAL_CONSUMED_AT != NOT_SET`; RESULT `INVALID`.
I5: CONDITION `APPROVAL_CONSUMED = true AND APPROVAL_CONSUMED_AT = NOT_SET`; RESULT `INVALID`.
I6: CONDITION `UNCONSUMED AND APPROVAL_CONSUMED_BY_SESSION_ID != NOT_ASSIGNED`; RESULT `INVALID`.
I7: CONDITION `CURRENT_ACTIVE AND APPROVAL_CONSUMED_BY_SESSION_ID != SESSION_ID`; RESULT `INVALID`.
I8: CONDITION `ACTIVE_CONSUMED_SESSION AND UNCONSUMED`; RESULT `INVALID`.
I9: CONDITION `PRE_EXECUTION AND CURRENT_ACTIVE`; RESULT `INVALID`.
I10: CONDITION `CONTINUATION = true AND lifecycle != ACTIVE_CONSUMED_SESSION`; RESULT `INVALID`.
I11: CONDITION `CONTINUATION = true AND consumption != CURRENT_ACTIVE`; RESULT `INVALID`.
I12: CONDITION `CONTINUATION = true AND owner != SESSION_ID`; RESULT `INVALID`.
I13: CONDITION `CONTINUATION = true AND termination != NOT_TERMINATED`; RESULT `INVALID`.
I14: CONDITION `NEW_SESSION_START_ALLOWED = true AND state != UNCONSUMED`; RESULT `INVALID`.
I15: CONDITION `NEW_SESSION_START_ALLOWED = true AND consumed != false`; RESULT `INVALID`.
I16: CONDITION `NEW_SESSION_START_ALLOWED = true AND owner != NOT_ASSIGNED`; RESULT `INVALID`.
I17: CONDITION `TERMINATED_SUCCESS AND status != SUCCESS`; RESULT `INVALID`.
I18: CONDITION `TERMINATED_STOP AND status != STOP`; RESULT `INVALID`.
I19: CONDITION `TERMINATED_FAILURE AND status != FAILURE`; RESULT `INVALID`.
I20: CONDITION `terminal lifecycle AND terminated-at = NOT_SET`; RESULT `INVALID`.
I21: CONDITION `non-terminal lifecycle AND terminated-at != NOT_SET`; RESULT `INVALID`.
I22: CONDITION `terminal lifecycle AND continuation = true`; RESULT `INVALID`.
I23: CONDITION `bootstrap=false AND bootstrap-at != NOT_SET`; RESULT `INVALID`.
I24: CONDITION `bootstrap=true AND bootstrap-at = NOT_SET`; RESULT `INVALID`.
I25: CONDITION `bootstrap=true AND pre-check != PASS`; RESULT `INVALID`.
I26: CONDITION `bootstrap=true AND bootstrap-audit != PASS`; RESULT `INVALID`.
I27: CONDITION `bootstrap=true AND consumed != true`; RESULT `INVALID`.
I28: CONDITION `identity != OBSERVED_COMPLETE AND post-check = PASS`; RESULT `INVALID`.
I29: CONDITION `post-check = PASS AND project != PASS`; RESULT `INVALID`.
I30: CONDITION `post-check = PASS AND environment != PASS`; RESULT `INVALID`.
I31: CONDITION `post-check = PASS AND database != PASS`; RESULT `INVALID`.
I32: CONDITION `inventory=true AND bootstrap != true`; RESULT `INVALID`.
I33: CONDITION `inventory=true AND post-check != PASS`; RESULT `INVALID`.
I34: CONDITION `inventory=true AND project != PASS`; RESULT `INVALID`.
I35: CONDITION `inventory=true AND environment != PASS`; RESULT `INVALID`.
I36: CONDITION `inventory=true AND database != PASS`; RESULT `INVALID`.
I37: CONDITION `inventory=true AND lifecycle != ACTIVE_CONSUMED_SESSION`; RESULT `INVALID`.
I38: CONDITION `REQUIRED AND reconfirmed != true`; RESULT `INVALID`.
I39: CONDITION `NOT_REQUIRED AND reconfirmed != NOT_REQUIRED`; RESULT `INVALID`.
I40: CONDITION `REQUIRED AND reconfirmed-at = NOT_SET`; RESULT `INVALID`.
I41: CONDITION `NOT_REQUIRED AND reconfirmed-at != NOT_SET`; RESULT `INVALID`.
I42: CONDITION `REQUIRED AND before-consumption != PASS`; RESULT `INVALID_FOR_EXECUTION`.
I43: CONDITION `NOT_REQUIRED AND before-consumption != NOT_REQUIRED`; RESULT `INVALID`.
I44: CONDITION `REQUIRED AND reconfirmed-at >= consumed-at`; RESULT `INVALID`.
I45: CONDITION `NOT_REQUIRED AND reason != NO_MATERIAL_PLAN_DRIFT`; RESULT `INVALID`.
I46: CONDITION `consumed=true AND first-command-class = NOT_SET`; RESULT `INVALID`.
I47: CONDITION `consumed=true AND first-command-plan = NOT_SET`; RESULT `INVALID`.
I48: CONDITION `consumed=true AND first-command-started-at = NOT_SET`; RESULT `INVALID`.
I49: CONDITION `consumed=false AND first-command-started-at != NOT_SET`; RESULT `INVALID`.
I50: CONDITION `consumed-at > first-command-started-at`; RESULT `INVALID`.
I51: CONDITION `TERMINATED_SUCCESS AND inventory=true AND continuation=true`; RESULT `INVALID`.
I52: CONDITION `TERMINATED_STOP AND inventory=true AND continuation=true`; RESULT `INVALID`.
I53: CONDITION `TERMINATED_FAILURE AND continuation=true`; RESULT `INVALID`.

`TERMINAL_STATE_REENTRY = PROHIBITED`; `TERMINAL_TO_ACTIVE = PROHIBITED`;
`TERMINAL_TO_PRE_EXECUTION = PROHIBITED`; `TERMINAL_SESSION_REUSE = PROHIBITED`.
`TERMINAL_TRANSITION_INVARIANTS = EXPLICIT_COMPLETE`.
