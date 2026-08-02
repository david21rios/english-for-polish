import { REPOSITORY_ERROR_CODES, RepositoryError } from "../shared/index.js";
import { validateRegistrationRequestStatus } from "./registrationRequestValidation.js";

export const MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

const invalid = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation: "validate_registration_request_options",
  resource: "registration_request_collection"
});
const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export const validateRegistrationRequestListOptions = (options) => {
  if (options === undefined) options = {};
  if (!isPlainObject(options)) throw invalid("RegistrationRequest list options must be a plain object.");
  const unknown = Object.keys(options).filter((key) => !["status", "pageSize", "cursor"].includes(key));
  if (unknown.length) throw invalid("RegistrationRequest list options contain unknown fields.");
  const status = options.status === undefined ? null : validateRegistrationRequestStatus(options.status, { input: true });
  const pageSize = options.pageSize === undefined ? DEFAULT_PAGE_SIZE : options.pageSize;
  if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
    throw invalid("RegistrationRequest pageSize must be an integer from 1 through 50.");
  }
  const cursor = options.cursor === undefined ? null : options.cursor;
  if (cursor !== null && (typeof cursor !== "string" || cursor.trim().length === 0)) {
    throw invalid("RegistrationRequest cursor must be a non-empty string or null.");
  }
  return Object.freeze({ status, pageSize, cursor });
};

export const registrationRequestsCollectionPath = (tenantId) =>
  `tenants/${tenantId}/registrationRequests`;
