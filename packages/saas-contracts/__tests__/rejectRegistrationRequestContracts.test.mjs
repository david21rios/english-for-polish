import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMAND_TYPES,
  REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
  REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
  REJECT_REGISTRATION_REQUEST_AUDIT_LEVEL,
  REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
  REJECT_REGISTRATION_REQUEST_AUDIT_OPERATION,
  REJECT_REGISTRATION_REQUEST_AUDIT_RESULT,
  REJECT_REGISTRATION_REQUEST_INPUT_FIELDS,
  REJECT_REGISTRATION_REQUEST_OPERATION,
  REJECT_REGISTRATION_REQUEST_REQUIRED_CAPABILITY,
  REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE,
  REJECT_REGISTRATION_REQUEST_RESULT_FIELDS,
  REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
  isPrivilegedCommandStageAllowed,
  rejectRegistrationRequestBehavioralPayload,
  validateRejectRegistrationRequestInput,
  validateRejectRegistrationRequestResult,
} from "../src/commands/index.js";

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  requestId: "request-1",
});

test("RejectRegistrationRequest command identity is exact", () => {
  assert.equal(
    COMMAND_TYPES.REJECT_REGISTRATION_REQUEST,
    "RejectRegistrationRequest",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_OPERATION,
    "RejectRegistrationRequest",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE,
    "registrationRequest",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
    "rejected",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_REQUIRED_CAPABILITY,
    "registration_request.review",
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.REJECT_REGISTRATION_REQUEST,
      "completed",
    ),
    false,
  );
});

test("RejectRegistrationRequest exact fields are frozen", () => {
  assert.deepEqual(
    REJECT_REGISTRATION_REQUEST_INPUT_FIELDS,
    ["commandId", "correlationId", "tenantId", "requestId"],
  );

  assert.deepEqual(
    REJECT_REGISTRATION_REQUEST_RESULT_FIELDS,
    [
      "commandId",
      "correlationId",
      "operation",
      "resourceType",
      "resourceId",
      "status",
      "replayed",
    ],
  );

  assert.equal(
    Object.isFrozen(REJECT_REGISTRATION_REQUEST_INPUT_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(REJECT_REGISTRATION_REQUEST_RESULT_FIELDS),
    true,
  );
});

test("RejectRegistrationRequest valid exact input passes", () => {
  assert.equal(
    validateRejectRegistrationRequestInput(validInput).ok,
    true,
  );
});

test("RejectRegistrationRequest rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
    "requestId",
  ]) {
    assert.equal(
      validateRejectRegistrationRequestInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("RejectRegistrationRequest rejects caller-owned lifecycle and authority fields", () => {
  for (const [field, value] of [
    ["status", "rejected"],
    ["requestedRole", "student"],
    ["membershipId", "membership-1"],
    ["actorUid", "admin-1"],
    ["authority", "tenant_admin"],
    ["capability", "registration_request.review"],
    ["replayed", false],
    ["reviewedBy", "admin-1"],
    ["rejectedAt", "2026-08-19T00:00:00.000Z"],
    ["updatedAt", "2026-08-19T00:00:00.000Z"],
  ]) {
    assert.equal(
      validateRejectRegistrationRequestInput({
        ...validInput,
        [field]: value,
      }).ok,
      false,
      field,
    );
  }
});

test("RejectRegistrationRequest behavioral payload is canonical and membership-free", () => {
  const payload =
    rejectRegistrationRequestBehavioralPayload(validInput);

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    requestId: "request-1",
    targetRequestStatus: "rejected",
  });

  assert.equal(Object.hasOwn(payload, "commandId"), false);
  assert.equal(Object.hasOwn(payload, "correlationId"), false);
  assert.equal(Object.hasOwn(payload, "membershipId"), false);
  assert.equal(Object.hasOwn(payload, "targetMembershipStatus"), false);
  assert.equal(Object.hasOwn(payload, "actorUid"), false);
  assert.equal(Object.isFrozen(payload), true);
});

test("RejectRegistrationRequest result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "RejectRegistrationRequest",
    resourceType: "registrationRequest",
    resourceId: "request-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(
    validateRejectRegistrationRequestResult(result).ok,
    true,
  );

  for (const mutation of [
    { ...result, operation: "Other" },
    { ...result, resourceType: "membership" },
    { ...result, resourceId: "../bad" },
    { ...result, status: "pending" },
    { ...result, replayed: "false" },
    { ...result, membershipId: "membership-1" },
  ]) {
    assert.equal(
      validateRejectRegistrationRequestResult(mutation).ok,
      false,
    );
  }
});

test("RejectRegistrationRequest audit contract is privileged and membership-free", () => {
  assert.equal(
    REJECT_REGISTRATION_REQUEST_AUDIT_OPERATION,
    "RejectRegistrationRequest.update",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_AUDIT_LEVEL,
    "privileged",
  );

  assert.equal(
    REJECT_REGISTRATION_REQUEST_AUDIT_RESULT,
    "succeeded",
  );

  assert.deepEqual(
    REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
    ["registrationRequestStatus"],
  );

  assert.deepEqual(
    REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
    ["registrationRequestStatus"],
  );

  assert.deepEqual(
    REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
    ["stage", "replayed"],
  );

  const allAuditFields = [
    ...REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
    ...REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
    ...REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "uid",
    "requestedRole",
    "membershipId",
    "membershipExists",
    "membershipStatus",
    "actorUid",
    "displayName",
    "email",
  ]) {
    assert.equal(
      allAuditFields.includes(forbidden),
      false,
      forbidden,
    );
  }
});
