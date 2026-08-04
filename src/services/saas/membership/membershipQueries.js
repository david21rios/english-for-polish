import { REPOSITORY_ERROR_CODES, RepositoryError } from "../shared/index.js";
import { validateMembershipRole, validateMembershipStatus } from "./membershipValidation.js";

export const MIN_PAGE_SIZE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
const invalid = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
  message,
  operation: "validate_membership_options",
  resource: "membership_collection"
});
const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export const validateMembershipListOptions = (options) => {
  if (options === undefined) options = {};
  if (!isPlainObject(options)) throw invalid("Membership list options must be a plain object.");
  const keys = Object.keys(options);
  if (keys.some((key) => !["status", "role", "pageSize", "cursor"].includes(key)) ||
      keys.some((key) => options[key] === undefined)) {
    throw invalid("Membership list options contain unknown or undefined fields.");
  }
  const status = options.status === undefined ? null : validateMembershipStatus(options.status, { input: true });
  const role = options.role === undefined ? null : validateMembershipRole(options.role, { input: true });
  const pageSize = options.pageSize === undefined ? DEFAULT_PAGE_SIZE : options.pageSize;
  if (!Number.isInteger(pageSize) || pageSize < MIN_PAGE_SIZE || pageSize > MAX_PAGE_SIZE) {
    throw invalid("Membership pageSize must be an integer from 1 through 50.");
  }
  const cursor = options.cursor === undefined ? null : options.cursor;
  if (cursor !== null && (typeof cursor !== "string" || cursor.trim().length === 0)) {
    throw invalid("Membership cursor must be a non-empty string or null.");
  }
  return Object.freeze({ status, role, pageSize, cursor });
};

export const membershipsCollectionPath = (tenantId) => `tenants/${tenantId}/memberships`;
