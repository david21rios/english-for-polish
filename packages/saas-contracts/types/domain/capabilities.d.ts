/**
 * @typedef {object} Capability
 * @property {string} id Stable action identifier.
 * @property {string} scope
 * @property {string} resource Conceptual resource category.
 * @property {string} description Human-readable action description.
 */
export const CAPABILITY_IDS: Readonly<{
    IDENTITY_READ_SELF: "identity.read_self";
    IDENTITY_UPDATE_SELF: "identity.update_self";
    TENANT_READ: "tenant.read";
    TENANT_UPDATE: "tenant.update";
    TENANT_MANAGE_SETTINGS: "tenant.manage_settings";
    TENANT_MANAGE_BRANDING: "tenant.manage_branding";
    MEMBERSHIP_READ_SELF: "membership.read_self";
    MEMBERSHIP_LEAVE_SELF: "membership.leave_self";
    MEMBERSHIP_LIST: "membership.list";
    MEMBERSHIP_SUSPEND: "membership.suspend";
    MEMBERSHIP_RESTORE: "membership.restore";
    MEMBERSHIP_REMOVE: "membership.remove";
    MEMBERSHIP_CHANGE_ROLE: "membership.change_role";
    REGISTRATION_REQUEST_CREATE: "registration_request.create";
    REGISTRATION_REQUEST_READ_SELF: "registration_request.read_self";
    REGISTRATION_REQUEST_CANCEL_SELF: "registration_request.cancel_self";
    REGISTRATION_REQUEST_LIST: "registration_request.list";
    REGISTRATION_REQUEST_REVIEW: "registration_request.review";
    COURSE_LIST: "course.list";
    COURSE_READ: "course.read";
    COURSE_CREATE: "course.create";
    COURSE_UPDATE: "course.update";
    COURSE_ACTIVATE: "course.activate";
    COURSE_ARCHIVE: "course.archive";
    ENROLLMENT_READ_SELF: "enrollment.read_self";
    ENROLLMENT_LIST: "enrollment.list";
    ENROLLMENT_CREATE: "enrollment.create";
    ENROLLMENT_UPDATE_STATUS: "enrollment.update_status";
    ENROLLMENT_CANCEL_SELF: "enrollment.cancel_self";
    PLATFORM_TENANT_LIST: "platform.tenant_list";
    PLATFORM_TENANT_READ: "platform.tenant_read";
    PLATFORM_TENANT_CREATE: "platform.tenant_create";
    PLATFORM_TENANT_UPDATE: "platform.tenant_update";
    PLATFORM_TENANT_SUSPEND: "platform.tenant_suspend";
    PLATFORM_TENANT_RESTORE: "platform.tenant_restore";
    PLATFORM_TENANT_ARCHIVE: "platform.tenant_archive";
    PLATFORM_IDENTITY_READ: "platform.identity_read";
    PLATFORM_AUTHORITY_REVOKE: "platform.authority_revoke";
}>;
export const CAPABILITIES: Readonly<{
    "identity.read_self": Readonly<{
        id: "identity.read_self";
        scope: "self";
        resource: "identity";
        description: "Read the current identity.";
    }>;
    "identity.update_self": Readonly<{
        id: "identity.update_self";
        scope: "self";
        resource: "identity";
        description: "Update the current identity.";
    }>;
    "tenant.read": Readonly<{
        id: "tenant.read";
        scope: "tenant";
        resource: "tenant";
        description: "Read the active tenant.";
    }>;
    "tenant.update": Readonly<{
        id: "tenant.update";
        scope: "tenant";
        resource: "tenant";
        description: "Update institutional information in the active tenant.";
    }>;
    "tenant.manage_settings": Readonly<{
        id: "tenant.manage_settings";
        scope: "tenant";
        resource: "tenant";
        description: "Manage settings in the active tenant.";
    }>;
    "tenant.manage_branding": Readonly<{
        id: "tenant.manage_branding";
        scope: "tenant";
        resource: "tenant";
        description: "Manage branding in the active tenant.";
    }>;
    "membership.read_self": Readonly<{
        id: "membership.read_self";
        scope: "self";
        resource: "membership";
        description: "Read the current identity's membership.";
    }>;
    "membership.leave_self": Readonly<{
        id: "membership.leave_self";
        scope: "self";
        resource: "membership";
        description: "Request removal of the current identity's own membership.";
    }>;
    "membership.list": Readonly<{
        id: "membership.list";
        scope: "tenant";
        resource: "membership";
        description: "List memberships in the active tenant.";
    }>;
    "membership.suspend": Readonly<{
        id: "membership.suspend";
        scope: "tenant";
        resource: "membership";
        description: "Suspend a membership in the active tenant.";
    }>;
    "membership.restore": Readonly<{
        id: "membership.restore";
        scope: "tenant";
        resource: "membership";
        description: "Restore a suspended membership in the active tenant.";
    }>;
    "membership.remove": Readonly<{
        id: "membership.remove";
        scope: "tenant";
        resource: "membership";
        description: "Remove a membership from the active tenant.";
    }>;
    "membership.change_role": Readonly<{
        id: "membership.change_role";
        scope: "tenant";
        resource: "membership";
        description: "Change a membership role in the active tenant.";
    }>;
    "registration_request.create": Readonly<{
        id: "registration_request.create";
        scope: "self";
        resource: "registration_request";
        description: "Create the current identity's registration request for a tenant.";
    }>;
    "registration_request.read_self": Readonly<{
        id: "registration_request.read_self";
        scope: "self";
        resource: "registration_request";
        description: "Read the current identity's registration requests.";
    }>;
    "registration_request.cancel_self": Readonly<{
        id: "registration_request.cancel_self";
        scope: "self";
        resource: "registration_request";
        description: "Cancel the current identity's own pending registration request.";
    }>;
    "registration_request.list": Readonly<{
        id: "registration_request.list";
        scope: "tenant";
        resource: "registration_request";
        description: "List registration requests in the active tenant.";
    }>;
    "registration_request.review": Readonly<{
        id: "registration_request.review";
        scope: "tenant";
        resource: "registration_request";
        description: "Review registration requests in the active tenant.";
    }>;
    "course.list": Readonly<{
        id: "course.list";
        scope: "tenant";
        resource: "course";
        description: "List accessible courses in the active tenant.";
    }>;
    "course.read": Readonly<{
        id: "course.read";
        scope: "tenant";
        resource: "course";
        description: "Read an accessible course in the active tenant.";
    }>;
    "course.create": Readonly<{
        id: "course.create";
        scope: "tenant";
        resource: "course";
        description: "Create a course in the active tenant.";
    }>;
    "course.update": Readonly<{
        id: "course.update";
        scope: "tenant";
        resource: "course";
        description: "Update a course in the active tenant.";
    }>;
    "course.activate": Readonly<{
        id: "course.activate";
        scope: "tenant";
        resource: "course";
        description: "Activate a draft course in the active tenant.";
    }>;
    "course.archive": Readonly<{
        id: "course.archive";
        scope: "tenant";
        resource: "course";
        description: "Archive a course in the active tenant.";
    }>;
    "enrollment.read_self": Readonly<{
        id: "enrollment.read_self";
        scope: "self";
        resource: "enrollment";
        description: "Read the current identity's enrollments.";
    }>;
    "enrollment.list": Readonly<{
        id: "enrollment.list";
        scope: "tenant";
        resource: "enrollment";
        description: "List enrollments in the active tenant.";
    }>;
    "enrollment.create": Readonly<{
        id: "enrollment.create";
        scope: "tenant";
        resource: "enrollment";
        description: "Create an enrollment in the active tenant.";
    }>;
    "enrollment.update_status": Readonly<{
        id: "enrollment.update_status";
        scope: "tenant";
        resource: "enrollment";
        description: "Update an enrollment status in the active tenant.";
    }>;
    "enrollment.cancel_self": Readonly<{
        id: "enrollment.cancel_self";
        scope: "self";
        resource: "enrollment";
        description: "Cancel the current identity's enrollment when policy permits.";
    }>;
    "platform.tenant_list": Readonly<{
        id: "platform.tenant_list";
        scope: "platform";
        resource: "platform_tenant";
        description: "List tenants at platform scope.";
    }>;
    "platform.tenant_read": Readonly<{
        id: "platform.tenant_read";
        scope: "platform";
        resource: "platform_tenant";
        description: "Read tenant administration metadata at platform scope.";
    }>;
    "platform.tenant_create": Readonly<{
        id: "platform.tenant_create";
        scope: "platform";
        resource: "platform_tenant";
        description: "Create a tenant at platform scope.";
    }>;
    "platform.tenant_update": Readonly<{
        id: "platform.tenant_update";
        scope: "platform";
        resource: "platform_tenant";
        description: "Update tenant administration metadata at platform scope.";
    }>;
    "platform.tenant_suspend": Readonly<{
        id: "platform.tenant_suspend";
        scope: "platform";
        resource: "platform_tenant";
        description: "Suspend a tenant at platform scope.";
    }>;
    "platform.tenant_restore": Readonly<{
        id: "platform.tenant_restore";
        scope: "platform";
        resource: "tenant";
        description: "Restore a suspended Tenant to active status through an authorized platform operation.";
    }>;
    "platform.tenant_archive": Readonly<{
        id: "platform.tenant_archive";
        scope: "platform";
        resource: "tenant";
        description: "Archive a tenant at platform scope.";
    }>;
    "platform.identity_read": Readonly<{
        id: "platform.identity_read";
        scope: "platform";
        resource: "platform_identity";
        description: "Read identity administration data at platform scope.";
    }>;
    "platform.authority_revoke": Readonly<{
        id: "platform.authority_revoke";
        scope: "platform";
        resource: "platform_authority";
        description: "Revoke an active platform authority through the approved privileged command.";
    }>;
}>;
export type Capability = {
    /**
     * Stable action identifier.
     */
    id: string;
    scope: string;
    /**
     * Conceptual resource category.
     */
    resource: string;
    /**
     * Human-readable action description.
     */
    description: string;
};
