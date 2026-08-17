import assert from "node:assert/strict";
import test from "node:test";

import {
  PLATFORM_AUTHORITY_STATUSES,
} from "@mipymetic/saas-contracts/authority";

import {
  PLATFORM_ROLES,
} from "@mipymetic/saas-contracts/domain";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  identityDocumentPath,
  platformAuthorityDocumentPath,
} from "@mipymetic/saas-contracts/persistence";

import {
  executeRestoreTenant,
  parseRestoreTenantInput,
  type RestoreTenantDependencies,
} from "../commands/restoreTenant.js";

import type {
  AuthorityResolution,
  JsonValue,
} from "../contracts/types.js";

import {
  BackendError,
} from "../errors/backendError.js";

import {
  canonicalPayloadHash,
} from "../idempotency/payloadHash.js";

import type {
  AuthoritativeReaderPort,
  DocumentSnapshotPort,
} from "../persistence/ports.js";

import type {
  RestoreTenantTransactionInput,
  RestoreTenantTransactionStore,
} from "../persistence/restoreTenantTransactionStore.js";

const uid =
  "platform-admin-1";

const tenantId =
  "tenant-1";

class MemoryReader
implements AuthoritativeReaderPort {
  readonly docs =
    new Map<
      string,
      Readonly<Record<string, unknown>>
    >();

  async read(
    path: string,
  ): Promise<DocumentSnapshotPort> {
    const data =
      this.docs.get(
        path,
      );

    return Object.freeze({
      exists:
        data !== undefined,

      data:
        (
          data ?? null
        ) as
          Readonly<
            Record<string, JsonValue>
          >
          | null,
    });
  }
}

class CapturingStore
implements RestoreTenantTransactionStore {
  readonly calls:
    RestoreTenantTransactionInput[] = [];

  replayed =
    false;

  async execute(
    input:
      RestoreTenantTransactionInput,
  ): Promise<
    Readonly<{
      replayed: boolean;
    }>
  > {
    this.calls.push(
      input,
    );

    return Object.freeze({
      replayed:
        this.replayed,
    });
  }
}

const input = () => ({
  commandId:
    "restore-tenant-1",

  correlationId:
    "correlation-1",

  tenantId,
});

const setup = () => {
  const reader =
    new MemoryReader();

  reader.docs.set(
    identityDocumentPath(
      uid,
    ),
    {
      uid,
    },
  );

  reader.docs.set(
    platformAuthorityDocumentPath(
      uid,
    ),
    {
      uid,

      status:
        PLATFORM_AUTHORITY_STATUSES.ACTIVE,

      authority:
        PLATFORM_ROLES.PLATFORM_ADMIN,

      transitionCommandId:
        null,
    },
  );

  const store =
    new CapturingStore();

  const dependencies:
    RestoreTenantDependencies = {
      authContext: {
        uid,

        token: {
          email_verified:
            true,
        },
      },

      reader,

      store,
    };

  return {
    reader,
    store,
    dependencies,
  };
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
  "RestoreTenant parser accepts exact shared input",
  () => {
    assert.deepEqual(
      parseRestoreTenantInput(
        input(),
      ),
      input(),
    );
  },
);

test(
  "RestoreTenant parser rejects malformed, unknown and caller-owned lifecycle fields",
  () => {
    for (const value of [
      {
        ...input(),
        extra:
          true,
      },

      {
        ...input(),
        commandId:
          "../bad",
      },

      {
        ...input(),
        correlationId:
          "../bad",
      },

      {
        ...input(),
        tenantId:
          "../bad",
      },

      {
        ...input(),
        targetState:
          "suspended",
      },

      {
        ...input(),
        status:
          "active",
      },

      {
        ...input(),
        reason:
          "maintenance",
      },
    ]) {
      assert.throws(
        () =>
          parseRestoreTenantInput(
            value,
          ),
        (
          error: unknown,
        ) =>
          error instanceof BackendError
          && error.code ===
            BACKEND_ERROR_CODES
              .INVALID_ARGUMENT,
      );
    }
  },
);

