import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { CEFR_LEVELS, COURSE_STATUSES } from "../domain/course.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isCanonicalBcp47, isPlainObject } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);
/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;
/** @param {unknown} value */
const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();
const invalid = () => Object.freeze({ ok: false, issue: Object.freeze({
  code: "INVALID_ARGUMENT", field: "updateCourse", reason: "invalid_update_course",
}) });

export const UPDATE_COURSE_INPUT_FIELDS = frozen([
  "commandId", "correlationId", "tenantId", "courseId", "expectedVersion", "patch",
]);
export const UPDATE_COURSE_PATCH_FIELDS = frozen([
  "displayName", "description", "learningLanguage", "supportLanguageCode",
  "interfaceLanguages", "cefrLevel",
]);
export const UPDATE_COURSE_LEARNING_LANGUAGE_FIELDS = frozen(["languageCode", "displayName"]);
export const UPDATE_COURSE_INTERFACE_LANGUAGE_FIELDS = frozen(["locale", "displayName"]);
export const UPDATE_COURSE_RESULT_FIELDS = frozen([
  "commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed",
]);
export const UPDATE_COURSE_OPERATION = COMMAND_TYPES.UPDATE_COURSE;
export const UPDATE_COURSE_RESOURCE_TYPE = "course";
export const UPDATE_COURSE_REQUIRED_CAPABILITY = "course.update";
export const UPDATE_COURSE_AUDIT_OPERATION = "UpdateCourse.update";
export const UPDATE_COURSE_AUDIT_LEVEL = AUDIT_LEVELS.PRIVILEGED;
export const UPDATE_COURSE_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const UPDATE_COURSE_AUDIT_BEFORE_FIELDS = frozen(["courseExists", "courseStatus"]);
export const UPDATE_COURSE_AUDIT_AFTER_FIELDS = frozen(["courseStatus"]);
export const UPDATE_COURSE_AUDIT_METADATA_FIELDS = frozen([
  "stage", "changedFieldCount", "expectedVersion",
]);

/** @param {unknown} value */
const validLearningLanguage = (value) => {
  if (!hasExactKeys(value, UPDATE_COURSE_LEARNING_LANGUAGE_FIELDS)) return false;
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return isCanonicalBcp47(candidate.languageCode) && text(candidate.displayName);
};

/** @param {unknown} value */
const validInterfaceLanguages = (value) => {
  if (!Array.isArray(value) || value.length < 1) return false;
  const locales = new Set();
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) return false;
    const item = value[index];
    if (!hasExactKeys(item, UPDATE_COURSE_INTERFACE_LANGUAGE_FIELDS)) return false;
    const candidate = /** @type {Record<string, unknown>} */ (item);
    if (!isCanonicalBcp47(candidate.locale) || !text(candidate.displayName)
      || locales.has(candidate.locale)) return false;
    locales.add(/** @type {string} */ (candidate.locale));
  }
  return true;
};

/** @param {unknown} patch */
const validPatch = (patch) => {
  if (!isPlainObject(patch)) return false;
  const keys = Object.keys(patch);
  if (keys.length < 1 || keys.some((key) => !UPDATE_COURSE_PATCH_FIELDS.includes(key))) return false;
  if (Object.hasOwn(patch, "displayName") && !text(patch.displayName)) return false;
  if (Object.hasOwn(patch, "description") && !text(patch.description)) return false;
  if (Object.hasOwn(patch, "learningLanguage") && !validLearningLanguage(patch.learningLanguage)) return false;
  if (Object.hasOwn(patch, "supportLanguageCode") && !isCanonicalBcp47(patch.supportLanguageCode)) return false;
  if (Object.hasOwn(patch, "interfaceLanguages") && !validInterfaceLanguages(patch.interfaceLanguages)) return false;
  if (Object.hasOwn(patch, "cefrLevel")
    && !Object.values(CEFR_LEVELS).includes(/** @type {never} */ (patch.cefrLevel))) return false;
  return true;
};

/** @param {unknown} value */
export const validateUpdateCourseInput = (value) => {
  if (!hasExactKeys(value, UPDATE_COURSE_INPUT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  if (!validId(candidate.commandId) || !validId(candidate.correlationId)
    || !validId(candidate.tenantId) || !validId(candidate.courseId)) return invalid();
  if (typeof candidate.expectedVersion !== "number"
    || !Number.isInteger(candidate.expectedVersion) || candidate.expectedVersion < 1) return invalid();
  return validPatch(candidate.patch) ? Object.freeze({ ok: true, value }) : invalid();
};

/** @param {Record<string, unknown>} patch */
const clonePatch = (patch) => {
  /** @type {Record<string, unknown>} */
  const copy = {};
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (key === "learningLanguage") copy[key] = Object.freeze(
      { .../** @type {Record<string, unknown>} */ (value) },
    );
    else if (key === "interfaceLanguages") copy[key] = Object.freeze(
      /** @type {Array<Record<string, unknown>>} */ (value)
        .map((item) => Object.freeze({ ...item })),
    );
    else copy[key] = value;
  }
  return Object.freeze(copy);
};

/** @param {Record<string, unknown>} input */
export const updateCourseBehavioralPayload = (input) => {
  const validation = validateUpdateCourseInput(input);
  if (!validation.ok) throw new TypeError("input is not a valid UpdateCourse command.");
  const candidate = /** @type {Record<string, unknown>} */ (input);
  return Object.freeze({
    tenantId: candidate.tenantId,
    courseId: candidate.courseId,
    expectedVersion: candidate.expectedVersion,
    patch: clonePatch(/** @type {Record<string, unknown>} */ (candidate.patch)),
  });
};

/** @param {unknown} value */
export const validateUpdateCourseResult = (value) => {
  if (!hasExactKeys(value, UPDATE_COURSE_RESULT_FIELDS)) return invalid();
  const candidate = /** @type {Record<string, unknown>} */ (value);
  return validId(candidate.commandId) && validId(candidate.correlationId)
    && candidate.operation === UPDATE_COURSE_OPERATION
    && candidate.resourceType === UPDATE_COURSE_RESOURCE_TYPE
    && validId(candidate.resourceId) && candidate.status === "succeeded"
    && typeof candidate.replayed === "boolean"
    ? Object.freeze({ ok: true, value }) : invalid();
};

export const UPDATE_COURSE_ALLOWED_LIFECYCLE_STATUSES = frozen([
  COURSE_STATUSES.DRAFT, COURSE_STATUSES.ACTIVE,
]);
