# SaaS-03B-B-C1-R2-R1 — Identifier Validation Result Handling Repair

## Trigger and scope

Independent C1-R2 characterization proved that Functions consumers ignored the
result of `validateDocumentIdentifier`. The package API is result-based and does
not throw: it returns `{ ok: true, value }` or `{ ok: false, issue }`. This repair
changes only three Functions consumers and their existing test suite. Package,
Domain, Shared, repositories, Rules and Firebase configuration remain protected.

## Characterization and call-site audit

Before repair, `requireAuthenticatedActor` and each documented identifier in the
command envelope accepted `""`, whitespace, `"."`, `".."` and `"a/b"`. The full
Functions search found five affected calls: actor UID, persisted Identity UID,
command ID, correlation ID and nullable tenant ID. All occurred in
`authenticatedActor.ts`, `authorityResolver.ts` and `commandRecord.ts`. There
were no correctly handled Functions calls before repair and no additional
result-based validator integration defect.

The repair checks `validation.ok` explicitly. No local validation rules or helper
were introduced. Invalid authenticated UIDs map to `UNAUTHENTICATED`; invalid
persisted Identity UIDs map to `CONTRACT_VIOLATION`; invalid command identifiers
map to `INVALID_ARGUMENT`. Messages contain no raw value, path, document, stack
or validation internals.

## Result and path safety

After repair, all five invalid values are rejected for authenticated UID,
`commandId`, `correlationId` and non-null `tenantId`; representative
`valid-ID_1` values are accepted. Rejection occurs during actor/envelope
validation, before authority or command-record path construction. Existing
platform/tenant Identity mismatch, closed configuration and transaction-budget
regressions remain green.

The registry remains deferred and unnecessary for ordinary foundation authority
resolution. Membership-key reconciliation remains command-specific. The nested
spoofing boundary remains unchanged: authoritative top-level fields are denied,
while future descriptive nested business data requires command-specific schema
validation.

## Validation evidence

- Functions strict check/build: PASS; TS7016 and TypeScript errors: zero;
- Functions tests: 19/19 PASS, with 21 new identifier assertions added to two
  existing tests; Functions lint: 0 errors/0 warnings;
- isolated candidate: 376-package clean install, strict check, 19/19 tests,
  20-export ESM smoke, runtime and type consumption of all eight public package
  paths PASS;
- package 28/28; Shared 51/51; repositories 59/23/51/46; general 35/35;
- prechecks: Enrollment 111/42/69, Course 114/32/82, Membership 81/44/37,
  RegistrationRequest 52/34/18; Rules preflight 222/88/134;
- root production build and 32 JavaScript syntax checks: PASS;
- global lint remains the exact legacy 13 errors/8 warnings; repair delta zero.

Functions `npm audit` continues to report seven moderate findings through
Firebase/Google dependencies (`firebase-admin`, `firebase-functions`, Storage,
retry/HTTP and UUID chains). The proposed automatic remediation requires
breaking SDK downgrades; no dependency was changed. Node 22 remains configured
with ES2022, NodeNext and Node 22 types. The available host is Node 24.15.0, so
native Node 22 execution remains truthfully `NOT_AVAILABLE`.

## Protected state, risk and rollback

Rules, indexes, Storage, Firebase configuration and the client Firebase module
retain their approved SHA-256 hashes. No Emulator, Firebase remote operation,
deployment, bootstrap or business command was run. Residual risk is limited to
the recorded SDK advisories and the requirement for a new independent full C1
revalidation after publication.

Rollback reverts the isolated technical and documentation commits, then reruns
the invalid-identifier characterization and full matrix. No data rollback is
required because the foundation exports no deployed business handler.

## State and next gate

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed
SaaS-03B-B-C1-R2-R1 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R1_human_review_and_push
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
Bootstrap platform_admin = not_started
```

After human review and push, run a post-identifier-repair independent full C1
revalidation. This phase does not close C1 or start 03B-C.
