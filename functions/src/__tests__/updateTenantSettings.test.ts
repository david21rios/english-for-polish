import type { JsonValue } from "../contracts/types.js";
import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMAND_TYPES,
} from "@mipymetic/saas-contracts/commands";

import {
  executeUpdateTenantSettings,
  parseUpdateTenantSettingsInput,
  type UpdateTenantSettingsTransactionInput,
} from "../commands/updateTenantSettings.js";

import { BackendError } from "../errors/backendError.js";

const canonicalSettings = Object.freeze({
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
  supportUrl: null,
});

const canonicalInput = Object.freeze({
  commandId: "update-settings-1",
  correlationId: "correlation-1",
  tenantId: "tenant-1",
  expectedVersion: 1,
  settings: canonicalSettings,
});

const authContext = Object.freeze({
  uid: "admin-1",
  token: Object.freeze({}),
});

const snapshot = (
  exists: boolean,
  data: Readonly<Record<string, JsonValue>> | null,
) => Object.freeze({
  exists,
  data,
});

const identity = Object.freeze({
  uid: "admin-1",
});

const tenant = Object.freeze({
  tenantId: "tenant-1",
  tenantType: "university",
  displayName: "Tenant",
  shortName: "T",
  country: "PL",
  locale: "pl-PL",
  timezone: "Europe/Warsaw",
  status: "active",
  createdAt: "2026-08-14T12:00:00.000Z",
  updatedAt: "2026-08-14T12:00:00.000Z",
  suspendedAt: null,
  archivedAt: null,
});

const membershipKey = Object.freeze({
  tenantId: "tenant-1",
  uid: "admin-1",
  membershipId: "membership-1",
  status: "approved",
  originRequestId: null,
  updatedAt: "2026-08-14T12:00:00.000Z",
});

const membership = Object.freeze({
  membershipId: "membership-1",
  tenantId: "tenant-1",
  uid: "admin-1",
  role: "tenant_admin",
  status: "approved",
  originRequestId: null,
  createdAt: "2026-08-14T12:00:00.000Z",
  approvedAt: "2026-08-14T12:00:00.000Z",
  approvedBy: "platform-admin-1",
  updatedAt: "2026-08-14T12:00:00.000Z",
  suspendedAt: null,
  removedAt: null,
});

const createAuthorityReader = () => ({
  read: async (
    path: string,
    kind?: string,
  ) => {
    if (kind === "identity") {
      return snapshot(
        true,
        identity,
      );
    }

    if (kind === "tenant") {
      return snapshot(
        true,
        tenant,
      );
    }

    if (kind === "membership_key") {
      return snapshot(
        true,
        membershipKey,
      );
    }

    if (kind === "membership") {
      return snapshot(
        true,
        membership,
      );
    }

    throw new Error(
      `Unexpected read ${kind}:${path}`,
    );
  },
});

test(
  "UpdateTenantSettings parser accepts exact shared input",
  () => {
    const parsed =
      parseUpdateTenantSettingsInput(
        canonicalInput,
      );

    assert.equal(
      parsed.commandId,
      "update-settings-1",
    );

    assert.equal(
      parsed.expectedVersion,
      1,
    );

    assert.deepEqual(
      parsed.settings,
      canonicalSettings,
    );
  },
);

test(
  "UpdateTenantSettings parser rejects malformed or forbidden input",
  () => {
    for (const invalid of [
      {
        ...canonicalInput,
        expectedVersion: 0,
      },
      {
        ...canonicalInput,
        expectedVersion: "1",
      },
      {
        ...canonicalInput,
        extra: true,
      },
      {
        ...canonicalInput,
        settings: {
          ...canonicalSettings,
          version: 1,
        },
      },
    ]) {
      assert.throws(
        () =>
          parseUpdateTenantSettingsInput(
            invalid,
          ),
        BackendError,
      );
    }
  },
);

