import test from "node:test";
import assert from "node:assert/strict";

import {
  ATOMIC_TENANT_COMMAND_TYPES,
  COMMAND_TYPES,
  UPDATE_TENANT_SETTINGS_AUDIT_AFTER_FIELDS,
  UPDATE_TENANT_SETTINGS_AUDIT_BEFORE_FIELDS,
  UPDATE_TENANT_SETTINGS_AUDIT_LEVEL,
  UPDATE_TENANT_SETTINGS_AUDIT_METADATA_FIELDS,
  UPDATE_TENANT_SETTINGS_AUDIT_OPERATION,
  UPDATE_TENANT_SETTINGS_AUDIT_RESULT,
  UPDATE_TENANT_SETTINGS_FIELDS,
  UPDATE_TENANT_SETTINGS_INPUT_FIELDS,
  UPDATE_TENANT_SETTINGS_OPERATION,
  UPDATE_TENANT_SETTINGS_RESOURCE_TYPE,
  UPDATE_TENANT_SETTINGS_RESULT_FIELDS,
  isPrivilegedCommandStageAllowed,
  updateTenantSettingsBehavioralPayload,
  validateUpdateTenantSettingsInput,
  validateUpdateTenantSettingsResult,
} from "../src/commands/index.js";

import {
  TENANT_SETTINGS_FIELDS,
  validateTenantSettings,
} from "../src/persistence/index.js";

const instant = "2026-08-14T12:00:00.000Z";

const settings = Object.freeze({
  defaultLocale: "pl-PL",
  registrationPolicy: Object.freeze({
    openRegistration: false,
    invitationOnly: false,
    institutionalEmailOnly: false,
    manualApprovalRequired: true,
  }),
  featureFlags: Object.freeze({
    beta: false,
  }),
  supportEmail: null,
  supportUrl: "https://example.test/help",
});

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  expectedVersion: 1,
  settings,
});

test("UpdateTenantSettings command identity is materialized exactly", () => {
  assert.equal(COMMAND_TYPES.UPDATE_TENANT_SETTINGS, "UpdateTenantSettings");
  assert.equal(UPDATE_TENANT_SETTINGS_OPERATION, "UpdateTenantSettings");
  assert.equal(UPDATE_TENANT_SETTINGS_RESOURCE_TYPE, "tenant");
  assert.ok(
    ATOMIC_TENANT_COMMAND_TYPES.includes(COMMAND_TYPES.UPDATE_TENANT_SETTINGS),
  );
  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.UPDATE_TENANT_SETTINGS,
      "completed",
    ),
    true,
  );
  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.UPDATE_TENANT_SETTINGS,
      "prepared",
    ),
    false,
  );
});

test("UpdateTenantSettings exact fields are frozen and complete", () => {
  assert.deepEqual(UPDATE_TENANT_SETTINGS_INPUT_FIELDS, [
    "commandId",
    "correlationId",
    "tenantId",
    "expectedVersion",
    "settings",
  ]);

  assert.deepEqual(UPDATE_TENANT_SETTINGS_FIELDS, [
    "defaultLocale",
    "registrationPolicy",
    "featureFlags",
    "supportEmail",
    "supportUrl",
  ]);

  assert.deepEqual(UPDATE_TENANT_SETTINGS_RESULT_FIELDS, [
    "commandId",
    "correlationId",
    "operation",
    "resourceType",
    "resourceId",
    "status",
    "replayed",
  ]);

  assert.deepEqual(TENANT_SETTINGS_FIELDS, [
    "tenantId",
    "defaultLocale",
    "registrationPolicy",
    "featureFlags",
    "supportEmail",
    "supportUrl",
    "version",
    "updatedAt",
  ]);
});

test("UpdateTenantSettings valid complete replacement input passes", () => {
  assert.equal(validateUpdateTenantSettingsInput(validInput).ok, true);
});

test("UpdateTenantSettings rejects malformed expectedVersion", () => {
  for (const expectedVersion of [
    0,
    -1,
    1.5,
    Infinity,
    "1",
    null,
  ]) {
    assert.equal(
      validateUpdateTenantSettingsInput({
        ...validInput,
        expectedVersion,
      }).ok,
      false,
      String(expectedVersion),
    );
  }
});

test("UpdateTenantSettings rejects sparse or unknown settings fields", () => {
  const { supportUrl: _supportUrl, ...missingField } = settings;

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: missingField,
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        extra: true,
      },
    }).ok,
    false,
  );
});

