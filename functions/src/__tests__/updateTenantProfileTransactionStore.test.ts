import assert from "node:assert/strict";
import test from "node:test";
import { ROLE_CAPABILITY_MATRIX } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  privilegedCommandDocumentPath,
  tenantAuditEventDocumentPath,
  tenantDocumentPath,
} from "@mipymetic/saas-contracts/persistence";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import {
  createUpdateTenantProfileTransactionStore,
  type UpdateTenantProfileTransactionInput,
} from "../persistence/updateTenantProfileTransactionStore.js";
import {
  type DocumentSnapshotPort,
  type TransactionPort,
  type TransactionRunnerPort,
} from "../persistence/ports.js";

const now = "2026-08-14T12:00:00.000Z";
const tenantId = "tenant-1";
const uid = "admin-1";
const membershipId = "membership-1";
const commandId = "update-profile-1";
const correlationId = "correlation-1";
const uidKey = encodeMembershipUidKey(uid);

class Memory implements TransactionRunnerPort, TransactionPort {
  readonly docs = new Map<string, Readonly<Record<string, unknown>>>();
  readonly creates: string[] = [];
  readonly updates: string[] = [];

  async run<T>(
    operation: (transaction: TransactionPort) => Promise<T>,
  ): Promise<T> {
    return operation(this);
  }

  async get(path: string): Promise<DocumentSnapshotPort> {
    const data = this.docs.get(path);
    return Object.freeze({
      exists: data !== undefined,
      data: (data ?? null) as Readonly<Record<string, JsonValue>> | null,
    });
  }

  create(path: string, data: Readonly<Record<string, unknown>>): void {
    if (this.docs.has(path)) throw new Error("exists");
    this.creates.push(path);
    this.docs.set(path, data);
  }

  set(path: string, data: Readonly<Record<string, unknown>>): void {
    this.docs.set(path, data);
  }

  update(path: string, data: Readonly<Record<string, unknown>>): void {
    this.updates.push(path);
    this.docs.set(path, {
      ...(this.docs.get(path) ?? {}),
      ...data,
    });
  }
}

const actor = (): AuthorityResolution => Object.freeze({
  actorUid: uid,
  actorType: "identity",
  authority: "tenant_admin",
  tenantId,
  roles: Object.freeze(["tenant_admin"]),
  capabilities: ROLE_CAPABILITY_MATRIX.membershipRoles.tenant_admin,
});

const tenant = () => ({
  tenantId,
  tenantType: "university",
  displayName: "Tenant",
  shortName: "T",
  country: "PL",
  locale: "pl-PL",
  timezone: "Europe/Warsaw",
  status: "active",
  createdAt: now,
  updatedAt: now,
  suspendedAt: null,
  archivedAt: null,
});

const membershipKey = () => ({
  tenantId,
  uid,
  membershipId,
  status: "approved",
  originRequestId: null,
  updatedAt: now,
});

const membership = () => ({
  membershipId,
  tenantId,
  uid,
  role: "tenant_admin",
  status: "approved",
  originRequestId: null,
  createdAt: now,
  approvedAt: now,
  approvedBy: "platform-admin-1",
  updatedAt: now,
  suspendedAt: null,
  removedAt: null,
});

const stableResult = () => ({
  commandId,
  correlationId,
  operation: "UpdateTenantProfile",
  resourceType: "tenant",
  resourceId: tenantId,
  status: "succeeded",
  replayed: false,
});

const input = (): UpdateTenantProfileTransactionInput => ({
  commandId,
  correlationId,
  payloadHash: "a".repeat(64),
  tenantId,
  patch: Object.freeze({
    displayName: "Updated Tenant",
    locale: "en-GB",
  }),
  actor: actor(),
  result: stableResult(),
});

const setup = (): Memory => {
  const memory = new Memory();
  memory.docs.set(identityDocumentPath(uid), {
    uid,
    email: "admin-1@example.com",
    displayName: "Admin",
    photoURL: null,
    emailVerified: true,
    interfaceLocale: "en",
    createdAt: now,
    updatedAt: now,
  });
  memory.docs.set(tenantDocumentPath(tenantId), tenant());
  memory.docs.set(
    membershipKeyDocumentPath(tenantId, uidKey),
    membershipKey(),
  );
  memory.docs.set(
    membershipDocumentPath(tenantId, membershipId),
    membership(),
  );
  return memory;
};

