# SaaS-03B-C-R4-C1-R1 — Persisted Identity Validation Repair

## Trigger and decision

R4-C1 reproduced `MALFORMED_PERSISTED_IDENTITY_ACCEPTED`: the Bootstrap
Identity port checked keys, UID, email and verification but trusted malformed
profile, locale and timestamp values. The contract audit produced RESULT A;
Domain, package fields, the Identity serializer/validator and Rules jointly
close the eight-field contract, so no shared contract gap or package change is
required.

## Contract and boundary

The exact required order is `uid`, `email`, `displayName`, `photoURL`,
`emailVerified`, `interfaceLocale`, `createdAt`, `updatedAt`. UID is a valid
opaque document identifier and equals Auth/target UID. Email is a string equal
to the already-normalized expected/Auth email. `displayName` is a string;
`photoURL` is string or null; `emailVerified` must be true for Bootstrap;
`interfaceLocale` is a non-empty string under the existing Identity validator
(no new canonical-BCP47 restriction was invented).

Both timestamps are required/non-null. Their physical Identity representation
is native Firestore Timestamp; the logical Domain representation is canonical
UTC ISO. The Admin reader now uses the explicit `identity` persisted shape to
normalize only these two fields before the package-owned persisted-timestamp
validator. Missing, extra, wrongly typed, null, invalid or mismatched values
fail closed with the existing backend taxonomy and no document/email leakage.

Both target Identities are fully validated before command creation, Registry or
Authority mutation, prepare audit or Auth claim effects. Tests prove malformed
A/valid B and valid A/malformed B both leave every such surface untouched.

## Evidence

The original malformed specimen (numeric display name, object photo URL, null
locale, invalid created timestamp and array updated timestamp) is rejected.
The negative matrix covers every missing field, extra field, invalid/mismatched
UID and email, profile types/nullability, false verification, empty locale and
invalid timestamps. Positive cases cover null/string photo URL and complete
valid Identities.

Functions increase 40 to 43 tests and pass strict check/build, lint 0/0, clean
isolated install/build/tests, ESM and 8/8 package imports. Bootstrap Emulator is
3/3 and Store Emulator 5/5 on Firestore Emulator 1.21.0 with Temurin Java 21;
retry/concurrency, forward recovery, finalize idempotency and native timestamp
integrity remain valid. Emulator/hub shutdown left no Java process.

Package remains 0.10.0 and 40/40 with artifact SHA-256
`a07d283ebae2b6a81d7460eaeddbeeea6f7caf577611dc8c92d7ad014f1caca1`.
Shared is 51/51; repositories 360/360 (59/59, 23/23, 51/51, 46/46); all four
prechecks, Rules 222/88/134, general 35/35, root build and 306 Node checks pass.
Global lint remains legacy 13/8 with attributable delta zero. Root audit remains
25 (3 low, 9 moderate, 13 high) and Functions 7 moderate; dependency delta is
zero.

Protected Rules/index/storage/Firebase hashes are unchanged. No Firebase remote
operation, deploy, Recovery, Revoke, 03B-D, Phase 4 or push occurred. Native
Node 22 was unavailable (local Node 24.15.0); engine 22, ES2022 and NodeNext
remain configured and no Node-24-only API was introduced.

## Risk, rollback and continuity

The local validator intentionally mirrors only the already approved Identity
contract; future tightening of locale or profile semantics must occur through
its own authority change. Rollback before push is removal of the five technical
diffs and these documents; no remote state changed.

R1 is `completed_pending_human_review_and_push`. Bootstrap remains
`repaired_pending_independent_revalidation`; after human push, rerun the full
R4-C1 before authorizing RecoverPlatformAdmin.
