import assert from "node:assert/strict";
import { test } from "node:test";

import { createIdentityRepository } from "../index.js";
import { createRepositoryDouble } from "./testDoubles.mjs";

test("creates an immutable repository from explicit mocks", () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  assert.equal(Object.isFrozen(repository), true);
  assert.deepEqual(Object.keys(repository).sort(), [
    "getIdentity",
    "updateIdentityProfile",
    "updateInterfaceLocale"
  ]);
});

test("rejects a missing db", () => {
  assert.throws(
    () => createIdentityRepository({ sdk: createRepositoryDouble().sdk }),
    { code: "INVALID_ARGUMENT" }
  );
});

for (const functionName of ["doc", "getDoc", "updateDoc", "serverTimestamp"]) {
  test(`rejects a missing ${functionName} dependency`, () => {
    const double = createRepositoryDouble();
    delete double.sdk[functionName];
    assert.throws(
      () => createIdentityRepository(double),
      { code: "FAILED_PRECONDITION" }
    );
  });
}
