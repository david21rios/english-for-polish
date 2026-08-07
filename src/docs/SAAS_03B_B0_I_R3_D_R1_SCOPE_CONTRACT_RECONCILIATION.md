# SaaS-03B-B0-I-R3-D-R1 — R3-D scope contract reconciliation

## Purpose and blocker

R3-D stopped before edits because the R3-A inventory assigned `DOM-WF-002` to
`DOM-WF-006` to R3-D while the later, more specific R3-D boundary prohibits
migration of complete workflow descriptors. This document resolves that scope
contradiction without technical changes, new symbols, or execution of R3-D.

## Evidence and interpretation

R3-A described each `DOM-WF-002..006` row by its public `*_WORKFLOW` symbol,
called it a state machine, selected `EXTRACTION_WITH_REEXPORT_ADAPTER`, and
targeted `domain/lifecycle.js`. Its R3-D summary also named `WF-002..006` as
migration inputs. Therefore the literal classification covered the complete
objects, not independently exported lifecycle subcontracts.

The executable objects contain:

| Workflow | Initial | Transitions | Terminal states | Actors | Capabilities | Pure validator |
|---|---|---:|---|---|---|---|
| `TENANT_WORKFLOW` | active | 4 | archived | platform admin | required on every transition | none |
| `REGISTRATION_REQUEST_WORKFLOW` | pending | 4 | approved, rejected, cancelled, expired | self, tenant admin, platform system | three required; expiry has none | none |
| `MEMBERSHIP_WORKFLOW` | approved | 4 | removed | tenant admin, identity self | required capability or actor-keyed capability map | none |
| `COURSE_WORKFLOW` | draft | 3 | archived | teacher creation, tenant admin transitions | required on every transition | none |
| `ENROLLMENT_WORKFLOW` | pending | 4 | completed, cancelled | tenant admin, identity self | required capability or actor-keyed capability map | none |

Each object also contains observations and creation actors. None imports or
executes commands, but all couple lifecycle data to authorization descriptors.
No workflow exports its `transitions` or `terminalStates` as an independent
symbol. Global search found no existing `isTerminal`, `canTransition`,
`allowedTransitions`, or equivalent pure validator.

## Existing pure contracts

The following five symbols already exist independently and are portable,
side-effect-free, frozen, Firebase/React/repository-independent, and do not
depend on capabilities or actor authorization:

- `ACCESS_STATE_CONTEXT`
- `ACCESS_STATE_PRECEDENCE`
- `NULL_ACCESS_STATE_CASES`
- `MEMBERSHIP_STATUS_TRANSITIONS`
- `ENROLLMENT_STATUS_TRANSITIONS`

They are the complete technical scope authorized for the subsequent R3-D
execution. Workflow files remain consumers/evidence for parity only.

Tenant, RegistrationRequest and Course lifecycle information currently exists
only inside their complete workflows. Extracting it would require new symbols
such as status-transition or terminal-state contracts. R3-D-R1 does not invent,
name, or implement such APIs.

## Resolution

`RESOLUTION_A — R3-A classification was too broad` is selected. The five
workflow rows now remain temporary Domain authority and are excluded from
R3-D. Their future physical-authority decision is deferred to R3-H or a
separately authorized resolution after capability migration. This preserves
the pure-package boundary and avoids moving orchestration or authorization
metadata into R3-D.

R3-E is unaffected: capability IDs, descriptors, self sets and matrices remain
its exclusive scope. R3-H must reconcile the residual workflows and decide
whether a separately approved pure lifecycle API is warranted.

## Resulting states and rollback

- `SaaS-03B-B0-I-R3-D-R1 = completed_pending_human_review_and_push`
- `SaaS-03B-B0-I-R3-D = blocked_pending_R1_push`
- `SaaS-03B-B0-I-R3-E = blocked`
- `SaaS-03B-B0-I-R3 = in_progress`
- `SaaS-03B-B = blocked_pending_B0_I_R3_R4`

After human review and push, R3-D may restart using exactly the five existing
pure symbols above. Rollback is documentation-only: restore the prior R3-A
workflow rows and R3-D summary, remove this resolution, and restore the prior
roadmap checkpoint. No code, package, Domain, Rules, Firebase, tests, artifact,
or data migration is involved.
