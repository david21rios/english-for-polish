# SaaS-03B-B0-I-R3-G — Error and result contract reconciliation

## Purpose and decision

R3-G reconciles the client repository error surface with the universal and
backend-declarative contracts already in `@mipymetic/saas-contracts`, and
inventories command, idempotency, authority and audit result contracts. It does
not move `RepositoryError`, alter Firebase mappings, create backend executors or
collapse contracts with different consumers.

Decision: `RESULT_A — reconciliation only`. The current code already implements
the approved separation, so no technical change is required.

## Sources and Git baseline

The audit covered Domain 1.2.0, Architecture Freeze, ADR-001..009, R3-A..R3-F,
the implementation order and tenant-aware scope, all package
error/command/authority/audit modules and tests, Shared errors and tests, the six
SaaS repository families, runtime prechecks, Rules preflight, Functions metadata
and the vendored artifact manifest.

```text
branch = main
HEAD = origin/main = 04084717bdcbb6c6066eb83a169d4922b19e0c11
worktree = clean
R3-F technical commit = 360343fb17b440974397da9cba712ae69b99cca6
R3-F documentation commit = 04084717bdcbb6c6066eb83a169d4922b19e0c11
```

## Client repository error surface

`src/services/saas/shared/errors/repositoryError.js` remains the client
repository authority. Its frozen `REPOSITORY_ERROR_CODES`, in order, are
`INVALID_ARGUMENT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`,
`FAILED_PRECONDITION`, `UNAVAILABLE`, `CONTRACT_VIOLATION` and `UNKNOWN`.

`RepositoryError` validates code/message and exposes sanitized operation,
resource, cause and details. The same module owns `createRepositoryError` and
`mapFirebaseError`; no separate `normalizeFirebaseError.js` exists. Their exact
Firebase mapping remains:

| Firebase code | Repository code |
|---|---|
| `permission-denied` | `FORBIDDEN` |
| `unauthenticated` | `UNAUTHENTICATED` |
| `not-found` | `NOT_FOUND` |
| `already-exists` | `CONFLICT` |
| `failed-precondition` | `FAILED_PRECONDITION` |
| `aborted` | `CONFLICT` |
| `unavailable` | `UNAVAILABLE` |
| `deadline-exceeded` | `UNAVAILABLE` |
| `invalid-argument` | `INVALID_ARGUMENT` |
| unmapped | `UNKNOWN` |

This surface is `CLIENT_REPOSITORY_SURFACE_KEEP`; its class and Firebase-aware
mapper are `PROHIBITED_TO_MIGRATE_IN_R3`. Messages, mappings, sanitization,
exports and class identity remain unchanged.

## Package errors and overlap

`packages/saas-contracts/src/errors/codes.js` already physically owns:

- `COMMON_ERROR_CODES`: the same nine string values.
- `BACKEND_ERROR_CODES`: the common nine plus `ALREADY_EXISTS` and `INTERNAL`.

| Family | Shared | Common | Backend | Resolution |
|---|---:|---:|---:|---|
| nine common codes | yes | yes | yes | legitimate value overlap; keep surfaces separate |
| `ALREADY_EXISTS` | no | no | yes | backend-only extension correctly owned |
| `INTERNAL` | no | no | yes | backend-only extension correctly owned |

The strings have compatible general meaning, but object reference identity is
not required. Shared is a concrete client repository surface; package errors are
transport-neutral declarations. This is `LEGITIMATE_OVERLAP`, not duplicate
authority. Client consumers must not silently gain backend-only codes, and
package consumers must not gain Firebase mapping behavior. Existing root and
`./errors` exports remain correct and browser-safe.

## Result/outcome inventory

The package already owns frozen `COMMAND_STATUSES`: `pending`, `running`,
`succeeded`, `failed_retryable`, `failed_terminal`, `recovery_required`.
`COMMAND_RECORD_FIELDS` includes `result` and `errorCode`. There is no separate
command outcome enum/factory and no independent executable idempotency outcome
contract; replay/recovery is represented by command status, payload hash,
attempt, lease and result fields. The residual Domain approval descriptor stays
temporary Domain authority for R3-H.