test(
  "UpdateTenantSettings requires authenticated actor",
  async () => {
    let storeCalled = false;

    await assert.rejects(
      () =>
        executeUpdateTenantSettings(
          canonicalInput,
          {
            authContext: null,
            reader:
              createAuthorityReader(),
            store: {
              execute: async () => {
                storeCalled = true;
                return Object.freeze({
                  replayed: false,
                });
              },
            },
          },
        ),
      BackendError,
    );

    assert.equal(
      storeCalled,
      false,
    );
  },
);

test(
  "UpdateTenantSettings resolves tenant_admin authority and delegates exact transaction input",
  async () => {
    let captured:
      UpdateTenantSettingsTransactionInput
      | null = null;

    const result =
      await executeUpdateTenantSettings(
        canonicalInput,
        {
          authContext,
          reader:
            createAuthorityReader(),
          store: {
            execute: async (input) => {
              captured = input;

              return Object.freeze({
                replayed: false,
              });
            },
          },
        },
      );

    assert.ok(captured);

    const capturedInput =
      captured as unknown as UpdateTenantSettingsTransactionInput;

    assert.equal(
      capturedInput.commandId,
      canonicalInput.commandId,
    );

    assert.equal(
      capturedInput.correlationId,
      canonicalInput.correlationId,
    );

    assert.equal(
      capturedInput.tenantId,
      canonicalInput.tenantId,
    );

    assert.equal(
      capturedInput.expectedVersion,
      1,
    );

    assert.deepEqual(
      capturedInput.settings,
      canonicalSettings,
    );

    assert.equal(
      capturedInput.actor.authority,
      "tenant_admin",
    );

    assert.equal(
      capturedInput.actor.actorUid,
      "admin-1",
    );

    assert.equal(
      capturedInput.actor.tenantId,
      "tenant-1",
    );

    assert.equal(
      result.operation,
      COMMAND_TYPES.UPDATE_TENANT_SETTINGS,
    );

    assert.equal(
      result.resourceType,
      "tenant",
    );

    assert.equal(
      result.resourceId,
      "tenant-1",
    );

    assert.equal(
      result.status,
      "succeeded",
    );

    assert.equal(
      result.replayed,
      false,
    );
  },
);

test(
  "UpdateTenantSettings behavioral hash includes expectedVersion and settings but excludes envelope identifiers",
  async () => {
    const hashes: string[] = [];

    const run = async (
      value: Readonly<Record<string, unknown>>,
    ) => {
      await executeUpdateTenantSettings(
        value,
        {
          authContext,
          reader:
            createAuthorityReader(),
          store: {
            execute: async (input) => {
              hashes.push(
                input.payloadHash,
              );

              return Object.freeze({
                replayed: false,
              });
            },
          },
        },
      );
    };

    await run(
      canonicalInput,
    );

    await run({
      ...canonicalInput,
      commandId:
        "update-settings-2",
      correlationId:
        "correlation-2",
    });

    assert.equal(
      hashes[0],
      hashes[1],
    );

    hashes.length = 0;

    await run(
      canonicalInput,
    );

    await run({
      ...canonicalInput,
      expectedVersion: 2,
    });

    assert.notEqual(
      hashes[0],
      hashes[1],
    );

    hashes.length = 0;

    await run(
      canonicalInput,
    );

    await run({
      ...canonicalInput,
      settings: {
        ...canonicalSettings,
        featureFlags: {
          beta: true,
        },
      },
    });

    assert.notEqual(
      hashes[0],
      hashes[1],
    );
  },
);

test(
  "UpdateTenantSettings propagates replay result without changing stable contract",
  async () => {
    const result =
      await executeUpdateTenantSettings(
        canonicalInput,
        {
          authContext,
          reader:
            createAuthorityReader(),
          store: {
            execute: async () =>
              Object.freeze({
                replayed: true,
              }),
          },
        },
      );

    assert.deepEqual(
      result,
      {
        commandId:
          "update-settings-1",
        correlationId:
          "correlation-1",
        operation:
          "UpdateTenantSettings",
        resourceType:
          "tenant",
        resourceId:
          "tenant-1",
        status:
          "succeeded",
        replayed:
          true,
      },
    );
  },
);