test("UpdateTenantSettings requires complete registrationPolicy replacement", () => {
  const {
    manualApprovalRequired: _manualApprovalRequired,
    ...partialPolicy
  } = settings.registrationPolicy;

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        registrationPolicy: partialPolicy,
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        registrationPolicy: {
          ...settings.registrationPolicy,
          extra: false,
        },
      },
    }).ok,
    false,
  );
});

test("UpdateTenantSettings featureFlags are a complete boolean map", () => {
  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        featureFlags: {},
      },
    }).ok,
    true,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        featureFlags: {
          beta: "false",
        },
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        featureFlags: null,
      },
    }).ok,
    false,
  );
});

test("UpdateTenantSettings support values follow exact replacement contract", () => {
  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        supportEmail: "support@example.test",
        supportUrl: null,
      },
    }).ok,
    true,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        supportEmail: " padded ",
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantSettingsInput({
      ...validInput,
      settings: {
        ...settings,
        supportUrl: "http://example.test",
      },
    }).ok,
    false,
  );
});

test("UpdateTenantSettings rejects forbidden authority and persistence fields", () => {
  for (const field of [
    "membershipId",
    "actorUid",
    "authority",
    "role",
    "capability",
    "version",
    "updatedAt",
  ]) {
    assert.equal(
      validateUpdateTenantSettingsInput({
        ...validInput,
        [field]: "forbidden",
      }).ok,
      false,
      field,
    );
  }

  for (const field of [
    "tenantId",
    "version",
    "updatedAt",
  ]) {
    assert.equal(
      validateUpdateTenantSettingsInput({
        ...validInput,
        settings: {
          ...settings,
          [field]: "forbidden",
        },
      }).ok,
      false,
      field,
    );
  }
});

test("UpdateTenantSettings rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
  ]) {
    assert.equal(
      validateUpdateTenantSettingsInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("UpdateTenantSettings behavioral payload includes expectedVersion and excludes envelope fields", () => {
  const payload = updateTenantSettingsBehavioralPayload(validInput);

  assert.deepEqual(payload, {
    tenantId: "tenant-1",
    expectedVersion: 1,
    settings,
  });

  assert.equal(Object.hasOwn(payload, "commandId"), false);
  assert.equal(Object.hasOwn(payload, "correlationId"), false);
});

test("versioned Tenant Settings persisted contract is exact", () => {
  const persisted = {
    tenantId: "tenant-1",
    ...settings,
    version: 1,
    updatedAt: instant,
  };

  assert.equal(validateTenantSettings(persisted).ok, true);

  assert.equal(
    validateTenantSettings({
      ...persisted,
      version: 0,
    }).ok,
    false,
  );

  const { version: _version, ...legacy } = persisted;
  assert.equal(validateTenantSettings(legacy).ok, false);

  assert.equal(
    validateTenantSettings({
      ...persisted,
      version: 1.5,
    }).ok,
    false,
  );
});

test("UpdateTenantSettings result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "UpdateTenantSettings",
    resourceType: "tenant",
    resourceId: "tenant-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(validateUpdateTenantSettingsResult(result).ok, true);
  assert.equal(
    validateUpdateTenantSettingsResult({
      ...result,
      membershipId: "membership-1",
    }).ok,
    false,
  );
  assert.equal(
    validateUpdateTenantSettingsResult({
      ...result,
      operation: "Other",
    }).ok,
    false,
  );
});

test("UpdateTenantSettings audit contract is exact and non-PII", () => {
  assert.equal(
    UPDATE_TENANT_SETTINGS_AUDIT_OPERATION,
    "UpdateTenantSettings.update",
  );
  assert.equal(UPDATE_TENANT_SETTINGS_AUDIT_LEVEL, "privileged");
  assert.equal(UPDATE_TENANT_SETTINGS_AUDIT_RESULT, "succeeded");

  assert.deepEqual(
    UPDATE_TENANT_SETTINGS_AUDIT_BEFORE_FIELDS,
    ["tenantStatus", "settingsVersion"],
  );

  assert.deepEqual(
    UPDATE_TENANT_SETTINGS_AUDIT_AFTER_FIELDS,
    ["tenantStatus", "settingsVersion"],
  );

  assert.deepEqual(
    UPDATE_TENANT_SETTINGS_AUDIT_METADATA_FIELDS,
    ["stage"],
  );

  const allAuditFields = [
    ...UPDATE_TENANT_SETTINGS_AUDIT_BEFORE_FIELDS,
    ...UPDATE_TENANT_SETTINGS_AUDIT_AFTER_FIELDS,
    ...UPDATE_TENANT_SETTINGS_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "supportEmail",
    "supportUrl",
    "registrationPolicy",
    "featureFlags",
    "membershipId",
  ]) {
    assert.equal(allAuditFields.includes(forbidden), false, forbidden);
  }
});