import assert from "node:assert/strict";
import test from "node:test";

import {
  ROLE_CAPABILITY_MATRIX,
} from "@mipymetic/saas-contracts/domain";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  privilegedCommandDocumentPath,
  tenantAuditEventDocumentPath,
  tenantDocumentPath,
} from "@mipymetic/saas-contracts/persistence";

import type {
  AuthorityResolution,
  JsonValue,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import {
  createRestoreTenantTransactionStore,
  type RestoreTenantTransactionInput,
} from "../persistence/restoreTenantTransactionStore.js";

import {
  isServerOwnedTimestamp,
  type DocumentSnapshotPort,
  type TransactionPort,
  type TransactionRunnerPort,
} from "../persistence/ports.js";

const now =
  "2026-08-16T12:00:00.000Z";

const tenantId =
  "tenant-1";

const commandId =
  "restore-tenant-1";

const correlationId =
  "correlation-1";

const actorUid =
  "platform-admin-1";

class Memory
implements
  TransactionRunnerPort,
  TransactionPort {
  readonly docs =
    new Map<
      string,
      Readonly<Record<string, unknown>>
    >();

  readonly creates:
    string[] = [];

  readonly updates:
    string[] = [];

  async run<T>(
    operation:
      (
        transaction:
          TransactionPort,
      ) => Promise<T>,
  ): Promise<T> {
    return operation(this);
  }

  async get(
    path: string,
  ): Promise<DocumentSnapshotPort> {
    const data =
      this.docs.get(path);

    return Object.freeze({
      exists:
        data !== undefined,

      data:
        (data ?? null) as
          Readonly<
            Record<string, JsonValue>
          >
          | null,
    });
  }

  create(
    path: string,
    data:
      Readonly<Record<string, unknown>>,
  ): void {
    if (this.docs.has(path)) {
      throw new Error(
        "exists",
      );
    }

    this.creates.push(
      path,
    );

    this.docs.set(
      path,
      data,
    );
  }

  set(
    path: string,
    data:
      Readonly<Record<string, unknown>>,
  ): void {
    this.docs.set(
      path,
      data,
    );
  }

  update(
    path: string,
    data:
      Readonly<Record<string, unknown>>,
  ): void {
    this.updates.push(
      path,
    );

    this.docs.set(
      path,
      {
        ...(this.docs.get(path) ?? {}),
        ...data,
      },
    );
  }
}

const actor =
  (): AuthorityResolution =>
    Object.freeze({
      actorUid,

      actorType:
        "platform_admin",

      authority:
        "platform_admin",

      tenantId:
        null,

      roles:
        Object.freeze([
          "platform_admin",
        ]),

      capabilities:
        ROLE_CAPABILITY_MATRIX
          .platformRoles
          .platform_admin,
    });

const tenant = (
  overrides:
    Readonly<Record<string, unknown>> = {},
) => ({
  tenantId,

  tenantType:
    "university",

  displayName:
    "Tenant",

  shortName:
    "T",

  country:
    "PL",

  locale:
    "pl-PL",

  timezone:
    "Europe/Warsaw",

  status:
    "suspended",

  createdAt:
    now,

  updatedAt:
    now,

  suspendedAt:
    now,

  archivedAt:
    null,

  ...overrides,
});

const stableResult = () => ({
  commandId,

  correlationId,

  operation:
    "RestoreTenant",

  resourceType:
    "tenant",

  resourceId:
    tenantId,

  status:
    "succeeded",

  replayed:
    false,
});

const input =
  (): RestoreTenantTransactionInput => ({
    commandId,

    correlationId,

    payloadHash:
      "a".repeat(64),

    tenantId,

    actor:
      actor(),

    result:
      stableResult(),
  });

const setup = (): Memory => {
  const memory =
    new Memory();

  memory.docs.set(
    tenantDocumentPath(
      tenantId,
    ),
    tenant(),
  );

  return memory;
};

const rejectsCode = async (
  promise: Promise<unknown>,
  code: string,
): Promise<void> => {
  await assert.rejects(
    promise,
    (
      error: unknown,
    ) =>
      error instanceof BackendError
      && error.code === code,
  );
};

test(
  "RestoreTenant transitions suspended Tenant to active and writes command plus one Tenant audit",
  async () => {
    const memory =
      setup();

    const result =
      await createRestoreTenantTransactionStore(
        memory,
      ).execute(
        input(),
      );

    assert.equal(
      result.replayed,
      false,
    );

    assert.deepEqual(
      memory.updates,
      [
        tenantDocumentPath(
          tenantId,
        ),
      ],
    );

    assert.equal(
      memory.creates.length,
      2,
    );

    const persisted =
      memory.docs.get(
        tenantDocumentPath(
          tenantId,
        ),
      )!;

    assert.equal(
      persisted.status,
      "active",
    );

    assert.equal(
      isServerOwnedTimestamp(
        persisted.updatedAt,
      ),
      true,
    );

    assert.equal(
      persisted.suspendedAt,
      null,
    );

    assert.equal(
      persisted.archivedAt,
      null,
    );

    assert.equal(
      memory.docs.has(
        privilegedCommandDocumentPath(
          commandId,
        ),
      ),
      true,
    );

    assert.equal(
      memory.docs.has(
        tenantAuditEventDocumentPath(
          tenantId,
          `${commandId}-tenant-restore`,
        ),
      ),
      true,
    );
  },
);

test(
  "RestoreTenant audit contains exact approved lifecycle summaries",
  async () => {
    const memory =
      setup();

    await createRestoreTenantTransactionStore(
      memory,
    ).execute(
      input(),
    );

    const audit =
      memory.docs.get(
        tenantAuditEventDocumentPath(
          tenantId,
          `${commandId}-tenant-restore`,
        ),
      )!;

    assert.deepEqual(
      audit.beforeSummary,
      {
        tenantStatus:
          "suspended",
      },
    );

    assert.deepEqual(
      audit.afterSummary,
      {
        tenantStatus:
          "active",
      },
    );

    assert.deepEqual(
      audit.metadata,
      {
        stage:
          "completed",
      },
    );

    const serialized =
      JSON.stringify(
        audit,
      );

    for (const forbidden of [
      "reason",
      "membershipId",
      "courseId",
      "enrollmentId",
      "displayName",
    ]) {
      assert.equal(
        serialized.includes(
          forbidden,
        ),
        false,
        forbidden,
      );
    }
  },
);

test(
  "RestoreTenant rejects archived Tenant before writes",
  async () => {
    const memory =
      setup();

    memory.docs.set(
      tenantDocumentPath(
        tenantId,
      ),
      tenant({
        status:
          "archived",

        archivedAt:
          now,
      }),
    );

    await rejectsCode(
      createRestoreTenantTransactionStore(
        memory,
      ).execute(
        input(),
      ),
      BACKEND_ERROR_CODES
        .FAILED_PRECONDITION,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant rejects already active Tenant before writes",
  async () => {
    const memory =
      setup();

    memory.docs.set(
      tenantDocumentPath(
        tenantId,
      ),
      tenant({
        status:
          "active",

        suspendedAt:
          null,
      }),
    );

    await rejectsCode(
      createRestoreTenantTransactionStore(
        memory,
      ).execute(
        input(),
      ),
      BACKEND_ERROR_CODES
        .FAILED_PRECONDITION,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant rejects missing Tenant before writes",
  async () => {
    const memory =
      setup();

    memory.docs.delete(
      tenantDocumentPath(
        tenantId,
      ),
    );

    await rejectsCode(
      createRestoreTenantTransactionStore(
        memory,
      ).execute(
        input(),
      ),
      BACKEND_ERROR_CODES
        .NOT_FOUND,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant rejects forged non-platform authority before writes",
  async () => {
    const memory =
      setup();

    const forged = {
      ...input(),

      actor: {
        actorUid:
          "tenant-admin-1",

        actorType:
          "identity",

        authority:
          "tenant_admin",

        tenantId,

        roles:
          Object.freeze([
            "tenant_admin",
          ]),

        capabilities:
          Object.freeze([]),
      } as AuthorityResolution,
    };

    await rejectsCode(
      createRestoreTenantTransactionStore(
        memory,
      ).execute(
        forged,
      ),
      BACKEND_ERROR_CODES
        .CONTRACT_VIOLATION,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant persisted replay is read-only and returns replayed true",
  async () => {
    const memory =
      setup();

    const store =
      createRestoreTenantTransactionStore(
        memory,
      );

    await store.execute(
      input(),
    );

    const commandPath =
      privilegedCommandDocumentPath(
        commandId,
      );

    const command =
      memory.docs.get(
        commandPath,
      )!;

    memory.docs.set(
      commandPath,
      {
        ...command,

        startedAt:
          now,

        completedAt:
          now,
      },
    );

    memory.creates.length =
      0;

    memory.updates.length =
      0;

    const replay =
      await store.execute(
        input(),
      );

    assert.equal(
      replay.replayed,
      true,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant rejects replay payload or correlation conflict",
  async () => {
    for (const mutate of [
      (
        value:
          RestoreTenantTransactionInput,
      ) => ({
        ...value,

        payloadHash:
          "b".repeat(64),
      }),

      (
        value:
          RestoreTenantTransactionInput,
      ) => ({
        ...value,

        correlationId:
          "correlation-other",
      }),
    ]) {
      const memory =
        setup();

      const store =
        createRestoreTenantTransactionStore(
          memory,
        );

      await store.execute(
        input(),
      );

      const commandPath =
        privilegedCommandDocumentPath(
          commandId,
        );

      const command =
        memory.docs.get(
          commandPath,
        )!;

      memory.docs.set(
        commandPath,
        {
          ...command,

          startedAt:
            now,

          completedAt:
            now,
        },
      );

      memory.creates.length =
        0;

      memory.updates.length =
        0;

      await rejectsCode(
        store.execute(
          mutate(
            input(),
          ),
        ),
        BACKEND_ERROR_CODES
          .CONFLICT,
      );

      assert.equal(
        memory.creates.length,
        0,
      );

      assert.equal(
        memory.updates.length,
        0,
      );
    }
  },
);

test(
  "RestoreTenant rejects malformed persisted replay result",
  async () => {
    const memory =
      setup();

    const store =
      createRestoreTenantTransactionStore(
        memory,
      );

    await store.execute(
      input(),
    );

    const commandPath =
      privilegedCommandDocumentPath(
        commandId,
      );

    const command =
      memory.docs.get(
        commandPath,
      )!;

    memory.docs.set(
      commandPath,
      {
        ...command,

        startedAt:
          now,

        completedAt:
          now,

        result: {
          ...(
            command.result as
              Readonly<
                Record<string, unknown>
              >
          ),

          replayed:
            true,
        },
      },
    );

    memory.creates.length =
      0;

    memory.updates.length =
      0;

    await rejectsCode(
      store.execute(
        input(),
      ),
      BACKEND_ERROR_CODES
        .CONTRACT_VIOLATION,
    );

    assert.equal(
      memory.creates.length,
      0,
    );

    assert.equal(
      memory.updates.length,
      0,
    );
  },
);

test(
  "RestoreTenant rejects incoherent suspended lifecycle timestamps",
  async () => {
    for (const lifecycle of [
      {
        suspendedAt:
          null,
      },
      {
        archivedAt:
          now,
      },
    ]) {
      const memory =
        setup();

      memory.docs.set(
        tenantDocumentPath(
          tenantId,
        ),
        tenant(
          lifecycle,
        ),
      );

      await rejectsCode(
        createRestoreTenantTransactionStore(
          memory,
        ).execute(
          input(),
        ),
        BACKEND_ERROR_CODES
          .CONTRACT_VIOLATION,
      );

      assert.equal(
        memory.creates.length,
        0,
      );

      assert.equal(
        memory.updates.length,
        0,
      );
    }
  },
);