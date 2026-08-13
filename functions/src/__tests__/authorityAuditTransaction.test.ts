import assert from "node:assert/strict";
import test from "node:test";
import { AUDIT_RESULTS } from "@mipymetic/saas-contracts/audit";
import { PLATFORM_AUTHORITY_STATUSES } from "@mipymetic/saas-contracts/authority";
import { CAPABILITY_IDS, MEMBERSHIP_STATUSES, PLATFORM_ROLES, TENANT_STATUSES } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import { identityDocumentPath, membershipDocumentPath, platformAuthorityDocumentPath, tenantDocumentPath } from "@mipymetic/saas-contracts/persistence";
import { writeAuditEvent } from "../audit/auditWriter.js";
import { resolvePlatformAuthority, resolveTenantAuthority } from "../authorization/authorityResolver.js";
import type { AuthenticatedActor, AuthorityResolution, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { isServerOwnedTimestamp, type AuthoritativeReaderPort, type DocumentSnapshotPort, type TransactionPort, type TransactionRunnerPort } from "../persistence/ports.js";
import { externalEffect, runAuthoritativeTransaction } from "../persistence/transactionBoundary.js";

const actor: AuthenticatedActor = Object.freeze({ uid: "actor-1", tokenEmailVerified: true, appCheckVerified: false });
const snapshot = (data: Readonly<Record<string, JsonValue>> | null): DocumentSnapshotPort => Object.freeze({ exists: data !== null, data });

class Reader implements AuthoritativeReaderPort {
  constructor(private readonly values: ReadonlyMap<string, DocumentSnapshotPort>) {}
  async read(path: string): Promise<DocumentSnapshotPort> { return this.values.get(path) ?? snapshot(null); }
}

class Transaction implements TransactionPort {
  readonly creates: Array<Readonly<{ path: string; data: Readonly<Record<string, unknown>> }>> = [];
  async get(): Promise<DocumentSnapshotPort> { return snapshot(null); }
  create(path: string, data: Readonly<Record<string, unknown>>): void { this.creates.push({ path, data }); }
  set(): void {}
  update(): void {}
}

const platformReader = (status: string = PLATFORM_AUTHORITY_STATUSES.ACTIVE, transitionCommandId: string | null = null): Reader => new Reader(new Map([
  [identityDocumentPath(actor.uid), snapshot({ uid: actor.uid })],
  [platformAuthorityDocumentPath(actor.uid), snapshot({ uid: actor.uid, status, authority: PLATFORM_ROLES.PLATFORM_ADMIN, transitionCommandId })],
]));

test("platform authority requires Identity plus active persisted authority", async () => {
  const resolved = await resolvePlatformAuthority(platformReader(), actor);
  assert.equal(resolved.authority, PLATFORM_ROLES.PLATFORM_ADMIN);
  assert.equal(resolved.tenantId, null);
  assert.ok(resolved.capabilities.includes(CAPABILITY_IDS.PLATFORM_TENANT_UPDATE));
  const recovering = await resolvePlatformAuthority(platformReader(PLATFORM_AUTHORITY_STATUSES.ACTIVE, "recover-command"), actor);
  assert.equal(recovering.authority, PLATFORM_ROLES.PLATFORM_ADMIN);
  await assert.rejects(resolvePlatformAuthority(platformReader("inactive"), actor), BackendError);
  await assert.rejects(resolvePlatformAuthority(new Reader(new Map()), actor), BackendError);
});

test("authority resolution rejects missing, malformed and mismatched Identity", async () => {
  const platformAuthority = snapshot({ uid: actor.uid, status: PLATFORM_AUTHORITY_STATUSES.ACTIVE, authority: PLATFORM_ROLES.PLATFORM_ADMIN });
  const invalidIdentities: readonly unknown[] = [null, [], "actor-1", {}, { uid: null }, { uid: 1 }, { uid: "" }, { uid: "   " }, { uid: "other" }];
  for (const identity of invalidIdentities) {
    const values = new Map<string, DocumentSnapshotPort>([
      [identityDocumentPath(actor.uid), snapshot(identity as Readonly<Record<string, JsonValue>> | null)],
      [platformAuthorityDocumentPath(actor.uid), platformAuthority],
    ]);
    await assert.rejects(resolvePlatformAuthority(new Reader(values), actor), BackendError);
  }
  const mismatchedAuthority = new Reader(new Map([
    [identityDocumentPath(actor.uid), snapshot({ uid: actor.uid })],
    [platformAuthorityDocumentPath(actor.uid), snapshot({ uid: "other", status: PLATFORM_AUTHORITY_STATUSES.ACTIVE, authority: PLATFORM_ROLES.PLATFORM_ADMIN })],
  ]));
  await assert.rejects(resolvePlatformAuthority(mismatchedAuthority, actor), BackendError);
});

test("tenant authority binds active Tenant and approved Membership to actor", async () => {
  const reader = new Reader(new Map([
    [identityDocumentPath(actor.uid), snapshot({ uid: actor.uid })],
    [tenantDocumentPath("tenant-1"), snapshot({ tenantId: "tenant-1", status: TENANT_STATUSES.ACTIVE })],
    [membershipDocumentPath("tenant-1", "membership-1"), snapshot({ membershipId: "membership-1", uid: actor.uid, tenantId: "tenant-1", status: MEMBERSHIP_STATUSES.APPROVED, role: "tenant_admin" })],
  ]));
  const resolved = await resolveTenantAuthority(reader, actor, "tenant-1", "membership-1");
  assert.equal(resolved.authority, "tenant_admin");
  assert.ok(resolved.capabilities.includes(CAPABILITY_IDS.TENANT_UPDATE));
  await assert.rejects(resolveTenantAuthority(reader, actor, "tenant-2", "membership-1"), BackendError);
});

test("tenant authority rejects missing, foreign, suspended and unknown Memberships", async () => {
  const values = (membership: Readonly<Record<string, JsonValue>> | null): Reader => new Reader(new Map([
    [identityDocumentPath(actor.uid), snapshot({ uid: actor.uid })],
    [tenantDocumentPath("tenant-1"), snapshot({ tenantId: "tenant-1", status: TENANT_STATUSES.ACTIVE })],
    [membershipDocumentPath("tenant-1", "membership-1"), snapshot(membership)],
  ]));
  await assert.rejects(resolveTenantAuthority(values(null), actor, "tenant-1", "membership-1"), BackendError);
  await assert.rejects(resolveTenantAuthority(values({ membershipId: "membership-1", uid: "other", tenantId: "tenant-1", status: MEMBERSHIP_STATUSES.APPROVED, role: "student" }), actor, "tenant-1", "membership-1"), BackendError);
  await assert.rejects(resolveTenantAuthority(values({ membershipId: "membership-1", uid: actor.uid, tenantId: "other", status: MEMBERSHIP_STATUSES.APPROVED, role: "student" }), actor, "tenant-1", "membership-1"), BackendError);
  await assert.rejects(resolveTenantAuthority(values({ membershipId: "membership-1", uid: actor.uid, tenantId: "tenant-1", status: MEMBERSHIP_STATUSES.SUSPENDED, role: "student" }), actor, "tenant-1", "membership-1"), BackendError);
  await assert.rejects(resolveTenantAuthority(values({ membershipId: "membership-1", uid: actor.uid, tenantId: "tenant-1", status: MEMBERSHIP_STATUSES.APPROVED, role: "unknown" }), actor, "tenant-1", "membership-1"), BackendError);
  const coherentMembership = snapshot({ membershipId: "membership-1", uid: actor.uid, tenantId: "tenant-1", status: MEMBERSHIP_STATUSES.APPROVED, role: "student" });
  await assert.rejects(resolveTenantAuthority(new Reader(new Map([
    [identityDocumentPath(actor.uid), snapshot({ uid: "other" })],
    [tenantDocumentPath("tenant-1"), snapshot({ tenantId: "tenant-1", status: TENANT_STATUSES.ACTIVE })],
    [membershipDocumentPath("tenant-1", "membership-1"), coherentMembership],
  ])), actor, "tenant-1", "membership-1"), BackendError);
  await assert.rejects(resolveTenantAuthority(new Reader(new Map([
    [identityDocumentPath(actor.uid), snapshot({ uid: actor.uid })],
    [tenantDocumentPath("tenant-1"), snapshot({ tenantId: "tenant-1", status: TENANT_STATUSES.SUSPENDED })],
    [membershipDocumentPath("tenant-1", "membership-1"), coherentMembership],
  ])), actor, "tenant-1", "membership-1"), BackendError);
});

const tenantAuthority: AuthorityResolution = Object.freeze({ actorUid: actor.uid, actorType: "identity", authority: "tenant_admin", tenantId: "tenant-1", roles: Object.freeze(["tenant_admin"]), capabilities: Object.freeze([]) });

test("audit writer uses tenant and platform roots and exact shared shape", () => {
  const transaction = new Transaction();
  const common = { auditId: "audit-1", commandId: "command-1", correlationId: "correlation-1", level: "privileged" as const, operation: "foundation.test", resourceType: "tenant", resourceId: "tenant-1", result: AUDIT_RESULTS.SUCCEEDED, errorCode: null, beforeSummary: { status: "draft" }, afterSummary: { status: "active" }, metadata: { attempt: 1 } };
  assert.equal(writeAuditEvent(transaction, { ...common, authority: tenantAuthority }), "tenants/tenant-1/auditEvents/audit-1");
  assert.equal(transaction.creates.length, 1);
  assert.equal(isServerOwnedTimestamp(transaction.creates[0]?.data.requestedAt), true);
  assert.equal(isServerOwnedTimestamp(transaction.creates[0]?.data.executedAt), true);
  const platform = Object.freeze({ ...tenantAuthority, actorType: "platform_admin" as const, authority: "platform_admin", tenantId: null });
  assert.equal(writeAuditEvent(transaction, { ...common, authority: platform }), "platformAuditEvents/audit-1");
});

test("audit writer rejects sensitive, nested and oversized data", () => {
  const transaction = new Transaction();
  const base = { auditId: "audit-1", commandId: "command-1", correlationId: "correlation-1", authority: tenantAuthority, level: "critical" as const, operation: "foundation.test", resourceType: "tenant", resourceId: "tenant-1", result: AUDIT_RESULTS.FAILED, errorCode: BACKEND_ERROR_CODES.INTERNAL, beforeSummary: {}, afterSummary: {}, metadata: {} };
  assert.throws(() => writeAuditEvent(transaction, { ...base, metadata: { token: "secret" } }), BackendError);
  assert.throws(() => writeAuditEvent(transaction, { ...base, metadata: { nested: { value: "no" } } }), BackendError);
  assert.throws(() => writeAuditEvent(transaction, { ...base, metadata: { value: "x".repeat(5000) } }), BackendError);
});

test("transaction foundation automatically enforces 19-read and 19-write budgets", async () => {
  const transaction = new Transaction();
  const runner: TransactionRunnerPort = { run: async <T>(operation: (port: TransactionPort) => Promise<T>) => operation(transaction) };
  assert.equal(await runAuthoritativeTransaction(runner, async ({ transaction: port }) => {
    for (let index = 0; index < 19; index += 1) await port.get(`reads/${index}`);
    for (let index = 0; index < 19; index += 1) port.create(`writes/${index}`, {});
    return "ok";
  }), "ok");
  await assert.rejects(runAuthoritativeTransaction(runner, async ({ transaction: port }) => {
    for (let index = 0; index < 20; index += 1) await port.get(`reads/${index}`);
  }), BackendError);
  await assert.rejects(runAuthoritativeTransaction(runner, async ({ transaction: port }) => {
    for (let index = 0; index < 20; index += 1) port.create(`writes/${index}`, {});
  }), BackendError);
  await assert.rejects(externalEffect(), BackendError);
});
