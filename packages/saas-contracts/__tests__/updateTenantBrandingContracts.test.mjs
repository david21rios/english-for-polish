import test from "node:test";
import assert from "node:assert/strict";

import {
  ATOMIC_TENANT_COMMAND_TYPES,
  COMMAND_TYPES,
  UPDATE_TENANT_BRANDING_AUDIT_AFTER_FIELDS,
  UPDATE_TENANT_BRANDING_AUDIT_BEFORE_FIELDS,
  UPDATE_TENANT_BRANDING_AUDIT_LEVEL,
  UPDATE_TENANT_BRANDING_AUDIT_METADATA_FIELDS,
  UPDATE_TENANT_BRANDING_AUDIT_OPERATION,
  UPDATE_TENANT_BRANDING_AUDIT_RESULT,
  UPDATE_TENANT_BRANDING_FIELDS,
  UPDATE_TENANT_BRANDING_INPUT_FIELDS,
  UPDATE_TENANT_BRANDING_OPERATION,
  UPDATE_TENANT_BRANDING_RESOURCE_TYPE,
  UPDATE_TENANT_BRANDING_RESULT_FIELDS,
  isPrivilegedCommandStageAllowed,
  updateTenantBrandingBehavioralPayload,
  validateUpdateTenantBrandingInput,
  validateUpdateTenantBrandingResult,
} from "../src/commands/index.js";

import {
  TENANT_BRANDING_FIELDS,
  validateTenantBranding,
} from "../src/persistence/index.js";

const instant = "2026-08-14T12:00:00.000Z";

const branding = Object.freeze({
  displayName: null,
  logoUrl: null,
  faviconUrl: null,
  colors: Object.freeze({
    primary: "#000",
    secondary: "#fff",
    accent: "#f00",
  }),
});

const validInput = Object.freeze({
  commandId: "command-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  expectedVersion: 1,
  branding,
});

test("UpdateTenantBranding command identity is materialized exactly", () => {
  assert.equal(
    COMMAND_TYPES.UPDATE_TENANT_BRANDING,
    "UpdateTenantBranding",
  );

  assert.equal(
    UPDATE_TENANT_BRANDING_OPERATION,
    "UpdateTenantBranding",
  );

  assert.equal(
    UPDATE_TENANT_BRANDING_RESOURCE_TYPE,
    "tenantBranding",
  );

  assert.ok(
    ATOMIC_TENANT_COMMAND_TYPES.includes(
      COMMAND_TYPES.UPDATE_TENANT_BRANDING,
    ),
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.UPDATE_TENANT_BRANDING,
      "completed",
    ),
    true,
  );

  assert.equal(
    isPrivilegedCommandStageAllowed(
      COMMAND_TYPES.UPDATE_TENANT_BRANDING,
      "prepared",
    ),
    false,
  );
});

test("UpdateTenantBranding exact fields are frozen and complete", () => {
  assert.deepEqual(
    UPDATE_TENANT_BRANDING_INPUT_FIELDS,
    [
      "commandId",
      "correlationId",
      "tenantId",
      "expectedVersion",
      "branding",
    ],
  );

  assert.deepEqual(
    UPDATE_TENANT_BRANDING_FIELDS,
    [
      "displayName",
      "logoUrl",
      "faviconUrl",
      "colors",
    ],
  );

  assert.deepEqual(
    UPDATE_TENANT_BRANDING_RESULT_FIELDS,
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

  assert.deepEqual(
    TENANT_BRANDING_FIELDS,
    [
      "tenantId",
      "displayName",
      "logoUrl",
      "faviconUrl",
      "colors",
      "version",
      "updatedAt",
    ],
  );

  assert.equal(
    Object.isFrozen(UPDATE_TENANT_BRANDING_INPUT_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(UPDATE_TENANT_BRANDING_FIELDS),
    true,
  );

  assert.equal(
    Object.isFrozen(UPDATE_TENANT_BRANDING_RESULT_FIELDS),
    true,
  );
});

test("UpdateTenantBranding valid complete replacement input passes", () => {
  assert.equal(
    validateUpdateTenantBrandingInput(validInput).ok,
    true,
  );
});

test("UpdateTenantBranding rejects malformed expectedVersion", () => {
  for (const expectedVersion of [
    0,
    -1,
    1.5,
    Infinity,
    "1",
    null,
  ]) {
    assert.equal(
      validateUpdateTenantBrandingInput({
        ...validInput,
        expectedVersion,
      }).ok,
      false,
      String(expectedVersion),
    );
  }
});

test("UpdateTenantBranding rejects sparse or unknown branding fields", () => {
  const {
    faviconUrl: _faviconUrl,
    ...missingField
  } = branding;

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: missingField,
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        extra: true,
      },
    }).ok,
    false,
  );
});

test("UpdateTenantBranding nullable fields remain nullable", () => {
  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        displayName: "Tenant Brand",
        logoUrl: "logo",
        faviconUrl: "favicon",
      },
    }).ok,
    true,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        displayName: null,
        logoUrl: null,
        faviconUrl: null,
      },
    }).ok,
    true,
  );

  for (const field of [
    "displayName",
    "logoUrl",
    "faviconUrl",
  ]) {
    assert.equal(
      validateUpdateTenantBrandingInput({
        ...validInput,
        branding: {
          ...branding,
          [field]: " padded ",
        },
      }).ok,
      false,
      field,
    );
  }
});