const rejectsCode = async (
  promise: Promise<unknown>,
  code: string,
): Promise<void> => {
  await assert.rejects(
    promise,
    (error: unknown) => error instanceof BackendError && error.code === code,
  );
};

test("UpdateTenantProfile store updates only profile fields plus updatedAt and writes command plus one Tenant audit", async () => {
  const memory = setup();
  const store = createUpdateTenantProfileTransactionStore(memory);

  const result = await store.execute(input());

  assert.equal(result.replayed, false);
  assert.deepEqual(memory.updates, [tenantDocumentPath(tenantId)]);
  assert.equal(memory.creates.length, 2);

  const persistedTenant = memory.docs.get(tenantDocumentPath(tenantId))!;
  assert.equal(persistedTenant.displayName, "Updated Tenant");
  assert.equal(persistedTenant.locale, "en-GB");
  assert.equal(persistedTenant.tenantType, "university");
  assert.equal(persistedTenant.status, "active");
  assert.equal(persistedTenant.createdAt, now);

  assert.equal(
    memory.docs.has(privilegedCommandDocumentPath(commandId)),
    true,
  );
  assert.equal(
    memory.docs.has(
      tenantAuditEventDocumentPath(tenantId, `${commandId}-tenant-update`),
    ),
    true,
  );
});

