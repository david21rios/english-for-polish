import test from "node:test";
import assert from "node:assert/strict";

import {
  ATOMIC_TENANT_COMMAND_TYPES,
  COMMAND_TYPES,
  RESTORE_TENANT_AUDIT_AFTER_FIELDS,
  RESTORE_TENANT_AUDIT_BEFORE_FIELDS,
  RESTORE_TENANT_AUDIT_LEVEL,
  RESTORE_TENANT_AUDIT_METADATA_FIELDS,
  RESTORE_TENANT_AUDIT_OPERATION,
  RESTORE_TENANT_AUDIT_RESULT,
  RESTORE_TENANT_INPUT_FIELDS,
  RESTORE_TENANT_OPERATION,
  RESTORE_TENANT_RESOURCE_TYPE,
  RESTORE_TENANT_RESULT_FIELDS,
  RESTORE_TENANT_TARGET_STATE,
  isPrivilegedCommandStageAllowed,
  restoreTenantBehavioralPayload,
  validateRestoreTenantInput,
  validateRestoreTenantResult,
} from "../src/commands/index.js";

const validInput =
  Object.freeze({
    commandId:
      "command-1",

    correlationId:
      "correlation-1",

    tenantId:
      "tenant-1",
  });

test(
  "RestoreTenant command identity is materialized exactly",
  () => {
    assert.equal(
      COMMAND_TYPES.RESTORE_TENANT,
      "RestoreTenant",
    );

    assert.equal(
      RESTORE_TENANT_OPERATION,
      "RestoreTenant",
    );

    assert.equal(
      RESTORE_TENANT_RESOURCE_TYPE,
      "tenant",
    );

    assert.equal(
      RESTORE_TENANT_TARGET_STATE,
      "active",
    );

    assert.ok(
      ATOMIC_TENANT_COMMAND_TYPES.includes(
        COMMAND_TYPES.RESTORE_TENANT,
      ),
    );

    assert.equal(
      isPrivilegedCommandStageAllowed(
        COMMAND_TYPES.RESTORE_TENANT,
        "completed",
      ),
      true,
    );

    assert.equal(
      isPrivilegedCommandStageAllowed(
        COMMAND_TYPES.RESTORE_TENANT,
        "prepared",
      ),
      false,
    );
  },
);

test(
  "RestoreTenant exact input and result fields are frozen",
  () => {
    assert.deepEqual(
      RESTORE_TENANT_INPUT_FIELDS,
      [
        "commandId",
        "correlationId",
        "tenantId",
      ],
    );

    assert.deepEqual(
      RESTORE_TENANT_RESULT_FIELDS,
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
      Object.isFrozen(
        RESTORE_TENANT_INPUT_FIELDS,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        RESTORE_TENANT_RESULT_FIELDS,
      ),
      true,
    );
  },
);

test(
  "RestoreTenant valid exact input passes",
  () => {
    assert.equal(
      validateRestoreTenantInput(
        validInput,
      ).ok,
      true,
    );
  },
);

test(
  "RestoreTenant rejects malformed identifiers",
  () => {
    for (const field of [
      "commandId",
      "correlationId",
      "tenantId",
    ]) {
      assert.equal(
        validateRestoreTenantInput({
          ...validInput,
          [field]:
            "../bad",
        }).ok,
        false,
        field,
      );
    }
  },
);

test(
  "RestoreTenant rejects unknown and caller-owned lifecycle fields",
  () => {
    for (const [
      field,
      value,
    ] of [
      [
        "targetState",
        "active",
      ],
      [
        "reason",
        "maintenance",
      ],
      [
        "actorUid",
        "uid-1",
      ],
      [
        "authority",
        "platform_admin",
      ],
      [
        "role",
        "platform_admin",
      ],
      [
        "capability",
        "platform.tenant_restore",
      ],
      [
        "status",
        "suspended",
      ],
      [
        "updatedAt",
        "2026-08-16T00:00:00.000Z",
      ],
    ]) {
      assert.equal(
        validateRestoreTenantInput({
          ...validInput,
          [field]:
            value,
        }).ok,
        false,
        field,
      );
    }
  },
);

test(
  "RestoreTenant behavioral payload derives targetState canonically",
  () => {
    const payload =
      restoreTenantBehavioralPayload(
        validInput,
      );

    assert.deepEqual(
      payload,
      {
        tenantId:
          "tenant-1",

        targetState:
          "active",
      },
    );

    assert.equal(
      Object.hasOwn(
        payload,
        "commandId",
      ),
      false,
    );

    assert.equal(
      Object.hasOwn(
        payload,
        "correlationId",
      ),
      false,
    );

    assert.equal(
      Object.isFrozen(
        payload,
      ),
      true,
    );
  },
);

test(
  "RestoreTenant result contract is exact",
  () => {
    const result = {
      commandId:
        "command-1",

      correlationId:
        "correlation-1",

      operation:
        "RestoreTenant",

      resourceType:
        "tenant",

      resourceId:
        "tenant-1",

      status:
        "succeeded",

      replayed:
        false,
    };

    assert.equal(
      validateRestoreTenantResult(
        result,
      ).ok,
      true,
    );

    for (const mutation of [
      {
        ...result,
        operation:
          "Other",
      },
      {
        ...result,
        resourceType:
          "tenantBranding",
      },
      {
        ...result,
        resourceId:
          "../bad",
      },
      {
        ...result,
        status:
          "pending",
      },
      {
        ...result,
        replayed:
          "false",
      },
      {
        ...result,
        targetState:
          "active",
      },
    ]) {
      assert.equal(
        validateRestoreTenantResult(
          mutation,
        ).ok,
        false,
      );
    }
  },
);

test(
  "RestoreTenant audit contract is exact and non-raw",
  () => {
    assert.equal(
      RESTORE_TENANT_AUDIT_OPERATION,
      "RestoreTenant.update",
    );

    assert.equal(
      RESTORE_TENANT_AUDIT_LEVEL,
      "critical",
    );

    assert.equal(
      RESTORE_TENANT_AUDIT_RESULT,
      "succeeded",
    );

    assert.deepEqual(
      RESTORE_TENANT_AUDIT_BEFORE_FIELDS,
      [
        "tenantStatus",
      ],
    );

    assert.deepEqual(
      RESTORE_TENANT_AUDIT_AFTER_FIELDS,
      [
        "tenantStatus",
      ],
    );

    assert.deepEqual(
      RESTORE_TENANT_AUDIT_METADATA_FIELDS,
      [
        "stage",
      ],
    );

    const allAuditFields = [
      ...RESTORE_TENANT_AUDIT_BEFORE_FIELDS,
      ...RESTORE_TENANT_AUDIT_AFTER_FIELDS,
      ...RESTORE_TENANT_AUDIT_METADATA_FIELDS,
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
        allAuditFields.includes(
          forbidden,
        ),
        false,
        forbidden,
      );
    }
  },
);