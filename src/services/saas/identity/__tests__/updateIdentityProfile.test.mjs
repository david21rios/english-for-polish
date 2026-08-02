import assert from "node:assert/strict";
import { test } from "node:test";

import { createIdentityRepository } from "../index.js";
import { createRepositoryDouble } from "./testDoubles.mjs";

for (const [label, patch, requestedFields] of [
  ["displayName only", { displayName: "Ada" }, ["displayName"]],
  ["photoURL only", { photoURL: "https://provider.example/a.png" }, ["photoURL"]],
  ["both profile fields", { displayName: "Ada", photoURL: null }, ["displayName", "photoURL"]],
  ["explicit null photoURL", { photoURL: null }, ["photoURL"]]
]) {
  test(`updateIdentityProfile writes ${label}`, async () => {
    const double = createRepositoryDouble();
    const repository = createIdentityRepository(double);
    const result = await repository.updateIdentityProfile("identity-1", patch);
    const [, writtenPatch] = double.calls.updateDoc[0];

    assert.deepEqual(Object.keys(writtenPatch), [...requestedFields, "updatedAt"]);
    assert.equal(writtenPatch.updatedAt, double.timestampSentinel);
    assert.deepEqual(result, { uid: "identity-1", updatedFields: requestedFields });
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.updatedFields), true);
  });
}

test("updateIdentityProfile uses updateDoc with a field-scoped patch", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  await repository.updateIdentityProfile("identity-1", { displayName: "Ada" });
  assert.deepEqual(double.calls.updateDoc, [[
    { path: "identities/identity-1" },
    { displayName: "Ada", updatedAt: double.timestampSentinel }
  ]]);
  assert.equal(double.calls.serverTimestamp, 1);
  assert.equal("setDoc" in double.calls, false);
});

for (const [label, patch] of [
  ["empty patch", {}],
  ["fields outside the profile allowlist", [
    { unknown: true },
    { updatedAt: new Date() },
    { role: "admin" },
    { tenantId: "tenant-1" }
  ]],
  ["email", { email: "other@example.test" }],
  ["emailVerified", { emailVerified: false }],
  ["uid", { uid: "other" }],
  ["createdAt", { createdAt: new Date() }],
  ["interfaceLocale", { interfaceLocale: "pl" }],
  ["undefined displayName", { displayName: undefined }],
  ["invalid displayName", { displayName: 3 }],
  ["invalid photoURL", { photoURL: false }]
]) {
  test(`updateIdentityProfile rejects ${label}`, async () => {
    const patches = Array.isArray(patch) ? patch : [patch];

    for (const candidate of patches) {
      const double = createRepositoryDouble();
      const repository = createIdentityRepository(double);
      await assert.rejects(
        repository.updateIdentityProfile("identity-1", candidate),
        { code: "INVALID_ARGUMENT" }
      );
      assert.equal(double.calls.updateDoc.length, 0);
    }
  });
}

test("updateIdentityProfile rejects an invalid uid before SDK calls", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  await assert.rejects(
    repository.updateIdentityProfile("bad/uid", { displayName: "Ada" }),
    { code: "INVALID_ARGUMENT" }
  );
  assert.equal(double.calls.updateDoc.length, 0);
});

test("updateIdentityProfile maps Firebase update errors", async () => {
  const double = createRepositoryDouble();
  double.sdk.updateDoc = async () => {
    throw { name: "FirebaseError", code: "firestore/permission-denied" };
  };
  const repository = createIdentityRepository(double);
  await assert.rejects(
    repository.updateIdentityProfile("identity-1", { displayName: "Ada" }),
    { code: "FORBIDDEN" }
  );
});
