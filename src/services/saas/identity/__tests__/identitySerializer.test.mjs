import assert from "node:assert/strict";
import { test } from "node:test";

import { serializeIdentitySnapshot } from "../identitySerializer.js";
import { REPOSITORY_ERROR_CODES } from "../../shared/index.js";
import {
  ISO_CREATED,
  ISO_UPDATED,
  identitySnapshot,
  validIdentityData
} from "./testDoubles.mjs";

test("serializes a valid Identity to the frozen domain-facing shape", () => {
  const identity = serializeIdentitySnapshot(identitySnapshot());
  assert.deepEqual(identity, {
    uid: "identity-1",
    email: "identity@example.test",
    displayName: "Identity One",
    photoURL: null,
    emailVerified: true,
    interfaceLocale: "en-US",
    createdAt: ISO_CREATED,
    updatedAt: ISO_UPDATED
  });
  assert.equal(Object.isFrozen(identity), true);
});

test("rejects an absent Identity snapshot", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot({}, { exists: false })),
    (error) => error.code === REPOSITORY_ERROR_CODES.NOT_FOUND
  );
});

test("rejects a data uid different from the document ID", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot(validIdentityData({ uid: "other" }))),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});

test("rejects an unknown Identity field", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot(validIdentityData({ role: "admin" }))),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});

test("rejects every missing required Identity field", () => {
  for (const field of Object.keys(validIdentityData())) {
    const data = validIdentityData();
    delete data[field];
    assert.throws(
      () => serializeIdentitySnapshot(identitySnapshot(data)),
      (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      field
    );
  }
});

test("accepts an external photoURL string", () => {
  assert.equal(
    serializeIdentitySnapshot(identitySnapshot(validIdentityData({
      photoURL: "https://identity-provider.example/avatar.png"
    }))).photoURL,
    "https://identity-provider.example/avatar.png"
  );
});

test("preserves a null photoURL", () => {
  assert.equal(serializeIdentitySnapshot(identitySnapshot()).photoURL, null);
});

test("rejects an invalid photoURL type", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot(validIdentityData({ photoURL: 1 }))),
    (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
  );
});

test("requires emailVerified to be boolean", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot(validIdentityData({ emailVerified: "true" }))),
    (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
  );
});

test("rejects an invalid Identity timestamp", () => {
  assert.throws(
    () => serializeIdentitySnapshot(identitySnapshot(validIdentityData({ updatedAt: "now" }))),
    (error) => error.code === REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION
  );
});

test("does not expose the snapshot or SDK reference", () => {
  const result = serializeIdentitySnapshot(identitySnapshot());
  assert.equal("ref" in result, false);
  assert.equal("data" in result, false);
  assert.equal("exists" in result, false);
});

test("does not mutate original Identity data", () => {
  const data = validIdentityData();
  const createdAt = data.createdAt;
  serializeIdentitySnapshot(identitySnapshot(data));
  assert.equal(data.createdAt, createdAt);
  assert.equal(typeof data.createdAt.toDate, "function");
});

test("preserves displayName whitespace without silent normalization", () => {
  assert.equal(
    serializeIdentitySnapshot(identitySnapshot(validIdentityData({ displayName: "  Ada  " }))).displayName,
    "  Ada  "
  );
});
