import { REPOSITORY_ERROR_CODES, RepositoryError } from "../shared/index.js";
import { isPlainObject, validateBcp47, validateCourseStatus } from "./courseValidation.js";

export const MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const coursesCollectionPath = (tenantId) => `tenants/${tenantId}/courses`;

const invalid = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation: "validate_course_options",
  resource: "course_collection"
});
const base = (options, allowed) => {
  if (options === undefined) options = {};
  if (!isPlainObject(options)) throw invalid("Course list options must be a plain object.");
  const keys = Object.keys(options);
  if (keys.some((key) => !allowed.includes(key)) || keys.some((key) => options[key] === undefined)) {
    throw invalid("Course list options contain unknown or undefined fields.");
  }
  const pageSize = options.pageSize === undefined ? DEFAULT_PAGE_SIZE : options.pageSize;
  if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
    throw invalid("Course pageSize must be an integer from 1 through 50.");
  }
  const cursor = options.cursor === undefined ? null : options.cursor;
  if (options.cursor !== undefined && (typeof cursor !== "string" || cursor.trim().length === 0)) {
    throw invalid("Course cursor must be a non-empty string when present.");
  }
  return { options, pageSize, cursor };
};

export const validateCatalogOptions = (options) => {
  const parsed = base(options, ["learningLanguageCode", "supportLanguageCode", "pageSize", "cursor"]);
  const learningLanguageCode = parsed.options.learningLanguageCode === undefined ? null
    : validateBcp47(parsed.options.learningLanguageCode, "learningLanguageCode", { input: true });
  const supportLanguageCode = parsed.options.supportLanguageCode === undefined ? null
    : validateBcp47(parsed.options.supportLanguageCode, "supportLanguageCode", { input: true });
  return Object.freeze({ learningLanguageCode, supportLanguageCode, pageSize: parsed.pageSize, cursor: parsed.cursor });
};

export const validateAdminOptions = (options) => {
  const parsed = base(options, ["status", "pageSize", "cursor"]);
  const status = parsed.options.status === undefined ? null
    : validateCourseStatus(parsed.options.status, { input: true });
  return Object.freeze({ status, pageSize: parsed.pageSize, cursor: parsed.cursor });
};
