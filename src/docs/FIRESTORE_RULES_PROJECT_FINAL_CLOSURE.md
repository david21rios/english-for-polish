# SaaS-02C.2G final project closure

## Purpose and evidence boundary

This document closes SaaS-02C.2G after the owner confirmed that the official
`Firestore Rules Runtime Validation` workflow completed successfully on the
latest `main` HEAD. The confirmed run started the isolated Firestore Emulator,
executed the canonical suite and completed successfully. No workflow, emulator
or Firebase command was repeated during this documentary closure.

The owner confirmed workflow SUCCESS, Firestore Emulator and Rules runtime
SUCCESS, execution of the latest `main` HEAD, 201 canonical Test IDs with 82
expected ALLOW and 119 expected DENY, no remote deployment and no later changes.
The clean initial worktree and `HEAD == origin/main` corroborate the absence of
later Git-visible local changes. This phase does not claim independent access
to GitHub or Firebase runtime logs.

## Final reconciliation

B1 is complete and remains exactly the five revalidated create controls:

| FLH | Resource | Final state |
| --- | --- | --- |
| FLH-001 | `messages/{messageId}` create | revalidated |
| FLH-008 | forum posts create | revalidated |
| FLH-012 | forum replies create | revalidated |
| FLH-015 | `forumReports/{reportId}` create | revalidated |
| FLH-020 | `supportTickets/{ticketId}` create | revalidated |

Their consumers, strict payload contracts, ownership, constants, timestamps
and unchanged non-create behavior were jointly revalidated. They do not make
legacy resources tenant-aware or authorize path retirement.

B2 is also complete. Consumer and call-graph reconciliation closed; Welcome
now enforces the trimmed 2–100 name contract; the canonical suite was designed,
implemented and reconciled at 201 unique IDs (82 ALLOW, 119 DENY); and the
zero-credential Firestore-only CI workflow passed after the Storage harness and
RT-SEC-003 fixture defects were corrected without changing Rule expectations.
`storage.rules` remains deny-all.

## Deferred FLH backlog

| FLH | Area | Existing classification |
| --- | --- | --- |
| FLH-002 | messages abuse/spam/PII | REQUIRES_BACKEND |
| FLH-003 | presentations read | REQUIRES_CONSUMER_CHANGE |
| FLH-004 | presentations create | REQUIRES_CONSUMER_CHANGE |
| FLH-005 | presentation comments/concurrency | REQUIRES_BACKEND |
| FLH-006 | presentation delete | KEEP_UNCHANGED_TEMPORARILY |
| FLH-007 | uploadAudio/audioUrl | REMOVE_AFTER_CONSUMER_RETIREMENT |
| FLH-009 | forum post owner update | REQUIRES_CONSUMER_CHANGE |
| FLH-010 | post likes/repliesCount concurrency | REQUIRES_BACKEND |
| FLH-011 | forum post delete | KEEP_UNCHANGED_TEMPORARILY |
| FLH-013 | reply update | REQUIRES_MANUAL_DATA_VERIFICATION |
| FLH-014 | reply delete | KEEP_UNCHANGED_TEMPORARILY |
| FLH-016 | forumReports administrative operations | KEEP_UNCHANGED_TEMPORARILY |
| FLH-017 | aiGeneratedLessons CRUD | REQUIRES_MANUAL_DATA_VERIFICATION |
| FLH-018 | userTests writes | REQUIRES_BACKEND |
| FLH-019 | progress/topicProgress/attempt writes | REQUIRES_BACKEND |
| FLH-021 | support administrative operations | KEEP_UNCHANGED_TEMPORARILY |
| FLH-022 | users create/owner update | REQUIRES_CONSUMER_CHANGE |
| FLH-023 | users admin update/delete | REQUIRES_BACKEND |

None is implemented or authorized for removal by this closure.

## Residual risks

- authenticated spam, abusive content and PII retention;
- no App Check, CAPTCHA or rate limiting;
- no backend-authoritative moderation, support or administrative commands;
- concurrent likes, `likedBy`, `repliesCount`, comments and duplicate actions;
- retained broad legacy update/delete and global-admin behavior;
- manipulable `userTests`, progress, topic progress and attempts;
- presentations and audio/upload legacy dependencies;
- global, non-tenant-aware legacy forum behavior;
- no production deployment or production-data validation in this closure.

## Future improvements

- implement backend-classified FLH items with idempotency and audit trails;
- migrate consumers before operation-specific Rule tightening;
- complete manual data verification for FLH-013 and FLH-017;
- retire upload/audio behavior only after consumer retirement;
- add abuse prevention, moderation, retention and privacy controls;
- retain the 201-case workflow as a mandatory security regression gate;
- plan legacy-to-tenant migration before any path retirement.

## Explicitly out of scope

Production deployment, remote Firebase access, migration, legacy-path removal,
Storage enablement, repositories/adapters, new backend or Cloud Functions,
new capabilities/roles/workflows, Domain 1.2.0 changes, topology/index changes,
App Check, CAPTCHA, rate limiting and new product functionality are excluded.

## Final state

```text
SaaS-02C.2G-B1 = completed
SaaS-02C.2G-B2 = completed
SaaS-02C.2G-B2.5 = completed
SaaS-02C.2G = completed
Canonical Test IDs = 201
Expected ALLOW = 82
Expected DENY = 119
Runtime = PASS
Workflow = SUCCESS
Firestore Emulator = PASS
Storage Rules = deny-all
Firebase deployment = NOT PERFORMED
```

No code, Rule, test, workflow, package, domain model or Firebase configuration
was modified during this closure.

**SaaS-02C.2G FINAL CLOSURE = COMPLETE**
