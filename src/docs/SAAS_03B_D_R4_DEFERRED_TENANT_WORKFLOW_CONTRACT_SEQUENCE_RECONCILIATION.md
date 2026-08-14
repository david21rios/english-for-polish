# SaaS-03B-D-R4 - Deferred Tenant Workflow Contract and Sequence Reconciliation

## Decision

**RESULT A - the deferred Tenant workflow family is authorized and must remain an ordered sequence.**

This phase is documentation-only. It does not implement any Tenant business command,
change package code, modify Functions, alter Firestore Rules or indexes, use Firebase
remote services, or deploy.

The published SaaS-03B-D-R1 reconciliation assigned exactly seven phase-D workflows:

1. BootstrapTenant
2. UpdateTenantProfile
3. UpdateTenantSettings
4. UpdateTenantBranding
5. SuspendTenant
6. RestoreTenant
7. ArchiveTenant

BootstrapTenant and its complete independent repair/revalidation lineage are now closed.
The remaining six workflows are authorized but remain blocked until their exact command
contracts are normatively closed.

## Authoritative sequence

R1 already separated the remaining work into two different families:

```text
Family A - Tenant update/configuration sequence
1. UpdateTenantProfile
2. UpdateTenantSettings
3. UpdateTenantBranding

Family B - Tenant lifecycle sequence
4. SuspendTenant
5. RestoreTenant
6. ArchiveTenant
```

The two families must not be collapsed into one generic command implementation because
they differ in actor authority, capability scope, persistence roots, mutable fields,
idempotency behavior, concurrency and audit level.

The update family must complete before the lifecycle family begins.

## Common authoritative boundary

All six commands retain the shared Phase-D requirements:

- exact allowlisted input objects;
- package-owned identifier validation before path construction;
- authenticated server-derived actor authority;
- persisted snapshot normalization plus runtime validation;
- server-owned timestamps only;
- immutable commandId, correlationId and canonical payload hash;
- command schema v2;
- atomic audit with authoritative Firestore writes;
- transaction reads before writes;
- no Auth, network, randomness or authoritative process-clock values inside transactions;
- exact succeeded replay binding;
- payload/correlation mismatch fails as conflict;
- generic seven-field result shape unless a later command-specific resolution proves otherwise;
- no new command stage is authorized by this reconciliation.

## UpdateTenantProfile

Actor and authority:
- authenticated Identity;
- approved same-Tenant tenant_admin;
- active Tenant;
- capability tenant.update.

Mutable fields:
- displayName;
- shortName;
- country;
- locale;
- timezone.

Forbidden fields include tenantId, tenantType, status, lifecycle timestamps, server-owned
fields, authority fields and unknown fields.

Semantics:
- field-scoped patch only;
- never replace the whole Tenant from a stale client snapshot;
- one Firestore transaction;
- writes Tenant patch, Command and Tenant audit;
- Privileged audit;
- same-Tenant only.

The implementation phase must close the exact payload shape, optionality/nullability,
update-token/version binding, replay semantics, audit allowlists, resourceType and
exhaustive error mapping before technical implementation.

## UpdateTenantSettings

Actor and authority:
- authenticated Identity;
- approved same-Tenant tenant_admin;
- capability tenant.manage_settings.

Target:
- fixed Tenant settings/configuration root;
- Tenant must exist and must not be archived.

Semantics:
- one Firestore transaction;
- transaction/CAS behavior;
- tenantId remains immutable;
- server-owned fields and unknown fields forbidden;
- writes Settings, Command and Tenant audit;
- Privileged audit.

The implementation phase must close exact payload fields, merge-versus-replace semantics,
CAS/version binding, replay semantics, audit allowlists, resourceType and exhaustive
error mapping before implementation.

## UpdateTenantBranding

Actor and authority:
- authenticated Identity;
- approved same-Tenant tenant_admin;
- capability tenant.manage_branding.

Target:
- fixed Tenant branding root;
- Tenant must exist and must not be archived.