The package already owns `AUDIT_RESULTS` (`succeeded`, `rejected`, `failed`,
`recovery_required`) and `AUDIT_LEVELS` (`basic`, `privileged`, `critical`). It
also owns `PLATFORM_AUTHORITY_STATUSES` (`provisioning`, `active`, `revoking`,
`revoked`, `recovery_required`). These are distinct lifecycle/result concepts;
no Domain or Shared duplicates were found.

| Contract | Authority/classification | Action |
|---|---|---|
| `REPOSITORY_ERROR_CODES` | Shared / `CLIENT_REPOSITORY_SURFACE_KEEP` | preserve |
| `RepositoryError`, `mapFirebaseError` | Shared / `PROHIBITED_TO_MIGRATE_IN_R3` | preserve |
| `COMMON_ERROR_CODES` | package / `ALREADY_EXTRACTED` | preserve |
| `BACKEND_ERROR_CODES` | package / `BACKEND_ONLY_FUTURE_CONTRACT` | preserve |
| command/audit/authority statuses | package / `BACKEND_ONLY_FUTURE_CONTRACT` | preserve |
| approval/idempotency descriptor | Domain / `DOMAIN_MUST_REMAIN_TEMPORARY_AUTHORITY` | R3-H |

```text
RESULT_A = reconciliation_only
TECHNICAL_MIGRATION_REQUIRED = NO
DEFECTIVE_DUPLICATION = 0
REPOSITORY_ERROR_MOVE = PROHIBITED
CLIENT_BACKEND_TAXONOMY_COLLAPSE = PROHIBITED
```

## SemVer and artifact

No package source/export changed, so SemVer remains `0.6.0`. The artifact remains:

```text
filename = mipymetic-saas-contracts-0.6.0.tgz
SHA-256 = 6fda40da4fb2467c40b48e32a35030a9801a2a5d79756658eddf556eb78a44b2
npm shasum = a4a6580a36ce66d139aa3362354a18d8e1c2d4fc
npm integrity = sha512-TRNmDHBGJhlBsDHAt7VI2BWlgU0hZelGAetdguk8S1zTZAWH0X1f/JfbytUtNtQLkYZVEq4tx6iH16nMDZSLvA==
inventory = 30 entries
```

Regeneration, byte reproduction, Functions clean install and isolated import are
not required because package bytes/topology did not change. Their R3-F evidence
remains historical rather than a newly executed R3-G result.

## Validations

```text
saas-contracts = 25/25 PASS
Shared = 51/51 PASS
RegistrationRequest = 59/59 PASS
Membership = 23/23 PASS
Course = 51/51 PASS
Enrollment = 46/46 PASS
node --check = PASS
ESLint = PASS
Enrollment precheck = 111 / 42 / 69; outcomes 42 / 41 / 28 / 0
Course precheck = 114 / 32 / 82; outcomes 32 / 56 / 26 / 0
Membership precheck = 81 / 44 / 37; outcomes 44 / 26 / 11 / 0
RegistrationRequest precheck = 52 / 34 / 18; outcomes 34 / 14 / 4 / 0
Rules preflight = 222 / 88 / 134 PASS
general tests = 35/35 PASS
build = PASS
```

The first sandboxed general-test attempt could not read `vite.config.js`; the
same command passed 35/35 outside that filesystem restriction. This was an
environment limitation, not a product regression.

## Risks, rollback and R3-H

Future changes could drift Shared/package values unless parity stays reviewed.
Backend transport mapping still belongs to 03B-B implementation tests. R3-H
must decide the remaining JSDoc shapes and approval/idempotency descriptor and
perform the final authority scan; it must keep `RepositoryError` and Firebase
normalization in Shared. These are deferred responsibilities, not defects.

Rollback is documentation-only: revert this record and its traceability updates.
No source, package, artifact, lockfile, Rules or data rollback is needed.

```text
SaaS-03A = completed
SaaS-03B = in_progress
SaaS-03B-B0-I-R3 = in_progress
SaaS-03B-B0-I-R3-G = completed_pending_human_review_and_push
SaaS-03B-B0-I-R3-H = ready_not_started
SaaS-03B-B = blocked_pending_B0_I_R3_R4
PURE_CONTRACT_PHYSICAL_EXTRACTION = error_result_surfaces_reconciled
Privileged Backend = not_created
```

R3-G is `COMPLETE` under `RESULT_A`. R3-H is ready but was not started.
