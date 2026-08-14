import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { isCanonicalBcp47 } from "../validation/objects.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isPlainObject } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values */
const frozen = (values) => Object.freeze(values);

/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;

/** @param {unknown} value */
const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();

const invalid = () => Object.freeze({
  ok: false,
  issue: Object.freeze({
    code: "INVALID_ARGUMENT",
    field: "updateTenantProfile",
    reason: "invalid_update_tenant_profile",
  }),
});

export const UPDATE_TENANT_PROFILE_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "patch",
]);

export const UPDATE_TENANT_PROFILE_PATCH_FIELDS = frozen([
  "displayName",
  "shortName",
  "country",
  "locale",
  "timezone",
]);

export const UPDATE_TENANT_PROFILE_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const UPDATE_TENANT_PROFILE_OPERATION = COMMAND_TYPES.UPDATE_TENANT_PROFILE;
export const UPDATE_TENANT_PROFILE_RESOURCE_TYPE = "tenant";
export const UPDATE_TENANT_PROFILE_AUDIT_OPERATION = "UpdateTenantProfile.update";
export const UPDATE_TENANT_PROFILE_AUDIT_LEVEL = AUDIT_LEVELS.PRIVILEGED;
export const UPDATE_TENANT_PROFILE_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS = frozen(["tenantStatus"]);
export const UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS = frozen(["tenantStatus"]);
export const UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS = frozen(["stage", "changedFieldCount"]);

/** @param {unknown} value */
export const validateUpdateTenantProfileInput = (value) => {
  if (!hasExactKeys(value, UPDATE_TENANT_PROFILE_INPUT_FIELDS)) return invalid();

  const v = /** @type {Record<string, unknown>} */ (value);
  if (!isPlainObject(v.patch)) return invalid();

  const patch = /** @type {Record<string, unknown>} */ (v.patch);
  const keys = Object.keys(patch);

  if (keys.length < 1 || keys.length > UPDATE_TENANT_PROFILE_PATCH_FIELDS.length) return invalid();
  if (keys.some((key) => !UPDATE_TENANT_PROFILE_PATCH_FIELDS.includes(key))) return invalid();

  if (!validId(v.commandId) || !validId(v.correlationId) || !validId(v.tenantId)) return invalid();

  if (Object.hasOwn(patch, "displayName") && !text(patch.displayName)) return invalid();
  if (Object.hasOwn(patch, "shortName") && !text(patch.shortName)) return invalid();
  if (Object.hasOwn(patch, "country")
    && !(typeof patch.country === "string" && /^[A-Z]{2}$/u.test(patch.country))) return invalid();
  if (Object.hasOwn(patch, "locale") && !isCanonicalBcp47(patch.locale)) return invalid();
  if (Object.hasOwn(patch, "timezone") && !text(patch.timezone)) return invalid();

  return Object.freeze({ ok: true, value });
};

/** @param {Readonly<Record<string, unknown>>} input */
export const updateTenantProfileBehavioralPayload = (input) => Object.freeze({
  tenantId: input.tenantId,
  patch: input.patch,
});

/** @param {unknown} value */
export const validateUpdateTenantProfileResult = (value) => {
  if (!hasExactKeys(value, UPDATE_TENANT_PROFILE_RESULT_FIELDS)) return invalid();

  const v = /** @type {Record<string, unknown>} */ (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && v.operation === UPDATE_TENANT_PROFILE_OPERATION
    && v.resourceType === UPDATE_TENANT_PROFILE_RESOURCE_TYPE
    && validId(v.resourceId)
    && v.status === "succeeded"
    && typeof v.replayed === "boolean"
    ? Object.freeze({ ok: true, value })
    : invalid();
};