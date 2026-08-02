# SaaS-03A.3I — RegistrationRequest index materialization

## Purpose and sources

This phase locally materializes the four composite indexes approved by the R1
query contract and used by the R2 shadow repository. The repository, Rules,
Domain and remote Firebase resources remain unchanged.

The audit used the R1/R2 contracts, query/index model, access patterns,
physical/persistence/security models, implementation order, current repository
queries and the pre-change `firestore.indexes.json`.

## Queries audited

Both Tenant collection and collection-group variants always filter `uid` by
equality, optionally filter one exact `status`, then order by `requestedAt DESC`
and `documentId() DESC`, with a bounded limit. No other filter or order exists.

## Previous state and material format

Before 03A.3I, `firestore.indexes.json` was valid JSON with empty `indexes` and
empty `fieldOverrides`. All four definitions were `MISSING`; no equivalent,
conflicting or duplicate entry existed.

Firebase index JSON represents the target collection ID in `collectionGroup`,
uses `COLLECTION` or `COLLECTION_GROUP` in `queryScope`, and represents equality
fields as `ASCENDING` and the ordered timestamp as `DESCENDING`. The contractual
`__name__ DESC` tie-break remains explicit in the SDK query but is implicit in
the material index direction; it is therefore not added as a JSON field.

## Materialized indexes

| Contract | Scope | Material fields | Query variant |
|---|---|---|---|
| FI-RRQ-001 | COLLECTION | uid ASCENDING; requestedAt DESCENDING | Tenant self, no status |
| FI-RRQ-002 | COLLECTION | uid ASCENDING; status ASCENDING; requestedAt DESCENDING | Tenant self, status |
| FI-CG-003 | COLLECTION_GROUP | uid ASCENDING; requestedAt DESCENDING | cross-Tenant self, no status |
| FI-CG-004 | COLLECTION_GROUP | uid ASCENDING; status ASCENDING; requestedAt DESCENDING | cross-Tenant self, status |

The entries are grouped deterministically: COLLECTION before COLLECTION_GROUP,
and the no-status variant before the status variant. `fieldOverrides` remains
unchanged. Structural validation confirms exact keys, valid scopes and modes,
the four expected signatures and zero duplicates.

## Safety, risks and rollback

This is local configuration only: no Firebase CLI, Emulator, remote project or
deployment was used. Material definitions still require human review and the
future Firestore-only runtime phase. Actual production availability requires a
separately authorized deployment outside this phase.

Rollback uses the recorded pre-change SHA-256
`6742255415c36daf631b52f233039190af819205cc41fa58d07dd7d9e180c2b9`:
remove exactly the four `registrationRequests` entries introduced here, retain
all prior indexes/overrides, parse and structurally validate the JSON again.

```text
SaaS-03A = in_progress
SaaS-03A.3 = in_progress
SaaS-03A.3I = completed_pending_human_index_review
SaaS-03A.3R = blocked_pending_3I_review_and_commit
```

The next phase is the human review and controlled commit for 03A.3I. Runtime
03A.3R is not started.

## C1 technical review

The installed `firebase-tools` 15.24.0 implementation was audited locally
without executing the CLI. `FirestoreApi.processIndex()` appends a missing
`__name__` suffix and `lastIndexFieldOrder()` selects the last ordered field's
direction. Because every material definition ends in `requestedAt DESCENDING`,
the processed suffix is `__name__ DESCENDING`. The source also omits that suffix
from exported/printed index specifications. This confirms that the four JSON
entries are both valid and compatible with explicit `documentId() DESC` queries.

No index correction was required. Structural normalization again found four
distinct signatures, zero equivalents, zero conflicts and zero duplicates.

```text
SaaS-03A.3I = completed
SaaS-03A.3I-C1 = completed_pending_human_push
SaaS-03A.3R = ready_not_started
```
