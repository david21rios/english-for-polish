export {
  REPOSITORY_ERROR_CODES,
  RepositoryError,
  createRepositoryError,
  mapFirebaseError
} from "./errors/repositoryError.js";

export {
  SUPPORTED_IDENTIFIER_NAMES,
  assertTenantConsistency,
  validateCourseId,
  validateEnrollmentId,
  validateIdentifier,
  validateMembershipId,
  validateRequestId,
  validateTenantId,
  validateUid
} from "./validation/identifiers.js";

export {
  coursePath,
  enrollmentPath,
  identityPath,
  membershipKeyPath,
  membershipPath,
  registrationRequestKeyPath,
  registrationRequestPath,
  tenantBrandingPath,
  tenantPath,
  tenantSettingsPath
} from "./paths/firestorePaths.js";

export { timestampToIsoString } from "./serialization/timestamps.js";
export { serializeSnapshot } from "./serialization/snapshots.js";

export {
  createFirestoreRepositoryDependencies,
  requireFirestoreSdkFunction
} from "./dependencies/firestoreRepositoryDependencies.js";