test("UpdateTenantProfile audit excludes profile values and Membership identifiers", async () => {
  const memory = setup();
  await createUpdateTenantProfileTransactionStore(memory).execute(input());

  const audit = memory.docs.get(
    tenantAuditEventDocumentPath(tenantId, `${commandId}-tenant-update`),
  )!;

  assert.deepEqual(audit.beforeSummary, { tenantStatus: "active" });
  assert.deepEqual(audit.afterSummary, { tenantStatus: "active" });
  assert.deepEqual(audit.metadata, {
    stage: "completed",
    changedFieldCount: 2,
  });

  const serialized = JSON.stringify(audit);
  for (const forbidden of [
    "Updated Tenant",
    "en-GB",
    membershipId,
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("UpdateTenantProfile store rejects non-active Tenant before writes", async () => {
  const memory = setup();
  memory.docs.set(tenantDocumentPath(tenantId), {
    ...tenant(),
    status: "suspended",
    suspendedAt: now,
  });

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(input()),
    BACKEND_ERROR_CODES.FAILED_PRECONDITION,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});

test("UpdateTenantProfile store rereads and rejects missing MembershipKey before writes", async () => {
  const memory = setup();
  memory.docs.delete(membershipKeyDocumentPath(tenantId, uidKey));

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(input()),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});

test("UpdateTenantProfile store rejects non-tenant_admin Membership before writes", async () => {
  const memory = setup();
  memory.docs.set(
    membershipDocumentPath(tenantId, membershipId),
    { ...membership(), role: "teacher" },
  );

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(input()),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});

test("UpdateTenantProfile store rejects forged authority before reads that can write", async () => {
  const memory = setup();
  const forged = {
    ...input(),
    actor: {
      ...actor(),
      authority: "teacher",
      roles: ["teacher"],
      capabilities: ROLE_CAPABILITY_MATRIX.membershipRoles.teacher,
    } as AuthorityResolution,
  };

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(forged),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});

test("UpdateTenantProfile persisted replay is read-only and returns replayed true", async () => {
  const memory = setup();
  const store = createUpdateTenantProfileTransactionStore(memory);

  await store.execute(input());

  const commandPath = privilegedCommandDocumentPath(commandId);
  const command = memory.docs.get(commandPath)!;

  memory.docs.set(commandPath, {
    ...command,
    startedAt: now,
    completedAt: now,
  });

  memory.creates.length = 0;
  memory.updates.length = 0;

  const replay = await store.execute(input());

  assert.equal(replay.replayed, true);
  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
  assert.equal(
    (memory.docs.get(commandPath)?.result as Readonly<Record<string, unknown>>).replayed,
    false,
  );
});

test("UpdateTenantProfile rejects replay payload or correlation conflict", async () => {
  for (const mutate of [
    (value: UpdateTenantProfileTransactionInput) => ({
      ...value,
      payloadHash: "b".repeat(64),
    }),
    (value: UpdateTenantProfileTransactionInput) => ({
      ...value,
      correlationId: "correlation-other",
    }),
  ]) {
    const memory = setup();
    const store = createUpdateTenantProfileTransactionStore(memory);

    await store.execute(input());

    const commandPath = privilegedCommandDocumentPath(commandId);
    const command = memory.docs.get(commandPath)!;
    memory.docs.set(commandPath, {
      ...command,
      startedAt: now,
      completedAt: now,
    });

    memory.creates.length = 0;
    memory.updates.length = 0;

    await rejectsCode(
      store.execute(mutate(input())),
      BACKEND_ERROR_CODES.CONFLICT,
    );

    assert.equal(memory.creates.length, 0);
    assert.equal(memory.updates.length, 0);
  }
});

test("UpdateTenantProfile rejects malformed persisted replay result", async () => {
  const memory = setup();
  const store = createUpdateTenantProfileTransactionStore(memory);

  await store.execute(input());

  const commandPath = privilegedCommandDocumentPath(commandId);
  const command = memory.docs.get(commandPath)!;

  memory.docs.set(commandPath, {
    ...command,
    startedAt: now,
    completedAt: now,
    result: {
      ...(command.result as Readonly<Record<string, unknown>>),
      replayed: true,
    },
  });

  memory.creates.length = 0;
  memory.updates.length = 0;

  await rejectsCode(
    store.execute(input()),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});
test("UpdateTenantProfile store rejects forbidden patch fields before writes", async () => {
  for (const patch of [
    { status: "archived" },
    { tenantType: "company" },
    { createdAt: now },
    { updatedAt: now },
    { suspendedAt: now },
    { archivedAt: now },
    { membershipId: "membership-2" },
  ]) {
    const memory = setup();

    await rejectsCode(
      createUpdateTenantProfileTransactionStore(memory).execute({
        ...input(),
        patch: patch as Readonly<Record<string, JsonValue>>,
      }),
      BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    );

    assert.equal(memory.creates.length, 0, JSON.stringify(patch));
    assert.equal(memory.updates.length, 0, JSON.stringify(patch));
  }
});

test("UpdateTenantProfile store rejects invalid profile values before writes", async () => {
  for (const patch of [
    { displayName: "" },
    { displayName: " padded " },
    { shortName: "" },
    { country: "pl" },
    { country: "POL" },
    { locale: "not_a_locale" },
    { timezone: "" },
    { timezone: " Europe/Warsaw " },
  ]) {
    const memory = setup();

    await rejectsCode(
      createUpdateTenantProfileTransactionStore(memory).execute({
        ...input(),
        patch: patch as Readonly<Record<string, JsonValue>>,
      }),
      BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
    );

    assert.equal(memory.creates.length, 0, JSON.stringify(patch));
    assert.equal(memory.updates.length, 0, JSON.stringify(patch));
  }
});

test("UpdateTenantProfile store rejects empty patch before writes", async () => {
  const memory = setup();

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute({
      ...input(),
      patch: Object.freeze({}),
    }),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});
test("UpdateTenantProfile store rereads persisted Identity before writes", async () => {
  const memory = setup();
  memory.docs.delete(identityDocumentPath(uid));

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(input()),
    BACKEND_ERROR_CODES.FAILED_PRECONDITION,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});

test("UpdateTenantProfile store rejects incoherent persisted Identity before writes", async () => {
  const memory = setup();
  memory.docs.set(identityDocumentPath(uid), {
    uid: "foreign-user",
  });

  await rejectsCode(
    createUpdateTenantProfileTransactionStore(memory).execute(input()),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );

  assert.equal(memory.creates.length, 0);
  assert.equal(memory.updates.length, 0);
});
