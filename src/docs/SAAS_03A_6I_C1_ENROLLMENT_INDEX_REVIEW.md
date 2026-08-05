# SaaS-03A.6I-C1 — Enrollment index review and controlled commits

## Purpose and scope

This phase performs the final technical review of the two locally materialized
Enrollment indexes and prepares isolated technical and documentary commits. It
does not change EnrollmentRepository, Rules, Storage, tests, workflows, scripts,
packages or Domain, and it does not run Emulator, workflow, deploy or push.

```text
branch = main
commit_base = 23fbb2073368e10323141940670e23fc05f92a53
```

## Sources and verified queries

The index file, Enrollment implementation and tests, 6A/R1/6B/6B-C1/6I
documents, Firestore query/index model, Scope, Implementation Order, Firebase
configuration, Rules and the three preceding index-materialization documents
were reviewed completely.

EnrollmentRepository executes only four list variants:

- self without status: tenant, Membership, fixed canonical status `in`, then
  `enrolledAt DESC` and `documentId() DESC`;
- self with status: the same shape with exact canonical status;
- admin without status: tenant, fixed canonical status `in`, then
  `updatedAt DESC` and `documentId() DESC`;
- admin with status: the same shape with exact canonical status.

Tenant is always the first filter, Membership the second self filter and status
the next filter. There is no Course, global, collection-group, inequality,
array, arbitrary-filter or write variant.

## Index inventory and decisions

```text
total = 19
registrationRequests = 4
memberships = 8
courses = 5
enrollments = 2
fieldOverrides = 0
duplicates = 0
conflicts = 0
```

The 17 pre-Enrollment signatures are structurally identical to the commit base.

FI-ENR-002 is accepted with `COLLECTION` scope and fields `tenantId ASC`,
`membershipId ASC`, `status ASC`, `enrolledAt DESC`. It covers both exact and
fixed-`in` self status forms.

FI-ENR-005 is accepted with `COLLECTION` scope and fields `tenantId ASC`,
`status ASC`, `updatedAt DESC`. It covers both exact and fixed-`in` admin status
forms.

FI-ENR-001/003/004/006/007 remain deferred and unmaterialized. There is no
Enrollment index for Course, Membership–Course uniqueness, teacher cohorts,
terminal history, cross-Tenant aggregation, global or backend-only queries.

```text
TECHNICAL_INDEX_DEFECTS_FOUND = NONE
INDEX_CONTRACT_DIVERGENCES_FOUND = NONE
EQUIVALENT_ENROLLMENT_INDEXES = 0
CONFLICTING_ENROLLMENT_INDEXES = 0
```

## `documentId()` and `__name__`

Both families explicitly order by `documentId() DESC`. Firebase Tools 15.24.0
implements the index transformation in
`node_modules/firebase-tools/lib/firestore/api.js`: `processIndex()` calls
`lastIndexFieldOrder()` and supplies an implicit `__name__` suffix using the
last explicit field direction. Thus FI-ENR-002 and FI-ENR-005 correctly receive
implicit `__name__ DESC`; no explicit JSON field is required.

## Structural validation and integrity

JSON parsing, root and array shape, allowed keys, collection IDs, scopes,
non-empty fields, field paths, single order modality, directions, signatures,
counts, duplicates and conflicts pass. The index SHA-256 throughout C1 is
`f9c35524d282076604dcc01945fa78fa9eccd6c9e559bfaa2b0ae5517c8f1d16`.
Rules remain `32cc7937a5f6dacf1ba59a3c7465930262aad9ffb9a3f26e24a65a43b0b36178`
and Storage remains
`2bb6e20646b7b8df9d4f3e318b4f9d51c0294aa10b0f899a7d96a4be0c7dee8c`.

EnrollmentRepository manifest remains
`63ce88a37af210a2eaddaea3bdc038c3044614f9`. Course, Membership,
RegistrationRequest, Shared, Identity, Tenant, Domain, Rules tests and
integration tests also remain manifest-identical.

## Validation results

```text
Enrollment unit tests = 46/46
Enrollment ESLint = PASS
Enrollment node --check = PASS
Course precheck = 114/32/82
Membership precheck = 81/44/37
RegistrationRequest precheck = 52/34/18
Rules preflight = 222/88/134
General tests = 35/35
Build = PASS
JSON/signatures = PASS
git diff --check = PASS
```

## Commit strategy and rollback

The technical commit contains only `firestore.indexes.json` with message
`feat(firestore-indexes): add Enrollment query indexes`. The documentary commit
contains exactly the nine authorized documents with message
`docs(saas): record Enrollment index materialization`.

Rollback removes only the exact FI-ENR-002 and FI-ENR-005 entries, preserves
the preceding 17 signatures and `fieldOverrides`, reparses JSON, revalidates
signatures and restores the pre-6I index hash. It does not change Rules or code.

## Risks, final state and next phase

The definitions remain local: Emulator validation and production deployment are
not performed. Future runtime must validate local query/index compatibility;
this review does not prove production index availability.

```text
SaaS-03A = in_progress
SaaS-03A.6 = in_progress
SaaS-03A.6A-R1 = completed
SaaS-03A.6B = completed
SaaS-03A.6B-C1 = completed_pending_human_push
SaaS-03A.6I = completed
SaaS-03A.6I-C1 = completed_pending_human_push
EnrollmentRepository = implemented_shadow
SaaS-03A.6R-A = ready_not_started
```

Decision: `SaaS-03A.6I-C1 COMPLETE`. The next phase is
`SaaS-03A.6R-A — Enrollment repository runtime test suite`, intended to prepare
Firestore-only runtime coverage. It is not initiated.

6R-A prepares that coverage with 111 classified Enrollment IDs. Both accepted
indexes have explicit trace cases, but Emulator validation remains pending the
later reviewed execution flow.

6R-A-C1 preserves FI-ENR-002/FI-ENR-005 traceability in the corrected 111-ID
suite. No index change or Emulator execution occurs.

## Definitive status after SaaS-03A.6R-B2

The post-F1 workflow supplies successful local Emulator query evidence for both
accepted indexes. FI-ENR-002/FI-ENR-005 are locally materialized and validated;
productive deployment remains unperformed. 6I and 6I-C1 are `completed`.
