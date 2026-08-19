import test from "node:test";
import assert from "node:assert/strict";

import {
  APPROVE_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
  APPROVE_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
  APPROVE_REGISTRATION_REQUEST_AUDIT_LEVEL,
  APPROVE_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
  APPROVE_REGISTRATION_REQUEST_AUDIT_OPERATION,
  APPROVE_REGISTRATION_REQUEST_AUDIT_RESULT,
  APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS,
  APPROVE_REGISTRATION_REQUEST_OPERATION,
  APPROVE_REGISTRATION_REQUEST_REQUIRED_CAPABILITY,
  APPROVE_REGISTRATION_REQUEST_RESOURCE_TYPE,
  APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS,
  APPROVE_REGISTRATION_REQUEST_TARGET_MEMBERSHIP_STATUS,
  APPROVE_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
  COMMAND_TYPES,
  approveRegistrationRequestBehavioralPayload,
  isPrivilegedCommandStageAllowed,
  validateApproveRegistrationRequestInput,
  validateApproveRegistrationRequestResult,
} from "../src/commands/index.js";

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  requestId: "request-1",
});

test("ApproveRegistrationRequest command identity is exact", () => {
  assert.equal(
    COMMAND_TYPES.APPROVE_REGISTRATION_REQUEST,
    "ApproveRegistrationRequest",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_OPERATION,
    "ApproveRegistrationRequest",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_RESOURCE_TYPE,
    "registrationRequest",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
    "approved",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_TARGET_MEMBERSHIP_STATUS,
    "approved",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_REQUIRED_CAPABILITY,
    "registration_request.review",
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.APPROVE_REGISTRATION_REQUEST,
      "completed",
    ),
    false,
  );
});

test("ApproveRegistrationRequest exact fields are frozen", () => {
  assert.deepEqual(
    APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS,
    ["commandId", "correlationId", "tenantId", "requestId"],
  );

  assert.deepEqual(
    APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS,
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
    Object.isFrozen(APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS),
    true,
  );
});

test("ApproveRegistrationRequest valid exact input passes", () => {
  assert.equal(
    validateApproveRegistrationRequestInput(validInput).ok,
    true,
  );
});

test("ApproveRegistrationRequest rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
    "requestId",
  ]) {
    assert.equal(
      validateApproveRegistrationRequestInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("ApproveRegistrationRequest rejects caller-owned lifecycle and authority fields", () => {
  for (const [field, value] of [
    ["status", "approved"],
    ["requestedRole", "student"],
    ["membershipId", "membership-1"],
    ["actorUid", "admin-1"],
    ["authority", "tenant_admin"],
    ["capability", "registration_request.review"],
    ["replayed", false],
    ["approvedAt", "2026-08-18T00:00:00.000Z"],
  ]) {
    assert.equal(
      validateApproveRegistrationRequestInput({
        ...validInput,
        [field]: value,
      }).ok,
      false,
      field,
    );
  }
});

test("ApproveRegistrationRequest behavioral payload is canonical", () => {
  const payload =
    approveRegistrationRequestBehavioralPayload(validInput);

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    requestId: "request-1",
    targetRequestStatus: "approved",
    targetMembershipStatus: "approved",
  });

  assert.equal(Object.hasOwn(payload, "commandId"), false);
  assert.equal(Object.hasOwn(payload, "correlationId"), false);
  assert.equal(Object.hasOwn(payload, "membershipId"), false);
  assert.equal(Object.hasOwn(payload, "actorUid"), false);
  assert.equal(Object.isFrozen(payload), true);
});

test("ApproveRegistrationRequest result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "ApproveRegistrationRequest",
    resourceType: "registrationRequest",
    resourceId: "request-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(
    validateApproveRegistrationRequestResult(result).ok,
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
      validateApproveRegistrationRequestResult(mutation).ok,
      false,
    );
  }
});

test("ApproveRegistrationRequest audit contract is critical and non-raw", () => {
  assert.equal(
    APPROVE_REGISTRATION_REQUEST_AUDIT_OPERATION,
    "ApproveRegistrationRequest.update",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_AUDIT_LEVEL,
    "critical",
  );

  assert.equal(
    APPROVE_REGISTRATION_REQUEST_AUDIT_RESULT,
    "succeeded",
  );

  assert.deepEqual(
    APPROVE_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
    ["registrationRequestStatus", "membershipExists"],
  );

  assert.deepEqual(
    APPROVE_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
    ["registrationRequestStatus", "membershipStatus"],
  );

  assert.deepEqual(
    APPROVE_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
    ["stage", "replayed"],
  );

  const allAuditFields = [
    ...APPROVE_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS,
    ...APPROVE_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS,
    ...APPROVE_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "uid",
    "requestedRole",
    "membershipId",
    "actorUid",
    "displayName",
    "email",
  ]) {
    assert.equal(allAuditFields.includes(forbidden), false, forbidden);
  }
});
