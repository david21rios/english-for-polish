# SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1 — Course versionless-write prevention and operational cutover resolution

## Identity and invariant

- Parent: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Identifier: `SaaS-03B-F-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1-R1`
- Blocker: `VERSIONLESS_WRITE_PREVENTION_NOT_ESTABLISHED`
- Invariant: `NO_NEW_CANONICAL_COURSE_WRITE_CAN_COMMIT_WITHOUT_VALID_VERSION`
- Design/documentation only; no implementation or remote operation is authorized.

## Evidence and current boundaries

Published Course gates/contracts are normative. Repository/package/Rules code
is physical evidence; tests are test-only; legacy/historical material is lower
authority. Repository-local canonical writer is absent, deployed/external
writer reachability is unknown, deployed state is unknown/not inspected, and
remote Firebase is not authorized.

Current Rules deny canonical client Course writes. This is
`NOT_REQUIRED_FOR_CURRENT_REPOSITORY_LOCAL_CANONICAL_CLIENT_PATH`, but Rules do
not govern Admin SDK or external writers and do not establish global prevention.

## Mechanism capability model

Rules can enforce client writes only. Removing direct clients, routing through a
privileged runtime, repository/package validation, Hosting retirement, external
writer shutdown/update, scripts/tooling controls, migration safeguards, and an
operational freeze provide various local or operational controls; none is
selected here as a global mechanism. `validatePersistedCourse` is canonical
validation but is insufficient globally unless every writer is forced through it.

## Cutover principles

Reuse decisions: `KEEP_UNCHANGED`, `UPDATE_TO_CANONICAL_CAS`,
`DISABLE_BEFORE_CUTOVER`, `DELETE_LATER`, `REPLACE_WITH_PRIVILEGED_RUNTIME`,
`REQUIRES_FURTHER_RESOLUTION`. Unknown writers require the final decision and
keep prevention blocked. Read-only surfaces remain unchanged. Reachable non-CAS
writers must be updated or disabled; stale writer-capable deployments must be
retired or proven unreachable.

Future CreateCourse must atomically persist `version = 1`. UpdateCourse,
ActivateCourse, and ArchiveCourse must use expectedVersion, transactional
reread, stale-version conflict, and exactly one committed increment. Mixed
CAS/non-CAS operation is prohibited.

## Privileged and migration boundaries

Future proof must inventory deployed Functions, external Admin SDK/Cloud Run,
scheduled jobs, CI/CD, operator scripts, Extensions, and other environments.
A migration writer is a temporary, explicitly authorized, idempotent exception
that may assign `version = 1` only to approved otherwise-canonical legacy
documents; it cannot create new versionless data or repair malformed structure.

`OPERATIONAL_WRITE_FREEZE = CONDITIONALLY_REQUIRED` when comprehensive control
cannot otherwise be proven. Partial cutover keeps migration blocked, runtime
unauthorized, stages closed, and mixed operation prohibited; rollback must not
re-enable uncontrolled writers.

## Completion proof and ordering

Operational prevention requires identified environments, repository audit,
known deployed client/Functions/external writer reachability, no unknown writer,
decisions for every reachable writer, all non-CAS writers updated/disabled,
stale deployments retired, bounded migration writer, any required freeze active,
and independently reviewed evidence.

Design may complete before deployed state is read; operational clearance may
not. The order is writer reachability → state inventory → prevention/cutover →
backup → migration dry-run → migration → verification.

Course runtimes remain `NOT_AUTHORIZED`. F-R2 remains Enrollment-only and not
started; SaaS-03B-R remains after full F closure; Phase 04 remains `NOT_STARTED`.

Publication status: `PENDING_INDEPENDENT_REVIEW`.
