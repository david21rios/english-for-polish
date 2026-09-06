# SaaS-03B-F-R2-T1/T2 — Enrollment Atomic Uniqueness + Write-Store Boundary

Status: `human_approved_contract_authored_pending_independent_review`

This technical contract materializes the approved implementation boundary for
F-R2. It does not implement Enrollment or authorize provider, Rules, index,
migration, or legacy-remediation changes. R2-01 through R2-07 remain the
authoritative product policy.

## T1 — atomic uniqueness

The logical key is `tenantId + membershipId + courseId`. A deterministic active
logical claim represents the current reservation for that key; its holder is the
current non-terminal `enrollmentId`. The claim is not historical Enrollment
identity. `pending` and `active` reserve it; `completed` and `cancelled` release
it. Historical records remain independently addressable by opaque,
cycle-specific `enrollmentId`; a later cycle receives a new identifier.

Concurrent creation must commit no state containing two non-terminal
Enrollments for one logical key. Creation must atomically establish the command
replay/conflict state, contend on the claim, and either replay the same command,
return `CONFLICT` for a distinct duplicate, or create a new Enrollment and claim.

Terminal transitions must release the claim atomically with terminalization.
Complete/Cancel command implementation is outside this contract.

## T2 — write-store boundary

The atomic operation belongs behind an Enrollment write-store/transaction
boundary. Orchestration performs input validation, existing actor/capability and
tenant checks, Course `active` eligibility, Membership `approved` eligibility,
command identity/idempotency, and result/error mapping. The write boundary owns
claim enforcement and Enrollment persistence, reusing the established command
record and canonical payload architecture. A non-atomic query/check/create
sequence is prohibited.

Claim and record inconsistencies (missing holder, terminal holder, absent claim,
key mismatch, or abnormal multiple non-terminal legacy records) fail closed;
no silent repair, deletion, deduplication, normalization, or migration is
authorized. Legacy compatibility remains conditional on detected incompatibility.

## Boundaries and deferred details

The exact collection/path, claim schema, tuple encoding/hash, store/interface
name, adapter, indexes, Rules, and migration handling remain
`IMPLEMENTATION_DETAIL_PENDING_DERIVATION` (or a separately approved technical
decision where architectural). No second idempotency model, actor matrix, or
product foundation is introduced. Server-authoritative Admin SDK writes do not
require a Rules change under the current architecture; no index change is
authorized by this contract.

Traceability: T1/T2 implement the enforcement consequence of R2-01–R2-03 and
R2-04/R2-05 terminal history; R2-06 eligibility and no-cascade rules remain;
R2-07 legacy restrictions remain unchanged.

Implementation authorization: `BLOCKED_PENDING_TECHNICAL_CONTRACT_INDEPENDENT_REVIEW_AND_PUBLICATION`.
