# SaaS-02C.2G-B2.3A — Expectation-count forensic reconciliation

## Purpose and prior state

B2.3 materialized 201 unique Test IDs but found that their explicit metadata
totals 82 ALLOW / 119 DENY, while the B2.2 aggregate summary stated 81 / 120.
This read-only forensic phase determines whether an individual expectation is
wrong or the aggregate was an arithmetic documentation error. No test, Rule,
fixture, helper, consumer, technical configuration or remote resource changed.

## Sources and extraction method

All mandatory Rules, security/design/closure documents, seven implemented test
files, four helpers, four fixtures and current configuration sources were read
directly. A temporary PowerShell read-only extraction scanned every root Rules
test line for literal `id`, `expected` and `title` fields, recorded file and
line, grouped by ID family, checked canonical ranges and duplicates, and
recomputed totals. No test module was imported or executed.

## Independent counts

| Category | Total | ALLOW | DENY | Result |
|---|---:|---:|---:|---|
| RT-MSG | 34 | 14 | 20 | Verified |
| RT-PST | 36 | 14 | 22 | Verified |
| RT-RPL | 27 | 11 | 16 | Verified |
| RT-RPT | 36 | 14 | 22 | Verified |
| RT-SUP | 46 | 22 | 24 | Verified |
| RT-REG | 6 | 0 | 6 | Verified |
| RT-SEC | 6 | 0 | 6 | Verified |
| RT-SAS | 10 | 7 | 3 | Verified |
| **Total** | **201** | **82** | **119** | **Verified** |

All 201 IDs are unique, within their canonical ranges, non-malformed and carry
exactly one ALLOW/DENY expectation. No ID is missing or duplicated. The seven
non-SAS families match both their detailed B2.2 rows and B2.3 implementation.

The first persisted repository source of 81/120 is the original aggregate row
in `FIRESTORE_RULES_TEST_DESIGN.md` created in B2.2. Its detailed RT-SAS rows
already contained seven ALLOW and three DENY; the aggregate incorrectly counted
that family as 6/4. B2.3 copied the aggregate as a contractual check and then
correctly exposed the contradiction.

## RT-SAS forensic matrix

All cases use authenticated UID `forum-user-01`, except that the target of the
foreign Identity case is `forum-other-01`. Seed paths and operation dispatch
come from `tests/rules/saasRegression.test.mjs`; each metadata expectation is
used by the common explicit branch `ALLOW ? assertSucceeds : assertFails`.

| ID / source line | Operation and path | Seed / applicable Rule and helpers | B2.2 / implemented / derived | Result |
|---|---|---|---|---|
| RT-SAS-001, line 31 | get `identities/forum-user-01` | own Identity; `saasIsSelf(uid)` | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-002, line 32 | update own Identity displayName + server updatedAt | valid initial shape; self, changed-field allowlist, types and request time | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-003, line 33 | get `identities/forum-other-01` | auth UID differs from path; `saasIsSelf` false | DENY / DENY / DENY | DENY_CONFIRMED |
| RT-SAS-004, line 34 | get active Tenant | active Tenant; canonical encoded membershipKey and approved self Membership | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-005, line 35 | list `tenants` | Tenant match explicitly has `allow list: if false` | DENY / DENY / DENY | DENY_CONFIRMED |
| RT-SAS-006, line 36 | get own Membership | uid, tenantId and membershipId match resource/path | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-007, line 37 | get own RegistrationRequest | uid, tenantId and requestId match resource/path | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-008, line 38 | get active Course | active Tenant, approved student Membership, canonical active Course | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-009, line 39 | get active Enrollment | canonical Enrollment, active Tenant, referenced approved Membership owned by auth UID | ALLOW / ALLOW / ALLOW | ALLOW_CONFIRMED |
| RT-SAS-010, line 40 | get membershipKey | lookup block explicitly denies client read | DENY / DENY / DENY | DENY_CONFIRMED |

## Detailed Rule derivation

Identity read uses only authenticated path ownership. Identity update changes
only `displayName` and `updatedAt`; `photoURL` remains null,
`interfaceLocale` remains a string and the server sentinel targets
`request.time`, while immutable fields remain untouched.

Tenant get is distinct from list. The tenant is active. The calculated key
points to a lookup whose uid, tenantId, membershipId and approved status agree
with the referenced canonical approved student Membership. Therefore the point
get satisfies `saasTenantReadableByApprovedMember`; general list remains
unconditionally denied.

Membership and RegistrationRequest point gets use embedded self UID, same
tenant and canonical document IDs. They do not exercise list/query semantics.
Course is canonical and active, with an approved student Membership in an
active Tenant. Enrollment is canonical, active, belongs to the Tenant and
references the same approved Membership owned by the authenticated UID. The
lookup read is denied by its explicit match; no platform or legacy bypass
applies.

## Design/implementation comparison

Every RT-SAS description, operation, actor, seed, path and metadata expectation
corresponds to its B2.2 detailed row. The test runner includes the metadata in
the test name and chooses `assertSucceeds` exactly for ALLOW or `assertFails`
for DENY. There is no metadata/assert inversion, path substitution or seed
divergence. Runtime was not required to derive these explicit static outcomes.

## Root cause and decision

```text
ALTERNATIVE = A
CANONICAL_TEST_TOTAL = 201
CANONICAL_ALLOW_TOTAL = 82
CANONICAL_DENY_TOTAL = 119
ROOT_CAUSE = aggregate_documentation_arithmetic_error
COUNT_RECONCILIATION = resolved
TEST_ID_REQUIRING_CORRECTION = none
```

The detailed B2.2 test matrix and the B2.3 static test implementation
consistently contain 82 expected ALLOW cases and 119 expected DENY cases.

The previously documented aggregate of 81 ALLOW and 120 DENY was an arithmetic
summary error.

No individual test expectation requires modification.

## Changes required, risks and next phase

Only aggregate documentation requires correction. No B2.3B test-correction
phase is required. Static derivation does not replace runtime validation;
B2.4 remains blocked by the unauthorized Java/Emulator environment and needs a
separate owner decision. Future Rule, fixture or SDK changes could invalidate
expectations and require renewed review.

```text
SaaS-02C.2G-B2.3A expectation count reconciliation = COMPLETE
SaaS-02C.2G-B2.3B = not required
SaaS-02C.2G-B2.4 = blocked_by_runtime_environment
```

Rules runtime tests, Firebase Emulator Suite, Java, Firebase CLI and deployment
were not executed.

## Runtime strategy follow-up

B2.4A preserves the reconciled totals of 201 / 82 ALLOW / 119 DENY. Static
implementation is complete; runtime remains pending. A zero-credential
demo-project CI strategy is feasible after B2.4B defines the Firestore-only
execution boundary. No expectation or test file changed.

B2.4B preserves the reconciled 201 / 82 / 119 contract in the manual CI
workflow preflight. The workflow is statically implemented but was not run.
