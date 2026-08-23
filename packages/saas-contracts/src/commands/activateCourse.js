import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CAPABILITY_IDS, COURSE_STATUSES } from "../domain/index.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isPlainObject } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);
/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;
const invalid = () => Object.freeze({ ok: false, issue: Object.freeze({
  code: "INVALID_ARGUMENT", field: "activateCourse", reason: "invalid_activate_course",
}) });

export const ACTIVATE_COURSE_INPUT_FIELDS = frozen([
  "commandId", "correlationId", "tenantId", "courseId", "expectedVersion",
]);
export const ACTIVATE_COURSE_RESULT_FIELDS = frozen([
  "commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed",
]);
export const ACTIVATE_COURSE_OPERATION = COMMAND_TYPES.ACTIVATE_COURSE;
export const ACTIVATE_COURSE_RESOURCE_TYPE = "course";
export const ACTIVATE_COURSE_REQUIRED_CAPABILITY = CAPABILITY_IDS.COURSE_ACTIVATE;
export const ACTIVATE_COURSE_AUDIT_OPERATION = "ActivateCourse.activate";
export const ACTIVATE_COURSE_AUDIT_LEVEL = AUDIT_LEVELS.PRIVILEGED;
export const ACTIVATE_COURSE_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const ACTIVATE_COURSE_AUDIT_BEFORE_FIELDS = frozen(["courseExists", "courseStatus"]);
export const ACTIVATE_COURSE_AUDIT_AFTER_FIELDS = frozen(["courseStatus"]);
export const ACTIVATE_COURSE_AUDIT_METADATA_FIELDS = frozen(["stage", "expectedVersion"]);
export const ACTIVATE_COURSE_TARGET_STATUS = COURSE_STATUSES.ACTIVE;

/** @param {unknown} value */
export const validateActivateCourseInput = (value) => {
  if (!hasExactKeys(value, ACTIVATE_COURSE_INPUT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  if (!validId(candidate.commandId) || !validId(candidate.correlationId)
    || !validId(candidate.tenantId) || !validId(candidate.courseId)
    || typeof candidate.expectedVersion !== "number"
    || !Number.isInteger(candidate.expectedVersion) || candidate.expectedVersion < 1) return invalid();
  return Object.freeze({ ok: true, value });
};

/** @param {Record<string, unknown>} input */
export const activateCourseBehavioralPayload = (input) => {
  const validation = validateActivateCourseInput(input);
  if (!validation.ok) throw new TypeError("input is not a valid ActivateCourse command.");
  const candidate = /** @type {Record<string, unknown>} */ (input);
  return Object.freeze({
    tenantId: candidate.tenantId,
    courseId: candidate.courseId,
    expectedVersion: candidate.expectedVersion,
  });
};

/** @param {unknown} value */
export const validateActivateCourseResult = (value) => {
  if (!hasExactKeys(value, ACTIVATE_COURSE_RESULT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return validId(candidate.commandId) && validId(candidate.correlationId)
    && candidate.operation === ACTIVATE_COURSE_OPERATION
    && candidate.resourceType === ACTIVATE_COURSE_RESOURCE_TYPE
    && validId(candidate.resourceId) && candidate.status === "succeeded"
    && typeof candidate.replayed === "boolean"
    ? Object.freeze({ ok: true, value }) : invalid();
};
