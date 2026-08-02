import assert from "node:assert/strict";
import { test } from "node:test";

import { createTenantRepository } from "../index.js";
import { createRepositoryDouble } from "./testDoubles.mjs";

test("creates an immutable get-only repository", () => {
  const repository = createTenantRepository(createRepositoryDouble());
  assert.equal(Object.isFrozen(repository), true);
  assert.deepEqual(Object.keys(repository), ["getTenant"]);
});

test("rejects a missing db", () => {
  assert.throws(
    () => createTenantRepository({ sdk: createRepositoryDouble().sdk }),
    { code: "INVALID_ARGUMENT" }
  );
});

for (const functionName of ["doc", "getDoc"]) {
  test(`rejects a missing ${functionName} dependency`, () => {
    const double = createRepositoryDouble();
    delete double.sdk[functionName];
    assert.throws(() => createTenantRepository(double), {
      code: "FAILED_PRECONDITION"
    });
  });
}

test("does not require unrelated SDK functions", async () => {
  const double = createRepositoryDouble({
    extraSdk: { updateDoc: () => { throw new Error("must not run"); } }
  });
  const repository = createTenantRepository(double);
  await repository.getTenant("tenant-1");
  assert.deepEqual(Object.keys(repository), ["getTenant"]);
});
