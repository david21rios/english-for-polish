import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CAPABILITY_IDS, COURSE_STATUSES } from "../domain/index.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);
/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;
const invalid = () => Object.freeze({ ok: false, issue: Object.freeze({
  code: "INVALID_ARGUMENT", field: "archiveCourse", reason: "invalid_archive_course",
}) });

export const ARCHIVE_COURSE_INPUT_FIELDS = frozen([
  "commandId", "correlationId", "tenantId", "courseId", "expectedVersion",
]);
export const ARCHIVE_COURSE_RESULT_FIELDS = frozen([
  "commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed",
]);
export const ARCHIVE_COURSE_OPERATION = COMMAND_TYPES.ARCHIVE_COURSE;
export const ARCHIVE_COURSE_RESOURCE_TYPE = "course";
export const ARCHIVE_COURSE_REQUIRED_CAPABILITY = CAPABILITY_IDS.COURSE_ARCHIVE;
export const ARCHIVE_COURSE_AUDIT_OPERATION = "ArchiveCourse.archive";
export const ARCHIVE_COURSE_AUDIT_LEVEL = AUDIT_LEVELS.PRIVILEGED;
export const ARCHIVE_COURSE_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const ARCHIVE_COURSE_AUDIT_BEFORE_FIELDS = frozen(["courseExists", "courseStatus"]);
export const ARCHIVE_COURSE_AUDIT_AFTER_FIELDS = frozen(["courseStatus"]);
export const ARCHIVE_COURSE_AUDIT_METADATA_FIELDS = frozen(["stage", "expectedVersion"]);
export const ARCHIVE_COURSE_TARGET_STATUS = COURSE_STATUSES.ARCHIVED;

/** @param {unknown} value */
export const validateArchiveCourseInput = (value) => {
  if (!hasExactKeys(value, ARCHIVE_COURSE_INPUT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  if (!validId(candidate.commandId) || !validId(candidate.correlationId)
    || !validId(candidate.tenantId) || !validId(candidate.courseId)
    || typeof candidate.expectedVersion !== "number"
    || !Number.isInteger(candidate.expectedVersion) || candidate.expectedVersion < 1) return invalid();
  return Object.freeze({ ok: true, value });
};

/** @param {Record<string, unknown>} input */
export const archiveCourseBehavioralPayload = (input) => {
  const validation = validateArchiveCourseInput(input);
  if (!validation.ok) throw new TypeError("input is not a valid ArchiveCourse command.");
  return Object.freeze({
    tenantId: input.tenantId,
    courseId: input.courseId,
    expectedVersion: input.expectedVersion,
  });
};

/** @param {unknown} value */
export const validateArchiveCourseResult = (value) => {
  if (!hasExactKeys(value, ARCHIVE_COURSE_RESULT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return validId(candidate.commandId) && validId(candidate.correlationId)
    && candidate.operation === ARCHIVE_COURSE_OPERATION
    && candidate.resourceType === ARCHIVE_COURSE_RESOURCE_TYPE
    && validId(candidate.resourceId) && candidate.status === "succeeded"
    && typeof candidate.replayed === "boolean"
    ? Object.freeze({ ok: true, value }) : invalid();
};
