# SaaS-02C.2H — No-Storage gate reconciliation

## Purpose

This phase reconciles the generic Phase 02 roadmap with the approved current
SaaS architecture. It is documentation-only and does not start 03A.

## Contradiction and evidence

The generic Phase 02 section of `IMPLEMENTATION_ORDER_SAAS_MULTI_TENANT.md`
listed `storage.rules`, Storage tests, tenant-aware Storage and Storage emulator
coverage as acceptance requirements. Later approved architecture and runtime
evidence established a Firestore-only release:

- no Aggregate Root or Persistence Root owns binary media;
- the physical and logical models describe visual fields as external URLs;
- the Storage security review gate remains not ready and explicitly does not
  block Firestore scope;
- the canonical 201-case Firestore suite passed without Storage or Auth;
- `storage.rules` remains deny-all;
- `uploadAudio` is residual legacy code tracked by FLH-007.

The old Phase 02 Storage requirements are preserved as historical intent and
classified `superseded_for_current_no_storage_release`.

## Normative decision

```text
CURRENT_SAAS_STORAGE_POLICY = NO_STORAGE
Firebase Storage = outside current SaaS scope
Binary uploads = prohibited
Media aggregate = absent
Storage repository = absent
Storage paths = absent
Storage Emulator = excluded
Storage Rules implementation = excluded
storage.rules = deny-all
```

URL fields do not authorize uploads:

- `Identity.photoURL`: external identity/provider URL or `null`;
- `TenantBranding.logoUrl`: external URL or `null`;
- `TenantBranding.faviconUrl`: external URL or `null`;
- `TenantSettings.supportUrl`: external HTTPS URL or `null` when used.

`uploadAudio` is a residual legacy dependency, is not part of SaaS, does not
block 03A and remains scheduled for removal only after consumer retirement.
No existing legacy consumer is changed by this decision.

Any future binary-storage capability requires an independent architecture
phase covering aggregate ownership, lifecycle, paths, Rules, emulator tests,
retention, migration and rollback.

## Reconciled Phase 02 gate

For the current release, Phase 02 is complete when all of the following are
closed:

1. frozen domain and logical persistence;
2. Firestore physical topology;
3. Access Patterns and Query Contracts;
4. write authority and concurrency boundaries;
5. Firestore Rules design and local implementation;
6. legacy/SaaS compatibility;
7. static Rules suite and count reconciliation;
8. Firestore Emulator runtime validation;
9. final documentary closure.

Storage architecture, paths, Rules implementation, emulator and binary tests
are explicitly excluded from this release gate. The approved evidence satisfies
all nine included gates: Domain 1.2.0 is frozen, the security review is approved,
the 201 tests passed, legacy compatibility is preserved and SaaS-02C.2G closed.

```text
Phase 02 current no-storage scope = completed
SaaS-02C.2G = completed
SaaS-02C.2H = completed
SaaS-02C.2H-C1 = completed_pending_human_push
03A = ready_not_started
04 = blocked_by_03A
06 = blocked_by_previous_phases
```

## Invariants

The expand → shadow → migrate → verify → enforce → contract strategy remains.
No Rule, index, Firebase configuration, domain file, test, service, component,
repository, migration, remote resource, deployment or legacy path changed.

## Decision

The former Storage-only blocker is resolved for the current no-Storage release.
No other documented prerequisite blocks 03A. The human review of this
reconciliation is approved; 03A remains ready and has not started.
