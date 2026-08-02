import assert from "node:assert/strict";
import test from "node:test";
import { createRegistrationRequestRepository } from "../index.js";
import { serializeRegistrationRequest } from "../registrationRequestSerializer.js";
import { validateRegistrationRequestListOptions } from "../registrationRequestQueries.js";
import {
  REGISTRATION_REQUEST_QUERY_KINDS,
  createRegistrationRequestBinding,
  decodeRegistrationRequestCursor,
  encodeRegistrationRequestCursor
} from "../registrationRequestCursor.js";
import { createSdk, iso, requestData, snapshot, timestamp } from "./testDoubles.mjs";

const db = Object.freeze({ kind: "db" });
const make = (docs = []) => {
  const doubles = createSdk({ getDocsResult: { docs } });
  return { ...doubles, repository: createRegistrationRequestRepository({ db, sdk: doubles.sdk }) };
};

for (const role of ["student", "teacher", "tenant_admin"]) {
  test(`[positive] accepts requestedRole ${role}`, () => {
    assert.equal(serializeRegistrationRequest(snapshot(requestData({ requestedRole: role }))).requestedRole, role);
  });
}

for (const role of ["platform_admin", "platform_system", "trusted_backend", "anonymous", "identity_self", "tenant_member"]) {
  test(`[negative] rejects non-requestable role ${role}`, () => {
    assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ requestedRole: role }))));
  });
}

const invalidLifecycle = [
  ["pending", { reviewedBy: "reviewer" }],
  ["approved", { status: "approved", reviewedAt: timestamp(), reviewedBy: "reviewer", approvedMembershipId: "membership-1", expiredAt: timestamp() }],
  ["rejected", { status: "rejected", reviewedAt: timestamp(), reviewedBy: "reviewer", approvedMembershipId: "membership-1" }],
  ["cancelled", { status: "cancelled", cancelledAt: timestamp(), reviewedAt: timestamp() }],
  ["expired", { status: "expired", expiredAt: timestamp(), cancelledAt: timestamp() }]
];
for (const [status, override] of invalidLifecycle) {
  test(`[negative] rejects incompatible ${status} lifecycle outcome`, () => {
    assert.throws(() => serializeRegistrationRequest(snapshot(requestData(override))));
  });
}

for (const pageSize of [1, 20, 50]) {
  test(`[positive] accepts pageSize ${pageSize}`, () => {
    assert.equal(validateRegistrationRequestListOptions({ pageSize }).pageSize, pageSize);
  });
}
for (const pageSize of [0, -1, 51, 1.5, "20", Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`[negative] rejects pageSize ${String(pageSize)}`, () => {
    assert.throws(() => validateRegistrationRequestListOptions({ pageSize }));
  });
}
for (const options of [[], new Date(), "options", { cursor: "   " }, { uid: "uid-1" }, { tenantId: "tenant-1" }, { orderBy: "requestedAt" }]) {
  test("[negative] rejects a non-contractual options shape", () => {
    assert.throws(() => validateRegistrationRequestListOptions(options));
  });
}

test("[positive] cursor encoding is deterministic and unpadded", () => {
  const binding = createRegistrationRequestBinding({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, tenantId: "tenant-1", uid: "uid-1", status: null });
  const input = { queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding, position: { requestedAt: iso, documentPath: "tenants/tenant-1/registrationRequests/request-1" } };
  assert.equal(encodeRegistrationRequestCursor(input), encodeRegistrationRequestCursor(input));
  assert(!encodeRegistrationRequestCursor(input).includes("="));
});

test("[negative] rejects unsupported cursor version as incompatible", () => {
  const binding = createRegistrationRequestBinding({ queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, tenantId: "tenant-1", uid: "uid-1", status: null });
  const envelope = { version: 2, queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding, position: { requestedAt: iso, documentPath: "tenants/tenant-1/registrationRequests/request-1" } };
  const token = btoa(JSON.stringify(envelope)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
  assert.throws(() => decodeRegistrationRequestCursor(token, { queryKind: REGISTRATION_REQUEST_QUERY_KINDS.TENANT, binding }), (error) => error.code === "CONTRACT_VIOLATION");
});

test("[negative] rejects noncanonical and legacy collection-group paths", async () => {
  for (const path of [
    "legacy/root/registrationRequests/request-1",
    "organizations/org-1/registrationRequests/request-1",
    "tenants/tenant-1/nested/registrationRequests/request-1",
    "registrationRequests/request-1",
    "tenants/tenant-1/RegistrationRequests/request-1"
  ]) {
    await assert.rejects(() => make([snapshot(requestData(), path)]).repository.listOwnRegistrationRequestsAcrossTenants("uid-1"));
  }
});

test("[negative] rejects requestId mismatch between ref.path and snapshot.id", async () => {
  const value = snapshot(requestData(), "tenants/tenant-1/registrationRequests/path-id");
  value.id = "request-1";
  await assert.rejects(() => make([value]).repository.listOwnRegistrationRequestsAcrossTenants("uid-1"), (error) => error.code === "CONTRACT_VIOLATION");
});

test("[positive] empty, final and lookahead pages have exact continuation semantics", async () => {
  const empty = await make([]).repository.listOwnRegistrationRequestsAcrossTenants("uid-1", { pageSize: 1 });
  assert.deepEqual(empty, { items: [], nextCursor: null, hasMore: false });
  const final = await make([snapshot()]).repository.listOwnRegistrationRequestsAcrossTenants("uid-1", { pageSize: 1 });
  assert.equal(final.hasMore, false); assert.equal(final.nextCursor, null);
  const extra = snapshot(requestData({ requestId: "request-2" }), "tenants/tenant-1/registrationRequests/request-2");
  const more = await make([snapshot(), extra]).repository.listOwnRegistrationRequestsAcrossTenants("uid-1", { pageSize: 1 });
  assert.equal(more.items.length, 1); assert.equal(more.hasMore, true); assert.equal(typeof more.nextCursor, "string");
});

test("[positive] default and maximum page sizes request limit 21 and 51", async () => {
  const defaultPage = make(); await defaultPage.repository.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1");
  assert(defaultPage.calls.some((call) => call[0] === "limit" && call[1] === 21));
  const maxPage = make(); await maxPage.repository.listOwnRegistrationRequestsForTenant("tenant-1", "uid-1", { pageSize: 50 });
  assert(maxPage.calls.some((call) => call[0] === "limit" && call[1] === 51));
});
