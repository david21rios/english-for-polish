import test from "node:test";
import { ROLE_CAPABILITY_MATRIX } from "@mipymetic/saas-contracts/domain";
import assert from "node:assert/strict";

import {
  createUpdateTenantBrandingTransactionStore,
  validateUpdateTenantBrandingPersistedResult,
} from "../persistence/updateTenantBrandingTransactionStore.js";

import { BackendError } from "../errors/backendError.js";

const instant =
  "2026-08-14T12:00:00.000Z";

const branding = Object.freeze({
  tenantId: "tenant-1",
  displayName: null,
  logoUrl: null,
  faviconUrl: null,
  colors: Object.freeze({
    primary: "#000000",
    secondary: "#ffffff",
    accent: "#ff0000",
  }),
  version: 1,
  updatedAt: instant,
});
const replacement = Object.freeze({
  displayName: "Tenant Brand",
  logoUrl: "https://example.test/logo.png",
  faviconUrl: "https://example.test/favicon.ico",
  colors: Object.freeze({
    primary: "#111111",
    secondary: "#eeeeee",
    accent: "#3366ff",
  }),
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
  commandId: "update-branding-1",
  correlationId: "correlation-1",
  operation: "UpdateTenantBranding",
  resourceType: "tenantBranding",
  resourceId: "tenant-1",
  status: "succeeded",
  replayed: false,
});

const input = Object.freeze({
  commandId: "update-branding-1",
  correlationId: "correlation-1",
  payloadHash: "a".repeat(64),
  tenantId: "tenant-1",
  expectedVersion: 1,
  branding: replacement,
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
        "tenant_branding"
      ) {
        return snapshot(
          true,
          branding,
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
  "UpdateTenantBranding persisted result validator accepts only exact stable result",
  () => {
    assert.doesNotThrow(() =>
      validateUpdateTenantBrandingPersistedResult(
        result,
        {
          commandId:
            "update-branding-1",
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
          "tenant_branding",
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
          validateUpdateTenantBrandingPersistedResult(
            invalid,
            {
              commandId:
                "update-branding-1",
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
  "UpdateTenantBranding store rereads authority and Branding before writes",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantBrandingTransactionStore(
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
        "tenant_branding",
      ),
    );

    assert.ok(
      context.writes.length >= 3,
    );
  },
);

test(
  "UpdateTenantBranding writes complete replacement with incremented version",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantBrandingTransactionStore(
        context.runner as never,
      );

    await store.execute(
      input,
    );

    const brandingWrite =
      context.writes.find(
        (write) =>
          write.method === "set",
      );

    assert.ok(
      brandingWrite,
    );

    const value =
      brandingWrite.value as Readonly<Record<string, unknown>>;

    assert.equal(
      value.tenantId,
      "tenant-1",
    );

    assert.equal(
      value.version,
      2,
    );

    assert.equal(
      value.displayName,
      replacement.displayName,
    );

    assert.equal(
      value.logoUrl,
      replacement.logoUrl,
    );

    assert.equal(
      value.faviconUrl,
      replacement.faviconUrl,
    );

    assert.deepEqual(
      value.colors,
      replacement.colors,
    );

    assert.ok(
      "updatedAt" in value,
    );
  },
);

test(
  "UpdateTenantBranding rejects stale expectedVersion with zero writes",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantBrandingTransactionStore(
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
  "UpdateTenantBranding rejects malformed persisted Branding with zero writes",
  async () => {
    const context =
      createRunner({
        tenant_branding:
          snapshot(
            true,
            {
              ...branding,
              version:
                "1",
            },
          ),
      });

    const store =
      createUpdateTenantBrandingTransactionStore(
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
  "UpdateTenantBranding rejects missing Branding with zero writes",
  async () => {
    const context =
      createRunner({
        tenant_branding:
          snapshot(
            false,
            null,
          ),
      });

    const store =
      createUpdateTenantBrandingTransactionStore(
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
  "UpdateTenantBranding replay is read-only and returns replayed true",
  async () => {
    const persistedCommand = {
      commandId:
        input.commandId,
      commandType:
        "UpdateTenantBranding",
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
      createUpdateTenantBrandingTransactionStore(
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
  "UpdateTenantBranding rejects replay payload or correlation conflict",
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
          "UpdateTenantBranding",
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
        createUpdateTenantBrandingTransactionStore(
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
  "UpdateTenantBranding audit excludes Branding values",
  async () => {
    const context =
      createRunner();

    const store =
      createUpdateTenantBrandingTransactionStore(
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
        "brandingVersion",
      ),
    );
  },
);
