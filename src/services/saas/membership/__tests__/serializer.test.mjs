import assert from "node:assert/strict";
import test from "node:test";
import { serializeMembership } from "../membershipSerializer.js";
import { iso, membershipData, snapshot, timestamp } from "./testDoubles.mjs";

test("[positive] serializes approved, suspended and removed Memberships", () => {
  const fixtures = [
    membershipData(),
    membershipData({ status: "suspended", suspendedAt: timestamp() }),
    membershipData({ status: "removed", removedAt: timestamp() })
  ];
  for (const fixture of fixtures) {
    const result = serializeMembership(snapshot(fixture), { expectedTenantId: "tenant-1", expectedUid: "uid-1" });
    assert.equal(result.createdAt, iso);
    assert(Object.isFrozen(result));
  }
});
test("[positive] accepts every canonical role and retained suspension history", () => {
  for (const role of ["student", "teacher", "tenant_admin"]) {
    const approved = serializeMembership(snapshot(membershipData({ role, suspendedAt: timestamp() })));
    const removed = serializeMembership(snapshot(membershipData({
      role, status: "removed", suspendedAt: timestamp(), removedAt: timestamp()
    })));
    assert.equal(approved.role, role);
    assert.equal(approved.suspendedAt, iso);
    assert.equal(removed.removedAt, iso);
  }
});
test("[positive] preserves nullable fields and source object", () => {
  const data = membershipData({ originRequestId: null });
  const result = serializeMembership(snapshot(data));
  assert.equal(result.originRequestId, null);
  assert.equal(result.suspendedAt, null);
  assert.equal(typeof data.createdAt.toDate, "function");
  assert.notEqual(result, data);
});
test("[negative] rejects missing, unknown, mismatched and invalid fields", () => {
  assert.throws(() => serializeMembership({ exists: () => false }));
  const missing = membershipData(); delete missing.role;
  assert.throws(() => serializeMembership(snapshot(missing)));
  assert.throws(() => serializeMembership(snapshot(membershipData({ extra: true }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ membershipId: "other" }))));
  assert.throws(() => serializeMembership(snapshot(), { expectedTenantId: "other" }));
  assert.throws(() => serializeMembership(snapshot(), { expectedUid: "other" }));
  assert.throws(() => serializeMembership(snapshot(membershipData({ role: "platform_admin" }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ status: "pending" }))));
});
test("[negative] enforces lifecycle and timestamp contracts", () => {
  assert.throws(() => serializeMembership(snapshot(membershipData({ status: "approved", removedAt: timestamp() }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ status: "suspended" }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ status: "removed" }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ createdAt: "invalid" }))));
});
test("[negative] rejects invalid nullable values and every unsupported role", () => {
  assert.throws(() => serializeMembership(snapshot(membershipData({ originRequestId: 7 }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ suspendedAt: {} }))));
  assert.throws(() => serializeMembership(snapshot(membershipData({ removedAt: [] }))));
  for (const role of ["platform_admin", "admin", "superadmin", "owner", "moderator"]) {
    assert.throws(() => serializeMembership(snapshot(membershipData({ role }))));
  }
});
