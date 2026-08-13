# SaaS-03B-D-R3-C1-R5-R2 — Audit Destination Scope Foundation Materialization

## Decision

PASS. The R5-R1 contract and R5-R2-R1 Strategy A are materialized as one atomic
Foundation/caller cutover. BootstrapTenant is not independently validated here.

## Materialization

Foundation now exports the exact `AuditDestination` union and a pure,
non-throwing exact-shape validator. Tenant identifiers use the package-owned
document identifier validator without normalization. `writeAuditEvent` requires
an explicit destination, validates canonical AuthorityResolution and destination
at runtime, enforces the closed actor/destination matrix, and fails with
`CONTRACT_VIOLATION` before writes.

Routing and persisted Tenant scope derive exclusively from destination:

```text
platform -> platformAuditEvents/{auditId}; AuditEvent.tenantId = null
tenant T -> tenants/{T}/auditEvents/{auditId}; AuditEvent.tenantId = T
```

No fallback, legacy overload or `authority.tenantId` routing remains. Platform
Admin may use either destination while retaining actor tenant null; Tenant human
authority is same-Tenant only; current system operators are platform-only.
Workflow capability authorization remains outside the writer.

All production callers migrated explicitly. Platform Store and
BootstrapPlatformAdmins use platform destination. Tenant Bootstrap's only
authorized mechanical change replaces synthetic authority with canonical
`input.actor` plus target-Tenant destination; its platform event uses platform
destination. Payload, aggregate, transaction, result, replay, collision and
audit literal semantics are unchanged.

AuditEvent remains exact schema v1 with 20 fields. Package remains
`@mipymetic/saas-contracts@0.14.0`; artifact SHA-256 is
`90347051e17e9ddf2adc22b793c61078f36b1620e2a76a0c11b210a211cb64ad`.
No migration, Rules, index, Storage, Firebase config, Domain, Shared/client, UI,
handler or new command change occurred.

## Evidence

- Functions: 83/83; TypeScript check/build, lint 0/0 and ESM PASS.
- Clean isolated `npm ci`, check, build, 83/83, lint and ESM PASS.
- Node runtime used: 24.15.0; Functions engine remains 22, so no native Node 22
  execution is claimed. TS7016 remains zero; strict/noImplicitAny remain true.
- Package: 57/57 including runtime/type imports, purity, dependency direction,
  cycles and strict consumer.
- Emulator 1.21.0 / Firebase CLI 15.24.0 / Temurin 21.0.12: Store 11/11;
  BootstrapPlatformAdmins, Recover, Revoke and BootstrapTenant suites PASS when
  isolated sequentially. Combined initial execution was discarded because
  cross-suite lock contention produced Emulator lock timeouts. Cleanup ended at
  zero Java processes.
- Runtime prechecks: RegistrationRequest 52/34/18; Membership 81/44/37; Course
  114/32/82; Enrollment 111/42/69.
- Rules deterministic preflight: 222/88/134.
- General tests 35/35; root production build PASS.
- Global clean lint baseline: 13 errors/8 warnings; attributable delta zero.
- Supply chain unchanged: root 25 (3 low/9 moderate/13 high), Functions 7
  moderate. No fix or upgrade performed.
- Protected hashes match published values; no Firebase remote or deploy.

The Foundation unit matrix proves Platform Admin platform/Tenant routing,
tenant_admin/student/teacher same-Tenant routing, both platform system actors,
exact destination rejection, malformed/forged authority rejection and zero
writes on incoherence. Server timestamps, deterministic IDs, TransactionPort
write boundary and audit allowlists remain intact.

## Historical trace and next gate

This cutover closes `SHARED_FOUNDATION_AUDIT_AUTHORITY_DESTINATION_SCOPE_GAP`
and physically removes the cause of
`BOOTSTRAP_TENANT_TENANT_AUDIT_AUTHORITY_SCOPE_INVALID`. It follows the
sequencing correction `R5_R2_SCOPE_DEPENDENCY_CONTRADICTION` and its R5-R2-R1
Strategy A resolution.

After human review and push, run only `SaaS-03B-D-R3-C1-R5 — BootstrapTenant
Tenant Audit Authority Scope Repair / Specific Review`. That phase must provide
independent BootstrapTenant-specific evidence and must not reimplement this
cutover.

```text
SaaS-03B-D-R3-C1-R5-R1 = completed
SaaS-03B-D-R3-C1-R5-R2-R1 = completed
SaaS-03B-D-R3-C1-R5-R2 = completed_pending_human_review_and_push
SaaS-03B-D-R3-C1-R5 = blocked_pending_R5_R2_push_then_specific_review
SaaS-03B-D-R3-C1 = blocked_pending_R5_completion_and_revalidation
BootstrapTenant = implemented_but_not_independently_validated
UpdateTenantProfile/UpdateTenantSettings/UpdateTenantBranding = blocked_pending_contract_resolution
SuspendTenant/RestoreTenant/ArchiveTenant = blocked_pending_contract_resolution
SaaS-03B-D = in_progress
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```
