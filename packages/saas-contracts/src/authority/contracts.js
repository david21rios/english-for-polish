/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

export const AUTHORITY_SCHEMA_VERSION = 1;
export const PLATFORM_AUTHORITY = "platform_admin";
export const PLATFORM_AUTHORITY_STATUSES = Object.freeze({
  PROVISIONING: "provisioning", ACTIVE: "active", REVOKING: "revoking",
  REVOKED: "revoked", RECOVERY_REQUIRED: "recovery_required"
});
export const PLATFORM_AUTHORITY_FIELDS = frozen(["uid", "authority", "status", "createdAt", "createdBy", "updatedAt", "updatedBy", "activatedAt", "revokedAt", "revokedBy", "bootstrapCommandId", "lastClaimSyncAt"]);
export const PLATFORM_AUTHORITY_REQUIRED_FIELDS = PLATFORM_AUTHORITY_FIELDS;
export const PLATFORM_AUTHORITY_REGISTRY_FIELDS = frozen(["schemaVersion", "bootstrapState", "activeCount", "revision", "lastCommandId", "updatedAt"]);
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS = frozen(["tenantId", "activeCount", "revision", "lastCommandId", "updatedAt"]);
