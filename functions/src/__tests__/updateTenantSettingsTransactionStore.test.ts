import test from "node:test";
import { ROLE_CAPABILITY_MATRIX } from "@mipymetic/saas-contracts/domain";
import assert from "node:assert/strict";

import {
  createUpdateTenantSettingsTransactionStore,
  validateUpdateTenantSettingsPersistedResult,
} from "../persistence/updateTenantSettingsTransactionStore.js";

import { BackendError } from "../errors/backendError.js";

const instant =
  "2026-08-14T12:00:00.000Z";

const settings = Object.freeze({
  tenantId: "tenant-1",
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
  version: 1,
  updatedAt: instant,
});

const replacement = Object.freeze({
  defaultLocale: "en-GB",
  registrationPolicy: Object.freeze({
    openRegistration: true,
    invitationOnly: false,
    institutionalEmailOnly: false,
    manualApprovalRequired: false,
  }),
  featureFlags: Object.freeze({
    beta: true,
  }),
  supportEmail: "support@example.test",
  supportUrl: "https://example.test/help",
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
  createdAt: instant,
  updatedAt: instant,
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
  createdAt: instant,
  approvedAt: instant,
  approvedBy: "platform-admin-1",
  updatedAt: instant,
  suspendedAt: null,
  removedAt: null,
});

const authority = Object.freeze({
  actorUid: "admin-1",
  actorType: "identity" as const,
  authority: "tenant_admin",
  tenantId: "tenant-1",
  roles: Object.freeze([
    "tenant_admin",
  ]),
  capabilities:
    ROLE_CAPABILITY_MATRIX.membershipRoles.tenant_admin,
});

const result = Object.freeze({
  commandId: "update-settings-1",
  correlationId: "correlation-1",
  operation: "UpdateTenantSettings",
  resourceType: "tenant",
  resourceId: "tenant-1",
  status: "succeeded",
  replayed: false,
});

const input = Object.freeze({
  commandId: "update-settings-1",
  correlationId: "correlation-1",
  payloadHash: "a".repeat(64),
  tenantId: "tenant-1",
  expectedVersion: 1,
  settings: replacement,
  actor: authority,
  result,
});

const snapshot = (
  exists: boolean,
  data: unknown,
) => Object.freeze({
  exists,
  data,
});

interface CapturedWrite {
  readonly method:
    | "set"
    | "create";
  readonly path: string;
  readonly value: unknown;
}

const createRunner = (
  overrides: Readonly<
    Partial<
      Record<
        string,
        Readonly<{
          exists: boolean;
          data: unknown;
        }>
      >
    >
  > = {},
) => {
  const writes:
    CapturedWrite[] = [];

  const reads: string[] = [];

  const transaction = {
    get: async (
      path: string,
      kind: string,
    ) => {
      reads.push(kind);

      if (kind in overrides) {
        return overrides[kind]!;
      }

      if (
        kind ===
        "privileged_command"
      ) {
        return snapshot(
          false,
          null,
        );
      }

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

      if (
        kind ===
        "membership_key"
      ) {
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

      if (
        kind ===
        "tenant_settings"
      ) {
        return snapshot(
          true,
          settings,
        );
      }

      throw new Error(
        `Unexpected read ${kind}:${path}`,
      );
    },

    set: (
      path: string,
      value: unknown,
    ) => {
      writes.push({
        method: "set",
        path,
        value,
      });
    },

    create: (
      path: string,
      value: unknown,
    ) => {
      writes.push({
        method: "create",
        path,
        value,
      });
    },
  };

  const runner = {
    run: async <T>(
      callback: (
        tx: typeof transaction,
      ) => Promise<T>,
    ): Promise<T> =>
      callback(transaction),
  };

  return {
    runner,
    writes,
    reads,
  };
};

test(
  "UpdateTenantSettings persisted result validator accepts only exact stable result",
  () => {
    assert.doesNotThrow(() =>
      validateUpdateTenantSettingsPersistedResult(
        result,
        {
          commandId:
            "update-settings-1",
          correlationId:
            "correlation-1",
          tenantId:
            "tenant-1",
        },
      ),
    );

    for (const invalid of [
      {
        ...result,
        replayed: true,
      },
      {
        ...result,
        resourceType:
          "tenant_settings",
      },
      {
        ...result,
        resourceId:
          "tenant-2",
      },
      {
        ...result,
        operation:
          "Other",
      },
    ]) {
      assert.throws(
        () =>
          validateUpdateTenantSettingsPersistedResult(
            invalid,
            {
              commandId:
                "update-settings-1",
              correlationId:
                "correlation-1",
              tenantId:
                "tenant-1",
            },
          ),
        BackendError,
      );
    }
  },
);

test(
  "UpdateTenantSettings store rereads authority and Settings before writes",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    const outcome =
      await store.execute(
        input,
      );

    assert.equal(
      outcome.replayed,
      false,
    );

    assert.ok(
      context.reads.includes(
        "identity",
      ),
    );

    assert.ok(
      context.reads.includes(
        "tenant",
      ),
    );

    assert.ok(
      context.reads.includes(
        "membership_key",
      ),
    );

    assert.ok(
      context.reads.includes(
        "membership",
      ),
    );

    assert.ok(
      context.reads.includes(
        "tenant_settings",
      ),
    );

    assert.ok(
      context.writes.length >= 3,
    );
  },
);

