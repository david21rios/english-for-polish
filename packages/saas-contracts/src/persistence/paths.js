import { isDocumentIdentifier } from "../validation/identifiers.js";

const segment = (value, name) => {
  if (!isDocumentIdentifier(value)) throw new TypeError(`${name} is not a valid document identifier.`);
  return value;
};

export const identityDocumentPath = (uid) => `identities/${segment(uid, "uid")}`;
export const tenantDocumentPath = (tenantId) => `tenants/${segment(tenantId, "tenantId")}`;
export const tenantSettingsDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/configuration/settings`;
export const tenantBrandingDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/configuration/branding`;
export const registrationRequestDocumentPath = (tenantId, requestId) => `${tenantDocumentPath(tenantId)}/registrationRequests/${segment(requestId, "requestId")}`;
export const registrationRequestKeyDocumentPath = (tenantId, uidKey) => `${tenantDocumentPath(tenantId)}/registrationRequestKeys/${segment(uidKey, "uidKey")}`;
export const membershipDocumentPath = (tenantId, membershipId) => `${tenantDocumentPath(tenantId)}/memberships/${segment(membershipId, "membershipId")}`;
export const membershipKeyDocumentPath = (tenantId, uidKey) => `${tenantDocumentPath(tenantId)}/membershipKeys/${segment(uidKey, "uidKey")}`;
export const courseDocumentPath = (tenantId, courseId) => `${tenantDocumentPath(tenantId)}/courses/${segment(courseId, "courseId")}`;
export const enrollmentDocumentPath = (tenantId, enrollmentId) => `${tenantDocumentPath(tenantId)}/enrollments/${segment(enrollmentId, "enrollmentId")}`;
export const platformAuthorityDocumentPath = (uid) => `platformAuthorities/${segment(uid, "uid")}`;
export const platformAuthorityRegistryDocumentPath = () => "platformControl/authorityRegistry";
export const privilegedCommandDocumentPath = (commandId) => `privilegedCommands/${segment(commandId, "commandId")}`;
export const platformAuditEventDocumentPath = (auditId) => `platformAuditEvents/${segment(auditId, "auditId")}`;
export const tenantAuditEventDocumentPath = (tenantId, auditId) => `${tenantDocumentPath(tenantId)}/auditEvents/${segment(auditId, "auditId")}`;
export const tenantAdminAuthorityStateDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/authorityState/tenantAdmins`;
