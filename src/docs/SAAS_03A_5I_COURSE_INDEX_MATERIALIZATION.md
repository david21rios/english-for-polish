# SaaS-03A.5I — Course index materialization

## Purpose and scope

This phase materializes locally the five COLLECTION composite indexes required
by the implemented CourseRepository. It changes no repository, Rule, test,
workflow, package or remote Firebase resource. Base commit:
`8c2865038ed45bc0f5018649aa903864d3538f2b`.

## Sources and real queries

The implementation, its 47 tests, 5A/R1/5B documents, query/index model,
Firebase configuration, current index file, preceding index phases and local
firebase-tools 15.24.0 were reviewed.

Both catalog methods use a required status predicate, zero/one learning-language
equality and zero/one support-language equality, followed by
`displayName ASC, documentId ASC`. Student uses `status == active`; teacher uses
the fixed `status in [draft,active]`. Tenant admin uses exact status equality or
the fixed canonical `in` set, followed by `updatedAt DESC, documentId DESC`.
Equality and `in` share each corresponding composite definition.

## Previous inventory

Before this phase, `firestore.indexes.json` had 12 indexes: four
RegistrationRequest, eight Membership, zero Course, and zero fieldOverrides.
Structural duplicate and conflict counts were zero. All twelve preceding
entries and the empty fieldOverrides array are preserved byte-for-field.

## Materialized Course indexes

All five use `collectionGroup: courses` and `queryScope: COLLECTION`.

| ID | Query family | Ordered fields |
|---|---|---|
| FI-CRS-001 | catalog without language filters | status ASC, displayName ASC |
| FI-CRS-002 | tenant-admin exact/all-canonical status | status ASC, updatedAt DESC |
| FI-CRS-003 | catalog by learning language | status ASC, learningLanguage.languageCode ASC, displayName ASC |
| FI-CRS-004 | catalog by support language | status ASC, supportLanguageCode ASC, displayName ASC |
| FI-CRS-005 | catalog by both languages | status ASC, learningLanguage.languageCode ASC, supportLanguageCode ASC, displayName ASC |

No Course COLLECTION_GROUP, speculative, administrative-write or legacy index
was added.

## documentId and implicit __name__

The queries explicitly order by documentId. In firebase-tools 15.24.0,
`node_modules/firebase-tools/lib/firestore/api.js`, `FirestoreApi.processIndex()`
appends `{fieldPath: "__name__", order: suffixOrder}` when absent, while
`lastIndexFieldOrder()` derives `suffixOrder` from the final ordered field.
Consequently FI-CRS-001/003/004/005 receive implicit `__name__ ASCENDING` and
FI-CRS-002 receives implicit `__name__ DESCENDING`. The JSON correctly omits an
explicit `__name__` field.

## Structural validation and hashes

The resulting JSON parses as an object with only `indexes` and
`fieldOverrides`; both are arrays. It contains 17 indexes: four
RegistrationRequest, eight Membership and five Course. Every index and field
uses only supported keys, scopes and directions. `fieldOverrides` remains zero;
duplicates and conflicts remain zero.

```text
before SHA-256 = BAE5BFE2BA1686AA90BF01A6A8D4D4B87713306C86C42EDD43AE48DE91BF4A18
after SHA-256 = DF14AEEED30230AA8C466374FED1E799C3682BF6145989DC4822C6A2CE7AF448
```

The final hash is recorded after validation. Rules and Storage hashes remain
unchanged.

## Rollback

Rollback removes only the five `collectionGroup: courses`, `queryScope:
COLLECTION` entries above, leaving the original twelve entries and
fieldOverrides untouched. Then parse the JSON, rerun structural signature,
duplicate and conflict checks, and confirm restoration of the preceding hash.
Rollback does not touch Rules, repositories, tests or remote Firebase and is not
executed in this phase.

## Limitations and risks

Local materialization is not deployment. Emulator validation is not performed
here, and nothing demonstrates that these indexes are built or available in
production. Query execution remains for later runtime phases. Other residual
risks are unsigned cursors, concurrent page movement, shadow-only operation and
absence of consumers, migration and dual-write.

## Closure

```text
FI-CRS-001 = local_materialization_completed
FI-CRS-002 = local_materialization_completed
FI-CRS-003 = local_materialization_completed
FI-CRS-004 = local_materialization_completed
FI-CRS-005 = local_materialization_completed
production_deployment = not_performed
emulator_validation = not_performed

SaaS-03A = in_progress
SaaS-03A.5 = in_progress
SaaS-03A.5A-R1 = completed
SaaS-03A.5B = completed
SaaS-03A.5B-C1 = completed
SaaS-03A.5I = completed_pending_human_index_review
SaaS-03A.5I-C1 = next_not_started
SaaS-03A.5R-A = blocked_pending_5I_review_and_commit
CourseRepository = implemented_shadow
```

Next is `SaaS-03A.5I-C1 — Course index review and controlled commits`; it is
not started. `SaaS-03A.5I Course index materialization = COMPLETE` if all local
validations and immutability checks pass.

## C1 review result

C1 revalidated the five definitions against the implementation, R1 and
firebase-tools 15.24.0. No technical defect, equivalent index, duplicate or
conflict was found. The original twelve index signatures and fieldOverrides are
identical to the base commit.

```text
local_materialization = completed
emulator_validation = not_performed
production_deployment = not_performed
SaaS-03A.5I = completed
SaaS-03A.5I-C1 = completed_pending_human_push
SaaS-03A.5R-A = ready_not_started
CourseRepository = implemented_shadow
```
