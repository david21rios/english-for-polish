# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course runtime/migration authorization gate genealogy resolution

## Resolution identity

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Identifier: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Purpose: define the mandatory transition from the complete portable Course
  contract family to an authorized, reviewable Course runtime family.

The identifier follows the published Course lineage convention: each ordered
semantic/runtime gate is a descendant of the immediately preceding Course
contract unit. This resolution creates no runtime implementation child yet.

## Authority and current state

The Course portable family is `4_OF_4_COMPLETE_PUBLISHED`: CreateCourse,
UpdateCourse, ActivateCourse and ArchiveCourse. All four runtimes remain
`NOT_AUTHORIZED`. Evidence comes from published Course sequence, lifecycle,
version/CAS, compatibility/migration, package and command-contract records;
legacy writer documents are migration evidence, not authority.

## Mandatory gates

1. Inventory every possible Course writer: client/frontend, repositories and
   services, legacy writers, Functions, scripts/seeds/migrations, tests and
   historical writers. Each must be classified `ACTIVE_WRITER`,
   `LEGACY_WRITER`, `TEST_ONLY`, `HISTORICAL`, `PROPOSED` or `ABSENT`.
2. Update or disable every non-CAS writer before runtime cutover. Silent
   coexistence with canonical CAS runtime is prohibited.
3. Prevent new versionless Course writes through the later authorized writer,
   validator, Rules or runtime cutover work; this resolution selects no
   implementation mechanism.
4. Migrate existing versionless Courses by assigning `version = 1`, preserving
   content, lifecycle and existing timestamps. Migration is idempotent.
5. Produce a read-only completion proof showing zero pending versionless
   Courses before any privileged runtime is authorized.

Migration precondition is a completed writer inventory and cutover. Migration
execution belongs to a later explicitly authorized phase. Failure is
fail-closed, preserves the document for retry, and does not authorize runtime.

## Remote boundary

`REMOTE_FIREBASE_ACCESS=NOT_AUTHORIZED` here. A later migration phase must
explicitly identify its environment and authorize read-only inventory, backup
or export, dry-run, target/result counts and zero-versionless verification.
No remote state is assumed or inspected in this resolution.

## Shared foundation and stages

Course runtime reuses the existing authentication, authority, capability,
command binding, idempotency, replay, transaction, persisted validation, audit
and error foundations. No parallel Course foundation is authorized.

All four Course commands remain closed for `not_started`, `prepared` and
`completed`. Established precedent requires implementation and tests first,
then independent review, then controlled publication and only then runtime
stage opening. No stage catalog changes occur here.

## Ordered runtime children

After this gate is resolved and its prerequisites are proven, the runtime
sequence remains:

1. CreateCourse
2. UpdateCourse
3. ActivateCourse
4. ArchiveCourse

Each command receives a distinct descendant implementation, test, independent
review and controlled-publication unit. Each preserves its published portable
payload, authority, lifecycle, CAS, replay and audit boundary.

## Runtime boundaries

- CreateCourse: `course.create`, creates draft with `version = 1`, no
  `expectedVersion` input.
- UpdateCourse: constrained draft/active patch, required CAS, archived terminal,
  exact replay read-only.
- ActivateCourse: draft → active, required CAS, active/archived new command
  rejected, exact replay read-only.
- ArchiveCourse: draft/active → archived, required CAS, server-owned
  `archivedAt`, archived terminal, exact replay read-only.

No command is implemented or authorized by this document.

## Course-family closure

Course runtime closure requires all four runtimes implemented, command-specific
transaction/CAS/replay/concurrency/audit/error tests passing, independent
review and publication for each, writer-cutover evidence, migration proof,
final stage authorization and documentation closure. Broader SaaS-03B-R
security/CI/shadow work remains outside this gate.

## Boundaries and next phase

SaaS-03B-F-R2 remains exclusively Enrollment uniqueness and re-enrollment
policy and does not start here. SaaS-03B-R remains after F. Phase 04 remains
`not_started`. Rules, Firebase, package, Functions, Domain, UI, Providers and
Enrollment files are protected and unchanged.

Next authorized microphase: independent review of this genealogy resolution;
only after that may a separately identified writer-inventory/cutover phase be
authorized.
