import { CAPABILITY_IDS } from "../domain/capabilities.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);
/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;
const invalid = () => Object.freeze({ ok: false, issue: Object.freeze({ code: "INVALID_ARGUMENT", field: "createEnrollment", reason: "invalid_create_enrollment" }) });

export const CREATE_ENROLLMENT_INPUT_FIELDS = frozen(["commandId", "correlationId", "tenantId", "membershipId", "courseId"]);
export const CREATE_ENROLLMENT_RESULT_FIELDS = frozen(["enrollmentId"]);
export const CREATE_ENROLLMENT_OPERATION = COMMAND_TYPES.CREATE_ENROLLMENT;
export const CREATE_ENROLLMENT_RESOURCE_TYPE = "enrollment";
export const CREATE_ENROLLMENT_REQUIRED_CAPABILITY = CAPABILITY_IDS.ENROLLMENT_CREATE;
export const CREATE_ENROLLMENT_AUDIT_OPERATION = "CreateEnrollment.create";

/** @param {unknown} value */
export const validateCreateEnrollmentInput = (value) => {
  if (!hasExactKeys(value, CREATE_ENROLLMENT_INPUT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return validId(candidate.commandId) && validId(candidate.correlationId) && validId(candidate.tenantId)
    && validId(candidate.membershipId) && validId(candidate.courseId)
    ? Object.freeze({ ok: true, value }) : invalid();
};

/** @param {Record<string, unknown>} input */
export const createEnrollmentBehavioralPayload = (input) => {
  const validation = validateCreateEnrollmentInput(input);
  if (!validation.ok) throw new TypeError("input is not a valid CreateEnrollment command.");
  return Object.freeze({ tenantId: input.tenantId, membershipId: input.membershipId, courseId: input.courseId });
};

/** @param {unknown} value */
export const validateCreateEnrollmentResult = (value) => {
  if (!hasExactKeys(value, CREATE_ENROLLMENT_RESULT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return validId(candidate.enrollmentId) ? Object.freeze({ ok: true, value }) : invalid();
};
