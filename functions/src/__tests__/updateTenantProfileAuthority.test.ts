import assert from "node:assert/strict";
import test from "node:test";
import { validateAuthorityResolution } from "@mipymetic/saas-contracts/authority";
import { CAPABILITY_IDS, MEMBERSHIP_ROLES, ROLE_CAPABILITY_MATRIX } from "@mipymetic/saas-contracts/domain";
import { BACKEND_ERROR_CODES } from "@mipymetic/saas-contracts/errors";
import {
  encodeMembershipUidKey,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  tenantDocumentPath,
} from "@mipymetic/saas-contracts/persistence";
import { resolveUpdateTenantProfileAuthority } from "../authorization/updateTenantProfileAuthority.js";
import type { AuthenticatedActor, JsonValue } from "../contracts/types.js";
import { BackendError } from "../errors/backendError.js";
import type { AuthoritativeReaderPort, DocumentSnapshotPort } from "../persistence/ports.js";

const now = "2026-08-14T12:00:00.000Z";
const tenantId = "tenant-1";
const uid = "admin-1";
const membershipId = "membership-1";
const uidKey = encodeMembershipUidKey(uid);

class MemoryReader implements AuthoritativeReaderPort {
  readonly docs = new Map<string, Readonly<Record<string, unknown>>>();
  readonly reads: string[] = [];

  async read(path: string): Promise<DocumentSnapshotPort> {
    this.reads.push(path);
    const data = this.docs.get(path);
    return Object.freeze({
      exists: data !== undefined,
      data: (data ?? null) as Readonly<Record<string, JsonValue>> | null,
    });
  }
}

const actor = Object.freeze({ uid }) as AuthenticatedActor;

const tenant = (overrides: Readonly<Record<string, unknown>> = {}) => ({
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
  ...overrides,
});

const membershipKey = (overrides: Readonly<Record<string, unknown>> = {}) => ({
  tenantId,
  uid,
  membershipId,
  status: "approved",
  originRequestId: null,
  updatedAt: now,
  ...overrides,
});

const membership = (overrides: Readonly<Record<string, unknown>> = {}) => ({
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
  ...overrides,
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
  reader.docs.set(membershipKeyDocumentPath(tenantId, uidKey), membershipKey());
  reader.docs.set(membershipDocumentPath(tenantId, membershipId), membership());
  return reader;
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

test("UpdateTenantProfile resolves exact tenant_admin authority through MembershipKey", async () => {
  const reader = setup();

  const resolution = await resolveUpdateTenantProfileAuthority(reader, actor, tenantId);

  assert.equal(resolution.actorUid, uid);
  assert.equal(resolution.actorType, "identity");
  assert.equal(resolution.authority, MEMBERSHIP_ROLES.TENANT_ADMIN);
  assert.equal(resolution.tenantId, tenantId);
  assert.deepEqual(resolution.roles, [MEMBERSHIP_ROLES.TENANT_ADMIN]);
  assert.deepEqual(
    resolution.capabilities,
    ROLE_CAPABILITY_MATRIX.membershipRoles.tenant_admin,
  );
  assert.equal(resolution.capabilities.includes(CAPABILITY_IDS.TENANT_UPDATE), true);
  assert.equal(validateAuthorityResolution(resolution).ok, true);

  assert.deepEqual(reader.reads, [
    identityDocumentPath(uid),
    tenantDocumentPath(tenantId),
    membershipKeyDocumentPath(tenantId, uidKey),
    membershipDocumentPath(tenantId, membershipId),
  ]);
});

test("UpdateTenantProfile authority returns NOT_FOUND for missing Tenant", async () => {
  const reader = setup();
  reader.docs.delete(tenantDocumentPath(tenantId));

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.NOT_FOUND,
  );
});

test("UpdateTenantProfile authority rejects malformed Tenant as CONTRACT_VIOLATION", async () => {
  const reader = setup();
  reader.docs.set(tenantDocumentPath(tenantId), { bad: true });

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );
});

test("UpdateTenantProfile authority rejects non-active Tenant", async () => {
  const reader = setup();
  reader.docs.set(tenantDocumentPath(tenantId), tenant({
    status: "suspended",
    suspendedAt: now,
  }));

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FAILED_PRECONDITION,
  );
});

test("UpdateTenantProfile authority rejects missing MembershipKey", async () => {
  const reader = setup();
  reader.docs.delete(membershipKeyDocumentPath(tenantId, uidKey));

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );
});

test("UpdateTenantProfile authority rejects malformed MembershipKey", async () => {
  const reader = setup();
  reader.docs.set(membershipKeyDocumentPath(tenantId, uidKey), { bad: true });

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );
});

test("UpdateTenantProfile authority rejects suspended MembershipKey", async () => {
  const reader = setup();
  reader.docs.set(
    membershipKeyDocumentPath(tenantId, uidKey),
    membershipKey({ status: "suspended" }),
  );

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );
});

test("UpdateTenantProfile authority rejects missing authoritative Membership", async () => {
  const reader = setup();
  reader.docs.delete(membershipDocumentPath(tenantId, membershipId));

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );
});

test("UpdateTenantProfile authority rejects malformed Membership", async () => {
  const reader = setup();
  reader.docs.set(membershipDocumentPath(tenantId, membershipId), { bad: true });

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.CONTRACT_VIOLATION,
  );
});

test("UpdateTenantProfile authority rejects incoherent MembershipKey and Membership", async () => {
  const mutations = [
    { uid: "foreign-user" },
    { tenantId: "foreign-tenant" },
    { membershipId: "foreign-membership" },
    { status: "suspended", suspendedAt: now },
    { originRequestId: "request-1" },
  ];

  for (const mutation of mutations) {
    const reader = setup();
    reader.docs.set(
      membershipDocumentPath(tenantId, membershipId),
      membership(mutation),
    );

    await rejectsCode(
      resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
      BACKEND_ERROR_CODES.FORBIDDEN,
    );
  }
});

test("UpdateTenantProfile authority rejects non-tenant_admin Membership", async () => {
  for (const role of ["teacher", "student"]) {
    const reader = setup();
    reader.docs.set(
      membershipDocumentPath(tenantId, membershipId),
      membership({ role }),
    );

    await rejectsCode(
      resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
      BACKEND_ERROR_CODES.FORBIDDEN,
    );
  }
});
test("UpdateTenantProfile authority requires persisted Identity", async () => {
  const reader = setup();
  reader.docs.delete(identityDocumentPath(uid));

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FAILED_PRECONDITION,
  );
});

test("UpdateTenantProfile authority rejects incoherent persisted Identity", async () => {
  const reader = setup();
  reader.docs.set(identityDocumentPath(uid), {
    uid: "foreign-user",
  });

  await rejectsCode(
    resolveUpdateTenantProfileAuthority(reader, actor, tenantId),
    BACKEND_ERROR_CODES.FORBIDDEN,
  );
});
