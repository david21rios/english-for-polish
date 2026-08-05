import {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES
} from "../../../domain/organization/enums.js";
import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  validateMembershipId,
  validateRequestId,
  validateUid
} from "../shared/index.js";
export { MEMBERSHIP_FIELDS, MEMBERSHIP_REQUIRED_FIELDS } from "@mipymetic/saas-contracts/persistence";
export const MEMBERSHIP_STATUS_VALUES = Object.freeze(Object.values(MEMBERSHIP_STATUSES));
export const MEMBERSHIP_ROLE_VALUES = Object.freeze(Object.values(MEMBERSHIP_ROLES));

const error = (message, input = false) => new RepositoryError({
  code: input ? REPOSITORY_ERROR_CODES.INVALID_ARGUMENT : REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: input ? "validate_membership_options" : "serialize_membership",
  resource: "membership"
});

export const validateMembershipStatus = (value, { input = false } = {}) => {
  if (!MEMBERSHIP_STATUS_VALUES.includes(value)) throw error("Membership status is invalid.", input);
  return value;
};
export const validateMembershipRole = (value, { input = false } = {}) => {
  if (!MEMBERSHIP_ROLE_VALUES.includes(value)) throw error("Membership role is invalid.", input);
  return value;
};

export const validateMembershipShape = (membership) => {
  validateUid(membership.uid);
  validateUid(membership.approvedBy);
  validateMembershipStatus(membership.status);
  validateMembershipRole(membership.role);
  if (membership.originRequestId !== null) validateRequestId(membership.originRequestId);

  if (membership.status === MEMBERSHIP_STATUSES.APPROVED && membership.removedAt !== null) {
    throw error("An approved Membership cannot have removedAt.");
  }
  if (membership.status === MEMBERSHIP_STATUSES.SUSPENDED &&
      (membership.suspendedAt === null || membership.removedAt !== null)) {
    throw error("A suspended Membership requires suspendedAt and cannot have removedAt.");
  }
  if (membership.status === MEMBERSHIP_STATUSES.REMOVED && membership.removedAt === null) {
    throw error("A removed Membership requires removedAt.");
  }
  validateMembershipId(membership.membershipId);
  return membership;
};
