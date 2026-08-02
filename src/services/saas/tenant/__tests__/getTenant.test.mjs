import assert from "node:assert/strict";
import { test } from "node:test";

import { createTenantRepository } from "../index.js";
import {
  createRepositoryDouble,
  tenantSnapshot
} from "./testDoubles.mjs";

test("getTenant uses the canonical path and only one getDoc", async () => {
  const double = createRepositoryDouble();
  const repository = createTenantRepository(double);
  const tenant = await repository.getTenant("tenant-1");

  assert.equal(tenant.tenantId, "tenant-1");
  assert.deepEqual(double.calls.doc, [[double.db, "tenants/tenant-1"]]);
  assert.deepEqual(double.calls.getDoc, [{ path: "tenants/tenant-1" }]);
  assert.deepEqual(Object.keys(double.calls), ["doc", "getDoc"]);
});

test("getTenant maps an absent document to NOT_FOUND", async () => {
  const double = createRepositoryDouble({
    snapshot: tenantSnapshot({}, { exists: false })
  });
  await assert.rejects(createTenantRepository(double).getTenant("tenant-1"), {
    code: "NOT_FOUND"
  });
});

for (const [firebaseCode, expectedCode] of [
  ["permission-denied", "FORBIDDEN"],
  ["unauthenticated", "UNAUTHENTICATED"],
  ["unavailable", "UNAVAILABLE"]
]) {
  test(`getTenant maps Firebase ${firebaseCode}`, async () => {
    const double = createRepositoryDouble();
    double.sdk.getDoc = async () => {
      throw { name: "FirebaseError", code: `firestore/${firebaseCode}` };
    };
    await assert.rejects(createTenantRepository(double).getTenant("tenant-1"), {
      code: expectedCode
    });
  });
}

test("getTenant rejects an invalid tenantId before SDK calls", async () => {
  const double = createRepositoryDouble();
  await assert.rejects(createTenantRepository(double).getTenant("bad/id"), {
    code: "INVALID_ARGUMENT"
  });
  assert.equal(double.calls.doc.length, 0);
  assert.equal(double.calls.getDoc.length, 0);
});