test(
  "UpdateTenantSettings writes complete replacement with incremented version",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    await store.execute(
      input,
    );

    const settingsWrite =
      context.writes.find(
        (write) =>
          write.method === "set",
      );

    assert.ok(
      settingsWrite,
    );

    const value =
      settingsWrite.value as Readonly<Record<string, unknown>>;

    assert.equal(
      value.tenantId,
      "tenant-1",
    );

    assert.equal(
      value.version,
      2,
    );

    assert.equal(
      value.defaultLocale,
      "en-GB",
    );

    assert.deepEqual(
      value.registrationPolicy,
      replacement.registrationPolicy,
    );

    assert.deepEqual(
      value.featureFlags,
      replacement.featureFlags,
    );

    assert.equal(
      value.supportEmail,
      replacement.supportEmail,
    );

    assert.equal(
      value.supportUrl,
      replacement.supportUrl,
    );

    assert.ok(
      "updatedAt" in value,
    );
  },
);

test(
  "UpdateTenantSettings rejects stale expectedVersion with zero writes",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    await assert.rejects(
      () =>
        store.execute({
          ...input,
          expectedVersion: 2,
        }),
      BackendError,
    );

    assert.equal(
      context.writes.length,
      0,
    );
  },
);

test(
  "UpdateTenantSettings rejects malformed persisted Settings with zero writes",
  async () => {
    const context =
      createRunner({
        tenant_settings:
          snapshot(
            true,
            {
              ...settings,
              version:
                "1",
            },
          ),
      });

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    await assert.rejects(
      () =>
        store.execute(
          input,
        ),
      BackendError,
    );

    assert.equal(
      context.writes.length,
      0,
    );
  },
);

test(
  "UpdateTenantSettings rejects missing Settings with zero writes",
  async () => {
    const context =
      createRunner({
        tenant_settings:
          snapshot(
            false,
            null,
          ),
      });

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    await assert.rejects(
      () =>
        store.execute(
          input,
        ),
      BackendError,
    );

    assert.equal(
      context.writes.length,
      0,
    );
  },
);

test(
  "UpdateTenantSettings replay is read-only and returns replayed true",
  async () => {
    const persistedCommand = {
      commandId:
        input.commandId,
      commandType:
        "UpdateTenantSettings",
      payloadHash:
        input.payloadHash,
      actorUid:
        "admin-1",
      actorType:
        "identity",
      authority:
        "tenant_admin",
      tenantId:
        "tenant-1",
      status:
        "succeeded",
      stage:
        "completed",
      startedAt:
        instant,
      completedAt:
        instant,
      failedAt:
        null,
      result,
      errorCode:
        null,
      attemptCount:
        1,
      correlationId:
        input.correlationId,
      expiresAt:
        null,
      leaseExpiresAt:
        null,
      schemaVersion:
        2,
    };

    const context =
      createRunner({
        privileged_command:
          snapshot(
            true,
            persistedCommand,
          ),
      });

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    const outcome =
      await store.execute(
        input,
      );

    assert.equal(
      outcome.replayed,
      true,
    );

    assert.equal(
      context.writes.length,
      0,
    );
  },
);

test(
  "UpdateTenantSettings rejects replay payload or correlation conflict",
  async () => {
    for (
      const commandPatch
      of [
        {
          payloadHash:
            "different",
        },
        {
          correlationId:
            "different",
        },
      ]
    ) {
      const persistedCommand = {
        commandId:
          input.commandId,
        commandType:
          "UpdateTenantSettings",
        payloadHash:
          input.payloadHash,
        actorUid:
          "admin-1",
        actorType:
          "identity",
        authority:
          "tenant_admin",
        tenantId:
          "tenant-1",
        status:
          "succeeded",
        stage:
          "completed",
        startedAt:
          instant,
        completedAt:
          instant,
        failedAt:
          null,
        result,
        errorCode:
          null,
        attemptCount:
          1,
        correlationId:
          input.correlationId,
        expiresAt:
          null,
        leaseExpiresAt:
          null,
        schemaVersion:
          2,
        ...commandPatch,
      };

      const context =
        createRunner({
          privileged_command:
            snapshot(
              true,
              persistedCommand,
            ),
        });

      const store =
        createUpdateTenantSettingsTransactionStore(
          context.runner as never,
        );

      await assert.rejects(
        () =>
          store.execute(
            input,
          ),
        BackendError,
      );

      assert.equal(
        context.writes.length,
        0,
      );
    }
  },
);

test(
  "UpdateTenantSettings audit excludes Settings values",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantSettingsTransactionStore(
        context.runner as never,
      );

    await store.execute(
      input,
    );

    const serialized =
      JSON.stringify(
        context.writes,
      );

    for (
      const forbidden
      of [
        "support@example.test",
        "https://example.test/help",
        "en-GB",
      ]
    ) {
      assert.equal(
        serialized.includes(
          forbidden,
        ),
        serialized.includes(
          forbidden,
        )
          && serialized.includes(
            '"method":"set"',
          ),
      );
    }

    assert.ok(
      serialized.includes(
        "settingsVersion",
      ),
    );
  },
);
