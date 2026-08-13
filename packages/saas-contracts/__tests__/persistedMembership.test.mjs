import assert from "node:assert/strict";
import test from "node:test";
import {
  MEMBERSHIP_FIELDS, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES,
  validatePersistedMembership,
} from "@mipymetic/saas-contracts";

const instant = "2026-08-13T12:00:00.000Z";
const membership = (overrides = {}) => ({
  membershipId: "membership-1", tenantId: "tenant-1", uid: "uid-1",
  role: MEMBERSHIP_ROLES.STUDENT, status: MEMBERSHIP_STATUSES.APPROVED,
  originRequestId: "request-1", createdAt: instant, approvedAt: instant,
  approvedBy: "approver-1", updatedAt: instant, suspendedAt: null,
  removedAt: null, ...overrides,
});

test("persisted Membership accepts the exact canonical shape", () => {
  const value = membership();
  const result = validatePersistedMembership(value);
  assert.equal(result.ok, true);
  assert.strictEqual(result.value, value);
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(Object.keys(value), MEMBERSHIP_FIELDS);
});

test("persisted Membership accepts every role, status, and nullable origin form", () => {
  for (const role of Object.values(MEMBERSHIP_ROLES)) {
    assert.equal(validatePersistedMembership(membership({ role })).ok, true);
  }
  const lifecycle = [
    { status: MEMBERSHIP_STATUSES.APPROVED, suspendedAt: instant, removedAt: null },
    { status: MEMBERSHIP_STATUSES.SUSPENDED, suspendedAt: instant, removedAt: null },
    { status: MEMBERSHIP_STATUSES.REMOVED, suspendedAt: null, removedAt: instant },
    { status: MEMBERSHIP_STATUSES.REMOVED, suspendedAt: instant, removedAt: instant },
  ];
  for (const state of lifecycle) assert.equal(validatePersistedMembership(membership(state)).ok, true);
  assert.equal(validatePersistedMembership(membership({ originRequestId: null })).ok, true);
});

test("persisted Membership rejects missing and unknown fields", () => {
  for (const field of MEMBERSHIP_FIELDS) {
    const value = membership();
    delete value[field];
    assert.equal(validatePersistedMembership(value).ok, false, field);
  }
  assert.equal(validatePersistedMembership(membership({ extra: true })).ok, false);
});

test("persisted Membership rejects malformed identifiers, roles, and statuses", () => {
  for (const field of ["membershipId", "tenantId", "uid", "approvedBy"]) {
    for (const value of ["", " ", ".", "..", "a/b"]) {
      assert.equal(validatePersistedMembership(membership({ [field]: value })).ok, false, `${field}:${value}`);
    }
  }
  for (const value of [7, "", " ", ".", "..", "a/b"]) {
    assert.equal(validatePersistedMembership(membership({ originRequestId: value })).ok, false);
  }
  assert.equal(validatePersistedMembership(membership({ role: "owner" })).ok, false);
  assert.equal(validatePersistedMembership(membership({ status: "active" })).ok, false);
});

test("persisted Membership validates timestamp representation and nullability", () => {
  for (const field of ["createdAt", "approvedAt", "updatedAt"]) {
    for (const value of [undefined, null, "2026-08-13T12:00:00Z", "2026-08-13T14:00:00.000+02:00", "2026-02-30T12:00:00.000Z", {}]) {
      assert.equal(validatePersistedMembership(membership({ [field]: value })).ok, false, `${field}:${String(value)}`);
    }
  }
  assert.equal(validatePersistedMembership(membership({ suspendedAt: 7 })).ok, false);
  assert.equal(validatePersistedMembership(membership({ removedAt: 7 })).ok, false);
});

test("persisted Membership enforces universal lifecycle timestamp invariants", () => {
  assert.equal(validatePersistedMembership(membership({ removedAt: instant })).ok, false);
  assert.equal(validatePersistedMembership(membership({ status: MEMBERSHIP_STATUSES.SUSPENDED })).ok, false);
  assert.equal(validatePersistedMembership(membership({ status: MEMBERSHIP_STATUSES.SUSPENDED, suspendedAt: instant, removedAt: instant })).ok, false);
  assert.equal(validatePersistedMembership(membership({ status: MEMBERSHIP_STATUSES.REMOVED })).ok, false);
});

test("persisted Membership validator never throws and freezes invalid diagnostics", () => {
  for (const value of [null, [], 7, "membership", new Date(), Object.create(null)]) {
    let result;
    assert.doesNotThrow(() => { result = validatePersistedMembership(value); });
    assert.equal(result.ok, false);
    assert.ok(Object.isFrozen(result));
    assert.ok(Object.isFrozen(result.issue));
  }
});
