import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CAPABILITY_IDS } from "../domain/capabilities.js";
import { REGISTRATION_REQUEST_STATUSES } from "../domain/registrationRequest.js";
import { MEMBERSHIP_STATUSES } from "../domain/membership.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;

const invalid = () =>
  Object.freeze({
    ok: false,
    issue: Object.freeze({
      code: "INVALID_ARGUMENT",
      field: "approveRegistrationRequest",
      reason: "invalid_approve_registration_request",
    }),
  });

/** @template T @param {T} value */
const ok = (value) =>
  Object.freeze({
    ok: true,
    value,
  });

export const APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "requestId",
]);

export const APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const APPROVE_REGISTRATION_REQUEST_OPERATION =
  COMMAND_TYPES.APPROVE_REGISTRATION_REQUEST;

export const APPROVE_REGISTRATION_REQUEST_RESOURCE_TYPE =
  "registrationRequest";

export const APPROVE_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS =
  REGISTRATION_REQUEST_STATUSES.APPROVED;

export const APPROVE_REGISTRATION_REQUEST_TARGET_MEMBERSHIP_STATUS =
  MEMBERSHIP_STATUSES.APPROVED;

export const APPROVE_REGISTRATION_REQUEST_REQUIRED_CAPABILITY =
  CAPABILITY_IDS.REGISTRATION_REQUEST_REVIEW;

export const APPROVE_REGISTRATION_REQUEST_AUDIT_OPERATION =
  "ApproveRegistrationRequest.update";

export const APPROVE_REGISTRATION_REQUEST_AUDIT_LEVEL =
  AUDIT_LEVELS.CRITICAL;

export const APPROVE_REGISTRATION_REQUEST_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const APPROVE_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS = frozen([
  "registrationRequestStatus",
  "membershipExists",
]);

export const APPROVE_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS = frozen([
  "registrationRequestStatus",
  "membershipStatus",
]);

export const APPROVE_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS = frozen([
  "stage",
  "replayed",
]);

/** @param {unknown} value */
export const validateApproveRegistrationRequestInput = (value) => {
  if (!hasExactKeys(value, APPROVE_REGISTRATION_REQUEST_INPUT_FIELDS)) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  if (
    !validId(v.commandId) ||
    !validId(v.correlationId) ||
    !validId(v.tenantId) ||
    !validId(v.requestId)
  ) {
    return invalid();
  }

  return ok(value);
};

/** @param {unknown} input */
export const approveRegistrationRequestBehavioralPayload = (input) => {
  const validation = validateApproveRegistrationRequestInput(input);

  if (!validation.ok) {
    throw new TypeError(
      "input is not a valid ApproveRegistrationRequest command.",
    );
  }

  const v = /** @type {Record<string, unknown>} */ (input);

  return Object.freeze({
    tenantId: v.tenantId,
    requestId: v.requestId,
    targetRequestStatus:
      APPROVE_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
    targetMembershipStatus:
      APPROVE_REGISTRATION_REQUEST_TARGET_MEMBERSHIP_STATUS,
  });
};

/** @param {unknown} value */
export const validateApproveRegistrationRequestResult = (value) => {
  if (!hasExactKeys(value, APPROVE_REGISTRATION_REQUEST_RESULT_FIELDS)) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  if (
    !validId(v.commandId) ||
    !validId(v.correlationId) ||
    v.operation !== APPROVE_REGISTRATION_REQUEST_OPERATION ||
    v.resourceType !== APPROVE_REGISTRATION_REQUEST_RESOURCE_TYPE ||
    !validId(v.resourceId) ||
    v.status !== "succeeded" ||
    typeof v.replayed !== "boolean"
  ) {
    return invalid();
  }

  return ok(value);
};
