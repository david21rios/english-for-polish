import {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  serializeSnapshot,
  timestampToIsoString,
  validateMembershipId,
  validateTenantId,
  validateUid
} from "../shared/index.js";
import {
  MEMBERSHIP_FIELDS,
  MEMBERSHIP_REQUIRED_FIELDS,
  validateMembershipShape
} from "./membershipValidation.js";

const mismatch = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_membership",
  resource: "membership"
});
const timestamp = (data, field, allowNull = false) => timestampToIsoString(data[field], {
  allowNull,
  fieldName: `membership.${field}`
});

export const serializeMembership = (snapshot, context = {}) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: MEMBERSHIP_FIELDS,
    requiredFields: MEMBERSHIP_REQUIRED_FIELDS,
    resource: "membership"
  });
  const documentMembershipId = validateMembershipId(serialized.id);
  validateMembershipId(serialized.data.membershipId);
  validateTenantId(serialized.data.tenantId);
  validateUid(serialized.data.uid);
  if (serialized.data.membershipId !== documentMembershipId) {
    throw mismatch("Membership membershipId does not match its document ID.");
  }
  if (context.expectedTenantId !== undefined) {
    validateTenantId(context.expectedTenantId);
    if (serialized.data.tenantId !== context.expectedTenantId) {
      throw mismatch("Membership tenantId does not match the expected Tenant.");
    }
  }
  if (context.expectedUid !== undefined) {
    validateUid(context.expectedUid);
    if (serialized.data.uid !== context.expectedUid) {
      throw mismatch("Membership uid does not match the expected Identity.");
    }
  }
  return Object.freeze(validateMembershipShape({
    ...serialized.data,
    createdAt: timestamp(serialized.data, "createdAt"),
    approvedAt: timestamp(serialized.data, "approvedAt"),
    updatedAt: timestamp(serialized.data, "updatedAt"),
    suspendedAt: timestamp(serialized.data, "suspendedAt", true),
    removedAt: timestamp(serialized.data, "removedAt", true)
  }));
};
