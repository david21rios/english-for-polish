/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { isPlainObject } from "../validation/objects.js";
import { validatePersistedTimestamp } from "../validation/timestamps.js";

export const PLATFORM_AUTHORITY_SCHEMA_VERSION = 1;
export const PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION = 1;
/** @deprecated Use PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION. */
export const AUTHORITY_SCHEMA_VERSION = PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION;
export const PLATFORM_AUTHORITY = "platform_admin";
export const PLATFORM_AUTHORITY_STATUSES = Object.freeze({
  PROVISIONING: "provisioning", ACTIVE: "active", REVOKING: "revoking",
  REVOKED: "revoked", RECOVERY_REQUIRED: "recovery_required"
});
export const PLATFORM_AUTHORITY_FIELDS = frozen(["schemaVersion", "transitionCommandId", "uid", "authority", "status", "createdAt", "createdBy", "updatedAt", "updatedBy", "activatedAt", "revokedAt", "revokedBy", "bootstrapCommandId", "lastClaimSyncAt"]);
export const PLATFORM_AUTHORITY_REQUIRED_FIELDS = PLATFORM_AUTHORITY_FIELDS;
export const PLATFORM_AUTHORITY_REGISTRY_FIELDS = frozen(["schemaVersion", "bootstrapState", "activeCount", "revision", "lastCommandId", "updatedAt"]);
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS = frozen(["tenantId", "activeCount", "revision", "lastCommandId", "updatedAt"]);

/**
 * @typedef {Readonly<{
 * schemaVersion: 1,
 * transitionCommandId: string|null,
 * uid: string,
 * authority: "platform_admin",
 * status: "provisioning"|"active"|"revoking"|"revoked"|"recovery_required",
 * createdAt: string,
 * createdBy: string,
 * updatedAt: string,
 * updatedBy: string,
 * activatedAt: string|null,
 * revokedAt: string|null,
 * revokedBy: string|null,
 * bootstrapCommandId: string|null,
 * lastClaimSyncAt: string|null
 * }>} PlatformAuthority
 */

/** @param {unknown} value @returns {value is string} */
const validIdentifier = (value) => validateDocumentIdentifier(value).ok;
/** @param {unknown} value @returns {value is string|null} */
const validNullableIdentifier = (value) => value === null || validIdentifier(value);
/** @param {unknown} value @returns {value is string} */
const validTimestamp = (value) => validatePersistedTimestamp(value).ok;
/** @param {unknown} value @returns {value is string|null} */
const validNullableTimestamp = (value) => value === null || validTimestamp(value);

/**
 * @param {unknown} value
 * @returns {Readonly<{ok: true, value: PlatformAuthority}> | Readonly<{ok: false, issue: Readonly<{code: "INVALID_ARGUMENT", field: "platformAuthority", reason: "invalid_platform_authority"}>}>}
 */
export const validatePlatformAuthority = (value) => {
  const validShape = isPlainObject(value)
    && Object.keys(value).length === PLATFORM_AUTHORITY_FIELDS.length
    && PLATFORM_AUTHORITY_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(value, field));
  if (validShape) {
    const authority = /** @type {Record<string, unknown>} */ (value);
    const status = authority.status;
    const ownerRequired = status === PLATFORM_AUTHORITY_STATUSES.PROVISIONING
      || status === PLATFORM_AUTHORITY_STATUSES.REVOKING
      || status === PLATFORM_AUTHORITY_STATUSES.RECOVERY_REQUIRED;
    const ownerValid = ownerRequired
      ? validIdentifier(authority.transitionCommandId)
      : (status === PLATFORM_AUTHORITY_STATUSES.ACTIVE || status === PLATFORM_AUTHORITY_STATUSES.REVOKED)
        && authority.transitionCommandId === null;
    if (authority.schemaVersion === PLATFORM_AUTHORITY_SCHEMA_VERSION
      && validIdentifier(authority.uid)
      && authority.authority === PLATFORM_AUTHORITY
      && Object.values(PLATFORM_AUTHORITY_STATUSES).some((candidate) => candidate === status)
      && validTimestamp(authority.createdAt)
      && validIdentifier(authority.createdBy)
      && validTimestamp(authority.updatedAt)
      && validIdentifier(authority.updatedBy)
      && validNullableTimestamp(authority.activatedAt)
      && validNullableTimestamp(authority.revokedAt)
      && validNullableIdentifier(authority.revokedBy)
      && validNullableIdentifier(authority.bootstrapCommandId)
      && validNullableTimestamp(authority.lastClaimSyncAt)
      && ownerValid) {
      return Object.freeze({ ok: true, value: /** @type {PlatformAuthority} */ (value) });
    }
  }
  return Object.freeze({
    ok: false,
    issue: Object.freeze({ code: "INVALID_ARGUMENT", field: "platformAuthority", reason: "invalid_platform_authority" }),
  });
};
