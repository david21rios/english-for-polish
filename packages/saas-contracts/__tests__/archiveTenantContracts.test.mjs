import test from "node:test";
import assert from "node:assert/strict";

import {
  ATOMIC_TENANT_COMMAND_TYPES,
  COMMAND_TYPES,
  ARCHIVE_TENANT_AUDIT_AFTER_FIELDS,
  ARCHIVE_TENANT_AUDIT_BEFORE_FIELDS,
  ARCHIVE_TENANT_AUDIT_LEVEL,
  ARCHIVE_TENANT_AUDIT_METADATA_FIELDS,
  ARCHIVE_TENANT_AUDIT_OPERATION,
  ARCHIVE_TENANT_AUDIT_RESULT,
  ARCHIVE_TENANT_INPUT_FIELDS,
  ARCHIVE_TENANT_OPERATION,
  ARCHIVE_TENANT_RESOURCE_TYPE,
  ARCHIVE_TENANT_RESULT_FIELDS,
  ARCHIVE_TENANT_TARGET_STATE,
  isPrivilegedCommandStageAllowed,
  archiveTenantBehavioralPayload,
  validateArchiveTenantInput,
  validateArchiveTenantResult,
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
  "ArchiveTenant command identity is materialized exactly",
  () => {
    assert.equal(
      COMMAND_TYPES.ARCHIVE_TENANT,
      "ArchiveTenant",
    );

    assert.equal(
      ARCHIVE_TENANT_OPERATION,
      "ArchiveTenant",
    );

    assert.equal(
      ARCHIVE_TENANT_RESOURCE_TYPE,
      "tenant",
    );

    assert.equal(
      ARCHIVE_TENANT_TARGET_STATE,
      "archived",
    );

    assert.ok(
      ATOMIC_TENANT_COMMAND_TYPES.includes(
        COMMAND_TYPES.ARCHIVE_TENANT,
      ),
    );

    assert.equal(
      isPrivilegedCommandStageAllowed(
        COMMAND_TYPES.ARCHIVE_TENANT,
        "completed",
      ),
      true,
    );

    assert.equal(
      isPrivilegedCommandStageAllowed(
        COMMAND_TYPES.ARCHIVE_TENANT,
        "prepared",
      ),
      false,
    );
  },
);

test(
  "ArchiveTenant exact input and result fields are frozen",
  () => {
    assert.deepEqual(
      ARCHIVE_TENANT_INPUT_FIELDS,
      [
        "commandId",
        "correlationId",
        "tenantId",
      ],
    );

    assert.deepEqual(
      ARCHIVE_TENANT_RESULT_FIELDS,
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
        ARCHIVE_TENANT_INPUT_FIELDS,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        ARCHIVE_TENANT_RESULT_FIELDS,
      ),
      true,
    );
  },
);

test(
  "ArchiveTenant valid exact input passes",
  () => {
    assert.equal(
      validateArchiveTenantInput(
        validInput,
      ).ok,
      true,
    );
  },
);

test(
  "ArchiveTenant rejects malformed identifiers",
  () => {
    for (const field of [
      "commandId",
      "correlationId",
      "tenantId",
    ]) {
      assert.equal(
        validateArchiveTenantInput({
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
  "ArchiveTenant rejects unknown and caller-owned lifecycle fields",
  () => {
    for (const [
      field,
      value,
    ] of [
      [
        "targetState",
        "archived",
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
        validateArchiveTenantInput({
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
  "ArchiveTenant behavioral payload derives targetState canonically",
  () => {
    const payload =
      archiveTenantBehavioralPayload(
        validInput,
      );

    assert.deepEqual(
      payload,
      {
        tenantId:
          "tenant-1",

        targetState:
          "archived",
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
  "ArchiveTenant result contract is exact",
  () => {
    const result = {
      commandId:
        "command-1",

      correlationId:
        "correlation-1",

      operation:
        "ArchiveTenant",

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
      validateArchiveTenantResult(
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
          "archived",
      },
    ]) {
      assert.equal(
        validateArchiveTenantResult(
          mutation,
        ).ok,
        false,
      );
    }
  },
);

test(
  "ArchiveTenant audit contract is exact and non-raw",
  () => {
    assert.equal(
      ARCHIVE_TENANT_AUDIT_OPERATION,
      "ArchiveTenant.update",
    );

    assert.equal(
      ARCHIVE_TENANT_AUDIT_LEVEL,
      "critical",
    );

    assert.equal(
      ARCHIVE_TENANT_AUDIT_RESULT,
      "succeeded",
    );

    assert.deepEqual(
      ARCHIVE_TENANT_AUDIT_BEFORE_FIELDS,
      [
        "tenantStatus",
      ],
    );

    assert.deepEqual(
      ARCHIVE_TENANT_AUDIT_AFTER_FIELDS,
      [
        "tenantStatus",
      ],
    );

    assert.deepEqual(
      ARCHIVE_TENANT_AUDIT_METADATA_FIELDS,
      [
        "stage",
      ],
    );

    const allAuditFields = [
      ...ARCHIVE_TENANT_AUDIT_BEFORE_FIELDS,
      ...ARCHIVE_TENANT_AUDIT_AFTER_FIELDS,
      ...ARCHIVE_TENANT_AUDIT_METADATA_FIELDS,
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