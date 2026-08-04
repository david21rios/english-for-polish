# SaaS-03A.4I — Membership index materialization

## Purpose and scope

This phase materializes locally the eight composite indexes required by the
implemented MembershipRepository self-list queries. It changes only
`firestore.indexes.json` plus authorized trace documentation. It does not
change repository code, Rules, Storage, Domain, packages, tests, workflows, or
Firebase configuration; it performs no Emulator run, remote access, deploy,
commit, or push.

Sources audited include the complete Membership implementation/tests, 03A.4A,
R1 and 4B contracts, the query/index and physical models, access patterns,
Rules/security documents, the existing index JSON, Rules, Firebase config, and
the protected repository/test areas.

## Implemented query shapes

Both scopes always filter `uid == self`, optionally add one exact `status`, one
exact `role`, or both in that order, then order by `createdAt DESC` and
`documentId() DESC` with a bounded limit. Tenant scope uses
`tenants/{tenantId}/memberships`; cross-Tenant scope uses collection group
`memberships`. There is no embedded Tenant filter, multi-value filter,
inequality, array operator, administrative filter, UID-less query, alternate
order, or other query variant.

| Variant | Scope | Equalities | Index |
|---|---|---|---|
| tenant base | COLLECTION | uid | FI-MEM-005 |
| tenant status | COLLECTION | uid, status | FI-MEM-006 |
| tenant role | COLLECTION | uid, role | FI-MEM-007 |
| tenant status+role | COLLECTION | uid, status, role | FI-MEM-008 |
| cross-Tenant base | COLLECTION_GROUP | uid | FI-CG-001 |
| cross-Tenant status | COLLECTION_GROUP | uid, status | FI-CG-002 |
| cross-Tenant role | COLLECTION_GROUP | uid, role | FI-CG-006 |
| cross-Tenant status+role | COLLECTION_GROUP | uid, status, role | FI-CG-007 |

## Material definitions

All entries use `collectionGroup: "memberships"`. Equality fields are
`ASCENDING`; `createdAt` is `DESCENDING`.

| Index | Material fields |
|---|---|
| FI-MEM-005 | uid ASC, createdAt DESC |
| FI-MEM-006 | uid ASC, status ASC, createdAt DESC |
| FI-MEM-007 | uid ASC, role ASC, createdAt DESC |
| FI-MEM-008 | uid ASC, status ASC, role ASC, createdAt DESC |
| FI-CG-001 | uid ASC, createdAt DESC |
| FI-CG-002 | uid ASC, status ASC, createdAt DESC |
| FI-CG-006 | uid ASC, role ASC, createdAt DESC |
| FI-CG-007 | uid ASC, status ASC, role ASC, createdAt DESC |

No administrative FI-MEM-001–004, membershipKey, Tenant-field, backend-only,
write, platform, hypothetical, or unused index is added.

## Existing file and `__name__`

Before materialization the SHA-256 of `firestore.indexes.json` was
`549920628103a016ee3cc8bb19e55112c3656c1222b4211e35d7c3ae92c8f595`.
It contained four RegistrationRequest indexes, zero Membership indexes, and an
empty `fieldOverrides` array. There were no duplicates, equivalent Membership
entries, or conflicts. All four RegistrationRequest entries and their order
remain byte-for-byte unchanged within the JSON structure.

The locally installed `firebase-tools` version is 15.24.0. Its
`lib/firestore/api.js` `FirestoreApi.processIndex()` appends `__name__` when it
is absent and obtains its direction from `lastIndexFieldOrder()`. Because every
Membership entry ends with `createdAt DESCENDING`, the processed suffix is
implicitly `__name__ DESCENDING`, matching the explicit query order. Therefore
`__name__` is intentionally omitted from the source JSON.

## Structural validation and hashes

After materialization the SHA-256 is
`bae5bfe2ba1686aa90bf01a6a8d4d4b87713306c86c42edd43ae48de91bf4a18`.
Local Node validation confirms:

```text
INDEX_COUNT_BEFORE = 4
INDEX_COUNT_AFTER = 12
FIELD_OVERRIDE_COUNT_BEFORE = 0
FIELD_OVERRIDE_COUNT_AFTER = 0
MEMBERSHIP_INDEX_COUNT = 8
DUPLICATE_COUNT = 0
CONFLICT_COUNT = 0
JSON_PARSE = PASS
ROOT_AND_KEYS = PASS
SCOPES = PASS
FIELDS_AND_MODES = PASS
DIRECTIONS = PASS
```

## Rollback

Rollback removes only the contiguous eight `memberships` entries added by this
phase, preserves the four `registrationRequests` entries and `fieldOverrides`,
then repeats JSON parsing, exact-key/mode/scope/direction checks and duplicate
and conflict detection. With no unrelated index change, the restored file must
match the prior SHA-256 above. Rollback is documented but not executed.

## Limitations, risks, and closure

These indexes are materialized only in the local configuration. They are not
deployed, remotely available, production-validated, or yet exercised by the
Emulator. Runtime query behavior and Rules isolation remain unvalidated until
the later Firestore-only runtime phase. Other residual risks
are concurrent movement across cursor pages and the repository remaining in
shadow mode without functional consumers.

```text
SaaS-03A = in_progress
SaaS-03A.4 = in_progress
SaaS-03A.4A-R1 = completed
SaaS-03A.4B = completed
SaaS-03A.4B-C1 = completed
SaaS-03A.4I = completed
SaaS-03A.4I-C1 = completed_pending_human_push
SaaS-03A.4R-A = ready_not_started
MembershipRepository = implemented_shadow
```

C1 confirms all eight index signatures, the exact preservation of the four
RegistrationRequest indexes and `fieldOverrides`, and the implicit descending
`__name__` behavior. No technical correction was required. Next is
`SaaS-03A.4R-A — Membership repository runtime test suite`; it is not started.
