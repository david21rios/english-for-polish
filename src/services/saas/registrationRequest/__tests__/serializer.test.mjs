import assert from "node:assert/strict";
import test from "node:test";
import { serializeRegistrationRequest } from "../registrationRequestSerializer.js";
import { requestData, snapshot, timestamp, iso } from "./testDoubles.mjs";

test("[positive] serializes every canonical status and timestamps", () => {
  const fixtures = [
    requestData(),
    requestData({ status: "approved", reviewedAt: timestamp(), reviewedBy: "reviewer", approvedMembershipId: "membership-1" }),
    requestData({ status: "rejected", reviewedAt: timestamp(), reviewedBy: "reviewer" }),
    requestData({ status: "cancelled", cancelledAt: timestamp() }),
    requestData({ status: "expired", expiredAt: timestamp() })
  ];
  for (const data of fixtures) {
    const result = serializeRegistrationRequest(snapshot(data), { expectedTenantId: "tenant-1", expectedUid: "uid-1" });
    assert.equal(result.requestedAt, iso);
    assert(Object.isFrozen(result));
  }
});

test("[negative] rejects missing documents, fields and unknown fields", () => {
  assert.throws(() => serializeRegistrationRequest({ exists: () => false }));
  const missing = requestData(); delete missing.uid;
  assert.throws(() => serializeRegistrationRequest(snapshot(missing)));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ extra: true }))));
});

test("[negative] rejects request, tenant and owner mismatches", () => {
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ requestId: "other" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(), { expectedTenantId: "other" }));
  assert.throws(() => serializeRegistrationRequest(snapshot(), { expectedUid: "other" }));
});

test("[negative] rejects invalid roles, statuses and timestamp shapes", () => {
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ requestedRole: "owner" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ status: "open" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ requestedAt: "not-sdk" }))));
});

test("[negative] enforces lifecycle fields", () => {
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ reviewedAt: timestamp() }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ status: "approved" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ status: "rejected" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ status: "cancelled" }))));
  assert.throws(() => serializeRegistrationRequest(snapshot(requestData({ status: "expired" }))));
});

test("[positive] does not mutate or expose source data", () => {
  const data = requestData();
  const result = serializeRegistrationRequest(snapshot(data));
  assert.notEqual(result, data);
  assert.equal(typeof result.requestedAt, "string");
  assert.equal(typeof data.requestedAt.toDate, "function");
});
