# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course platform governance storage authority architecture resolution

Status: `resolution_complete_pending_independent_review`

## Decision

The platform governance authority is a **separate governance-plane Firestore
project**, independent from every inspected target Firebase project. This is a
normative architecture selection only. Provisioning and implementation are not
authorized.

`PLATFORM_GOVERNANCE_STORAGE_AUTHORITY = SEPARATE_GOVERNANCE_FIRESTORE_PROJECT`

`AUTHORITY_PLANE = PLATFORM_GOVERNANCE_PLANE`

`BOOTSTRAP_CIRCULARITY = RESOLVED_BY_INDEPENDENT_GOVERNANCE_PLANE`

## Scope and boundaries

The governance plane is limited to remote-session approvals, immutable approved
scope, mutable session evidence, atomic consumption, operational audit metadata
and explicitly authorized future governance artifacts. It is not tenant data,
Course data, CRM, application storage or target-project runtime.

No project ID, region, database, collection, service account, IAM binding,
credential, approval value or concrete approval instance is defined here.

## Required authority semantics

The selected authority must provide durable server-side transactions supporting:

- immutable approved scope and separate mutable evidence;
- atomic claim of an approved, unexpired, unconsumed approval;
- `consumedBySessionId` and server-owned consumption time;
- active-session ownership and concurrent-claim rejection;
- terminal session persistence and crash recovery;
- multi-machine safety and fail-closed uncertainty;
- deterministic approval-scope fingerprinting without secrets.

The atomic claim creates or claims the session evidence in the same authority;
any failed precondition produces no claim and no partial session.

## Logical records

Logical names `approvalRecords` and `sessionEvidence` are documentary only and
are not deployed collection names. Approval and session records link through
`approvalId`, `sessionId`, `approvalScopeFingerprint`, parent resolution
identifier and authoritative record locators.

## Access model

Abstract authority classes are: `DRAFT_CREATOR`, `INDEPENDENT_REVIEWER`,
`HUMAN_APPROVER`, `SESSION_EXECUTOR` and `AUDITOR`. Operational writes are
`SERVER_SIDE_ONLY`; client Rules are not the governance enforcement plane.
Future IAM and security policy require a separate resolution.

## Rejected alternatives

Same-target Firestore is rejected for material bootstrap circularity. Local
files, local databases and Git cannot enforce durable multi-machine single-use.
An external database or split approval/session system would introduce an
unapproved authority or split-brain consistency. No existing reusable platform
governance store was found.

## Deferred work

Future ordered work is: governance schema materialization; security/IAM
resolution; provisioning authorization; store provisioning; approval/session
persistence; atomic-claim, concurrency and recovery tests; independent review;
controlled publication; governance identity verification; then concrete Course
approval-instance creation.

Course runtime, migration, remote inventory, concrete approval values, F-R2,
Enrollment, SaaS-03B-R and Phase 04 remain unauthorized/not started.
