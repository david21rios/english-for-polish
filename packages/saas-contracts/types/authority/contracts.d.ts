export const AUTHORITY_SCHEMA_VERSION: 1;
export const PLATFORM_AUTHORITY: "platform_admin";
export const PLATFORM_AUTHORITY_STATUSES: Readonly<{
    PROVISIONING: "provisioning";
    ACTIVE: "active";
    REVOKING: "revoking";
    REVOKED: "revoked";
    RECOVERY_REQUIRED: "recovery_required";
}>;
export const PLATFORM_AUTHORITY_FIELDS: readonly string[];
export const PLATFORM_AUTHORITY_REQUIRED_FIELDS: readonly string[];
export const PLATFORM_AUTHORITY_REGISTRY_FIELDS: readonly string[];
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS: readonly string[];
