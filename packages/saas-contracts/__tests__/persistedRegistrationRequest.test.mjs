import assert from "node:assert/strict";
import test from "node:test";

import {
  MEMBERSHIP_ROLES,
  REGISTRATION_REQUEST_KEY_FIELDS,
  REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS,
  REGISTRATION_REQUEST_STATUSES,
  encodeRegistrationRequestUidKey,
  validatePersistedRegistrationRequest,
  validateRegistrationRequestKey,
} from "../src/index.js";

const instant = "2023-11-14T22:13:20.000Z";

const request = (patch = {}) => ({
  requestId: "request-1",
  tenantId: "tenant-1",
  uid: "user-1",
  requestedRole: MEMBERSHIP_ROLES.STUDENT,
  status: REGISTRATION_REQUEST_STATUSES.PENDING,
  requestedAt: instant,
  reviewedAt: null,
  reviewedBy: null,
  approvedMembershipId: null,
  cancelledAt: null,
  expiredAt: null,
  ...patch,
});

test("RegistrationRequestKey exact fields remain frozen and minimal", () => {
  assert.deepEqual(
    REGISTRATION_REQUEST_KEY_FIELDS,
    ["uid", "requestId", "status"],
  );

  assert.equal(
    REGISTRATION_REQUEST_KEY_REQUIRED_FIELDS,
    REGISTRATION_REQUEST_KEY_FIELDS,
  );

  assert.equal(
    Object.isFrozen(REGISTRATION_REQUEST_KEY_FIELDS),
    true,
  );
});

test("RegistrationRequest uid key encoder is canonical", () => {
  assert.equal(
    encodeRegistrationRequestUidKey("abc"),
    "u1_YWJj",
  );

  assert.equal(
    encodeRegistrationRequestUidKey("\u017c\u00f3\u0142\u0107"),
    "u1_xbzDs8WCxIc",
  );

  assert.notEqual(
    encodeRegistrationRequestUidKey("a"),
    encodeRegistrationRequestUidKey("b"),
  );

  assert.doesNotMatch(
    encodeRegistrationRequestUidKey("abc"),
    /=/u,
  );

  for (const invalid of ["", " ", ".", "..", "a/b"]) {
    assert.throws(
      () => encodeRegistrationRequestUidKey(invalid),
    );
  }
});

test("RegistrationRequestKey validator enforces exact root projection", () => {
  const key = {
    uid: "user-1",
    requestId: "request-1",
    status: REGISTRATION_REQUEST_STATUSES.PENDING,
  };

  assert.equal(
    validateRegistrationRequestKey(key).ok,
    true,
  );

  assert.equal(
    validateRegistrationRequestKey({
      ...key,
      extra: true,
    }).ok,
    false,
  );

  assert.equal(
    validateRegistrationRequestKey({
      ...key,
      tenantId: "tenant-1",
    }).ok,
    false,
  );

  assert.equal(
    validateRegistrationRequestKey({
      ...key,
      uidKey: "u1_dXNlci0x",
    }).ok,
    false,
  );

  assert.equal(
    validateRegistrationRequestKey({
      ...key,
      updatedAt: instant,
    }).ok,
    false,
  );

  assert.equal(
    validateRegistrationRequestKey({
      ...key,
      status: "unknown",
    }).ok,
    false,
  );
});

test("persisted RegistrationRequest pending lifecycle validates", () => {
  assert.equal(
    validatePersistedRegistrationRequest(request()).ok,
    true,
  );

  assert.equal(
    validatePersistedRegistrationRequest(
      request({ extra: true }),
    ).ok,
    false,
  );
});

test("persisted RegistrationRequest approved lifecycle validates", () => {
  const value = request({
    status: REGISTRATION_REQUEST_STATUSES.APPROVED,
    reviewedAt: instant,
    reviewedBy: "admin-1",
    approvedMembershipId: "membership-1",
  });

  assert.equal(
    validatePersistedRegistrationRequest(value).ok,
    true,
  );

  assert.equal(
    validatePersistedRegistrationRequest({
      ...value,
      approvedMembershipId: null,
    }).ok,
    false,
  );
});

test("persisted RegistrationRequest rejected lifecycle validates", () => {
  const value = request({
    status: REGISTRATION_REQUEST_STATUSES.REJECTED,
    reviewedAt: instant,
    reviewedBy: "admin-1",
  });

  assert.equal(
    validatePersistedRegistrationRequest(value).ok,
    true,
  );
});

test("persisted RegistrationRequest cancelled lifecycle validates", () => {
  const value = request({
    status: REGISTRATION_REQUEST_STATUSES.CANCELLED,
    cancelledAt: instant,
  });

  assert.equal(
    validatePersistedRegistrationRequest(value).ok,
    true,
  );
});

test("persisted RegistrationRequest expired lifecycle validates", () => {
  const value = request({
    status: REGISTRATION_REQUEST_STATUSES.EXPIRED,
    expiredAt: instant,
  });

  assert.equal(
    validatePersistedRegistrationRequest(value).ok,
    true,
  );
});

test("RegistrationRequest persisted validator rejects cross-lifecycle residue", () => {
  assert.equal(
    validatePersistedRegistrationRequest(
      request({
        status: REGISTRATION_REQUEST_STATUSES.CANCELLED,
        cancelledAt: instant,
        reviewedBy: "admin-1",
      }),
    ).ok,
    false,
  );

  assert.equal(
    validatePersistedRegistrationRequest(
      request({
        status: REGISTRATION_REQUEST_STATUSES.EXPIRED,
        expiredAt: instant,
        approvedMembershipId: "membership-1",
      }),
    ).ok,
    false,
  );
});
