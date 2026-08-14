import assert from "node:assert/strict";
import test from "node:test";
import { ROLE_CAPABILITY_MATRIX } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  tenantDocumentPath,
} from "@mipymetic/saas-contracts/persistence";
import {
  executeUpdateTenantProfile,
  parseUpdateTenantProfileInput,
  type UpdateTenantProfileDependencies,
} from "../commands/updateTenantProfile.js";
import type { AuthorityResolution, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import { canonicalPayloadHash } from "../idempotency/payloadHash.js";
import type {
  AuthoritativeReaderPort,
  DocumentSnapshotPort,
} from "../persistence/ports.js";
import type {
  UpdateTenantProfileTransactionInput,
  UpdateTenantProfileTransactionStore,
} from "../persistence/updateTenantProfileTransactionStore.js";

const now = "2026-08-14T12:00:00.000Z";
const tenantId = "tenant-1";
const uid = "admin-1";
const membershipId = "membership-1";
const uidKey = encodeMembershipUidKey(uid);

class MemoryReader implements AuthoritativeReaderPort {
  readonly docs = new Map<string, Readonly<Record<string, unknown>>>();

  async read(path: string): Promise<DocumentSnapshotPort> {
    const data = this.docs.get(path);
    return Object.freeze({
      exists: data !== undefined,
      data: (data ?? null) as Readonly<Record<string, JsonValue>> | null,
    });
  }
}

class CapturingStore implements UpdateTenantProfileTransactionStore {
  readonly calls: UpdateTenantProfileTransactionInput[] = [];
  replayed = false;

  async execute(
    input: UpdateTenantProfileTransactionInput,
  ): Promise<Readonly<{ replayed: boolean }>> {
    this.calls.push(input);
    return Object.freeze({ replayed: this.replayed });
  }
}

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

const input = () => ({
  commandId: "update-profile-1",
  correlationId: "correlation-1",
  tenantId,
  patch: {
    displayName: "Updated Tenant",
    locale: "en-GB",
  },
});

const setup = () => {
  const reader = new MemoryReader();
  reader.docs.set(identityDocumentPath(uid), {
    uid,
    email: "admin-1@example.com",
    displayName: "Admin",
    photoURL: null,
    emailVerified: true,
    interfaceLocale: "en",
    createdAt: now,
    updatedAt: now,
  });
  reader.docs.set(tenantDocumentPath(tenantId), tenant());
  reader.docs.set(
    membershipKeyDocumentPath(tenantId, uidKey),
    membershipKey(),
  );
  reader.docs.set(
    membershipDocumentPath(tenantId, membershipId),
    membership(),
  );

  const store = new CapturingStore();

  const dependencies: UpdateTenantProfileDependencies = {
    authContext: {
      uid,
      token: { email_verified: true },
    },
    reader,
    store,
  };

  return { reader, store, dependencies };
};

const rejectsCode = async (
  promise: Promise<unknown>,
  code: string,
): Promise<void> => {
  await assert.rejects(
    promise,
    (error: unknown) =>
      error instanceof BackendError && error.code === code,
  );
};

test("UpdateTenantProfile parser accepts exact shared input", () => {
  assert.deepEqual(parseUpdateTenantProfileInput(input()), input());
});

test("UpdateTenantProfile parser rejects malformed or forbidden input", () => {
  for (const value of [
    { ...input(), extra: true },
    { ...input(), commandId: "../bad" },
    { ...input(), correlationId: "../bad" },
    { ...input(), tenantId: "../bad" },
    { ...input(), patch: {} },
    { ...input(), patch: { status: "archived" } },
    { ...input(), patch: { country: "pl" } },
  ]) {
    assert.throws(
      () => parseUpdateTenantProfileInput(value),
      (error: unknown) =>
        error instanceof BackendError
        && error.code === BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    );
  }
});

test("UpdateTenantProfile requires authenticated actor", async () => {
  const { reader, store } = setup();

  await rejectsCode(
    executeUpdateTenantProfile(input(), {
      authContext: null,
      reader,
      store,
    }),
    BACKEND_ERROR_CODES.UNAUTHENTICATED,
  );

  assert.equal(store.calls.length, 0);
});

test("UpdateTenantProfile resolves tenant_admin authority and delegates exact transaction input", async () => {
  const { store, dependencies } = setup();

  const result = await executeUpdateTenantProfile(input(), dependencies);

  assert.deepEqual(result, {
    commandId: "update-profile-1",
    correlationId: "correlation-1",
    operation: "UpdateTenantProfile",
    resourceType: "tenant",
    resourceId: tenantId,
    status: "succeeded",
    replayed: false,
  });

  assert.equal(store.calls.length, 1);

  const call = store.calls[0]!;

  assert.equal(call.commandId, "update-profile-1");
  assert.equal(call.correlationId, "correlation-1");
  assert.equal(call.tenantId, tenantId);
  assert.deepEqual(call.patch, input().patch);

  const authority = call.actor as AuthorityResolution;
  assert.equal(authority.actorUid, uid);
  assert.equal(authority.actorType, "identity");
  assert.equal(authority.authority, "tenant_admin");
  assert.equal(authority.tenantId, tenantId);
  assert.deepEqual(authority.roles, ["tenant_admin"]);
  assert.deepEqual(
    authority.capabilities,
    ROLE_CAPABILITY_MATRIX.membershipRoles.tenant_admin,
  );

  assert.deepEqual(call.result, {
    commandId: "update-profile-1",
    correlationId: "correlation-1",
    operation: "UpdateTenantProfile",
    resourceType: "tenant",
    resourceId: tenantId,
    status: "succeeded",
    replayed: false,
  });
});

test("UpdateTenantProfile payload hash uses only behavioral tenantId and patch", async () => {
  const { store, dependencies } = setup();

  await executeUpdateTenantProfile(input(), dependencies);

  const expected = canonicalPayloadHash(
    "UpdateTenantProfile",
    {
      tenantId,
      patch: input().patch,
    },
  );

  assert.equal(store.calls[0]!.payloadHash, expected);
});

test("UpdateTenantProfile commandId and correlationId do not change behavioral hash", async () => {
  const first = setup();
  const second = setup();

  await executeUpdateTenantProfile(input(), first.dependencies);

  await executeUpdateTenantProfile({
    ...input(),
    commandId: "update-profile-2",
    correlationId: "correlation-2",
  }, second.dependencies);

  assert.equal(
    first.store.calls[0]!.payloadHash,
    second.store.calls[0]!.payloadHash,
  );
});

test("UpdateTenantProfile patch changes behavioral hash", async () => {
  const first = setup();
  const second = setup();

  await executeUpdateTenantProfile(input(), first.dependencies);

  await executeUpdateTenantProfile({
    ...input(),
    patch: { displayName: "Different Tenant" },
  }, second.dependencies);

  assert.notEqual(
    first.store.calls[0]!.payloadHash,
    second.store.calls[0]!.payloadHash,
  );
});

test("UpdateTenantProfile propagates replay outcome without changing persisted stable result", async () => {
  const { store, dependencies } = setup();
  store.replayed = true;

  const result = await executeUpdateTenantProfile(input(), dependencies);

  assert.equal(result.replayed, true);
  assert.equal(store.calls.length, 1);
  assert.equal(
    (store.calls[0]!.result as Readonly<Record<string, unknown>>).replayed,
    false,
  );
});

test("UpdateTenantProfile authority failure prevents store execution", async () => {
  const { reader, store, dependencies } = setup();

  reader.docs.set(
    membershipDocumentPath(tenantId, membershipId),
    { ...membership(), role: "teacher" },
  );

  await rejectsCode(
    executeUpdateTenantProfile(input(), dependencies),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );

  assert.equal(store.calls.length, 0);
});
