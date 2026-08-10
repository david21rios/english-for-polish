import { isDocumentIdentifier } from "../validation/identifiers.js";

/** @param {unknown} value @param {string} name @returns {string} */
const segment = (value, name) => {
  if (!isDocumentIdentifier(value)) throw new TypeError(`${name} is not a valid document identifier.`);
  return value;
};

/** @param {unknown} uid */
export const identityDocumentPath = (uid) => `identities/${segment(uid, "uid")}`;
/** @param {unknown} tenantId */
export const tenantDocumentPath = (tenantId) => `tenants/${segment(tenantId, "tenantId")}`;
/** @param {unknown} tenantId */
export const tenantSettingsDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/configuration/settings`;
/** @param {unknown} tenantId */
export const tenantBrandingDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/configuration/branding`;
/** @param {unknown} tenantId @param {unknown} requestId */
export const registrationRequestDocumentPath = (tenantId, requestId) => `${tenantDocumentPath(tenantId)}/registrationRequests/${segment(requestId, "requestId")}`;
/** @param {unknown} tenantId @param {unknown} uidKey */
export const registrationRequestKeyDocumentPath = (tenantId, uidKey) => `${tenantDocumentPath(tenantId)}/registrationRequestKeys/${segment(uidKey, "uidKey")}`;
/** @param {unknown} tenantId @param {unknown} membershipId */
export const membershipDocumentPath = (tenantId, membershipId) => `${tenantDocumentPath(tenantId)}/memberships/${segment(membershipId, "membershipId")}`;
/** @param {unknown} tenantId @param {unknown} uidKey */
export const membershipKeyDocumentPath = (tenantId, uidKey) => `${tenantDocumentPath(tenantId)}/membershipKeys/${segment(uidKey, "uidKey")}`;
/** @param {unknown} tenantId @param {unknown} courseId */
export const courseDocumentPath = (tenantId, courseId) => `${tenantDocumentPath(tenantId)}/courses/${segment(courseId, "courseId")}`;
/** @param {unknown} tenantId @param {unknown} enrollmentId */
export const enrollmentDocumentPath = (tenantId, enrollmentId) => `${tenantDocumentPath(tenantId)}/enrollments/${segment(enrollmentId, "enrollmentId")}`;
/** @param {unknown} uid */
export const platformAuthorityDocumentPath = (uid) => `platformAuthorities/${segment(uid, "uid")}`;
export const platformAuthorityRegistryDocumentPath = () => "platformControl/authorityRegistry";
/** @param {unknown} commandId */
export const privilegedCommandDocumentPath = (commandId) => `privilegedCommands/${segment(commandId, "commandId")}`;
/** @param {unknown} auditId */
export const platformAuditEventDocumentPath = (auditId) => `platformAuditEvents/${segment(auditId, "auditId")}`;
/** @param {unknown} tenantId @param {unknown} auditId */
export const tenantAuditEventDocumentPath = (tenantId, auditId) => `${tenantDocumentPath(tenantId)}/auditEvents/${segment(auditId, "auditId")}`;
/** @param {unknown} tenantId */
export const tenantAdminAuthorityStateDocumentPath = (tenantId) => `${tenantDocumentPath(tenantId)}/authorityState/tenantAdmins`;
