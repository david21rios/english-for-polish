import assert from "node:assert/strict";
import { test } from "node:test";

import {
  REPOSITORY_ERROR_CODES,
  coursePath,
  enrollmentPath,
  identityPath,
  membershipKeyPath,
  membershipPath,
  registrationRequestKeyPath,
  registrationRequestPath,
  tenantBrandingPath,
  tenantPath,
  tenantSettingsPath,
  validateIdentifier
} from "../index.js";

const expectInvalidIdentifier = (callback) => {
  assert.throws(callback, (error) => error.code === REPOSITORY_ERROR_CODES.INVALID_ARGUMENT);
};

test("builds the ten canonical Firestore document paths", () => {
  assert.deepEqual(
    [
      identityPath("uid-1"),
      tenantPath("tenant-1"),
      tenantSettingsPath("tenant-1"),
      tenantBrandingPath("tenant-1"),
      registrationRequestPath("tenant-1", "request-1"),
      registrationRequestKeyPath("tenant-1", "uid-key-1"),
      membershipPath("tenant-1", "membership-1"),
      membershipKeyPath("tenant-1", "uid-key-1"),
      coursePath("tenant-1", "course-1"),
      enrollmentPath("tenant-1", "enrollment-1")
    ],
    [
      "identities/uid-1",
      "tenants/tenant-1",
      "tenants/tenant-1/configuration/settings",
      "tenants/tenant-1/configuration/branding",
      "tenants/tenant-1/registrationRequests/request-1",
      "tenants/tenant-1/registrationRequestKeys/uid-key-1",
      "tenants/tenant-1/memberships/membership-1",
      "tenants/tenant-1/membershipKeys/uid-key-1",
      "tenants/tenant-1/courses/course-1",
      "tenants/tenant-1/enrollments/enrollment-1"
    ]
  );
});

test("rejects an empty identifier", () => expectInvalidIdentifier(() => identityPath("")));
test("rejects an identifier containing only whitespace", () => expectInvalidIdentifier(() => tenantPath("  ")));
test("rejects a slash in an identifier", () => expectInvalidIdentifier(() => coursePath("tenant-1", "a/b")));
test("rejects the current segment", () => expectInvalidIdentifier(() => validateIdentifier(" . ")));
test("rejects the parent segment", () => expectInvalidIdentifier(() => validateIdentifier("..")));
test("rejects a non-string identifier", () => expectInvalidIdentifier(() => enrollmentPath("tenant-1", 4)));
test("rejects a missing tenantId", () => expectInvalidIdentifier(() => membershipPath(undefined, "membership-1")));

test("does not silently normalize a valid opaque identifier", () => {
  assert.equal(identityPath(" uid with spaces "), "identities/ uid with spaces ");
});
