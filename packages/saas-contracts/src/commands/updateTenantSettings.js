import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { REGISTRATION_POLICY_FIELDS } from "../persistence/tenantContracts.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isCanonicalBcp47, isPlainObject } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values */
const frozen = (values) => Object.freeze(values);

/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;

/** @param {unknown} value */
const text = (value) =>
  typeof value === "string"
  && value.length > 0
  && value === value.trim();

/** @param {unknown} value */
const httpsUrl = (value) => {
  if (typeof value !== "string") return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const invalid = () => Object.freeze({
  ok: false,
  issue: Object.freeze({
    code: "INVALID_ARGUMENT",
    field: "updateTenantSettings",
    reason: "invalid_update_tenant_settings",
  }),
});

export const UPDATE_TENANT_SETTINGS_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "expectedVersion",
  "settings",
]);

export const UPDATE_TENANT_SETTINGS_FIELDS = frozen([
  "defaultLocale",
  "registrationPolicy",
  "featureFlags",
  "supportEmail",
  "supportUrl",
]);

export const UPDATE_TENANT_SETTINGS_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const UPDATE_TENANT_SETTINGS_OPERATION = COMMAND_TYPES.UPDATE_TENANT_SETTINGS;
export const UPDATE_TENANT_SETTINGS_RESOURCE_TYPE = "tenant";
export const UPDATE_TENANT_SETTINGS_AUDIT_OPERATION = "UpdateTenantSettings.update";
export const UPDATE_TENANT_SETTINGS_AUDIT_LEVEL = AUDIT_LEVELS.PRIVILEGED;
export const UPDATE_TENANT_SETTINGS_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const UPDATE_TENANT_SETTINGS_AUDIT_BEFORE_FIELDS = frozen([
  "tenantStatus",
  "settingsVersion",
]);
export const UPDATE_TENANT_SETTINGS_AUDIT_AFTER_FIELDS = frozen([
  "tenantStatus",
  "settingsVersion",
]);
export const UPDATE_TENANT_SETTINGS_AUDIT_METADATA_FIELDS = frozen([
  "stage",
]);

/** @param {unknown} value */
export const validateUpdateTenantSettingsInput = (value) => {
  if (!hasExactKeys(value, UPDATE_TENANT_SETTINGS_INPUT_FIELDS)) return invalid();

  const v = /** @type {Record<string, unknown>} */ (value);

  if (!validId(v.commandId) || !validId(v.correlationId) || !validId(v.tenantId)) {
    return invalid();
  }

  if (
    typeof v.expectedVersion !== "number"
    || !Number.isInteger(v.expectedVersion)
    || v.expectedVersion < 1
  ) {
    return invalid();
  }

  if (!isPlainObject(v.settings)) return invalid();

  const settings = /** @type {Record<string, unknown>} */ (v.settings);

  if (!hasExactKeys(settings, UPDATE_TENANT_SETTINGS_FIELDS)) return invalid();

  if (!isCanonicalBcp47(settings.defaultLocale)) return invalid();

  if (!isPlainObject(settings.registrationPolicy)) return invalid();

  const registrationPolicy =
    /** @type {Record<string, unknown>} */ (settings.registrationPolicy);

  if (!hasExactKeys(registrationPolicy, REGISTRATION_POLICY_FIELDS)) return invalid();

  if (!REGISTRATION_POLICY_FIELDS.every(
    (field) => typeof registrationPolicy[field] === "boolean",
  )) return invalid();

  if (!isPlainObject(settings.featureFlags)) return invalid();

  if (!Object.values(settings.featureFlags).every(
    (flag) => typeof flag === "boolean",
  )) return invalid();

  if (!(settings.supportEmail === null || text(settings.supportEmail))) {
    return invalid();
  }

  if (!(settings.supportUrl === null || httpsUrl(settings.supportUrl))) {
    return invalid();
  }

  return Object.freeze({ ok: true, value });
};

/** @param {Readonly<Record<string, unknown>>} input */
export const updateTenantSettingsBehavioralPayload = (input) => Object.freeze({
  tenantId: input.tenantId,
  expectedVersion: input.expectedVersion,
  settings: input.settings,
});

/** @param {unknown} value */
export const validateUpdateTenantSettingsResult = (value) => {
  if (!hasExactKeys(value, UPDATE_TENANT_SETTINGS_RESULT_FIELDS)) return invalid();

  const v = /** @type {Record<string, unknown>} */ (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && v.operation === UPDATE_TENANT_SETTINGS_OPERATION
    && v.resourceType === UPDATE_TENANT_SETTINGS_RESOURCE_TYPE
    && validId(v.resourceId)
    && v.status === "succeeded"
    && typeof v.replayed === "boolean"
    ? Object.freeze({ ok: true, value })
    : invalid();
};