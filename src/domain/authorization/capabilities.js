import { CAPABILITY_SCOPES } from "./enums.js";

/**
 * @typedef {object} Capability
 * @property {string} id Stable action identifier.
 * @property {import("./enums.js").CapabilityScope} scope
 * @property {string} resource Conceptual resource category.
 * @property {string} description Human-readable action description.
 */

export const CAPABILITY_IDS = Object.freeze({
  IDENTITY_READ_SELF: "identity.read_self",
  IDENTITY_UPDATE_SELF: "identity.update_self",

  TENANT_READ: "tenant.read",
  TENANT_UPDATE: "tenant.update",
  TENANT_MANAGE_SETTINGS: "tenant.manage_settings",
  TENANT_MANAGE_BRANDING: "tenant.manage_branding",

  MEMBERSHIP_READ_SELF: "membership.read_self",
  MEMBERSHIP_LEAVE_SELF: "membership.leave_self",
  MEMBERSHIP_LIST: "membership.list",
  MEMBERSHIP_SUSPEND: "membership.suspend",
  MEMBERSHIP_RESTORE: "membership.restore",
  MEMBERSHIP_REMOVE: "membership.remove",
  MEMBERSHIP_CHANGE_ROLE: "membership.change_role",

  REGISTRATION_REQUEST_CREATE: "registration_request.create",
  REGISTRATION_REQUEST_READ_SELF: "registration_request.read_self",
  REGISTRATION_REQUEST_CANCEL_SELF: "registration_request.cancel_self",
  REGISTRATION_REQUEST_LIST: "registration_request.list",
  REGISTRATION_REQUEST_REVIEW: "registration_request.review",

  COURSE_LIST: "course.list",
  COURSE_READ: "course.read",
  COURSE_CREATE: "course.create",
  COURSE_UPDATE: "course.update",
  COURSE_ACTIVATE: "course.activate",
  COURSE_ARCHIVE: "course.archive",

  ENROLLMENT_READ_SELF: "enrollment.read_self",
  ENROLLMENT_LIST: "enrollment.list",
  ENROLLMENT_CREATE: "enrollment.create",
  ENROLLMENT_UPDATE_STATUS: "enrollment.update_status",
  ENROLLMENT_CANCEL_SELF: "enrollment.cancel_self",

  PLATFORM_TENANT_LIST: "platform.tenant_list",
  PLATFORM_TENANT_READ: "platform.tenant_read",
  PLATFORM_TENANT_CREATE: "platform.tenant_create",
  PLATFORM_TENANT_UPDATE: "platform.tenant_update",
  PLATFORM_TENANT_SUSPEND: "platform.tenant_suspend",
  PLATFORM_TENANT_RESTORE: "platform.tenant_restore",
  PLATFORM_TENANT_ARCHIVE: "platform.tenant_archive",
  PLATFORM_IDENTITY_READ: "platform.identity_read",
});

const defineCapability = (id, scope, resource, description) =>
  Object.freeze({ id, scope, resource, description });

