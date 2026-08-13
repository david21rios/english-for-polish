/** @template {readonly string[]} T @param {T} values @returns {Readonly<T>} */
const frozen = (values) => Object.freeze(values);

import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { isPlainObject } from "../validation/objects.js";
import { validatePersistedTimestamp } from "../validation/timestamps.js";
import { PLATFORM_ROLES } from "../domain/authorization.js";
import { MEMBERSHIP_ROLES } from "../domain/membership.js";
import { ROLE_CAPABILITY_MATRIX } from "../domain/roleCapabilityMatrix.js";

export const AUTHORITY_ACTOR_TYPES = Object.freeze({
  IDENTITY: "identity",
  PLATFORM_ADMIN: "platform_admin",
  SYSTEM: "system",
});
export const SYSTEM_OPERATOR_AUTHORITIES = Object.freeze({
  PLATFORM_SYSTEM: "platform_system",
  PLATFORM_RECOVERY: "platform_recovery",
});
export const AUTHORITY_RESOLUTION_FIELDS = frozen([
  "actorUid", "actorType", "authority", "tenantId", "roles", "capabilities",
]);

/**
 * @typedef {Readonly<{
 * actorUid: string,
 * actorType: "platform_admin",
 * authority: "platform_admin",
 * tenantId: null,
 * roles: readonly ["platform_admin"],
 * capabilities: readonly string[]
 * }>|Readonly<{
 * actorUid: string,
 * actorType: "identity",
 * authority: "student"|"teacher"|"tenant_admin",
 * tenantId: string,
 * roles: readonly ["student"|"teacher"|"tenant_admin"],
 * capabilities: readonly string[]
 * }>} HumanAuthorityResolution
 */

/**
 * @typedef {Readonly<{
 * actorUid: string,
 * actorType: "system",
 * authority: "platform_system"|"platform_recovery",
 * tenantId: null,
 * roles: readonly [],
 * capabilities: readonly []
 * }>} SystemOperatorResolution
 */

/** @typedef {HumanAuthorityResolution|SystemOperatorResolution} AuthorityResolution */

/** @param {unknown} actual @param {readonly string[]} expected */
const exactStringArray = (actual, expected) => Array.isArray(actual)
  && actual.length === expected.length
  && actual.every((value, index) => typeof value === "string" && value === expected[index]);

/**
 * @param {unknown} value
 * @returns {Readonly<{ok:true,value:AuthorityResolution}>|Readonly<{ok:false,issue:Readonly<{code:"INVALID_ARGUMENT",field:"authorityResolution",reason:"invalid_authority_resolution"}>}>}
 */
export const validateAuthorityResolution = (value) => {
  const validShape = isPlainObject(value)
    && Object.keys(value).length === AUTHORITY_RESOLUTION_FIELDS.length
    && AUTHORITY_RESOLUTION_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(value, field));
  if (validShape) {
    const resolution = /** @type {Record<string, unknown>} */ (value);
    const actorUidValidation = validateDocumentIdentifier(resolution.actorUid, "actorUid");
    if (actorUidValidation.ok) {
      if (resolution.actorType === AUTHORITY_ACTOR_TYPES.PLATFORM_ADMIN
        && resolution.authority === PLATFORM_ROLES.PLATFORM_ADMIN
        && resolution.tenantId === null
        && exactStringArray(resolution.roles, [PLATFORM_ROLES.PLATFORM_ADMIN])
        && exactStringArray(resolution.capabilities, ROLE_CAPABILITY_MATRIX.platformRoles[PLATFORM_ROLES.PLATFORM_ADMIN])) {
        return Object.freeze({ ok: true, value: /** @type {AuthorityResolution} */ (value) });
      }
      if (resolution.actorType === AUTHORITY_ACTOR_TYPES.IDENTITY
        && typeof resolution.authority === "string"
        && Object.values(MEMBERSHIP_ROLES).includes(/** @type {never} */ (resolution.authority))) {
        const role = /** @type {keyof typeof ROLE_CAPABILITY_MATRIX.membershipRoles} */ (resolution.authority);
        const tenantIdValidation = validateDocumentIdentifier(resolution.tenantId, "tenantId");
        if (tenantIdValidation.ok
          && exactStringArray(resolution.roles, [role])
          && exactStringArray(resolution.capabilities, ROLE_CAPABILITY_MATRIX.membershipRoles[role])) {
          return Object.freeze({ ok: true, value: /** @type {AuthorityResolution} */ (value) });
        }
      }
      if (resolution.actorType === AUTHORITY_ACTOR_TYPES.SYSTEM
        && Object.values(SYSTEM_OPERATOR_AUTHORITIES).includes(/** @type {never} */ (resolution.authority))
        && resolution.tenantId === null
        && exactStringArray(resolution.roles, [])
        && exactStringArray(resolution.capabilities, [])) {
        return Object.freeze({ ok: true, value: /** @type {AuthorityResolution} */ (value) });
      }
    }
  }
  return Object.freeze({ ok: false, issue: Object.freeze({
    code: "INVALID_ARGUMENT", field: "authorityResolution", reason: "invalid_authority_resolution",
  }) });
};

