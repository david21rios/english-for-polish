import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CAPABILITY_IDS } from "../domain/capabilities.js";
import { REGISTRATION_REQUEST_STATUSES } from "../domain/registrationRequest.js";
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
      field: "rejectRegistrationRequest",
      reason: "invalid_reject_registration_request",
    }),
  });

/** @template T @param {T} value */
const ok = (value) =>
  Object.freeze({
    ok: true,
    value,
  });

export const REJECT_REGISTRATION_REQUEST_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "requestId",
]);

export const REJECT_REGISTRATION_REQUEST_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const REJECT_REGISTRATION_REQUEST_OPERATION =
  COMMAND_TYPES.REJECT_REGISTRATION_REQUEST;

export const REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE =
  "registrationRequest";

export const REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS =
  REGISTRATION_REQUEST_STATUSES.REJECTED;

export const REJECT_REGISTRATION_REQUEST_REQUIRED_CAPABILITY =
  CAPABILITY_IDS.REGISTRATION_REQUEST_REVIEW;

export const REJECT_REGISTRATION_REQUEST_AUDIT_OPERATION =
  "RejectRegistrationRequest.update";

export const REJECT_REGISTRATION_REQUEST_AUDIT_LEVEL =
  AUDIT_LEVELS.PRIVILEGED;

export const REJECT_REGISTRATION_REQUEST_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const REJECT_REGISTRATION_REQUEST_AUDIT_BEFORE_FIELDS = frozen([
  "registrationRequestStatus",
]);

export const REJECT_REGISTRATION_REQUEST_AUDIT_AFTER_FIELDS = frozen([
  "registrationRequestStatus",
]);

export const REJECT_REGISTRATION_REQUEST_AUDIT_METADATA_FIELDS = frozen([
  "stage",
  "replayed",
]);

/** @param {unknown} value */
export const validateRejectRegistrationRequestInput = (value) => {
  if (!hasExactKeys(value, REJECT_REGISTRATION_REQUEST_INPUT_FIELDS)) {
    return invalid();
  }

  const v =
    /** @type {{
     * commandId: unknown,
     * correlationId: unknown,
     * tenantId: unknown,
     * requestId: unknown
     * }} */
    (value);

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
export const rejectRegistrationRequestBehavioralPayload = (input) => {
  const validation =
    validateRejectRegistrationRequestInput(input);

  if (!validation.ok) {
    throw new TypeError(
      "input is not a valid RejectRegistrationRequest command.",
    );
  }

  const v =
    /** @type {{ tenantId: unknown, requestId: unknown }} */
    (input);

  return Object.freeze({
    tenantId: v.tenantId,
    requestId: v.requestId,
    targetRequestStatus:
      REJECT_REGISTRATION_REQUEST_TARGET_REQUEST_STATUS,
  });
};

/** @param {unknown} value */
export const validateRejectRegistrationRequestResult = (value) => {
  if (!hasExactKeys(value, REJECT_REGISTRATION_REQUEST_RESULT_FIELDS)) {
    return invalid();
  }

  const v =
    /** @type {{
     * commandId: unknown,
     * correlationId: unknown,
     * operation: unknown,
     * resourceType: unknown,
     * resourceId: unknown,
     * status: unknown,
     * replayed: unknown
     * }} */
    (value);

  if (
    !validId(v.commandId) ||
    !validId(v.correlationId) ||
    v.operation !== REJECT_REGISTRATION_REQUEST_OPERATION ||
    v.resourceType !== REJECT_REGISTRATION_REQUEST_RESOURCE_TYPE ||
    !validId(v.resourceId) ||
    v.status !== "succeeded" ||
    typeof v.replayed !== "boolean"
  ) {
    return invalid();
  }

  return ok(value);
};
