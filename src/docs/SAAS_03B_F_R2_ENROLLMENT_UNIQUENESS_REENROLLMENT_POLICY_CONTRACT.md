# SaaS-03B-F-R2 — Enrollment Uniqueness / Duplicate / Re-enrollment Policy

## Normative policy

This contract records the human-approved F-R2 decisions R2-01 through R2-07.
It defines Enrollment semantics only; it does not authorize runtime commands,
provider writes, migration, Rules or index changes.

- **R2-01 — logical identity:** uniqueness is tenant-scoped by
  `tenantId + membershipId + courseId`. `enrollmentId` remains the physical
  identity. There is no cross-tenant uniqueness.
- **R2-02 — temporal scope:** only non-terminal records reserve the key.
  `pending` and `active` are non-terminal; `completed` and `cancelled` are
  terminal. At most one non-terminal Enrollment may exist for a key.
- **R2-03 — duplicates:** a replay of the same command identity reproduces its
  established result. A distinct request for an existing non-terminal record is
  rejected as a duplicate/conflict; it never creates a second record.
- **R2-04 — completed:** completed records are immutable history. Re-enrollment
  is allowed only after current eligibility checks and creates a new
  `enrollmentId`.
- **R2-05 — cancelled:** cancelled records are immutable history. Re-enrollment
  is allowed only after current eligibility checks and creates a new
  `enrollmentId`.
- **R2-06 — eligibility and lifecycle:** new enrollment requires Course status
  `active` and Membership status `approved`, using the existing normative
  state names. Later Course or Membership changes do not implicitly rewrite,
  cancel or delete Enrollment records; explicit Enrollment workflows are
  required.
- **R2-07 — legacy boundary:** F-R2 authorizes no migration, deduplication,
  deletion, rewriting or normalization of legacy data. Compatibility and any
  remediation require a separate approved gate.

## Invariants and deferred mechanics

Concurrent attempts must never produce more than one non-terminal Enrollment
for a tenant-scoped logical key. The enforcement mechanism is intentionally
deferred to a later implementation gate; transactions, deterministic IDs,
claims, locks, new indexes and Rules changes are not authorized here.

Terminal records remain historical without an invented retention duration.
Future lifecycle states require explicit normative classification before they
can affect uniqueness.

The semantic distinction between same-command replay and a distinct duplicate
is required, while its technical representation follows the generic command
identity contract or a later Enrollment command contract.

## Status boundary

Enrollment runtime implementation, provider writes, migration, Rules and index
deployment remain unauthorized by this resolution.
