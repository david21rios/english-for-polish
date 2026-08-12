# SaaS-03B-C-R3-R1 — Portable Persisted Timestamp Contract Resolution

## Decision

No earlier formal identifier names this precondition. `SaaS-03B-C-R3-R1` is
the minimum subordinate resolution beneath the schema-versioning decision that
exposed it. Result: **PORTABLE CONTRACT POLICY CLOSED — DOCUMENTATION ONLY**.

This resolution does not implement a package primitive, Platform Authority
schema v1, `transitionCommandId`, a Transaction Store or a business command.

## Evidence and inventory

Domain 1.2.0 represents SaaS instants as UTC ISO-8601 strings. Identity, Tenant,
RegistrationRequest, Membership, Course and Enrollment serializers already
accept SDK timestamp-like values or `Date`, convert through `toISOString()` and
return immutable Domain data without Firebase objects. Their Firestore fixtures
use native `Timestamp`; queries order the native stored fields; client writes
that own timestamps use `serverTimestamp()`.

Firestore Rules compare server-owned writes with `request.time`, confirming a
native Firestore timestamp at the physical boundary. Package persistence
contracts currently name timestamp fields but provide no portable timestamp
primitive. Functions command records and audit events use canonical ISO strings
as their command-specific logical representation. Platform Authority and its
Registry specify server timestamps but previously left the portable validator
undefined.

Relevant infrastructure fields include `createdAt`, `updatedAt`, `requestedAt`,
`approvedAt`, `suspendedAt`, `enrolledAt`, `completedAt`, `cancelledAt`, command
`startedAt`/`completedAt`/`failedAt`/`expiresAt`/`leaseExpiresAt`, audit
`requestedAt`/`executedAt`, registry `updatedAt`, and Authority `createdAt`,
`updatedAt`, `activatedAt`, `revokedAt`, `lastClaimSyncAt`. Academic dates and
legacy UI-only dates are not part of this infrastructure contract.

## Logical, physical and write boundaries

Three different concepts are mandatory:

1. **Portable logical persisted value:** a canonical UTC ISO-8601 string with
   exactly millisecond precision: `YYYY-MM-DDTHH:mm:ss.sssZ`.
2. **Physical Firestore value:** Firestore's native timestamp, retaining its
   physical precision and native ordering/query semantics.
3. **Write instruction:** `serverTimestamp()` (or the Admin SDK equivalent) is
   an adapter-owned transform, not a value accepted by the package validator.

Logical and physical representations are therefore not identical. The adapter
converts a successfully persisted Firestore timestamp to the canonical logical
string on read. On writes of server-owned fields, the adapter supplies the SDK
server-time transform. Business payloads never supply those fields. A future
transaction that needs one deterministic instant across several records must
obtain one server-owned instant at its approved adapter boundary and reuse it;
it must not generate a different client clock value on each transaction retry.
An unresolved transform must be reread before it is treated as a persisted
logical value.

## Strategies

- **Firestore Timestamp as package contract:** rejected because it couples the
  pure package and its frontend consumers to an SDK/runtime class.
- **ISO string:** selected for the portable logical boundary. It matches Domain,
  existing serializers and command/audit contracts and is timezone-independent,
  JSON-safe and lexically chronological in its single canonical form.
- **Epoch milliseconds:** rejected because a numeric unit is easier to confuse
  and would replace the established Domain representation without benefit.
- **`{seconds,nanoseconds}`:** rejected as the logical public representation.
  It would duplicate an SDK-shaped concept and force a broad repository cutover.
- **Branded logical value plus adapter:** selected conceptually without a
  runtime wrapper object; JSDoc/generated TypeScript supplies the precise string
  contract and the adapter owns conversion.
- **Separate write sentinel/value:** selected and required.
- **Reuse:** the existing Shared serializer and command validator are evidence
  and compatible behavior, but neither is package-owned. The later package
  primitive must centralize the portable validation without importing Shared.

## Canonical validation contract

Transition Ownership may materialize a pure package validator following the
existing non-throwing `ValidationResult` convention. Its normative behavior is:

- input must be a primitive string;
- parsing must produce a valid instant;
- `new Date(value).toISOString()` must equal `value` exactly;
- the accepted form therefore uses UTC `Z`, exactly three fractional digits and
  millisecond precision;
- offsets, omitted fractions, extra fractional digits, invalid dates, numbers,
  `Date`, SDK objects, sentinels, `NaN`, objects and `null` are rejected;
- invalid values return `{ok:false, issue}` using the existing validation-result
  family; callers must inspect `ok` and fail closed;
- the validator does not mutate or normalize input.

The timestamp primitive itself is non-null. Nullability belongs to each field.
No object freezing is needed for a primitive string. Canonical strings are
JSON-safe and lexically sortable because every accepted value has the same UTC
layout. The logical contract intentionally has millisecond precision; conversion
from a physical timestamp with finer precision uses the established Date/ISO
boundary and must not be used where nanosecond equality is a concurrency token.
Concurrency continues to use Firestore transactions, revisions and document
preconditions rather than logical timestamp equality.

The natural package placement is the existing `./validation` surface, reexported
from the package root. No new subpath or runtime dependency is authorized.

## Platform Authority and Registry

The future Authority validator must apply the portable validator as follows:

| Field | Rule |
| --- | --- |
| `createdAt` | required canonical timestamp |
| `updatedAt` | required canonical timestamp |
| `activatedAt` | canonical timestamp or `null` |
| `revokedAt` | canonical timestamp or `null` |
| `lastClaimSyncAt` | canonical timestamp or `null` |

The fields remain server-owned. This resolution adds no new lifecycle relation
between timestamps and status. Platform Authority Registry `updatedAt` follows
the same logical read contract, while its complete Registry validator remains
deferred to the Transaction Store resolution.

Command and audit timestamps already use the selected logical form. They may
reuse the future validator, but this resolution does not broaden their schemas
or force an immediate refactor. Client repositories remain unchanged: their
current Firestore-to-ISO serializers already satisfy the boundary. No migration
of persisted Firestore values is required because the physical representation
remains native Timestamp.

## Rules, indexes, types and SemVer

Rules and indexes remain unchanged: native Firestore timestamp storage and
query ordering remain intact. The package stays Firebase-independent.

This documentation-only decision does not change package `0.7.0`, declarations,
artifact or Functions. When Transition Ownership adds the public timestamp
validator plus Authority schema contracts, it must evaluate the complete
additive public delta against the then-current version. From the current
`0.7.0` baseline, that combined backward-compatible materialization is MINOR;
this resolution does not reserve a version number independently.

## Risks and rollback

The main tradeoff is deliberate millisecond precision at the portable Domain
boundary while Firestore can retain finer physical precision. The design avoids
using logical timestamp equality for concurrency, preventing silent precision
loss from becoming an ownership check. Adapter implementations must reject
invalid/unresolved values and must never expose SDK objects.

Rollback of this documentation-only resolution is the documentation commit.
No data, artifact or runtime rollback is required.

## Roadmap

```text
SaaS-03B-C-R3-R1 = completed_pending_human_review_and_push
Platform Authority Transition Ownership Resolution = blocked_pending_R3_R1_push
Platform Command Transaction Store Boundary = blocked
SaaS-03B-C = blocked
SaaS-03B-D = blocked
03B-E/F = not_started
Phase 4 = not_started
```

After human review and push, Transition Ownership is `ready_to_resume`. It must
materialize the validator and Authority schema together. The Transaction Store
and 03B-C remain separate later gates.
