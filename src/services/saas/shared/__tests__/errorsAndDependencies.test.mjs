import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  createFirestoreRepositoryDependencies,
  createRepositoryError,
  mapFirebaseError,
  requireFirestoreSdkFunction
} from "../index.js";

test("exports the complete stable error taxonomy", () => {
  assert.deepEqual(Object.values(REPOSITORY_ERROR_CODES), [
    "INVALID_ARGUMENT",
    "UNAUTHENTICATED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "FAILED_PRECONDITION",
    "UNAVAILABLE",
    "CONTRACT_VIOLATION",
    "UNKNOWN"
  ]);
});

test("creates a normalized repository error", () => {
  const error = createRepositoryError({
    code: REPOSITORY_ERROR_CODES.NOT_FOUND,
    message: "Resource not found.",
    operation: "get",
    resource: "identity",
    details: { documentId: "identity-1" }
  });

  assert.ok(error instanceof RepositoryError);
  assert.deepEqual(
    {
      code: error.code,
      message: error.message,
      operation: error.operation,
      resource: error.resource,
      details: error.details
    },
    {
      code: "NOT_FOUND",
      message: "Resource not found.",
      operation: "get",
      resource: "identity",
      details: { documentId: "identity-1" }
    }
  );
});

test("removes sensitive detail keys and summarizes causes", () => {
  const error = createRepositoryError({
    code: REPOSITORY_ERROR_CODES.UNKNOWN,
    message: "Failure.",
    operation: "get",
    resource: "identity",
    cause: { name: "FirebaseError", code: "firestore/unavailable", message: "PII" },
    details: {
      tenantId: "tenant-1",
      accessToken: "secret",
      nested: { password: "secret", safe: true, secretKey: "secret" }
    }
  });

  assert.deepEqual(error.cause, { name: "FirebaseError", code: "unavailable" });
  assert.deepEqual(error.details, { tenantId: "tenant-1", nested: { safe: true } });
  assert.equal(JSON.stringify(error).includes("secret"), false);
});

for (const [firebaseCode, expectedCode] of [
  ["permission-denied", "FORBIDDEN"],
  ["unauthenticated", "UNAUTHENTICATED"],
  ["not-found", "NOT_FOUND"],
  ["already-exists", "CONFLICT"],
  ["failed-precondition", "FAILED_PRECONDITION"],
  ["aborted", "CONFLICT"],
  ["unavailable", "UNAVAILABLE"],
  ["deadline-exceeded", "UNAVAILABLE"],
  ["invalid-argument", "INVALID_ARGUMENT"]
]) {
  test(`maps Firebase ${firebaseCode}`, () => {
    const error = mapFirebaseError({ code: `firestore/${firebaseCode}`, name: "FirebaseError" }, {
      operation: "read",
      resource: "course"
    });
    assert.equal(error.code, expectedCode);
    assert.deepEqual(error.cause, { name: "FirebaseError", code: firebaseCode });
  });
}

test("maps an unknown Firebase error without exposing its message", () => {
  const error = mapFirebaseError({ code: "firestore/new-code", message: "sensitive payload" });
  assert.equal(error.code, REPOSITORY_ERROR_CODES.UNKNOWN);
  assert.equal(error.message.includes("sensitive"), false);
  assert.deepEqual(error.cause, { name: "Error", code: "new-code" });
});

test("creates frozen injectable Firestore dependencies", () => {
  const db = {};
  const doc = () => {};
  const dependencies = createFirestoreRepositoryDependencies({ db, sdk: { doc } });

  assert.equal(dependencies.db, db);
  assert.equal(requireFirestoreSdkFunction(dependencies, "doc"), doc);
  assert.equal(Object.isFrozen(dependencies), true);
  assert.equal(Object.isFrozen(dependencies.sdk), true);
});

test("rejects a missing db dependency", () => {
  assert.throws(
    () => createFirestoreRepositoryDependencies({ sdk: {} }),
    (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
  );
});

test("rejects a non-function SDK dependency", () => {
  assert.throws(
    () => createFirestoreRepositoryDependencies({ db: {}, sdk: { doc: "global" } }),
    (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
  );
});

test("fails closed when a requested SDK function was not injected", () => {
  const dependencies = createFirestoreRepositoryDependencies({ db: {}, sdk: {} });
  assert.throws(
    () => requireFirestoreSdkFunction(dependencies, "getDoc"),
    (error) => error.code === REPOSITORY_ERROR_CODES.FAILED_PRECONDITION
  );
});
