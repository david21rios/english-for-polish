import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMAND_TYPES,
  ATOMIC_TENANT_COMMAND_TYPES,
  UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_LEVEL,
  UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS,
  UPDATE_TENANT_PROFILE_AUDIT_OPERATION,
  UPDATE_TENANT_PROFILE_AUDIT_RESULT,
  UPDATE_TENANT_PROFILE_INPUT_FIELDS,
  UPDATE_TENANT_PROFILE_OPERATION,
  UPDATE_TENANT_PROFILE_PATCH_FIELDS,
  UPDATE_TENANT_PROFILE_RESOURCE_TYPE,
  UPDATE_TENANT_PROFILE_RESULT_FIELDS,
  isPrivilegedCommandStageAllowed,
  updateTenantProfileBehavioralPayload,
  validateUpdateTenantProfileInput,
  validateUpdateTenantProfileResult,
} from "../src/commands/index.js";

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  patch: Object.freeze({
    displayName: "Acme Academy",
    shortName: "Acme",
    country: "PL",
    locale: "pl",
    timezone: "Europe/Warsaw",
  }),
});

test("UpdateTenantProfile command identity is materialized exactly", () => {
  assert.equal(COMMAND_TYPES.UPDATE_TENANT_PROFILE, "UpdateTenantProfile");
  assert.equal(UPDATE_TENANT_PROFILE_OPERATION, "UpdateTenantProfile");
  assert.equal(UPDATE_TENANT_PROFILE_RESOURCE_TYPE, "tenant");
  assert.ok(ATOMIC_TENANT_COMMAND_TYPES.includes(COMMAND_TYPES.UPDATE_TENANT_PROFILE));
  assert.equal(isPrivilegedCommandStageAllowed(COMMAND_TYPES.UPDATE_TENANT_PROFILE, "completed"), true);
  assert.equal(isPrivilegedCommandStageAllowed(COMMAND_TYPES.UPDATE_TENANT_PROFILE, "prepared"), false);
});

test("UpdateTenantProfile field constants are exact", () => {
  assert.deepEqual(UPDATE_TENANT_PROFILE_INPUT_FIELDS, [
    "commandId",
    "correlationId",
    "tenantId",
    "patch",
  ]);

  assert.deepEqual(UPDATE_TENANT_PROFILE_PATCH_FIELDS, [
    "displayName",
    "shortName",
    "country",
    "locale",
    "timezone",
  ]);

  assert.deepEqual(UPDATE_TENANT_PROFILE_RESULT_FIELDS, [
    "commandId",
    "correlationId",
    "operation",
    "resourceType",
    "resourceId",
    "status",
    "replayed",
  ]);
});

test("UpdateTenantProfile valid input passes", () => {
  const validation = validateUpdateTenantProfileInput(validInput);
  assert.equal(validation.ok, true);
});

test("UpdateTenantProfile allows partial non-empty profile patch", () => {
  for (const [field, value] of Object.entries({
    displayName: "Academy",
    shortName: "ACA",
    country: "CO",
    locale: "es-CO",
    timezone: "America/Bogota",
  })) {
    const input = {
      commandId: "command-1",
      correlationId: "correlation-1",
      tenantId: "tenant-1",
      patch: { [field]: value },
    };

    assert.equal(validateUpdateTenantProfileInput(input).ok, true, field);
  }
});

test("UpdateTenantProfile rejects empty patch", () => {
  const input = { ...validInput, patch: {} };
  assert.equal(validateUpdateTenantProfileInput(input).ok, false);
});

test("UpdateTenantProfile rejects unknown top-level field", () => {
  const input = { ...validInput, membershipId: "membership-1" };
  assert.equal(validateUpdateTenantProfileInput(input).ok, false);
});

test("UpdateTenantProfile rejects forbidden patch fields", () => {
  for (const field of [
    "tenantType",
    "status",
    "createdAt",
    "updatedAt",
    "suspendedAt",
    "archivedAt",
    "expectedVersion",
    "expectedUpdatedAt",
    "revision",
    "membershipId",
  ]) {
    const input = {
      commandId: "command-1",
      correlationId: "correlation-1",
      tenantId: "tenant-1",
      patch: { [field]: "forbidden" },
    };

    assert.equal(validateUpdateTenantProfileInput(input).ok, false, field);
  }
});

test("UpdateTenantProfile rejects invalid profile values", () => {
  const invalidPatches = [
    { displayName: "" },
    { displayName: " padded " },
    { shortName: "" },
    { country: "pl" },
    { country: "POL" },
    { locale: "not_a_locale" },
    { timezone: "" },
    { timezone: " Europe/Warsaw " },
    { displayName: null },
  ];

  for (const patch of invalidPatches) {
    const input = {
      commandId: "command-1",
      correlationId: "correlation-1",
      tenantId: "tenant-1",
      patch,
    };

    assert.equal(validateUpdateTenantProfileInput(input).ok, false, JSON.stringify(patch));
  }
});

test("UpdateTenantProfile rejects malformed identifiers", () => {
  for (const field of ["commandId", "correlationId", "tenantId"]) {
    const input = { ...validInput, [field]: "../bad" };
    assert.equal(validateUpdateTenantProfileInput(input).ok, false, field);
  }
});

test("UpdateTenantProfile behavioral payload excludes envelope-only correlationId and commandId", () => {
  const payload = updateTenantProfileBehavioralPayload(validInput);

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    patch: validInput.patch,
  });
  assert.equal(Object.hasOwn(payload, "commandId"), false);
  assert.equal(Object.hasOwn(payload, "correlationId"), false);
});

test("UpdateTenantProfile result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "UpdateTenantProfile",
    resourceType: "tenant",
    resourceId: "tenant-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(validateUpdateTenantProfileResult(result).ok, true);
  assert.equal(validateUpdateTenantProfileResult({ ...result, membershipId: "membership-1" }).ok, false);
  assert.equal(validateUpdateTenantProfileResult({ ...result, operation: "Other" }).ok, false);
  assert.equal(validateUpdateTenantProfileResult({ ...result, resourceType: "membership" }).ok, false);
  assert.equal(validateUpdateTenantProfileResult({ ...result, status: "pending" }).ok, false);
});

test("UpdateTenantProfile audit contract is exact and non-PII", () => {
  assert.equal(UPDATE_TENANT_PROFILE_AUDIT_OPERATION, "UpdateTenantProfile.update");
  assert.equal(UPDATE_TENANT_PROFILE_AUDIT_LEVEL, "privileged");
  assert.equal(UPDATE_TENANT_PROFILE_AUDIT_RESULT, "succeeded");
  assert.deepEqual(UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS, ["tenantStatus"]);
  assert.deepEqual(UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS, ["tenantStatus"]);
  assert.deepEqual(UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS, ["stage", "changedFieldCount"]);

  const allAuditFields = [
    ...UPDATE_TENANT_PROFILE_AUDIT_BEFORE_FIELDS,
    ...UPDATE_TENANT_PROFILE_AUDIT_AFTER_FIELDS,
    ...UPDATE_TENANT_PROFILE_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of ["displayName", "shortName", "country", "locale", "timezone", "membershipId"]) {
    assert.equal(allAuditFields.includes(forbidden), false, forbidden);
  }
});