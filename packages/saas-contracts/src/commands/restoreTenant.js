import {
  AUDIT_LEVELS,
  AUDIT_RESULTS,
} from "../audit/index.js";

import {
  COMMAND_TYPES,
} from "./contracts.js";

/**
 * @template {readonly string[]} T
 * @param {T} values
 * @returns {Readonly<T>}
 */
const frozen = (
  values,
) =>
  Object.freeze(values);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
const validId = (
  value,
) =>
  typeof value === "string"
  && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(
    value,
  );

/**
 * @param {unknown} value
 * @param {readonly string[]} fields
 * @returns {boolean}
 */
const hasExactKeys = (
  value,
  fields,
) => {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    return false;
  }

  const keys =
    Object.keys(value);

  return keys.length === fields.length
    && fields.every(
      (field) =>
        Object.prototype.hasOwnProperty.call(
          value,
          field,
        ),
    );
};

const invalid = () =>
  Object.freeze({
    ok: false,

    issue: Object.freeze({
      code:
        "INVALID_ARGUMENT",

      field:
        "restoreTenant",

      reason:
        "invalid_restore_tenant",
    }),
  });

export const RESTORE_TENANT_INPUT_FIELDS =
  frozen([
    "commandId",
    "correlationId",
    "tenantId",
  ]);

export const RESTORE_TENANT_RESULT_FIELDS =
  frozen([
    "commandId",
    "correlationId",
    "operation",
    "resourceType",
    "resourceId",
    "status",
    "replayed",
  ]);

export const RESTORE_TENANT_OPERATION =
  COMMAND_TYPES.RESTORE_TENANT;

export const RESTORE_TENANT_RESOURCE_TYPE =
  "tenant";

export const RESTORE_TENANT_TARGET_STATE =
  "active";

export const RESTORE_TENANT_AUDIT_OPERATION =
  "RestoreTenant.update";

export const RESTORE_TENANT_AUDIT_LEVEL =
  AUDIT_LEVELS.CRITICAL;

export const RESTORE_TENANT_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const RESTORE_TENANT_AUDIT_BEFORE_FIELDS =
  frozen([
    "tenantStatus",
  ]);

export const RESTORE_TENANT_AUDIT_AFTER_FIELDS =
  frozen([
    "tenantStatus",
  ]);

export const RESTORE_TENANT_AUDIT_METADATA_FIELDS =
  frozen([
    "stage",
  ]);

/**
 * @param {unknown} value
 */
export const validateRestoreTenantInput = (
  value,
) => {
  if (
    !hasExactKeys(
      value,
      RESTORE_TENANT_INPUT_FIELDS,
    )
  ) {
    return invalid();
  }

  const v =
    /** @type {Record<string, unknown>} */
    (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && validId(v.tenantId)
    ? Object.freeze({
        ok: true,
        value,
      })
    : invalid();
};

/**
 * @param {Readonly<Record<string, unknown>>} input
 */
export const restoreTenantBehavioralPayload = (
  input,
) =>
  Object.freeze({
    tenantId:
      input.tenantId,

    targetState:
      RESTORE_TENANT_TARGET_STATE,
  });

/**
 * @param {unknown} value
 */
export const validateRestoreTenantResult = (
  value,
) => {
  if (
    !hasExactKeys(
      value,
      RESTORE_TENANT_RESULT_FIELDS,
    )
  ) {
    return invalid();
  }

  const v =
    /** @type {Record<string, unknown>} */
    (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && v.operation
      === RESTORE_TENANT_OPERATION
    && v.resourceType
      === RESTORE_TENANT_RESOURCE_TYPE
    && validId(v.resourceId)
    && v.status
      === "succeeded"
    && typeof v.replayed
      === "boolean"
    ? Object.freeze({
        ok: true,
        value,
      })
    : invalid();
};