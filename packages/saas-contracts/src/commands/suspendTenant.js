import { AUDIT_LEVELS, AUDIT_RESULTS } from "../audit/contracts.js";
import { validateDocumentIdentifier } from "../validation/identifiers.js";
import { hasExactKeys } from "../validation/objects.js";
import { COMMAND_TYPES } from "./contracts.js";

/** @template {readonly string[]} T @param {T} values */
const frozen = (values) => Object.freeze(values);

/** @param {unknown} value */
const validId = (value) => validateDocumentIdentifier(value).ok;

const invalid = () => Object.freeze({
  ok: false,
  issue: Object.freeze({
    code: "INVALID_ARGUMENT",
    field: "suspendTenant",
    reason: "invalid_suspend_tenant",
  }),
});

export const SUSPEND_TENANT_INPUT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "tenantId",
]);

export const SUSPEND_TENANT_RESULT_FIELDS = frozen([
  "commandId",
  "correlationId",
  "operation",
  "resourceType",
  "resourceId",
  "status",
  "replayed",
]);

export const SUSPEND_TENANT_OPERATION =
  COMMAND_TYPES.SUSPEND_TENANT;

export const SUSPEND_TENANT_RESOURCE_TYPE = "tenant";

export const SUSPEND_TENANT_TARGET_STATE = "suspended";

export const SUSPEND_TENANT_AUDIT_OPERATION =
  "SuspendTenant.update";

export const SUSPEND_TENANT_AUDIT_LEVEL =
  AUDIT_LEVELS.CRITICAL;

export const SUSPEND_TENANT_AUDIT_RESULT =
  AUDIT_RESULTS.SUCCEEDED;

export const SUSPEND_TENANT_AUDIT_BEFORE_FIELDS = frozen([
  "tenantStatus",
]);

export const SUSPEND_TENANT_AUDIT_AFTER_FIELDS = frozen([
  "tenantStatus",
]);

export const SUSPEND_TENANT_AUDIT_METADATA_FIELDS = frozen([
  "stage",
]);

/** @param {unknown} value */
export const validateSuspendTenantInput = (value) => {
  if (!hasExactKeys(value, SUSPEND_TENANT_INPUT_FIELDS)) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && validId(v.tenantId)
    ? Object.freeze({ ok: true, value })
    : invalid();
};

/** @param {Readonly<Record<string, unknown>>} input */
export const suspendTenantBehavioralPayload = (input) =>
  Object.freeze({
    tenantId: input.tenantId,
    targetState: SUSPEND_TENANT_TARGET_STATE,
  });

/** @param {unknown} value */
export const validateSuspendTenantResult = (value) => {
  if (!hasExactKeys(value, SUSPEND_TENANT_RESULT_FIELDS)) {
    return invalid();
  }

  const v = /** @type {Record<string, unknown>} */ (value);

  return validId(v.commandId)
    && validId(v.correlationId)
    && v.operation === SUSPEND_TENANT_OPERATION
    && v.resourceType === SUSPEND_TENANT_RESOURCE_TYPE
    && validId(v.resourceId)
    && v.status === "succeeded"
    && typeof v.replayed === "boolean"
    ? Object.freeze({ ok: true, value })
    : invalid();
};
