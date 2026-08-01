# SaaS-02C.2G-B2.3 — Static Rules test implementation

## Purpose, scope and sources

This phase statically materialized the files authorized by B2.2, then checked
syntax, installed exports, Test ID completeness, uniqueness and expected-result
counts without starting an emulator. The current Rules, consumer closure, B1
evidence, B2 design/scope, configuration, package metadata and existing Rules
test files were reviewed directly.

No Rule, consumer, service, index, Firebase configuration, dependency or
remote resource was modified. Firebase CLI, Java, Emulator Suite and
`npm run test:rules` were not executed.

## Implemented structure

Three context/payload/seed helpers, four fixture modules and seven root-level
test modules were created under `tests/rules`. The existing environment helper
and deny-all baseline were preserved unchanged. Root-level executable files
remain discoverable by the existing `tests/rules/*.test.mjs` script glob.

The implementation uses Node Test Runner, strict assertions,
`@firebase/rules-unit-testing` 4.0.1, the Firebase Firestore SDK and project
`demo-polish-learning`. It never imports `src/firebase.js`.

Synthetic contexts use only the approved fake UIDs and `example.test` emails.
Minimum `users/{uid}` documents are seeded through
`withSecurityRulesDisabled`; every file clears Firestore before each case and
cleans up its environment after its suite. Positive timestamp cases use the
real `serverTimestamp()` sentinel; negative cases use a fixed historical
Firestore `Timestamp`.

## Static coverage and traceability

| Family | IDs | Count | Static syntax |
|---|---|---:|---|
| FLH-001 messages | RT-MSG-001..034 | 34 | valid |
| FLH-008 posts | RT-PST-001..036 | 36 | valid |
| FLH-012 replies | RT-RPL-001..027 | 27 | valid |
| FLH-015 reports | RT-RPT-001..036 | 36 | valid |
| FLH-020 tickets | RT-SUP-001..046 | 46 | valid |
| cross-resource | RT-REG-001..006 | 6 | valid |
| permission union | RT-SEC-001..006 | 6 | valid |
| SaaS regression | RT-SAS-001..010 | 10 | valid |
| **Total** | | **201** | |

All IDs are present and unique. Authentication, ownership, strict keys,
constants, types, boundaries, timestamps, non-create regression, match union,
catch-all and representative SaaS behavior are statically represented. The
existing Storage baseline is unchanged and no new test imports Storage.

## Blocking design divergence

The B2.2 design contains an internal arithmetic contradiction:

- its ten explicit `RT-SAS-001..010` rows specify ALLOW for IDs 001, 002, 004,
  006, 007, 008 and 009, and DENY for 003, 005 and 010;
- therefore the SaaS family is 7 ALLOW / 3 DENY;
- the B2.2 summary instead records SaaS as 6 ALLOW / 4 DENY;
- all other family counts match their explicit rows;
- the implemented explicit matrix totals 82 ALLOW / 119 DENY, while the
  phase contract requires 81 ALLOW / 120 DENY.

No specific SaaS case is authorized to change expectation, and changing one
would alter an approved test contract. Reducing coverage, inventing a case or
mislabeling metadata is prohibited. A corrective documentary microphase must
choose one of these decisions:

1. confirm all ten explicit SaaS expectations and correct the contractual
   aggregate to 82/119; or
2. identify the exact RT-SAS case whose expectation must change, with the
   governing Rule/contract justification.

Until that decision, B2.3 cannot satisfy the mandatory 81/120 distribution.

```text
Test ID: RT-SAS aggregate (RT-SAS-001..010)
Affected file: tests/rules/saasRegression.test.mjs
Problem: explicit rows total 7 ALLOW / 3 DENY; design summary says 6 / 4
Impact: global implementation is 82 ALLOW / 119 DENY, not 81 / 120
Required correction: reconcile B2.2 expectation contract before B2.3 closure
```

## Static validation and runtime limitation

All 14 new `.mjs` files returned exit code 0 from `node --check`. Static import
inspection confirmed installed exports for Rules environment/assertions and
Firestore `serverTimestamp`. No test file was imported because `node:test`
registration would execute it; no Firestore operation or local port was
contacted.

The test files were not executed against Firebase Emulator Suite. Runtime
behavior, Rule compilation and server-transform behavior remain unverified.
Java and runtime execution remain unauthorized.

## Storage, risks and rollback

`storage.rules` and the existing deny-all Storage tests are unchanged. The new
suite is Firestore-only.

Risks include the unresolved expectation count, lack of runtime validation,
possible fixture/Rule semantic drift and future consumer changes. Documentary
rollback removes only B2.3 artifacts and references while preserving B2.1,
B2.2, Rules, consumers and the preexisting deny-all test.

## Decision and next phase

The files are statically implemented and syntactically valid, but the approved
contract cannot be met without an unauthorized design decision.

```text
SaaS-02C.2G-B2.3 static Rules test implementation = INCOMPLETE
SaaS-02C.2G-B2.3 = incomplete_requires_test_design_correction
SaaS-02C.2G-B2.4 = blocked
```

B2.4 was not started. No deployment was performed.

## B2.3A forensic resolution

`FIRESTORE_RULES_TEST_EXPECTATION_RECONCILIATION.md` confirmed that the 201
implemented cases are internally correct. The RT-SAS family canonically totals
7 ALLOW / 3 DENY; no test file change is required.

```text
Implemented cases = 201
Canonical ALLOW = 82
Canonical DENY = 119
Count discrepancy = resolved
No test file changes required
B2.3 = completed_pending_human_static_test_review
```

The earlier incomplete decision is retained above as historical evidence of
the pre-reconciliation state.

## B2.4A CI strategy status

The 201 static cases remain canonical at 82 ALLOW and 119 DENY. Runtime
validation is pending. An isolated CI runner is feasible without Firebase
credentials or login, subject to B2.4B separating the Firestore-only suite
from the existing Storage baseline. No workflow or test change occurred.

B2.4B now provides the statically implemented manual workflow and canonical
seven-file Firestore command. The suite remains 201 / 82 ALLOW / 119 DENY;
runtime execution remains pending and test files remain unchanged.