Semantics:
- composed branding replacement within the Tenant-owned root;
- tenantId and server-owned fields remain immutable;
- invalid external references fail closed;
- one Firestore transaction;
- transaction/CAS behavior;
- writes Branding, Command and Tenant audit;
- Privileged audit.

The implementation phase must close exact branding payload shape, replacement semantics,
CAS/version binding, replay semantics, audit allowlists, resourceType and exhaustive
error mapping before implementation.

## SuspendTenant

Actor and authority:
- active Platform Admin;
- capability platform.tenant_suspend.

Transition:
- active -> suspended;
- archived is forbidden;
- no Membership, Course or Enrollment child rewrite.

Semantics:
- one Firestore transaction;
- writes Tenant lifecycle fields, Command and audits;
- Critical audit;
- concurrency with RestoreTenant must serialize on Tenant reread;
- losing command performs zero business writes.

The implementation phase must close exact payload, repeat semantics for an already
suspended Tenant, audit allowlists, result resourceType and exhaustive error mapping.

## RestoreTenant

Actor and authority:
- active Platform Admin;
- capability platform.tenant_restore.

Transition:
- suspended -> active;
- archived is terminal and forbidden;
- no child cascade.

Semantics:
- one Firestore transaction;
- writes Tenant lifecycle fields, Command and audits;
- Critical audit;
- restore/archive and suspend/restore contention serialize on Tenant reread;
- losing command performs zero business writes.

The implementation phase must close exact payload, repeat semantics for an already active
Tenant, audit allowlists, result resourceType and exhaustive error mapping.

## ArchiveTenant

Actor and authority:
- active Platform Admin;
- capability platform.tenant_archive.

Transition:
- active or suspended -> archived;
- archived is terminal;
- no document deletion or child rewrite.

Semantics:
- one Firestore transaction;
- writes Tenant lifecycle fields, Command and audits;
- Critical audit;
- archive/restore contention serializes on Tenant reread;
- archived winner remains terminal;
- losing command performs zero business writes.

The implementation phase must close exact payload, repeat semantics for an already
archived Tenant, audit allowlists, result resourceType and exhaustive error mapping.

## Infrastructure boundary

No implementation prerequisite change is authorized for:

- firestore.rules;
- firestore.indexes.json;
- storage.rules;
- firebase.json;
- .firebaserc;
- src/firebase.js.

Firestore Rules regression remains mandatory during each executable command review.
A later Rules change requires a separately demonstrated client-semantic need.

## Sequence decision

The next executable family is the update family.

The minimum next phase after publication of R4 is the contract/materialization gate for
UpdateTenantProfile. UpdateTenantSettings and UpdateTenantBranding remain blocked behind
that sequence. Lifecycle commands remain blocked until the three update commands are
closed and independently reviewed.

No technical implementation identifier beyond R4 is assigned by this document unless
the implementation roadmap can derive it unambiguously after publication.

## Roadmap state

```text
SaaS-03B-D-R1 = completed
SaaS-03B-D-R2 = completed
SaaS-03B-D-R3 = implemented_and_validated
SaaS-03B-D-R3-C1 = completed
SaaS-03B-D-R4 = completed_pending_human_review_and_push
BootstrapTenant = independently_validated
UpdateTenantProfile = blocked_pending_exact_contract_materialization_after_R4_push
UpdateTenantSettings = blocked_pending_UpdateTenantProfile_sequence
UpdateTenantBranding = blocked_pending_UpdateTenantSettings_sequence
SuspendTenant = blocked_pending_update_family_completion
RestoreTenant = blocked_pending_update_family_completion
ArchiveTenant = blocked_pending_update_family_completion
SaaS-03B-D = in_progress_ordered_deferred_workflows
SaaS-03B-E = blocked_pending_03B_D
SaaS-03B-F = blocked_pending_previous_sequence
Phase 4 = not_started
```

## Next gate

After human review and publication, inspect the authoritative contracts required to
materialize UpdateTenantProfile. Do not implement UpdateTenantSettings,
UpdateTenantBranding or any lifecycle command before UpdateTenantProfile has completed
its own contract/materialization/independent-review sequence.