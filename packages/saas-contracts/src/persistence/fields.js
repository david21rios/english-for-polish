const frozen = (values) => Object.freeze(values);

export const IDENTITY_FIELDS = frozen(["uid", "email", "displayName", "photoURL", "emailVerified", "interfaceLocale", "createdAt", "updatedAt"]);
export const IDENTITY_REQUIRED_FIELDS = IDENTITY_FIELDS;
export const IDENTITY_PROFILE_UPDATE_FIELDS = frozen(["displayName", "photoURL"]);

export const TENANT_FIELDS = frozen(["tenantId", "tenantType", "displayName", "shortName", "country", "locale", "timezone", "status", "createdAt", "updatedAt", "suspendedAt", "archivedAt"]);
export const TENANT_REQUIRED_FIELDS = frozen(["tenantId", "tenantType", "displayName", "shortName", "country", "locale", "timezone", "status", "createdAt", "updatedAt"]);

export const REGISTRATION_REQUEST_FIELDS = frozen(["requestId", "tenantId", "uid", "requestedRole", "status", "requestedAt", "reviewedAt", "reviewedBy", "approvedMembershipId", "cancelledAt", "expiredAt"]);
export const REGISTRATION_REQUEST_REQUIRED_FIELDS = frozen(["requestId", "tenantId", "uid", "requestedRole", "status", "requestedAt"]);

export const MEMBERSHIP_FIELDS = frozen(["membershipId", "tenantId", "uid", "role", "status", "originRequestId", "createdAt", "approvedAt", "approvedBy", "updatedAt", "suspendedAt", "removedAt"]);
export const MEMBERSHIP_REQUIRED_FIELDS = MEMBERSHIP_FIELDS;

export const COURSE_FIELDS = frozen(["courseId", "tenantId", "displayName", "description", "learningLanguage", "supportLanguageCode", "interfaceLanguages", "cefrLevel", "status", "createdAt", "updatedAt", "archivedAt"]);
export const COURSE_REQUIRED_FIELDS = COURSE_FIELDS;

export const ENROLLMENT_FIELDS = frozen(["enrollmentId", "tenantId", "membershipId", "courseId", "status", "enrolledAt", "updatedAt", "completedAt", "cancelledAt"]);
export const ENROLLMENT_REQUIRED_FIELDS = ENROLLMENT_FIELDS;
