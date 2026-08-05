import { MEMBERSHIP_ROLES } from "../../../domain/organization/enums.js";
import { REGISTRATION_REQUEST_STATUSES } from "../../../domain/identity/enums.js";
import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateMembershipId,
  validateUid
} from "../shared/index.js";
export { REGISTRATION_REQUEST_FIELDS, REGISTRATION_REQUEST_REQUIRED_FIELDS } from "@mipymetic/saas-contracts/persistence";

export const REGISTRATION_REQUEST_STATUS_VALUES = Object.freeze(
  Object.values(REGISTRATION_REQUEST_STATUSES)
);
export const REGISTRATION_REQUEST_ROLE_VALUES = Object.freeze(
  Object.values(MEMBERSHIP_ROLES)
);

const violation = (message, operation = "serialize_registration_request") =>
  new RepositoryError({
    code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
    message,
    operation,
    resource: "registration_request"
  });

const isNullish = (value) => value === undefined || value === null;
const requireNullish = (value, field, status) => {
  if (!isNullish(value)) {
    throw violation(`RegistrationRequest ${field} is invalid for status ${status}.`);
  }
};

export const validateRegistrationRequestStatus = (
  status,
  { input = false } = {}
) => {
  if (!REGISTRATION_REQUEST_STATUS_VALUES.includes(status)) {
    throw new RepositoryError({
      code: input
        ? REPOSITORY_ERROR_CODES.INVALID_ARGUMENT
        : REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: "RegistrationRequest status is not supported by Domain 1.2.0.",
      operation: input ? "validate_registration_request_options" : "serialize_registration_request",
      resource: "registration_request"
    });
  }
  return status;
};

export const validateRegistrationRequestShape = (request) => {
  validateUid(request.uid);
  validateRegistrationRequestStatus(request.status);

  if (!REGISTRATION_REQUEST_ROLE_VALUES.includes(request.requestedRole)) {
    throw violation("RegistrationRequest requestedRole is not supported by Domain 1.2.0.");
  }

  const { status } = request;
  if (status === REGISTRATION_REQUEST_STATUSES.PENDING) {
    for (const field of ["reviewedAt", "reviewedBy", "approvedMembershipId", "cancelledAt", "expiredAt"]) {
      requireNullish(request[field], field, status);
    }
  }

  if (status === REGISTRATION_REQUEST_STATUSES.APPROVED) {
    if (isNullish(request.reviewedAt) || isNullish(request.reviewedBy) ||
        isNullish(request.approvedMembershipId)) {
      throw violation("An approved RegistrationRequest requires review and Membership outcome fields.");
    }
    validateUid(request.reviewedBy);
    validateMembershipId(request.approvedMembershipId);
    requireNullish(request.cancelledAt, "cancelledAt", status);
    requireNullish(request.expiredAt, "expiredAt", status);
  }

  if (status === REGISTRATION_REQUEST_STATUSES.REJECTED) {
    if (isNullish(request.reviewedAt) || isNullish(request.reviewedBy)) {
      throw violation("A rejected RegistrationRequest requires institutional review fields.");
    }
    validateUid(request.reviewedBy);
    requireNullish(request.approvedMembershipId, "approvedMembershipId", status);
    requireNullish(request.cancelledAt, "cancelledAt", status);
    requireNullish(request.expiredAt, "expiredAt", status);
  }

  if (status === REGISTRATION_REQUEST_STATUSES.CANCELLED) {
    if (isNullish(request.cancelledAt)) {
      throw violation("A cancelled RegistrationRequest requires cancelledAt.");
    }
    for (const field of ["reviewedAt", "reviewedBy", "approvedMembershipId", "expiredAt"]) {
      requireNullish(request[field], field, status);
    }
  }

  if (status === REGISTRATION_REQUEST_STATUSES.EXPIRED) {
    if (isNullish(request.expiredAt)) {
      throw violation("An expired RegistrationRequest requires expiredAt.");
    }
    for (const field of ["reviewedAt", "reviewedBy", "approvedMembershipId", "cancelledAt"]) {
      requireNullish(request[field], field, status);
    }
  }

  return request;
};
