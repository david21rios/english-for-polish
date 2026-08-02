import assert from "node:assert/strict";
import { test } from "node:test";

import { createIdentityRepository } from "../index.js";
import { createRepositoryDouble, identitySnapshot } from "./testDoubles.mjs";

test("getIdentity uses the canonical path and injected getDoc", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  const identity = await repository.getIdentity("identity-1");

  assert.equal(identity.uid, "identity-1");
  assert.deepEqual(double.calls.doc, [[double.db, "identities/identity-1"]]);
  assert.deepEqual(double.calls.getDoc, [{ path: "identities/identity-1" }]);
});

test("getIdentity maps an absent document to NOT_FOUND", async () => {
  const double = createRepositoryDouble({
    snapshot: identitySnapshot({}, { exists: false })
  });
  const repository = createIdentityRepository(double);

  await assert.rejects(repository.getIdentity("identity-1"), { code: "NOT_FOUND" });
});

for (const [firebaseCode, expectedCode] of [
  ["permission-denied", "FORBIDDEN"],
  ["unavailable", "UNAVAILABLE"]
]) {
  test(`getIdentity maps Firebase ${firebaseCode}`, async () => {
    const double = createRepositoryDouble();
    double.sdk.getDoc = async () => {
      throw { name: "FirebaseError", code: `firestore/${firebaseCode}` };
    };
    const repository = createIdentityRepository(double);
    await assert.rejects(repository.getIdentity("identity-1"), { code: expectedCode });
  });
}

test("getIdentity rejects an invalid uid before SDK calls", async () => {
  const double = createRepositoryDouble();
  const repository = createIdentityRepository(double);
  await assert.rejects(repository.getIdentity("bad/uid"), { code: "INVALID_ARGUMENT" });
  assert.equal(double.calls.doc.length, 0);
  assert.equal(double.calls.getDoc.length, 0);
});
