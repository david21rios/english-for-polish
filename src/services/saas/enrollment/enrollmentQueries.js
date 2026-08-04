import { REPOSITORY_ERROR_CODES, RepositoryError } from "../shared/index.js";
import { isPlainObject, validateEnrollmentStatus } from "./enrollmentValidation.js";

export const MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const enrollmentsCollectionPath = (tenantId) => `tenants/${tenantId}/enrollments`;

const invalid = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation: "validate_enrollment_options",
  resource: "enrollment_collection"
});

export const validateEnrollmentOptions = (options) => {
  if (options === undefined) options = {};
  if (!isPlainObject(options)) throw invalid("Enrollment list options must be a plain object.");
  const allowed = ["status", "pageSize", "cursor"];
  const keys = Object.keys(options);
  if (keys.some((key) => !allowed.includes(key)) || keys.some((key) => options[key] === undefined)) {
    throw invalid("Enrollment list options contain unknown or undefined fields.");
  }
  const status = options.status === undefined ? null : validateEnrollmentStatus(options.status, { input: true });
  const pageSize = options.pageSize === undefined ? DEFAULT_PAGE_SIZE : options.pageSize;
  if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
    throw invalid("Enrollment pageSize must be an integer from 1 through 50.");
  }
  const cursor = options.cursor === undefined ? null : options.cursor;
  if (options.cursor !== undefined && (typeof cursor !== "string" || cursor.trim().length === 0)) {
    throw invalid("Enrollment cursor must be a non-empty string when present.");
  }
  return Object.freeze({ status, pageSize, cursor });
};