test(
  "RestoreTenant requires authenticated actor",
  async () => {
    const {
      reader,
      store,
    } =
      setup();

    await rejectsCode(
      executeRestoreTenant(
        input(),
        {
          authContext:
            null,

          reader,

          store,
        },
      ),
      BACKEND_ERROR_CODES
        .UNAUTHENTICATED,
    );

    assert.equal(
      store.calls.length,
      0,
    );
  },
);

test(
  "RestoreTenant resolves Platform Admin authority and delegates exact transaction input",
  async () => {
    const {
      store,
      dependencies,
    } =
      setup();

    const result =
      await executeRestoreTenant(
        input(),
        dependencies,
      );

    assert.deepEqual(
      result,
      {
        commandId:
          "restore-tenant-1",

        correlationId:
          "correlation-1",

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
      },
    );

    assert.equal(
      store.calls.length,
      1,
    );

    const call =
      store.calls[0]!;

    assert.equal(
      call.commandId,
      "restore-tenant-1",
    );

    assert.equal(
      call.correlationId,
      "correlation-1",
    );

    assert.equal(
      call.tenantId,
      tenantId,
    );

    const authority =
      call.actor as
        AuthorityResolution;

    assert.equal(
      authority.actorUid,
      uid,
    );

    assert.equal(
      authority.actorType,
      "platform_admin",
    );

    assert.equal(
      authority.authority,
      "platform_admin",
    );

    assert.equal(
      authority.tenantId,
      null,
    );

    assert.deepEqual(
      authority.roles,
      [
        "platform_admin",
      ],
    );

    assert.ok(
      authority.capabilities.includes(
        "platform.tenant_restore",
      ),
    );

    assert.deepEqual(
      call.result,
      {
        commandId:
          "restore-tenant-1",

        correlationId:
          "correlation-1",

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
      },
    );
  },
);

test(
  "RestoreTenant payload hash uses only canonical behavioral Tenant lifecycle payload",
  async () => {
    const {
      store,
      dependencies,
    } =
      setup();

    await executeRestoreTenant(
      input(),
      dependencies,
    );

    const expected =
      canonicalPayloadHash(
        "RestoreTenant",
        {
          tenantId,
          targetState:
            "active",
        },
      );

    assert.equal(
      store.calls[0]!
        .payloadHash,
      expected,
    );
  },
);

test(
  "RestoreTenant commandId and correlationId do not change behavioral hash",
  async () => {
    const first =
      setup();

    const second =
      setup();

    await executeRestoreTenant(
      input(),
      first.dependencies,
    );

    await executeRestoreTenant(
      {
        ...input(),

        commandId:
          "restore-tenant-2",

        correlationId:
          "correlation-2",
      },
      second.dependencies,
    );

    assert.equal(
      first.store.calls[0]!
        .payloadHash,
      second.store.calls[0]!
        .payloadHash,
    );
  },
);

test(
  "RestoreTenant tenantId changes behavioral hash",
  async () => {
    const first =
      setup();

    const second =
      setup();

    await executeRestoreTenant(
      input(),
      first.dependencies,
    );

    await executeRestoreTenant(
      {
        ...input(),

        tenantId:
          "tenant-2",
      },
      second.dependencies,
    );

    assert.notEqual(
      first.store.calls[0]!
        .payloadHash,
      second.store.calls[0]!
        .payloadHash,
    );
  },
);

test(
  "RestoreTenant propagates replay outcome without mutating persisted stable result",
  async () => {
    const {
      store,
      dependencies,
    } =
      setup();

    store.replayed =
      true;

    const result =
      await executeRestoreTenant(
        input(),
        dependencies,
      );

    assert.equal(
      result.replayed,
      true,
    );

    assert.equal(
      store.calls.length,
      1,
    );

    assert.equal(
      (
        store.calls[0]!
          .result as
          Readonly<
            Record<string, unknown>
          >
      ).replayed,
      false,
    );
  },
);

test(
  "RestoreTenant authority failure prevents transaction store execution",
  async () => {
    const {
      reader,
      store,
      dependencies,
    } =
      setup();

    reader.docs.delete(
      platformAuthorityDocumentPath(
        uid,
      ),
    );

    await rejectsCode(
      executeRestoreTenant(
        input(),
        dependencies,
      ),
      BACKEND_ERROR_CODES
        .FORBIDDEN,
    );

    assert.equal(
      store.calls.length,
      0,
    );
  },
);