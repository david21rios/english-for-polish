import assert from "node:assert/strict";
import { test } from "node:test";

import { serializeTenantSnapshot } from "../tenantSerializer.js";
import { TENANT_REQUIRED_FIELDS } from "../tenantValidation.js";
import {
  ISO_ARCHIVED,
  ISO_CREATED,
  ISO_SUSPENDED,
  ISO_UPDATED,
  tenantAtStatus,
  tenantSnapshot,
  validTenantData
} from "./testDoubles.mjs";

for (const [status, expectedLifecycle] of [
  ["active", { suspendedAt: null, archivedAt: null }],
  ["suspended", { suspendedAt: ISO_SUSPENDED, archivedAt: null }],
  ["archived", { suspendedAt: null, archivedAt: ISO_ARCHIVED }]
]) {
  test(`serializes a valid ${status} Tenant`, () => {
    const tenant = serializeTenantSnapshot(tenantSnapshot(tenantAtStatus(status)));
    assert.equal(tenant.status, status);
    assert.equal(tenant.createdAt, ISO_CREATED);
    assert.equal(tenant.updatedAt, ISO_UPDATED);
    assert.equal(tenant.suspendedAt, expectedLifecycle.suspendedAt);
    assert.equal(tenant.archivedAt, expectedLifecycle.archivedAt);
    assert.equal(Object.isFrozen(tenant), true);
  });
}

test("rejects an absent Tenant snapshot", () => {
  assert.throws(
    () => serializeTenantSnapshot(tenantSnapshot({}, { exists: false })),
    { code: "NOT_FOUND" }
  );
});

test("rejects tenantId different from the document ID", () => {
  assert.throws(
    () => serializeTenantSnapshot(tenantSnapshot(validTenantData({ tenantId: "other" }))),
    { code: "CONTRACT_VIOLATION" }
  );
});

test("rejects unknown fields", () => {
  assert.throws(
    () => serializeTenantSnapshot(tenantSnapshot(validTenantData({ billing: {} }))),
    { code: "CONTRACT_VIOLATION" }
  );
});

test("rejects every missing required field", () => {
  for (const field of TENANT_REQUIRED_FIELDS) {
    const data = validTenantData();
    delete data[field];
    assert.throws(
      () => serializeTenantSnapshot(tenantSnapshot(data)),
      { code: "CONTRACT_VIOLATION" },
      field
    );
  }
});

test("accepts lifecycle fields omitted when the current state does not require them", () => {
  const active = validTenantData();
  delete active.suspendedAt;
  delete active.archivedAt;
  assert.deepEqual(
    Object.keys(serializeTenantSnapshot(tenantSnapshot(active))).includes("suspendedAt"),
    false
  );

  const suspended = tenantAtStatus("suspended");
  delete suspended.archivedAt;
  assert.equal(
    serializeTenantSnapshot(tenantSnapshot(suspended)).suspendedAt,
    ISO_SUSPENDED
  );

  const archived = tenantAtStatus("archived");
  delete archived.suspendedAt;
  assert.equal(
    serializeTenantSnapshot(tenantSnapshot(archived)).archivedAt,
    ISO_ARCHIVED
  );
});

for (const [label, overrides] of [
  ["tenantType", { tenantType: "other" }],
  ["status", { status: "deleted" }],
  ["displayName", { displayName: null }],
  ["country", { country: 1 }]
]) {
  test(`rejects invalid ${label}`, () => {
    assert.throws(
      () => serializeTenantSnapshot(tenantSnapshot(validTenantData(overrides))),
      { code: "CONTRACT_VIOLATION" }
    );
  });
}

test("rejects an invalid timestamp", () => {
  assert.throws(
    () => serializeTenantSnapshot(tenantSnapshot(validTenantData({ updatedAt: "now" }))),
    { code: "CONTRACT_VIOLATION" }
  );
});

for (const [label, data] of [
  ["null createdAt", validTenantData({ createdAt: null })],
  ["suspended without suspendedAt", validTenantData({ status: "suspended" })],
  ["archived without archivedAt", validTenantData({ status: "archived" })],
  ["active with archivedAt", tenantAtStatus("archived")]
]) {
  test(`rejects lifecycle contract: ${label}`, () => {
    const candidate = label === "active with archivedAt"
      ? { ...data, status: "active" }
      : data;
    assert.throws(
      () => serializeTenantSnapshot(tenantSnapshot(candidate)),
      { code: "CONTRACT_VIOLATION" }
    );
  });
}

test("does not expose the snapshot or mutate source data", () => {
  const data = validTenantData();
  const createdAt = data.createdAt;
  const tenant = serializeTenantSnapshot(tenantSnapshot(data));
  assert.equal("ref" in tenant, false);
  assert.equal("data" in tenant, false);
  assert.equal(data.createdAt, createdAt);
  assert.equal(typeof data.createdAt.toDate, "function");
});

test("preserves strings without silent normalization", () => {
  const tenant = serializeTenantSnapshot(tenantSnapshot(validTenantData({
    displayName: "  Tenant One  ",
    locale: "  pl-PL  "
  })));
  assert.equal(tenant.displayName, "  Tenant One  ");
  assert.equal(tenant.locale, "  pl-PL  ");
});
