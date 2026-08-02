import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPOSITORY_ERROR_CODES,
  assertTenantConsistency
} from "../index.js";

test("accepts exactly equal tenant IDs", () => {
  assert.equal(assertTenantConsistency("tenant-1", "tenant-1"), "tenant-1");
});

test("fails closed for different tenant IDs", () => {
  assert.throws(
    () => assertTenantConsistency("tenant-1", "tenant-2"),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});

for (const [label, expectedTenantId, resourceTenantId] of [
  ["missing expected tenant", undefined, "tenant-1"],
  ["missing resource tenant", "tenant-1", undefined],
  ["invalid expected tenant type", 1, "tenant-1"],
  ["invalid resource tenant type", "tenant-1", {}]
]) {
  test(`rejects ${label}`, () => {
    assert.throws(
      () => assertTenantConsistency(expectedTenantId, resourceTenantId),
      (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
    );
  });
}
