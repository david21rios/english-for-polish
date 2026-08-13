# SaaS-03B-D-R3-C1-R5-R2-R1 — Audit Destination Foundation Cutover Scope Reconciliation

## Decision

**RESULT A — Strategy A, expanded R5-R2.** The Foundation API change and every
required caller migration form one atomic technical cutover. This resolution is
documentation-only and does not implement that cutover.

It resolves `R5_R2_SCOPE_DEPENDENCY_CONTRADICTION` without invalidating the
R5-R1 contract. It preserves and connects:

- `BOOTSTRAP_TENANT_TENANT_AUDIT_AUTHORITY_SCOPE_INVALID`;
- `SHARED_FOUNDATION_AUDIT_AUTHORITY_DESTINATION_SCOPE_GAP`;
- `R5_R2_SCOPE_DEPENDENCY_CONTRADICTION`.

## Sources and reproduced dependency

The authoritative order is current Git/code, Implementation Order, R5-R1,
R4 AuthorityResolution contracts/materialization, BootstrapTenant R3 and its
repairs, current audit Foundation, Tenant Bootstrap Store, all writer callers,
and tests only as evidence.

Current Tenant audit invocation is:

```text
canonical input.actor: Platform Admin, tenantId = null
authority passed to writer: { ...input.actor, tenantId: targetTenantId }
legacy routing: authority.tenantId selects the Tenant audit root
```

The copied object is not a canonical AuthorityResolution. Runtime validation
rejects it because a Platform Admin is platform-scoped and must retain
`tenantId = null`.

The R5-R1 Foundation contract requires:

```text
authority = input.actor
destination = { kind: "tenant", tenantId: targetTenantId }
```

The authority is then valid and unchanged; destination alone selects the Tenant
root and supplies persisted `AuditEvent.tenantId`.

There is no safe third route:

| Alternative | Rejection |
| --- | --- |
| optional destination | permits an ambiguous state and incomplete migration |
| fallback to `authority.tenantId` | preserves the dual-purpose field and invalid actor routing |
| legacy overload | retains the unsafe contract under another entry point |
| synthetic AuthorityResolution | violates the closed runtime authority union |
| writer auto-repair | fabricates actor authority and hides caller defects |
| `resourceId` routing | conflates resource identity with Tenant destination and fails for subordinate resources |
| compatibility shim | creates two routing authorities and prevents fail-closed cutover |

## Scope classification

Changing only the Tenant audit invocation from synthetic authority to canonical
authority plus explicit Tenant destination is category **D: mechanical caller
adaptation required by the Foundation API cutover**.

It is not a new business rule, authorization rule, persisted schema semantic or
independent orchestration change. Published contracts already require the
canonical Platform Admin actor, a Tenant-history audit at the target Tenant
root, the same resource/operation/result/metadata, and atomic creation with the
aggregate. The migration merely represents those existing facts without using
authority as routing metadata.

The adaptation simultaneously removes the observed BootstrapTenant defect, but
that consequence does not make it scope drift. An API that removes an unsafe
implicit argument cannot be published while a production caller continues to
depend on it. API change plus required caller migration is one atomic cutover.

## Strategy decision

### Strategy A — selected

R5-R2 materializes the Foundation destination union, exact validation,
AuthorityResolution validation, coherence matrix, destination-only routing and
event Tenant derivation. It migrates every writer caller in the same technical
commit.

Advantages:

- repository remains compiling and contract-valid at every published commit;
- no temporary fallback or second routing authority;
- minimal roadmap alteration and complete historical trace;
- R5 retains a distinct independent verification responsibility.

### Strategy B — rejected

Merging R5-R2 and R5 would obscure the separation between shared Foundation
materialization and BootstrapTenant-specific evidence. It is unnecessary
because the caller adaptation is precisely bounded and mechanical, while R5 can
remain a review/characterization gate after publication.

## Exact R5-R2 boundary

R5-R2 may:

- modify the audit writer and narrow Foundation destination types/helpers;
- add exact destination and authority/destination runtime validation;
- remove all routing derived from `authority.tenantId` and all legacy fallback;
- migrate every writer caller to an explicit destination;
- change `TenantBootstrapTransactionStore` only at its two audit invocations:
  the Tenant event uses canonical `input.actor` plus Tenant destination, and the
  platform event uses canonical `input.actor` plus platform destination;
- update Foundation and caller tests strictly required by the API cutover;
- demonstrate compilation, Foundation behavior and canonical BootstrapTenant
  audit attribution.

R5-R2 may not change BootstrapTenant payload, actor resolution, capability
checks, authorization, result, command/replay/collision semantics, transaction
topology, Tenant aggregate, Membership, MembershipKey, AuthorityState, audit
operation/resource/result/allowlists, or any unrelated defect.

The allowed Tenant Store change is exactly:

```text
before:
  authority = { ...input.actor, tenantId: input.tenantId }

after:
  authority = input.actor
  destination = { kind: "tenant", tenantId: input.tenantId }
```

No other Tenant Store line is authorized by this reconciliation.

## Caller inventory

| Caller | Authority family | Destination | Migration | Behavior change |
| --- | --- | --- | --- | --- |
| BootstrapPlatformAdmins | system/platform_system | platform | add explicit platform destination | none |
| PlatformCommandTransactionStore | Platform Admin or approved platform system authority supplied by command | platform | add/bind explicit platform destination | none |
| TenantBootstrapTransactionStore Tenant event | human Platform Admin | target Tenant | replace synthetic authority with canonical actor and add Tenant destination | representation repaired; business behavior unchanged |
| TenantBootstrapTransactionStore platform event | human Platform Admin | platform | add platform destination | none |
| Foundation tests/helpers | fixture-dependent | explicit fixture destination | mechanical test API migration | none |

There are no ambiguous production callers. `resourceType` and `resourceId` do
not participate in routing.

## R5 responsibility after cutover

R5 becomes a BootstrapTenant-specific repair review and regression
characterization. It must independently prove that
`BOOTSTRAP_TENANT_TENANT_AUDIT_AUTHORITY_SCOPE_INVALID` is closed and execute
the full BootstrapTenant unit/Emulator matrix for zero-write rejection, replay,
contention, retry, audit attribution and aggregate invariants. It must not
reimplement the caller migration. Any additional BootstrapTenant source change
requires STOP and separate classification.

## Package, schema and infrastructure

- `@mipymetic/saas-contracts` remains `0.14.0`.
- AuthorityResolution is unchanged.
- AuditEvent remains exact schema v1.
- No persisted-data migration or compatibility fallback exists.
- Rules, indexes, Storage and Firebase configuration remain unchanged.

The migration grants no permissions. Destination conveys location only;
canonical authority remains the actor attribution, command policy remains the
authorization boundary, and resource target cannot alter actor scope.

## Future commit topology

R5-R2 must use one technical commit containing Foundation API plus every
required caller migration. Splitting it into an uncompilable Foundation commit
and later caller repair is forbidden. A separate documentation commit records
R5-R2. After publication, R5 performs the specific review described above.

## Roadmap

The previous R5-R2 STOP was correct: its original wording prohibited the only
mechanical migration necessary to publish the API safely. This resolution
corrects sequencing, not R5-R1 semantics.

```text
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5-R2 = ready_for_joint_foundation_and_required_callsite_cutover_after_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R5_R2_cutover_then_specific_review
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress_blocked_pending_BootstrapTenant_revalidation
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

After human review and push, resume the same
`SaaS-03B-D-R3-C1-R5-R2 — Audit Destination Scope Foundation Materialization`
under the reconciled atomic-cutover scope. No new identifier is required.
