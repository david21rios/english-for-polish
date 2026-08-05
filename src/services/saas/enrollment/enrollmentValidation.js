import { ENROLLMENT_STATUSES } from "../../../domain/academic/enums.js";
import { REPOSITORY_ERROR_CODES, RepositoryError } from "../shared/index.js";
export { ENROLLMENT_FIELDS, ENROLLMENT_REQUIRED_FIELDS } from "@mipymetic/saas-contracts/persistence";
export const ENROLLMENT_STATUS_VALUES = Object.freeze(Object.values(ENROLLMENT_STATUSES));

const issue = (message, input = false) => new RepositoryError({
  code: input ? REPOSITORY_ERROR_CODES.INVALID_ARGUMENT : REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: input ? "validate_enrollment_options" : "serialize_enrollment",
  resource: "enrollment"
});

export const isPlainObject = (value) => value !== null && typeof value === "object" &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export const validateEnrollmentStatus = (value, { input = false } = {}) => {
  if (!ENROLLMENT_STATUS_VALUES.includes(value)) throw issue("Enrollment status is invalid.", input);
  return value;
};

export const validateEnrollmentLifecycle = (enrollment) => {
  validateEnrollmentStatus(enrollment.status);
  const completed = enrollment.completedAt !== null;
  const cancelled = enrollment.cancelledAt !== null;
  if (enrollment.status === ENROLLMENT_STATUSES.COMPLETED) {
    if (!completed || cancelled) throw issue("Completed Enrollment lifecycle is invalid.");
  } else if (enrollment.status === ENROLLMENT_STATUSES.CANCELLED) {
    if (completed || !cancelled) throw issue("Cancelled Enrollment lifecycle is invalid.");
  } else if (completed || cancelled) {
    throw issue("Non-terminal Enrollment lifecycle is invalid.");
  }
  return enrollment;
};