export const PLATFORM_AUTHORITY_SCHEMA_VERSION = 2;
export const PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION = 1;
/** @deprecated Use PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION. */
export const AUTHORITY_SCHEMA_VERSION = PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION;
export const PLATFORM_AUTHORITY = "platform_admin";
export const PLATFORM_AUTHORITY_STATUSES = Object.freeze({
  PROVISIONING: "provisioning", ACTIVE: "active", REVOKING: "revoking",
  REVOKED: "revoked", RECOVERY_REQUIRED: "recovery_required"
});
export const PLATFORM_AUTHORITY_REGISTRY_STATES = Object.freeze({
  UNINITIALIZED: "uninitialized",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  RECOVERY_REQUIRED: "recovery_required"
});
export const PLATFORM_AUTHORITY_FIELDS = frozen(["schemaVersion", "transitionCommandId", "uid", "authority", "status", "createdAt", "createdBy", "updatedAt", "updatedBy", "activatedAt", "revokedAt", "revokedBy", "bootstrapCommandId", "lastClaimSyncAt"]);
export const PLATFORM_AUTHORITY_REQUIRED_FIELDS = PLATFORM_AUTHORITY_FIELDS;
export const PLATFORM_AUTHORITY_REGISTRY_FIELDS = frozen(["schemaVersion", "bootstrapState", "activeCount", "revision", "lastCommandId", "updatedAt"]);
export const TENANT_ADMIN_AUTHORITY_STATE_FIELDS = frozen(["tenantId", "activeCount", "revision", "lastCommandId", "updatedAt"]);

/**
 * @typedef {Readonly<{
 * schemaVersion: 2,
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
      : status === PLATFORM_AUTHORITY_STATUSES.ACTIVE
        ? authority.transitionCommandId === null || validIdentifier(authority.transitionCommandId)
        : status === PLATFORM_AUTHORITY_STATUSES.REVOKED && authority.transitionCommandId === null;
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

/**
 * @typedef {Readonly<{
 * schemaVersion: 1,
 * bootstrapState: "uninitialized"|"in_progress"|"completed"|"recovery_required",
 * activeCount: number,
 * revision: number,
 * lastCommandId: string|null,
 * updatedAt: string
 * }>} PlatformAuthorityRegistry
 */

/** @param {unknown} value @returns {Readonly<{ok: true, value: PlatformAuthorityRegistry}> | Readonly<{ok: false, issue: Readonly<{code: "INVALID_ARGUMENT", field: "platformAuthorityRegistry", reason: "invalid_platform_authority_registry"}>}>} */
export const validatePlatformAuthorityRegistry = (value) => {
  const validShape = isPlainObject(value)
    && Object.keys(value).length === PLATFORM_AUTHORITY_REGISTRY_FIELDS.length
    && PLATFORM_AUTHORITY_REGISTRY_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(value, field));
  if (validShape) {
    const registry = /** @type {Record<string, unknown>} */ (value);
    const state = registry.bootstrapState;
    const validState = Object.values(PLATFORM_AUTHORITY_REGISTRY_STATES).some((candidate) => candidate === state);
    const initial = state === PLATFORM_AUTHORITY_REGISTRY_STATES.UNINITIALIZED;
    const lastCommandValid = initial ? registry.lastCommandId === null : validIdentifier(registry.lastCommandId);
    if (registry.schemaVersion === PLATFORM_AUTHORITY_REGISTRY_SCHEMA_VERSION
      && validState
      && Number.isInteger(registry.activeCount) && Number(registry.activeCount) >= 0
      && Number.isInteger(registry.revision) && Number(registry.revision) >= 0
      && lastCommandValid
      && (!initial || (registry.activeCount === 0 && registry.revision === 0))
      && validTimestamp(registry.updatedAt)) {
      return Object.freeze({ ok: true, value: /** @type {PlatformAuthorityRegistry} */ (value) });
    }
  }
  return Object.freeze({ ok: false, issue: Object.freeze({
    code: "INVALID_ARGUMENT", field: "platformAuthorityRegistry", reason: "invalid_platform_authority_registry"
  }) });
};
