import { COURSE_STATUSES, CEFR_LEVELS } from "../../../domain/academic/enums.js";
import { REPOSITORY_ERROR_CODES, RepositoryError, validateCourseId } from "../shared/index.js";
export { COURSE_FIELDS, COURSE_REQUIRED_FIELDS } from "@mipymetic/saas-contracts/persistence";
export const COURSE_STATUS_VALUES = Object.freeze(Object.values(COURSE_STATUSES));
export const COURSE_CEFR_VALUES = Object.freeze(Object.values(CEFR_LEVELS));

const issue = (message, input = false) => new RepositoryError({
  code: input ? REPOSITORY_ERROR_CODES.INVALID_ARGUMENT : REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: input ? "validate_course_options" : "serialize_course",
  resource: "course"
});
export const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, keys) => isPlainObject(value) && Object.keys(value).length === keys.length &&
  keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

export const validateNonBlankString = (value, field, { input = false } = {}) => {
  if (typeof value !== "string" || value.trim().length === 0) throw issue(`${field} must be a non-empty string.`, input);
  return value;
};

export const validateBcp47 = (value, field, { input = false } = {}) => {
  validateNonBlankString(value, field, { input });
  if (value !== value.trim()) throw issue(`${field} must not contain surrounding whitespace.`, input);
  let canonical;
  try { [canonical] = Intl.getCanonicalLocales([value]); } catch { throw issue(`${field} must be canonical BCP 47.`, input); }
  if (canonical !== value) throw issue(`${field} must be canonical BCP 47.`, input);
  return value;
};

export const validateCourseStatus = (value, { input = false } = {}) => {
  if (!COURSE_STATUS_VALUES.includes(value)) throw issue("Course status is invalid.", input);
  return value;
};
export const validateCefrLevel = (value) => {
  if (!COURSE_CEFR_VALUES.includes(value)) throw issue("Course CEFR level is invalid.");
  return value;
};

export const copyLearningLanguage = (value) => {
  if (!exact(value, ["languageCode", "displayName"])) throw issue("Course learningLanguage shape is invalid.");
  const result = {
    languageCode: validateBcp47(value.languageCode, "learningLanguage.languageCode"),
    displayName: validateNonBlankString(value.displayName, "learningLanguage.displayName")
  };
  return Object.freeze(result);
};

export const copyInterfaceLanguages = (value) => {
  if (!Array.isArray(value) || value.length === 0 || Object.keys(value).length !== value.length) {
    throw issue("Course interfaceLanguages must be a non-empty dense array.");
  }
  const seen = new Set();
  const result = value.map((entry) => {
    if (!exact(entry, ["locale", "displayName"])) throw issue("Course interface language shape is invalid.");
    const locale = validateBcp47(entry.locale, "interfaceLanguages.locale");
    const key = locale.toLocaleLowerCase("en-US");
    if (seen.has(key)) throw issue("Course interfaceLanguages contains duplicate locales.");
    seen.add(key);
    return Object.freeze({ locale, displayName: validateNonBlankString(entry.displayName, "interfaceLanguages.displayName") });
  });
  return Object.freeze(result);
};

export const validateCourseLifecycle = (course) => {
  validateCourseStatus(course.status);
  if ((course.status === COURSE_STATUSES.DRAFT || course.status === COURSE_STATUSES.ACTIVE) && course.archivedAt !== null) {
    throw issue("A non-archived Course requires null archivedAt.");
  }
  if (course.status === COURSE_STATUSES.ARCHIVED && course.archivedAt === null) {
    throw issue("An archived Course requires archivedAt.");
  }
  validateCourseId(course.courseId);
  return course;
};
