import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { TENANT_STATUSES, TENANT_TYPES } from "../domain/tenant.js";
import { REGISTRATION_POLICY_FIELDS, TENANT_BRAND_COLORS_FIELDS } from "../persistence/tenantContracts.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isPlainObject } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values */
const frozen = (values) => Object.freeze(values);
/** @param {unknown} value */ const validId = (value) => validateDocumentIdentifier(value).ok;
/** @param {unknown} value */ const text = (value) => typeof value === "string" && value.length > 0 && value === value.trim();
/** @param {unknown} value */ const nullableText = (value) => value === null || text(value);
/** @param {unknown} value */ const normalizedEmail = (value) => typeof value === "string"
  && value === value.trim().toLowerCase() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/u.test(value);
/** @param {unknown} value */ const nullableHttpsUrl = (value) => {
  if (value === null) return true;
  if (typeof value !== "string" || value !== value.trim()) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const invalid = () => Object.freeze({ ok: false, issue: Object.freeze({ code: "INVALID_ARGUMENT", field: "bootstrapTenant", reason: "invalid_bootstrap_tenant" }) });

export const BOOTSTRAP_TENANT_INPUT_FIELDS = frozen(["commandId", "correlationId", "tenantId", "tenant", "settings", "branding", "firstAdminUid", "expectedAdminEmail", "initialStatus"]);
export const BOOTSTRAP_TENANT_PROFILE_FIELDS = frozen(["tenantType", "displayName", "shortName", "country", "locale", "timezone"]);
export const BOOTSTRAP_TENANT_SETTINGS_FIELDS = frozen(["defaultLocale", "registrationPolicy", "featureFlags", "supportEmail", "supportUrl"]);
export const BOOTSTRAP_TENANT_BRANDING_FIELDS = frozen(["displayName", "logoUrl", "faviconUrl", "colors"]);
export const BOOTSTRAP_TENANT_RESULT_FIELDS = frozen(["commandId", "correlationId", "operation", "resourceType", "resourceId", "status", "replayed"]);
export const BOOTSTRAP_TENANT_OPERATION = COMMAND_TYPES.BOOTSTRAP_TENANT;
export const BOOTSTRAP_TENANT_RESOURCE_TYPE = "tenant";
export const BOOTSTRAP_TENANT_AUDIT_OPERATION = "BootstrapTenant.create";
export const BOOTSTRAP_TENANT_AUDIT_LEVEL = AUDIT_LEVELS.CRITICAL;
export const BOOTSTRAP_TENANT_AUDIT_RESULT = AUDIT_RESULTS.SUCCEEDED;
export const BOOTSTRAP_TENANT_AUDIT_BEFORE_FIELDS = frozen(["tenantExists"]);
export const BOOTSTRAP_TENANT_AUDIT_AFTER_FIELDS = frozen(["tenantStatus", "firstAdminStatus", "tenantAdminActiveCount"]);
export const BOOTSTRAP_TENANT_AUDIT_METADATA_FIELDS = frozen(["stage", "tenantType"]);

/** @param {unknown} value */
export const validateBootstrapTenantInput = (value) => {
  if (!hasExactKeys(value, BOOTSTRAP_TENANT_INPUT_FIELDS)) return invalid();
  const v = /** @type {Record<string, unknown>} */ (value);
  const tenant = /** @type {Record<string, unknown>} */ (v.tenant);
  const settings = /** @type {Record<string, unknown>} */ (v.settings);
  const branding = /** @type {Record<string, unknown>} */ (v.branding);
  if (!hasExactKeys(tenant, BOOTSTRAP_TENANT_PROFILE_FIELDS) || !hasExactKeys(settings, BOOTSTRAP_TENANT_SETTINGS_FIELDS)
    || !hasExactKeys(branding, BOOTSTRAP_TENANT_BRANDING_FIELDS)) return invalid();
  const email = v.expectedAdminEmail;
  const valid = validId(v.commandId) && validId(v.correlationId) && validId(v.tenantId) && validId(v.firstAdminUid)
    && v.initialStatus === TENANT_STATUSES.ACTIVE && Object.values(TENANT_TYPES).includes(/** @type {never} */ (tenant.tenantType))
    && [tenant.displayName, tenant.shortName, tenant.country, tenant.locale, tenant.timezone, settings.defaultLocale].every(text)
    && hasExactKeys(settings.registrationPolicy, REGISTRATION_POLICY_FIELDS) && Object.values(/** @type {Record<string, unknown>} */ (settings.registrationPolicy)).every((item) => typeof item === "boolean")
    && isPlainObject(settings.featureFlags) && Object.values(settings.featureFlags).every((item) => typeof item === "boolean")
    && nullableText(settings.supportEmail) && nullableHttpsUrl(settings.supportUrl)
    && nullableText(branding.displayName) && nullableText(branding.logoUrl) && nullableText(branding.faviconUrl)
    && hasExactKeys(branding.colors, TENANT_BRAND_COLORS_FIELDS) && Object.values(/** @type {Record<string, unknown>} */ (branding.colors)).every(text)
    && normalizedEmail(email);
  return valid ? Object.freeze({ ok: true, value }) : invalid();
};

/** @param {Readonly<Record<string, unknown>>} input */
export const bootstrapTenantBehavioralPayload = (input) => Object.freeze({
  tenantId: input.tenantId, tenant: input.tenant, settings: input.settings,
  branding: input.branding, firstAdminUid: input.firstAdminUid,
  expectedAdminEmail: input.expectedAdminEmail, initialStatus: input.initialStatus,
});

/** @param {unknown} value */
export const validateBootstrapTenantResult = (value) => {
  if (!hasExactKeys(value, BOOTSTRAP_TENANT_RESULT_FIELDS)) return invalid();
  const v = /** @type {Record<string, unknown>} */ (value);
  return validId(v.commandId) && validId(v.correlationId)
    && v.operation === BOOTSTRAP_TENANT_OPERATION && v.resourceType === BOOTSTRAP_TENANT_RESOURCE_TYPE
    && validId(v.resourceId) && v.status === "succeeded" && typeof v.replayed === "boolean"
    ? Object.freeze({ ok: true, value }) : invalid();
};
