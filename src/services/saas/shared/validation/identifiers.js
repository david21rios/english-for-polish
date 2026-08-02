import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "../errors/repositoryError.js";

const IDENTIFIER_NAMES = Object.freeze([
  "uid",
  "tenantId",
  "requestId",
  "membershipId",
  "courseId",
  "enrollmentId"
]);

export const validateIdentifier = (value, identifierName = "identifier") => {
  if (typeof value !== "string") {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: `${identifierName} must be a string.`,
      operation: "validate_identifier",
      resource: identifierName
    });
  }

  const trimmedValue = value.trim();

  if (!trimmedValue || value.includes("/") || trimmedValue === "." || trimmedValue === "..") {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.INVALID_ARGUMENT,
      message: `${identifierName} is not a valid Firestore document identifier.`,
      operation: "validate_identifier",
      resource: identifierName
    });
  }

  return value;
};

export const validateUid = (value) => validateIdentifier(value, "uid");
export const validateTenantId = (value) => validateIdentifier(value, "tenantId");
export const validateRequestId = (value) => validateIdentifier(value, "requestId");
export const validateMembershipId = (value) => validateIdentifier(value, "membershipId");
export const validateCourseId = (value) => validateIdentifier(value, "courseId");
export const validateEnrollmentId = (value) => validateIdentifier(value, "enrollmentId");

export const assertTenantConsistency = (expectedTenantId, resourceTenantId) => {
  validateTenantId(expectedTenantId);
  validateTenantId(resourceTenantId);

  if (expectedTenantId !== resourceTenantId) {
    throw new RepositoryError({
      code: REPOSITORY_ERROR_CODES.CONTRACT_VIOLATION,
      message: "Resource tenantId does not match the expected tenantId.",
      operation: "validate_tenant_consistency",
      resource: "tenant"
    });
  }

  return resourceTenantId;
};

export const SUPPORTED_IDENTIFIER_NAMES = IDENTIFIER_NAMES;
