import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { TENANT_BRAND_COLORS_FIELDS } from "../persistence/tenantContracts.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys, isPlainObject } from "../validation/objects.js";
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
const nullableText = (value) => value === null || text(value);

const invalid = () => Object.freeze({
  ok: false,
  issue: Object.freeze({
    code: "INVALID_ARGUMENT",
    field: "updateTenantBranding",
    reason: "invalid_update_tenant_branding",
  }),
});

export const UPDATE_TENANT_BRANDING_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
  "expectedVersion",
  "branding",
]);

export const UPDATE_TENANT_BRANDING_FIELDS = frozen([
  "displayName",
  "logoUrl",
  "faviconUrl",
  "colors",
]);

export const UPDATE_TENANT_BRANDING_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const UPDATE_TENANT_BRANDING_OPERATION =
  COMMAND_TYPES.UPDATE_TENANT_BRANDING;

export const UPDATE_TENANT_BRANDING_RESOURCE_TYPE = "tenantBranding";

export const UPDATE_TENANT_BRANDING_AUDIT_OPERATION =
  "UpdateTenantBranding.update";

export const UPDATE_TENANT_BRANDING_AUDIT_LEVEL =
  AUDIT_LEVELS.PRIVILEGED;

export const UPDATE_TENANT_BRANDING_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const UPDATE_TENANT_BRANDING_AUDIT_BEFORE_FIELDS = frozen([
  "brandingVersion",
]);

export const UPDATE_TENANT_BRANDING_AUDIT_AFTER_FIELDS = frozen([
  "brandingVersion",
]);

export const UPDATE_TENANT_BRANDING_AUDIT_METADATA_FIELDS = frozen([
  "stage",
  "previousVersion",
  "nextVersion",
]);

/** @param {unknown} value */
export const validateUpdateTenantBrandingInput = (value) => {
  if (!hasExactKeys(value, UPDATE_TENANT_BRANDING_INPUT_FIELDS)) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  if (
    !validId(v.commandId)
    || !validId(v.correlationId)
    || !validId(v.tenantId)
  ) {
    return invalid();
  }

  if (
    typeof v.expectedVersion !== "number"
    || !Number.isInteger(v.expectedVersion)
    || v.expectedVersion < 1
  ) {
    return invalid();
  }

  if (!isPlainObject(v.branding)) return invalid();

  const branding =
    /** @type {Record<string, unknown>} */ (v.branding);

  if (!hasExactKeys(
    branding,
    UPDATE_TENANT_BRANDING_FIELDS,
  )) {
    return invalid();
  }

  if (
    !nullableText(branding.displayName)
    || !nullableText(branding.logoUrl)
    || !nullableText(branding.faviconUrl)
  ) {
    return invalid();
  }

  if (!isPlainObject(branding.colors)) return invalid();

  const colors =
    /** @type {Record<string, unknown>} */ (branding.colors);

  if (!hasExactKeys(colors, TENANT_BRAND_COLORS_FIELDS)) {
    return invalid();
  }

  if (!TENANT_BRAND_COLORS_FIELDS.every(
    (field) => text(colors[field]),
  )) {
    return invalid();
  }

  return Object.freeze({ ok: true, value });
};

/** @param {Readonly<Record<string, unknown>>} input */
export const updateTenantBrandingBehavioralPayload = (input) =>
  Object.freeze({
    tenantId: input.tenantId,
    expectedVersion: input.expectedVersion,
    branding: input.branding,
  });

/** @param {unknown} value */
export const validateUpdateTenantBrandingResult = (value) => {
  if (!hasExactKeys(
    value,
    UPDATE_TENANT_BRANDING_RESULT_FIELDS,
  )) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && v.operation === UPDATE_TENANT_BRANDING_OPERATION
    && v.resourceType === UPDATE_TENANT_BRANDING_RESOURCE_TYPE
    && validId(v.resourceId)
    && v.status === "succeeded"
    && typeof v.replayed === "boolean"
    ? Object.freeze({ ok: true, value })
    : invalid();
};