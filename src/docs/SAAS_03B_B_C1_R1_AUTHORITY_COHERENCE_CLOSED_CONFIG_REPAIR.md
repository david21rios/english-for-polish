# SaaS-03B-B-C1-R1 — Authority Coherence and Closed Configuration Repair

## Trigger and scope

Independent C1 review characterized three incorrect accepted cases at published
HEAD `be5f219ac6ade7e25c4e7fd586e7367c138a70e7`:

```text
platformIdentityMismatch = ACCEPTED
tenantIdentityMismatch = ACCEPTED
unknownConfigKey = ACCEPTED
```

R1 repairs only guarantees already claimed by the Functions foundation. Package,
Domain, Shared, repositories, Rules and Firebase configuration remain unchanged.
No business command, handler, bootstrap or remote operation is added.

## Root causes and repairs

`activeIdentity` checked only document existence. It now requires a plain object,
a canonical non-empty `uid`, and exact equality with the authenticated UID.
Missing Identity remains `FAILED_PRECONDITION`; malformed Identity is
`CONTRACT_VIOLATION`; UID mismatch is `FORBIDDEN`, without exposing either UID.

Platform authority additionally requires its contractually required embedded
`uid` to equal the authenticated/path UID, active status and exact
`platform_admin` authority. Tenant resolution requires embedded `tenantId`,
Membership `membershipId`, actor UID, tenant ID, approved status and a role that
resolves through the shared matrix.

The config loader previously declared `allowedKeys` but did not consult it. Every
input key is now checked against that single allowlist; unknown, multiple,
case-variant and secret-like keys fail closed. The five approved environments and
existing project/region requirements are unchanged.

The transaction helper previously exposed manual counters beside the raw port.
R1 wraps `get`, `create`, `set` and `update`, automatically counting operations.
Nineteen reads or writes succeed; the twentieth is rejected. Manual counter
methods remain compatible but are no longer required for enforcement.

## Reconciled adjacent findings

- `platformControl/authorityRegistry` governs bootstrap, activation/deactivation,
  recovery and last-admin count. The active authority document remains the
  authorization source of truth. Registry mutation and command-specific rereads
  stay in 03B-C; they are not added to the read-only foundation resolver.
- Tenant command flows must reconcile `membershipKey` and canonical Membership.
  The approved uidKey encoding is not yet a package-owned executable primitive;
  R1 does not invent a local encoder. Current resolver coherence is bounded to a
  supplied canonical membership path. Command-specific key lookup remains a
  required later gate, before any Tenant business command.
- Generic payload validation rejects top-level authoritative fields. Nested
  business objects are not interpreted as authority anywhere in foundation.
  Their semantic validation belongs to each exact command schema; a recursive
  name blacklist would incorrectly prohibit legitimate business shapes.

## Tests and validation

The original three cases now produce:

```text
platformIdentityMismatch = REJECTED:FORBIDDEN
tenantIdentityMismatch = REJECTED:FORBIDDEN
unknownConfigKey = REJECTED:CONTRACT_VIOLATION
```

Negative coverage includes missing/null/non-object Identity, missing/null/
non-string/empty/whitespace/mismatched UID, authority UID mismatch, missing or
inactive platform authority, inactive Tenant, Membership actor/Tenant/status/
role mismatch, unknown configuration keys and automatic 19/20 budgets. Nested
payload cases document the generic-versus-command-specific boundary.

- Functions: 19/19 PASS (18 previous, one new test; existing cases expanded);
- strict TypeScript/check and lint: PASS; TS7016/errors/introduced `any`: zero;
- isolated clean install/build/tests: PASS; ESM smoke 20 exports;
- isolated package runtime and type imports: 8/8 PASS;
- package 28/28; Shared 51/51; repositories 59/23/51/46 PASS;
- prechecks retain 111/42/69, 114/32/82, 81/44/37 and 52/34/18;
- Rules 222/88/134; general tests 35/35; Vite build and Node checks PASS;
- scoped lint 0/0; global lint remains legacy 13 errors/8 warnings, delta zero;
- Functions audit remains seven moderate transitive Firebase/Google findings.

Node 22 remains configured with ES2022, NodeNext and Node 22 types. The available
host was Node 24.15.0; native Node 22 execution was not available and is not
claimed.

## Protected state, risks and rollback

Rules, indexes, Storage, Firebase config and client Firebase hashes are unchanged.
No Emulator, Firebase remote service or deploy was used. Remaining risks are the
documented SDK advisories and command-specific registry/membershipKey integration.

Rollback reverts the isolated technical commit and this documentation commit,
then reruns the same characterization and regression matrix. No data rollback is
required because the foundation still exports no handler and performs no remote
mutation.

## State and next gate

```text
SaaS-03B-B = implemented_repaired_pending_independent_revalidation
SaaS-03B-B-C1-R1 = completed_pending_human_review_and_push
SaaS-03B-B-C1 = blocked_pending_R1_human_review_and_push
SaaS-03B-C = blocked
Privileged Backend Foundation = repaired_pending_C1_revalidation
Bootstrap platform_admin = not_started
```

After human review and push, `SaaS-03B-B-C1-R2` must independently revalidate the
complete foundation from a clean checkout. R1 does not start that review.
