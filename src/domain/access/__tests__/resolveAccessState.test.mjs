import assert from "node:assert/strict";
import test from "node:test";

import { resolveAccessState } from "../resolveAccessState.js";

const base = (overrides = {}) => ({
  uid: "uid-1",
  tenantId: "tenant-1",
  identity: { emailVerified: true },
  tenant: { tenantId: "tenant-1", status: "active" },
  membership: { tenantId: "tenant-1", uid: "uid-1", status: "approved" },
  registrationRequest: null,
  requiresVerifiedEmail: true,
  ...overrides
});

const deepFreeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

test("AS-01 — no tenant context returns null", () => {
  assert.equal(resolveAccessState(base({ tenantId: null })), null);
});

test("AS-02 — email verification pending", () => {
  assert.equal(resolveAccessState(base({ identity: { emailVerified: false } })), "pending_email_verification");
});

test("AS-03 — suspended Tenant", () => {
  assert.equal(resolveAccessState(base({ tenant: { tenantId: "tenant-1", status: "suspended" } })), "suspended");
});

test("AS-04 — suspended Membership", () => {
  assert.equal(resolveAccessState(base({ membership: { tenantId: "tenant-1", uid: "uid-1", status: "suspended" } })), "suspended");
});

test("AS-05 — active access", () => {
  assert.equal(resolveAccessState(base()), "active");
});

test("AS-06 — pending tenant approval", () => {
  assert.equal(resolveAccessState(base({
    membership: null,
    registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status: "pending" }
  })), "pending_tenant_approval");
});

test("AS-07 — rejected request", () => {
  assert.equal(resolveAccessState(base({
    membership: null,
    registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status: "rejected" }
  })), "rejected");
});

test("AS-08 — verified identity without request", () => {
  assert.equal(resolveAccessState(base({ membership: null })), null);
});

test("AS-09 — cancelled and expired requests return null", () => {
  for (const status of ["cancelled", "expired"]) {
    assert.equal(resolveAccessState(base({
      membership: null,
      registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status }
    })), null);
  }
});

test("AS-10 — removed Membership returns null", () => {
  assert.equal(resolveAccessState(base({ membership: { tenantId: "tenant-1", uid: "uid-1", status: "removed" } })), null);
});

test("AS-11 — archived Tenant returns null", () => {
  assert.equal(resolveAccessState(base({ tenant: { tenantId: "tenant-1", status: "archived" } })), null);
});

test("AS-12 — email verification precedes suspension", () => {
  assert.equal(resolveAccessState(base({
    identity: { emailVerified: false },
    tenant: { tenantId: "tenant-1", status: "suspended" }
  })), "pending_email_verification");
});

test("AS-13 — derivation does not mutate nested inputs", () => {
  const input = base({
    identity: { emailVerified: true, profile: { locale: "en-US" } },
    tenant: { tenantId: "tenant-1", status: "active", metadata: { source: "test" } },
    membership: { tenantId: "tenant-1", uid: "uid-1", status: "approved", labels: ["owner"] }
  });
  const before = structuredClone(input);
  deepFreeze(input);

  assert.equal(resolveAccessState(input), "active");
  assert.deepEqual(input, before);
});

test("AS-14 — unverified email precedes suspended Membership", () => {
  assert.equal(resolveAccessState(base({
    identity: { emailVerified: false },
    membership: { tenantId: "tenant-1", uid: "uid-1", role: "student", status: "suspended" }
  })), "pending_email_verification");
});

test("AS-15 — approved Membership precedes pending request", () => {
  assert.equal(resolveAccessState(base({
    membership: { tenantId: "tenant-1", uid: "uid-1", role: "student", status: "approved" },
    registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status: "pending" }
  })), "active");
});

test("AS-16 — approved Membership precedes rejected request", () => {
  assert.equal(resolveAccessState(base({
    membership: { tenantId: "tenant-1", uid: "uid-1", role: "student", status: "approved" },
    registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status: "rejected" }
  })), "active");
});

test("AS-17 — removed Membership precedes request outcomes", () => {
  for (const status of ["pending", "rejected"]) {
    assert.equal(resolveAccessState(base({
      membership: { tenantId: "tenant-1", uid: "uid-1", role: "student", status: "removed" },
      registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status }
    })), null);
  }
});

test("AS-18 — archived Tenant precedes request outcomes", () => {
  for (const status of ["pending", "rejected"]) {
    assert.equal(resolveAccessState(base({
      tenant: { tenantId: "tenant-1", status: "archived" },
      membership: null,
      registrationRequest: { tenantId: "tenant-1", uid: "uid-1", status }
    })), null);
  }
});

test("additional — missing uid fails closed", () => {
  assert.equal(resolveAccessState(base({ uid: undefined })), null);
});

test("additional — missing identity when verification is required fails closed", () => {
  assert.equal(resolveAccessState(base({ identity: undefined })), null);
});

test("additional — unknown status fails closed", () => {
  assert.equal(resolveAccessState(base({ tenant: { tenantId: "tenant-1", status: "unknown" } })), null);
});
