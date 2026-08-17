import {
  COMMAND_TYPES,
  RESTORE_TENANT_OPERATION,
  RESTORE_TENANT_RESOURCE_TYPE,
  restoreTenantBehavioralPayload,
  validateRestoreTenantInput,
} from "@mipymetic/saas-contracts/commands";

import {
  BACKEND_ERROR_CODES,
} from "@mipymetic/saas-contracts/errors";

import {
  requireAuthenticatedActor,
  type VerifiedAuthenticationContext,
} from "../authorization/authenticatedActor.js";

import {
  resolveRestoreTenantAuthority,
} from "../authorization/restoreTenantAuthority.js";

import type {
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
} from "../persistence/ports.js";

import type {
  RestoreTenantTransactionStore,
} from "../persistence/restoreTenantTransactionStore.js";

export interface RestoreTenantInput {
  readonly commandId: string;
  readonly correlationId: string;
  readonly tenantId: string;
}

export interface RestoreTenantResult {
  readonly commandId: string;
  readonly correlationId: string;
  readonly operation: "RestoreTenant";
  readonly resourceType: "tenant";
  readonly resourceId: string;
  readonly status: "succeeded";
  readonly replayed: boolean;
}

export interface RestoreTenantDependencies {
  readonly authContext:
    VerifiedAuthenticationContext | null;

  readonly reader:
    AuthoritativeReaderPort;

  readonly store:
    RestoreTenantTransactionStore;
}

const invalid = (): never => {
  throw new BackendError(
    BACKEND_ERROR_CODES.INVALID_ARGUMENT,
    "RestoreTenant input is invalid.",
  );
};

export const parseRestoreTenantInput = (
  value: unknown,
): RestoreTenantInput => {
  const validation =
    validateRestoreTenantInput(
      value,
    );

  if (!validation.ok) {
    return invalid();
  }

  return validation.value as RestoreTenantInput;
};

const stableResult = (
  input: RestoreTenantInput,
  replayed: boolean,
): RestoreTenantResult =>
  Object.freeze({
    commandId:
      input.commandId,

    correlationId:
      input.correlationId,

    operation:
      RESTORE_TENANT_OPERATION,

    resourceType:
      RESTORE_TENANT_RESOURCE_TYPE,

    resourceId:
      input.tenantId,

    status:
      "succeeded",

    replayed,
  });

export const executeRestoreTenant = async (
  value: unknown,
  dependencies: RestoreTenantDependencies,
): Promise<RestoreTenantResult> => {
  const input =
    parseRestoreTenantInput(
      value,
    );

  const authenticatedActor =
    requireAuthenticatedActor(
      dependencies.authContext,
    );

  const authority =
    await resolveRestoreTenantAuthority(
      dependencies.reader,
      authenticatedActor,
    );

  const behavioralPayload =
    restoreTenantBehavioralPayload(
      input as unknown as
        Readonly<Record<string, unknown>>,
    ) as Readonly<
      Record<string, JsonValue>
    >;

  const payloadHash =
    canonicalPayloadHash(
      COMMAND_TYPES.RESTORE_TENANT,
      behavioralPayload,
    );

  const persistedResult =
    stableResult(
      input,
      false,
    );

  const outcome =
    await dependencies.store.execute({
      commandId:
        input.commandId,

      correlationId:
        input.correlationId,

      payloadHash,

      tenantId:
        input.tenantId,

      actor:
        authority,

      result:
        persistedResult as unknown as
          Readonly<Record<string, JsonValue>>,
    });

  return stableResult(
    input,
    outcome.replayed,
  );
};