export const CAPABILITIES = Object.freeze({
  [CAPABILITY_IDS.IDENTITY_READ_SELF]: defineCapability(
    CAPABILITY_IDS.IDENTITY_READ_SELF,
    CAPABILITY_SCOPES.SELF,
    "identity",
    "Read the current identity.",
  ),
  [CAPABILITY_IDS.IDENTITY_UPDATE_SELF]: defineCapability(
    CAPABILITY_IDS.IDENTITY_UPDATE_SELF,
    CAPABILITY_SCOPES.SELF,
    "identity",
    "Update the current identity.",
  ),

  [CAPABILITY_IDS.TENANT_READ]: defineCapability(
    CAPABILITY_IDS.TENANT_READ,
    CAPABILITY_SCOPES.TENANT,
    "tenant",
    "Read the active tenant.",
  ),
  [CAPABILITY_IDS.TENANT_UPDATE]: defineCapability(
    CAPABILITY_IDS.TENANT_UPDATE,
    CAPABILITY_SCOPES.TENANT,
    "tenant",
    "Update institutional information in the active tenant.",
  ),
  [CAPABILITY_IDS.TENANT_MANAGE_SETTINGS]: defineCapability(
    CAPABILITY_IDS.TENANT_MANAGE_SETTINGS,
    CAPABILITY_SCOPES.TENANT,
    "tenant",
    "Manage settings in the active tenant.",
  ),
  [CAPABILITY_IDS.TENANT_MANAGE_BRANDING]: defineCapability(
    CAPABILITY_IDS.TENANT_MANAGE_BRANDING,
    CAPABILITY_SCOPES.TENANT,
    "tenant",
    "Manage branding in the active tenant.",
  ),

  [CAPABILITY_IDS.MEMBERSHIP_READ_SELF]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_READ_SELF,
    CAPABILITY_SCOPES.SELF,
    "membership",
    "Read the current identity's membership.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_LEAVE_SELF]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_LEAVE_SELF,
    CAPABILITY_SCOPES.SELF,
    "membership",
    "Request removal of the current identity's own membership.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_LIST]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_LIST,
    CAPABILITY_SCOPES.TENANT,
    "membership",
    "List memberships in the active tenant.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_SUSPEND]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_SUSPEND,
    CAPABILITY_SCOPES.TENANT,
    "membership",
    "Suspend a membership in the active tenant.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_RESTORE]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_RESTORE,
    CAPABILITY_SCOPES.TENANT,
    "membership",
    "Restore a suspended membership in the active tenant.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_REMOVE]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_REMOVE,
    CAPABILITY_SCOPES.TENANT,
    "membership",
    "Remove a membership from the active tenant.",
  ),
  [CAPABILITY_IDS.MEMBERSHIP_CHANGE_ROLE]: defineCapability(
    CAPABILITY_IDS.MEMBERSHIP_CHANGE_ROLE,
    CAPABILITY_SCOPES.TENANT,
    "membership",
    "Change a membership role in the active tenant.",
  ),

  [CAPABILITY_IDS.REGISTRATION_REQUEST_CREATE]: defineCapability(
    CAPABILITY_IDS.REGISTRATION_REQUEST_CREATE,
    CAPABILITY_SCOPES.SELF,
    "registration_request",
    "Create the current identity's registration request for a tenant.",
  ),
  [CAPABILITY_IDS.REGISTRATION_REQUEST_READ_SELF]: defineCapability(
    CAPABILITY_IDS.REGISTRATION_REQUEST_READ_SELF,
    CAPABILITY_SCOPES.SELF,
    "registration_request",
    "Read the current identity's registration requests.",
  ),
  [CAPABILITY_IDS.REGISTRATION_REQUEST_CANCEL_SELF]: defineCapability(
    CAPABILITY_IDS.REGISTRATION_REQUEST_CANCEL_SELF,
    CAPABILITY_SCOPES.SELF,
    "registration_request",
    "Cancel the current identity's own pending registration request.",
  ),
  [CAPABILITY_IDS.REGISTRATION_REQUEST_LIST]: defineCapability(
    CAPABILITY_IDS.REGISTRATION_REQUEST_LIST,
    CAPABILITY_SCOPES.TENANT,
    "registration_request",
    "List registration requests in the active tenant.",
  ),
  [CAPABILITY_IDS.REGISTRATION_REQUEST_REVIEW]: defineCapability(
    CAPABILITY_IDS.REGISTRATION_REQUEST_REVIEW,
    CAPABILITY_SCOPES.TENANT,
    "registration_request",
    "Review registration requests in the active tenant.",
  ),

  [CAPABILITY_IDS.COURSE_LIST]: defineCapability(
    CAPABILITY_IDS.COURSE_LIST,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "List accessible courses in the active tenant.",
  ),
  [CAPABILITY_IDS.COURSE_READ]: defineCapability(
    CAPABILITY_IDS.COURSE_READ,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "Read an accessible course in the active tenant.",
  ),
  [CAPABILITY_IDS.COURSE_CREATE]: defineCapability(
    CAPABILITY_IDS.COURSE_CREATE,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "Create a course in the active tenant.",
  ),
  [CAPABILITY_IDS.COURSE_UPDATE]: defineCapability(
    CAPABILITY_IDS.COURSE_UPDATE,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "Update a course in the active tenant.",
  ),
  [CAPABILITY_IDS.COURSE_ACTIVATE]: defineCapability(
    CAPABILITY_IDS.COURSE_ACTIVATE,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "Activate a draft course in the active tenant.",
  ),
  [CAPABILITY_IDS.COURSE_ARCHIVE]: defineCapability(
    CAPABILITY_IDS.COURSE_ARCHIVE,
    CAPABILITY_SCOPES.TENANT,
    "course",
    "Archive a course in the active tenant.",
  ),

  [CAPABILITY_IDS.ENROLLMENT_READ_SELF]: defineCapability(
    CAPABILITY_IDS.ENROLLMENT_READ_SELF,
    CAPABILITY_SCOPES.SELF,
    "enrollment",
    "Read the current identity's enrollments.",
  ),
  [CAPABILITY_IDS.ENROLLMENT_LIST]: defineCapability(
    CAPABILITY_IDS.ENROLLMENT_LIST,
    CAPABILITY_SCOPES.TENANT,
    "enrollment",
    "List enrollments in the active tenant.",
  ),
  [CAPABILITY_IDS.ENROLLMENT_CREATE]: defineCapability(
    CAPABILITY_IDS.ENROLLMENT_CREATE,
    CAPABILITY_SCOPES.TENANT,
    "enrollment",
    "Create an enrollment in the active tenant.",
  ),
  [CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS]: defineCapability(
    CAPABILITY_IDS.ENROLLMENT_UPDATE_STATUS,
    CAPABILITY_SCOPES.TENANT,
    "enrollment",
    "Update an enrollment status in the active tenant.",
  ),
  [CAPABILITY_IDS.ENROLLMENT_CANCEL_SELF]: defineCapability(
    CAPABILITY_IDS.ENROLLMENT_CANCEL_SELF,
    CAPABILITY_SCOPES.SELF,
    "enrollment",
    "Cancel the current identity's enrollment when policy permits.",
  ),

  [CAPABILITY_IDS.PLATFORM_TENANT_LIST]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_LIST,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_tenant",
    "List tenants at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_READ]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_READ,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_tenant",
    "Read tenant administration metadata at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_CREATE]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_CREATE,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_tenant",
    "Create a tenant at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_UPDATE]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_UPDATE,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_tenant",
    "Update tenant administration metadata at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_SUSPEND,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_tenant",
    "Suspend a tenant at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_RESTORE]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_RESTORE,
    CAPABILITY_SCOPES.PLATFORM,
    "tenant",
    "Restore a suspended Tenant to active status through an authorized platform operation.",
  ),
  [CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE]: defineCapability(
    CAPABILITY_IDS.PLATFORM_TENANT_ARCHIVE,
    CAPABILITY_SCOPES.PLATFORM,
    "tenant",
    "Archive a tenant at platform scope.",
  ),
  [CAPABILITY_IDS.PLATFORM_IDENTITY_READ]: defineCapability(
    CAPABILITY_IDS.PLATFORM_IDENTITY_READ,
    CAPABILITY_SCOPES.PLATFORM,
    "platform_identity",
    "Read identity administration data at platform scope.",
  ),
});