test("UpdateTenantBranding requires complete exact colors replacement", () => {
  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        colors: {
          primary: "#000",
          secondary: "#fff",
          accent: "#f00",
        },
      },
    }).ok,
    true,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        colors: {
          primary: "#000",
          secondary: "#fff",
        },
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        colors: {
          ...branding.colors,
          extra: "#123",
        },
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        colors: {
          ...branding.colors,
          primary: "",
        },
      },
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingInput({
      ...validInput,
      branding: {
        ...branding,
        colors: null,
      },
    }).ok,
    false,
  );
});

test("UpdateTenantBranding rejects forbidden authority and persistence fields", () => {
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
      validateUpdateTenantBrandingInput({
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
      validateUpdateTenantBrandingInput({
        ...validInput,
        branding: {
          ...branding,
          [field]: "forbidden",
        },
      }).ok,
      false,
      field,
    );
  }
});

test("UpdateTenantBranding rejects malformed identifiers", () => {
  for (const field of [
    "commandId",
    "correlationId",
    "tenantId",
  ]) {
    assert.equal(
      validateUpdateTenantBrandingInput({
        ...validInput,
        [field]: "../bad",
      }).ok,
      false,
      field,
    );
  }
});

test("UpdateTenantBranding behavioral payload is exact", () => {
  const payload =
    updateTenantBrandingBehavioralPayload(validInput);

  assert.deepEqual(
    payload,
    {
      tenantId: "tenant-1",
      expectedVersion: 1,
      branding,
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
});

test("versioned Tenant Branding persisted contract is exact", () => {
  const persisted = {
    tenantId: "tenant-1",
    ...branding,
    version: 1,
    updatedAt: instant,
  };

  assert.equal(
    validateTenantBranding(persisted).ok,
    true,
  );

  assert.equal(
    validateTenantBranding({
      ...persisted,
      version: 0,
    }).ok,
    false,
  );

  assert.equal(
    validateTenantBranding({
      ...persisted,
      version: -1,
    }).ok,
    false,
  );

  assert.equal(
    validateTenantBranding({
      ...persisted,
      version: 1.5,
    }).ok,
    false,
  );

  assert.equal(
    validateTenantBranding({
      ...persisted,
      version: "1",
    }).ok,
    false,
  );

  const {
    version: _version,
    ...legacy
  } = persisted;

  assert.equal(
    validateTenantBranding(legacy).ok,
    false,
  );
});

test("UpdateTenantBranding result contract is exact", () => {
  const result = {
    commandId: "command-1",
    correlationId: "correlation-1",
    operation: "UpdateTenantBranding",
    resourceType: "tenantBranding",
    resourceId: "tenant-1",
    status: "succeeded",
    replayed: false,
  };

  assert.equal(
    validateUpdateTenantBrandingResult(result).ok,
    true,
  );

  assert.equal(
    validateUpdateTenantBrandingResult({
      ...result,
      membershipId: "membership-1",
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingResult({
      ...result,
      operation: "Other",
    }).ok,
    false,
  );

  assert.equal(
    validateUpdateTenantBrandingResult({
      ...result,
      resourceType: "tenant",
    }).ok,
    false,
  );
});

test("UpdateTenantBranding audit contract is exact and excludes raw branding values", () => {
  assert.equal(
    UPDATE_TENANT_BRANDING_AUDIT_OPERATION,
    "UpdateTenantBranding.update",
  );

  assert.equal(
    UPDATE_TENANT_BRANDING_AUDIT_LEVEL,
    "privileged",
  );

  assert.equal(
    UPDATE_TENANT_BRANDING_AUDIT_RESULT,
    "succeeded",
  );

  assert.deepEqual(
    UPDATE_TENANT_BRANDING_AUDIT_BEFORE_FIELDS,
    [
      "brandingVersion",
    ],
  );

  assert.deepEqual(
    UPDATE_TENANT_BRANDING_AUDIT_AFTER_FIELDS,
    [
      "brandingVersion",
    ],
  );

  assert.deepEqual(
    UPDATE_TENANT_BRANDING_AUDIT_METADATA_FIELDS,
    [
      "stage",
      "previousVersion",
      "nextVersion",
    ],
  );

  const allAuditFields = [
    ...UPDATE_TENANT_BRANDING_AUDIT_BEFORE_FIELDS,
    ...UPDATE_TENANT_BRANDING_AUDIT_AFTER_FIELDS,
    ...UPDATE_TENANT_BRANDING_AUDIT_METADATA_FIELDS,
  ];

  for (const forbidden of [
    "displayName",
    "logoUrl",
    "faviconUrl",
    "colors",
    "primary",
    "secondary",
    "accent",
    "membershipId",
  ]) {
    assert.equal(
      allAuditFields.includes(forbidden),
      false,
      forbidden,
    );
  }
});