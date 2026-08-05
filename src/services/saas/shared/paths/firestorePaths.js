import {
  validateCourseId,
  validateEnrollmentId,
  validateMembershipId,
  validateRequestId,
  validateTenantId,
  validateUid
} from "../validation/identifiers.js";
import {
  courseDocumentPath,
  enrollmentDocumentPath,
  identityDocumentPath,
  membershipDocumentPath,
  membershipKeyDocumentPath,
  registrationRequestDocumentPath,
  registrationRequestKeyDocumentPath,
  tenantBrandingDocumentPath,
  tenantDocumentPath,
  tenantSettingsDocumentPath
} from "@mipymetic/saas-contracts/persistence";

export const identityPath = (uid) => identityDocumentPath(validateUid(uid));

export const tenantPath = (tenantId) => tenantDocumentPath(validateTenantId(tenantId));

export const tenantSettingsPath = (tenantId) =>
  tenantSettingsDocumentPath(validateTenantId(tenantId));

export const tenantBrandingPath = (tenantId) =>
  tenantBrandingDocumentPath(validateTenantId(tenantId));

export const registrationRequestPath = (tenantId, requestId) =>
  registrationRequestDocumentPath(validateTenantId(tenantId), validateRequestId(requestId));

export const registrationRequestKeyPath = (tenantId, uidKey) =>
  registrationRequestKeyDocumentPath(validateTenantId(tenantId), validateUid(uidKey));

export const membershipPath = (tenantId, membershipId) =>
  membershipDocumentPath(validateTenantId(tenantId), validateMembershipId(membershipId));

export const membershipKeyPath = (tenantId, uidKey) =>
  membershipKeyDocumentPath(validateTenantId(tenantId), validateUid(uidKey));

export const coursePath = (tenantId, courseId) =>
  courseDocumentPath(validateTenantId(tenantId), validateCourseId(courseId));

export const enrollmentPath = (tenantId, enrollmentId) =>
  enrollmentDocumentPath(validateTenantId(tenantId), validateEnrollmentId(enrollmentId));
