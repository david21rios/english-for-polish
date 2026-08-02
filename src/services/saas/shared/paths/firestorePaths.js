import {
  validateCourseId,
  validateEnrollmentId,
  validateMembershipId,
  validateRequestId,
  validateTenantId,
  validateUid
} from "../validation/identifiers.js";

export const identityPath = (uid) => `identities/${validateUid(uid)}`;

export const tenantPath = (tenantId) => `tenants/${validateTenantId(tenantId)}`;

export const tenantSettingsPath = (tenantId) =>
  `${tenantPath(tenantId)}/configuration/settings`;

export const tenantBrandingPath = (tenantId) =>
  `${tenantPath(tenantId)}/configuration/branding`;

export const registrationRequestPath = (tenantId, requestId) =>
  `${tenantPath(tenantId)}/registrationRequests/${validateRequestId(requestId)}`;

export const registrationRequestKeyPath = (tenantId, uidKey) =>
  `${tenantPath(tenantId)}/registrationRequestKeys/${validateUid(uidKey)}`;

export const membershipPath = (tenantId, membershipId) =>
  `${tenantPath(tenantId)}/memberships/${validateMembershipId(membershipId)}`;

export const membershipKeyPath = (tenantId, uidKey) =>
  `${tenantPath(tenantId)}/membershipKeys/${validateUid(uidKey)}`;

export const coursePath = (tenantId, courseId) =>
  `${tenantPath(tenantId)}/courses/${validateCourseId(courseId)}`;

export const enrollmentPath = (tenantId, enrollmentId) =>
  `${tenantPath(tenantId)}/enrollments/${validateEnrollmentId(enrollmentId)}`;
