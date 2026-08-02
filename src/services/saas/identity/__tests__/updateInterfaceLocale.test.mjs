import assert from "node:assert/strict";
import { test } from "node:test";

import { createIdentityRepository } from "../index.js";
import { createRepositoryDouble } from "./testDoubles.mjs";

test("updateInterfaceLocale writes only locale and updatedAt", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  const result = await repository.updateInterfaceLocale("identity-1", "zh-Hant-TW");

  assert.deepEqual(double.calls.updateDoc, [[
    { path: "identities/identity-1" },
    { interfaceLocale: "zh-Hant-TW", updatedAt: double.timestampSentinel }
  ]]);
  assert.deepEqual(result, {
    uid: "identity-1",
    updatedFields: ["interfaceLocale"]
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.updatedFields), true);
  assert.equal(double.calls.serverTimestamp, 1);
});

for (const [label, uid, locale] of [
  ["empty locale", "identity-1", ""],
  ["whitespace locale", "identity-1", "  "],
  ["non-string locale", "identity-1", 3],
  ["invalid uid", "bad/uid", "en"]
]) {
  test(`updateInterfaceLocale rejects ${label}`, async () => {
    const double = createRepositoryDouble();
    const repository = createIdentityRepository(double);
    await assert.rejects(repository.updateInterfaceLocale(uid, locale), {
      code: "INVALID_ARGUMENT"
    });
    assert.equal(double.calls.updateDoc.length, 0);
  });
}

test("updateInterfaceLocale preserves the supplied locale without normalization", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  await repository.updateInterfaceLocale("identity-1", "  en-US  ");
  assert.equal(double.calls.updateDoc[0][1].interfaceLocale, "  en-US  ");
});

test("updateInterfaceLocale maps Firebase errors", async () => {
  const double = createRepositoryDouble();
  double.sdk.updateDoc = async () => {
    throw { name: "FirebaseError", code: "firestore/unavailable" };
  };
  const repository = createIdentityRepository(double);
  await assert.rejects(
    repository.updateInterfaceLocale("identity-1", "en-US"),
    { code: "UNAVAILABLE" }
  );
});
