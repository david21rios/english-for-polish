import test from "node:test";
import assert from "node:assert/strict";

import {
  ATOMIC_TENANT_COMMAND_TYPES,
  COMMAND_TYPES,
  SUSPEND_TENANT_AUDIT_AFTER_FIELDS,
  SUSPEND_TENANT_AUDIT_BEFORE_FIELDS,
  SUSPEND_TENANT_AUDIT_LEVEL,
  SUSPEND_TENANT_AUDIT_METADATA_FIELDS,
  SUSPEND_TENANT_AUDIT_OPERATION,
  SUSPEND_TENANT_AUDIT_RESULT,
  SUSPEND_TENANT_INPUT_FIELDS,
  SUSPEND_TENANT_OPERATION,
  SUSPEND_TENANT_RESOURCE_TYPE,
  SUSPEND_TENANT_RESULT_FIELDS,
  SUSPEND_TENANT_TARGET_STATE,
  isPrivilegedCommandStageAllowed,
  suspendTenantBehavioralPayload,
  validateSuspendTenantInput,
  validateSuspendTenantResult,
} from "../src/commands/index.js";

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
});

test("SuspendTenant command identity is materialized exactly", () => {
  assert.equal(
    COMMAND_TYPES.SUSPEND_TENANT,
    "SuspendTenant",
  );

  assert.equal(
    SUSPEND_TENANT_OPERATION,
    "SuspendTenant",
  );

  assert.equal(
    SUSPEND_TENANT_RESOURCE_TYPE,
    "tenant",
  );

  assert.equal(
    SUSPEND_TENANT_TARGET_STATE,
    "suspended",
  );

  assert.ok(
    ATOMIC_TENANT_COMMAND_TYPES.includes(
      COMMAND_TYPES.SUSPEND_TENANT,
    ),
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.SUSPEND_TENANT,
      "completed",
    ),
    true,
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.SUSPEND_TENANT,
      "prepared",
    ),
    false,
  );
});

test("SuspendTenant exact input and result fields are frozen", () => {
  assert.deepEqual(
    SUSPEND_TENANT_INPUT_FIELDS,
    [
      "commandId",
      "correlationId",
      "tenantId",
    ],
  );

  assert.deepEqual(
    SUSPEND_TENANT_RESULT_FIELDS,
    [
      "commandId",
      "correlationId",
      "operation",
      "resourceType",
      "resourceId",
      "status",
      "replayed",
    ],
  );

  assert.equal(
    Object.isFrozen(SUSPEND_TENANT_INPUT_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(SUSPEND_TENANT_RESULT_FIELDS),
    true,
  );
});

test("SuspendTenant valid exact input passes", () => {
  assert.equal(
    validateSuspendTenantInput(validInput).ok,
    true,
  );
});

test("SuspendTenant rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
  ]) {
    assert.equal(
      validateSuspendTenantInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("SuspendTenant rejects unknown and caller-owned lifecycle fields", () => {
  for (const [field, value] of [
    ["targetState", "suspended"],
    ["reason", "maintenance"],
    ["actorUid", "uid-1"],
    ["authority", "platform_admin"],
    ["role", "platform_admin"],
    ["capability", "platform.tenant_suspend"],
    ["status", "active"],
    ["updatedAt", "2026-08-16T00:00:00.000Z"],
  ]) {
    assert.equal(
      validateSuspendTenantInput({
        ...validInput,
        [field]: value,
      }).ok,
      false,
      field,
    );
  }
});

test("SuspendTenant behavioral payload derives targetState canonically", () => {
  const payload =
    suspendTenantBehavioralPayload(validInput);

  assert.deepEqual(
    payload,
    {
      tenantId: "tenant-1",
      targetState: "suspended",
    },
  );

  assert.equal(
    Object.hasOwn(payload, "commandId"),
    false,
  );

  assert.equal(
    Object.hasOwn(payload, "correlationId"),
    false,
  );

  assert.equal(
    Object.isFrozen(payload),
    true,
  );
});

test("SuspendTenant result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "SuspendTenant",
    resourceType: "tenant",
    resourceId: "tenant-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(
    validateSuspendTenantResult(result).ok,
    true,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      operation: "Other",
    }).ok,
    false,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      resourceType: "tenantBranding",
    }).ok,
    false,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      resourceId: "../bad",
    }).ok,
    false,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      status: "pending",
    }).ok,
    false,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      replayed: "false",
    }).ok,
    false,
  );

  assert.equal(
    validateSuspendTenantResult({
      ...result,
      targetState: "suspended",
    }).ok,
    false,
  );
});

test("SuspendTenant audit contract is exact and non-raw", () => {
  assert.equal(
    SUSPEND_TENANT_AUDIT_OPERATION,
    "SuspendTenant.update",
  );

  assert.equal(
    SUSPEND_TENANT_AUDIT_LEVEL,
    "critical",
  );

  assert.equal(
    SUSPEND_TENANT_AUDIT_RESULT,
    "succeeded",
  );

  assert.deepEqual(
    SUSPEND_TENANT_AUDIT_BEFORE_FIELDS,
    [
      "tenantStatus",
    ],
  );

  assert.deepEqual(
    SUSPEND_TENANT_AUDIT_AFTER_FIELDS,
    [
      "tenantStatus",
    ],
  );

  assert.deepEqual(
    SUSPEND_TENANT_AUDIT_METADATA_FIELDS,
    [
      "stage",
    ],
  );

  const allAuditFields = [
    ...SUSPEND_TENANT_AUDIT_BEFORE_FIELDS,
    ...SUSPEND_TENANT_AUDIT_AFTER_FIELDS,
    ...SUSPEND_TENANT_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "reason",
    "membershipId",
    "courseId",
    "enrollmentId",
    "membership",
    "course",
    "enrollment",
    "displayName",
  ]) {
    assert.equal(
      allAuditFields.includes(forbidden),
      false,
      forbidden,
    );
  }
});
