import {
  REPOSITORY_ERROR_CODES, RepositoryError, serializeSnapshot, timestampToIsoString,
  validateCourseId, validateEnrollmentId, validateMembershipId, validateTenantId
} from "../shared/index.js";
import {
  ENROLLMENT_FIELDS, ENROLLMENT_REQUIRED_FIELDS, validateEnrollmentLifecycle
} from "./enrollmentValidation.js";

const mismatch = (message) => new RepositoryError({
  code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
  message,
  operation: "serialize_enrollment",
  resource: "enrollment"
});
const timestamp = (data, field, allowNull = false) => timestampToIsoString(data[field], {
  allowNull, fieldName: `enrollment.${field}`
});

export const serializeEnrollment = (snapshot, context = {}) => {
  const serialized = serializeSnapshot(snapshot, {
    allowedFields: ENROLLMENT_FIELDS,
    requiredFields: ENROLLMENT_REQUIRED_FIELDS,
    resource: "enrollment"
  });
  const path = snapshot?.ref?.path;
  const parts = typeof path === "string" ? path.split("/") : [];
  if (parts.length !== 4 || parts[0] !== "tenants" || parts[2] !== "enrollments" ||
      path.startsWith("/") || path.endsWith("/")) {
    throw mismatch("Enrollment snapshot path is not canonical.");
  }
  const pathTenantId = validateTenantId(parts[1]);
  const pathEnrollmentId = validateEnrollmentId(parts[3]);
  const documentEnrollmentId = validateEnrollmentId(serialized.id);
  const dataEnrollmentId = validateEnrollmentId(serialized.data.enrollmentId);
  const dataTenantId = validateTenantId(serialized.data.tenantId);
  const membershipId = validateMembershipId(serialized.data.membershipId);
  validateCourseId(serialized.data.courseId);
  if (documentEnrollmentId !== dataEnrollmentId || pathEnrollmentId !== documentEnrollmentId) {
    throw mismatch("Enrollment ID does not match its document path.");
  }
  if (pathTenantId !== dataTenantId) throw mismatch("Enrollment tenantId does not match its document path.");
  if (context.expectedEnrollmentId !== undefined &&
      validateEnrollmentId(context.expectedEnrollmentId) !== documentEnrollmentId) {
    throw mismatch("Enrollment ID does not match the expected Enrollment.");
  }
  if (context.expectedTenantId !== undefined && validateTenantId(context.expectedTenantId) !== dataTenantId) {
    throw mismatch("Enrollment tenantId does not match the expected Tenant.");
  }
  if (context.expectedMembershipId !== undefined &&
      validateMembershipId(context.expectedMembershipId) !== membershipId) {
    throw mismatch("Enrollment membershipId does not match the expected Membership.");
  }
  const result = {
    ...serialized.data,
    enrolledAt: timestamp(serialized.data, "enrolledAt"),
    updatedAt: timestamp(serialized.data, "updatedAt"),
    completedAt: timestamp(serialized.data, "completedAt", true),
    cancelledAt: timestamp(serialized.data, "cancelledAt", true)
  };
  return Object.freeze(validateEnrollmentLifecycle(result));
};
