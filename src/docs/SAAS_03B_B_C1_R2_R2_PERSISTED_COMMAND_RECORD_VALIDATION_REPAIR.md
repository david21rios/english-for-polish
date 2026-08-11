# SaaS-03B-B-C1-R2-R2 — Persisted Command Record Validation Repair

## Trigger and root cause

The post-identifier-repair independent review reproduced
`PERSISTED_COMMAND_RECORD_UNVALIDATED`. `executor.ts` converted untrusted
Firestore snapshot data with `as unknown as CommandRecord` and passed it to
idempotency without runtime validation. A record containing only a matching
`payloadHash` and `status: "succeeded"` was accepted as replay.

## Repair

`validatePersistedCommandRecord` now validates the exact package-owned field
allowlist before idempotency. It requires schema version 1; canonical document
identifiers; known command type and status; a lowercase 64-character SHA-256
payload hash; valid actor type and non-empty authority; nullable canonical
Tenant ID; ISO timestamps; JSON-safe result; shared backend error code; a
non-negative integer attempt count; and exact required fields with no extras.

The executor invokes this validation immediately after reading an existing
snapshot. Only validated data is narrowed to `CommandRecord`. Shared constants,
the package, `decideIdempotency`, Domain, Shared, repositories and Firebase
configuration remain unchanged.

## Negative matrix

Tests reject empty and partial records, missing required fields, unknown fields,
unknown status, incompatible schema version, malformed payload hash, malformed
required or nullable timestamps, invalid actor UID/type, empty authority,
invalid Tenant ID, unknown command type and invalid attempt count. A separate
executor regression proves that the original partial succeeded replay now fails
with `CONTRACT_VIOLATION` before idempotency can return replay.

## Validation

- Functions strict TypeScript/check, build and lint: PASS; TS7016/errors: zero;
- Functions: 21/21 PASS, up from 19/19 through two new tests;
- isolated Functions: 376-package clean install, strict check, 21/21 tests,
  ESM smoke with 20 exports, runtime/types for all eight package paths PASS;
- package 28/28; Shared 51/51; repositories 59/23/51/46; general 35/35;
- prechecks unchanged: Enrollment 111/42/69, Course 114/32/82, Membership
  81/44/37, RegistrationRequest 52/34/18;
- Rules preflight 222/88/134; root build and 32 Node syntax checks PASS;
- Functions lint 0/0; global lint remains legacy 13 errors/8 warnings, delta 0;
- protected Rules, indexes, Storage and Firebase hashes remain unchanged.

Functions audit remains seven moderate Firebase/Google SDK findings. Available
fixes require breaking downgrades; no dependency was changed. Node 22 remains
configured through engines, ES2022, NodeNext and Node 22 types; the available
host is Node 24.15.0, so native Node 22 execution is not claimed.

## Safety, risk and rollback

No Emulator, Firebase remote operation, deployment, bootstrap or business
command was executed. The remaining gate is independent full C1 revalidation
after human review and push. Rollback reverts the technical and documentation
commits and reruns the malformed-record characterization and regression matrix;
no persisted data rollback is required.

## State

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed
SaaS-03B-B-C1-R2-R1 = completed
SaaS-03B-B-C1-R2-R2 = completed_pending_human_review_and_push
SaaS-03B-B-C1-R2 = blocked_pending_R2_R2_human_review_and_revalidation
SaaS-03B-B-C1 = not_closed
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_independent_revalidation
```

After publication, reexecute the independent full C1 validation. R2-R2 does not
close C1 or start 03B-C.
